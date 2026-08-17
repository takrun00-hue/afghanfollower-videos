// Content library for the AfghanFollower daily pipeline.
// 4 categories (TikTok / Instagram / social / AI). Each has a BANK of tips; each
// day an 8-tip window is selected with a rotating stride, plus rotating hook,
// title and music — so no two days look the same. Add more tips to grow variety.

const THEMES = {
  tiktok: {
    grad: "linear-gradient(160deg,#1a2a9e 0%,#0c1560 45%,#05081f 100%)",
    gradOutro: "linear-gradient(160deg,#22e0f0 0%,#1e37c9 40%,#0b1560 100%)",
    glow1: "rgba(58,91,255,.55)", glow2: "rgba(34,224,240,.30)",
    emc: "#1732c9", accents: ["#22e0f0", "#ff2d9b", "#ffd23f"],
  },
  instagram: {
    grad: "linear-gradient(160deg,#7b2ff7 0%,#c13584 48%,#2a0836 100%)",
    gradOutro: "linear-gradient(160deg,#f77737 0%,#c13584 45%,#5b1a6b 100%)",
    glow1: "rgba(247,119,55,.42)", glow2: "rgba(225,48,108,.42)",
    emc: "#b31a6b", accents: ["#ff8a3d", "#ff2d9b", "#b06bff"],
  },
  general: {
    grad: "linear-gradient(160deg,#0ea5a5 0%,#1e5fd0 48%,#061634 100%)",
    gradOutro: "linear-gradient(160deg,#22c55e 0%,#1e5fd0 45%,#0b1e5a 100%)",
    glow1: "rgba(34,197,94,.40)", glow2: "rgba(58,91,255,.34)",
    emc: "#0e7490", accents: ["#22c55e", "#3a5bff", "#22e0f0"],
  },
  ai: {
    grad: "linear-gradient(160deg,#4c1d95 0%,#1e1b4b 46%,#050317 100%)",
    gradOutro: "linear-gradient(160deg,#22d3ee 0%,#7c3aed 42%,#1e1b4b 100%)",
    glow1: "rgba(124,58,237,.50)", glow2: "rgba(34,211,238,.34)",
    emc: "#6d28d9", accents: ["#22d3ee", "#a855f7", "#34d399"],
  },
};

