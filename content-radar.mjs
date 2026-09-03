// Daily content search engine for GapMedia tutorials.
//
//   node content-radar.mjs            # scan, score, report to Telegram
//   node content-radar.mjs --quiet    # scan, print only
//
// research.mjs answers "what shipped that we haven't covered yet". This
// answers a different, explicitly requested question: of what's out there
// right now, which candidate is actually worth building — scored against
// the standing criteria, not picked because it was merely the first result.
//
// The criteria, from the standing content-selection rules (memory
// gapmedia-content-selection-and-design-bar, message of 2026-09-03):
//   · real, dated evidence — not a press release or a product-directory ad
//   · not already in the content bank
//   · corroborated by more than one independent source — a proxy for how
//     newsworthy/anticipated it actually is ("چقدر خبرساز شده")
//   · expressible as one clear sentence — a topic that needs a paragraph to
//     explain has no hook
// None of these is search volume or a promise of virality — they are the
// only things actually checkable from a search API without inventing a
// number. Real audience demand ("چقدر مشتریان در انتظارش هستند") is a
// separate, per-candidate check: run `دیماند: <عنوان>` on whichever result
// here looks promising before building it.
//
// This never builds anything — same rule as research.mjs and news-scan.mjs:
// finding and scoring a candidate is not the same job as writing four correct
// steps for it, and there is no language model in this cloud job to do that
// safely.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { alreadyCovered, isFeatureKnown } from "./lib/features.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const quiet = process.argv.includes("--quiet");
const env = loadEnv();
const tg = telegramConfig(env);
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const WHERE = process.env.GITHUB_ACTIONS === "true" ? "☁️ از فضای ابری" : "💻 از کامپیوتر";

if (!KEY) {
  const msg = "🔑 <b>کلید جستجو تنظیم نشده</b>\n<i>" + WHERE + "</i>\n\nEXA_API_KEY را در Secrets تنظیم کن.";
  if (tg.enabled && !quiet) await sendMessage({ token: tg.token, chatId: tg.chatId, text: msg });
  console.log("EXA_API_KEY is not set");
  process.exit(0);
}

const DAYS = Number(process.env.RADAR_DAYS || 7);
const since = new Date(Date.now() - DAYS * 86400000).toISOString();

// Same exclusion research.mjs uses: a search for "new AI tool" is dominated by
// vendors and directories paying to rank for exactly those words.
const AD_DOMAINS = [
  "prnewswire.com", "businesswire.com", "globenewswire.com", "einpresswire.com",
  "peerpush.com", "producthunt.com", "betalist.com", "uneed.best",
];

// Both a shipped feature and a credible, imminent one qualify — "iPhone 18 در
// راه است" was the user's own example of a launch worth catching before it
// ships, not only after.
const LABEL = { instagram: "اینستاگرام", tiktok: "تیک‌تاک", tools: "ابزارها و هوش مصنوعی" };
const QUERIES = {
  instagram: "Instagram new or upcoming creator feature, reported or confirmed by a tech news site",
  tiktok: "TikTok new or upcoming creator feature, reported or confirmed by a tech news site",
  tools: "a genuinely capable new or upcoming AI model or app update for video, image or content creators, hands-on coverage",
};

async function search(q) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: q, numResults: 8, startPublishedDate: since, type: "auto",
      excludeDomains: AD_DOMAINS, contents: { text: { maxCharacters: 500 } },
    }),
  });
  if (!res.ok) throw new Error(`Exa ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).results || [];
}

// The corroboration check: does anyone else, independently, cover the same
// story? Re-querying with the candidate's own title, unrestricted, over a
// wider window turns "one article said so" into a real, countable signal.
async function corroboration(title) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: title, numResults: 8,
      startPublishedDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      type: "auto", excludeDomains: AD_DOMAINS, contents: { text: { maxCharacters: 1 } },
    }),
  });
  if (!res.ok) return 0;
  const hosts = new Set();
  for (const r of (await res.json()).results || []) {
    try { hosts.add(new URL(r.url).hostname.replace(/^www\./, "")); } catch { /* skip */ }
  }
  return hosts.size;
}

const HAVE = alreadyCovered();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rows = [];
for (const [cat, q] of Object.entries(QUERIES)) {
  let results = [];
  try { results = await search(q); }
  catch (e) { console.error(`${cat}: ${e.message}`); continue; }

  // Novelty first — no point scoring five sources for something already taught.
  const fresh = results.filter((r) => r.title && !isFeatureKnown(r.title, HAVE)).slice(0, 5);
  for (const r of fresh) {
    const days = r.publishedDate ? (Date.now() - new Date(r.publishedDate)) / 86400000 : DAYS;
    const clear = String(r.title || "").length <= 100;
    const sources = await corroboration(r.title);
    const score = Math.min(sources, 5) * 4 + (clear ? 3 : 0) + Math.max(0, Math.round(7 - days));
    rows.push({ cat, title: r.title, url: r.url, date: String(r.publishedDate || "").slice(0, 10), sources, clear, score });
  }
}

rows.sort((a, b) => b.score - a.score);
writeFileSync(".content-radar.json", JSON.stringify({ at: new Date().toISOString(), rows }, null, 2));

if (!rows.length) {
  if (tg.enabled && !quiet) {
    await sendMessage({ token: tg.token, chatId: tg.chatId, text: `📡 <b>رادار محتوا</b>\n<i>${DAYS} روز گذشته · ${WHERE}</i>\n\nچیز تازه و ناپوشیده‌ای پیدا نشد.` });
  }
  console.log("no candidates");
  process.exit(0);
}

const byCat = {};
for (const r of rows) (byCat[r.cat] ||= []).push(r);

const sections = Object.entries(byCat).map(([cat, list]) => {
  const items = list.slice(0, 3).map((r) =>
    `• <a href="${esc(r.url)}">${esc(r.title.slice(0, 100))}</a>\n` +
    `  🗓 ${esc(r.date || "؟")} · 🔁 ${r.sources} منبع مستقل · ${r.clear ? "🎯 پیام روشن" : "⚠️ پیام طولانی"} · امتیاز ${r.score}`
  ).join("\n");
  return `<b>${LABEL[cat]}</b>\n${items}`;
});

const text =
  `📡 <b>رادار محتوا — گپ‌مدیا</b>\n<i>${DAYS} روز گذشته · ${WHERE}</i>\n\n` +
  sections.join("\n\n") +
  `\n\nاین‌ها فقط نامزدند، نه محتوای ساخته‌شده. برای بررسی میزان تقاضای واقعیِ هرکدام: <code>دیماند: عنوان یا کلیدواژه</code>\n` +
  `اگر یکی از این‌ها را می‌خواهی بسازم، بگو کدام‌یک.`;

console.log(`${rows.length} candidate(s) scored`);
if (tg.enabled && !quiet) {
  await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true });
  console.log("sent to Telegram");
} else {
  console.log(text.replace(/<[^>]+>/g, ""));
}
