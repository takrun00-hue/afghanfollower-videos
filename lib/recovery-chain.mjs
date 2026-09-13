// Owner directive 2026-09-13: FAILED_ATTEMPT != FAILED_JOB. A GitHub
// Actions job that already exited cannot be resumed mid-flight — that is a
// hard platform constraint, not a design choice — so a Recovery Loop that
// has spent one run's budget has to hand its failure evidence forward to
// the NEXT run instead. This script is that hand-off: it runs as a
// `failure()` step in .github/workflows/news-scan.yml and records what the
// next attempt needs to know, bounded so it can never loop forever.
//
// WHAT THIS CANNOT DO, measured not assumed (2026-09-13): the commit it
// pushes does NOT start the next run. Commit 48d8c22 was pushed by this
// script as github-actions[bot], modified .trigger-daily-dispatch, and
// produced ZERO runs — in news-scan.yml OR daily.yml, both of which trigger
// on exactly that path, and both of which ran for every equivalent push
// made with the owner's own credentials. That is GitHub's recursion guard:
// a push authenticated with the workflow's own GITHUB_TOKEN does not
// trigger further workflow runs. No amount of rewriting this script changes
// that; only pushing with a separate credential (a PAT in a secret) would,
// and this repo's app deliberately has no actions: write either.
//
// So the next attempt comes from the triggers that DO fire: news-scan.yml's
// own hourly cron, and the hourly reliability ping. Nothing is lost by
// that — .german-lesson-progress.json never advances past a failed episode,
// so the next run rebuilds the SAME episode anyway. What this script adds is
// the part that would otherwise be lost: the failure evidence, and a bounded
// attempt counter, so that next run recovers with memory of what already
// failed instead of starting blind, and so the chain stops at a real limit
// instead of retrying forever.
//
// This is deliberately narrow: it only acts on a marker THIS repo's own
// Recovery Engine wrote. A failure that produced no marker (a different
// bug entirely — a script crash, a missing secret, a workflow YAML error)
// is not this mechanism's to chain; it exits 0 having done nothing, and
// the job stays failed for a human or one of the other self-heal routines
// to diagnose, exactly as before this mechanism existed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

export const MARKER = ".german-recovery-exhausted.json";
export const TRIGGER = ".trigger-daily-dispatch";
// Each chained run gets its own full local-retry + recovery-cycle budget
// (up to 3 local attempts x 3 cycles inside german-lesson-build.mjs), so
// this is not "3 more identical tries" — it is 3 more FULL Recovery Loop
// passes, each free to propose strategies the previous run already ruled
// out. Bounded so a genuinely unrecoverable case still reaches a human
// instead of chaining forever.
export const MAX_CHAIN_RETRIES = 3;

/**
 * Pure decision: given the marker's parsed content (or null if absent/
 * unreadable), should another chained attempt be pushed? Kept separate
 * from the git side effects below so it can be tested without a repo.
 * @returns {{chain:false, reason:string}|{chain:true}}
 */
export function decide(marker) {
  if (!marker) return { chain: false, reason: "no-marker" };
  const attempts = Number(marker.attempts) || 1;
  if (attempts >= MAX_CHAIN_RETRIES) return { chain: false, reason: "budget-spent", attempts };
  return { chain: true, attempts };
}

function git(...args) {
  execFileSync("git", args, { stdio: "inherit" });
}

// Guarded so `import { decide } from "./recovery-chain.mjs"` (test-recovery-
// chain.mjs) can exercise the pure decision logic without touching the
// filesystem or running git — this side-effecting body only runs when the
// file is executed directly, exactly as news-scan.yml's workflow step does.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  if (!existsSync(MARKER)) {
    console.log(`no ${MARKER} found — this failure did not come from the Recovery Engine's own exhaustion, so it is not this mechanism's to chain. Leaving the job failed for a human or another self-heal routine to diagnose.`);
    process.exit(0);
  }

  let marker;
  try {
    marker = JSON.parse(readFileSync(MARKER, "utf8"));
  } catch (e) {
    console.log(`${MARKER} exists but is not valid JSON (${e.message}) — cannot safely chain a retry from it.`);
    process.exit(0);
  }

  const verdict = decide(marker);
  const attempts = verdict.attempts || 1;
  if (!verdict.chain) {
    console.log(`Recovery Loop chain budget spent for "${marker.unit}" (${attempts}/${MAX_CHAIN_RETRIES} full chained attempts, each with its own local-retry and recovery-cycle budget) — every sanctioned strategy this system has has genuinely been tried across multiple full builds. Standing down for real: this needs a person to review "${marker.unit}" in lib/narration.mjs by ear. Last rejected word(s): ${(marker.lastReason?.faultWords || []).join("، ") || "(none recorded)"}.`);
    process.exit(0);
  }

  git("config", "user.name", "github-actions[bot]");
  git("config", "user.email", "github-actions[bot]@users.noreply.github.com");

  const ts = new Date().toISOString();
  const trigger = readFileSync(TRIGGER, "utf8").replace(/^last touch:.*$/m, `last touch: ${ts}`);
  writeFileSync(TRIGGER, trigger);

  git("add", "-f", MARKER, TRIGGER);
  git("commit", "-m", `chore: auto-chain Recovery Loop retry for ${marker.unit} (chained attempt ${attempts}/${MAX_CHAIN_RETRIES})`);

  try {
    git("push");
  } catch {
    console.log("push rejected, retrying once after rebase");
    git("pull", "--rebase", "--autostash", "origin", "main");
    git("push");
  }

  console.log(`Recovery evidence for "${marker.unit}" handed forward (attempt ${attempts}/${MAX_CHAIN_RETRIES}) — no human or agent action needed. This commit does NOT itself start the next run (a GITHUB_TOKEN push cannot trigger workflows); the next hourly trigger rebuilds this same episode, and now does it with this failure history instead of blind.`);
}
