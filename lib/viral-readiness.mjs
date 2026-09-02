// Editorial readiness gate for a *draft*, not a predictor of reach.
// It protects the parts the channel controls before a video is rendered.

const strip = (value) => String(value || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const words = (value) => strip(value).split(/\s+/).filter(Boolean);
const has = (value, expression) => expression.test(strip(value));

export function reviewViralReadiness({ hook, tips = [], outroAsk, source } = {}) {
  const text = strip(typeof hook === "object" ? (hook?.ask || `${hook?.l1 || ""} ${hook?.l2 || ""}`) : hook);
  const notes = [];
  const blockers = [];
  let score = 100;

  if (!text) {
    blockers.push("قلاب خالی است؛ پیش‌نویس بدون دلیلِ توقف اسکرول منتشر نمی‌شود.");
    score = 0;
  }
  if (has(text, /(تضمین|قطعی|صددرصد|100\s*%|حتماً\s*(وایرال|ویو)|وایرال\s*شو)/i)) {
    blockers.push("قلاب وعدهٔ تضمینی می‌دهد. نتیجه را به «افزایش احتمال» یا یک اقدام قابل‌انجام تبدیل کن.");
    score -= 45;
  }
  if (has(text, /(دو|چند)\s*برابر\s*(ویو|بازدید|فروش|درآمد)/i)) {
    notes.push("ادعای «چندبرابر» نیازمند منبع رسمیِ تاریخ‌دار و شرایط روشن است؛ در غیر این صورت حذفش کن.");
    score -= 18;
  }
  // A feature can improve access to a video, but it cannot honestly promise
  // that unknown viewers will watch to the end. Treating an imagined retention
  // result as the premise of a hook is misleading and produced vague hooks
  // such as «چرا بعضی ویدیوها را ... تا آخر تماشا می‌کنند؟».
  if (has(text, /(بعضی|برخی|همه|مردم|مخاطب).{0,48}(تا آخر|تا پایان).{0,24}(تماشا|می[‌\s]?بین|نگه می[‌\s]?دار)/i)) {
    blockers.push("قلاب یک رفتار یا Retention اثبات‌نشده را به قابلیت نسبت می‌دهد. به یک درد یا فایدهٔ قابل‌وفا بازنویسی‌اش کن.");
    score -= 35;
  }

  const hookWords = words(text).length;
  if (hookWords > 17) {
    notes.push(`قلاب ${hookWords} واژه دارد؛ برای سه ثانیه، آن را به حداکثر ۱۷ واژه کوتاه کن.`);
    score -= 12;
  }
  if (!has(text, /ویو|بازدید|دیده|مخاطب|فالوور|فروش|مشتری|درآمد|زمان|سریع|Search|جستجو|کامنت|محتوا|ویدیو/i)) {
    notes.push("منفعت مخاطب در قلاب روشن نیست؛ یک درد، نتیجه یا تضاد مشخص اضافه کن.");
    score -= 10;
  }
  if (!Array.isArray(tips) || tips.length < 2) {
    blockers.push("بدنهٔ آموزش باید دست‌کم دو گام قابل‌اجرا داشته باشد.");
    score -= 30;
  }
  const actionSteps = (tips || []).filter((tip) => /بزن|برو|باز کن|انتخاب کن|بنویس|بگذار|بررسی کن|تست کن|بساز|اضافه کن/i.test(strip(tip?.head || tip?.text || tip))).length;
  if (tips.length && actionSteps < Math.min(2, tips.length)) {
    notes.push("گام‌ها بیشتر توضیح‌اند تا اقدام. دست‌کم دو گام را با یک عمل یا مسیر واقعی بنویس.");
    score -= 10;
  }
  const cta = strip(outroAsk);
  if (!cta) {
    notes.push("پایانِ گفتگو‌ساز ندارد؛ یک سؤال مشخص یا کلمهٔ کامنتی با ارزش واقعی اضافه کن.");
    score -= 15;
  } else if (has(cta, /لایک|فالو|دنبال\s*کن/i)) {
    notes.push("CTA باید گفت‌وگو بسازد، نه درخواست لایک یا فالو. یک سؤال مشخص جایگزین کن.");
    score -= 12;
  }
  if (!source) {
    notes.push("برای ادعای زمان‌حساس یا ویژگی پلتفرم، منبع رسمیِ بررسی‌شده را در پیش‌نویس ثبت کن.");
    score -= 5;
  }

  score = Math.max(0, score);
  return { score, status: blockers.length ? "blocked" : score >= 80 ? "ready" : "needs-review", blockers, notes };
}
