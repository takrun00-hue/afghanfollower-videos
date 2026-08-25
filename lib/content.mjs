import { ACTIVE_BANKS } from "./banks-active.mjs";
import { featureFor, featureById } from "./features.mjs";
import { beatPlan, styleFor } from "../music/style.mjs";
import { moodFor } from "../music/mood.mjs";
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
  tools: {
    grad: "linear-gradient(160deg,#0e7490 0%,#3730a3 48%,#070a24 100%)",
    gradOutro: "linear-gradient(160deg,#22d3ee 0%,#6366f1 42%,#1e1b4b 100%)",
    glow1: "rgba(99,102,241,.48)", glow2: "rgba(34,211,238,.34)",
    emc: "#0e7490", accents: ["#22d3ee", "#a3e635", "#818cf8"],
  },
};

// ---- tip banks (16 each) ----  head = short title (with one <span class="hl">),
//                                 sub  = one clear sentence (with one <b class="em">)
const BANKS_INLINE = {
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
  tools: [
    { icon: "camera", head: 'ادیت با <span class="hl">CapCut</span>', sub: 'ویدیوهایت را رایگان با <b class="em">CapCut</b> برش بزن و زیرنویس بگذار.' },
    { icon: "layers", head: 'طراحی با <span class="hl">Canva</span>', sub: 'کاور و پست حرفه‌ای را بدون تخصص با <b class="em">Canva</b> بساز.' },
    { icon: "sparkle", head: 'کیفیت عکس را <span class="hl">بالا ببر</span>', sub: 'با ابزاری مثل <b class="em">Upscayl</b> عکس‌های کم‌کیفیت را واضح‌تر کن.' },
    { icon: "wand", head: 'حذف <span class="hl">پس‌زمینه</span>', sub: 'با <b class="em">remove.bg</b> در چند ثانیه پس‌زمینهٔ عکس را پاک کن.' },
    { icon: "bulb", head: 'ایده با <span class="hl">هوش مصنوعی</span>', sub: 'با <b class="em">ChatGPT</b> ده‌ها ایدهٔ محتوا و کپشن بگیر.' },
    { icon: "star", head: 'زیرنویس <span class="hl">خودکار</span>', sub: 'با <b class="em">CapCut یا Submagic</b> برای ویدیوهایت زیرنویس بساز.' },
    { icon: "mic", head: 'صدای <span class="hl">مصنوعی</span>', sub: 'با <b class="em">ElevenLabs</b> وویس‌اوور طبیعی بساز.' },
    { icon: "magnet", head: 'قلاب <span class="hl">سه‌ثانیه</span>', sub: 'سه ثانیهٔ اول را با یک <b class="em">جمله یا تصویر قوی</b> بساز.' },
    { icon: "trend", head: 'ترندها را <span class="hl">پیدا کن</span>', sub: 'از <b class="em">TikTok Creative Center</b> ترندها و صداهای داغ را ببین.' },
    { icon: "camera", head: 'نور خوب، <span class="hl">تصویر واضح</span>', sub: 'با <b class="em">نور طبیعی</b> و پس‌زمینهٔ ساده، تصویر حرفه‌ای‌تر شود.' },
    { icon: "wand", head: 'تصویر با <span class="hl">متن</span>', sub: 'با <b class="em">Ideogram</b> تصاویری با متن خوانا بساز.' },
    { icon: "calendar", head: 'زمان‌بندی <span class="hl">هوشمند</span>', sub: 'با <b class="em">Meta Business Suite</b> پست‌ها را از قبل زمان‌بندی کن.' },
    { icon: "layers", head: 'کاروسل <span class="hl">آموزشی</span>', sub: 'محتوای چندتصویری آموزشی، <b class="em">ذخیره و اشتراک</b> بیشتری می‌گیرد.' },
    { icon: "chart", head: 'تحلیل <span class="hl">عملکرد</span>', sub: 'با هوش مصنوعی بفهم <b class="em">کدام محتوا</b> بهتر جواب داده.' },
    { icon: "globe", head: 'مخاطب <span class="hl">جهانی</span>', sub: 'با هوش مصنوعی محتوا را <b class="em">به چند زبان</b> برگردان.' },
    { icon: "heart", head: 'پایان با <span class="hl">دعوت</span>', sub: 'آخر ویدیو یک <b class="em">سؤال</b> بپرس تا کامنت بگیری.' },
  ],
};

