// Bounded, private repairs for words the selected Persian TTS voice has
// already demonstrated it cannot read reliably.  This is deliberately a
// small allow-list: the system may clarify a spoken phrasing, but may never
// invent facts, alter a number, or rewrite a user's meaning just to make ASR
// pass.  The on-screen text is never changed by this module.

const DIACRITICS = /[ً-ْٰـ]/g;
const EDGE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

const key = (value) => String(value || "")
  .replace(DIACRITICS, "")
  .replace(/[\u200C\u00A0]/g, " ")
  .replace(EDGE, "")
  .toLowerCase();

// Each replacement was selected because it keeps the same practical meaning
// while using a shorter, Persian-native phrase.  Add an entry only after an
// actual rejected take has been reviewed; broad phonetic guessing is unsafe.
const SAFE_TOKEN_REWRITES = new Map([
  ["نریشن", "صدای خودکار"],
  ["میکروفون", "مایک"],
  ["پریویو", "پیش نمایش"],
  ["پرویو", "پیش نمایش"],
  ["preview", "پیش نمایش"],
  ["microphone", "مایک"],
  ["ریلز", "ریل"],
]);

/**
 * Return one conservative spoken-only repair for the ASR-reported word.
 * `wordIndex` is one-based, matching music/voice-qc.mjs's safe diagnostic.
 */
export function recoverSpokenLine(text, wordIndex) {
  const tokens = String(text || "").trim().split(/\s+/).filter(Boolean);
  const index = Number(wordIndex) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= tokens.length) {
    return { changed: false, text: String(text || ""), reason: "no-target-token" };
  }
  const replacement = SAFE_TOKEN_REWRITES.get(key(tokens[index]));
  if (!replacement) {
    return { changed: false, text: String(text || ""), reason: "no-safe-rewrite" };
  }
  tokens[index] = replacement;
  return { changed: true, text: tokens.join(" "), reason: "approved-spoken-rewrite" };
}