// ---- tip banks (16 each) ----  head = short title (with one <span class="hl">),
//                                 sub  = one clear sentence (with one <b class="em">)
const BANKS = {
  tiktok: [
    { icon: "magnet", head: 'قلاب <span class="hl">سه‌ثانیه‌ای</span>', sub: 'در <b class="em">سه ثانیهٔ اول</b> با یک سؤال یا جملهٔ قوی، مخاطب را جذب کن.' },
    { icon: "bolt", head: 'ریتم <span class="hl">تند</span>', sub: 'ویدیو را کوتاه و پرریتم نگه دار؛ <b class="em">هر لحظه</b> باید جذاب باشد.' },
    { icon: "music", head: 'صدای <span class="hl">ترند</span>', sub: 'از <b class="em">صداهای در حال ترند</b> متناسب با موضوعت استفاده کن.' },
    { icon: "hashtag", head: 'هشتگ <span class="hl">هدفمند</span>', sub: '<b class="em">سه تا پنج هشتگ</b> دقیق و مرتبط بگذار، نه هشتگ‌های خیلی کلی.' },
    { icon: "chat", head: 'دعوت به <span class="hl">تعامل</span>', sub: 'از مخاطب بخواه <b class="em">کامنت بگذارد</b> و ویدیو را به اشتراک بگذارد.' },
    { icon: "clock", head: 'زمان <span class="hl">درست</span>', sub: 'وقتی مخاطبانت <b class="em">آنلاین</b> هستند پست بگذار و منظم باش.' },
    { icon: "camera", head: 'تصویر <span class="hl">باکیفیت</span>', sub: 'با <b class="em">نور کافی</b> و تصویر واضح، حرفه‌ای‌تر دیده می‌شوی.' },
    { icon: "chart", head: 'تحلیل و <span class="hl">تست</span>', sub: 'نرخ <b class="em">ماندگاری مخاطب</b> را بررسی کن و فرمت‌های تازه را امتحان کن.' },
    { icon: "play", head: 'فریم اول <span class="hl">قوی</span>', sub: 'همان <b class="em">فریم اول</b> باید چشم را بگیرد تا اسکرول متوقف شود.' },
    { icon: "clock", head: 'طول <span class="hl">مناسب</span>', sub: 'ویدیوهای <b class="em">هفت تا پانزده ثانیه</b> معمولاً بهترین نتیجه را می‌دهند.' },
    { icon: "chat", head: 'پایان با <span class="hl">سؤال</span>', sub: 'ویدیو را با یک <b class="em">سؤال</b> تمام کن تا کامنت‌ها بیشتر شوند.' },
    { icon: "refresh", head: 'بازتولید <span class="hl">موفق‌ها</span>', sub: 'ویدیوهای <b class="em">پربازدید</b> را با ایده و فرمت تازه دوباره بساز.' },
    { icon: "star", head: 'قلاب <span class="hl">متنی</span>', sub: 'یک <b class="em">متن کوتاه و کنجکاوکننده</b> روی ثانیه‌های اول بگذار.' },
    { icon: "trend", head: 'ورود <span class="hl">زودهنگام</span>', sub: 'ترندها را <b class="em">زود</b> اجرا کن؛ دیر رسیدن یعنی از دست دادن موج.' },
    { icon: "users", head: 'تعامل با <span class="hl">هم‌حوزه‌ها</span>', sub: 'با پیج‌های <b class="em">هم‌موضوع</b> تعامل کن تا بیشتر دیده شوی.' },
    { icon: "target", head: 'مخاطب <span class="hl">مشخص</span>', sub: 'دقیق بدان <b class="em">برای چه کسی</b> می‌سازی و محتوا را برایش تنظیم کن.' },
  ],
  instagram: [
    { icon: "user", head: 'پروفایل <span class="hl">حرفه‌ای</span>', sub: 'عکس پروفایل واضح، <b class="em">بایوی کوتاه</b> و لینک فعال داشته باش.' },
    { icon: "play", head: 'قدرت <span class="hl">ریلز</span>', sub: '<b class="em">ریلز</b> بیشترین بازدید ارگانیک را می‌آورد؛ روی آن تمرکز کن.' },
    { icon: "star", head: 'کاور <span class="hl">هماهنگ</span>', sub: 'برای هر پست یک <b class="em">کاور خوانا و هماهنگ</b> با پیجت طراحی کن.' },
    { icon: "heart", head: 'استوری <span class="hl">روزانه</span>', sub: 'هر روز استوری بگذار و از <b class="em">نظرسنجی و سؤال</b> استفاده کن.' },
    { icon: "hashtag", head: 'هشتگ <span class="hl">لایه‌ای</span>', sub: 'ترکیبی از هشتگ‌های <b class="em">پرطرفدار، متوسط و خاص</b> بگذار.' },
    { icon: "layers", head: 'کاروسل <span class="hl">آموزشی</span>', sub: 'پست‌های چندتصویری آموزشی، <b class="em">ذخیره و اشتراک</b> بیشتری می‌گیرند.' },
    { icon: "chat", head: 'پاسخ <span class="hl">سریع</span>', sub: 'به <b class="em">کامنت و دایرکت</b> سریع جواب بده تا تعامل بالا برود.' },
    { icon: "chart", head: 'بهترین <span class="hl">زمان</span>', sub: 'از بخش <b class="em">Insights</b> برای یافتن بهترین زمان انتشار کمک بگیر.' },
    { icon: "play", head: 'ریلز <span class="hl">کوتاه</span>', sub: 'ریلز‌های کوتاه <b class="em">نرخ تماشای دوباره</b> بالاتری دارند.' },
    { icon: "star", head: 'هوک <span class="hl">نوشتاری</span>', sub: 'در <b class="em">دو ثانیهٔ اول</b> با یک متن، کنجکاوی بساز.' },
    { icon: "users", head: 'همکاری <span class="hl">مشترک</span>', sub: 'با پیج‌های هم‌حوزه <b class="em">پست مشترک</b> بگذار تا مخاطب تازه بگیری.' },
    { icon: "calendar", head: 'نظم در <span class="hl">انتشار</span>', sub: '<b class="em">روزها و ساعت‌های ثابت</b> برای پست‌گذاری انتخاب کن.' },
    { icon: "target", head: 'مخاطب <span class="hl">هدف</span>', sub: 'بدان مخاطبت کیست و <b class="em">دقیقاً برای او</b> محتوا بساز.' },
    { icon: "sparkle", head: 'هویت <span class="hl">بصری</span>', sub: '<b class="em">رنگ، فونت و لحن ثابت</b>، پیجت را حرفه‌ای نشان می‌دهد.' },
    { icon: "bulb", head: 'ارزش <span class="hl">واقعی</span>', sub: 'محتوایی بساز که <b class="em">آموزش بدهد، حل مشکل کند یا سرگرم کند</b>.' },
    { icon: "refresh", head: 'تحلیل و <span class="hl">بهبود</span>', sub: 'هفتگی آمار را ببین و <b class="em">بر اساس آن</b> محتوا را بهتر کن.' },
  ],
  general: [
    { icon: "user", head: 'هویت <span class="hl">واحد</span>', sub: 'در همهٔ شبکه‌ها <b class="em">اسم، عکس و لحن</b> یکسان داشته باش.' },
    { icon: "bulb", head: 'محتوای <span class="hl">ارزشمند</span>', sub: 'محتوایی بساز که <b class="em">آموزش، سرگرمی یا راه‌حل</b> ارائه دهد.' },
    { icon: "calendar", head: 'تقویم <span class="hl">محتوا</span>', sub: 'برای هفته <b class="em">برنامه‌ریزی</b> کن تا همیشه محتوای آماده داشته باشی.' },
    { icon: "layers", head: 'بازطراحی <span class="hl">محتوا</span>', sub: 'یک محتوا را برای هر شبکه <b class="em">بازطراحی</b> کن، نه کپی مستقیم.' },
    { icon: "chat", head: 'ساخت <span class="hl">جامعه</span>', sub: 'به مخاطب پاسخ بده تا <b class="em">جامعه‌ای وفادار</b> بسازی.' },
    { icon: "chart", head: 'تصمیم با <span class="hl">داده</span>', sub: 'آمار را بررسی کن و روی چیزی که <b class="em">جواب می‌دهد</b> تمرکز کن.' },
    { icon: "users", head: 'همکاری و <span class="hl">رشد</span>', sub: 'با صفحه‌های مرتبط <b class="em">همکاری</b> کن تا به مخاطب تازه برسی.' },
    { icon: "refresh", head: 'ثبات و <span class="hl">صبر</span>', sub: 'منظم باش و ادامه بده؛ <b class="em">رشد واقعی زمان می‌برد</b>.' },
    { icon: "target", head: 'مخاطب <span class="hl">هدف</span>', sub: 'دقیق مشخص کن <b class="em">برای چه کسی</b> محتوا می‌سازی.' },
    { icon: "sparkle", head: 'ارزش در <span class="hl">چند ثانیه</span>', sub: 'همان ابتدا مشخص کن مخاطب <b class="em">چه چیزی به دست می‌آورد</b>.' },
    { icon: "trend", head: 'سوارشدن بر <span class="hl">ترند</span>', sub: '<b class="em">ترندهای مرتبط</b> با حوزه‌ات را سریع اجرا کن.' },
    { icon: "star", head: 'داستان <span class="hl">برند</span>', sub: 'پشت پیجت یک <b class="em">داستان</b> بساز تا مخاطب با تو ارتباط بگیرد.' },
    { icon: "play", head: 'تنوع <span class="hl">فرمت</span>', sub: '<b class="em">ویدیو، تصویر و متن</b> را ترکیب کن تا محتوا یکنواخت نشود.' },
    { icon: "clock", head: 'ساعت <span class="hl">طلایی</span>', sub: 'در <b class="em">ساعت‌های پرتعامل</b> فعال باش و پاسخ بده.' },
    { icon: "hashtag", head: 'کشف‌<span class="hl">پذیری</span>', sub: 'از <b class="em">کلمات کلیدی و هشتگ درست</b> برای دیده‌شدن استفاده کن.' },
    { icon: "heart", head: 'فراخوان به <span class="hl">اقدام</span>', sub: 'در پایان از مخاطب بخواه <b class="em">دنبال کند یا اشتراک بگذارد</b>.' },
  ],
  ai: [
    { icon: "bulb", head: 'تولید <span class="hl">ایده</span>', sub: 'با هوش مصنوعی در چند ثانیه <b class="em">ده‌ها ایدهٔ محتوا</b> بگیر.' },
    { icon: "pen", head: 'نوشتن <span class="hl">کپشن</span>', sub: '<b class="em">کپشن و متن پست</b> را با ابزارهای هوش مصنوعی سریع بنویس و ویرایش کن.' },
    { icon: "chat", head: 'اسکریپت <span class="hl">ویدیو</span>', sub: '<b class="em">سناریو و متن ویدیو</b> را با هوش مصنوعی آماده کن.' },
    { icon: "wand", head: 'ساخت <span class="hl">تصویر</span>', sub: '<b class="em">کاور و تصویر اختصاصی</b> را با ابزارهای تصویرساز هوش مصنوعی بساز.' },
    { icon: "camera", head: 'ویرایش <span class="hl">ویدیو</span>', sub: '<b class="em">برش، حذف سکوت و تدوین</b> را به ابزارهای هوشمند بسپار.' },
    { icon: "mic", head: 'صدای <span class="hl">مصنوعی</span>', sub: 'برای ویدیوهایت <b class="em">وویس‌اوور طبیعی</b> با هوش مصنوعی بساز.' },
    { icon: "star", head: 'زیرنویس <span class="hl">خودکار</span>', sub: 'با هوش مصنوعی <b class="em">زیرنویس دقیق و هماهنگ</b> بساز.' },
    { icon: "globe", head: 'ترجمهٔ <span class="hl">محتوا</span>', sub: 'محتوا را با هوش مصنوعی <b class="em">به چند زبان</b> برگردان و مخاطب جهانی بگیر.' },
    { icon: "hashtag", head: 'هشتگ <span class="hl">هوشمند</span>', sub: '<b class="em">هشتگ‌های مرتبط و مؤثر</b> را با کمک هوش مصنوعی پیدا کن.' },
    { icon: "calendar", head: 'برنامه‌ریزی <span class="hl">محتوا</span>', sub: '<b class="em">تقویم و زمان انتشار</b> را با هوش مصنوعی بچین.' },
    { icon: "chart", head: 'تحلیل <span class="hl">عملکرد</span>', sub: 'با هوش مصنوعی بفهم <b class="em">کدام پست بهتر بوده</b> و چرا.' },
    { icon: "target", head: 'تحلیل <span class="hl">رقبا</span>', sub: '<b class="em">محتوای رقبا و ترندها</b> را با ابزارهای هوش مصنوعی بررسی کن.' },
    { icon: "refresh", head: 'بازنویسی <span class="hl">چندسکویی</span>', sub: 'یک محتوا را با هوش مصنوعی <b class="em">برای هر پلتفرم</b> بهینه کن.' },
    { icon: "chip", head: 'پاسخ <span class="hl">خودکار</span>', sub: 'با <b class="em">چت‌بات هوشمند</b> به پیام‌ها سریع پاسخ بده.' },
    { icon: "sparkle", head: 'شخصی‌<span class="hl">سازی</span>', sub: 'محتوا را با هوش مصنوعی <b class="em">برای سلیقهٔ مخاطب هدف</b> تنظیم کن.' },
    { icon: "bolt", head: 'صرفه‌جویی در <span class="hl">زمان</span>', sub: '<b class="em">کارهای تکراری</b> را به هوش مصنوعی بسپار و روی خلاقیت تمرکز کن.' },
  ],
};

