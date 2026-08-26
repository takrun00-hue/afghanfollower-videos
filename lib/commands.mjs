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
    // "خبر" on its own asks the scanner to look now instead of waiting an hour
    action: "news-scan",
    label: "جستجوی خبر تازه",
    test: (c) => /^(خبر|اخبار|news|جستجو خبر)$/.test(c.trim()),
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
    test: (c) =>
      ANY(c, "خبر آلمان", "آلمان", "germany") || c.trim() === "خبر" || c.trim() === "اخبار",
  },

  // ── the tutorial channel ─────────────────────────────────────────────────
  {
    action: "tiktok",
    label: "تیک‌تاک",
    test: (c) => ANY(c, "تیک تاک", "تیکتاک", "tiktok", "tik tok"),
  },
  {
    action: "instagram",
    label: "اینستاگرام",
    test: (c) => ANY(c, "انستا", "اینستا", "insta"),
  },
  {
    action: "tools",
    label: "ابزارها",
    test: (c) => ANY(c, "ابزار", "tool", "هوش مصنوعی"),
  },
  {
    // the weekly digest of platform features worth turning into tutorials —
    // deliberately NOT reachable by the word "خبر"
    action: "research",
    label: "گزارش قابلیت‌های تازه",
    test: (c) => ANY(c, "تحقیق", "اپدیت", "آپدیت", "قابلیت تازه", "research"),
  },
  { action: "status", label: "وضعیت", test: (c) => ANY(c, "وضعیت", "status") },
  { action: "help", label: "راهنما", test: (c) => ANY(c, "راهنما", "کمک", "help", "start") },
  // catch-all: "بساز" with no platform named means all three
  {
    action: "all",
    label: "هر ۳ ویدیو",
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
  "🎬 <b>ویدیوهای آموزشی — افغان فالورز</b>\n" +
  "• <b>تیک‌تاک بساز</b> / <b>انستا بساز</b> / <b>ابزار بساز</b>\n" +
  "• <b>بساز</b> — هر ۳ ویدیوی امروز\n" +
  "• <b>فردا</b> — ویدیوهای فردا را از حالا\n" +
  "• <b>پاک کن</b> — حذف ۳ ویدیوی آموزشی آخر\n" +
  "• <b>تحقیق</b> — قابلیت‌های تازه‌ای که هنوز ویدیو نشده‌اند\n\n" +
  "📰 <b>ویدیوهای خبری — کانال جدا</b>\n" +
  "• <b>خبر</b> یا <b>خبر آلمان</b> — فهرست خبرهای آلمان\n" +
  "• <b>خبر اروپا</b> — خبرهای اروپا و مهاجرت\n" +
  "• <b>خبر ۲</b> / <b>اروپا ۲</b> — ساخت ویدیو از شمارهٔ فهرست\n" +
  "• <b>خبر فوری</b> — مستقیم از تازه‌ترین خبر\n" +
  "• <b>خبر: تیتر | جمله ۱ | جمله ۲ | جمله ۳</b> — از متن خودت\n" +
  "• <b>پاک کن خبر</b> — حذف آخرین ویدیوی خبری\n\n" +
  "دو بخش کاملاً جدا هستند: پوشه، نام فایل، برند، موزیک و طول ویدیو.\n" +
  "جمله را هر طور خواستی بنویس — «یک ویدیوی تیک تاک برایم بساز» هم کار می‌کند.";
