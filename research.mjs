// Weekly content research.
//
// Searches for platform updates shipped since the last run, drops anything the
// content bank already covers, and sends what is left to Telegram as a short
// Persian digest.
//
// It deliberately stops at "here is what is new" rather than writing videos by
// itself: turning a news item into a correct four-step Persian tutorial is
// authoring, not searching, and there is no language model in the cloud job. A
// wrong tutorial is worse than a missing one.
//
// SECURITY: search results are untrusted text from the open web. They are only
// ever formatted into a message for a human to read — never executed, never
// used to decide what the pipeline does.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { FEATURES } from "./lib/features.mjs";
import { EXTRA } from "./lib/features-extra.mjs";
import { FRESH } from "./lib/features-fresh.mjs";
import { Y2026 } from "./lib/features-2026.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const env = loadEnv();
const tg = telegramConfig(env);
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
// Which machine produced this. Without it, a digest from the laptop and one from
// the cloud look identical, so there is no way to tell whether the repository
// secret is actually working.
const WHERE = process.env.GITHUB_ACTIONS === "true" ? "☁️ از فضای ابری" : "💻 از کامپیوتر";

// Say so out loud. A silent exit is indistinguishable from a silent failure:
// the user sends «خبر», nothing arrives, and there is no way to tell whether the
// key is missing, the search failed, or there simply was no news.
if (!KEY) {
  const msg =
    "🔑 <b>کلید جستجو تنظیم نشده</b>\n" +
    "<i>" + WHERE + "</i>\n\n" +
    "برای فعال شدن جستجوی خودکار، در گیت‌هاب این را اضافه کن:\n" +
    "<b>Settings → Secrets and variables → Actions → New repository secret</b>\n\n" +
    "نام: <code>EXA_API_KEY</code>\n" +
    "مقدار: کلیدی که از dashboard.exa.ai می‌گیری";
  if (tg.enabled) await sendMessage({ token: tg.token, chatId: tg.chatId, text: msg });
  console.log("EXA_API_KEY is not set — told the user.");
  process.exit(0);
}

// how far back to look; the workflow runs weekly, so a 10-day window overlaps
const DAYS = Number(process.env.RESEARCH_DAYS || 10);
const since = new Date(Date.now() - DAYS * 86400000).toISOString();

// Press releases and self-submitted product directories dominate any search
// phrased as "new free AI tool" — vendors pay to rank for exactly those words.
// Excluding them is what separates news from advertising.
const AD_DOMAINS = [
  "prnewswire.com", "businesswire.com", "globenewswire.com", "einpresswire.com",
  "peerpush.com", "producthunt.com", "betalist.com", "uneed.best",
];

const QUERIES = [
  { cat: "instagram", q: "Instagram announced a new feature for creators, reported by a tech news site" },
  { cat: "tiktok", q: "TikTok announced a new feature for creators, reported by a tech news site" },
  // ask for editorial coverage of a tool, not for the tool's own landing page
  { cat: "tools", q: "hands-on review or news article about a genuinely useful new AI tool for video or image creators" },
];

// Everything the bank already teaches, so the digest only reports what is new.
function covered() {
  const out = new Set();
  for (const bank of [Y2026, FRESH, FEATURES, EXTRA]) {
    for (const cat of Object.keys(bank || {})) {
      for (const f of bank[cat] || []) {
        out.add(String(f.id).toLowerCase());
        out.add(String(f.name).toLowerCase());
      }
    }
  }
  return out;
}
const HAVE = covered();

// A result is "already known" when the bank has a feature whose name appears in
// the headline — crude, but it is only deciding whether to mention something.
function isKnown(title) {
  const t = String(title).toLowerCase();
  for (const name of HAVE) {
    if (name.length >= 5 && t.includes(name)) return true;
  }
  return false;
}

async function search(q) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: q,
      numResults: 8,
      startPublishedDate: since,
      type: "auto",
      excludeDomains: AD_DOMAINS,
      contents: { text: { maxCharacters: 400 } },
    }),
  });
  if (!res.ok) throw new Error(`Exa ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.results || [];
}

const LABEL = { instagram: "اینستاگرام", tiktok: "تیک‌تاک", tools: "ابزارها" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sections = [];
let found = 0;

for (const { cat, q } of QUERIES) {
  let results = [];
  try {
    results = await search(q);
  } catch (e) {
    sections.push(`<b>${LABEL[cat]}</b>\n⚠️ جستجو ناموفق بود: ${esc(String(e.message).slice(0, 120))}`);
    continue;
  }
  const fresh = results.filter((r) => r.title && !isKnown(r.title)).slice(0, 4);
  if (!fresh.length) {
    sections.push(`<b>${LABEL[cat]}</b>\n— چیز تازه‌ای پیدا نشد.`);
    continue;
  }
  found += fresh.length;
  const items = fresh
    .map((r) => {
      const d = r.publishedDate ? ` <i>(${String(r.publishedDate).slice(0, 10)})</i>` : "";
      return `• <a href="${esc(r.url)}">${esc(String(r.title).slice(0, 110))}</a>${d}`;
    })
    .join("\n");
  sections.push(`<b>${LABEL[cat]}</b>\n${items}`);
}

const text =
  `🔎 <b>گزارش هفتگی آپدیت‌ها</b>\n` +
  `<i>${DAYS} روز گذشته · ${WHERE}</i>\n\n` +
  sections.join("\n\n") +
  (found
    ? `\n\n<b>${found}</b> مورد تازه که هنوز در بانک محتوا نیست. ` +
      `هر کدام را خواستی بگو تا به‌عنوان ویدیو اضافه‌اش کنم.`
    : `\n\nبانک محتوا به‌روز است.`);

if (tg.enabled) {
  await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true });
  console.log(`sent digest — ${found} new item(s)`);
} else {
  console.log(text);
}