const HOOKS = {
  tiktok: [
    { l1: 'رشد سریع در <span style="color:#22e0f0">TikTok</span>؟', l2: 'این نکته‌ها را ببین!' },
    { l1: 'می‌خواهی در <span style="color:#22e0f0">TikTok</span>', l2: 'بیشتر دیده شوی؟' },
    { l1: 'ترفندهای وایرال‌شدن در', l2: '<span style="color:#22e0f0">TikTok</span>' },
  ],
  instagram: [
    { l1: 'رشد پیج <span style="color:#ff8a3d">Instagram</span>؟', l2: 'با این ترفندها!' },
    { l1: 'می‌خواهی در <span style="color:#ff8a3d">Instagram</span>', l2: 'بیشتر دیده شوی؟' },
    { l1: 'ترفندهای رشد در', l2: '<span style="color:#ff8a3d">Instagram</span>' },
  ],
  general: [
    { l1: 'رشد در', l2: '<span style="color:#22c55e">شبکه‌های اجتماعی</span>' },
    { l1: 'می‌خواهی سریع‌تر', l2: 'رشد کنی؟' },
    { l1: 'اصول رشد در', l2: '<span style="color:#22c55e">شبکه‌های اجتماعی</span>' },
  ],
  ai: [
    { l1: '<span style="color:#22d3ee">هوش مصنوعی</span> برای', l2: 'شبکه‌های اجتماعی' },
    { l1: 'با <span style="color:#22d3ee">AI</span> سریع‌تر', l2: 'محتوا بساز!' },
    { l1: 'ترفندهای <span style="color:#22d3ee">هوش مصنوعی</span>', l2: 'برای پیج تو' },
  ],
};

