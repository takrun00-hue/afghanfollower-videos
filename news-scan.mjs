// Hourly news scan for the German Insider channel.
//
//   node news-scan.mjs            # scan, queue anything new, send it to Telegram
//   node news-scan.mjs --quiet    # queue silently (no Telegram message)
//
// This runs on a schedule and does NOT build anything. It finds candidate
// stories, writes them to a queue, and sends the text and the link for a human
// to read. A video is only built after an explicit "بساز ۱".
//
// Why a queue rather than re-running the search at approval time: the old
// `--pick N` re-ran the query, so by the time the approval arrived an hour later
// the numbering could point at a different story than the one that was read and
// approved. The queue freezes exactly what was shown.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { SOURCES, DE_DOMAINS, SCOPES, inScope } from "./lib/news-templates.mjs";
import { amalPersian } from "./lib/amal.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const argv = process.argv.slice(2);
const quiet = argv.includes("--quiet");
const queryAt = argv.indexOf("--query");
const liveQuery = queryAt >= 0 ? String(argv[queryAt + 1] || "").trim().slice(0, 300) : "";
const amalAt = argv.indexOf("--amal");
const amalTarget = amalAt >= 0 ? String(argv[amalAt + 1] || "").trim().toLowerCase() : "";

const env = loadEnv();
const tg = telegramConfig(env);
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";

const QUEUE = ".news-queue.json";
const SEEN = ".news-seen.json";
const MAX_QUEUE = 9;      // the approval message says "بساز ۱".."بساز ۹"
const SEEN_KEEP = 400;    // enough history that a story is never offered twice

const readJSON = (p, fallback) => {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback; }
  catch { return fallback; }
};

if (!KEY) {
  console.log("EXA_API_KEY missing — nothing scanned");
  process.exit(0);
}

// Amal writes in Persian specifically for Afghans living in Germany, so its
// sentences can go on a card as they stand. Everything else is a second pass.
const AMAL = ["amalnews.de", "amalberlin.de", "amalhamburg.de", "amalfrankfurt.de"];
const AMAL_TARGETS = {
  berlin: { label: "امل برلین", domains: ["amalberlin.de", "wdr.de", "dw.com"] },
  hamburg: { label: "امل هامبورگ", domains: ["amalhamburg.de", "wdr.de", "dw.com"] },
  frankfurt: { label: "امل فرانکفورت", domains: ["amalfrankfurt.de", "wdr.de", "dw.com"] },
  farsi: { label: "امل فارسی", domains: [...AMAL, "wdr.de", "dw.com"] },
};
const target = AMAL_TARGETS[amalTarget] || null;
const REST_DE = DE_DOMAINS.filter((d) => !AMAL.includes(d));

async function search(domains, days, n = 10) {
  if (!domains.length) return [];
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: liveQuery ? `${SCOPES.germany.query} ${liveQuery}` : target ? `خبر تازه ${target.label} به فارسی` : SCOPES.germany.query,
      numResults: n,
      startPublishedDate: new Date(Date.now() - days * 86400000).toISOString(),
      includeDomains: domains,
      type: "auto",
      contents: { text: { maxCharacters: 2000 } },
    }),
  });
  if (!res.ok) {
    console.error("Exa " + res.status + ": " + (await res.text()).slice(0, 160));
    return [];
  }
  return (await res.json()).results || [];
}

// Amal often puts the short, timely version of a local item on Facebook or
// Instagram before a full website article is available. Social posts are only
// used when their text identifies Amal and can be read in Persian/Dari.
async function searchAmalSocial(targetName, days = 7) {
  if (!targetName) return [];
  const place = {
    berlin: "Amal Berlin Farsi Dari",
    hamburg: "Amal Hamburg Farsi Dari",
    frankfurt: "Amal Frankfurt Farsi Dari",
    farsi: "Amal Farsi Dari Berlin Hamburg Frankfurt",
  }[targetName] || "Amal Farsi Dari";
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: `${place} Germany news post`, numResults: 12,
      startPublishedDate: new Date(Date.now() - days * 86400000).toISOString(),
      includeDomains: ["facebook.com", "instagram.com"], type: "auto",
      contents: { text: { maxCharacters: 2000 } },
    }),
  });
  if (!res.ok) return [];
  return (await res.json()).results || [];
}

// The cards are Persian, so an English article is unusable whatever it says —
// its sentences cannot go on screen and it arrives as a "new" story even when it
// is the same deportation flight an Amal piece already covered.
const isPersian = (t) => {
  const x = String(t || "").slice(0, 600);
  const fa = (x.match(/[؀-ۿ]/g) || []).length;
  const en = (x.match(/[A-Za-z]/g) || []).length;
  return fa > 40 && fa > en;
};

