// The line that keeps the viewer past the hook.
//
// The hook asks or promises something; answering it right underneath ends the
// video there — the viewer got the point and scrolls. So the hook slide now
// withholds the answer and puts a nudge lower down instead: watch to the end.
//
// One fixed sentence would turn into wallpaper after three videos, so the line
// rotates deterministically per feature and uses the real step count when the
// video actually has steps — no invented numbers.
const NUDGES = [
  (n) => (n ? `در ${fa(n)} مرحله نشانت می‌دهم — تا آخر ببین` : "تا آخر ببین"),
  () => "جایش دقیقاً کجاست؟ تا آخر ویدیو",
  (n) => (n ? `مرحلهٔ ${fa(n)}ام را از دست نده` : "تا آخر با من بمان"),
  () => "تا آخر ببین، قدم‌به‌قدم می‌گویم",
  () => "کجا پیدایش کنی؟ در ادامه می‌گویم",
  (n) => (n ? `${fa(n)} مرحلهٔ ساده — تا آخر ویدیو` : "تا آخر ویدیو"),
];

const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

// same feature → same nudge on every render, different features → different nudges
const hash = (s) => {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
  return h;
};

// A news video has no steps to promise, and "مرحلهٔ آخر" would be nonsense over
// a deportation story. It gets its own set: what is still unsaid, said plainly.
const NEWS_NUDGES = [
  "جزئیات کامل را در ادامه ببین",
  "تا آخر ببین — جزئیات خبر را می‌گویم",
  "ادامهٔ خبر را از دست نده",
  "چه کسانی را شامل می‌شود؟ در ادامه",
];

export function retentionLineFor(pack) {
  if (pack.id === "saved-replies") return "تا آخر ببین؛ ۴ مرحله را می‌گویم.";
  if (pack.id === "ig-insights-retention") return "تا آخر ببین؛ علتش را پیدا می‌کنی.";
  // Requested verbatim for this one-off test video, not a rotated nudge.
  if (pack.id === "custom-tt-caption-lang") return "نکتهٔ اصلی را در آخر ببینید.";
  const key = `${pack.id || pack.hook?.badge || ""}${pack.platform || ""}`;
  if (pack.platform === "news") return NEWS_NUDGES[hash(key) % NEWS_NUDGES.length];
  const steps = Array.isArray(pack.tips) ? pack.tips.length : 0;
  return NUDGES[hash(key) % NUDGES.length](steps);
}
