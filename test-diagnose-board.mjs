// Diagnose Board — owner request 2026-09-15: every failed command must be
// tracked, retried, escalated to Telegram when stuck, resumed automatically
// (bounded — PROJECT_RULES §8-A rule 72-م forbids an infinite loop) if nobody
// answers, and re-tried the moment the owner replies. This proves each of
// those transitions with a real (temp-dir) failing/succeeding command, not a
// description of the intent.
//
//   node test-diagnose-board.mjs
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const workDir = mkdtempSync(join(tmpdir(), "diagnose-test-"));
process.env.DIAGNOSE_BOARD_PATH = join(workDir, ".diagnose-board.json");
// no TELEGRAM_BOT_TOKEN/CHAT_ID needed — fetch is stubbed below, but keep
// telegramConfig().enabled true so escalate()/say() actually call it
process.env.TELEGRAM_BOT_TOKEN = "test-token";
process.env.TELEGRAM_CHAT_ID = "test-chat";

const realFetch = globalThis.fetch;
const sentMessages = [];
globalThis.fetch = async (url, init) => {
  if (String(url).includes("/sendMessage")) {
    sentMessages.push(JSON.parse(init.body).text);
    return { ok: true, json: async () => ({ ok: true, result: {} }) };
  }
  return realFetch(url, init);
};

const diagnose = await import("./lib/diagnose.mjs");
const { runTracked, reportFailure, sweep, recordOwnerReply, listOpenCases, matchKnownIssue, _internal } = diagnose;

const readBoard = () => JSON.parse(readFileSync(_internal.BOARD_PATH, "utf8"));
const caseById = (id) => readBoard().cases.find((c) => c.id === id);

function nodeCmd(js) { return `node -e "${js.replace(/"/g, '\\"')}"`; }

// A command whose behaviour is controlled by a file the test can flip
// between "ok" and "fail" — lets tests simulate "the owner fixed it" without
// touching real project state (git, ffmpeg, network).
function toggleCommand(dir, name, initial) {
  const ctrl = join(dir, `${name}.ctrl`);
  writeFileSync(ctrl, initial);
  const cmd = nodeCmd(
    `const fs=require('fs');const c=fs.readFileSync(${JSON.stringify(ctrl)},'utf8').trim();` +
    `if(c==='fail'){console.error('boom: still broken');process.exit(1)}process.exit(0)`,
  );
  return { cmd, setOk: () => writeFileSync(ctrl, "ok"), setFail: () => writeFileSync(ctrl, "fail") };
}

// --- matchKnownIssue: pure classification, no side effects -----------------
{
  assert.equal(matchKnownIssue("error: failed to push some refs").id, "git-push-rejected");
  assert.equal(matchKnownIssue("Telegram sendMessage failed (409): Conflict: terminated by other getUpdates").id, "telegram-409");
  assert.equal(matchKnownIssue("Error: HF_TOKEN required for gated repo").id, "hf-token");
  assert.equal(matchKnownIssue("fetch failed: ECONNRESET").id, "network-transient");
  assert.equal(matchKnownIssue("'ffmpeg' is not recognized as an internal or external command").id, "ffmpeg-missing");
  assert.equal(matchKnownIssue("some totally unrelated error"), null);
  console.log("ok   matchKnownIssue classifies every known signature and returns null for an unrelated error");
}

// --- runTracked: succeeds first try -> resolved, no Telegram noise ---------
{
  const r = await runTracked({ source: "test:ok", command: nodeCmd("process.exit(0)"), cwd: workDir });
  assert.equal(r.ok, true);
  assert.equal(caseById(r.caseId).status, "resolved");
  assert.equal(sentMessages.length, 0, "a command that just works must never page anyone");
  console.log("ok   a command that succeeds on the first try is resolved silently");
}