// Headlines are naturally short (for example «خبر مهم در برلین»), so applying
// the long-article threshold to them discarded otherwise valid Amal articles.
const isPersianHeadline = (t) => {
  const x = String(t || "").slice(0, 220);
  const fa = (x.match(/[؀-ۿ]/g) || []).length;
  const en = (x.match(/[A-Za-z]/g) || []).length;
  return fa >= 5 && fa > en;
};

function isOfficialAmalSocial(result, which) {
  let host = "";
  try { host = new URL(String(result.url || "")).hostname.replace(/^www\./, ""); } catch {}
  if (!(host === "facebook.com" || host.endsWith(".facebook.com") || host === "instagram.com" || host.endsWith(".instagram.com"))) return false;
  const hay = `${result.title || ""} ${result.text || ""} ${result.url || ""}`.toLowerCase();
  if (!hay.includes("amal")) return false;
  if (which === "berlin") return hay.includes("berlin");
  if (which === "hamburg") return hay.includes("hamburg");
  if (which === "frankfurt") return hay.includes("frankfurt");
  return /farsi|dari|فارسی|دری/.test(`${result.title || ""} ${result.text || ""}`);
}

const inGermanyScope = (r) =>
  isPersian(r.title) && isPersian(r.text) &&
  inScope("germany", r.title, String(r.text || "").slice(0, 600));

const isAmalDomain = (url) => {
  try { return new URL(String(url || "")).hostname.replace(/^www\./, "").includes("amal"); }
  catch { return false; }
};
const inAmalTargetScope = (r) =>
  isPersianHeadline(r.title) && isPersian(r.text) &&
  (isAmalDomain(r.url) || inScope("germany", r.title, String(r.text || "").slice(0, 600)));

// Amal first and on a wider window — being the channel's home source, an Amal
// story from yesterday still beats a fresher one from a general outlet.
// A named Amal command is a source digest: it stays Persian but does not throw
// away useful local information merely because it does not contain migration
// keywords. The normal German Insider scan remains migration-impact only.
const keep = target ? inAmalTargetScope : inGermanyScope;
// A named Amal command is a source digest, not a breaking-news alarm. Amal
// does not necessarily publish in every city every four days; look back far
// enough to return the latest useful Dari/Persian reporting, then show its
// real date in Telegram.
// Amal is read from Amal, not searched for.
//
// Exa has none of the four Amal domains indexed — amalnews.de, amalberlin.de,
// amalhamburg.de and amalfrankfurt.de all return zero results for any query at
// any date range. So the «امل» commands have never once returned an Amal story;
// what arrived came from dw.com and wdr.de, which sat in the domain list beside
// Amal, and when those were already seen the scan reported "no new stories"
// without saying why.
//
// Amal publishes a public WordPress API carrying its Persian desk. Reading it
// directly needs no index and no query.
let found = [];
if (target) {
  try {
    found = (await amalPersian({ city: amalTarget === "farsi" ? null : amalTarget }))
      .filter(keep);
  } catch (e) {
    // Name the source that failed. A silent empty list is exactly what hid this
    // for weeks: "no new stories" reads as "nothing happened today", not as
    // "the source was never reachable".
    console.error(`Amal unreachable: ${e.message}`);
    if (tg.enabled && !quiet) {
      await sendMessage({
        token: tg.token, chatId: tg.chatId,
        text: `⚠️ ${target.label}: ${e.message}`,
      });
    }
  }
  // The German outlets stay as a second layer, after Amal's own reporting.
  const seen = new Set(found.map((r) => r.url));
  for (const r of (await search(target.domains, 7)).filter(keep)) {
    if (!seen.has(r.url)) { found.push(r); seen.add(r.url); }
  }
} else {
  found = (await search(AMAL, 4)).filter(keep);
}
if (target) {
  const social = (await searchAmalSocial(amalTarget)).filter((item) =>
    isOfficialAmalSocial(item, amalTarget) && isPersian(item.text) &&
    (isPersianHeadline(item.title) || isPersianHeadline(item.text))
  );
  const urls = new Set(found.map((item) => item.url));
  for (const item of social) {
    if (!urls.has(item.url)) { found.push(item); urls.add(item.url); }
  }
}
const seenNow = new Set(found.map((r) => r.url));
if (!target) {
  for (const r of (await search(REST_DE, 2)).filter(inGermanyScope)) {
    if (!seenNow.has(r.url)) { found.push(r); seenNow.add(r.url); }
  }
}

// Nothing that has already been offered, whatever the outcome was. A URL match
// only catches the same page twice — the same deportation flight written up by
// Amal, DW and BBC is three different URLs and would arrive as three "new"
// stories, so headlines are compared on their content words too.
const STOP = new Set(["از", "به", "در", "را", "که", "با", "این", "برای", "است", "شد",
  "شده", "های", "یک", "بر", "تا", "هم", "و", "بود", "کرد", "می", "خود", "بین", "دو"]);

