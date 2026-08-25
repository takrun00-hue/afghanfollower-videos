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

if (!KEY) {
  console.log("EXA_API_KEY is not set — nothing to do.");
  process.exit(0);
}

// how far back to look; the workflow runs weekly, so a 10-day window overlaps
const DAYS = Number(process.env.RESEARCH_DAYS || 10);
const since = new Date(Date.now() - DAYS * 86400000).toISOString();

const QUERIES = [
  { cat: "instagram", q: "new Instagram feature for creators announced this month" },
  { cat: "tiktok", q: "new TikTok feature for creators announced this month" },
  { cat: "tools", q: "new free AI tool for video or image creators released this month" },
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
  `<i>${DAYS} روز گذشته</i>\n\n` +
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
