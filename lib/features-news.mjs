// News videos about Afghans in Germany and Europe.
//
// This is a different kind of content from the tutorials and it carries a
// different duty. A tutorial that is slightly out of date wastes a minute; a
// news item that is wrong can push someone toward a decision about their asylum
// case, their family, or their safety. So the rules here are stricter:
//
//   1. NOTHING goes in that is not confirmed by at least two independent
//      outlets, or by the primary source itself (a court, a ministry).
//   2. Every video names its source and the date on screen. The viewer can
//      check it, and knows how old it is.
//   3. Report what happened. Never advise what someone should do about their own
//      case — that needs a lawyer who has seen the file, and getting it wrong
//      here hurts people.
//   4. No false hope and no false despair. A court win that sends a case back
//      for review is exactly that, not a visa.
//   5. When something is contested, say who says what.
//
// Sources for this batch, all checked 25 August 2026: the Federal Constitutional
// Court's own press release (bundesverfassungsgericht.de, ruling of July 2026),
// DW (11 Aug and 1 Aug 2026), The National (10 Aug 2026), The Local (24 Jul 2026).
export const NEWS = {
  news: [
    {
      id: "bverfg-ruling",
      name: "Constitutional Court",
      source: "Bundesverfassungsgericht · جولای ۲۰۲۶",
      benefit: { key: "seen", fa: "" },
      title: "رأی دادگاه قانون اساسی آلمان",
      hook: {
        ask: "آیا از رأی دادگاه قانون اساسی آلمان دربارهٔ پروندهٔ افغان‌ها خبر دارید؟",
        l1: "لغو یک‌جای تعهدات پذیرش",
        l2: "خلاف قانون اساسی شناخته شد",
      },
      payoff: "دادگاه پرونده را برای بررسی فردی بازگرداند — این یعنی بازبینی، نه ویزا.",
      steps: [
        { path: "Human Rights List · 2021", icon: "users",
          text: "آلمان در ۲۰۲۱ به حدود ۶۴۰ نفر تعهد پذیرش داده بود",
          ui: { screen: "compose", title: "۱۴۰۰ / ۲۰۲۱", cta: "تعهد پذیرش" } },
        { path: "Revoked · Dec 2025", icon: "target",
          text: "وزارت کشور در دسامبر ۲۰۲۵ همهٔ این تعهدها را یک‌جا باطل اعلام کرد",
          ui: { screen: "compose", title: "دسامبر ۲۰۲۵", cta: "لغو یک‌جا" } },
        { path: "Court ruling · Jul 2026", icon: "key",
          text: "دادگاه قانون اساسی گفت لغو یک‌جا خودسرانه و مغایر قانون اساسی است",
          ui: { screen: "compose", title: "جولای ۲۰۲۶", cta: "رأی دادگاه" } },
        { path: "Case-by-case review", icon: "chart",
          text: "هر پرونده باید جداگانه بررسی شود؛ این رأی به‌خودی‌خود ویزا نمی‌دهد",
          ui: { screen: "result", title: "بررسی فردی" } },
        { path: "Ministry response", icon: "chat",
          text: "وزارت کشور می‌گوید همچنان حق با اوست و بررسی را آغاز کرده",
          ui: { screen: "result", title: "پاسخ وزارت" } },
        { path: "~600 still waiting", icon: "users",
          text: "حدود ۶۰۰ نفر هنوز در پاکستان و کابل منتظرند؛ ۷۵٪ زن و کودک",
          ui: { screen: "result", title: "۶۰۰ نفر" } },
        { path: "Court sent it back", icon: "clock",
          text: "پرونده به دادگاه اداری برلین-براندنبورگ بازگردانده شد",
          ui: { screen: "result", title: "بازگشت پرونده" } },
        { path: "Source", icon: "globe",
          text: "منابع این خبر: دادگاه قانون اساسی آلمان، DW، The Local",
          ui: { screen: "result", title: "منابع" } },
      ],
      outroAsk: "خودت یا کسی که می‌شناسی در این فهرست بوده؟",
      tgTitle: "⚖️ دادگاه قانون اساسی آلمان: لغو یک‌جای تعهدات پذیرش افغان‌ها خلاف قانون اساسی بود\n\n" +
        "منبع: Bundesverfassungsgericht — رأی جولای ۲۰۲۶\n" +
        "⚠️ این خبر است، نه مشاورهٔ حقوقی. برای پروندهٔ خودت با وکیل مشورت کن.\n\n" +
        "#افغانستان #آلمان #مهاجرت #پناهندگی",
    },
    {
      id: "legal-route-works",
      name: "Kabul Luftbrücke",
      source: "DW · ۱۱ آگست ۲۰۲۶",
      benefit: { key: "seen", fa: "" },
      title: "مسیر حقوقی جواب داده",
      hook: {
        ask: "آیا می‌دانید بیش از هزار نفر از راه دادگاه به آلمان رسیده‌اند؟",
        l1: "بیش از ۲۰۰ پرونده",
        l2: "در دادگاه برنده شده است",
      },
      payoff: "از سپتامبر ۲۰۲۵ تا آگست ۲۰۲۶، ۱۰۱۸ نفر از این راه به آلمان رسیده‌اند.",
      steps: [
        { path: "Kabul Luftbrücke", icon: "users",
          text: "یک سازمان غیردولتی آلمانی به افغان‌ها مشاورهٔ حقوقی می‌دهد",
          ui: { screen: "compose", title: "Kabul Luftbrücke", cta: "مشاورهٔ حقوقی" } },
        { path: "200+ cases won", icon: "key",
          text: "بیش از ۲۰۰ پرونده در دادگاه‌های آلمان برنده شده",
          ui: { screen: "compose", title: "۲۰۰+ پرونده", cta: "برنده" } },
        { path: "1,018 arrived", icon: "chart",
          text: "و در نتیجه ۱۰۱۸ نفر از سپتامبر ۲۰۲۵ به آلمان رسیده‌اند",
          ui: { screen: "result", title: "۱۰۱۸ نفر" } },
        { path: "75% women & children", icon: "target",
          text: "حدود ۷۵٪ کسانی که هنوز منتظرند، زن و کودک‌اند",
          ui: { screen: "result", title: "۷۵٪" } },
        { path: "4,424 rescued", icon: "family",
          text: "این سازمان از ۲۰۲۱ تا حالا ۴۴۲۴ نفر را از افغانستان بیرون آورده",
          ui: { screen: "result", title: "۴۴۲۴ نفر" } },
        { path: "568 in Peshawar", icon: "clock",
          text: "۵۶۸ نفر در پیشاور و ۳۴ نفر در کابل هنوز منتظرند",
          ui: { screen: "result", title: "منتظران" } },
        { path: "Not legal advice", icon: "key",
          text: "این خبر است، نه مشاورهٔ حقوقی؛ شرایط هر پرونده فرق می‌کند",
          ui: { screen: "result", title: "توجه" } },
        { path: "Source", icon: "globe",
          text: "منابع این خبر: DW، ۱۱ آگست ۲۰۲۶",
          ui: { screen: "result", title: "منبع" } },
      ],
      outroAsk: "به‌نظرت کدام بخش این خبر برای مردم مهم‌تر است؟",
      tgTitle: "⚖️ مسیر حقوقی جواب داده: ۲۰۰+ پروندهٔ برنده و ۱۰۱۸ نفر رسیده به آلمان\n\n" +
        "منبع: DW — ۱۱ آگست ۲۰۲۶\n" +
        "⚠️ این خبر است، نه مشاورهٔ حقوقی. برای پروندهٔ خودت با وکیل مشورت کن.\n\n" +
        "#افغانستان #آلمان #مهاجرت #پناهندگی",
    },
  ],
};
