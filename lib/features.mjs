import { EXTRA } from "./features-extra.mjs";
import { FRESH } from "./features-fresh.mjs";
import { Y2026 } from "./features-2026.mjs";
import { DEMAND } from "./features-demand.mjs";
import { VISUAL } from "./features-visual.mjs";

// ONE feature per video, explained step by step.
// A short video that lists many things teaches nothing; a short video that walks
// through a single capability is genuinely useful — and that is what gets saved
// and shared. Steps are phrased to survive small in-app UI changes.
export const FEATURES = {
  instagram: [
    {
      id: "collab",
      benefit: { key: "viral", fa: "پستت روی دو پیج برود، دو برابر دیده شو" },
      name: "Collab",
      title: "قابلیت Collab اینستاگرام — GapMedia",
      hook: { ask: "پستت را روی دو پیج ببر و دو برابر ویو بگیر", l1: "پستت را روی", l2: "دو پیج نشان بده" },
      payoff: "پست روی هر دو پیج نشان داده می‌شود و به مخاطب هر دو می‌رسد.",
      steps: [
        { icon: "camera", text: "پست یا ریلز را بساز و به صفحهٔ آخر برو" , ui: { screen: "compose", title: "پست جدید", cta: "اشتراک‌گذاری" } },
        { icon: "users", text: "روی «Tag people» بزن" , ui: { screen: "list", title: "پست جدید", rows: ["تگ کردن افراد", "افزودن مکان", "افزودن موسیقی"], hit: 0 } },
        { screen: {"title":"Tag people","rows":["Invite collaborator","Search people"],"hit":0}, icon: "star", text: "«Invite collaborator» را انتخاب کن" , ui: { screen: "list", title: "تگ کردن افراد", rows: ["دعوت از همکار (Collab)", "جستجوی افراد"], hit: 0 } },
        { icon: "heart", text: "پیج طرف را بزن؛ بعد از تأییدش روی هر دو پیج می‌آید" , ui: { screen: "result", title: "منتشر شد" } },
      ],
      tgTitle: "🤝 قابلیت Collab اینستاگرام | پستت را روی دو پیج نشان بده\n\n#instagram #Collab #growth #GapMedia #viral",
    },
    {
      id: "hidden-words",
      benefit: { key: "seen", fa: "کامنت بد را پاک کن تا پیجت سالم بماند" },
      name: "Hidden Words",
      title: "فیلتر کامنت‌های آزاردهنده — GapMedia",
      hook: { ask: "با این قابلیت اینستاگرام، پیجت را از توهین و اسپم امن نگه دار", l1: "کامنت‌های بد را", l2: "خودکار پنهان کن" },
      payoff: "کامنت‌های شامل آن کلمه‌ها دیگر زیر پستت دیده نمی‌شوند.",
      steps: [
        { icon: "chip", text: "به تنظیمات پیج برو" , ui: { screen: "list", title: "تنظیمات", rows: ["حریم خصوصی", "اعلان‌ها", "حساب کاربری"], hit: 0 } },
        { icon: "target", text: "بخش Hidden Words را باز کن" , ui: { screen: "list", title: "حریم خصوصی", rows: ["کلمات پنهان", "محدودکردن", "مسدودشده‌ها"], hit: 0 } },
        { icon: "chat", text: "گزینهٔ پنهان‌کردن کامنت‌های آزاردهنده را روشن کن" , ui: { screen: "list", title: "کلمات پنهان", rows: ["پنهان‌کردن کامنت‌های آزاردهنده", "فیلتر پیام‌ها"], hit: 0 } },
        { icon: "pen", text: "کلمه‌های دلخواهت را هم به لیست اضافه کن" , ui: { screen: "result", title: "فعال شد" } },
      ],
      tgTitle: "🛡️ کامنت‌های آزاردهنده را خودکار پنهان کن (Hidden Words)\n\n#instagram #accountsafety #GapMedia #viral",
    },
    {
      id: "reels-template",
      benefit: { key: "viral", fa: "ریلز حرفه‌ای بساز بدون اینکه تدوین بلد باشی" },
      name: "Reels Templates",
      title: "قالب آمادهٔ ریلز — GapMedia",
      hook: { ask: "با این قابلیت اینستاگرام، در پنج دقیقه ریلز بساز و ویو بگیر", l1: "ریلز حرفه‌ای", l2: "بدون تدوین" },
      payoff: "برش‌ها و صدا خودکار هماهنگ می‌شوند؛ فقط عکس‌هایت را می‌گذاری.",
      steps: [
        { icon: "play", text: "یک ریلز که دوستش داری را باز کن" , ui: { screen: "compose", title: "ریلز", cta: "استفاده از قالب" } },
        { icon: "layers", text: "گزینهٔ «Use template» را بزن" , ui: { screen: "list", title: "ریلز", rows: ["استفاده از قالب", "ذخیره", "اشتراک‌گذاری"], hit: 0 } },
        { icon: "camera", text: "عکس‌ها یا ویدیوهای خودت را انتخاب کن" , ui: { screen: "compose", title: "انتخاب رسانه", cta: "بعدی" } },
        { icon: "sparkle", text: "منتشر کن؛ ریتم و برش‌ها آماده است" , ui: { screen: "result", title: "آمادهٔ انتشار" } },
      ],
      tgTitle: "🎬 ریلز حرفه‌ای بدون تدوین با Reels Templates\n\n#instagram #reels #contentcreator #GapMedia #viral",
    },
  ],
  tiktok: [
    {
      id: "reply-video",
      benefit: { key: "viral", fa: "از هر کامنت یک ویدیوی تازه بساز" },
      name: "Reply with video",
      title: "جواب کامنت با ویدیو — GapMedia",
      hook: { ask: "با این ترفند، از هر کامنت یک ویدیوی وایرال بساز", l1: "به کامنت", l2: "با ویدیو جواب بده" },
      payoff: "کامنت روی ویدیو می‌آید و یک محتوای تازه و رایگان می‌سازی.",
      steps: [
        { icon: "chat", text: "زیر ویدیو، بخش کامنت‌ها را باز کن" , ui: { screen: "comment", title: "کامنت‌ها", rows: ["این را چطور ساختی؟", "خیلی خوب بود!"], hit: 0 } },
        { icon: "camera", text: "کنار کامنت، آیکون دوربین را بزن" , ui: { screen: "comment", title: "کامنت‌ها", rows: ["این را چطور ساختی؟"], hit: 0 } },
        { icon: "play", text: "ویدیوی جوابت را ضبط کن" , ui: { screen: "compose", title: "ضبط جواب", cta: "ضبط" } },
        { icon: "star", text: "کامنت مثل استیکر روی ویدیو نشان داده می‌شود" , ui: { screen: "result", title: "منتشر شد" } },
      ],
      tgTitle: "💬 به کامنت با ویدیو جواب بده | ایدهٔ محتوای رایگان\n\n#tiktok #contentcreator #GapMedia #viral",
    },
    {
      id: "qa",
      benefit: { key: "viral", fa: "بگذار مخاطب سوژه‌ات را بسازد" },
      name: "Q&A",
      title: "قابلیت پرسش و پاسخ تیک‌تاک — GapMedia",
      hook: { ask: "بگذار فالوورهایت سوژهٔ ویدیوی بعدی‌ات را بسازند", l1: "بگذار مخاطب", l2: "برایت سوژه بسازد" },
      payoff: "هر سؤال یک ایدهٔ آمادهٔ ویدیو است؛ دیگر دنبال موضوع نمی‌گردی.",
      steps: [
        { icon: "user", text: "به پروفایل و بخش ابزارهای سازنده برو" , ui: { screen: "list", title: "ابزارهای سازنده", rows: ["پرسش و پاسخ (Q&A)", "تحلیل‌ها", "پروموت"], hit: 0 } },
        { icon: "chat", text: "قابلیت Q&A را روشن کن" , ui: { screen: "list", title: "پرسش و پاسخ", rows: ["فعال‌سازی Q&A"], hit: 0 } },
        { icon: "users", text: "مخاطب‌ها سؤال‌هایشان را می‌فرستند" , ui: { screen: "comment", title: "سؤال‌ها", rows: ["چطور شروع کنم؟", "بهترین ساعت کدام است؟"], hit: 0 } },
        { icon: "play", text: "روی هر سؤال بزن و با ویدیو جواب بده" , ui: { screen: "compose", title: "جواب با ویدیو", cta: "ضبط" } },
      ],
      tgTitle: "❓ با Q&A بگذار مخاطب برایت سوژه بسازد\n\n#tiktok #contentideas #GapMedia #viral",
    },
    {
      id: "photo-mode",
      benefit: { key: "viral", fa: "بدون دوربین محتوا بساز" },
      name: "Photo Mode",
      title: "حالت عکس تیک‌تاک — GapMedia",
      hook: { ask: "بدون دوربین و بدون ادیت، پستِ پرویو بساز", l1: "فقط چند عکس", l2: "و یک آهنگ" },
      payoff: "مخاطب برای دیدن عکس بعدی می‌ماند و زمان تماشا بالا می‌رود.",
      steps: [
        { screen: {"title":"Create","rows":["Photo","Video","LIVE"],"hit":0}, icon: "camera", text: "دکمهٔ + را بزن" , ui: { screen: "list", title: "ساخت", rows: ["عکس (Photo)", "ویدیو", "لایو"], hit: 0 } },
        { icon: "layers", text: "به تب عکس (Photo) برو" , ui: { screen: "compose", title: "حالت عکس", cta: "انتخاب عکس" } },
        { icon: "star", text: "چند عکس مرتبط انتخاب کن" , ui: { screen: "compose", title: "انتخاب عکس‌ها", cta: "بعدی" } },
        { icon: "music", text: "صدا و متن بگذار و منتشر کن" , ui: { screen: "result", title: "منتشر شد" } },
      ],
      tgTitle: "🖼️ با Photo Mode بدون دوربین محتوا بساز\n\n#tiktok #contentcreator #GapMedia #viral",
    },
  ],
  tools: [
    {
      id: "upscayl",
      benefit: { key: "seen", fa: "عکس تار را واضح کن تا قابل انتشار شود" },
      name: "Upscayl",
      title: "بالا بردن کیفیت عکس با Upscayl — GapMedia",
      hook: { ask: "این اپ رایگان است — عکس تار قدیمی‌ات را قابل پست کردن کن", l1: "عکس کم‌کیفیت را", l2: "واضح کن" },
      payoff: "عکس قدیمی و تار، تمیز و بزرگ می‌شود — رایگان و آفلاین.",
      steps: [
        { brand: {"name":"Upscayl","url":"upscayl.org","color":"#0EA5E9","tagline":"Upscale images"}, icon: "globe", text: "برنامهٔ رایگان Upscayl را نصب کن" , ui: { screen: "tool", url: "upscayl.org", cta: "دانلود رایگان" } },
        { icon: "camera", text: "عکس کم‌کیفیت را داخلش بگذار" , ui: { screen: "tool", url: "upscayl", cta: "انتخاب عکس" } },
        { icon: "wand", text: "حالت بزرگ‌نمایی را انتخاب کن" , ui: { screen: "tool", url: "upscayl", cta: "بزرگ‌نمایی ۴x" } },
        { icon: "sparkle", text: "خروجی بگیر؛ عکس واضح‌تر و بزرگ‌تر می‌شود" , ui: { screen: "tool", url: "upscayl", cta: "ذخیرهٔ خروجی" } },
      ],
      tgTitle: "✨ عکس کم‌کیفیت را با Upscayl واضح کن (رایگان)\n\n#freeapp #contentcreator #GapMedia #viral",
    },
    {
      id: "removebg",
      benefit: { key: "seen", fa: "پس‌زمینه را پاک کن تا کاورت تمیز و حرفه‌ای شود" },
      name: "remove.bg",
      title: "حذف پس‌زمینهٔ عکس — GapMedia",
      hook: { ask: "رایگان و بدون نصب: بک‌گراند عکست را در چند ثانیه پاک کن", l1: "پس‌زمینه را", l2: "در چند ثانیه پاک کن" },
      payoff: "برای کاور، لوگو و طرح، عکس بدون پس‌زمینه آماده می‌شود.",
      steps: [
        { brand: {"name":"remove.bg","url":"remove.bg","color":"#54616E","tagline":"Remove background"}, icon: "globe", text: "سایت remove.bg را باز کن" , ui: { screen: "tool", url: "remove.bg", cta: "باز کردن سایت" } },
        { icon: "camera", text: "عکست را بارگذاری کن" , ui: { screen: "tool", url: "remove.bg", cta: "بارگذاری عکس" } },
        { icon: "wand", text: "پس‌زمینه خودکار حذف می‌شود" , ui: { screen: "tool", url: "remove.bg", cta: "حذف پس‌زمینه" } },
        { icon: "layers", text: "خروجی را در طراحی کاورت استفاده کن" , ui: { screen: "tool", url: "remove.bg", cta: "دانلود" } },
      ],
      tgTitle: "✂️ پس‌زمینهٔ عکس را در چند ثانیه پاک کن\n\n#freeapp #design #GapMedia #viral",
    },
    {
      id: "capcut-captions",
      benefit: { key: "seen", fa: "بیشتر مردم بی‌صدا می‌بینند؛ زیرنویس یعنی بازدید" },
      name: "CapCut",
      title: "زیرنویس خودکار با CapCut — GapMedia",
      hook: { ask: "رایگان است — زیرنویس بگذار؛ یک‌سوم مردم بی‌صدا می‌بینند", l1: "زیرنویس ویدیو را", l2: "خودکار بساز" },
      payoff: "بیشتر مردم ویدیو را بی‌صدا می‌بینند؛ زیرنویس یعنی دیده‌شدن بیشتر.",
      steps: [
        { brand: {"name":"CapCut","url":"capcut.com","color":"#111111","tagline":"Auto captions"}, icon: "camera", text: "ویدیو را در CapCut باز کن" , ui: { screen: "compose", title: "CapCut", cta: "افزودن ویدیو" } },
        { icon: "mic", text: "بخش Captions را انتخاب کن" , ui: { screen: "list", title: "ابزارها", rows: ["زیرنویس (Captions)", "متن", "افکت"], hit: 0 } },
        { icon: "pen", text: "زیرنویس خودکار ساخته می‌شود؛ غلط‌ها را اصلاح کن" , ui: { screen: "list", title: "زیرنویس", rows: ["ساخت خودکار", "ویرایش متن"], hit: 0 } },
        { icon: "star", text: "قلم و رنگ را هماهنگ پیجت کن" , ui: { screen: "result", title: "زیرنویس آماده شد" } },
      ],
      tgTitle: "📝 زیرنویس خودکار ویدیو با CapCut\n\n#editing #freeapp #GapMedia #viral",
    },
  ],
};