const BANKS = { ...BANKS_INLINE, ...ACTIVE_BANKS };

const HOOKS = {
  // Hook grammar: open loop / negation — a gap the viewer needs closed.
  // Line 1 is the question, line 2 is the promise. Badge = the payoff count.
  tiktok: [
    { badge: "۸ قابلیت", l1: "این قابلیت‌های", l2: "<span style=\"color:#22e0f0\">تیک‌تاک را بلد نیستی!</span>" },
    { badge: "۸ قابلیت", l1: "تیک‌تاک این‌ها را دارد،", l2: "<span style=\"color:#22e0f0\">تو استفاده نمی‌کنی</span>" },
    { badge: "۸ قابلیت", l1: "قابلیت‌های پنهان", l2: "<span style=\"color:#22e0f0\">تیک‌تاک</span>" },
  ],
  instagram: [
    { badge: "۸ قابلیت", l1: "این قابلیت اینستاگرام را", l2: "<span style=\"color:#ff8a3d\">می‌شناسی؟</span>" },
    { badge: "۸ قابلیت", l1: "اینستاگرام این‌ها را دارد،", l2: "<span style=\"color:#ff8a3d\">تو استفاده نمی‌کنی</span>" },
    { badge: "۸ قابلیت", l1: "قابلیت‌های پنهان", l2: "<span style=\"color:#ff8a3d\">اینستاگرام</span>" },
  ],
  tools: [
    { badge: "۸ ابزار", l1: "هنوز محتوا را", l2: "<span style=\"color:#22d3ee\">دستی می‌سازی؟</span>" },
    { badge: "۸ ابزار", l1: "این ابزارها", l2: "<span style=\"color:#22d3ee\">نصف وقتت را آزاد می‌کند</span>" },
    { badge: "۸ ابزار", l1: "این‌ها را بلد نیستی؟", l2: "<span style=\"color:#22d3ee\">وقتت را هدر می‌دهی</span>" },
  ],
  general: [
    { badge: "۸ اصل", l1: "چرا محتوایت", l2: "<span style=\"color:#22c55e\">دیده نمی‌شود؟</span>" },
    { badge: "۸ اصل", l1: "رشد واقعی با", l2: "<span style=\"color:#22c55e\">این اصل‌ها</span>" },
    { badge: "۸ اصل", l1: "این اشتباه‌ها", l2: "<span style=\"color:#22c55e\">جلوی رشدت را می‌گیرد</span>" },
  ],
  ai: [
    { badge: "۸ ترفند", l1: "هوش مصنوعی را", l2: "<span style=\"color:#22d3ee\">اشتباه استفاده می‌کنی</span>" },
    { badge: "۸ ترفند", l1: "با هوش مصنوعی", l2: "<span style=\"color:#22d3ee\">سریع‌تر بساز</span>" },
    { badge: "۸ ترفند", l1: "این‌ها را با AI", l2: "<span style=\"color:#22d3ee\">در چند دقیقه بساز</span>" },
  ],
};

