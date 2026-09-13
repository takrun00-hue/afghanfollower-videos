import assert from "node:assert/strict";
import { GERMAN_A1 } from "./lib/german-a1.mjs";
import { narrationFor } from "./lib/narration.mjs";

// Regression guard for the production incident 2026-09-13: a German-lesson
// episode's on-screen caption hook (GERMAN_A1[id].hook, in lib/german-a1.mjs)
// and its ACTUALLY-SPOKEN hook (VO[id].hook, in lib/narration.mjs's private
// table, returned directly by narrationFor() for any known unit id) are two
// separate, hand-written copies of the same sentence with no code path
// connecting them. A same-day fix to the German-lesson hook-duplication bug
// (test-hook-uniqueness.mjs) edited only GERMAN_A1's copy — the audio for
// the "fixed" video still spoke the old, duplicated template, because
// narrationFor() never reads GERMAN_A1's hook when a VO entry exists. This
// test would have caught that the moment it was committed, instead of only
// after a real render + Telegram send. If a genuine reason ever requires the
// spoken and on-screen text to differ (as SPOKEN_HOOKS already does for one
// non-lesson feature, "tts-voice", to work around a TTS-reading quirk),
// add the id to DELIBERATE_DIVERGENCE with a comment explaining why — do not
// weaken or delete this assertion to make a failure go away silently.
const DELIBERATE_DIVERGENCE = new Set([
  // The caption shows a numeral ("۵") for visual brevity; the spoken line
  // must spell the number as a word ("پنج") or the TTS voice reads the
  // digit incorrectly. Both files' text is intentional, not drift.
  "a1-09-colors",
  // Owner report 2026-09-11: naming the German verb "sein" in Latin script
  // inside PERSIAN narration made the Persian voice mispronounce it (no
  // language_boost="German" on that clip). The on-screen caption may still
  // show "sein" — it's German text on a German-lesson video — but the
  // spoken line must avoid saying it aloud. See lib/narration.mjs's
  // a1-12-haben entry for the original fix.
  "a1-12-haben",
]);

for (const unit of GERMAN_A1) {
  if (DELIBERATE_DIVERGENCE.has(unit.id)) continue;
  const spoken = narrationFor(unit.id);
  assert.ok(spoken, `narrationFor("${unit.id}") returned nothing`);
  assert.equal(
    spoken.hook, unit.hook,
    `${unit.id}: the on-screen hook and the spoken hook have drifted apart — ` +
      `edit both lib/german-a1.mjs's GERMAN_A1["${unit.id}"].hook and lib/narration.mjs's ` +
      `VO["${unit.id}"].hook together, or add "${unit.id}" to DELIBERATE_DIVERGENCE with a reason`,
  );
}

console.log(`ok   all ${GERMAN_A1.length} German A1 units speak the exact hook shown on screen`);
