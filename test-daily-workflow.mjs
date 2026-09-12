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
assert.match(workflow, /steps\.produce\.outputs\.complete == 'yes'/);
assert.match(workflow, /Mark incomplete delivery for retry/);
assert.match(workflow, /Install Persian narration quality gate/);
assert.match(workflow, /NARRATION_QC: "on"/);
assert.match(workflow, /ASR_MODEL: "medium"/);
assert.match(workflow, /group: gapmedia-production/);

const telegramWorkflow = readFileSync(".github/workflows/telegram.yml", "utf8");
assert.match(telegramWorkflow, /group: gapmedia-production/);
assert.match(telegramWorkflow, /rerender-feature/);
assert.match(telegramWorkflow, /RENDER_DIAGNOSTIC_FILE/);
assert.match(readFileSync("daily-render.mjs", "utf8"), /REQUIRE_VOICE === "on"[\s\S]{0,180}narration-planning/,
  "a required voice run must not fall back to an unmeasured beat grid");
assert.match(readFileSync("music/voice-qc.mjs", "utf8"), /voice-asr-mismatch/,
  "a rejected narration take must leave a safe, actionable category");

const germanWorkflow = readFileSync(".github/workflows/news-scan.yml", "utf8");
assert.match(germanWorkflow, /\.german-correction-request\.json/);
assert.match(germanWorkflow, /steps\.gate\.outputs\.unit/);
assert.match(germanWorkflow, /NARRATION_QC: "on"/);

console.log("production workflows keep delivery state serialized and correction paths explicit");