// one feature per day, rotating.
// FRESH comes first on purpose: the newest, least-known topics should be what
// goes out next, not what waits eleven days behind the material already posted.
// The rotation is anchored to a fixed day rather than to the raw epoch day
// number, so "day 0 of the cycle" is a date we chose (the day the FRESH pack
// went live) instead of whatever offset the arithmetic happened to land on.
const ROTATION_EPOCH = 20689; // 2026-08-24

// Research-first rotation. Seven of each ten tutorial videos answer a proven
// creator need (reach, search discovery, testing, qualified monetisation or
// shareability). The remaining three keep the feed current with new releases
// and genuinely useful apps. This prevents a daily menu-tour from masquerading
// as a viral-content strategy.
const DEMAND_IDS = {
  tiktok: ["view-jail", "tiktok-pay", "search-insights", "retention-graph", "pin-comment", "tt-media-kit"],
  instagram: ["hashtags-hurt", "ask-dont-beg", "trial-reels", "collab", "ig-insights-retention", "replace-audio"],
  tools: ["hook-17x", "mute-30", "photopea", "capcut-captions", "google-trends", "pexels-broll"],
};

// Every feature in a category, in rotation order.
export function featuresFor(cat) {
  return [
    // what people search for comes before what the platforms shipped
    ...((DEMAND && DEMAND[cat]) || []),
    ...((Y2026 && Y2026[cat]) || []),
    ...((VISUAL && VISUAL[cat]) || []),
    ...((FRESH && FRESH[cat]) || []),
    ...(FEATURES[cat] || []),
    ...((EXTRA && EXTRA[cat]) || []),
  ];
}