// "گروه دیگری" and "گروهی دیگر" are the same story told twice, so the plural and
// possessive endings come off before comparing — without a light stem the two
// share too few exact words and both get sent.
const stem = (w) => w.replace(/(های|ها|ان|ی)$/, "") || w;

const keyOf = (title) =>
  // "…اخراج شدند - اطلاعات روز" — the outlet's own name at the end is noise that
  // pushes two reports of one event below the similarity threshold.
  String(title).replace(/\s*[-–|]\s*[^-–|]{1,30}$/, "")
    .replace(/[‌‏]/g, " ")
    .replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/[،؛؟«»ـً-ٟٔ]/g, " ")
    .replace(/[^؀-ۿ\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem)
    .filter((w) => w.length > 2)
    .sort();

// "افغان" and "افغانستان" are the same subject, and one stem rule cannot flatten
// both, so words also count as shared when one is a prefix of the other.
const akin = (x, y) =>
  x === y || (x.length >= 3 && y.startsWith(x)) || (y.length >= 3 && x.startsWith(y));

const sameStory = (a, b) => {
  if (!a.length || !b.length) return false;
  const shared = a.filter((w) => b.some((v) => akin(w, v))).length;
  return shared / Math.min(a.length, b.length) >= 0.55;
};

const store = readJSON(SEEN, []);
// older files held a bare array of URLs; keep reading those
const past = store.map((x) => (typeof x === "string" ? { url: x, key: [] } : x));
const pastUrls = new Set(past.map((x) => x.url));

found = found.filter((r) => {
  // An explicit Amal source request is a reader's digest. It should show the
  // latest reporting even when the same link was listed in an earlier scan.
  // Repeated *video* delivery remains blocked later by content-history.json.
  if (target) return true;
  if (pastUrls.has(r.url)) return false;
  const k = keyOf(r.title);
  return !past.some((p) => sameStory(k, p.key || []));
});

// and no two versions of the same story inside one scan either
const batch = [];
for (const r of found) {
  const k = keyOf(r.title);
  if (batch.some((b) => sameStory(k, b.key))) continue;
  batch.push({ ...r, key: k });
}
found = batch;

if (!found.length) {
  if (liveQuery && tg.enabled && !quiet) {
    const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendMessage({ token: tg.token, chatId: tg.chatId, text: `🔎 برای «${esc(liveQuery)}» خبر معتبرِ تازه پیدا نشد.\n\nبرای ادامه بنویس: <code>جستجوی جدید خبر: عبارت تازه</code>` });
  }
  if (target && tg.enabled && !quiet) await sendMessage({ token: tg.token, chatId: tg.chatId, text: `📭 در هفت روز اخیر، مطلب فارسی/دری قابل‌استفاده‌ای از ${target.label} و منابع تکمیلی پیدا نشد.` });
  console.log("no new stories");
  process.exit(0);
}

found.sort((a, b) => String(b.publishedDate || "").localeCompare(String(a.publishedDate || "")));

// Persian sentences long enough to carry a fact, short enough to read on a card.
const sentencesOf = (text) =>
  String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!؟])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 45 && x.length < 190);

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

const queue = found.slice(0, MAX_QUEUE).map((r, i) => {
  const host = hostOf(r.url);
  const known = Object.values(SOURCES).find((x) => host.includes(x.domain));
  return {
    n: i + 1,
    title: String(r.title || "").replace(/\s*[-–|]\s*(BBC News دری|DW\.com|.*اینترنشنال).*$/, "").trim(),
    url: r.url,
    // kept for the operator's own reading, never rendered into the video
    source: `${known ? known.name : host} · ${String(r.publishedDate || "").slice(0, 10)}`,
    date: String(r.publishedDate || "").slice(0, 10),
    sentences: sentencesOf(r.text).slice(0, 6),
    scannedAt: new Date().toISOString(),
  };
});

writeFileSync(QUEUE, JSON.stringify(queue, null, 2));
writeFileSync(SEEN, JSON.stringify(
  [...queue.map((q) => ({ url: q.url, key: keyOf(q.title) })), ...past].slice(0, SEEN_KEEP), null, 2));

console.log(`queued ${queue.length}`);

if (quiet || !tg.enabled) process.exit(0);

// One message per story: the headline, the text to read, and the link. Splitting
// them means the approval reply lands under the story it belongs to.
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FA = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

for (const q of queue) {
  const preview = q.sentences.slice(0, 3).map((s) => "• " + esc(s)).join("\n") || "<i>متن کامل در لینک</i>";
  await sendMessage({
    token: tg.token,
    chatId: tg.chatId,
    text:
      `📰 <b>${esc(q.title)}</b>\n\n${preview}\n\n` +
      `🔗 <a href="${q.url}">${esc(hostOf(q.url))}</a> · ${esc(q.date)}\n\n` +
      `اگر تأیید می‌کنی: <code>بساز ${FA(q.n)}</code>`,
  });
}
