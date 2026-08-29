// What people actually type — real demand, not guesses.
//
//   node demand.mjs "درآمد از تیک تاک"
//   node demand.mjs "tiktok monetization" --en
//   node demand.mjs "..." --quiet        # no Telegram, print only
//
// Search autocomplete is the closest thing to a free, public record of what
// people are really asking: every suggestion is a query real users typed often
// enough for the engine to offer it. Google and YouTube expose it without a key.
//
// Reddit is asked too when credentials are configured — it answers a different
// question (where people are stuck, in their own words) and needs a free app
// registered at reddit.com/prefs/apps. Without it the tool still works; it just
// says so rather than pretending the signal is missing.
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const argv = process.argv.slice(2);
const quiet = argv.includes("--quiet");
const english = argv.includes("--en");
const topic = argv.find((a) => !a.startsWith("--"));

if (!topic) {
  console.error('استفاده: node demand.mjs "موضوع"  [--en] [--quiet]');
  process.exit(1);
}

const env = loadEnv();
const tg = telegramConfig(env);
const UA = { "user-agent": "GapMedia-Research/1.0" };

// Question words pull the suggestion list toward problems rather than brands.
const PREFIX_FA = ["چطور", "چگونه", "چرا", "بهترین", "آیا", "چقدر", "کِی", "بدون"];
const PREFIX_EN = ["how to", "why", "what is", "best", "is", "does", "can i", "when"];
// The alphabet probe forces the engine to keep suggesting past its first few
// answers. Latin letters do nothing for a Persian seed, so each language walks
// its own.
const ALPHABET_EN = "abcdefghijklmnopqrstuvwxyz".split("");
const ALPHABET_FA = "ابپتجچحخدرزسشصطعفقکگلمنوهی".split("");

async function suggest(query, youtube = false) {
  const url = "https://suggestqueries.google.com/complete/search?client=firefox"
    + (youtube ? "&ds=yt" : "") + "&q=" + encodeURIComponent(query);
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return [];
    const body = JSON.parse(await res.text());
    return Array.isArray(body[1]) ? body[1] : [];
  } catch { return []; }
}

// Each suggestion is one query real people typed. Counting how many different
// probes surface the same phrase is a usable proxy for how central it is —
// it is NOT a search volume, and is never reported as one.
async function harvest(seed) {
  const prefixes = english ? PREFIX_EN : PREFIX_FA;
  const alphabet = english ? ALPHABET_EN : ALPHABET_FA;
  const probes = [
    seed,
    ...prefixes.map((p) => `${p} ${seed}`),
    // Persian puts its question word at the end ("… چقدر است"), so probe from
    // both sides rather than only prefixing.
    ...(english ? [] : prefixes.map((p) => `${seed} ${p}`)),
    ...alphabet.map((c) => `${seed} ${c}`),
  ];

  const hits = new Map();   // phrase -> { google, youtube, probes }
  const note = (phrase, source) => {
    const key = phrase.toLowerCase().trim();
    if (!key || key === seed.toLowerCase()) return;
    const row = hits.get(key) || { phrase, google: 0, youtube: 0, probes: 0 };
    row[source]++;
    row.probes++;
    hits.set(key, row);
  };

  for (const probe of probes) {
    for (const s of await suggest(probe, false)) note(s, "google");
    for (const s of await suggest(probe, true)) note(s, "youtube");
  }
  return [...hits.values()];
}

// A phrase both engines suggest is stronger evidence than one that only appears
// on a single surface.
const score = (r) => r.probes + (r.google && r.youtube ? 6 : 0)
  + (/چطور|چگونه|چرا|how|why|what/i.test(r.phrase) ? 3 : 0);

// A Persian question word sits wherever the sentence puts it, and that is often
// the end: "درآمد از تیک تاک چقدر است". Anchoring to the start found none of them.
const FA_Q = /(چطور|چگونه|چرا|آیا|چقدر|چند|کدام|کِی|چیست|یعنی چه)/;
const EN_Q = /^(how|why|what|is|does|can|when|should|do)\b/i;
const isQuestion = (p) => FA_Q.test(p) || EN_Q.test(p);

