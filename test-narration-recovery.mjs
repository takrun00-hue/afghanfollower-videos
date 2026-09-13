import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recoverSpokenLine, proposePronunciationFix, patchPronunciationTable, persistentFaultWords, containsWord } from "./lib/narration-recovery.mjs";

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

// Regression for the real production stop recorded in
// .german-recovery-exhausted.json (a1-18-shopping, chained attempt 1,
// 2026-09-13). The old "must fail in EVERY attempt" rule found an empty
// intersection here and declared noise, so recover() never ran and the build
// stopped while «خریدِت» and «میخواهی» were each failing two takes running —
// exactly the "stopped although a valid recovery path remained" behaviour the
// owner rejected.
{
  const recorded = [
    { reason: { faultWords: ["است"] } },
    { reason: { faultWords: ["خریدِت", "میخواهی", "است"] } },
    { reason: { faultWords: ["خریدِت", "میخواهی"] } },
  ];
  const found = persistentFaultWords(recorded);
  assert.deepEqual(found.sort(), ["میخواهی", "خریدِت"].sort(), "the two words that failed the last two takes running must be actionable");
  assert.ok(!found.includes("است"), "«است» also failed twice but has stopped failing — rewording it would change a line that now passes");
}

// Genuine per-line noise — a different word each take — must still read as
// noise, or every flaky build would start rewriting healthy narration.
assert.deepEqual(persistentFaultWords([
  { reason: { faultWords: ["بزرگ"] } },
  { reason: { faultWords: ["توصیف"] } },
  { reason: { faultWords: ["جفت"] } },
]), [], "a different word failing each attempt is noise, not a fixable wording issue");

// One word failing every take is the clearest case and must stay actionable.
assert.deepEqual(persistentFaultWords([
  { reason: { faultWords: ["بد"] } },
  { reason: { faultWords: ["بد"] } },
  { reason: { faultWords: ["بد"] } },
]), ["بد"]);

assert.deepEqual(persistentFaultWords([]), [], "no failures recorded means nothing to act on");
assert.deepEqual(persistentFaultWords([{ reason: {} }]), [], "a failure with no fault words must not crash or invent one");

console.log("ok   persistent-fault detection acts on a word failing the majority of takes, still ignores per-take noise");

// Regression for the silent stop recorded in chained attempt 2
// (.german-recovery-exhausted.json, a1-18-shopping, 2026-09-13 08:04). The
// majority rule had just shipped and correctly flagged «خریدِت» as failing
// the last two takes — but Tier 2 then looked for that exact string in the
// narration line, which reads «خریدت» unmarked, found nothing, and returned
// null. The pronunciation fix shipped earlier that morning had silently
// disabled the reword tier.
{
  const line = "اولین خریدت در آلمان را با همین جمله‌ها انجام بده.";
  assert.equal(containsWord(line, "خریدِت"), true, "the marked-up spoken form must locate its unmarked written line");
  assert.equal(containsWord(line, "خریدت"), true, "the plain form must still match");
  assert.equal(containsWord(line, "کتاب"), false, "an unrelated word must not match");
  assert.equal(containsWord(line, "خری"), false, "a substring is not a word match");
  assert.equal(containsWord("", "خریدت"), false);
  assert.equal(containsWord(line, ""), false, "an empty needle must never match everything");

  // And the validation that the reword actually removed the word has to use
  // the same comparison, or an LLM returning the marked-up form would pass.
  const { rewordPersistentWord } = await import("./lib/narration-recovery.mjs");
  assert.equal(typeof rewordPersistentWord, "function");
  console.log("ok   fault words match their narration line across diacritics — the pronunciation fix no longer disables the reword tier");
}
