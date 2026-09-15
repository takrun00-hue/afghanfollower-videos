// The Diagnose Board — one place every failed/unsuccessful command in this
// project lands, gets investigated, and is worked until it is actually
// resolved, instead of a bare "✗ خطا: ..." reply that the operator has to
// notice, remember, and act on by hand (owner request 2026-09-15).
//
// Flow for one failing command:
//   1. runTracked() executes it and retries locally (bounded — see
//      MAX_LOCAL_ATTEMPTS) applying any KNOWN_ISSUES fix along the way.
//   2. Still failing → escalate(): a Telegram message in the CLAUDE.md
//      problem-report shape (PROBLEM/IMPACT/LIKELY CAUSE/RECOMMENDED
//      ACTION), tagged #D<id>, asking the owner to act.
//   3. If a later Telegram message arrives while a case is open,
//      recordOwnerReply() treats it as the answer for the oldest open case.
//   4. If nobody answers, sweep() (called from bot.mjs's poll loop) resumes
//      automatic troubleshooting on its own after RESUME_AFTER_MS — but
//      bounded (MAX_AUTO_RESUME_CYCLES), never an unlimited loop. PROJECT_RULES
//      §8-A rule 72-م forbids حلقهٔ نامحدود ("infinite loop"); a case still
//      failing after every bounded cycle is marked "stuck" and reported
//      honestly, exactly like RecoveryExhausted in lib/recovery-engine.mjs —
//      never silently retried forever and never claimed fixed without proof.
//
// Every mutation goes through mutate(id, fn): load the board, hand the one
// case to fn, save. No function holds a board/case object across an `await` —
// that was the earlier bug here (history notes written to an object that was
// never saved, or saved over a stale copy that clobbered a concurrent write).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { loadEnv, telegramConfig, sendMessage } from "./telegram.mjs";

const BOARD_PATH = process.env.DIAGNOSE_BOARD_PATH || ".diagnose-board.json";
const MAX_LOCAL_ATTEMPTS = 3;       // same budget as PROJECT_RULES §8-A / recovery-engine.mjs
const MAX_AUTO_RESUME_CYCLES = 2;   // bounded — see file header
const RESUME_AFTER_MS = 30 * 60 * 1000; // resume on our own after 30 min of silence

const now = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shorten = (s, n = 400) => (s || "").toString().trim().slice(0, n);
const escapeHtml = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function loadBoard() {
  if (!existsSync(BOARD_PATH)) return { cases: [], nextId: 1 };
  try { return JSON.parse(readFileSync(BOARD_PATH, "utf8")); }
  catch { return { cases: [], nextId: 1 }; }
}
function saveBoard(board) { writeFileSync(BOARD_PATH, JSON.stringify(board, null, 2)); }

// Load → hand the one case to fn (which may mutate it) → save. The single
// place every function below touches the board, so no caller can save a
// stale copy over another caller's write.
function mutate(id, fn) {
  const board = loadBoard();
  const c = board.cases.find((x) => x.id === id);
  if (!c) return null;
  const result = fn(c, board);
  saveBoard(board);
  return result;
}

function note(id, text) {
  mutate(id, (c) => { c.history.push({ at: now(), note: text }); c.updatedAt = now(); });
}

async function say(text) {
  const tg = telegramConfig(loadEnv());
  if (!tg.enabled) return false;
  await sendMessage({ token: tg.token, chatId: tg.chatId, text });
  return true;
}