// ---- Reddit: where people describe the problem in their own words ----------
async function reddit(seed) {
  const id = process.env.REDDIT_CLIENT_ID || env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_SECRET || env.REDDIT_SECRET;
  if (!id || !secret) return { ok: false, why: "کلید Reddit تنظیم نشده" };

  try {
    const auth = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        ...UA,
        authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!auth.ok) return { ok: false, why: `ورود ناموفق (${auth.status})` };
    const { access_token: token } = await auth.json();

    const res = await fetch(
      "https://oauth.reddit.com/search?" + new URLSearchParams({
        q: seed, sort: "new", limit: "25", t: "month", type: "link",
      }),
      { headers: { ...UA, authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return { ok: false, why: `جستجو ناموفق (${res.status})` };

    const week = Date.now() / 1000 - 30 * 86400;
    const posts = ((await res.json()).data?.children || [])
      .map((c) => c.data)
      .filter((p) => p.created_utc > week)
      .map((p) => ({
        title: p.title, sub: p.subreddit, comments: p.num_comments,
        url: "https://reddit.com" + p.permalink,
        date: new Date(p.created_utc * 1000).toISOString().slice(0, 10),
      }))
      .sort((a, b) => b.comments - a.comments);
    return { ok: true, posts };
  } catch (e) { return { ok: false, why: e.message }; }
}

// ---- run ------------------------------------------------------------------
console.log(`جست‌وجوی تقاضا برای: ${topic}\n`);

const rows = (await harvest(topic)).sort((a, b) => score(b) - score(a));
const questions = rows.filter((r) => isQuestion(r.phrase)).slice(0, 15);
const both = rows.filter((r) => r.google && r.youtube).slice(0, 15);

console.log(`عبارت یکتا: ${rows.length}`);
console.log(`\n— سؤال‌های واقعی مردم —`);
questions.forEach((r, i) => console.log(`  ${i + 1}. ${r.phrase}`));
console.log(`\n— هم در گوگل هم در یوتیوب پیشنهاد می‌شود —`);
both.forEach((r, i) => console.log(`  ${i + 1}. ${r.phrase}`));

const rd = await reddit(topic);
if (rd.ok) {
  console.log(`\n— بحث‌های Reddit (۳۰ روز اخیر، پرکامنت‌ترین) —`);
  rd.posts.slice(0, 8).forEach((p) => console.log(`  r/${p.sub}  ${p.comments} کامنت  ${p.date}\n     ${p.title.slice(0, 76)}`));
} else {
  console.log(`\n— Reddit: ${rd.why} —`);
}

const out = {
  topic, at: new Date().toISOString(),
  questions: questions.map((r) => r.phrase),
  crossPlatform: both.map((r) => r.phrase),
  reddit: rd.ok ? rd.posts.slice(0, 12) : [],
  redditNote: rd.ok ? "" : rd.why,
};
writeFileSync(".demand.json", JSON.stringify(out, null, 2));

if (!quiet && tg.enabled) {
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const list = (a) => a.slice(0, 8).map((x, i) => `${i + 1}. <code>${esc(x)}</code>`).join("\n") || "—";
  await sendMessage({
    token: tg.token, chatId: tg.chatId, disablePreview: true,
    text: `🔎 <b>تقاضای واقعی: ${esc(topic)}</b>\n\n`
      + `<b>سؤال‌هایی که مردم تایپ می‌کنند</b>\n${list(out.questions)}\n\n`
      + `<b>هم گوگل هم یوتیوب پیشنهاد می‌دهند</b>\n${list(out.crossPlatform)}\n\n`
      + (rd.ok
        ? `<b>Reddit</b>\n` + rd.posts.slice(0, 4).map((p) => `• r/${esc(p.sub)} (${p.comments}) ${esc(p.title.slice(0, 60))}`).join("\n")
        : `<i>Reddit: ${esc(rd.why)}</i>`)
      + `\n\n<i>این‌ها عبارت‌های واقعیِ تایپ‌شده‌اند. هیچ عددِ حجم جست‌وجویی در کار نیست.</i>`,
  });
  console.log("\n✈ به تلگرام فرستاده شد");
}
