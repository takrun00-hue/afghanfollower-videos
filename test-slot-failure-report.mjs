import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summariseSlotFailure } from "./lib/slot-failure-report.mjs";

// The exact production run this exists for. Reproduced offline on 2026-09-13
// against the real registry and the real Visual Truth Gate for that day's
// tiktok lane: three UNIQUE subjects blocked only by a missing real
// screenshot, three genuine duplicates. Because the LAST attempt was a
// duplicate, the old alert told the owner «این موضوع اخیراً یک‌بار ساخته شده»
// and said nothing about the three topics one photo each would have unblocked.
{
  const real = [
    { id: "retention-graph", kind: "visualQc", missingSlides: [{ n: 1, text: "نمودار نگهداشت را باز کن" }] },
    { id: "pin-comment", kind: "duplicate" },
    { id: "view-jail", kind: "duplicate" },
    { id: "tiktok-pay", kind: "duplicate" },
    { id: "green-screen", kind: "visualQc", missingSlides: [{ n: 1, text: "افکت پرده سبز" }] },
    { id: "tt-story-highlights", kind: "visualQc", missingSlides: [{ n: 2, text: "هایلایت استوری" }] },
  ];
  const out = summariseSlotFailure(real);

  assert.match(out, /از ۶ موضوع امتحان‌شده|از 6 موضوع امتحان‌شده/, "a mixed run must lead with the breakdown, never with one cause");
  assert.match(out, /۳ مورد عکس واقعی نداشت|3 مورد عکس واقعی نداشت/);
  assert.match(out, /۳ مورد تکراری بود|3 مورد تکراری بود/);

  // The actionable half must survive a last attempt that failed differently.
  for (const id of ["retention-graph", "green-screen", "tt-story-highlights"]) {
    assert.ok(out.includes(id), `«${id}» is fixable with one screenshot and must be named`);
  }
  assert.match(out, /اسکرین‌شات/, "the screenshot instruction must not be suppressed by a trailing duplicate");
  assert.match(out, /مرحلهٔ ۱: نمودار نگهداشت را باز کن/, "the specific missing slide must be named, not just the pack");

  // A duplicate is a different ask and must not be dressed up as a photo request.
  assert.ok(!out.includes("view-jail"), "a duplicate needs a new subject, not a screenshot — naming it under the photo request would mislead");
}

// A lane that really is exhausted must still read as exhausted, with no
// screenshot request invented for it.
{
  const out = summariseSlotFailure([
    { id: "a", kind: "duplicate" },
    { id: "b", kind: "duplicate" },
  ]);
  assert.match(out, /اخیراً ساخته شده/);
  assert.ok(!out.includes("اسکرین‌شات"), "nothing here is fixable with a photo — do not ask for one");
}

// A single visual-QC failure keeps the original, already-correct behaviour.
{
  const out = summariseSlotFailure([
    { id: "reply-video", kind: "visualQc", missingSlides: [{ n: 3, text: "ویدیوی پاسخ" }] },
  ]);
  assert.match(out, /reply-video/);
  assert.match(out, /مرحلهٔ ۳: ویدیوی پاسخ/);
  assert.ok(!out.includes("از ۱ موضوع"), "a single attempt needs no breakdown line");
}

// Degenerate input must never crash the alert path — a slot that cannot even
// report why it failed still has to reach the owner.
assert.equal(typeof summariseSlotFailure([]), "string");
assert.equal(typeof summariseSlotFailure(null), "string");
assert.equal(typeof summariseSlotFailure([{ id: "x", kind: "visualQc" }]), "string");

// This module decides wording only. If it ever starts deciding whether a pack
// may ship, the Visual Truth Gate has been routed around.
{
  // Checked against CODE, not prose: this module's own header names
  // assertVisualProof when explaining what it must not do, and a naive grep
  // over the whole file would match that comment and "pass" for the wrong
  // reason. Strip comments first, then assert the real property — a pure
  // string builder imports nothing, so it cannot reach the gate, the
  // registry or Telegram even by accident.
  const code = readFileSync("lib/slot-failure-report.mjs", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/^\s*import\s/m.test(code), "the report module must stay dependency-free — it decides wording, never whether a pack ships");
  assert.ok(!/assertVisualProof|register\(|sendVideo/.test(code), "the report module must not touch the gate, the registry or delivery");
}

console.log("ok   a slot's give-up alert reports every attempt's cause, so a fixable missing photo is never hidden by a trailing duplicate");