const TITLES = {
  tiktok: [
    "🚀 رازهای وایرال‌شدن در تیک‌تاک | پیجت را منفجر کن!\n\n#تیک_تاک #وایرال #رشد_پیج #افغان_فالور",
    "🔥 ترفندهای رشد تیک‌تاک که کسی به تو نمی‌گوید!\n\n#تیک_تاک #وایرال #رشد_پیج #افغان_فالور",
    "🎬 این‌طوری در تیک‌تاک دیده شو! (نکته‌های طلایی)\n\n#تیک_تاک #وایرال #افغان_فالور",
  ],
  instagram: [
    "📸 ترفندهای طلایی رشد اینستاگرام | فالوورهایت را چند برابر کن!\n\n#اینستاگرام #ریلز #رشد_پیج #افغان_فالور",
    "⚡ رشد سریع اینستاگرام، کاملاً رایگان!\n\n#اینستاگرام #ریلز #رشد_پیج #افغان_فالور",
    "🌟 این‌طوری پیج اینستاگرامت را قوی کن!\n\n#اینستاگرام #رشد_پیج #افغان_فالور",
  ],
  general: [
    "🌐 اصول طلایی رشد در شبکه‌های اجتماعی\n\n#شبکه_های_اجتماعی #دیجیتال_مارکتینگ #رشد #افغان_فالور",
    "🔑 کلیدهای رشد در شبکه‌های اجتماعی\n\n#شبکه_های_اجتماعی #رشد #افغان_فالور",
    "📈 این‌طوری در شبکه‌های اجتماعی رشد کن!\n\n#شبکه_های_اجتماعی #دیجیتال_مارکتینگ #افغان_فالور",
  ],
  ai: [
    "🤖 هوش مصنوعی برای شبکه‌های اجتماعی | سریع‌تر و حرفه‌ای‌تر بساز!\n\n#هوش_مصنوعی #AI #شبکه_های_اجتماعی #افغان_فالور",
    "✨ با هوش مصنوعی محتوای پیجت را متحول کن!\n\n#هوش_مصنوعی #AI #رشد_پیج #افغان_فالور",
    "⚙️ ترفندهای هوش مصنوعی برای تولید محتوا\n\n#هوش_مصنوعی #AI #دیجیتال_مارکتینگ #افغان_فالور",
  ],
};

