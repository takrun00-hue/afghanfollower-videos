// Pronunciation fixes for the TTS voice.
// The chosen voice is not Persian-native, so a handful of loanwords come out
// wrong. Respelling them phonetically (in Persian letters) makes the engine say
// them correctly, while the ON-SCREEN text keeps its normal spelling — only the
// spoken copy is rewritten.
//
// Add a pair here whenever a word is reported as mispronounced.
const FIXES = [
  // Brand: written "افغان فالورز", spoken with a slightly drawn-out "افغاان"
  // and the fuller "فالوورز". Must stay first so it matches before any
  // single-word rule can touch part of it.
  ["افغان فالورز", "افغاان فالوورز"],
  ["پروفایل", "پُروفایْل"],
  ["اپ‌سکیل", "اَپ سْکِیل"],
  ["ریموو بی‌جی", "ریمُوو بی جی"],
  ["کپ‌کات", "کَپ کات"],
  ["ویب‌سایت", "وِب سایت"],
  ["آپلود", "آپ لُود"],
  ["دیزاین", "دیزایْن"],
  ["کلان‌تر", "کَلان تَر"],
  ["کلان‌نمایی", "کَلان نُمایی"],
  ["پس‌منظر", "پَس مَنظَر"],
  ["ریلز", "ریلْس"],
  ["کامنت", "کامِنت"],
  ["کامنت‌ها", "کامِنت ها"],
  ["کامنت‌های", "کامِنت های"],
  ["کامنت‌هاش", "کامِنت هاش"],
  ["استوری", "اِستوری"],
  ["پیج", "پِیج"],
  ["پست", "پُست"],
  ["تگ", "تَگ"],
  ["لایک", "لایْک"],
  ["کولب", "کُلَب"],
  ["کپ‌کات", "کَپ کات"],
  ["زیرنویس", "زیرنِویس"],
  ["دوربین", "دورْبین"],
  ["گزینهٔ", "گُزینه"],
  ["گزینه", "گُزینه"],
  ["صفحهٔ", "صَفحه"],
  ["همکار", "هَمکار"],
  ["مخاطب", "مُخاطَب"],
  ["ابزارهای", "اَبزارهای"],
  ["سازنده", "سازَنده"],
  ["بارگذاری", "بارگُذاری"],
  ["پس‌زمینه", "پَس زَمینه"],
  ["بی‌صدا", "بی صِدا"],
];

// zero-width non-joiner confuses the engine; a plain space reads better aloud
const normalise = (s) => String(s).replace(/‌/g, " ").replace(/\s+/g, " ").trim();

export function sayable(text) {
  let out = normalise(text);
  for (const [from, to] of FIXES) {
    out = out.split(from).join(to);
  }
  return normalise(out);
}

// MiniMax has Persian language support, unlike the old fallback engine. Its
// normal Persian orthography produces better Dari/Persian pronunciation than
// forcing vowel marks and phonetic spellings meant for that older engine.
export function minimaxSpeakable(text) {
  let out = normalise(text)
    .replace(/\bView\b/gi, "ویو")
    .replace(/\bReels?\b/gi, "ریل")
    .replace(/\bEdit\b/gi, "ادیت")
    .replace(/\bSave\b/gi, "سیو")
    .replace(/\bShare\b/gi, "شیر")
    // These separators create a brief natural boundary without inserting the
    // long, theatrical pauses that made the previous narration feel stretched.
    .replace(/[؛:]/g, "،")
    .replace(/\s*([؟!.])\s*/g, "$1 ");
  // Keep Afghan/Dari wording on screen, but add only pronunciation marks to
  // the private TTS copy. MiniMax otherwise can misread «دقیق» as «دقیقه».
  // Ordered longest first so «دقیقاً» stays a single spoken word.
  const PERSIAN_TTS_FIXES = [
    ["دقیقاً", "دَقیقَن"],
    ["دقیق", "دَقیق"],
    ["ویوَت", "ویو اَت"],
    ["ویوت", "ویو اَت"],
    ["ریتِنشن", "ریتِنشِن"],
    ["ریتنشن", "ریتِنشِن"],
  ];
  for (const [from, to] of PERSIAN_TTS_FIXES) out = out.split(from).join(to);
  return normalise(out);
}
