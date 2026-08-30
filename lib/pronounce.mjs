// Pronunciation fixes for the TTS voice.
// The chosen voice is not Persian-native, so a handful of loanwords come out
// wrong. Respelling them phonetically (in Persian letters) makes the engine say
// them correctly, while the ON-SCREEN text keeps its normal spelling — only the
// spoken copy is rewritten.
//
// Add a pair here whenever a word is reported as mispronounced.
const FIXES = [
  // Brand: keep the written English name, but pronounce it naturally in Persian.
  ["GapMedia", "گپ مدیا"],
  ["گپ مدیا", "گَپ مِدیا"],
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
// A zero-width non-joiner separates letters INSIDE one word: «می‌کند» is one
// word, spoken as one. Turning it into a space made it two, and the engine then
// put a gap between «می» and «کند» — the word-by-word delivery that makes
// narration sound like a machine reading rather than a person explaining.
//
// The prefixes and suffixes below are bound morphemes: they are never their own
// word, so joining them is always right. Anything else keeps the space, because
// a ZWNJ also joins genuinely separate words in compounds like «تیک‌تاک», and
// those do want a boundary.
const JOIN_BEFORE = /(می|نمی|بی)‌/g;                       // verb and adjective prefixes
const JOIN_AFTER = /‌(ها|های|هایی|هایت|ات|اش|تر|ترین|شان|مان|تان)\b/g;   // plural, comparative, possessive

const normalise = (s) => String(s)
  .replace(JOIN_BEFORE, "$1")
  .replace(JOIN_AFTER, "$1")
  .replace(/‌/g, " ")
  .replace(/\s+/g, " ")
  .trim();

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
// Persian numerals as spoken words, for any whole number the narration can
// realistically carry (follower counts, view counts, hours, study sizes).
const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];

function under1000(n) {
  const parts = [];
  if (n >= 100) { parts.push(HUNDREDS[Math.floor(n / 100)]); n %= 100; }
  if (n >= 10 && n < 20) parts.push(TEENS[n - 10]);
  else {
    if (n >= 20) { parts.push(TENS[Math.floor(n / 10)]); n %= 10; }
    if (n > 0) parts.push(ONES[n]);
  }
  return parts.join(" و ");
}