// --- runTracked: fails, then succeeds within the local-retry budget -------
{
  const { cmd } = toggleCommand(workDir, "flaky", "fail");
  const ctrlPath = join(workDir, "flaky.ctrl");
  // flips to "ok" after the retry backoff has had time to run once
  setTimeout(() => writeFileSync(ctrlPath, "ok"), 2000);
  const r = await runTracked({ source: "test:flaky", command: cmd, cwd: workDir });
  assert.equal(r.ok, true);
  assert.equal(caseById(r.caseId).status, "resolved");
  assert.equal(sentMessages.length, 0, "resolved within the local budget must not escalate");
  console.log("ok   a transient failure that clears within local retries never reaches Telegram");
}

// --- runTracked: exhausts local attempts -> escalates with a #D tag -------
let stuckCaseId;
{
  const before = sentMessages.length;
  const r = await runTracked({ source: "test:always-fails", command: nodeCmd("console.error('boom: unknown');process.exit(1)"), cwd: workDir });
  assert.equal(r.ok, false);
  stuckCaseId = r.caseId;
  assert.equal(caseById(stuckCaseId).status, "escalated");
  assert.ok(caseById(stuckCaseId).escalatedAt);
  const msg = sentMessages[sentMessages.length - 1];
  assert.ok(msg.includes(`#D${stuckCaseId}`), "escalation must be tagged with the case id");
  assert.ok(msg.includes("نیاز به کمک"), "must clearly ask for help");
  assert.equal(sentMessages.length, before + 1, "exactly one escalation message, not one per retry");
  console.log("ok   exhausting local retries on an unrecognised error escalates once, tagged #D<id>");
}

// --- recordOwnerReply: command still fails -> stays open for the next reply
{
  const before = sentMessages.length;
  const res = await recordOwnerReply("همون دستور رو دوباره بزن");
  assert.equal(res.caseId, stuckCaseId);
  assert.equal(res.ok, false);
  const c = caseById(stuckCaseId);
  assert.equal(c.status, "escalated");
  assert.equal(c.ownerReply, null, "still broken after the reply -> must stay open for a FOLLOW-UP reply, not lock the owner out");
  assert.ok(c.history.some((h) => h.note.includes("پاسخ شما دریافت شد")));
  assert.ok(sentMessages.length > before, "must report back, not fail silently");
  console.log("ok   an owner reply that doesn't fix it re-escalates instead of going silent");

  // recordOwnerReply() always answers the OLDEST open escalated case — a
  // reasonable stand-in for "the owner is replying about whatever is
  // currently broken" in this single-operator bot. Close this one out of
  // band (it never actually gets fixed in this test) so the scenarios below
  // each have exactly one open case to be unambiguous about.
  const board = _internal.loadBoard();
  board.cases.find((x) => x.id === stuckCaseId).status = "resolved";
  _internal.saveBoard(board);
}

// --- recordOwnerReply: reply coincides with the real fix -> resolved ------
{
  const { cmd, setOk } = toggleCommand(workDir, "fixable", "fail");
  const r0 = await runTracked({ source: "test:fixable", command: cmd, cwd: workDir });
  assert.equal(caseById(r0.caseId).status, "escalated");

  setOk(); // the owner actually fixed the underlying problem
  const res = await recordOwnerReply("درستش کردم، دوباره امتحان کن");
  assert.equal(res.caseId, r0.caseId);
  assert.equal(res.ok, true);
  assert.equal(caseById(r0.caseId).status, "resolved");
  console.log("ok   an owner reply that coincides with the real fix resolves the case");
}

// --- sweep(): silence past RESUME_AFTER_MS resumes automatically, bounded -
{
  const { cmd, setOk } = toggleCommand(workDir, "resumable", "fail");
  const r0 = await runTracked({ source: "test:resumable", command: cmd, cwd: workDir });
  const oldEscalatedAt = new Date(Date.now() - _internal.RESUME_AFTER_MS - 1000).toISOString();
  const board = _internal.loadBoard();
  board.cases.find((c) => c.id === r0.caseId).escalatedAt = oldEscalatedAt;
  _internal.saveBoard(board);

  setOk(); // fixed itself (or the underlying transient condition cleared) before anyone replied
  await sweep();
  const c = caseById(r0.caseId);
  assert.equal(c.status, "resolved", "silence past the window must trigger an automatic resume, not wait forever");
  assert.equal(c.resumeCycles, 1);
  assert.ok(sentMessages.some((m) => m.includes(`#D${r0.caseId}`) && m.includes("خودکار حل شد")));
  console.log("ok   sweep() resumes automatically after the silence window and reports the fix");
}

