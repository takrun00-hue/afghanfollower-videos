// One command parser, shared by the local bot and the cloud listener so the two
// can never drift apart.
//
// Matching is by CONTAINMENT, not prefix. Real messages are phrased naturally —
// "ویدیوی تیک تاک بساز", "یک انستا برام بساز" — and a prefix match silently
// ignored all of them, which looked like the bot was broken.
//
// Order matters: a message naming a platform AND the word "بساز" means that one
// platform, so the specific checks run before the catch-all.

// strip a leading slash and normalise the zero-width non-joiner, so "تیک‌تاک"
// and "تیک تاک" are the same string
export const normalize = (t) =>
  (t || "").trim().replace(/^\//, "").replace(/‌/g, " ").replace(/\s+/g, " ").toLowerCase();

const ANY = (c, ...words) => words.some((w) => c.includes(w));

export const COMMANDS = [
  {
    // "خبر: تیتر | جمله | جمله" — the user supplies the story and we build it.
    // Checked first: this one carries its own payload and must never be read as
    // a request for the weekly research digest.
    action: "news-text",
    label: "ویدیو از متن خبر",
    test: (c) => /^خبر\s*[:：]/.test(c) || /^news\s*:/.test(c),
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
    action: "undo",
    label: "حذف آخرین ارسال‌ها",
    // FIRST: deleting is a different intent from building, so "تیک‌تاک را پاک کن"
    // must not be read as a request to make another TikTok video
    test: (c) => ANY(c, "پاک کن", "حذف کن", "پاکش کن", "delete", "undo"),
  },
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
    action: "research",
    label: "گزارش آپدیت‌ها",
    test: (c) => ANY(c, "تحقیق", "اپدیت", "آپدیت", "research") || c.trim() === "خبر",
  },
  {
    action: "status",
    label: "وضعیت",
    test: (c) => ANY(c, "وضعیت", "status"),
  },
  {
    action: "help",
    label: "راهنما",
    test: (c) => ANY(c, "راهنما", "کمک", "help", "start"),
  },
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
  "🤖 <b>افغان فالورز — دستورها</b>\n\n" +
  "🎬 <b>ساخت ویدیو</b>\n" +
  "• <b>تیک‌تاک بساز</b> — فقط ویدیوی تیک‌تاک\n" +
  "• <b>انستا بساز</b> — فقط ویدیوی اینستاگرام\n" +
  "• <b>ابزار بساز</b> — فقط ویدیوی ابزارها\n" +
  "• <b>بساز</b> — هر ۳ ویدیوی امروز\n\n" +
  "🔎 <b>بقیه</b>\n" +
  "• <b>خبر</b> — آپدیت‌های تازه‌ای که هنوز ویدیو نشده‌اند\n" +
  "• <b>وضعیت</b> — بررسی سیستم\n" +
  "• <b>راهنما</b> — همین پیام\n\n" +
  "جمله را هر طور خواستی بنویس — «یک ویدیوی تیک تاک برایم بساز» هم کار می‌کند.\n" +
  "ساخت در فضای ابری انجام می‌شود؛ کامپیوتر لازم نیست روشن باشد.";
