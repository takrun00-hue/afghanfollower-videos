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
assert.match(workflow, /timeout --preserve-status 24m node core\/orchestrator\.ts --video-action scheduled-tutorial --slot/);
assert.doesNotMatch(workflow, /^\s*(?:timeout[^\n]* )?node daily-render\.mjs/m,
  "scheduled delivery must not bypass the orchestrator");
assert.match(workflow, /steps\.produce\.outputs\.complete == 'yes'/);
assert.match(workflow, /Mark incomplete delivery for retry/);
assert.match(workflow, /Install Persian narration quality gate/);
assert.match(workflow, /NARRATION_QC: "on"/);
assert.match(workflow, /ASR_MODEL: "medium"/);
assert.match(workflow, /LIVE_IMAGE_RESCUE: "off"/,
  "unattended publishing must not wait on quota-limited image rescue");
assert.match(workflow, /MAX_ATTEMPTS_PER_SLOT: "3"/,
  "scheduled production must have a bounded per-slot retry budget");
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
const renderer = readFileSync("daily-render.mjs", "utf8");
assert.match(renderer, /const LIVE_IMAGE_RESCUE = process\.env\.LIVE_IMAGE_RESCUE !== "off"/,
  "live asset rescue must be explicitly controllable by the production runner");
assert.match(renderer, /MAX_ATTEMPTS_PER_SLOT \|\| ""/,
  "the retry budget must be centrally configurable by the runner");
assert.match(renderer, /!LIVE_IMAGE_RESCUE \|\| !\(await rescuePackPhotos\(pack\)\)/,
  "scheduled runs must skip missing-asset rescue rather than exhausting image quotas");

const germanWorkflow = readFileSync(".github/workflows/news-scan.yml", "utf8");
assert.match(germanWorkflow, /\.german-correction-request\.json/);
assert.match(germanWorkflow, /steps\.gate\.outputs\.unit/);
assert.match(germanWorkflow, /NARRATION_QC: "on"/);
assert.match(germanWorkflow, /node core\/orchestrator\.ts --video-action scheduled-german/);
assert.match(telegramWorkflow, /node core\/orchestrator\.ts --video-action/);
assert.doesNotMatch(germanWorkflow, /^\s*node german-lesson-build\.mjs/m,
  "German production must not bypass the orchestrator");
assert.doesNotMatch(telegramWorkflow, /^\s*node (?:daily-render|approve-feature|content-draft|custom-content|build-current-app-pair)\.mjs/m,
  "Telegram video production must not bypass the orchestrator");

console.log("production workflows keep delivery state serialized and correction paths explicit");
