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

  // German A1 lesson series (replaces the news channel, owner request
  // 2026-09-08). Narration stays deliberately Persian-only, describing each
  // word rather than pronouncing it — the German itself is read by the
  // viewer on screen (lib/german-a1.mjs + german-lesson-build.mjs), not
  // spoken by a Persian TTS voice, which has no verified German pronunciation
  // and per NARRATION_STANDARD.md/VOICE-LOG.md would need real testing
  // before ever being trusted with a second language.
  "a1-01-greetings": {
    hook: "با یک کلمه، اولین برخوردت به آلمانی حرفه‌ای می‌شود.",
    steps: [
      "برای سلام غیررسمی، همین یک کلمه کافی است؛ روی صفحه ببین و با صدای بلند تکرار کن.",
      "صبح‌ها، آلمانی‌زبان‌ها همین عبارت را برای سلام به کار می‌برند.",
      "این نسخهٔ رسمی‌تر است؛ در محیط کار یا با افراد غریبه از همین استفاده کن.",
      "برای خداحافظی غیررسمی، همین کلمه کافی است.",
    ],
    outro: "این چهار عبارت را چند بار با صدای بلند تکرار کن تا در ذهنت بماند.",
  },
  "a1-02-formal-informal": {
    hook: "یک اشتباه ساده می‌تواند مؤدبانه یا بی‌ادبانه به نظر برسد؛ تفاوتش را یاد بگیر.",
    steps: [
      "این سؤال را فقط با دوستان، هم‌سن‌ها یا بچه‌ها به کار ببر؛ غیررسمی است.",
      "این سؤال را با غریبه‌ها، بزرگ‌ترها یا در محیط کار به کار ببر؛ رسمی است.",
      "برای گفتن اسم خودت، همین جمله را در هر دو حالت، رسمی و غیررسمی، به کار می‌بری.",
      "برای پرسیدن همین سؤال از طرف مقابل، بسته به رسمی یا غیررسمی بودن مکالمه، یکی از این دو را انتخاب کن.",
    ],
    outro: "همیشه قبل از حرف زدن به آلمانی، اول تصمیم بگیر: رسمی یا غیررسمی؟",
  },
  "a1-03-politeness": {
    hook: "این ۴ کلمه هر مکالمه‌ای را مؤدبانه می‌کند.",
    steps: [
      "برای تشکر، همین کلمه را به کار ببر.",
      "در جواب تشکر، یا وقتی چیزی تعارف می‌کنی، همین کلمه را بگو.",
      "برای جلب توجه مؤدبانه یا عذرخواهی کوچک، همین کلمه کافی است.",
      "برای عذرخواهی رسمی‌تر، این جمله را به کار ببر.",
    ],
    outro: "این چهار کلمه را همین امروز در یک مکالمهٔ واقعی امتحان کن.",
  },
  "a1-04-numbers-1": {
    hook: "شمردن به آلمانی را از همین‌جا شروع کن.",
    steps: [
      "این دو عدد اول را با صدای بلند تکرار کن.",
      "این دو عدد بعدی را هم تکرار کن.",
      "این عدد را چند بار بخوان تا حفظ شوی.",
      "این عدد آخر را هم تمرین کن.",
    ],
    outro: "حالا از صفر تا پنج را به آلمانی می‌شماری.",
  },
  "a1-05-numbers-2": {
    hook: "تا ده به آلمانی بشمار، بدون مکث.",
    steps: [
      "این دو عدد را با صدای بلند تکرار کن.",
      "این عدد را چند بار بخوان.",
      "این عدد را هم تمرین کن.",
      "و این آخرین عدد این بخش است.",
    ],
    outro: "حالا از صفر تا ده را کامل به آلمانی می‌شماری.",
  },
  "a1-06-family": {
    hook: "با این ۴ کلمه، دربارهٔ خانواده‌ات آلمانی حرف بزن.",
    steps: [
      "این کلمه برای صدا کردن مادر است.",
      "این کلمه برای صدا کردن پدر است.",
      "این کلمه یعنی برادر.",
      "و این کلمه یعنی خواهر.",
    ],
    outro: "حالا می‌توانی اعضای نزدیک خانواده‌ات را به آلمانی معرفی کنی.",
  },
  "a1-07-question-words": {
    hook: "این ۴ کلمه، هر سؤالی را برایت ممکن می‌کند.",
    steps: [
      "این کلمه را اول جمله بگذار تا بپرسی «چه چیزی» است.",
      "این کلمه را برای پرسیدن مکان به کار ببر.",
      "این کلمه را برای پرسیدن زمان به کار ببر.",
      "و این کلمه را برای پرسیدن روش یا حال کسی به کار ببر.",
    ],
    outro: "با همین چهار کلمه، هر مکالمه‌ای را می‌توانی شروع کنی.",
  },
  "a1-08-sein": {
    hook: "مهم‌ترین فعل آلمانی را در ۴ جمله یاد بگیر.",
    steps: [
      "این شکل فعل برای «من» است.",
      "این شکل برای «تو» است.",
      "این شکل برای «او» است.",
      "و این شکل برای «ما» است.",
    ],
    outro: "این فعل در تقریباً هر جملهٔ آلمانی به کار می‌رود؛ خوب تمرینش کن.",
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
  // Text supplied through Telegram is stored as a generated feature. Read the
  // same hook and exact four steps so custom videos do not silently become
  // music-only because they are not in the permanent feature bank.
  // Match on the id stored in the file, not on the id's prefix. content-draft.mjs
  // writes a `draft-…` id into custom-current.mjs, so a prefix test missed it,
  // narrationFor returned null, and REQUIRE_VOICE=on turned that into a hard
  // build failure in CI — a naming mismatch surfacing as "Narration did not
  // render". The file names the feature it belongs to; that is what to trust.
  if (existsSync("lib/generated/custom-current.mjs")) {
    try {
      const raw = readFileSync("lib/generated/custom-current.mjs", "utf8");
      const match = raw.match(/export const CURRENT_CUSTOM = ([\s\S]*?);\s*$/);
      const item = match ? JSON.parse(match[1]) : null;
      if (item?.id === featureId) {
        return {
          hook: clean(item.hook?.ask),
          steps: (item.steps || []).map((step) => clean(step.text)),
          outro: clean(item.outroAsk || item.payoff || "دوست دارید ویدیوی بعدی دربارهٔ چه موضوعی باشد؟"),
        };
      }
    } catch {}
  }  // Newly approved, research-driven features do not wait for a manually written
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

