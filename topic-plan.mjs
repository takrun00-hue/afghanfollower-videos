// Topic planning only. This file must never render a video.
// It sends researched candidates and waits for an explicit Telegram approval.
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { rejectReason } from "./lib/source-quality.mjs";
import { fingerprint, check } from "./lib/dedupe.mjs";
import { featureById, featuresFor } from "./lib/features.mjs";
import { evaluate } from "./lib/selection-gate.mjs";
import { probeDemand, seedFor } from "./lib/demand-probe.mjs";
import { recentlyProposed, recordProposed, rejectedIds, COOLDOWN_DAYS } from "./lib/proposed.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const env = loadEnv();
const tg = telegramConfig(env);
const key = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FA = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const categoryArg = (process.argv.find((x) => x.startsWith("--category=")) || "").slice(11);
const weekly = process.argv.includes("--week");
const today = process.argv.includes("--today");
const dryRun = process.argv.includes("--dry-run");
const queryAt = process.argv.indexOf("--query");
const liveQuery = queryAt >= 0 ? String(process.argv[queryAt + 1] || "").trim().slice(0, 300) : "";
const sourcePreviewArg = Number(process.argv[process.argv.indexOf("--source-preview") + 1] || 0);
const pickArg = Number(process.argv[process.argv.indexOf("--build") + 1] || 0);
const previewArg = Number(process.argv[process.argv.indexOf("--preview") + 1] || 0);
const TRUSTED_SIGNAL_DOMAINS = new Set([
  "about.fb.com", "about.instagram.com", "newsroom.tiktok.com", "support.tiktok.com",
  "business.tiktok.com", "ads.tiktok.com", "socialmediatoday.com", "theverge.com",
  "techcrunch.com", "buffer.com", "later.com", "blog.google", "blog.youtube",
  "openai.com", "news.adobe.com", "canva.com", "capcut.com",
]);

