// Topic templates for news videos.
//
// A story about a deportation flight and a story about a residence permit are
// not the same kind of thing and must not look or sound the same. Each topic
// carries its own palette, mood, illustrations and framing, chosen from the
// text of the story itself.
//
// Every template also carries the line the video must not omit. For anything
// touching someone's legal status, that is: this is news, not legal advice.

export const TOPICS = {
  deport: {
    fa: "اخراج و بازگرداندن",
    ink: { pair: ["#12171F", "#E01B26"], paper: "#F2F1EF", tint: "rgba(224,27,38,.07)" },
    mood: "news",
    art: ["plane", "decree", "family", "timeline"],
    kicker: "اخراج",
    disclaimer: "این خبر است، نه مشاورهٔ حقوقی. برای پروندهٔ خودت با وکیل مشورت کن.",
    match: ["اخراج", "دیپورت", "بازگرداندن", "پرواز", "بازداشت", "deport", "abschieb"],
  },
  court: {
    fa: "دادگاه و رأی",
    ink: { pair: ["#191F29", "#E01B26"], paper: "#F2F1EF", tint: "rgba(224,27,38,.07)" },
    mood: "news",
    art: ["court", "decree", "timeline", "family"],
    kicker: "دادگاه",
    disclaimer: "این خبر است، نه مشاورهٔ حقوقی. برای پروندهٔ خودت با وکیل مشورت کن.",
    match: ["دادگاه", "رأی", "حکم", "قاضی", "شکایت", "قانون اساسی", "court", "gericht", "urteil"],
  },
  visa: {
    fa: "ویزا و اقامت",
    ink: { pair: ["#0E1319", "#E01B26"], paper: "#F2F1EF", tint: "rgba(224,27,38,.07)" },
    mood: "news",
    art: ["decree", "timeline", "family", "court"],
    kicker: "ویزا",
    disclaimer: "این خبر است، نه مشاورهٔ حقوقی. شرایط هر پرونده فرق می‌کند.",
    match: ["ویزا", "اقامت", "پذیرش", "پناهندگی", "درخواست", "تمدید", "visa", "asyl", "aufenthalt"],
  },
  police: {
    fa: "پولیس و امنیت",
    ink: { pair: ["#151B24", "#C81420"], paper: "#F2F1EF", tint: "rgba(224,27,38,.07)" },
    mood: "news",
    art: ["shield", "decree", "family", "timeline"],
    kicker: "پولیس",
    disclaimer: "این خبر است. اتهام تا زمان حکم دادگاه، اثبات‌شده نیست.",
    match: ["پولیس", "پلیس", "امنیت", "کنترل", "بازرسی", "polizei", "police"],
  },
  crime: {
    fa: "حادثه و جرم",
    ink: { pair: ["#101418", "#C81420"], paper: "#F2F1EF", tint: "rgba(224,27,38,.07)" },
    mood: "news",
    art: ["shield", "court", "timeline", "family"],
    kicker: "حادثه",
    // Crime reporting about a minority is where a channel does real damage if it
    // is careless. Presumption of innocence stated on every one, and never
    // generalise from an individual to a community.
    disclaimer: "اتهام تا حکم قطعی دادگاه اثبات‌شده نیست. رفتار یک نفر به کل یک جامعه ربط ندارد.",
    match: ["جرم", "حمله", "قتل", "دزدی", "چاقو", "متهم", "kriminal", "angriff"],
  },
  rights: {
    fa: "حقوق و کار",
    ink: { pair: ["#161C25", "#E01B26"], paper: "#F2F1EF", tint: "rgba(224,27,38,.07)" },
    mood: "news",
    art: ["decree", "family", "timeline", "court"],
    kicker: "حقوق",
    disclaimer: "این خبر است. برای پروندهٔ خودت از مشاور رسمی کمک بگیر.",
    match: ["کار", "شغل", "حقوق", "بیمه", "مکتب", "مدرسه", "زبان", "arbeit", "recht"],
  },
  general: {
    fa: "خبر",
    ink: { pair: ["#191F29", "#E01B26"], paper: "#F2F1EF", tint: "rgba(224,27,38,.07)" },
    mood: "news",
    art: ["decree", "timeline", "family", "court"],
    kicker: "خبر",
    disclaimer: "این خبر است، نه مشاورهٔ حقوقی.",
    match: [],
  },
};

// Which template a story belongs to, from its own words. Most specific wins:
// a court ruling about a deportation is a court story, not a deportation story,
// because what changed is the legal position.
const ORDER = ["court", "deport", "visa", "police", "crime", "rights"];

export function topicFor(headline, body = "") {
  // The headline says what the story IS; the body mentions everything around it.
  // Counting both equally made a deportation story about a rejected asylum case
  // come out as a visa story, because the body used more visa words.
  const h = String(headline || "").toLowerCase();
  const b = String(body || "").toLowerCase();
  let best = "general", bestScore = 0;
  for (const key of ORDER) {
    const m = TOPICS[key].match;
    const score = m.filter((w) => h.includes(w)).length * 3 + m.filter((w) => b.includes(w)).length;
    if (score > bestScore) { best = key; bestScore = score; }
  }
  return best;
}

