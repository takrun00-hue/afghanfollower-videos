// Narration script per feature — one spoken line per scene.
// Standard (not colloquial) Persian: the engine pronounces full forms far more
// reliably than clipped speech, and it reads as more professional. Commas are
// used sparingly — every comma is a pause, and too many pauses kill the pace.
import { packForFeature } from "./content.mjs";
import { existsSync, readFileSync } from "node:fs";

const VO = {
  collab: {
    hook: "می‌خواهید پست شما روی دو پیج نشان داده شود؟",
    steps: [
      "ابتدا پست یا ریلز خود را بسازید و به صفحهٔ آخر بروید.",
      "روی گزینهٔ تگ کردن افراد بزنید.",
      "سپس دعوت از همکار را انتخاب کنید.",
      "پیج طرف مقابل را بزنید. پس از تأیید او پست روی هر دو پیج می‌آید.",
    ],
    outro: "برای ترفندهای بیشتر گپ مدیا را دنبال کنید.",
  },
  "hidden-words": {
    hook: "کامنت‌های آزاردهنده شما را اذیت می‌کنند؟",
    steps: [
      "به تنظیمات پیج خود بروید.",
      "بخش کلمات پنهان را باز کنید.",
      "گزینهٔ پنهان کردن کامنت‌های آزاردهنده را روشن کنید.",
      "کلمه‌های دلخواه خود را اضافه کنید تا خودکار پنهان شوند.",
    ],
    outro: "برای ترفندهای بیشتر گپ مدیا را دنبال کنید.",
  },
  "reels-template": {
    hook: "می‌خواهید بدون تدوین یک ریلز حرفه‌ای بسازید؟",
    steps: [
      "یک ریلز که می‌پسندید را باز کنید.",
      "گزینهٔ استفاده از قالب را بزنید.",
      "عکس‌ها یا ویدیوهای خود را انتخاب کنید.",
      "منتشر کنید. برش‌ها و ریتم از قبل آماده است.",
    ],
    outro: "برای ترفندهای بیشتر گپ مدیا را دنبال کنید.",
  },
  "reply-video": {
    hook: "می‌خواهید از کامنت‌ها ایدهٔ محتوا بگیرید؟",
    steps: [
      "زیر ویدیو بخش کامنت‌ها را باز کنید.",
      "کنار کامنت آیکون دوربین را بزنید.",
      "ویدیوی پاسخ خود را ضبط کنید.",
      "کامنت مانند استیکر روی ویدیو نشان داده می‌شود.",
    ],
    outro: "برای ترفندهای بیشتر گپ مدیا را دنبال کنید.",
  },
  qa: {
    hook: "می‌خواهید مخاطب برای شما سوژه بسازد؟",
    steps: [
      "به پروفایل و بخش ابزارهای سازنده بروید.",
      "قابلیت پرسش و پاسخ را روشن کنید.",
      "مخاطبان سؤال‌های خود را می‌فرستند.",
      "روی هر سؤال بزنید و با ویدیو پاسخ دهید.",
    ],
    outro: "برای ترفندهای بیشتر گپ مدیا را دنبال کنید.",
  },
  "photo-mode": {
    hook: "بدون دوربین هم می‌توانید محتوا بسازید.",
    steps: [
      "دکمهٔ مثبت را بزنید.",
      "به تب عکس بروید.",
      "چند عکس مرتبط انتخاب کنید.",
      "صدا و متن اضافه کنید و منتشر کنید.",
    ],
    outro: "برای ترفندهای بیشتر گپ مدیا را دنبال کنید.",
  },
  upscayl: {
    hook: "می‌خواهید عکس کم‌کیفیت خود را واضح کنید؟",
    steps: [
      "برنامهٔ رایگان اپ‌سکیل را نصب کنید.",
      "عکس کم‌کیفیت را در آن باز کنید.",
      "حالت کلان‌نمایی را انتخاب کنید.",
      "فایل را ذخیره کنید. عکس واضح‌تر و کلان‌تر می‌شود.",
    ],
    outro: "برای اپ‌های بیشتر گپ مدیا را دنبال کنید.",
  },
  removebg: {
    hook: "می‌خواهید پس‌منظر عکس را زود پاک کنید؟",
    steps: [
      "ویب‌سایت ریموو بی‌جی را باز کنید.",
      "عکس خود را آپلود کنید.",
      "پس‌منظر به شکل خودکار حذف می‌شود.",
      "از همین عکس در دیزاین کاور خود کار بگیرید.",
    ],
    outro: "برای اپ‌های بیشتر گپ مدیا را دنبال کنید.",
  },
  "capcut-captions": {
    hook: "بیشتر مردم ویدیو را بدون صدا می‌بینند.",
    steps: [
      "ویدیو را در کپ‌کات باز کنید.",
      "بخش زیرنویس را انتخاب کنید.",
      "زیرنویس خودکار ساخته می‌شود. سپس غلط‌ها را اصلاح کنید.",
      "قلم و رنگ را با پیج خود هماهنگ کنید.",
    ],
    outro: "برای اپ‌های بیشتر گپ مدیا را دنبال کنید.",
  },
};

const clean = (s) => String(s || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export function narrationFor(featureId) {
  if (VO[featureId]) return VO[featureId];
  // A fetched bulletin is written immediately before rendering. It is not part
  // of the permanent feature banks, so `packForFeature()` cannot find it. Read
  // the generated JSON here and speak the same headline and cards rendered in
  // this one news video.
  if (String(featureId).startsWith("news-") && existsSync("lib/generated/news-current.mjs")) {
    try {
      const raw = readFileSync("lib/generated/news-current.mjs", "utf8");
      const match = raw.match(/export const CURRENT_NEWS = ([\s\S]*?);\s*export const CURRENT_TOPIC/);
      const item = match ? JSON.parse(match[1]) : null;
      if (item?.id === featureId) {
        return {
          hook: clean(item.hook?.ask),
          steps: (item.steps || []).map((step) => clean(step.text)),
          outro: clean(item.outroAsk || "نظرت دربارهٔ این خبر چیست؟"),
        };
      }
    } catch {}
  }
  // Newly approved, research-driven features do not wait for a manually written
  // duplicate narration block. Their spoken copy follows the same hook and
  // exact in-app steps shown in the video, so audio and screen cannot drift.
  const pack = packForFeature(featureId, new Date());
  if (!pack) return null;
  return {
    hook: clean(pack.hook?.ask),
    steps: (pack.tips || []).map((tip) => clean(tip.head)),
    outro: clean(pack.payoff || pack.outroAsk || "نتیجه را بررسی کنید و روش مناسب پیج خودتان را انتخاب کنید."),
  };
}
