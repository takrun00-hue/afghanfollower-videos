import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/daily.yml", "utf8");

// GitHub rejects the workflow before it creates any job when a job property
// is nested beneath `runs-on`. This once generated misleading failure emails
// for unrelated correction pushes.
assert.match(workflow, /^ {4}runs-on: ubuntu-latest\r?\n(?: {4}#.*\r?\n)* {4}timeout-minutes: 90\r?\n/m,
  "daily render timeout must align with runs-on");

// Regression guard for the production failure observed on 2026-09-11: a
// failure in the first native format used to stop the second one entirely.
assert.match(workflow, /id: produce/);
assert.match(workflow, /\.daily-delivery-progress\.json/);
assert.match(workflow, /run_slot tiktok\s+run_slot instagram/s);
assert.match(workflow, /run_slot ai-tiktok\s+run_slot ai-instagram/s);
assert.match(workflow, /timeout --preserve-status 24m node daily-render\.mjs --only/);
assert.match(workflow, /Mark incomplete delivery for retry/);

// Regression guard for the production failure observed 2026-09-11 through
// 2026-09-12: the gate was an if/elif chain, so a morning batch stuck on one
// persistently-failing slot (already_sent only flips once BOTH its slots
// succeed) meant the elif for evening was never reached — .daily-batch-sent
// showed no "evening" entry for over a day while ai-tiktok/ai-instagram sat
// completely unattempted. Both thresholds must be checked independently and
// "all" used when both are due, and the delivered-marker must be recorded
// per real slot completion (not the whole run's pass/fail), so a stuck
// morning slot never again blocks evening from ever being marked sent.
assert.match(workflow, /morning_due=true/);
assert.match(workflow, /evening_due=true/);
assert.match(workflow, /if \[ "\$morning_due" = true \] && \[ "\$evening_due" = true \]; then\s*\n\s*echo "go=yes" >> "\$GITHUB_OUTPUT"\s*\n\s*echo "batch=all"/,
  "both thresholds due at once must select the combined \"all\" batch, not just morning");
assert.match(workflow, /REQUIRED = \{ morning: \["tiktok", "instagram"\], evening: \["ai-tiktok", "ai-instagram"\] \}/,
  "the delivered marker must be derived from actual per-slot completion, not the run's overall pass/fail");
assert.match(workflow, /Install Persian narration quality gate/);
assert.match(workflow, /NARRATION_QC: "on"/);
assert.match(workflow, /ASR_MODEL: "medium"/);
assert.match(workflow, /group: gapmedia-production/);

const telegramWorkflow = readFileSync(".github/workflows/telegram.yml", "utf8");
assert.match(telegramWorkflow, /group: gapmedia-production/);
assert.match(telegramWorkflow, /rerender-feature/);
assert.match(telegramWorkflow, /RENDER_DIAGNOSTIC_FILE/);
assert.match(telegramWorkflow, /line: Number\.isInteger\(x\.line\) \? x\.line : null/,
  "safe render diagnostics retain only the failing narration line number");
assert.match(readFileSync("daily-render.mjs", "utf8"), /REQUIRE_VOICE === "on"[\s\S]{0,180}narration-planning/,
  "a required voice run must not fall back to an unmeasured beat grid");
assert.match(readFileSync("music/voice-qc.mjs", "utf8"), /voice-asr-mismatch/,
  "a rejected narration take must leave a safe, actionable category");
assert.match(readFileSync("music/plan-voice.mjs", "utf8"), /MAX_NARRATION_ATTEMPTS = 3/,
  "narration must use bounded recovery instead of stopping at its first rejected take");
assert.match(readFileSync("daily-render.mjs", "utf8"), /dailyDeliveriesForDate\(date, new Set\(\[\.\.\.avoidIds, \.\.\.triedIds\]\)\)/,
  "a duplicate or failed automatic candidate must seek a different unused topic");
assert.match(readFileSync("daily-render.mjs", "utf8"), /MAX_ATTEMPTS_PER_SLOT = isRerender \? 1 : 6/,
  "only an explicit correction rerender may stay pinned to its original subject");

const germanWorkflow = readFileSync(".github/workflows/news-scan.yml", "utf8");
assert.match(germanWorkflow, /\.german-correction-request\.json/);
assert.match(germanWorkflow, /steps\.gate\.outputs\.unit/);
assert.match(germanWorkflow, /NARRATION_QC: "on"/);

// Regression guard for the production incident observed 2026-09-12: the
// hourly news-scan.yml cron fired while the previous run was still in
// progress in the same "gapmedia-production" concurrency group, queued
// behind it as designed, and actually started executing AFTER that run had
// already pushed episode 17 and advanced nextIndex — but checkout defaults
// to `github.sha`, frozen at the moment the run was QUEUED, not when it
// actually executes, so the queued run silently rebuilt the exact same
// episode all over again instead of seeing the advanced state. Every
// workflow sharing this concurrency group needs an explicit `ref`.
for (const [name, wf] of [["daily.yml", workflow], ["news-scan.yml", germanWorkflow], ["telegram.yml", telegramWorkflow]]) {
  assert.match(wf, /uses: actions\/checkout@v4\s*\n\s*with:\s*\n\s*ref: main/,
    `${name}'s checkout must pin an explicit ref, not the stale github.sha a queued run was frozen at`);
}

console.log("production workflows keep delivery state serialized and correction paths explicit");
