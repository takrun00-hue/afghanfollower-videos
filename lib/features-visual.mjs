// High-intent tutorials with a verified, recognisable in-app screen.
// The hook promises one benefit, then the video proves where to tap.
export const VISUAL = {
  instagram: [
    {
      // This override deliberately shares the current feature id. The visual
      // bank is read before the older bank, so today's requested render uses a
      // direct hook and one clear in-app route instead of a generic card.
      id: "ig-insights-retention",
      benefit: { key: "viral", fa: "بفهم ریلزت در کدام ثانیه ویو از دست می‌دهد" },
      name: "Reels Insights",
      title: "نقطهٔ افت ویو در ریلز — GapMedia",
      hook: {
        ask: "ریلزت کجا ویو از دست می‌دهد؟",
        l1: "افت ویو را", l2: "در همان ثانیه پیدا کن",
      },
      payoff: "در ویدیوی بعدی، همان ثانیه را با یک تصویر یا جملهٔ تازه عوض کن.",
      outroAsk: "مخاطب تو معمولاً در کدام ثانیه می‌رود؟",
      steps: [
        { path: "Profile > Reels > View insights", icon: "play", text: "ریلز خودت را باز کن و View insights را بزن", screen: { title: "Your reel", rows: ["View insights", "Share", "Edit"], hit: 0 } },
        { path: "Reels insights > Watch time", icon: "chart", text: "در Reels insights، بخش Watch time را پیدا کن", screen: { title: "Reels insights", rows: ["Views", "Watch time", "Shares"], hit: 1 } },
        { path: "Watch time > Retention", icon: "target", text: "Retention را باز کن و جایی را ببین که نمودار سقوط می‌کند", screen: { title: "Watch time", rows: ["Average watch time", "Retention", "Follows"], hit: 1 } },
        { path: "Edit > first seconds", icon: "pen", text: "در Edit بعدی، همان چند ثانیهٔ اول را کوتاه‌تر و جذاب‌تر بساز", screen: { title: "Edit reel", rows: ["Trim first seconds", "Add text", "Replace clip"], hit: 0 } },
      ],
      tgTitle: "📉 ریلزت کجا ویو از دست می‌دهد؟ با Reels Insights نقطهٔ افت را پیدا کن.\n\n#Instagram #Reels #ContentCreator #viral #GapMedia",
    },
  ],
  tiktok: [
    {
      // This is not a "secret algorithm" claim. TikTok's own explanation says
      // that a viewer completing a longer video is a stronger interest signal
      // than weaker context signals. The lesson therefore teaches a concrete
      // opening test, with the actual For You screens as visual evidence.
      id: "tiktok-first-seconds-signal",
      benefit: { key: "viral", fa: "شروع ویدیویت را طوری بساز که بیننده زود رد نکند" },
      name: "For You signals",
      title: "چرا ویدیو زود رد می‌شود؟ — GapMedia",
      design: {
        family: "tiktok-signal-lab",
        ink: { pair: ["#25F4EE", "#FE2C55"], paper: "#090C12", tint: "rgba(37,244,238,.12)" },
        mood: "focus",
        rhythm: "brisk",
      },
      // The hook deliberately names neither TikTok nor the answer. The real
      // three-phone For You image gives context while the question keeps the
      // answer for the following slides.
      hookPhoto: "public/screens/tt-keywords-3.jpg",
      hook: {
        ask: "چرا بعضی ویدیوها، قبل از دیده شدن، خیلی زود خاموش می‌شوند؟",
        l1: "چرا ویدیوت", l2: "خیلی زود رد می‌شود؟",
      },
      payoff: "در ویدیوی بعدی، فقط شروع را عوض کن و تفاوت نگه‌داشتن بیننده را در آمار مقایسه کن.",
      outroAsk: "شروع ویدیوی تو در یک جمله، چه قولی به مخاطب می‌دهد؟",
      source: "https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en",
      steps: [
        {
          path: "For You > first frame", icon: "play",
          text: "در همان فریم اول، نتیجه یا مشکل اصلی را نشان بده؛ مقدمهٔ طولانی را حذف کن",
          photo: "public/screens/tt-keywords-3.jpg", photoAlt: "TikTok For You feed — official example", photoFocus: "feed-left",
          visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en", sourceType: "official-ui", claim: "نمونهٔ واقعی از صفحهٔ For You", mainVisual: "public/screens/tt-keywords-3.jpg", whatItProves: "محیط واقعیِ For You با یک ویدیو در هر صفحه", motionAction: "نمای اول For You نزدیک می‌شود", secondaryMotion: "نشانگر روی شروع ویدیو می‌نشیند", ambientMotion: "بازتاب نور صفحه آرام حرکت می‌کند", coverage: 0.60 },
        },
        {
          path: "For You > watch signal", icon: "target",
          text: "بعد یک دلیل روشن بده که بیننده بماند؛ مثلاً نتیجه را تا آخر ویدیو نگه دار",
          photo: "public/screens/tt-keywords-3.jpg", photoAlt: "TikTok For You feed — official example", photoFocus: "feed-center",
          visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en", sourceType: "official-ui", claim: "تعامل بیننده، از جمله کامل‌دیدن، در پیشنهاد محتوا اثر دارد", mainVisual: "public/screens/tt-keywords-3.jpg", whatItProves: "نمونهٔ واقعی از نمایش ویدیو در For You", motionAction: "نشانگر مکث روی ویدیو را نشان می‌دهد", secondaryMotion: "خط نگه‌داشت روی قاب کشیده می‌شود", ambientMotion: "هالهٔ سیگنال آهسته می‌تپد", coverage: 0.60 },
        },
        {
          path: "For You > video information", icon: "pen",
          text: "کپشن، صدا و هشتگ را با همان موضوع ویدیوت هماهنگ کن؛ چیز نامربوط اضافه نکن",
          photo: "public/screens/tt-keywords-3.jpg", photoAlt: "TikTok For You feed — official example", photoFocus: "feed-right",
          visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en", sourceType: "official-ui", claim: "اطلاعات ویدیو، مانند کپشن، صدا و هشتگ، از عوامل پیشنهاد محتوا هستند", mainVisual: "public/screens/tt-keywords-3.jpg", whatItProves: "نمونهٔ واقعی از کپشن، صدا و هشتگ زیر ویدیوی TikTok", motionAction: "لایهٔ اطلاعات ویدیو از پایین باز می‌شود", secondaryMotion: "سه برچسب اطلاعاتی قفل می‌شوند", ambientMotion: "نوار صدا آرام موج می‌زند", coverage: 0.60 },
        },
        {
          path: "Profile > Analytics", icon: "chart",
          text: "بعد از انتشار، آمار را ببین؛ اگر بیشتر مردم زود رفتند، فقط شروع همان ویدیو را دوباره بساز",
          photo: "public/screens/tt-keywords-3.jpg", photoAlt: "TikTok For You feed — official example", photoFocus: "feed-compare",
          visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en", sourceType: "official-ui", claim: "توصیهٔ محتوا بر پایهٔ ترکیبی از تعامل و اطلاعات ویدیو انجام می‌شود", mainVisual: "public/screens/tt-keywords-3.jpg", whatItProves: "سه نمونهٔ متفاوت از محتوای پیشنهادی در محیط واقعی For You", motionAction: "سه قاب برای مقایسه کنار هم می‌نشینند", secondaryMotion: "نقطهٔ تحلیل روی قاب فعال می‌شود", ambientMotion: "خطوط شبکه به‌آرامی حرکت می‌کنند", coverage: 0.60 },
        },
      ],
      tgTitle: "🧠 چرا ویدیوت خیلی زود رد می‌شود؟ این ۴ قدم را برای شروع قوی‌تر ببین\n\n#TikTok #ContentCreator #WatchTime #viral #GapMedia",
    },
    {
      id: "search-insights-real-ui",
      benefit: { key: "viral", fa: "موضوعی بساز که مردم همین حالا جستجو می‌کنند" },
      name: "Creator Search Insights",
      title: "از Search تیک‌تاک ویو بگیر — GapMedia",
      // Each frame is a single, full TikTok screen — never two app pages in
      // the same slide. These crops come from TikTok's official example UI.
      // Was a generic stock photo of a hand holding a phone with a fake
      // "Search..." bar drawn on top — not TikTok, not the actual feature,
      // and reported as a weak first slide (2026-09-07). Replaced with a real
      // crop of the app's own screenshot (the title + the three big Search
      // analytics numbers), cropped tight enough to land outside the "phone"
      // aspect range so build-ink.mjs renders it full and uncropped as a
      // panel, instead of guessing at an object-position on the whole shot.
      hookPhoto: "public/sources/creator-search-hook-real.png",
      hook: {
        // Short, direct hook: it is easier to say naturally than a formal
        // «می‌خواهید…» sentence and still opens the viewer's question loop.
        ask: "موضوعت را حدس می‌زنی؛ مخاطب همان را Search کرده است.",
        l1: "ویو از Search",
        l2: "نه فقط For You",
      },
      payoff: "به‌جای حدس‌زدن، موضوعی را انتخاب می‌کنی که مردم واقعاً دنبالش هستند.",
      outroAsk: "موضوع بعدی ویدیوی تو چیست؟",
      source: "https://newsroom.tiktok.com/creator-search-insights?lang=en",
      steps: [
        { path: "Search > creator search insights", icon: "target", text: "بالای TikTok روی Search بزن و Creator Search Insights را بنویس", photo: "public/sources/tiktok-creator-search-real.png", photoFocus: "search", visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/creator-search-insights?lang=en", sourceType: "official-ui", claim: "مسیر Search برای رسیدن به Creator Search Insights", mainVisual: "public/sources/tiktok-creator-search-real.png", whatItProves: "اسکرین واقعیِ قابلیت جست‌وجوی سازندگان TikTok", motionAction: "کادر Search تایپ می‌شود", secondaryMotion: "نشانگر روی نتیجه می‌نشیند", ambientMotion: "بازتاب صفحه به‌آرامی حرکت می‌کند", coverage: 0.58 } },
        { path: "Creator Search Insights", icon: "play", text: "صفحه را باز کن؛ اینجا موضوع‌هایی را می‌بینی که مردم واقعاً Search می‌کنند", photo: "public/sources/tiktok-creator-search-overview-real.png", photoFocus: "search", visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/creator-search-insights?lang=en", sourceType: "official-ui", claim: "نمایش موضوع‌های واقعیِ جست‌وجوشده", mainVisual: "public/sources/tiktok-creator-search-overview-real.png", whatItProves: "نمای کلی واقعی Creator Search Insights", motionAction: "فهرست موضوع‌ها باز می‌شود", secondaryMotion: "یک نتیجه برجسته می‌شود", ambientMotion: "نور صفحه بسیار آرام تغییر می‌کند", coverage: 0.58 } },
        { path: "Creator Search Insights > Content gap", icon: "chart", text: "Content gap را بزن تا موضوعِ پرجستجو اما کم‌محتوا را پیدا کنی", photo: "public/sources/tiktok-creator-search-real.png", photoFocus: "gap", visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/creator-search-insights?lang=en", sourceType: "official-ui", claim: "انتخاب Content gap برای پیدا کردن فرصت محتوا", mainVisual: "public/sources/tiktok-creator-search-real.png", whatItProves: "بخش واقعی Content gap در رابط TikTok", motionAction: "کادر Content gap قفل می‌شود", secondaryMotion: "نقطهٔ لمس ظاهر می‌شود", ambientMotion: "بافت پس‌زمینه نفس می‌کشد", coverage: 0.58 } },
        { path: "Search analytics", icon: "pen", text: "بعد از انتشار، Search analytics را ببین تا بفهمی کدام موضوع برایت ویو آورده", photo: "public/official-ui/tiktok-search-analytics.png", photoFocus: "analytics", visualEvidence: { sourceUrl: "https://newsroom.tiktok.com/creator-search-insights?lang=en", sourceType: "official-ui", claim: "بررسی نتیجهٔ جست‌وجو پس از انتشار", mainVisual: "public/official-ui/tiktok-search-analytics.png", whatItProves: "نمای واقعی Search analytics", motionAction: "خط تحلیل در قاب آشکار می‌شود", secondaryMotion: "نقطهٔ داده روی نمودار می‌نشیند", ambientMotion: "هالهٔ نمودار آرام حرکت می‌کند", coverage: 0.56 } },
      ],
      tgTitle: "🔎 موضوعت را حدس می‌زنی یا می‌بینی مردم واقعاً چه Search می‌کنند؟ با Creator Search Insights پیدا کن\n\n#TikTok #TikTokSEO #ContentCreator #viral #GapMedia",
    },
  ],
  tools: [
    {
      id: "google-vids-product-demo",
      benefit: { key: "money", fa: "برای محصولت ویدیوی معرفی بساز، بدون فیلم‌برداری پیچیده" },
      name: "Google Vids",
      title: "ویدیوی محصول با Google Vids — GapMedia",
      hookPhoto: "public/sources/google-vids-official.png",
      hook: {
        ask: "برای محصولت ویدیو می‌خواهی، اما دوربین و بازیگر نداری؟",
        l1: "یک عکس محصول", l2: "چطور ویدیوی معرفی می‌شود؟",
      },
      payoff: "وقتی نمونهٔ محصول و پیام فروش روشن باشد، ساخت پیش‌نویس ویدیو سریع‌تر می‌شود.",
      outroAsk: "برای کدام محصولت اول یک ویدیوی معرفی می‌سازی؟",
      source: "https://workspace.google.com/products/vids/",
      steps: [
        { path: "Google Vids > New video", icon: "play", text: "Google Vids را باز کن و New video را بزن", photo: "public/sources/google-vids-official.png", photoFocus: "vids-start", visualEvidence: { sourceUrl: "https://workspace.google.com/products/vids/", sourceType: "official-ui", claim: "شروع یک ویدیوی جدید در Google Vids", mainVisual: "public/sources/google-vids-official.png", whatItProves: "رابط رسمی Google Vids", motionAction: "دکمهٔ شروع برجسته می‌شود", secondaryMotion: "نقطهٔ لمس روی دکمه می‌نشیند", ambientMotion: "نور پنل آرام تغییر می‌کند", coverage: 0.55 } },
        { path: "Help me create", icon: "pen", text: "در Help me create، محصول و پیام کوتاهت را بنویس", photo: "public/sources/google-vids-official.png", photoFocus: "vids-prompt", visualEvidence: { sourceUrl: "https://workspace.google.com/products/vids/", sourceType: "official-ui", claim: "دادن توضیح کوتاه برای ساخت پیش‌نویس", mainVisual: "public/sources/google-vids-official.png", whatItProves: "بخش رسمی ساخت ویدیو با راهنمایی AI", motionAction: "متن در کادر Prompt نوشته می‌شود", secondaryMotion: "کرسر حرکت می‌کند", ambientMotion: "درخشش کادر بسیار آرام است", coverage: 0.55 } },
        { path: "Add media > Preview", icon: "camera", text: "عکس محصولت را Add media کن و Preview را ببین", photo: "public/sources/google-vids-official.png", photoFocus: "vids-preview", visualEvidence: { sourceUrl: "https://workspace.google.com/products/vids/", sourceType: "official-ui", claim: "افزودن تصویر محصول و دیدن پیش‌نمایش", mainVisual: "public/sources/google-vids-official.png", whatItProves: "بخش پیش‌نمایش رسمی Google Vids", motionAction: "پیش‌نمایش محصول بزرگ می‌شود", secondaryMotion: "کادر انتخاب روشن می‌شود", ambientMotion: "سایهٔ پنل آرام جابه‌جا می‌شود", coverage: 0.55 } },
        { path: "Share", icon: "share", text: "پیام و تصویر را یک‌بار چک کن، بعد Share کن", photo: "public/sources/google-vids-official.png", photoFocus: "vids-share", visualEvidence: { sourceUrl: "https://workspace.google.com/products/vids/", sourceType: "official-ui", claim: "بازبینی و اشتراک‌گذاری ویدیو", mainVisual: "public/sources/google-vids-official.png", whatItProves: "کنترل اشتراک‌گذاری در رابط رسمی Google Vids", motionAction: "دکمهٔ Share فعال می‌شود", secondaryMotion: "علامت تأیید ظاهر می‌شود", ambientMotion: "نور پنل به‌آرامی محو می‌شود", coverage: 0.55 } },
      ],
      tgTitle: "🎬 برای محصولت ویدیو می‌خواهی، اما دوربین و بازیگر نداری؟ یک عکس محصول با Google Vids ویدیو می‌شود\n\n#GoogleVids #ProductVideo #ContentCreator #viral #GapMedia",
    },
  ],
};