const TITLES = {
  tiktok: [
    "🚀 رازهای وایرال‌شدن در تیک‌تاک | پیجت را منفجر کن!\n\n#تیک_تاک #وایرال #رشد_پیج #افغان_فالورز",
    "🔥 ترفندهای رشد تیک‌تاک که کسی به تو نمی‌گوید!\n\n#تیک_تاک #وایرال #رشد_پیج #افغان_فالورز",
    "🎬 این‌طوری در تیک‌تاک دیده شو! (نکته‌های طلایی)\n\n#تیک_تاک #وایرال #افغان_فالورز",
  ],
  instagram: [
    "📸 ترفندهای طلایی رشد اینستاگرام | فالوورهایت را چند برابر کن!\n\n#اینستاگرام #ریلز #رشد_پیج #افغان_فالورز",
    "⚡ رشد سریع اینستاگرام، کاملاً رایگان!\n\n#اینستاگرام #ریلز #رشد_پیج #افغان_فالورز",
    "🌟 این‌طوری پیج اینستاگرامت را قوی کن!\n\n#اینستاگرام #رشد_پیج #افغان_فالورز",
  ],
  general: [
    "🌐 اصول طلایی رشد در شبکه‌های اجتماعی\n\n#شبکه_های_اجتماعی #دیجیتال_مارکتینگ #رشد #افغان_فالورز",
    "🔑 کلیدهای رشد در شبکه‌های اجتماعی\n\n#شبکه_های_اجتماعی #رشد #افغان_فالورز",
    "📈 این‌طوری در شبکه‌های اجتماعی رشد کن!\n\n#شبکه_های_اجتماعی #دیجیتال_مارکتینگ #افغان_فالورز",
  ],
  ai: [
    "🤖 هوش مصنوعی برای شبکه‌های اجتماعی | سریع‌تر و حرفه‌ای‌تر بساز!\n\n#هوش_مصنوعی #AI #شبکه_های_اجتماعی #افغان_فالورز",
    "✨ با هوش مصنوعی محتوای پیجت را متحول کن!\n\n#هوش_مصنوعی #AI #رشد_پیج #افغان_فالورز",
    "⚙️ ترفندهای هوش مصنوعی برای تولید محتوا\n\n#هوش_مصنوعی #AI #دیجیتال_مارکتینگ #افغان_فالورز",
  ],
  tools: [
    "🛠️ ترفندها و ابزارهای هوش مصنوعی برای شبکه‌های اجتماعی\n\n#ابزار_هوش_مصنوعی #ترفند #تولید_محتوا #افغان_فالورز",
    "🤖 با این ابزارها محتوایت را حرفه‌ای کن!\n\n#هوش_مصنوعی #ابزار_رایگان #تولید_محتوا #افغان_فالورز",
    "✨ ابزارهایی که تولید محتوا را آسان می‌کنند\n\n#ترفند_محتوا #هوش_مصنوعی #افغان_فالورز",
  ],
};

