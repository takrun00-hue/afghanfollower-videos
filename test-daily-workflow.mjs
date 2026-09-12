import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/daily.yml", "utf8");

// Regression guard for the production failure observed on 2026-09-11: a
// failure in the first native format used to stop the second one entirely.
assert.match(workflow, /id: produce/);
assert.match(workflow, /\.daily-delivery-progress\.json/);
assert.match(workflow, /run_slot tiktok\s+run_slot instagram/s);
assert.match(workflow, /run_slot ai-tiktok\s+run_slot ai-instagram/s);
assert.match(workflow, /timeout --preserve-status 24m node daily-render\.mjs --only/);
assert.match(workflow, /steps\.produce\.outputs\.complete == 'yes'/);
assert.match(workflow, /Mark incomplete delivery for retry/);

console.log("daily workflow keeps each native format resumable after a sibling failure");