// --- sweep(): a case that never recovers stops after MAX_AUTO_RESUME_CYCLES,
// never loops forever (PROJECT_RULES §8-A rule 72-م) --------------------
let neverRecoversCaseId;
{
  const r0 = await runTracked({ source: "test:never-recovers", command: nodeCmd("console.error('boom: unknown');process.exit(1)"), cwd: workDir });
  neverRecoversCaseId = r0.caseId;
  const oldEscalatedAt = new Date(Date.now() - _internal.RESUME_AFTER_MS - 1000).toISOString();
  const board = _internal.loadBoard();
  board.cases.find((c) => c.id === r0.caseId).escalatedAt = oldEscalatedAt;
  board.cases.find((c) => c.id === r0.caseId).resumeCycles = _internal.MAX_AUTO_RESUME_CYCLES;
  _internal.saveBoard(board);

  await sweep();
  const c = caseById(r0.caseId);
  assert.equal(c.status, "stuck", "a case that already spent every auto-resume cycle must stop, not keep retrying");
  assert.ok(sentMessages.some((m) => m.includes(`#D${r0.caseId}`) && m.includes("تلاش خودکار تمام شد")));

  const before = sentMessages.length;
  await sweep(); // must not re-announce "stuck" every tick
  assert.equal(sentMessages.length, before, "an already-stuck case must not be re-reported on every sweep");
  console.log("ok   a case that never recovers stops after the bounded auto-resume budget, without re-announcing itself");
}

// --- reportFailure(): a send/delete command must NEVER be auto-retried,
// not even by sweep() after the silence window — only nudged (2026-09-11
// duplicate-publish incident is exactly the failure mode this guards) -----
{
  const before = sentMessages.length;
  const caseId = await reportFailure({
    source: "bot:resend", command: "node send-telegram.mjs", cwd: workDir,
    error: "Telegram sendVideo failed (500): Internal Server Error",
  });
  const c0 = caseById(caseId);
  assert.equal(c0.status, "escalated");
  assert.equal(c0.retryable, false);
  assert.equal(sentMessages.length, before + 1, "reportFailure must escalate immediately, with no local retry attempts first");

  const board = _internal.loadBoard();
  board.cases.find((x) => x.id === caseId).escalatedAt = new Date(Date.now() - _internal.RESUME_AFTER_MS - 1000).toISOString();
  _internal.saveBoard(board);

  const beforeSweep = sentMessages.length;
  await sweep();
  const c1 = caseById(caseId);
  assert.equal(c1.status, "escalated", "a non-retryable case must stay escalated after sweep, never silently resolved by a guessed re-run");
  assert.ok(sentMessages.length > beforeSweep, "must still nudge the owner");
  assert.ok(sentMessages[sentMessages.length - 1].includes("دوباره اجرا نمی‌کنم"), "the nudge must say plainly that it will not re-run the command itself");
  console.log("ok   a command that may have already sent/deleted something is never auto-retried by sweep(), only nudged");
}

// --- listOpenCases(): excludes resolved cases, includes everything else ---
{
  const text = listOpenCases();
  assert.ok(!text.includes("test:ok"), "a resolved case must not clutter the open list");
  assert.ok(text.includes(`#D${neverRecoversCaseId}`) && text.includes("test:never-recovers"), "an open (stuck) case must be listed");
  assert.ok(!text.includes(`#D${stuckCaseId}`), "a case resolved out of band must not still show as open");
  console.log("ok   listOpenCases() shows only cases that are not resolved");
}

globalThis.fetch = realFetch;
console.log("\nAll diagnose-board tests passed.");
