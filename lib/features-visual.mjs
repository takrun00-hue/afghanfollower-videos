// High-intent tutorials with a verified, recognisable in-app screen.
// The hook promises one benefit, then the video proves where to tap.
export const VISUAL = {
  tiktok: [
    {
      id: "search-insights-real-ui",
      benefit: { key: "viral", fa: "موضوعی بساز که مردم همین حالا جستجو می‌کنند" },
      name: "Creator Search Insights",
      title: "از Search تیک‌تاک ویو بگیر — افغان فالورز",
      hookPhoto: "public/official-ui/tiktok-search-analytics.png",
      hook: {
        ask: "می‌خواهید ویدیویتان از Search تیک‌تاک ویو بگیرد؟",
        l1: "ویو از Search",
        l2: "نه فقط For You",
      },
      payoff: "به‌جای حدس‌زدن، موضوعی را انتخاب می‌کنی که مردم واقعاً دنبالش هستند.",
      outroAsk: "موضوع بعدی ویدیوی تو چیست؟",
      steps: [
        { path: "Search > creator search insights", icon: "target", text: "بالای TikTok روی Search بزن و Creator Search Insights را بنویس", photo: "public/official-ui/tiktok-search-analytics.png", photoFocus: "search" },
        { path: "Creator Search Insights", icon: "play", text: "صفحه را باز کن؛ اینجا موضوع‌هایی را می‌بینی که مردم واقعاً Search می‌کنند", photo: "public/official-ui/tiktok-search-analytics.png", photoFocus: "search" },
        { path: "Creator Search Insights > Content gap", icon: "chart", text: "Content gap را بزن تا موضوعِ پرجستجو اما کم‌محتوا را پیدا کنی", photo: "public/official-ui/tiktok-search-analytics.png", photoFocus: "gap" },
        { path: "Search analytics", icon: "pen", text: "بعد از انتشار، Search analytics را ببین تا بفهمی کدام موضوع برایت ویو آورده", photo: "public/official-ui/tiktok-search-analytics.png", photoFocus: "analytics" },
      ],
      tgTitle: "🔎 از Search تیک‌تاک ویو بگیر؛ با Creator Search Insights موضوع‌های واقعی را پیدا کن.\n\n#TikTok #TikTokSEO #ContentCreator #viral #AfghanFollowers",
    },
  ],
};
