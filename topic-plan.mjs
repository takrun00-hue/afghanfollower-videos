// Topic planning only. This file must never render a video.
// It sends researched candidates and waits for an explicit Telegram approval.
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const env = loadEnv();
const tg = telegramConfig(env);
const key = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const categoryArg = (process.argv.find((x) => x.startsWith("--category=")) || "").slice(11);
const weekly = process.argv.includes("--week");
const tomorrow = !weekly || process.argv.includes("--tomorrow");
const dryRun = process.argv.includes("--dry-run");
const pickArg = Number(process.argv[process.argv.indexOf("--build") + 1] || 0);
const TRUSTED_SIGNAL_DOMAINS = new Set([
  "about.fb.com", "about.instagram.com", "newsroom.tiktok.com", "support.tiktok.com",
  "business.tiktok.com", "ads.tiktok.com", "socialmediatoday.com", "theverge.com",
  "techcrunch.com", "buffer.com", "later.com",
]);

const TOPICS = [
  {
    id: "trial-reels", platform: "Instagram", lane: "reach",
    hook: "ریلزت View نمی‌گیرد؟ می‌خواهی قبل از نشر عمومی، آن را برای مخاطب تازه تست کنی؟",
    why: "آزمایش ریلز برای Non-followers پیش از Share عمومی؛ نتیجه تضمین‌شده نیست.",
    source: "https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/",
  },
  {
    id: "ig-insights-retention", platform: "Instagram", lane: "viral",
    hook: "ریلزت در چند ثانیه اول رها می‌شود؟ می‌خواهی دقیقاً نقطهٔ افت را پیدا کنی؟",
    why: "برای انتخاب Edit بعدی بر اساس Retention، نه حدس.",
    source: "https://about.fb.com/news/2023/11/helping-creators-test-content-and-earn-rewards/",
  },
  {
    id: "tiktok-shop-video-assistant", platform: "TikTok", lane: "income",
    hook: "برای محصولت ویدیو می‌سازی اما Script و Hook فروش نداری؟",
    why: "Video Assistant برای متن، Hook و Teleprompter؛ فروش تضمین‌شده نیست.",
    source: "https://seller-de.tiktok.com/university/essay?knowledge_id=6330068084279061&lang=en-GB",
  },
  {
    id: "search-insights", platform: "TikTok", lane: "trend",
    hook: "می‌خواهی به‌جای حدس، دربارهٔ چیزی ویدیو بسازی که مردم در TikTok Search می‌گردند؟",
    why: "Content gap موضوع‌های جستجوشده با محتوای کم را نشان می‌دهد.",
    source: "https://support.tiktok.com/en/using-tiktok/growing-your-audience/creator-search-insights",
  },
  {
    id: "google-trends", platform: "AI / App", lane: "trend",
    hook: "نمی‌دانی امروز چه موضوعی شانس دیده‌شدن دارد؟ قبل از ساخت، موج را ببین.",
    why: "Google Trends برای بررسی ترند؛ رایگان و بدون تضمین وایرال‌شدن.",
    source: "https://trends.google.com/",
  },
  {
    id: "photopea", platform: "AI / App", lane: "viral",
    hook: "کاورت کلیک نمی‌گیرد؟ می‌خواهی بدون نصب، یک Cover حرفه‌ای بسازی؟",
    why: "Photopea یک اپ وب رایگان برای Edit و ساخت Cover است.",
    source: "https://www.photopea.com/",
  },
];

const cat = String(categoryArg).toLowerCase();
const relevant = TOPICS.filter((x) => !cat ||
  (cat === "instagram" && x.platform === "Instagram") ||
  (cat === "tiktok" && x.platform === "TikTok") ||
  (cat === "tools" && x.platform === "AI / App"));

async function liveSignals() {
  if (!key) return [];
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const queries = [
    "Instagram Reels creator reach trend update",
    "TikTok creator search monetization trend update",
    "free AI app social media creators trend update",
  ];
  const results = [];
  for (const query of queries) {
    try {
      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key },
        body: JSON.stringify({ query, numResults: 2, startPublishedDate: since, type: "auto" }),
      });
      if (!response.ok) continue;
      const data = await response.json();
      for (const item of data.results || []) {
        let host = "";
        try { host = new URL(item.url).hostname.replace(/^www\./, ""); } catch {}
        if (item?.title && item?.url && TRUSTED_SIGNAL_DOMAINS.has(host)) {
          results.push({ title: String(item.title).slice(0, 100), url: item.url });
        }
      }
    } catch { /* Signals are optional; curated topics still go out. */ }
  }
  return [...new Map(results.map((x) => [x.url, x])).values()].slice(0, 4);
}

// Every proposed item must serve a known creator demand: a current trend,
// a concrete reach/viral outcome, or a qualified income use case. This makes
// the numbered Telegram list a real editorial gate rather than a menu of
// arbitrary app features.
const list = relevant
  .filter((x) => ["trend", "viral", "reach", "income"].includes(x.lane))
  .slice(0, weekly ? 6 : 3);

if (pickArg) {
  const selected = list[pickArg - 1];
  if (!selected) throw new Error(`موضوع شمارهٔ ${pickArg} پیدا نشد`);
  // The ids point at the feature bank, so this path renders a real, known
  // tutorial instead of inventing a topic after approval.
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, ["approve-feature.mjs", selected.id], { stdio: "inherit", env: process.env });
  process.exit(0);
}
const title = weekly ? "📅 برنامهٔ پیشنهادی هفته" : "🗓️ موضوع‌های پیشنهادی فردا";
let text = `${title}\n\n` + list.map((x, i) =>
  `<b>${i + 1}. ${x.platform} · ${laneFa(x.lane)}</b>\n${x.hook}\n<i>${x.why}</i>\n<a href="${x.source}">منبع رسمی</a>`
).join("\n\n");

const signals = await liveSignals();
if (signals.length) {
  text += "\n\n<b>🔎 سیگنال‌های تازهٔ هفته</b>\n" + signals.map((x) => `• <a href="${x.url}">${x.title}</a>`).join("\n");
}
text += "\n\nهیچ ویدیویی هنوز ساخته نشده است. برای انتخاب بنویس: <code>انتخاب ۱</code>";

if (tg.enabled && !dryRun) await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true });
else console.log(text);

function laneFa(lane) {
  return ({ trend: "ترند روز", viral: "ویو و وایرال", reach: "دیده‌شدن", income: "درآمد" })[lane] || lane;
}
