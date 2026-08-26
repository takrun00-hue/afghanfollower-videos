// Written from what people actually search for, not from a list of app features.
//
// Sources checked August 2026: Metricool's 2026 TikTok study (2,314,756 posts,
// 92,000 accounts), Sprout Social's 2026 algorithm guide, Hootsuite's 2026
// algorithm guide, The Content Labs' audit of 4,893 videos, CreatorIQ's State of
// Creators 2026.
//
// The questions creators type, in order of how often they are asked:
//   1. "why is my video not getting views" / "stuck at 200 views"
//   2. "how do I get on the For You page"
//   3. "how much does TikTok pay"
// The earlier packs answered none of them — they taught menu paths for features
// nobody was looking for. These do, and every number in them is sourced.
//
// Hooks are written to stop a scroll: a specific pain, a number, or a claim that
// contradicts what people believe. "قابلیت X را می‌شناسید؟" does none of that.
export const DEMAND = {
  tiktok: [
    {
      id: "view-jail",
      name: "200 Views",
      benefit: { key: "seen", fa: "📈 بیشتر دیده شدن" },
      title: "چرا ویدیو در ۲۰۰ ویو گیر می‌کند — افغان فالورز",
      hook: { ask: "آیا می‌دانید چرا ویدیوهایت روی ۲۰۰ ویو گیر می‌کند؟", l1: "چرا تیک‌تاک جلوترش نمی‌برد", l2: "سه ثانیهٔ اول را عوض کن" },
      outroAsk: "ویدیوهای تو معمولاً روی چند ویو گیر می‌کنند؟",
      payoff: "ویو زیر ۵ ثانیه اصلاً حساب نمی‌شود؛ سه ثانیهٔ اول همه‌چیز است.",
      steps: [
        { path: "TikTok > Analytics", icon: "chart", text: "تیک‌تاک ویدیو را اول به گروه کوچکی نشان می‌دهد",
          screen: { title: "Analytics", rows: ["Qualified views", "Watch time", "Traffic source"], hit: 0 },
          ui: { screen: "list", title: "تحلیل", rows: ["ویو واقعی", "زمان تماشا"], hit: 0 } },
        { path: "Qualified view = 5s+", icon: "clock", text: "ویوی زیر ۵ ثانیه برای تیک‌تاک ارزش ندارد",
          ui: { screen: "compose", title: "۵ ثانیه", cta: "حد قبولی" } },
        { path: "First 3 seconds", icon: "magnet", text: "پس سه ثانیهٔ اول را عوض کن، نه هشتگ را",
          ui: { screen: "compose", title: "سه ثانیهٔ اول", cta: "قلاب تازه" } },
        { path: "Watch time > Reach", icon: "trend", text: "وقتی مردم تا آخر ببینند، تیک‌تاک پخشش می‌کند",
          ui: { screen: "result", title: "پخش گسترده" } },
      ],
      tgTitle: "🚧 چرا ویدیوت روی ۲۰۰ ویو گیر کرده؟ (جواب واقعی، نه شایعه)\n\n#tiktok #views #growth #AfghanFollowers #viral",
    },
    {
      id: "tiktok-pay",
      name: "Creator Rewards",
      benefit: { key: "money", fa: "💰 درآمد از تیک‌تاک" },
      title: "تیک‌تاک چقدر پول می‌دهد — افغان فالورز",
      hook: { ask: "آیا می‌دانید تیک‌تاک برای هر ۱۰۰۰ ویو چقدر می‌دهد؟", l1: "عدد واقعی", l2: "و چطور به آن برسی" },
      outroAsk: "تا حالا از تیک‌تاک پول گرفته‌ای؟",
      payoff: "فقط ویو واقعی پول دارد؛ ویوی یک‌ثانیه‌ای هیچ.",
      steps: [
        { path: "Creator Rewards", icon: "chart", text: "تیک‌تاک بابت هر هزار ویوِ واقعی حدود نیم دلار می‌دهد",
          screen: { title: "Creator Rewards", rows: ["Qualified views", "Estimated revenue", "Eligibility"], hit: 1 },
          ui: { screen: "list", title: "درآمد", rows: ["ویو واقعی", "درآمد تخمینی"], hit: 1 } },
        { path: "Qualified view", icon: "clock", text: "ویو واقعی یعنی بیننده‌ای که بیش از ۵ ثانیه ببیند",
          ui: { screen: "compose", title: "ویو واقعی", cta: "۵ ثانیه به بالا" } },
        { path: "60-90 seconds", icon: "play", text: "ویدیوی یک تا یک‌ونیم دقیقه‌ای درآمد بیشتری دارد",
          ui: { screen: "compose", title: "طول ویدیو", cta: "۶۰ تا ۹۰ ثانیه" } },
        { path: "Brand deals", icon: "users", text: "ولی درآمد اصلی از تبلیغ برندهاست، نه از خود اپ",
          ui: { screen: "result", title: "تبلیغ برند" } },
      ],
      tgTitle: "💰 تیک‌تاک بابت هزار ویو چقدر می‌دهد؟ عدد واقعی\n\n#tiktok #makemoney #AfghanFollowers #viral",
    },
  ],

  instagram: [
    {
      id: "hashtags-hurt",
      name: "Keywords > Hashtags",
      benefit: { key: "seen", fa: "📈 بیشتر دیده شدن" },
      title: "هشتگ در اینستاگرام دیگر کار نمی‌کند — افغان فالورز",
      hook: { ask: "آیا می‌دانید هشتگ‌ها ویوِ پستت را کم می‌کنند؟", l1: "۳۱٪ بازدید کمتر", l2: "با هشتگ نسبت به بدون آن" },
      outroAsk: "تو هنوز هشتگ می‌گذاری یا کنارش گذاشتی؟",
      payoff: "پست‌های هشتگ‌دار حدود یک‌سوم بازدید کمتری می‌گیرند.",
      steps: [
        { path: "Caption > Keywords", icon: "chart", text: "پست با هشتگ حدود ۳۱٪ بازدید کمتر می‌گیرد",
          ui: { screen: "compose", title: "کپشن", cta: "بدون هشتگ" } },
        { path: "Write to be searched", icon: "magnet", text: "به‌جایش همان کلمه‌ای را بنویس که مردم جستجو می‌کنند",
          ui: { screen: "compose", title: "کپشن", cta: "کلمهٔ کلیدی" } },
        { path: "Google & Bing", icon: "globe", text: "کپشن اینستاگرام در گوگل هم نمایه می‌شود",
          ui: { screen: "tool", url: "google.com", cta: "نتیجهٔ جستجو" } },
        { path: "Max 5 tags", icon: "hashtag", text: "اگر هشتگ می‌گذاری، حداکثر پنج‌تا و دقیق",
          ui: { screen: "result", title: "کپشن آماده" } },
      ],
      tgTitle: "⚠️ هشتگ در اینستاگرام حالا ویو می‌خورد — چه بگذاریم؟\n\n#instagram #seo #growth #AfghanFollowers #viral",
    },
    {
      id: "ask-dont-beg",
      name: "Comments 26%",
      benefit: { key: "viral", fa: "🔥 تعامل بیشتر" },
      title: "چه چیزی از مخاطب بخواهیم — افغان فالورز",
      hook: { ask: "آیا می‌دانید یک جمله در کپشن، لایک و ویوَت را کم می‌کند؟", l1: "لایکت ۶۰٪ کم می‌شود", l2: "این را بگو به‌جایش" },
      outroAsk: "آخرین پستت چند کامنت گرفت؟",
      payoff: "سؤال بپرس؛ کامنت بالا می‌رود و کامنت یعنی پخش بیشتر.",
      steps: [
        { path: "Don't ask for likes", icon: "heart", text: "پست‌هایی که «لایک کن» دارند، ۶۰٪ لایک کمتر می‌گیرند",
          ui: { screen: "compose", title: "کپشن", cta: "بدون درخواست لایک" } },
        { path: "Ask a question", icon: "chat", text: "به‌جایش یک سؤال مشخص بپرس",
          ui: { screen: "compose", title: "کپشن", cta: "سؤال بپرس" } },
        { path: "+26% comments", icon: "trend", text: "سؤال، کامنت را حدود ۲۶٪ بالا می‌برد",
          ui: { screen: "result", title: "کامنت بیشتر" } },
        { path: "Saves > Likes", icon: "bookmark", text: "و چیزی بساز که ارزش ذخیره کردن داشته باشد",
          ui: { screen: "result", title: "ذخیره شد" } },
      ],
      tgTitle: "🚫 «لایک کنید» نگو — این کار لایکت را ۶۰٪ کم می‌کند\n\n#instagram #engagement #AfghanFollowers #viral",
    },
  ],

  tools: [
    {
      id: "hook-17x",
      name: "Hook = 17x",
      benefit: { key: "viral", fa: "🔥 وایرال شدن" },
      title: "قلاب ضعیف چقدر ویو می‌خورد — افغان فالورز",
      hook: { ask: "آیا می‌دانید سه ثانیهٔ اول چقدر از ویوَت را می‌خورد؟", l1: "بررسی ۴۸۹۳ ویدیو:", l2: "قلاب ۱۷ برابر تعیین‌کننده است" },
      outroAsk: "سخت‌ترین بخش ساخت ویدیو برای تو کدام است؟",
      payoff: "بررسی ۴۸۹۳ ویدیو: قلاب و ریتم از هر چیز دیگری مهم‌ترند.",
      steps: [
        { path: "Hook = first 3s", icon: "magnet", text: "بررسی ۴۸۹۳ ویدیو نشان داد قلاب خراب ۱۷ برابر ویو می‌خورد",
          ui: { screen: "compose", title: "قلاب", cta: "سه ثانیهٔ اول" } },
        { path: "Pacing = 14x", icon: "clock", text: "ریتم کند هم ۱۴ برابر — هر جا سه ثانیه اتفاقی نمی‌افتد، ببُر",
          ui: { screen: "compose", title: "ریتم", cta: "برش بزن" } },
        { path: "claude.ai", icon: "bulb", text: "ده قلاب بساز و بهترین را بردار",
          brand: { name: "Claude", url: "claude.ai", color: "#D97757", tagline: "ده قلاب در یک دقیقه" },
          ui: { screen: "tool", url: "claude.ai", cta: "ساخت قلاب" } },
        { path: "No 'hey guys'", icon: "bolt", text: "با «سلام دوستان» شروع نکن؛ مستقیم برو سر اصل مطلب",
          ui: { screen: "result", title: "قلاب آماده" } },
      ],
      tgTitle: "🪝 قلاب ضعیف ۱۷ برابر ویو می‌خورد — بررسی ۴۸۹۳ ویدیو\n\n#contentcreator #viral #AfghanFollowers",
    },
    {
      id: "mute-30",
      name: "Captions",
      benefit: { key: "seen", fa: "📈 بیشتر دیده شدن" },
      title: "بیش از ۳۰٪ بی‌صدا می‌بینند — افغان فالورز",
      hook: { ask: "آیا می‌دانید چند نفر از بیننده‌هایت ویدیو را بی‌صدا می‌بینند؟", l1: "۳۰ درصد مردم", l2: "ویدیو را بی‌صدا می‌بینند" },
      outroAsk: "خودت ویدیوها را با صدا می‌بینی یا بی‌صدا؟",
      payoff: "زیرنویس یعنی همان یک‌سوم هم پیامت را می‌گیرند.",
      steps: [
        { path: "30% watch on mute", icon: "chart", text: "بیش از ۳۰٪ کاربران ویدیو را بی‌صدا می‌بینند",
          ui: { screen: "compose", title: "بی‌صدا", cta: "۳۰٪ مخاطب" } },
        { path: "CapCut > Captions", icon: "pen", text: "در کپ‌کات زیرنویس خودکار بساز",
          brand: { name: "CapCut", url: "capcut.com", color: "#000000", tagline: "زیرنویس خودکار" },
          ui: { screen: "tool", url: "capcut.com", cta: "زیرنویس" } },
        { path: "Fix the errors", icon: "write", text: "غلط‌های فارسی را دستی اصلاح کن",
          ui: { screen: "compose", title: "ویرایش زیرنویس", cta: "اصلاح" } },
        { path: "Keep text high", icon: "target", text: "متن را بالاتر بگذار تا زیر رابط اپ نرود",
          ui: { screen: "result", title: "آماده" } },
      ],
      tgTitle: "🔇 یک‌سوم بیننده‌هایت صدا را نمی‌شنوند — زیرنویس بگذار\n\n#editing #contentcreator #AfghanFollowers #viral",
    },
  ],
};