const OUTRO = {
  tiktok: { tag: 'برای رشد واقعی در تیک‌تاک،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
  instagram: { tag: 'برای رشد پیج اینستاگرامت،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
  general: { tag: 'برای رشد در شبکه‌های اجتماعی،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
  ai: { tag: 'برای محتوای حرفه‌ای با هوش مصنوعی،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
};

const META = {
  tiktok: "ترفندهای رشد در تیک‌تاک — افغان فالور",
  instagram: "ترفندهای رشد در اینستاگرام — افغان فالور",
  general: "اصول رشد در شبکه‌های اجتماعی — افغان فالور",
  ai: "هوش مصنوعی برای شبکه‌های اجتماعی — افغان فالور",
};

export const CATEGORIES = ["tiktok", "instagram", "general", "ai"];
export const MUSIC_VARIANTS = 3; // bed-60s-v1..v3

function buildPack(cat, dayIndex) {
  const bank = BANKS[cat];
  const N = bank.length;
  const start = (dayIndex * 5) % N; // stride 5 (coprime with 16) → 16 distinct daily windows
  const tips = Array.from({ length: 8 }, (_, i) => bank[(start + i) % N]);
  return {
    id: cat,
    platform: cat,
    theme: THEMES[cat],
    title: META[cat],
    hook: HOOKS[cat][dayIndex % HOOKS[cat].length],
    tgTitle: TITLES[cat][dayIndex % TITLES[cat].length],
    tips,
    outro: OUTRO[cat],
    music: `music/bed-60s-v${((dayIndex + CATEGORIES.indexOf(cat)) % MUSIC_VARIANTS) + 1}.m4a`,
  };
}

export function packsForDate(date = new Date()) {
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
  const out = { dayIndex };
  for (const c of CATEGORIES) out[c] = buildPack(c, dayIndex);
  return out;
}

export { BANKS, THEMES };