// --- known, real failure signatures from this project's own incidents ------
// `fix` is null when the right response is a clear human action (a secret,
// an install, an external outage) — auto-"fixing" those would just hide the
// real problem, which PROJECT_RULES §8-A explicitly forbids (never send an
// unverified/incomplete result to paper over a real failure).
export const KNOWN_ISSUES = [
  {
    id: "git-push-rejected",
    test: (err) => /rejected|non-fast-forward|failed to push/i.test(err),
    describe: "Push رد شد چون شاخهٔ ریموت جلوتر رفته (رقابت با یک اجرای دیگر) — دقیقاً همان باگ نشرِ تکراری که ۲۰۲۶-۰۹-۱۱ اصلاح شد.",
    fix: (cwd) => { execSync("git pull --rebase", { cwd, stdio: "pipe" }); return "git pull --rebase انجام شد؛ دوباره امتحان می‌شود."; },
  },
  {
    id: "telegram-409",
    test: (err) => /\(409\)/.test(err) || /Conflict: terminated by other getUpdates/i.test(err),
    describe: "یک وب‌هوک یا نمونهٔ دیگر از همین بات همزمان روی همین توکن getUpdates می‌گیرد.",
    fix: null,
  },
  {
    id: "hf-token",
    test: (err) => /HF_TOKEN|401.*huggingface|gated repo/i.test(err),
    describe: "مدل انگلیسیِ pocket-tts نیاز به HF_TOKEN معتبر و دسترسی‌داده‌شده دارد.",
    fix: null,
  },
  {
    id: "network-transient",
    test: (err) => /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|fetch failed/i.test(err),
    describe: "خطای شبکهٔ گذرا.",
    fix: async () => { await sleep(5000); return "بعد از مکث کوتاه دوباره امتحان می‌شود."; },
  },
  {
    id: "ffmpeg-missing",
    test: (err) => /ffmpeg.*not found|'ffmpeg' is not recognized|ENOENT.*ffmpeg/i.test(err),
    describe: "ffmpeg روی این سیستم پیدا نشد یا در PATH نیست.",
    fix: null,
  },
];

export function matchKnownIssue(err) {
  return KNOWN_ISSUES.find((k) => k.test(err || "")) || null;
}

function runOnce(command, cwd) {
  return execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function suggestionFor(c, known) {
  if (known && !known.fix) return "این مورد نیاز به اقدام دستی شما دارد (بالا را ببین).";
  if (c.retryable === false) return "این دستور ممکن است ارسال/حذف کرده باشد؛ خودم دوباره اجرایش نمی‌کنم. بگو چیکار کنم، یا اگر خودت حلش کردی بگو «دوباره امتحان کن».";
  return "اگر می‌دانی مشکل چیست بگو تا دوباره امتحان کنم؛ وگرنه ۳۰ دقیقهٔ دیگر خودم دوباره تلاش می‌کنم.";
}

async function escalate(id, { cycleLabel } = {}) {
  let snapshot;
  mutate(id, (c) => {
    c.status = "escalated";
    c.escalatedAt = now();
    snapshot = { ...c };
  });
  if (!snapshot) return;
  const known = matchKnownIssue(snapshot.error);
  const lines = [
    `🛠 <b>دیاگنوز #D${id}</b> — نیاز به کمک${cycleLabel ? ` (${cycleLabel})` : ""}`,
    ``,
    `مشکل: ${escapeHtml(snapshot.source)}`,
    `تأثیر: دستور «${escapeHtml(shorten(snapshot.command, 120))}» اجرا نشد.`,
    `علت محتمل: ${known ? escapeHtml(known.describe) : "نامشخص — خطای خام پایین را ببین."}`,
    `پیشنهاد: ${escapeHtml(suggestionFor(snapshot, known))}`,
    ``,
    `خطای خام:`,
    `<code>${escapeHtml(shorten(snapshot.error))}</code>`,
  ];
  note(id, `escalated${cycleLabel ? ` (${cycleLabel})` : ""}`);
  await say(lines.join("\n"));
}

async function markStuck(id) {
  let snapshot;
  mutate(id, (c) => { c.status = "stuck"; snapshot = { ...c }; });
  if (!snapshot) return;
  await say(
    `🛑 <b>دیاگنوز #D${id}</b> — تلاش خودکار تمام شد\n\n` +
    `بعد از ${MAX_AUTO_RESUME_CYCLES} دور تلاش خودکار بدون پاسخ، برای جلوگیری از حلقهٔ نامحدود (طبق قانون پروژه) دیگر خودکار دوباره امتحان نمی‌کنم.\n` +
    `دستور: <code>${escapeHtml(shorten(snapshot.command, 120))}</code>\n` +
    `آخرین خطا:\n<code>${escapeHtml(shorten(snapshot.error))}</code>\n\n` +
    `«دیاگنوز» را بفرست تا فهرست موارد باز را ببینی.`,
  );
}

// Try `command` up to MAX_LOCAL_ATTEMPTS times, applying a known fix in
// between when one matches. Pure — reports progress via onNote(text) but
// never touches the board itself; every board-aware caller below persists.
async function attemptWithKnownFixes(command, cwd, onNote) {
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_LOCAL_ATTEMPTS; attempt++) {
    try {
      const output = runOnce(command, cwd);
      return { ok: true, output, attempts: attempt };
    } catch (e) {
      lastErr = shorten([e.stdout, e.stderr, e.message].filter(Boolean).join("\n"), 2000);
      onNote?.(`تلاش ${attempt} شکست خورد: ${shorten(lastErr, 200)}`);
      if (attempt === MAX_LOCAL_ATTEMPTS) break;
      const known = matchKnownIssue(lastErr);
      if (known) {
        onNote?.(`علت شناخته‌شده (${known.id}): ${known.describe}`);
        if (!known.fix) break; // needs a human — stop burning local attempts
        try { onNote?.(await known.fix(cwd)); }
        catch (fixErr) { onNote?.(`اصلاح خودکار هم شکست خورد: ${fixErr.message}`); break; }
      } else {
        await sleep(1500 * attempt); // small backoff for an unrecognised, possibly-transient fault
      }
    }
  }
  return { ok: false, error: lastErr, attempts: MAX_LOCAL_ATTEMPTS };
}

