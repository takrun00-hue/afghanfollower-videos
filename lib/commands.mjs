// One command parser, shared by the local bot and the cloud listener so the two
// can never drift apart.
//
// Matching is by CONTAINMENT, not prefix. Real messages are phrased naturally —
// "ویدیوی تیک تاک بساز", "یک انستا برام بساز" — and a prefix match silently
// ignored all of them, which looked like the bot was broken.
//
// ORDER IS THE DESIGN. Three rules, learned from getting each one wrong:
//   1. Deleting comes before everything. "پاک کن خبر اروپا" is a delete, not a
//      request to build a Europe news video.
//   2. A message carrying its own payload ("خبر: …") comes before the plain
//      keyword, or the payload is thrown away.
//   3. A specific target beats a generic verb: "انستا بساز" builds Instagram
//      only, and a date word beats the platform.

// strip a leading slash and normalise the zero-width non-joiner, so "تیک‌تاک"
// and "تیک تاک" are the same string
export const normalize = (t) =>
  (t || "").trim().replace(/^\//, "").replace(/‌/g, " ").replace(/\s+/g, " ").toLowerCase();

const ANY = (c, ...words) => words.some((w) => c.includes(w));
const DELETE_WORDS = ["پاک کن", "حذف کن", "پاکش کن", "delete", "undo"];
const isDelete = (c) => ANY(c, ...DELETE_WORDS);

export const COMMANDS = [
  // ── deleting: always first ────────────────────────────────────────────────
  {
    action: "undo-news",
    label: "حذف آخرین ویدیوی خبری",
    test: (c) => isDelete(c) && ANY(c, "خبر", "اخبار", "news"),
  },
  {
    action: "undo",
    label: "حذف آخرین ارسال‌ها",
    test: isDelete,
  },

  // ── tutorial approval: this is the only educational render route ─────────
  {
    action: "voice-list",
    label: "فهرست صداهای MiniMax",
    test: (c) => ANY(c, "صداها", "صدا minimax", "minimax voice", "voice list"),
  },
  {
    // "تأیید تصویر <id> <شماره>" — approves one fetch-screens.mjs candidate.
    // Must sit above approved-feature: that pattern only matches a single
    // bare word after «تأیید», so it never collides with this one, but the
    // more specific pattern still goes first on principle.
    action: "approved-screen",
    label: "تصویر واقعی تأییدشده",
    test: (c) => /^(تایید|تأیید|approve)\s+تصویر\s+[a-z0-9-]+\s+[۰-۹0-9]+$/i.test(c.trim()),
  },
  {
    action: "approved-feature",
    label: "موضوع آموزشی تأییدشده",
    test: (c) => /^(تایید|تأیید|approve)\s+[a-z0-9-]+$/i.test(c.trim()),
  },

  // ── news: its own channel, nothing shared with the tutorials ─────────────
  {
    // "بساز ۳" — approve story 3 from the hourly scan. This must sit above the
    // build commands: the scan queues stories and sends them for a human to
    // read, and nothing is rendered until this arrives.
    action: "news-approve",
    label: "ساخت خبر تأییدشده",
    test: (c) => /^(بساز|تایید|تأیید|ok|build)\s*[۰-۹0-9]+$/.test(c.trim()),
  },
  {
    // A qualified news query searches live; it must be before country shortcuts.
    action: "news-search-live",
    label: "جستجوی زندهٔ خبر",
    test: (c) => /^(?:جستجو(?:ی)?\s+(?:خبر|اخبار))(?:\s+|\s*[:：]\s*).+$/.test(c.trim()),
  },
  {
    action: "amal-berlin",
    label: "خبرهای امل برلین",
    test: (c) => ANY(c, "امل برلین", "امال برلین", "amal berlin"),
  },
  {
    action: "amal-hamburg",
    label: "خبرهای امل هامبورگ",
    test: (c) => ANY(c, "امل هامبورگ", "امال هامبورگ", "amal hamburg"),
  },
  {
    action: "amal-frankfurt",
    label: "خبرهای امل فرانکفورت",
    test: (c) => ANY(c, "امل فرانکفورت", "امال فرانکفورت", "amal frankfurt"),
  },
  {
    action: "amal-farsi",
    label: "خبرهای امل فارسی",
    test: (c) => ANY(c, "امل فارسی", "امال فارسی", "amal farsi"),
  },
  {
    // Bare «خبر» always belongs to German Insider — never tutorial research.
    action: "news-scan",
    label: "جستجوی خبر تازه",
    test: (c) => /^(خبر|اخبار|جستجو(?:ی)?\s+(?:خبر|اخبار)|scan news)$/.test(c.trim()),
  },
  {
    // "خبر: تیتر | جمله | جمله" — carries its own story text
    action: "news-text",
    label: "ویدیو از متن خبر",
    test: (c) => /^(خبر|news)\s*[:：]/.test(c),
  },
  {
    action: "europe-pick",
    label: "ساخت از فهرست اروپا",
    test: (c) => /^(اروپا|europe)\s*[۰-۹0-9]+$/.test(c.trim()),
  },
  {
    action: "news-pick",
    label: "ساخت از فهرست خبر",
    test: (c) => /^(خبر|news)\s*[۰-۹0-9]+$/.test(c.trim()),
  },
  {
    action: "news-europe",
    label: "خبر اروپا و مهاجرت",
    test: (c) => ANY(c, "خبر اروپا", "اروپا", "europe"),
  },
  {
    action: "news-breaking",
    label: "خبر فوری",
    test: (c) => ANY(c, "خبر فوری", "فوری", "breaking"),
  },
  {
    action: "news-today",
    label: "خبر روز",
    test: (c) => ANY(c, "خبر روز", "خبر امروز", "اخبار روز", "news today"),
  },
  {
    // the bare word belongs to the news channel — it used to open the video
    // research digest, so asking for news returned a report about Instagram
    action: "news-germany",
    label: "خبر آلمان",
    test: (c) => ANY(c, "خبر آلمان", "آلمان", "germany"),
  },

  // ── the tutorial channel ─────────────────────────────────────────────────
  // Direct commands from Telegram build immediately. Topic planning remains
  // available through the explicit «موضوع فردا» and «برنامه هفته» commands.
  {
    action: "build-tiktok",
    label: "ویدیوی تیک‌تاک",
    test: (c) => ANY(c, "تیک تاک", "تیکتاک", "tiktok", "tik tok") && ANY(c, "بساز", "ساخت", "ویدیو", "make", "build"),
  },
  {
    action: "build-instagram",
    label: "ویدیوی اینستاگرام",
    test: (c) => ANY(c, "انستا", "اینستا", "instagram", "insta") && ANY(c, "بساز", "ساخت", "ویدیو", "make", "build"),
  },
  {
    action: "build-tools",
    label: "ویدیوی اپ و هوش مصنوعی",
    test: (c) => ANY(c, "ابزار", "هوش مصنوعی", "ai", "tool") && ANY(c, "بساز", "ساخت", "ویدیو", "make", "build"),
  },
  {
    action: "build-tomorrow",
    label: "ویدیوهای فردا",
    test: (c) => /^(فردا|برای فردا|فردا بساز)$/.test(c.trim()),
  },
  {
    action: "resend",
    label: "ارسال دوبارهٔ ویدیوهای امروز",
    test: (c) => /^(بفرست|ارسال کن|send)$/.test(c.trim()),
  },
  {
    action: "plan-week",
    label: "برنامهٔ موضوع‌های هفته",
    test: (c) => ANY(c, "برنامه هفته", "موضوعات هفته", "هفته") && !ANY(c, "خبر"),
  },
  {
    action: "plan-tomorrow",
    label: "موضوع‌های پیشنهادی فردا",
    test: (c) => ANY(c, "موضوع فردا", "برنامه فردا") && !ANY(c, "خبر"),
  },
  {
    action: "plan-tiktok",
    label: "موضوع‌های تیک‌تاک",
    test: (c) => ANY(c, "تیک تاک", "تیکتاک", "tiktok", "tik tok"),
  },
  {
    action: "plan-instagram",
    label: "موضوع‌های اینستاگرام",
    test: (c) => ANY(c, "انستا", "اینستا", "insta"),
  },
  {
    action: "plan-tools",
    label: "موضوع‌های اپ و هوش مصنوعی",
    test: (c) => ANY(c, "ابزار", "tool", "هوش مصنوعی"),
  },
  {
    // the weekly digest of platform features worth turning into tutorials —
    // deliberately NOT reachable by the word "خبر"
    action: "research",
    label: "گزارش قابلیت‌های تازه",
    test: (c) => ANY(c, "تحقیق", "اپدیت", "آپدیت", "قابلیت تازه", "research"),
  },
  {
    // The daily criteria-based, scored shortlist: not merely "what shipped"
    // (research, above) but "of what's out there, which candidate actually
    // clears the bar" — novelty + independent-source corroboration + a
    // clear-message check. "رادار" is a deliberately new word so it never
    // collides with "تحقیق"/"جستجوی محتوا"/etc., which already mean
    // something else.
    action: "content-radar",
    label: "رادار محتوا (گپ‌مدیا)",
    test: (c) => ANY(c, "رادار محتوا", "رادار موضوع", "content radar"),
  },
  {
    // Same mechanism, applied to German Insider: ranks news-scan.mjs's usual
    // candidates by how many independent outlets corroborate each story,
    // instead of only by recency.
    action: "news-radar",
    label: "رادار خبر (German Insider)",
    test: (c) => ANY(c, "رادار خبر", "news radar"),
  },
  { action: "status", label: "وضعیت", test: (c) => ANY(c, "وضعیت", "status") },
  { action: "help", label: "راهنما", test: (c) => ANY(c, "راهنما", "کمک", "help", "start") },
  // catch-all: "بساز" means all three current educational videos
  {
    action: "build-all",
    label: "هر ۳ ویدیوی امروز",
    test: (c) => ANY(c, "بساز", "ساخت", "همه", "هر سه", "make", "build"),
  },
];

// Returns { action, label } or null when nothing matched.
export function parseCommand(text) {
  const c = normalize(text);
  if (!c) return null;
  for (const cmd of COMMANDS) if (cmd.test(c)) return { action: cmd.action, label: cmd.label };
  return null;
}

export const HELP_TEXT =
  "🤖 <b>دستورها</b>\n\n" +
  "🔎 <b>پیشنهاد موضوع — پیش از هر ساخت</b>\n" +
  "• <b>موضوع فردا</b> / <b>برنامه فردا</b> — سه موضوع پیشنهادی، بدون ساخت\n" +
  "• <b>تیک تاک</b> / <b>انستا</b> / <b>ابزار</b> (بدون «بساز») — پیشنهاد همان دسته\n" +
  "• <b>برنامه هفته</b> — پیشنهاد هفتگی\n" +
  "• هر روز بدون درخواست شما هم خودکار پیشنهاد می‌شود: شنبه فقط تیک‌تاک، یکشنبه فقط اینستاگرام، بقیهٔ هفته ابزار/AI — نه هر روز هر دو با هم\n" +
  "• <b>تأیید &lt;شناسه&gt;</b> — ساخت همان موضوعِ تأییدشده (مثل «تأیید trial-reels»)\n" +
  "• <b>تأیید تصویر &lt;شناسه&gt; &lt;شماره&gt;</b> — تأیید یک تصویر واقعی که ربات فرستاده (مثل «تأیید تصویر trial-reels 2»)\n" +
  "• <b>صداها</b> — فهرست صداهای MiniMax\n\n" +
  "🎬 <b>ساخت مستقیم ویدیو</b>\n" +
  "• <b>تیک‌تاک بساز</b> — فقط ویدیوی تیک‌تاک\n" +
  "• <b>انستا بساز</b> — فقط ویدیوی اینستاگرام\n" +
  "• <b>ابزار بساز</b> — فقط ویدیوی ابزارها\n" +
  "• <b>بساز</b> — هر ۳ ویدیوی امروز\n" +
  "• <b>فردا</b> — ویدیوهای فردا را از حالا بساز\n\n" +
  "🔎 <b>بقیه</b>\n" +
  "• <b>رادار محتوا</b> — نامزدهای امروز، رتبه‌بندی‌شده به معیار (تازگی، منابع مستقل، پیام روشن)\n" +
  "• <b>رادار خبر</b> — خبرهای آلمان/اروپا، رتبه‌بندی‌شده به میزان خبرساز بودن\n" +
  "• <b>خبر</b> — آپدیت‌های تازه‌ای که هنوز ویدیو نشده‌اند\n" +
  "• <b>بفرست</b> — ساخت و ارسال دوبارهٔ ویدیوهای امروز\n" +
  "• <b>وضعیت</b> — وضعیت سیستم\n" +
  "• <b>راهنما</b> — همین فهرست\n\n" +
  "📰 <b>خبرهای German Insider</b>\n" +
  "• <b>خبر فوری</b> — ساخت فوری خبر کوتاه\n" +
  "• <b>خبر آلمان</b> / <b>خبر اروپا</b> — فهرست خبرهای تازه\n" +
  "• <b>بساز ۱</b> — ساخت خبر شمارهٔ ۱\n" +
  "• <b>پاک کن</b> — حذف ۳ ویدیوی آموزشی آخر\n\n" +
  "📰 <b>ویدیوهای خبری — کانال جدا</b>\n" +
  "• <b>خبر: تیتر | جمله ۱ | جمله ۲ | جمله ۳</b> — از متن خودت\n" +
  "• <b>پاک کن خبر</b> — حذف آخرین ویدیوی خبری\n\n" +
  "دو بخش کاملاً جدا هستند: پوشه، نام فایل، برند، موزیک و طول ویدیو.\n" +
  "جمله را هر طور خواستی بنویس — «یک ویدیوی تیک تاک برایم بساز» هم کار می‌کند.";

