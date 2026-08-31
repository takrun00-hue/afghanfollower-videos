// Amal's Persian desk, read from Amal.
//
// The «امل» commands searched through Exa, and Exa has none of the four Amal
// domains indexed — amalnews.de, amalberlin.de, amalhamburg.de and
// amalfrankfurt.de all return zero results, for any query, at any date range.
// The command has therefore never once returned an Amal story. What reached
// Telegram came from dw.com and wdr.de, which were in the domain list beside
// Amal, and when those were already seen the scan said "no new stories" and
// gave no reason.
//
// Amal publishes a WordPress REST API and an RSS feed, both public and both
// carrying the Persian desk. Reading them directly needs no index, no search
// key and no query — the newest Persian reporting is simply what the endpoint
// returns, in order.
//
//   /fa/            the Persian desk
//   /berlin|hamburg|frankfurt/   city pages, each with its own posts
//
// A city command asks the Persian desk for that city's coverage rather than the
// city page, because the city pages are German-first.

const BASE = "https://amalnews.de";
const CITY_TERM = { berlin: "برلین", hamburg: "هامبورگ", frankfurt: "فرانکفورت" };

const clean = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&laquo;|&raquo;/g, "«")
    .replace(/\s+/g, " ")
    .trim();

const isPersian = (s) => {
  const letters = String(s || "").match(/\p{L}/gu) || [];
  if (!letters.length) return false;
  return letters.filter((c) => /[؀-ۿ]/.test(c)).length / letters.length > 0.55;
};

/**
 * Newest Persian stories from Amal.
 *
 * `city` narrows to one city's coverage by searching the Persian desk for its
 * name; without it the whole desk comes back newest-first.
 */
export async function amalPersian({ city = null, limit = 9, days = 21 } = {}) {
  const params = new URLSearchParams({
    per_page: String(Math.min(20, limit * 2)),
    orderby: "date",
    order: "desc",
    _fields: "id,date,link,title,excerpt,content",
  });
  if (city && CITY_TERM[city]) params.set("search", CITY_TERM[city]);

  const url = `${BASE}/fa/wp-json/wp/v2/posts?${params}`;
  let rows = [];
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`Amal API ${res.status}`);
    rows = await res.json();
  } catch (e) {
    // A named failure, not an empty list. "No new stories" for a site that is
    // publishing daily is the report that hid this bug for weeks.
    throw new Error(`Amal is not answering: ${e.message}`);
  }

  const cutoff = Date.now() - days * 86400000;
  return rows
    .map((r) => ({
      title: clean(r.title?.rendered),
      url: r.link,
      publishedDate: String(r.date || "").slice(0, 10),
      text: clean(r.excerpt?.rendered) || clean(r.content?.rendered).slice(0, 1200),
      source: "امل",
    }))
    .filter((r) => r.title && isPersian(r.title) && Date.parse(r.publishedDate) > cutoff)
    .slice(0, limit);
}

/** Whether a URL belongs to Amal, for provenance checks elsewhere. */
export const isAmal = (url) => {
  try {
    return /(^|\.)amal(news|berlin|hamburg|frankfurt)\.de$/.test(new URL(url).hostname);
  } catch {
    return false;
  }
};
