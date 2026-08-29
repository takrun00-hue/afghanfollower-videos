// Written from what people actually search for, not from a list of app features.
//
// Sources checked August 2026: Metricool's 2026 TikTok study (2,314,756 posts,
// 92,000 accounts), Sprout Social's 2026 algorithm guide, Hootsuite's 2026
// algorithm guide, The Content Labs' audit of 4,893 videos, CreatorIQ's State of
// Creators 2026.
//
// These are demand-led questions, but payout amounts and engagement percentages
// vary by market, eligibility and format. Never put an unsourced fixed number
// in the video. The current research record lives in RESEARCH-VIRAL-2026-08-27.md.
//
// Hooks are written to stop a scroll: a specific pain, a number, or a claim that
// contradicts what people believe. "قابلیت X را می‌شناسید؟" does none of that.
export const DEMAND = {
  tiktok: [
    {
      id: "view-jail",
      name: "200 Views",
      benefit: { key: "seen", fa: "📈 بیشتر دیده شدن" },
      title: "چرا ویدیو در ۲۰۰ ویو گیر می‌کند — GapMedia",
      hook: { ask: "آیا می‌دانید چرا ویدیوهایت روی ۲۰۰ ویو گیر می‌کند؟", l1: "چرا تیک‌تاک جلوترش نمی‌برد", l2: "سه ثانیهٔ اول را عوض کن" },
      outroAsk: "ویدیوهای تو معمولاً روی چند ویو گیر می‌کنند؟",
      payoff: "اولین ثانیه‌ها تعیین می‌کند مخاطب می‌ماند یا رد می‌کند؛ آمار خودت را ببین.",
      steps: [
        { path: "TikTok > Analytics", icon: "chart", text: "تیک‌تاک ویدیو را اول به گروه کوچکی نشان می‌دهد",
          screen: { title: "Analytics", rows: ["Qualified views", "Watch time", "Traffic source"], hit: 0 },
          ui: { screen: "list", title: "تحلیل", rows: ["ویو واقعی", "زمان تماشا"], hit: 0 } },
        { path: "Watch time", icon: "clock", text: "زمان تماشا و افت مخاطب را در آمار ببین",
          ui: { screen: "compose", title: "Watch time", cta: "زمان تماشا" } },
        { path: "First 3 seconds", icon: "magnet", text: "پس سه ثانیهٔ اول را عوض کن، نه هشتگ را",
          ui: { screen: "compose", title: "سه ثانیهٔ اول", cta: "قلاب تازه" } },
        { path: "Watch time > Reach", icon: "trend", text: "وقتی مردم تا آخر ببینند، تیک‌تاک پخشش می‌کند",
          ui: { screen: "result", title: "پخش گسترده" } },
      ],
      tgTitle: "🚧 چرا ویدیوت روی ۲۰۰ ویو گیر کرده؟ (جواب واقعی، نه شایعه)\n\n#tiktok #views #growth #GapMedia #viral",
    },
    {
      id: "tiktok-pay",
      name: "Creator Rewards",
      benefit: { key: "money", fa: "💰 درآمد از تیک‌تاک" },
      title: "تیک‌تاک چقدر پول می‌دهد — GapMedia",
      hook: { ask: "آیا ویوهای تیک‌تاکت اصلاً برای درآمد واجد شرایط هستند؟", l1: "قبل از شمردن درآمد", l2: "شرایط اکانتت را چک کن" },
      outroAsk: "تا حالا از تیک‌تاک پول گرفته‌ای؟",
      payoff: "درآمد تیک‌تاک به کشور، شرایط برنامه و نوع ویو وابسته است؛ اول واجدشرایط‌بودن را چک کن.",
      steps: [
        { path: "Creator Rewards", icon: "chart", text: "بخش درآمد و شرایط واجدشرایط‌بودن را باز کن",
          screen: { title: "Creator Rewards", rows: ["Qualified views", "Estimated revenue", "Eligibility"], hit: 1 },
          ui: { screen: "list", title: "درآمد", rows: ["ویو واقعی", "درآمد تخمینی"], hit: 1 } },
        { path: "Eligibility", icon: "clock", text: "کشور، سن و شرایط برنامه را با حساب خودت تطبیق بده",
          ui: { screen: "compose", title: "Eligibility", cta: "بررسی شرایط" } },
        { path: "Qualified views", icon: "play", text: "تعریف View واجدشرایط را داخل همان صفحه بخوان",
          ui: { screen: "compose", title: "Qualified views", cta: "جزئیات" } },
        { path: "Creator Marketplace", icon: "users", text: "برای همکاری تبلیغی، پروفایل و نمونه‌کارت را کامل کن",
          ui: { screen: "result", title: "تبلیغ برند" } },
      ],
      tgTitle: "💰 تیک‌تاک بابت هزار ویو چقدر می‌دهد؟ عدد واقعی\n\n#tiktok #makemoney #GapMedia #viral",
    },
  ],

  instagram: [
    {
      id: "hashtags-hurt",
      name: "Keywords > Hashtags",
      benefit: { key: "seen", fa: "📈 بیشتر دیده شدن" },
      title: "هشتگ در اینستاگرام دیگر کار نمی‌کند — GapMedia",
      hook: { ask: "پستت با همان عبارتی پیدا شود که مردم Search می‌کنند", l1: "به‌جای حدس", l2: "با کلمهٔ درست پیدا شو" },
      outroAsk: "تو هنوز هشتگ می‌گذاری یا کنارش گذاشتی؟",
      payoff: "کلمهٔ دقیقِ موضوع را در متن و کاور روشن بنویس؛ هشتگ جای موضوع واضح را نمی‌گیرد.",
      steps: [
        { path: "Caption > Keywords", icon: "chart", text: "کلمهٔ اصلی موضوع را در Caption روشن بنویس",
          ui: { screen: "compose", title: "کپشن", cta: "بدون هشتگ" } },
        { path: "Write to be searched", icon: "magnet", text: "به‌جایش همان کلمه‌ای را بنویس که مردم جستجو می‌کنند",
          ui: { screen: "compose", title: "کپشن", cta: "کلمهٔ کلیدی" } },
        { path: "Google & Bing", icon: "globe", text: "کپشن اینستاگرام در گوگل هم نمایه می‌شود",
          ui: { screen: "tool", url: "google.com", cta: "نتیجهٔ جستجو" } },
        { path: "Max 5 tags", icon: "hashtag", text: "اگر هشتگ می‌گذاری، حداکثر پنج‌تا و دقیق",
          ui: { screen: "result", title: "کپشن آماده" } },
      ],
      tgTitle: "⚠️ هشتگ در اینستاگرام حالا ویو می‌خورد — چه بگذاریم؟\n\n#instagram #seo #growth #GapMedia #viral",
    },
    {
      id: "ask-dont-beg",
      name: "Comments 26%",
      benefit: { key: "viral", fa: "🔥 تعامل بیشتر" },
      title: "چه چیزی از مخاطب بخواهیم — GapMedia",
      hook: { ask: "می‌خواهید Caption به‌جای گداییِ لایک، گفت‌وگو بسازد؟", l1: "آخر پست", l2: "یک سؤال دقیق بپرس" },
      outroAsk: "آخرین پستت چند کامنت گرفت؟",
      payoff: "سؤال مشخص، فرصت پاسخ می‌دهد؛ محتوای قابل‌ذخیره هم دلیل برگشتن می‌سازد.",
      steps: [
        { path: "Don't ask for likes", icon: "heart", text: "به‌جای «لایک کنید»، یک سؤال مرتبط با موضوع بنویس",
          ui: { screen: "compose", title: "کپشن", cta: "بدون درخواست لایک" } },
        { path: "Ask a question", icon: "chat", text: "به‌جایش یک سؤال مشخص بپرس",
          ui: { screen: "compose", title: "کپشن", cta: "سؤال بپرس" } },
        { path: "Specific question", icon: "trend", text: "سؤال باید یک جواب ساده و مشخص داشته باشد",
          ui: { screen: "result", title: "کامنت بیشتر" } },
        { path: "Saves > Likes", icon: "bookmark", text: "و چیزی بساز که ارزش ذخیره کردن داشته باشد",
          ui: { screen: "result", title: "ذخیره شد" } },
      ],
      tgTitle: "🚫 «لایک کنید» نگو — این کار لایکت را ۶۰٪ کم می‌کند\n\n#instagram #engagement #GapMedia #viral",
    },
  ],

  tools: [
    {
      id: "hook-17x",
      name: "Hook = 17x",
      benefit: { key: "viral", fa: "🔥 وایرال شدن" },
      title: "قلاب ضعیف چقدر ویو می‌خورد — GapMedia",
      hook: { ask: "آیا سه ثانیهٔ اولِ ویدیویت دلیل کافی برای توقف اسکرول دارد؟", l1: "قبل از Edit", l2: "هوک را تست کن" },
      outroAsk: "سخت‌ترین بخش ساخت ویدیو برای تو کدام است؟",
      payoff: "هوک باید منفعت، تضاد یا سؤال حل‌نشده را در همان فریم اول نشان بدهد.",
      steps: [
        { path: "Hook = first 3s", icon: "magnet", text: "فریم اول را با منفعتی که مخاطب می‌خواهد شروع کن",
          ui: { screen: "compose", title: "قلاب", cta: "سه ثانیهٔ اول" } },
        { path: "Pacing", icon: "clock", text: "هر بخش باید یا نکتهٔ تازه بدهد یا تصویر را عوض کند",
          ui: { screen: "compose", title: "ریتم", cta: "برش بزن" } },
        { path: "claude.ai", icon: "bulb", text: "ده قلاب بساز و بهترین را بردار",
          brand: { name: "Claude", url: "claude.ai", color: "#D97757", tagline: "ده قلاب در یک دقیقه" },
          ui: { screen: "tool", url: "claude.ai", cta: "ساخت قلاب" } },
        { path: "No 'hey guys'", icon: "bolt", text: "با «سلام دوستان» شروع نکن؛ مستقیم برو سر اصل مطلب",
          ui: { screen: "result", title: "قلاب آماده" } },
      ],
      tgTitle: "🪝 قلاب ضعیف ۱۷ برابر ویو می‌خورد — بررسی ۴۸۹۳ ویدیو\n\n#contentcreator #hook #retention #shortvideo #viral #GapMedia",
    },
    {
      id: "mute-30",
      name: "Captions",
      benefit: { key: "seen", fa: "📈 بیشتر دیده شدن" },
      title: "بیش از ۳۰٪ بی‌صدا می‌بینند — GapMedia",
      hook: { ask: "اگر ویدیویت بی‌صدا دیده شود، آیا هنوز مفهومش روشن است؟", l1: "برای View بیشتر", l2: "زیرنویس را جدی بگیر" },
      outroAsk: "خودت ویدیوها را با صدا می‌بینی یا بی‌صدا؟",
      payoff: "زیرنویسِ درست، پیام ویدیو را بدون صدا هم روشن نگه می‌دارد.",
      steps: [
        { path: "Watch without sound", icon: "chart", text: "ویدیو را یک‌بار بی‌صدا ببین؛ پیام باید روشن بماند",
          ui: { screen: "compose", title: "بی‌صدا", cta: "۳۰٪ مخاطب" } },
        { path: "CapCut > Captions", icon: "pen", text: "در کپ‌کات زیرنویس خودکار بساز",
          brand: { name: "CapCut", url: "capcut.com", color: "#000000", tagline: "زیرنویس خودکار" },
          ui: { screen: "tool", url: "capcut.com", cta: "زیرنویس" } },
        { path: "Fix the errors", icon: "write", text: "غلط‌های فارسی را دستی اصلاح کن",
          ui: { screen: "compose", title: "ویرایش زیرنویس", cta: "اصلاح" } },
        { path: "Keep text high", icon: "target", text: "متن را بالاتر بگذار تا زیر رابط اپ نرود",
          ui: { screen: "result", title: "آماده" } },
      ],
      tgTitle: "🔇 یک‌سوم بیننده‌هایت صدا را نمی‌شنوند — زیرنویس بگذار\n\n#editing #contentcreator #GapMedia #viral",
    },
  ],
};