function openCaseRecord({ source, command, cwd, retryable, error }) {
  const board = loadBoard();
  const caseId = board.nextId++;
  board.cases.push({
    id: caseId, source, command, cwd, retryable,
    status: "open", createdAt: now(), updatedAt: now(),
    error: error ?? null, escalatedAt: null, resumeCycles: 0, ownerReply: null, history: [],
  });
  saveBoard(board);
  return caseId;
}

/**
 * Run `command`, tracked on the Diagnose Board. Resolves the same way
 * whether it succeeds on the first try or only after retries/fixes; escalates
 * to Telegram (and returns ok:false) only once every local attempt is spent.
 * Only for commands safe to re-run unattended (no send/delete side effect) —
 * see reportFailure() for anything that already tried to send or delete.
 * @param {{source:string, command:string, cwd?:string}} opts
 */
export async function runTracked({ source, command, cwd = process.cwd() }) {
  const caseId = openCaseRecord({ source, command, cwd, retryable: true });

  const result = await attemptWithKnownFixes(command, cwd, (text) => note(caseId, text));
  if (result.ok) {
    mutate(caseId, (c) => { c.status = "resolved"; c.resolvedAt = now(); });
    note(caseId, `تلاش ${result.attempts} موفق شد — مورد بسته شد.`);
    return { ok: true, output: result.output, caseId };
  }

  mutate(caseId, (c) => { c.error = result.error; });
  await escalate(caseId);
  return { ok: false, error: result.error, caseId };
}

/**
 * Track a command that ALREADY ran and failed once, without re-running it —
 * for anything that may have sent a video/message or deleted one. A blind
 * automatic retry of a send/delete is exactly how this project's own
 * duplicate-publish incident (PROJECT_RULES appendix, 2026-09-11) happened;
 * this only escalates and, later, nudges — sweep() never re-executes a
 * retryable:false case's command on its own. An owner reply still re-runs it
 * once (a human explicitly asking for that is not an unattended retry).
 * @param {{source:string, command:string, error:string, cwd?:string}} opts
 */
export async function reportFailure({ source, command, error, cwd = process.cwd() }) {
  const caseId = openCaseRecord({ source, command, cwd, retryable: false, error: shorten(error, 2000) });
  note(caseId, "این دستور ممکن است ارسال/حذف انجام داده باشد؛ تلاش دوبارهٔ خودکار برایش امن نیست — فقط گزارش و پیگیری می‌شود.");
  await escalate(caseId);
  return caseId;
}

