// Topic planning only. This file must never render a video.
// It sends researched candidates and waits for an explicit Telegram approval.
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const env = loadEnv();
const tg = telegramConfig(env);
const key = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const categoryArg = (process.argv.find((x) => x.startsWith("--category=")) || "").slice(11);
const weekly = process.argv.includes("--week");
const today = process.argv.includes("--today");
const dryRun = process.argv.includes("--dry-run");
const queryAt = process.argv.indexOf("--query");
const liveQuery = queryAt >= 0 ? String(process.argv[queryAt + 1] || "").trim().slice(0, 300) : "";
const pickArg = Number(process.argv[process.argv.indexOf("--build") + 1] || 0);
const previewArg = Number(process.argv[process.argv.indexOf("--preview") + 1] || 0);
const TRUSTED_SIGNAL_DOMAINS = new Set([
  "about.fb.com", "about.instagram.com", "newsroom.tiktok.com", "support.tiktok.com",
  "business.tiktok.com", "ads.tiktok.com", "socialmediatoday.com", "theverge.com",
  "techcrunch.com", "buffer.com", "later.com",
]);

const TOPICS = [
  {
    id: "saved-replies", platform: "Instagram", lane: "income",
    hook: "دایرکت فروش را دیر جواب می‌دهی؟ جواب آماده، مشتریِ آماده را منتظر نمی‌گذارد.",
    why: "Saved Replies پاسخ تکراری را با یک میان‌بر می‌فرستد؛ برای سریع‌تر جواب‌دادن به مشتری، نه تضمین فروش.",
    source: "https://help.instagram.com/502981923235522/",
  },
  {
    id: "trial-reels", platform: "Instagram", lane: "reach",
    hook: "ویدیویت View نمی‌گیرد؟ می‌خواهی قبل از نشر عمومی، آن را برای مخاطب تازه تست کنی؟",
    why: "آزمایش ریلز برای Non-followers پیش از Share عمومی؛ نتیجه تضمین‌شده نیست.",
    source: "https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/",
  },
  {
    id: "ig-insights-retention", platform: "Instagram", lane: "viral",
    hook: "ویدیویت در چند ثانیه اول رها می‌شود؟ می‌خواهی دقیقاً نقطهٔ افت را پیدا کنی؟",
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

function trustedDomainsFor(query) {
  const q = String(query).toLowerCase();
  if (/(instagram|انستا|ریلز|reels|edits)/.test(q)) {
    return ["about.instagram.com", "about.fb.com", "help.instagram.com", "creators.instagram.com", "business.instagram.com"];
  }
  if (/(tiktok|tik tok|تیک\s*تاک)/.test(q)) {
    return ["newsroom.tiktok.com", "support.tiktok.com", "business.tiktok.com", "seller.tiktok.com"];
  }
  if (/(google|گوگل|android|اندروید|flow|vids|gemini)/.test(q)) {
    return ["blog.google", "support.google.com", "workspace.google.com", "blog.google.com"];
  }
  if (/(canva|کَنوا|adobe|فوتوشاپ|photopea|capcut|کپ\s*کات)/.test(q)) {
    return ["canva.com", "adobe.com", "photopea.com", "capcut.com"];
  }
  return [];
}

async function liveSearchForCreatorNeed(query) {
  if (!key) throw new Error("EXA_API_KEY تنظیم نشده است");
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const domains = trustedDomainsFor(query);
  const request = {
    query: `${query} social media creator income viral views update`,
    numResults: 6,
    startPublishedDate: since,
    type: "auto",
    contents: { text: { maxCharacters: 550 } },
  };
  if (domains.length) request.includeDomains = domains;
  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`Exa ${response.status}`);
  const data = await response.json();
  return (data.results || []).filter((item) => item?.title && item?.url).slice(0, 5);
}

if (liveQuery) {
  let results = [];
  try { results = await liveSearchForCreatorNeed(liveQuery); }
  catch (error) {
    const message = `⚠️ <b>جستجوی زنده انجام نشد</b>\n${esc(String(error.message).slice(0, 140))}`;
    if (tg.enabled && !dryRun) await sendMessage({ token: tg.token, chatId: tg.chatId, text: message }); else console.log(message);
    process.exit(0);
  }
  const items = results.map((item, index) => {
    const title = esc(String(item.title).slice(0, 140));
    const excerpt = esc(String(item.text || "").replace(/\s+/g, " ").slice(0, 180));
    const date = item.publishedDate ? ` · <i>${esc(String(item.publishedDate).slice(0, 10))}</i>` : "";
    return `<b>${index + 1}. ${title}</b>${date}\n${excerpt || "منبع تازه برای بررسی محتوا."}\n<a href="${esc(item.url)}">باز کردن منبع</a>`;
  });
  const text = `🔎 <b>نتیجهٔ جستجوی زندهٔ محتوا</b>\n<i>درخواست شما: ${esc(liveQuery)}</i>\n\n` +
    (items.length ? items.join("\n\n") : "نتیجهٔ تازه‌ای پیدا نشد.\nبرای ادامه بنویس: <code>جستجوی جدید: عبارت تازه</code>") +
    "\n\nبرای ساخت از یک نتیجه، موضوع و گام‌ها را با <code>محتوا: موضوع | گام۱ | گام۲ | گام۳ | گام۴</code> بفرست.";
  if (tg.enabled && !dryRun) await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true }); else console.log(text);
  process.exit(0);
}

// Every proposed item must serve a known creator demand: a current trend,
// a concrete reach/viral outcome, or a qualified income use case. This makes
// the numbered Telegram list a real editorial gate rather than a menu of
// arbitrary app features.
const list = relevant
  .filter((x) => ["trend", "viral", "reach", "income"].includes(x.lane))
  .sort((a, b) => (b.lane === "income") - (a.lane === "income"))
  .slice(0, weekly ? 6 : 3);

if (pickArg || previewArg) {
  const selected = list[(pickArg || previewArg) - 1];
  if (!selected) throw new Error(`موضوع شمارهٔ ${pickArg || previewArg} پیدا نشد`);
  if (previewArg) {
    const { execFileSync } = await import("node:child_process");
    execFileSync(process.execPath, ["content-draft.mjs", "--create", selected.id], { stdio: "inherit", env: process.env });
    process.exit(0);
  }
  // The ids point at the feature bank, so this path renders a real, known
  // tutorial instead of inventing a topic after approval.
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, ["approve-feature.mjs", selected.id], { stdio: "inherit", env: process.env });
  process.exit(0);
}
const title = weekly ? "📅 برنامهٔ پیشنهادی هفته" : today ? "🗓️ موضوع‌های پیشنهادی امروز" : "🗓️ موضوع‌های پیشنهادی فردا";
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

