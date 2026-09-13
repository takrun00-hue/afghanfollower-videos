// Bounded, private repairs for words the selected Persian TTS voice has
// already demonstrated it cannot read reliably.  This is deliberately a
// small allow-list: the system may clarify a spoken phrasing, but may never
// invent facts, alter a number, or rewrite a user's meaning just to make ASR
// pass.  The on-screen text is never changed by this module.
//
// Two independent mechanisms live in this file:
//   - recoverSpokenLine(): the ORIGINAL, production, daily-pipeline repair
//     (music/plan-voice.mjs) — a fixed word→word allow-list, single-token,
//     no network calls. Do not remove or change its behavior casually; it
//     is load-bearing for the daily TikTok/Instagram pipeline.
//   - rewordPersistentWord()/patchSourceText(): the German-lesson Recovery
//     Loop strategy generator (german-lesson-build.mjs, owner directive
//     2026-09-13, production case: a1-17-adjectives' bare word «بد» failed
//     Narration QC on every single independent synthesis attempt across two
//     full builds — a genuine word-specific TTS/ASR mismatch, not synthesis
//     noise). This one calls an LLM to reword a whole sentence, so its
//     result is validated, not trusted: it must stay Persian, similar
//     length, and must no longer contain the failing word. It only ever
//     proposes different Persian WORDING for the spoken line — never asked
//     to touch a German (`de`) clip's actual vocabulary pronunciation.
import { readFileSync, writeFileSync } from "node:fs";
import { askGemini, askGroq } from "./auto-image.mjs";

const DIACRITICS = /[ً-ْٰـ]/g;
const EDGE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

const key = (value) => String(value || "")
  .replace(DIACRITICS, "")
  .replace(/[‌ ]/g, " ")
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

function parseRewordVerdict(raw) {
  try {
    const match = String(raw || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    const value = JSON.parse(match[0]);
    return typeof value?.rewritten === "string" && value.rewritten.trim() ? value.rewritten.trim() : null;
  } catch {
    return null;
  }
}

function rewordPrompt(sentence, persistentWords, topic) {
  const words = persistentWords.join("، ");
  return `این جملهٔ فارسی، نریشن یک ویدیوی آموزشی است (موضوع: «${topic}»):
«${sentence}»
تشخیص گفتار خودکار (ASR) کلمهٔ «${words}» را در چند تلاش مستقل و جداگانه از سنتز صدای یکسان، هر بار به‌اشتباه شنیده — این یک ناسازگاری بین این صدای مصنوعی و همین کلمهٔ کوتاه است، نه یک تلفظ غلط واقعی در متن.
همین جمله را با معنی دقیقاً یکسان بازنویسی کن، طوری‌که کلمهٔ «${words}» به‌همین شکل کوتاه و مجزا در آن نیاید — شکل بلندتر یا صرف‌شدهٔ همان کلمه، یا مترادف دقیق آن، قابل قبول است. طول و لحن پرانرژی جمله را حفظ کن و هیچ مفهوم آموزشی دیگری را حذف نکن.
فقط یک JSON با همین یک کلید بده، بدون هیچ متن دیگر: {"rewritten": "جملهٔ بازنویسی‌شده"}`;
}

function isPlausibleRewording(original, rewritten, persistentWords) {
  if (!rewritten || rewritten === original) return false;
  if (/[a-zA-Z]/.test(rewritten)) return false; // must stay Persian
  if (rewritten.length < original.length * 0.5 || rewritten.length > original.length * 2) return false; // degenerate-length guard
  for (const word of persistentWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|\\s)${escaped}(\\s|$)`, "u").test(rewritten)) return false; // the failing word must actually be gone
  }
  return true;
}

/**
 * @param {{sentence:string, persistentWords:string[], topic:string}} args
 * @returns {Promise<string|null>} a validated rewording, or null if no
 *   provider is configured, both failed, or the result didn't pass the
 *   plausibility checks above — never a guess presented as confident.
 */
export async function rewordPersistentWord({ sentence, persistentWords, topic }) {
  const prompt = rewordPrompt(sentence, persistentWords, topic);
  let rewritten = null;
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    try { rewritten = parseRewordVerdict(await askGemini(prompt)); } catch { /* fall through to Groq */ }
  }
  if (!rewritten && process.env.GROQ_API_KEY) {
    try { rewritten = parseRewordVerdict(await askGroq(prompt)); } catch { /* no provider answered */ }
  }
  if (!isPlausibleRewording(sentence, rewritten, persistentWords)) return null;
  return rewritten;
}

/**
 * Replace an exact, unique occurrence of `oldText` with `newText` in `file`
 * so a recovered wording survives the next build instead of only fixing the
 * clip in memory for this one render. Refuses to guess: 0 or 2+ occurrences
 * both return false rather than touching the wrong (or every) match.
 * @returns {boolean} whether the file was patched
 */
export function patchSourceText(file, oldText, newText) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    return false;
  }
  if (content.split(oldText).length - 1 !== 1) return false;
  writeFileSync(file, content.replace(oldText, newText));
  return true;
}