// Called from bot.mjs's poll loop. Cheap: only acts on cases whose silence
// window has actually elapsed, so it is safe to call on every tick.
export async function sweep() {
  const board = loadBoard();
  const due = board.cases.filter(
    (c) => c.status === "escalated" && !c.ownerReply &&
      Date.now() - new Date(c.escalatedAt).getTime() > RESUME_AFTER_MS,
  );
  for (const c of due) {
    // `due` only ever contains status "escalated" (see the filter above), so
    // once markStuck() flips a case to "stuck" it drops out of `due` on the
    // very next sweep() call — this loop can never re-announce the same case.
    if (c.resumeCycles >= MAX_AUTO_RESUME_CYCLES) {
      await markStuck(c.id);
      continue;
    }
    mutate(c.id, (x) => { x.resumeCycles++; });
    const cycleLabel = `دور تلاش خودکار ${c.resumeCycles + 1}`;

    if (c.retryable === false) {
      // Never re-run a command that may have already sent/deleted something —
      // just remind the owner it's still waiting, bounded the same way.
      note(c.id, `${cycleLabel} — بدون پاسخ؛ چون تلاش دوباره برای این مورد امن نیست، فقط یادآوری می‌شود.`);
      await say(`⏳ <b>دیاگنوز #D${c.id}</b> — هنوز پاسخی نگرفتم و این مورد را خودم دوباره اجرا نمی‌کنم (ممکن است دوباره ارسال/حذف کند). لطفاً بررسی کن.`);
      continue;
    }

    note(c.id, `${cycleLabel} — بدون پاسخ، خودکار از سر گرفته شد.`);
    await say(`⏳ <b>دیاگنوز #D${c.id}</b> — هنوز پاسخی نگرفتم؛ ${cycleLabel} را شروع می‌کنم.`);

    const result = await attemptWithKnownFixes(c.command, c.cwd, (text) => note(c.id, text));
    if (result.ok) {
      mutate(c.id, (x) => { x.status = "resolved"; x.resolvedAt = now(); });
      note(c.id, `${cycleLabel} موفق شد — مورد بسته شد.`);
      await say(`✅ <b>دیاگنوز #D${c.id}</b> — خودکار حل شد (${cycleLabel}).`);
    } else {
      mutate(c.id, (x) => { x.error = result.error; });
      await escalate(c.id, { cycleLabel });
    }
  }
}

// A free-text Telegram message that matched no known command is treated as
// the owner's answer to the oldest still-open case — logged either way, and
// used to retry immediately since a reply usually means "I fixed it."
export async function recordOwnerReply(text) {
  const board = loadBoard();
  const c = board.cases.find((x) => x.status === "escalated" && !x.ownerReply);
  if (!c) return null;

  mutate(c.id, (x) => { x.ownerReply = text; x.status = "investigating"; });
  note(c.id, `پاسخ شما دریافت شد: «${shorten(text, 200)}» — دوباره امتحان می‌کنم.`);
  await say(`🔁 <b>دیاگنوز #D${c.id}</b> — پاسخت را گرفتم، دوباره امتحان می‌کنم…`);

  const result = await attemptWithKnownFixes(c.command, c.cwd, (t) => note(c.id, t));
  if (result.ok) {
    mutate(c.id, (x) => { x.status = "resolved"; x.resolvedAt = now(); });
    note(c.id, "بعد از پاسخ شما موفق شد — مورد بسته شد.");
    return { ok: true, caseId: c.id, message: `✅ حل شد (#D${c.id}).` };
  }
  mutate(c.id, (x) => { x.error = result.error; x.ownerReply = null; }); // still broken — leave open for the NEXT reply too
  await escalate(c.id, { cycleLabel: "بعد از پاسخ شما، هنوز شکست می‌خورد" });
  return { ok: false, caseId: c.id, message: `هنوز حل نشد (#D${c.id}) — دوباره بررسی می‌کنم.` };
}

export function listOpenCases() {
  const board = loadBoard();
  const open = board.cases.filter((c) => c.status !== "resolved");
  if (!open.length) return "📋 دیاگنوز — هیچ مورد بازی نیست.";
  const lines = open.map((c) => {
    const mins = Math.round((Date.now() - new Date(c.updatedAt).getTime()) / 60000);
    return `#D${c.id} [${c.status}] ${c.source} — ${shorten(c.command, 60)} — ${mins} دقیقه پیش`;
  });
  return `📋 <b>دیاگنوز — موارد باز (${open.length})</b>\n${lines.join("\n")}`;
}

export const _internal = { loadBoard, saveBoard, BOARD_PATH, MAX_LOCAL_ATTEMPTS, MAX_AUTO_RESUME_CYCLES, RESUME_AFTER_MS };