export function persianNumberWords(digits) {
  const n = Number(String(digits).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  if (!Number.isFinite(n)) return String(digits);
  if (n === 0) return "صفر";
  // Past a million the spoken form stops being useful in a 15-second video, and
  // a wrong reading is worse than the digits — leave those alone.
  if (n >= 1_000_000) return String(digits);
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const words = [];
  if (th === 1) words.push("هزار");
  else if (th > 1) words.push(`${under1000(th)} هزار`);
  if (rest) words.push(under1000(rest));
  return words.join(" و ");
}

export function minimaxSpeakable(text) {
  let out = normalise(text)
    // The video card can carry labels, URLs and parenthetical guidance.  The
    // narrator should tell the idea naturally, not read page furniture aloud.
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, " ")
    .replace(/^\s*[•\-–—]+\s*/g, " ")
    .replace(/[«»*_]/g, " ")
    // Say familiar product paths as one Persian phrase. Leaving English words
    // beside Persian words makes the engine insert a pause that is not present
    // in the sentence and breaks the rhythm of the narration.
    .replace(/\bCreator\s+Search\s+Insights\b/gi, "کریتر سرچ اینسایتس")
    .replace(/\bSearch\s+analytics\b/gi, "سرچ اَنالیتیکس")
    .replace(/\b(?:TikTok\s+Search|Search\s+TikTok)\b/gi, "سرچ تیک تاک")
    .replace(/\bContent\s+gap\b/gi, "کانتنت گَپ")
    .replace(/\bTikTok\b/gi, "تیک تاک")
    .replace(/\bInstagram\b/gi, "اینستاگرام")
    .replace(/\bSearch\b/gi, "سرچ")
    .replace(/\bInsights?\b/gi, "اینسایتس")
    .replace(/\bWatch\s+time\b/gi, "واچ تایم")
    .replace(/\bRetention\b/gi, "ریتِنشن")
    // Persian platform names are also simplified in the private spoken copy.
    // «ریلز خودت را» is read more fluently as «ریل را» by this voice.
    .replace(/ریلز\s+(?:خودت\s+)?را/g, "ریل را")
    .replace(/ویدیوی\s+خودت\s+را/g, "ویدیو را")
    .replace(/\bView\b/gi, "ویو")
    .replace(/\bReels?\b/gi, "ریل")
    .replace(/\bEdit\b/gi, "ادیت")
    .replace(/\bSave\b/gi, "سیو")
    // «شیر» is milk, or a lion. The kasra separates the loanword from both, and
    // the multi-word buttons are said as one phrase — half-Persian half-Latin
    // ("شیر with everyone") made the voice change language mid-instruction.
    .replace(/\bShare with everyone\b/gi, "شِیر ویت اِوری وان")
    .replace(/\bAdd media\b/gi, "اَد مِدیا")
    .replace(/\bTrial reels?\b/gi, "ترایَل ریل")
    .replace(/\bTrial\b/gi, "ترایَل")
    .replace(/\bNext\b/gi, "نِکست")
    .replace(/\bCaption\b/gi, "کَپشِن")
    .replace(/\bEligibility\b/gi, "اِلیجیبیلیتی")
    .replace(/\bQualified\b/gi, "کوالیفاید")
    .replace(/\bCreator Rewards\b/gi, "کریتور ریواردز")
    .replace(/\bShare\b/gi, "شِیر")
    // These separators create a brief natural boundary without inserting the
    // long, theatrical pauses that made the previous narration feel stretched.
    .replace(/[؛:]/g, "،")
    .replace(/\s*([؟!.])\s*/g, "$1 ");
  // Speech stays faithful to the written meaning, but common stiff written
  // forms are eased into ordinary Persian delivery. These replacements are
  // intentionally small: they remove robotic formality without inventing new
  // claims or changing an instruction.
  const NATURAL_PERSIAN = [
    ["می‌خواهید", "می خواین"],
    ["می خواهید", "می خواین"],
    ["می‌توانید", "می تونین"],
    ["می توانید", "می تونین"],
    ["بروید", "برین"],
    ["بزنید", "بزنین"],
    ["کنید", "کنین"],
    ["خود را", "خودتون رو"],
  ];
  for (const [from, to] of NATURAL_PERSIAN) out = out.split(from).join(to);
  // Keep Afghan/Dari wording on screen, but add only pronunciation marks to
  // the private TTS copy. MiniMax otherwise can misread «دقیق» as «دقیقه».
  // Ordered longest first so «دقیقاً» stays a single spoken word.
  // The engine read «۲۰۰» as «دو هزار». It is guessing at digits in a language
  // it does not natively speak, and a wrong number is the one narration error
  // that changes what the video claims — so numbers are written as words in the
  // spoken copy while the card on screen keeps the digits.
  //
  // Spelled out properly rather than looked up in a table: a table replaces
  // substrings, and «۴۸۹۳» would come out as «چهل و هشت۹۳».
  out = out.replace(/[۰-۹0-9]+/g, (digits) => persianNumberWords(digits));

  const PERSIAN_TTS_FIXES = [
    // A possessive «ـت» stuck to a word that ends in a vowel is where this voice
    // breaks worst: «ویوهایت» and «ویدیویت» came out as something else entirely.
    // Marking the vowel fixes it; SPLITTING it off does not — a space makes the
    // engine read two words, which is the separated delivery it was meant to cure.
    ["ویوهایت", "ویوهایَت"],
    ["ویوهای", "ویوهایِ"],
    ["ویدیوهایت", "ویدیوهایَت"],
    ["ویدیوهای", "ویدیوهایِ"],
    ["ویدیویت", "ویدیویَت"],
    ["ریلزت", "ریلزَت"],
    ["پیجت", "پِیجَت"],
    ["کپشنت", "کَپشِنَت"],
    ["اصلاً", "اَصلَن"],
    ["واجدشرایط", "واجِدِشَرایِط"],
    ["واجد شرایط", "واجِدِشَرایِط"],
    // Ezafe the writing leaves out. Only pairs that actually occur in the
    // narration are listed: a general rule would add the vowel where Persian
    // does not take one, and a wrong ezafe is worse than a missing one.
    ["زمان تماشا", "زمانِ تماشا"],
    ["افت مخاطب", "افتِ مخاطب"],
    ["افت بیننده", "افتِ بیننده"],
    ["نرخ تعامل", "نرخِ تعامل"],
    ["ساعت اوج", "ساعتِ اوج"],
    ["دقیقاً", "دَقیقَن"],
    ["دقیق", "دَقیق"],
    ["ویوَت", "ویو اَت"],
    ["ویوت", "ویو اَت"],
    ["ریتِنشن", "ریتِنشِن"],
    ["ریتنشن", "ریتِنشِن"],
  ];
  {
    const byLength = [...PERSIAN_TTS_FIXES].sort((a, b) => b[0].length - a[0].length);
    const table = new Map(byLength);
    const pattern = new RegExp(byLength.map(([k]) => k.replace(/[.*+?^${}()|[]\]/g, "\  for (const [from, to] of PERSIAN_TTS_FIXES) out = out.split(from).join(to);")).join("|"), "g");
    out = out.replace(pattern, (m) => table.get(m) ?? m);
  }
  return normalise(out);
}
