// Which live-search results are safe to build a tutorial on.
//
// The content search used to be locked to official newsrooms, which was safe but
// useless — those pages prove a feature exists and never say what a creator
// should do. Now that the search widens past them, the results include pages
// written to sell something rather than to be correct: follower and coin shops,
// cash-advance blogs, adult platforms. A sales page is optimised for conversion,
// not accuracy, and its numbers are the first thing that turns into an invented
// statistic on a card.
//
// This is a filter on SOURCES, not on subjects. Nothing here judges anyone's
// business — it says only that a page selling followers is not where a tutorial
// gets its facts.
//
// To add a domain without touching code, put one per line in
// `.source-blocklist` next to this project. Lines starting with # are ignored.
import { existsSync, readFileSync } from "node:fs";

// Seeded with what the searches actually returned, not a guessed list.
const BLOCKED_DOMAINS = [
  "joingerald.com",     // cash-advance blog farming creator keywords
  "fanspicy.com",       // adult platform, SEO pages on "monetising"
  "3tr.ir",             // coin/follower shop
  "polimetro.com",      // scraped-content aggregator
  "vietnam.vn",         // machine-translates its pages into dozens of languages
];

// The person choosing a source reads Persian and English. An Indonesian SEO blog
// or a machine-translated page cannot be checked before it becomes the factual
// base of a video, and "how to make money" queries are dominated by exactly
// those. Judged on the title, where these words are common and unambiguous.
const OTHER_LANGUAGE = [
  /\b(cara|dari|untuk|menghasilkan|panduan|dengan|uang)\b/i,   // Indonesian/Malay
  /\b(c[oó]mo|ganar|dinero|dinheiro|ganhar)\b/i,               // Spanish/Portuguese
  /\b(nas[\u0131i]l|para kazanma|kazanmak)\b/i,                 // Turkish
  /[\u0103\u00e2\u0111\u00ea\u00f4\u01a1\u01b0]|\b(c[\u00e1]ch|ti[\u1ec1]n|ki[\u1ebf]m)\b/i, // Vietnamese
];

// A page can be from an unknown domain and still be unusable. These read on the
// page itself.
const BLOCKED_SIGNALS = [
  // follower / engagement shops, Persian and English
  /خرید\s*(فالوور|لایک|ویو|بازدید|ممبر|سکه)/,
  /فروش\s*(فالوور|لایک|ویو|سکه|اکانت)/,
  /(افزایش|ارزان)\s*فالوور/,
  /\bbuy\s+(followers|likes|views|subscribers|coins)\b/i,
  /\bfree\s+(coins|followers|likes)\s+(generator|hack)\b/i,
  // money-product pages wearing creator keywords
  /\b(cash advance|payday loan|no credit check)\b/i,
  /\b(casino|betting|sportsbook|forex signals)\b/i,
  // adult platforms
  /\b(onlyfans|fansly|adult content creators?)\b/i,
];

const extraDomains = () => {
  try {
    if (!existsSync(".source-blocklist")) return [];
    return readFileSync(".source-blocklist", "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith("#"));
  } catch { return []; }
};

const hostOf = (url) => {
  try { return new URL(String(url)).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return ""; }
};

// Returns "" when the source is usable, or a short Persian reason when it is not.
export function rejectReason(item) {
  const host = hostOf(item && item.url);
  if (!host) return "آدرس نامعتبر";

  const blocked = [...BLOCKED_DOMAINS, ...extraDomains()];
  if (blocked.some((d) => host === d || host.endsWith("." + d))) return "دامنهٔ مسدود";

  const hay = `${(item && item.title) || ""} ${String((item && item.text) || "").slice(0, 1200)}`;
  for (const re of BLOCKED_SIGNALS) if (re.test(hay)) return "صفحهٔ فروش، نه راهنما";

  const title = String((item && item.title) || "");
  for (const re of OTHER_LANGUAGE) if (re.test(title)) return "زبان غیرقابل بررسی";

  return "";
}

export const isUsableSource = (item) => rejectReason(item) === "";

// How much of a text is actually Persian.
//
// The language list above blocks Indonesian, Spanish, Turkish and Vietnamese
// but deliberately allowed English, because the person choosing a source reads
// it. That was fine for *choosing* and wrong for *building*: source-draft.mjs
// copies the title and excerpt straight onto the cards and into the narration,
// so picking an English page produced an English video on a Persian channel.
//
// Counted over letters only. Digits, punctuation and spaces say nothing about
// language, and a title like "CapCut 2026" would otherwise look half-Persian.
export function persianShare(text) {
  const letters = String(text || "").match(/[\p{L}]/gu) || [];
  if (!letters.length) return 0;
  const persian = letters.filter((ch) => /[\u0600-\u06FF]/.test(ch)).length;
  return persian / letters.length;
}

/** Whether a text can go on a Persian card as it stands. */
export const isPersianEnough = (text, min = 0.6) => persianShare(text) >= min;
