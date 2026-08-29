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
      tgTitle: "📉 ریلزت کجا ویو از دست می‌دهد؟ با Reels Insights نقطهٔ افت را پیدا کن.\n\n#Instagram #Reels #Insights #ContentCreator #viral #GapMedia",
    },
  ],
  tiktok: [
    {
      id: "search-insights-real-ui",
      benefit: { key: "viral", fa: "موضوعی بساز که مردم همین حالا جستجو می‌کنند" },
      name: "Creator Search Insights",
      title: "از Search تیک‌تاک ویو بگیر — GapMedia",
      // Each frame is a single, full TikTok screen — never two app pages in
      // the same slide. These crops come from TikTok's official example UI.
      hookPhoto: "public/official-ui/tiktok-search-single.png",
      hook: {
        // Short, direct hook: it is easier to say naturally than a formal
        // «می‌خواهید…» sentence and still opens the viewer's question loop.
        ask: "از Search تیک‌تاک چطور ویو بگیریم؟",
        l1: "ویو از Search",
        l2: "نه فقط For You",
      },
      payoff: "به‌جای حدس‌زدن، موضوعی را انتخاب می‌کنی که مردم واقعاً دنبالش هستند.",
      outroAsk: "موضوع بعدی ویدیوی تو چیست؟",
      steps: [
        { path: "Search > creator search insights", icon: "target", text: "بالای TikTok روی Search بزن و Creator Search Insights را بنویس", photo: "public/official-ui/tiktok-search-single.png", photoFocus: "search" },
        { path: "Creator Search Insights", icon: "play", text: "صفحه را باز کن؛ اینجا موضوع‌هایی را می‌بینی که مردم واقعاً Search می‌کنند", photo: "public/official-ui/tiktok-search-single.png", photoFocus: "search" },
        { path: "Creator Search Insights > Content gap", icon: "chart", text: "Content gap را بزن تا موضوعِ پرجستجو اما کم‌محتوا را پیدا کنی", photo: "public/official-ui/tiktok-search-single.png", photoFocus: "gap" },
        { path: "Search analytics", icon: "pen", text: "بعد از انتشار، Search analytics را ببین تا بفهمی کدام موضوع برایت ویو آورده", photo: "public/official-ui/tiktok-search-analytics-single.png", photoFocus: "analytics" },
      ],
      tgTitle: "🔎 از Search تیک‌تاک ویو بگیر؛ با Creator Search Insights موضوع‌های واقعی را پیدا کن.\n\n#TikTok #TikTokSEO #ContentCreator #viral #GapMedia",
    },
  ],
};