// Trusted sources, Persian and Dari first.
//
// The German and English outlets were the wrong starting point: their stories
// have to be translated before they can be used, and a machine translation of a
// migration story is where errors become dangerous. These outlets already write
// for this audience, in this language, so the text can be quoted as it stands.
export const SOURCES = {
  amalFa:   { name: "امل (Amal)",           domain: "amalnews.de",       fa: true, germany: true },
  amalBer:  { name: "امل برلین",            domain: "amalberlin.de",     fa: true, germany: true },
  amalHam:  { name: "امل هامبورگ",          domain: "amalhamburg.de",    fa: true, germany: true },
  bbcDari:  { name: "BBC دری",              domain: "bbc.com",           fa: true },
  dwFa:     { name: "DW فارسی/دری",         domain: "dw.com",            fa: true },
  afintl:   { name: "افغانستان اینترنشنال", domain: "afintl.com",        fa: true },
  did:      { name: "خبرگزاری دید",         domain: "didpress.com",      fa: true },
  euronews: { name: "یورونیوز فارسی",       domain: "parsi.euronews.com", fa: true },
  iranintl: { name: "ایران اینترنشنال",     domain: "iranintl.com",      fa: true },
  etilaat:  { name: "اطلاعات روز",          domain: "etilaatroz.com",    fa: true },
  hasht:    { name: "۸صبح",                 domain: "8am.media",         fa: true },
  // German-language, used to confirm a story or when the Persian outlets are silent
  handbook:  { name: "Handbook Germany",   domain: "handbookgermany.de" },
  tagesschau:{ name: "Tagesschau",         domain: "tagesschau.de" },
  proasyl:   { name: "Pro Asyl",           domain: "proasyl.de" },
};

export const SOURCE_DOMAINS = Object.values(SOURCES).map((s) => s.domain);
// Persian-first: these are searched before anything needing translation.
export const DE_DOMAINS = Object.values(SOURCES).filter((s) => s.germany).map((s) => s.domain);
export const FA_DOMAINS = Object.values(SOURCES).filter((s) => s.fa).map((s) => s.domain);

// Two beats, because they answer different questions.
//
// A search alone is not enough: asking for "Afghan migrants in Germany" also
// returns anti-Taliban protests and Afghan domestic politics, which are not what
// someone opening a Germany bulletin wants. Each scope therefore has to MATCH on
// its own terms, and the migration scope also has to look like migration rather
// than general Afghanistan news.
export const SCOPES = {
  germany: {
    fa: "آلمان",
    query:
      "خبر تازهٔ آلمان که بر زندگی مهاجران و پناهجویان افغان اثر دارد: اقامت، پناهندگی، ویزا، " +
      "اجازهٔ کار، کمک‌هزینه، مسکن، مدرسه و تحصیل، زبان و ادغام، تابعیت، پیوستن خانواده، " +
      "دادگاه، حقوق، امنیت و اخراج",
    // the story has to be about Germany, not merely mention it in passing
    must: ["آلمان", "برلین", "آلمانی", "دوبرینت", "مرتس", "بامف", "بوندس", "germany", "deutschland"],
    label: "🇩🇪 خبر آلمان",
  },
  europe: {
    fa: "اروپا و مهاجرت",
    query:
      "خبر فوری دربارهٔ مهاجران و پناهجویان افغان در اروپا: اتحادیه اروپا، اخراج، " +
      "پناهندگی، مرز، یونان، هالند، سویدن، اتریش، بریتانیا، دادگاه اروپا",
    must: [
      "اروپا", "اتحادیه اروپا", "یونان", "هالند", "هلند", "سویدن", "سوئد", "اتریش",
      "بریتانیا", "فرانسه", "ایتالیا", "بلجیم", "بلژیک", "دنمارک", "ناروی", "نروژ",
      "بروکسل", "europe", "eu",
    ],
    label: "🇪🇺 خبر اروپا و مهاجرت",
  },
};

// Every story in either bucket has to be about migration, or it is Afghan
// domestic news that happens to rank well.
// A Germany story belongs here when it materially affects migrants' daily life —
// not only deportation. The country check below still rejects unrelated news.
export const MIGRATION_WORDS = [
  "مهاجر", "پناهجو", "پناهندگی", "اخراج", "دیپورت", "اقامت", "ویزا", "بازگشت",
  "بازگرداندن", "مرز", "اردوگاه", "کمپ", "لجوء", "asyl", "migrant", "refugee", "deport",
  "اجازه کار", "کار", "بیکاری", "کمک هزینه", "کمک‌هزینه", "جوب سنتر", "jobcenter", "bürgergeld",
  "مسکن", "اجاره", "خانه", "مدرسه", "تحصیل", "دانشگاه", "زبان", "ادغام", "integration",
  "تابعیت", "شهروندی", "پیوستن خانواده", "خانواده", "حقوق", "تبعیض", "امنیت",
];
export function inScope(scopeKey, title, text = "") {
  const hay = (String(title) + " " + String(text)).toLowerCase();
  const sc = SCOPES[scopeKey];
  if (!sc) return true;
  const place = sc.must.some((w) => hay.includes(w.toLowerCase()));
  const migration = MIGRATION_WORDS.some((w) => hay.includes(w.toLowerCase()));
  return place && migration;
}