const OUTRO = {
  tiktok: { tag: 'برای رشد واقعی در تیک‌تاک،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
  instagram: { tag: 'برای رشد پیج اینستاگرامت،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
  general: { tag: 'برای رشد در شبکه‌های اجتماعی،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
  ai: { tag: 'برای محتوای حرفه‌ای با هوش مصنوعی،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
  tools: { tag: 'برای محتوای حرفه‌ای‌تر،<br/>ما را دنبال کن.', follow: "دنبال کنید +" },
};

const META = {
  tiktok: "ترفندهای رشد در تیک‌تاک — افغان فالورز",
  instagram: "ترفندهای رشد در اینستاگرام — افغان فالورز",
  general: "اصول رشد در شبکه‌های اجتماعی — افغان فالورز",
  ai: "هوش مصنوعی برای شبکه‌های اجتماعی — افغان فالورز",
  tools: "ترفندها و ابزارهای هوش مصنوعی — افغان فالورز",
};

export const CATEGORIES = ["tiktok", "instagram", "tools"];
export const MUSIC_VARIANTS = 3;

// BPM of each music variant (must match music/synth.mjs VARIANTS)
const BPMS = { 1: 128, 2: 122, 3: 132 };
// Scene lengths are whole musical BEATS, so every cut lands on the beat.
// SHORT mode targets the 7-15s window where re-watch (and therefore reach) is highest.
const SHORT = process.env.LONG !== "1";
const BEATS_HOOK  = SHORT ? 8  : 8;
const BEATS_TIP   = SHORT ? 5  : 12;
const BEATS_OUTRO = SHORT ? 7  : 16;
const TIPS_PER_VIDEO = SHORT ? 4 : 8;

// Each network carries its own colours so a viewer recognises the platform
// instantly — while the editorial paper style stays consistent as our brand.
const INK = {
  instagram: { pair: ["#C1358B", "#F0722F"], paper: "#F6EFEA", tint: "rgba(193,53,139,.10)" },
  tiktok:    { pair: ["#101425", "#12A5B8"], paper: "#EFEFF2", tint: "rgba(18,165,184,.12)" },
  tools:     { pair: ["#123A63", "#0E7490"], paper: "#EFEAE1", tint: "rgba(18,58,99,.10)" },
  general:   { pair: ["#15803D", "#1E5FD0"], paper: "#EDF1EA", tint: "rgba(21,128,61,.10)" },
  ai:        { pair: ["#5B21B6", "#0E7490"], paper: "#F0EDF6", tint: "rgba(91,33,182,.10)" },
};

const KICKERS = {
  tiktok: "قابلیت تیک‌تاک",
  instagram: "قابلیت اینستاگرام",
  general: "اصل رشد",
  ai: "ترفند هوش مصنوعی",
  tools: "ابزار و ترفند",
};

// Alternate "special" scenes (counter / wrong-vs-right / phone) with the rotating
// skins so ANY 8-tip daily window is structurally mixed, never a run of look-alikes.
function interleaveKinds(bank) {
  const isSpecial = (t) => !!(t.stat || t.bad || t.phone);
  const special = bank.filter(isSpecial);
  const plain = bank.filter((t) => !isSpecial(t));
  const out = [];
  let i = 0, j = 0;
  while (out.length < bank.length) {
    if (j < plain.length) out.push(plain[j++]);
    if (i < special.length) out.push(special[i++]);
  }
  return out;
}

const FA = (n) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
// the promise on the badge must match how many items actually ship in the cut
function badgeFor(hook, count) {
  const noun = String(hook.badge || "").replace(/^[۰-۹d]+s*/, "") || "قابلیت";
  return FA(count) + " " + noun.trim();
}

// distinct per category, per feature, per day -> a track no other video shares
function musicSeedFor(cat, id, dayIndex) {
  const str = cat + "|" + id + "|" + dayIndex;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 100000;
}


// ---- opening question -------------------------------------------------
// Short-form retention rule: a video that OPENS ON A QUESTION outperforms one
// that opens on a claim, because a question is an unfinished thought and the
// brain stays to close it. The question also states which app the tip is for,
// so the right viewer self-selects in the first second.
const APP_LABEL = { instagram: "اینستاگرام", tiktok: "تیک‌تاک" };
const ASKS_APP = [
  (a) => `از این قابلیت ${a} خبر دارید؟`,
  (a) => `می‌دانستید ${a} این را دارد؟`,
  (a) => `این قابلیت ${a} را دیده‌اید؟`,
  (a) => `بیایید یک قابلیت ${a} را نشانتان بدهم`,
  (a) => `این آپدیت تازهٔ ${a} را امتحان کرده‌اید؟`,
  (a) => `این گزینهٔ ${a} را می‌شناسید؟`,
];
const ASKS_TOOL = [
  () => "این ابزار رایگان را می‌شناسید؟",
  () => "بیایید یک ابزار کاربردی معرفی کنم",
  () => "این ویب‌سایت را امتحان کرده‌اید؟",
  () => "می‌دانستید این کار رایگان می‌شود؟",
  () => "بیایید یک ترفند تازه را نشانتان بدهم",
  () => "از این ابزار خبر دارید؟",
];
// stable per (feature, day) so the same feature does not always get the same
// question, and two videos on one day never open with the same sentence
function askFor(cat, featureId, dayIndex) {
  const app = APP_LABEL[cat];
  const bank = app ? ASKS_APP : ASKS_TOOL;
  // stride 5 is coprime with the bank size, so the opening question walks the
  // whole set day by day; adding the category index guarantees the three videos
  // released on one day never open with the same sentence.
  const i = (dayIndex * 5 + CATEGORIES.indexOf(cat)) % bank.length;
  return bank[i](app);
}

function buildFeaturePack(cat, dayIndex, variant, bpm, beat, forced) {
  const f = forced || featureFor(cat, dayIndex);
  if (!f) return null;
  const steps = f.steps.slice(0, TIPS_PER_VIDEO);
  const seed = musicSeedFor(cat, f.id, dayIndex);
  // the score's identity is read from what this video teaches, same as its art
  const mood = moodFor({ id: f.id, feature: f.name, hook: f.hook, tips: steps.map((s) => ({ head: s.text })) });
  const plan = beatPlan(seed, SHORT ? 16 : 56, steps.length, mood);
  const sty = styleFor(seed, mood);
  return {
    id: f.id,
    platform: cat,
    theme: THEMES[cat],
    title: f.title,
    feature: f.name,
    hook: { badge: f.name, ask: askFor(cat, f.id, dayIndex), l1: f.hook.l1, l2: f.hook.l2 },
    tgTitle: f.tgTitle,
    kicker: KICKERS[cat] || "قابلیت",
    ink: INK[cat] || INK.tools,
    layoutSeed: 0,
    // each step is a scene: numbered, one short instruction, one illustration
    tips: steps.map((s, i) => ({ icon: s.icon, step: i + 1, head: s.text, ui: s.ui })),
    payoff: f.payoff,
    outro: OUTRO[cat],
    bpm: sty.bpm,
    musicStyle: sty.style,
    mood,
    musicVariant: seed,
    musicOutroBars: Math.max(2, Math.round(BEATS_OUTRO / 4)),
    duration: plan.duration,
    hookDuration: +(plan.hook * plan.beat).toFixed(3),
    outroDuration: +(plan.outro * plan.beat).toFixed(3),
    beat: +plan.beat.toFixed(4),
    music: `music/auto/${cat}-${f.id}-s.m4a`,
  };
}

function buildPack(cat, dayIndex) {
  const variantEarly = ((dayIndex + CATEGORIES.indexOf(cat)) % MUSIC_VARIANTS) + 1;
  if (SHORT) {
    const fp = buildFeaturePack(cat, dayIndex, variantEarly, BPMS[variantEarly], 60 / BPMS[variantEarly]);
    if (fp) return fp;
  }
  const bank = interleaveKinds(BANKS[cat]);
  const N = bank.length;
  // stride 7 (coprime with 16) → 16 distinct daily windows, and only ONE tip
  // overlaps between consecutive days, so each day reads as fresh content.
  const start = (dayIndex * 7) % N;
  const tips = Array.from({ length: TIPS_PER_VIDEO }, (_, i) => bank[(start + i) % N]);
  const variant = ((dayIndex + CATEGORIES.indexOf(cat)) % MUSIC_VARIANTS) + 1;
  const bpm = BPMS[variant];
  const beat = 60 / bpm;
  const totalBeats = BEATS_HOOK + TIPS_PER_VIDEO * BEATS_TIP + BEATS_OUTRO;
  return {
    id: cat,
    platform: cat,
    theme: THEMES[cat],
    title: META[cat],
    hook: (function(){ var h = HOOKS[cat][dayIndex % HOOKS[cat].length];
            return Object.assign({}, h, { badge: badgeFor(h, TIPS_PER_VIDEO) }); })(),
    tgTitle: TITLES[cat][dayIndex % TITLES[cat].length],
    kicker: KICKERS[cat] || "نکته",
    // rotates which layout each scene uses, and shifts it day to day
    layoutSeed: (dayIndex + CATEGORIES.indexOf(cat) * 2) % 5,
    tips,
    outro: OUTRO[cat],
    // --- beat-synced timing: every scene is a whole number of bars ---
    bpm,
    musicVariant: musicSeedFor(cat, "long", dayIndex),
    musicOutroBars: Math.max(2, Math.round(BEATS_OUTRO / 4)),
    duration: +(totalBeats * beat).toFixed(3),
    hookDuration: +(BEATS_HOOK * beat).toFixed(3),
    outroDuration: +(BEATS_OUTRO * beat).toFixed(3),
    beat: +beat.toFixed(4),
    music: `music/auto/${cat}-long.m4a`,
  };
}

// Build the pack for one named feature, regardless of whose turn it is. Lets a
// newly researched update ship the day it lands instead of waiting out the
// rotation. dayIndex still seeds the music, so the score stays unique.
export function packForFeature(id, date = new Date()) {
  const hit = featureById(id);
  if (!hit) return null;
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
  return buildFeaturePack(hit.cat, dayIndex, 1, 120, 0.5, hit.feature);
}

export function packsForDate(date = new Date()) {
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  );
  const out = { dayIndex };
  for (const c of CATEGORIES) out[c] = buildPack(c, dayIndex);
  return out;
}

// Standalone 60s educational explainer: "What is AI?" (not the social-media tips
// above — this teaches the fundamentals of artificial intelligence itself).
// Reuses THEMES.ai styling and the same buildHTML() builder via a custom pack.
export function aiEducationPack() {
  return {
    id: "ai-education",
    platform: "ai-education",
    theme: THEMES.ai,
    title: "هوش مصنوعی چیست؟ — آموزش در ۶۰ ثانیه",
    kicker: "مفهوم کلیدی",
    hook: {
      l1: 'هوش مصنوعی <span style="color:#22d3ee">AI</span> چیست؟',
      l2: 'و چطور یاد می‌گیرد؟',
    },
    tgTitle: "🤖 هوش مصنوعی چیست؟ | آموزش ساده در ۶۰ ثانیه\n\n#هوش_مصنوعی #AI #آموزش #افغان_فالورز",
    tips: [
      { icon: "chip", head: 'هوش مصنوعی <span class="hl">چیست؟</span>', sub: 'هوش مصنوعی یعنی ماشینی که می‌تواند <b class="em">یاد بگیرد، فکر کند و تصمیم بگیرد</b> — مثل یک مغز دیجیتال.' },
      { icon: "bulb", head: 'یادگیری از <span class="hl">داده‌ها</span>', sub: 'AI مثل یک دانش‌آموز است؛ با دیدن <b class="em">هزاران مثال و داده</b>، الگوها را پیدا می‌کند.' },
      { icon: "refresh", head: '<span class="hl">یادگیری ماشینی</span>', sub: 'در یادگیری ماشینی، برنامه به‌جای دستورهای ثابت، <b class="em">خودش از روی داده</b> یاد می‌گیرد.' },
      { icon: "layers", head: 'شبکه‌های <span class="hl">عصبی</span>', sub: 'شبکه‌های عصبی از <b class="em">ساختار مغز انسان</b> الهام گرفته‌اند؛ نورون‌ها، لایه‌ها و وزن‌ها.' },
      { icon: "sparkle", head: 'یادگیری <span class="hl">عمیق</span>', sub: 'یادگیری عمیق با <b class="em">لایه‌های بسیار زیاد</b>، تصویر، صدا و متن را می‌فهمد.' },
      { icon: "globe", head: 'AI در <span class="hl">زندگی روزمره</span>', sub: 'از <b class="em">دستیار صوتی و ترجمه</b> تا پیشنهاد فیلم و تشخیص عکس؛ هوش مصنوعی همه‌جا هست.' },
      { icon: "target", head: 'محدود یا <span class="hl">عمومی؟</span>', sub: 'AI امروزی <b class="em">محدود</b> است؛ هوش عمومیِ هم‌سطح انسان هنوز ساخته نشده.' },
      { icon: "heart", head: 'آینده و <span class="hl">اخلاق</span>', sub: 'AI آینده را می‌سازد؛ <b class="em">استفاده مسئولانه و انسانی</b> مهم‌ترین مهارت است.' },
    ],
    outro: {
      tag: 'برای آموزش‌های بیشتر درباره AI،<br/>ما را دنبال کن.',
      follow: "دنبال کنید +",
    },
    music: "music/bed-60s-v1.m4a",
    voice: { name: "fa-IR-FaridNeural", rate: "+0%" },
    // Verbatim Persian voiceover, in timeline order: hook, 8 sections, outro.
    narration: [
      "هوش مصنوعی چیست و چطور یاد می‌گیرد؟ بیا با هم ببینیم.",
      "هوش مصنوعی یعنی ماشینی که می‌تواند یاد بگیرد، فکر کند و تصمیم بگیرد؛ مثل یک مغز دیجیتال.",
      "هوش مصنوعی مثل یک دانش‌آموز است؛ با دیدن هزاران مثال و داده، الگوها را پیدا می‌کند.",
      "در یادگیری ماشینی، برنامه به‌جای دستورهای ثابت، خودش از روی داده یاد می‌گیرد.",
      "شبکه‌های عصبی از ساختار مغز انسان الهام گرفته‌اند؛ با نورون‌ها، لایه‌ها و وزن‌ها.",
      "یادگیری عمیق با لایه‌های بسیار زیاد، تصویر، صدا و متن را می‌فهمد.",
      "از دستیار صوتی و ترجمه تا پیشنهاد فیلم و تشخیص عکس؛ هوش مصنوعی همه‌جا هست.",
      "هوش مصنوعی امروزی محدود است؛ هوش عمومیِ هم‌سطح انسان هنوز ساخته نشده.",
      "هوش مصنوعی آینده را می‌سازد؛ استفاده مسئولانه و انسانی مهم‌ترین مهارت است.",
      "برای آموزش‌های بیشتر درباره هوش مصنوعی، ما را دنبال کن.",
    ],
  };
}

// ----------------------------------------------------------------------
// TikTok-style Persian remake of the reference (IMG_5140.MOV) — a
// 2-character animated conversation (AI avatars per the source's
// "@thegigglesandw · AI-generated" watermark). Two distinct speaker
// voices (female + male Edge neural voices), alternating turns, with
// laughter bursts placed to match the source's audio rhythm.
//
// 79s, 9:16, ~11 cuts every 7s, mirroring motion-peak positions
// 8.5 / 15 / 21 / 25 / 40 / 55 / 65 / 75 s.
// ----------------------------------------------------------------------
export function tiktokRemakePack() {
  return {
    id: "tiktok-remake",
    platform: "tiktok-remake",
    theme: THEMES.ai,
    title: "گفتگوی فارسی بین دو شخصیت — واکنش‌های بامزه",
    kicker: "گفتگوی دو نفره",
    hook: {
      l1: '<span style="color:#22d3ee">صبر کن!</span> یه چیز عجیب',
      l2: 'توی گفتگوی ما اتفاق افتاد',
    },
    tgTitle: "🤖 گفتگوی دو شخصیت | واکنش‌های بامزه به یک پیام عجیب\n\n#گفتگو #هوش_مصنوعی #تیک‌تاک #افغان_فالورز",
    duration: 79,
    hookDuration: 5,
    outroDuration: 4,
    // Two animated characters; per-beat tip is a turn in the dialogue.
    dialogue: {
      ali:   { name: "علی",   voice: "fa-IR-FaridNeural" },
      zahra: { name: "زهرا",  voice: "fa-IR-DilaraNeural" },
    },
    // Each beat: who speaks, their line, and an optional reaction burst.
    tips: [
      { speaker: "zahra", text: "علی، یه پیام عجیب اومد برام، گوش بده.", mood: "" },
      { speaker: "ali",   text: "بگو ببینم. صبر کن، این چیه؟ نه! این که شدنی نیست.", mood: "نه!" },
      { speaker: "zahra", text: "چرا نشدنی؟ خودش نوشته تا فردا صبح می‌رسه.", mood: "" },
      { speaker: "ali",   text: "اوه... منظورت اینه که الان باید جواب بدم؟", mood: "اوه…" },
      // longest turn at ~ mid-buildup
      { speaker: "zahra", text: "آره، ولی یه نگاه بهش بنداز. وسطش یه لایه‌ی پنهان هست، انگار خودش می‌دونه چی می‌خواد. هه هه هه، نگاش که می‌کنی، خودت هم می‌خندی.", mood: "😂" },
      // escalation + laughter
      { speaker: "ali",   text: "هه هه هه. جدی می‌گم، یه بار امتحان کن، خودت می‌فهمی. این دیگه از اون چیزی که فکر می‌کردم یه قدم جلوتره.", mood: "🤯" },
      // final reaction
      { speaker: "zahra", text: "همین الان داره آروم آروم همه چیز رو عوض می‌کنه. ما فقط تماشاچی‌ایم.", mood: "" },
    ],
    outro: {
      tag: 'برای قسمت بعدی و گفتگوهای تازه،<br/>ما رو دنبال کن.',
      follow: "دنبال کنید +",
    },
    music: "music/bed-60s-v1.m4a",
    // Hook + outro use the female voice; per-speaker voices are looked up
    // from pack.dialogue inside render-tiktok-remake.mjs.
    voice: { name: "fa-IR-DilaraNeural", rate: "+0%" },
    narration: [
      // HOOK line — said by زهرا so the dialogue starts with her.
      "صبر کن! یه چیز عجیب توی گفتگوی ما اتفاق افتاد.",
      // BEAT 1 — زهرا brings it up.
      "علی، یه پیام عجیب اومد برام، گوش بده.",
      // BEAT 2 — علی reacts (“نه!”), matches source's “No!” capture.
      "بگو ببینم. صبر کن، این چیه؟ نه! این که شدنی نیست.",
      // BEAT 3 — زهرا pushes back.
      "چرا نشدنی؟ خودش نوشته تا فردا صبح می‌رسه.",
      // BEAT 4 — علی reacts with surprise (“اوه...”) matching the source.
      "اوه... منظورت اینه که الان باید جواب بدم؟",
      // BEAT 5 — long زهرا mid-beat with the laugh burst near the end.
      "آره، ولی یه نگاه بهش بنداز. وسطش یه لایه‌ی پنهان هست، انگار خودش می‌دونه چی می‌خواد. هه هه هه، نگاش که می‌کنی، خودت هم می‌خندی.",
      // BEAT 6 — علی escalates + laughs.
      "هه هه هه. جدی می‌گم، یه بار امتحان کن، خودت می‌فهمی. این دیگه از اون چیزی که فکر می‌کردم یه سر و گردن جلوتره.",
      // BEAT 7 — زهرa closing thought.
      "همین الان داره آروم آروم همه چیز رو عوض می‌کنه. ما فقط تماشاچی‌ایم.",
      // OUTRO.
      "برای قسمت بعدی و گفتگوهای تازه، ما رو دنبال کن.",
    ],
    // Brand watermark band on every cut. Handle kept verbatim.
    waterMark: { handle: "@thegigglesandw", tag: "گفتگوی هوش مصنوعی" },
  };
}

export { BANKS, THEMES };
