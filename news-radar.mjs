// Daily news search engine for German Insider — scores what news-scan.mjs
// finds by how newsworthy it actually is, instead of only sorting by date.
//
//   node news-radar.mjs            # scan, score, queue and report to Telegram
//   node news-radar.mjs --quiet    # scan, print only, no Telegram
//
// news-scan.mjs (hourly) is the operational feed: it takes the first
// in-scope, undeduplicated stories it finds and queues them by recency. This
// answers the criteria question the user asked for explicitly: of what's
// out there, which story is genuinely newsworthy — corroborated by more than
// one independent outlet, not just the one that happened to rank first.
//
// Same discipline as news-scan.mjs: this only ever finds and scores. A story
// is only built after an explicit "بساز N" against the queue this writes.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { SOURCES, FA_DOMAINS, SCOPES, inScope, keyOf, sameStory } from "./lib/news-templates.mjs";
import { amalPersian } from "./lib/amal.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const quiet = process.argv.includes("--quiet");
const env = loadEnv();
const tg = telegramConfig(env);
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const QUEUE = ".news-queue.json";
const SEEN = ".news-seen.json";
const MAX_QUEUE = 9;

const readJSON = (p, d) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d; } catch { return d; } };

if (!KEY) {
  if (tg.enabled && !quiet) await sendMessage({ token: tg.token, chatId: tg.chatId, text: "🔑 برای رادار خبر، EXA_API_KEY لازم است." });
  console.log("EXA_API_KEY missing");
  process.exit(0);
}

const isPersian = (t) => {
  const x = String(t || "").slice(0, 600);
  const fa = (x.match(/[؀-ۿ]/g) || []).length;
  const en = (x.match(/[A-Za-z]/g) || []).length;
  return fa > 40 && fa > en;
};

async function search(query, domains, days) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query, numResults: 10, includeDomains: domains, type: "auto",
      startPublishedDate: new Date(Date.now() - days * 86400000).toISOString(),
      contents: { text: { maxCharacters: 2000 } },
    }),
  });
  if (!res.ok) { console.error("Exa " + res.status + ": " + (await res.text()).slice(0, 160)); return []; }
  return (await res.json()).results || [];
}

// How newsworthy a story actually is: how many independent outlets, beyond
// the Persian-first list already searched, are also reporting it. This is
// the "چقدر خبرساز شده" check — real and countable, unlike a fabricated
// virality guess.
async function corroboration(title) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: title, numResults: 10,
      startPublishedDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      type: "auto", contents: { text: { maxCharacters: 1 } },
    }),
  });
  if (!res.ok) return 0;
  const hosts = new Set();
  for (const r of (await res.json()).results || []) {
    try { hosts.add(new URL(r.url).hostname.replace(/^www\./, "")); } catch { /* skip */ }
  }
  return hosts.size;
}

const isAmalDomain = (url) => {
  try { return new URL(String(url || "")).hostname.replace(/^www\./, "").includes("amal"); }
  catch { return false; }
};

// Both scopes in one pass — the radar is a discovery report, not a single
// channel command, so it looks at everything German Insider could cover.
let found = [];
try { found.push(...(await amalPersian({ limit: 10, days: 4 })).filter((r) => inScope("germany", r.title, r.text))); }
catch (e) { console.error("Amal: " + e.message); }

for (const scopeKey of ["germany", "europe"]) {
  const sc = SCOPES[scopeKey];
  for (const r of await search(sc.query, FA_DOMAINS, 3)) {
    if (!isPersian(r.title) || !isPersian(r.text)) continue;
    if (!inScope(scopeKey, r.title, String(r.text || "").slice(0, 600))) continue;
    found.push(r);
  }
}

// Dedupe against what's already been offered (news-scan.mjs and any prior
// radar run share this file) and against duplicates within this same batch.
const seenStore = readJSON(SEEN, []);
const past = seenStore.map((x) => (typeof x === "string" ? { url: x, key: [] } : x));
const pastUrls = new Set(past.map((x) => x.url));
found = found.filter((r) => !pastUrls.has(r.url) && !past.some((p) => sameStory(keyOf(r.title), p.key || [])));

const batch = [];
for (const r of found) {
  const k = keyOf(r.title);
  if (batch.some((b) => sameStory(k, b.key))) continue;
  batch.push({ ...r, key: k });
}
found = batch;

if (!found.length) {
  if (tg.enabled && !quiet) await sendMessage({ token: tg.token, chatId: tg.chatId, text: "📡 <b>رادار خبر</b>\n\nخبر تازهٔ ناپوشیده‌ای در آلمان یا اروپا پیدا نشد." });
  console.log("no candidates");
  process.exit(0);
}

// Score, then queue by score instead of by raw recency — the same "بساز N"
// command already wired everywhere reads whatever this writes to the queue.
const scored = [];
for (const r of found) {
  const days = r.publishedDate ? (Date.now() - new Date(r.publishedDate)) / 86400000 : 7;
  const sources = await corroboration(r.title);
  const fromAmal = isAmalDomain(r.url);
  const score = Math.min(sources, 6) * 5 + (fromAmal ? 6 : 0) + Math.max(0, Math.round(10 - days * 3));
  scored.push({ ...r, sources, fromAmal, score });
}
scored.sort((a, b) => b.score - a.score);

const sentencesOf = (text) =>
  String(text || "").replace(/\s+/g, " ").split(/(?<=[.!؟])\s+/)
    .map((x) => x.trim()).filter((x) => x.length > 45 && x.length < 190);
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

const queue = scored.slice(0, MAX_QUEUE).map((r, i) => {
  const host = hostOf(r.url);
  const known = Object.values(SOURCES).find((x) => host.includes(x.domain));
  return {
    n: i + 1,
    title: String(r.title || "").replace(/\s*[-–|]\s*(BBC News دری|DW\.com|.*اینترنشنال).*$/, "").trim(),
    url: r.url,
    source: `${known ? known.name : host} · ${String(r.publishedDate || "").slice(0, 10)}`,
    date: String(r.publishedDate || "").slice(0, 10),
    sentences: sentencesOf(r.text).slice(0, 6),
    scannedAt: new Date().toISOString(),
  };
});

writeFileSync(QUEUE, JSON.stringify(queue, null, 2));
writeFileSync(SEEN, JSON.stringify(
  [...scored.map((r) => ({ url: r.url, key: keyOf(r.title) })), ...past].slice(0, 400), null, 2));

console.log(`queued ${queue.length}, ranked by newsworthiness score`);
if (quiet || !tg.enabled) process.exit(0);

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FA = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

const lines = scored.slice(0, MAX_QUEUE).map((r, i) =>
  `<b>${FA(i + 1)}.</b> <a href="${r.url}">${esc(String(r.title).slice(0, 100))}</a>\n` +
  `   🗓 ${esc(String(r.publishedDate || "").slice(0, 10) || "؟")} · 🔁 ${r.sources} منبع مستقل${r.fromAmal ? " · 📍 امل" : ""} · امتیاز ${r.score}`
).join("\n\n");

await sendMessage({
  token: tg.token, chatId: tg.chatId, disablePreview: true,
  text: `📡 <b>رادار خبر — German Insider</b>\n<i>رتبه‌بندی به میزان خبرساز بودن (تعداد منابع مستقل)</i>\n\n${lines}\n\n` +
    `برای ساخت هرکدام: <code>بساز ۱</code> تا <code>بساز ${FA(queue.length)}</code>`,
});
console.log("sent to Telegram");