// Look one up by id, so a freshly researched update can be published the day it
// lands instead of waiting for its turn in the rotation.
export function featureById(id) {
  const want = String(id).toLowerCase();
  for (const cat of Object.keys({ ...DEMAND, ...Y2026, ...VISUAL, ...FRESH, ...FEATURES, ...EXTRA })) {
    const f = featuresFor(cat).find((x) => String(x.id).toLowerCase() === want);
    if (f) return { cat, feature: f };
  }
  return null;
}

export function featureFor(cat, dayIndex) {
  const list = [
    ...((DEMAND && DEMAND[cat]) || []),
    // What the platforms shipped this year goes out first — an update is only
    // worth telling people about while it is still news to them.
    ...((Y2026 && Y2026[cat]) || []),
    ...((VISUAL && VISUAL[cat]) || []),
    ...((FRESH && FRESH[cat]) || []),
    ...(FEATURES[cat] || []),
    ...((EXTRA && EXTRA[cat]) || []),
  ];
  if (!list.length) return null;
  const cycle = ((dayIndex - ROTATION_EPOCH) % 10 + 10) % 10;
  const demanded = (DEMAND_IDS[cat] || [])
    .map((id) => list.find((f) => f.id === id))
    .filter(Boolean);
  if (cycle < 7 && demanded.length) {
    const i = (((dayIndex - ROTATION_EPOCH) % demanded.length) + demanded.length) % demanded.length;
    return demanded[i];
  }
  const i = (((dayIndex - ROTATION_EPOCH) % list.length) + list.length) % list.length;
  return list[i];
}
