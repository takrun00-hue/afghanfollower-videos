import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recoverSpokenLine, proposePronunciationFix, patchPronunciationTable } from "./lib/narration-recovery.mjs";

const repaired = recoverSpokenLine("روی ویدیو نریشن بگذارید", 3);
assert.equal(repaired.changed, true);
assert.equal(repaired.text, "روی ویدیو صدای خودکار بگذارید");

const preview = recoverSpokenLine("Preview را بررسی کنید", 1);
assert.equal(preview.changed, true);
assert.equal(preview.text, "پیش نمایش را بررسی کنید");

const unknown = recoverSpokenLine("این واژه ناشناخته است", 2);
assert.equal(unknown.changed, false);
assert.equal(unknown.reason, "no-safe-rewrite");

console.log("narration recovery stays bounded, word-specific, and meaning-preserving");

// Owner directive 2026-09-13: Recovery should check TTS pronunciation before
// reaching for a wording change. Production case: «خریدت» (a1-18-shopping)
// failed Narration QC on every attempt, same unmarked-possessive-ـت shape
// lib/pronounce.mjs's PERSIAN_TTS_FIXES already fixes 10+ times over.
assert.deepEqual(proposePronunciationFix("خریدت"), { pattern: "خریدت", fixed: "خریدِت" });
assert.deepEqual(proposePronunciationFix("حسابت"), { pattern: "حسابت", fixed: "حسابِت" });

// Words that only LOOK like the pattern must not get a guessed diacritic:
assert.equal(proposePronunciationFix("بد"), null, "too short to be stem+enclitic");
assert.equal(proposePronunciationFix("پست"), null, "stem ending in ت itself — doubling it would misspell, not just mispronounce");
assert.equal(proposePronunciationFix("خریدِت"), null, "already carries a diacritic — not this module's guess to make twice");

// patchPronunciationTable persists a Tier-1 fix into a REAL PERSIAN_TTS_FIXES
// array so it survives to the next build — proven against a disposable copy
// of the file shape, never the real lib/pronounce.mjs (a fix here is only
// ever persisted for real after german-lesson-build.mjs has confirmed it
// actually passed Narration QC).
{
  const dir = mkdtempSync(join(tmpdir(), "pronounce-test-"));
  const file = join(dir, "pronounce.mjs");
  writeFileSync(file, [
    "export function minimaxSpeakable(text) {",
    "  const PERSIAN_TTS_FIXES = [",
    '    ["صفر", "صِفر"],',
    "  ];",
    "  return text;",
    "}",
    "",
  ].join("\n"));

  const patched = patchPronunciationTable("خریدت", "خریدِت", file);
  assert.equal(patched, true);
  const content = readFileSync(file, "utf8");
  assert.match(content, /\["خریدت", "خریدِت"\]/);
  // The pre-existing entry must survive untouched.
  assert.match(content, /\["صفر", "صِفر"\]/);

  // Re-applying the same fix must be a safe no-op, never a duplicate entry
  // (the auto-generated comment also names the pattern once, alongside the
  // one real ["خریدت", ...] array key — a second call must add neither again).
  const before = readFileSync(file, "utf8");
  const again = patchPronunciationTable("خریدت", "خریدِت", file);
  assert.equal(again, false);
  assert.equal(readFileSync(file, "utf8"), before, "a repeated call must not touch the file at all");

  // A file with no PERSIAN_TTS_FIXES marker at all must fail safe, not throw.
  const noMarkerFile = join(dir, "no-marker.mjs");
  writeFileSync(noMarkerFile, "export const x = 1;\n");
  assert.equal(patchPronunciationTable("خریدت", "خریدِت", noMarkerFile), false);

  rmSync(dir, { recursive: true, force: true });
}

console.log("Tier-1 pronunciation-fix recovery: proposes only the well-precedented enclitic-ـت pattern, and persists it idempotently");