// This is written only after Telegram confirms a successful delivery, then
// committed by Actions. Research must check it before it offers a topic.
function publishedHistory() {
  try { return JSON.parse(readFileSync(".content-history.json", "utf8")); }
  catch { return []; }
}
const PUBLISHED = publishedHistory();
const SEARCH_QUEUE = ".content-search-queue.json";
function hasAlreadyReachedTelegram(item) {
  const id = String(item.id || "").toLowerCase();
  const text = `${item.id || ""} ${item.hook || ""} ${item.why || ""}`.toLowerCase();
  return PUBLISHED.some((sent) => {
    const old = `${sent.id || ""} ${sent.topic || ""} ${sent.hook || ""}`.toLowerCase();
    return (id && old.includes(id)) || (text.length > 24 && old.includes(text.slice(0, 36)));
  });
}

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
    id: "tiktok-pay", platform: "TikTok", lane: "income",
    hook: "آیا ویوهای تیک‌تاکت واقعاً می‌توانند به درآمد تبدیل شوند، یا فقط عددند؟",
    why: "شرایط Creator Rewards و Qualified views را قدم‌به‌قدم بررسی می‌کند؛ مقدار درآمد به کشور و شرایط حساب وابسته است.",
    source: "https://support.tiktok.com/en/business-and-creator/creator-rewards-program/creator-rewards-program",
  },
  {
    id: "view-jail", platform: "TikTok", lane: "viral",
    hook: "چرا بعضی ویدیوها از همان چندصد ویوی اول جلوتر نمی‌روند؟",
    why: "به‌جای شایعه، Watch time و افت سه ثانیهٔ اول را از Analytics بررسی می‌کند.",
    source: "https://support.tiktok.com/en/using-tiktok/growing-your-audience/analytics",
  },
  {
    id: "retention-graph", platform: "TikTok", lane: "viral",
    hook: "بیننده دقیقاً در کدام ثانیه از ویدیویت رد می‌شود؟",
    why: "نمودار Retention نشان می‌دهد کدام بخشِ Edit باید کوتاه، عوض یا حذف شود.",
    source: "https://support.tiktok.com/en/using-tiktok/growing-your-audience/analytics",
  },
  {
    id: "auto-translate", platform: "TikTok", lane: "reach",
    hook: "می‌خواهی ویدیویت برای مخاطبی بیرون از زبان خودت هم قابل‌فهم باشد؟",
    why: "زیرنویس و ترجمهٔ روشن، مسیر دیده‌شدن بین‌المللی را بازتر می‌کند؛ نتیجه تضمین‌شده نیست.",
    source: "https://support.tiktok.com/en/using-tiktok/creating-videos/accessibility",
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
const relevant = TOPICS.filter((x) => !hasAlreadyReachedTelegram(x) && (!cat ||
  (cat === "instagram" && x.platform === "Instagram") ||
  (cat === "tiktok" && x.platform === "TikTok") ||
  (cat === "tools" && x.platform === "AI / App")));

async function liveSignals(category = "") {
  if (!key) return [];
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const allQueries = [
    "TikTok Creative Center current week trend popular hashtag creator viral content",
    "Instagram Reels current week trend creator viral content",
    "creator app current week social media revenue or viral content update",
    "official technology app AI update this week useful for creators video editing",
  ];
  const queries = category === "tiktok" ? allQueries.slice(0, 1)
    : category === "instagram" ? allQueries.slice(1, 2)
    : category === "tools" ? allQueries.slice(2)
    : allQueries;
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
          const evidence = String(item.text || "").replace(/\s+/g, " ");
          const metric = evidence.match(/(?:\d[\d,.]*\s*(?:K|M|million|billion|posts|views|videos)|\d+(?:\.\d+)?%)/i)?.[0] || "آمار عمومیِ قابل‌استخراج ندارد";
          results.push({ title: String(item.title).slice(0, 100), url: item.url, date: String(item.publishedDate || "").slice(0, 10), metric });
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
  if (/(اپ|اپلیکیشن|application|app|تکنولوژی|فناوری|technology|هوش مصنوعی|\bai\b|edit|ادیت|video|ویدیو)/.test(q)) {
    return ["blog.google", "blog.youtube", "openai.com", "news.adobe.com", "canva.com", "capcut.com", "about.fb.com", "newsroom.tiktok.com"];
  }
  return [];
}

async function liveSearchForCreatorNeed(query) {
  if (!key) throw new Error("EXA_API_KEY تنظیم نشده است");
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const domains = trustedDomainsFor(query);
  const ask = async (includeDomains, phrasing) => {
    const request = {
      // Describe the page we want to find, not a bag of keywords. The old tail
      // ("social media creator income viral views update") pulled every query
      // toward corporate announcements, which is how "درآمد از تیک‌تاک" came
      // back as a concert livestream and an IP agreement.
      query: phrasing || `${query} — guide explaining how creators actually do this, with the steps`,
      // Filtering removes most of what a money question returns, so the pool has
      // to start large or press releases float back up for want of anything else.
      numResults: 25,
      startPublishedDate: since,
      type: "auto",
      contents: { text: { maxCharacters: 700 } },
    };
    if (includeDomains && includeDomains.length) request.includeDomains = includeDomains;
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Exa ${response.status}`);
    return ((await response.json()).results || []).filter((item) => item?.title && item?.url);
  };

  // A corporate newsroom post is a press release. It proves a feature exists,
  // which is worth having, but it never answers what a creator should do — so
  // it is ranked below anything that reads like an actual guide.
  const PR = /newsroom|press|announc|celebrat|partnership|agreement/i;
  const score = (item) => {
    const hay = `${item.title} ${String(item.text || "").slice(0, 400)}`;
    let n = 0;
    if (/how to|step|guide|tutorial|چطور|چگونه|راهنما/i.test(hay)) n += 3;
    if (String(item.text || "").length > 200) n += 1;          // has usable body
    if (PR.test(`${item.title} ${item.url}`)) n -= 3;
    return n;
  };

  const official = await ask(domains);
  let pool = official;
  const dropped = [];
  // Official domains alone often cannot answer a demand question. Widen once,
  // rather than shipping three irrelevant press releases as "research".
  if (official.filter((x) => score(x) > 0).length < 3) {
    const seen = new Set(official.map((x) => x.url));
    // Two phrasings, because "how do I earn from this" and "what are the
    // requirements" surface different pages, and the first alone lands almost
    // entirely on content farms.
    for (const phrasing of [null, `${query} — official requirements and how it works, explained for creators`]) {
      for (const item of await ask(null, phrasing)) {
        if (!seen.has(item.url)) { pool.push(item); seen.add(item.url); }
      }
    }
  }
  // Drop the pages that are selling rather than explaining, and say how many
  // went — a silently shorter list looks like a weak search rather than a
  // filtered one.
  pool = pool.filter((item) => {
    const why = rejectReason(item);
    if (why) dropped.push(why);
    return !why;
  });
  if (dropped.length) console.log(`فیلتر منابع: ${dropped.length} نتیجه کنار گذاشته شد`);
  return pool.sort((a, b) => score(b) - score(a)).slice(0, 5);
}

function categoryForSearch(query) {
  const q = String(query).toLowerCase();
  if (/(instagram|انستا|ریلز|reels|edits)/.test(q)) return "instagram";
  if (/(tiktok|tik tok|تیک\s*تاک)/.test(q)) return "tiktok";
  return "tools";
}

function sourceQueue() {
  try { return existsSync(SEARCH_QUEUE) ? JSON.parse(readFileSync(SEARCH_QUEUE, "utf8")) : []; }
  catch { return []; }
}

if (sourcePreviewArg) {
  const selected = sourceQueue().find((item) => item.n === sourcePreviewArg);
  if (!selected) throw new Error(`منبع شمارهٔ ${sourcePreviewArg} در فهرست فعلی نیست.`);
  const text =
    `✅ <b>منبع ${sourcePreviewArg} انتخاب شد</b>\n\n` +
    `<b>${esc(selected.title)}</b>${selected.date ? ` · <i>${esc(selected.date)}</i>` : ""}\n` +
    `${esc(selected.excerpt || "برای بررسیِ جزئیات، منبع را باز کنید.")}\n\n` +
    `<a href="${esc(selected.url)}">باز کردن منبع اصلی</a>\n\n` +
    `این منبع برای <b>${esc(selected.categoryLabel)}</b> بررسی می‌شود. ` +
    `اگر می‌خواهید از آن پیش‌نویس ویدیو ساخته شود، بنویسید: <code>تأیید منبع ${FA(sourcePreviewArg)}</code>\n` +
    `یا با <code>۵</code> جستجوی تازه انجام دهید.`;
  if (tg.enabled && !dryRun) await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true }); else console.log(text);
  process.exit(0);
}

if (liveQuery) {
  let results = [];
  try { results = await liveSearchForCreatorNeed(liveQuery); }
  catch (error) {
    const message = `⚠️ <b>جستجوی زنده انجام نشد</b>\n${esc(String(error.message).slice(0, 140))}`;
    if (tg.enabled && !dryRun) await sendMessage({ token: tg.token, chatId: tg.chatId, text: message }); else console.log(message);
    process.exit(0);
  }
  const category = categoryForSearch(liveQuery);
  const categoryLabel = ({ tiktok: "تیک‌تاک", instagram: "اینستاگرام", tools: "اپ‌ها و هوش مصنوعی" })[category];
  const queue = results.map((item, index) => ({
    n: index + 1,
    title: String(item.title).slice(0, 140),
    excerpt: String(item.text || "").replace(/\s+/g, " ").slice(0, 360),
    url: item.url,
    date: String(item.publishedDate || "").slice(0, 10),
    category,
    categoryLabel,
    query: liveQuery,
    searchedAt: new Date().toISOString(),
  }));
  writeFileSync(SEARCH_QUEUE, JSON.stringify(queue, null, 2));
  const items = queue.map((item, index) => {
    const title = esc(String(item.title).slice(0, 140));
    const excerpt = esc(String(item.excerpt || "").replace(/\s+/g, " ").slice(0, 180));
    const date = item.date ? ` · <i>${esc(item.date)}</i>` : "";
    return `<b>منبع ${FA(index + 1)}. ${title}</b>${date}\n${excerpt || "منبع تازه برای بررسی محتوا."}\n<a href="${esc(item.url)}">باز کردن منبع</a>\nانتخاب: <code>منبع ${FA(index + 1)}</code>`;
  });
  const text = `🔎 <b>نتیجهٔ جستجوی زندهٔ محتوا</b>\n<i>درخواست شما: ${esc(liveQuery)}</i>\n\n` +
    (items.length ? items.join("\n\n") : "نتیجهٔ تازه‌ای پیدا نشد.\nبرای ادامه بنویس: <code>جستجوی جدید: عبارت تازه</code>") +
    "\n\nیکی را با <code>منبع ۱</code>، <code>منبع ۲</code> یا شمارهٔ دلخواه انتخاب کن. برای جستجوی تازه فقط <code>۵</code> را بفرست.";
  if (tg.enabled && !dryRun) await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true }); else console.log(text);
  process.exit(0);
}

// The permanent bank is only an archive of researched items, never proof that
// a subject is worth posting today. A current proposal therefore needs a live
// signal. If search cannot substantiate it, Telegram receives no filler topic.
// Checkpoint 1: reject a subject before any work is spent on it. A proposal the
// audience received in the last thirty days is not a proposal, however well the
// research supports it.
const notRecentlySent = (item) => {
  const found = item.id ? featureById(item.id) : null;
  const f = found ? (found.feature || found) : null;
  if (!f) return true;                     // nothing to compare — do not invent a verdict
  const r = check(fingerprint({
    id: item.id, platform: item.platform, feature: f.name, title: f.title,
    hook: f.hook, benefit: f.benefit, payoff: f.payoff, tips: f.steps,
  }));
  if (r.verdict === "DUPLICATE") {
    console.error(`  · کنار گذاشته شد: ${item.id} — ${r.score}٪ شبیه «${r.closest?.id}» که اخیراً رفته`);
    return false;
  }
  return true;
};

// Rule 14: a Telegram command is a request for content, not permission to
// skip the gate. Everything that reaches a proposal has been through it,
// whether the run was scheduled, typed by hand, or triggered from a phone.
const gateRejects = [];
const passesGate = async (item) => {
  // Rule 2: research first, then judge. The gate refuses to assert interest it
  // never saw, so the interest is measured here rather than assumed.
  item.demandPhrases = await probeDemand(seedFor(item), { english: false });
  const found = item.id ? featureById(item.id) : null;
  const f = found ? (found.feature || found) : null;
  const v = evaluate({
    topic: item.hook || item.id,
    question: item.hook || "",
    keyPoints: f ? (f.steps || []).map((x) => x.text) : [],
    sources: [item.source || item.sourceNote].filter(Boolean),
    sourceDate: item.sourceDate || null,
    demandPhrases: item.demandPhrases || [],
    discussions: item.discussions || [],
  });
  if (v.decision === "REJECT") { gateRejects.push({ id: item.id, why: v.failures.join("، ") }); return false; }
  item.gate = v;
  return true;
};
// The hand-written TOPICS list above holds eleven subjects. Most have been sent,
// and once the proposal cooldown also excludes what was offered yesterday, a
// second run in the same week finds nothing left and reports "no qualified
// topic" — which is true of that list and false of the channel, because the
// feature catalogue carries eighty-odd more.
//
// So the pool is topped up from the catalogue itself. These entries carry no
// source URL, and one is NOT invented for them: they are labelled as documented
// platform features, which is what they are, and the proposal shows that
// instead of a link that would look like a citation nobody checked.
const LANE_FOR = { income: "income", viral: "viral", seen: "reach", trend: "trend" };
const PLATFORM_FOR = { tiktok: "TikTok", instagram: "Instagram", tools: "AI / App", ai: "AI / App", general: "AI / App" };
function catalogueTopics() {
  const out = [];
  for (const c of ["tiktok", "instagram", "tools", "ai", "general"]) {
    for (const f of featuresFor(c) || []) {
      if (!f?.id || !f?.hook?.ask) continue;
      out.push({
        id: f.id,
        platform: PLATFORM_FOR[c] || "AI / App",
        lane: LANE_FOR[f.benefit?.key] || "reach",
        hook: f.hook.ask,
        why: f.payoff || f.benefit?.fa || "",
        source: null,
        sourceLabel: "قابلیت مستندشدهٔ پلتفرم",
        // Scored by the gate as the one weak-but-real source it is. Deliberately
        // not a URL: the feature is documented in the platform's own app, and
        // inventing a help-centre link would manufacture a citation.
        sourceNote: `${c} platform feature, catalogue entry`,
      });
    }
  }
  return out;
}
const alreadyOffered = recentlyProposed();
const refused = rejectedIds();
let list = [...relevant, ...catalogueTopics().filter((c) => !relevant.some((r) => r.id === c.id) && !hasAlreadyReachedTelegram(c))]
  .filter((x) => ["trend", "viral", "reach", "income"].includes(x.lane))
  .filter(notRecentlySent)
  // A topic offered and not taken must not be offered again tomorrow. The
  // sent-registry above cannot see those — nothing was ever sent — so the
  // same ranked list came back day after day.
  .filter((item) => {
    // A refusal is permanent — the cooldown says "not today", this says
    // "not ever", and re-offering a refused topic in a fortnight would make
    // the operator refuse it twice.
    if (item.id && refused.has(String(item.id).toLowerCase())) {
      console.error(`  · کنار گذاشته شد: ${item.id} — رد شده است`);
      return false;
    }
    if (!item.id || !alreadyOffered.has(String(item.id).toLowerCase())) return true;
    console.error(`  · کنار گذاشته شد: ${item.id} — در ${COOLDOWN_DAYS} روز اخیر پیشنهاد شده بود`);
    return false;
  })

  .sort((a, b) => (b.lane === "income") - (a.lane === "income"))
  

// Applied after the synchronous filters because the probe is a network call.
const gated = [];
for (const item of list) if (await passesGate(item)) gated.push(item);
// Capped: offering everything at once empties the catalogue in a single
// message and leaves nothing for tomorrow, which is the same starvation
// problem the cooldown was added to fix, just in the other direction.
// Only what is actually offered goes on cooldown, so the remainder stays
// available for the next run.
list = gated.slice(0, Number(process.env.TOPIC_PROPOSAL_LIMIT || 3));

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
const signals = await liveSignals(cat);
const evidenceText = signals.length
  ? signals.map((x, i) => `<b>${i + 1}. ${esc(x.title)}</b>${x.date ? ` · <i>${esc(x.date)}</i>` : ""}\nسیگنال: ${esc(x.metric)}\n<a href="${x.url}">منبع و آمار</a>`).join("\n\n")
  : "سیگنال عددیِ تازه پیدا نشد؛ موضوع‌های زیر از منابع رسمیِ بررسی‌شده انتخاب شده‌اند و پیش از ساخت، متن کاملشان را می‌بینی.";
let text = `${title}\n\n<b>🔎 سیگنال‌های زندهٔ بررسی‌شده</b>\n${evidenceText}`;
const proposals = list.map((item, i) =>
  `<b>موضوع ${FA(i + 1)} — ${esc(item.platform)}</b>\n${esc(item.hook)}\n${esc(item.why)}\n${item.source ? `<a href="${item.source}">منبع رسمی</a>` : esc(item.sourceLabel || "قابلیت مستندشدهٔ پلتفرم")}`
).join("\n\n");
text += proposals
  ? `\n\n<b>✅ موضوع‌های قابل انتخاب</b>\n${proposals}\n\nبرای دیدن پیش‌نویس و ویرایش آن فقط یکی را بفرست: ${list.map((_, i) => `<code>موضوع ${FA(i + 1)}</code>`).join("، ")}.`
  : "\n\n<b>موضوع واجد شرایطی پیدا نشد.</b>\n" +
    (gateRejects.length
      ? gateRejects.map((r) => "• " + esc(r.id) + " — " + esc(r.why)).join("\n")
      : "همهٔ موضوع‌های بانک در ۳۰ روز اخیر رفته‌اند یا تکراری‌اند.") +
    "\n\nموضوع ضعیف نمی‌سازم. <code>۵</code> را بفرست و موضوع دلخواهت را جستجو کن.";
text += " هیچ ویدیویی پیش از تأیید پیش‌نویس ساخته نمی‌شود.";

// Recorded before sending, and only when the list has something in it: an
// empty proposal is not an offer and must not put ids on cooldown.
if (list.length && !dryRun) recordProposed(list.map((x) => x.id).filter(Boolean));
// The same list, kept in the order it was numbered. «رد موضوع ۲» has to mean
// the second line of the message the operator is looking at, not the second
// item of a ranking recomputed later.
if (list.length && !dryRun) {
  writeFileSync(".topic-offered.json", JSON.stringify(
    list.map((x, n) => ({ n: n + 1, id: x.id, platform: x.platform, hook: x.hook })), null, 2) + "\n");
}
if (tg.enabled && !dryRun && process.env.NO_TELEGRAM !== "1") await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true });
else console.log(text);

function laneFa(lane) {
  return ({ trend: "ترند روز", viral: "ویو و وایرال", reach: "دیده‌شدن", income: "درآمد" })[lane] || lane;
}

