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

// ---- social ---------------------------------------------------------------
// Amal's own Facebook and Instagram, as a supplement — never as the source.
//
// Measured, 2026-08-31:
//   · Fetching either page directly returns the login wall. instagram.com and
//     facebook.com both answer 200 with ~500KB of markup and ZERO Persian
//     characters; mbasic.facebook.com and a text-extraction proxy the same.
//     The post text is simply not served to a logged-out reader.
//   · Exa can sometimes surface these pages — one query returned 14 results of
//     which 3 were genuinely Amal — but the same query minutes later returned
//     an empty list, three times running, HTTP 200 and $0 charged. Coverage is
//     not consistent enough to schedule against.
//   · Exa never returns a publish date for a social post, so a result cannot be
//     told apart from one posted in 2021.
//
// So this runs, uses what it gets, and cannot mislead: results are marked
// undated and are appended AFTER the website's dated reporting, never in front
// of it. When Exa returns nothing, nothing breaks.
//
// Making this dependable needs a Facebook Page access token — a page's own
// posts are readable through the Graph API with dates. That is a credential the
// operator would have to create.
const SOCIAL = ["facebook.com", "instagram.com"];

/** True only for a post that identifies itself as Amal's. */
function ownedByAmal(item, city) {
  let host = "";
  try { host = new URL(String(item.url || "")).hostname.replace(/^www\./, ""); } catch { return false; }
  if (!SOCIAL.some((d) => host === d || host.endsWith(`.${d}`))) return false;

  const hay = `${item.title || ""} ${item.url || ""}`.toLowerCase();
  // The account name has to be in the title or the URL. Searching for "Amal"
  // returns a great many Persian-language migration pages that are not Amal,
  // and attributing one of those to Amal would be the worst outcome here.
  if (!/\bamal\b/.test(hay)) return false;
  if (city && !hay.includes(city)) return false;
  return /[؀-ۿ]/.test(`${item.title || ""} ${item.text || ""}`);
}

/**
 * Amal's social posts, best-effort. Returns [] when the index has nothing —
 * which is most of the time, and is not an error.
 */
export async function amalSocial({ city = null, key = "", limit = 4 } = {}) {
  if (!key) return [];
  const where = city ? `Amal ${city}` : "Amal Berlin";
  let rows = [];
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        query: `${where} news farsi dari اخبار آلمان مهاجران`,
        numResults: 14, includeDomains: SOCIAL, type: "auto",
        contents: { text: { maxCharacters: 900 } },
      }),
    });
    if (!res.ok) return [];
    rows = (await res.json()).results || [];
  } catch {
    return [];
  }

  return rows
    .filter((r) => ownedByAmal(r, city))
    .map((r) => ({
      title: clean(r.title).replace(/\s*[-–|]\s*Amal.*$/i, "").slice(0, 120),
      url: r.url,
      // No date is available. Saying so is the point: an undated post must not
      // be presented beside dated reporting as though it were today's.
      publishedDate: "",
      undated: true,
      text: clean(r.text),
      source: "امل (شبکه اجتماعی)",
    }))
    .filter((r) => r.title && isPersian(r.title + " " + r.text))
    .slice(0, limit);
}

// ---- Facebook, through the Graph API ---------------------------------------
// Amal posts to Facebook more often than to the website, so this is the layer
// that matters most — and it is the only route that returns social posts WITH
// publish dates, which is what makes them usable in a news scan at all.
//
// Reading a public page's own posts needs a token. Which kind decides what the
// pipeline can do, so `amalFacebookDiagnose()` reports what the supplied token
// actually is rather than failing with "invalid token":
//
//   Page access token   — the page's own posts, dated. What is wanted.
//   User access token   — only pages the user administers.
//   App access token    — cannot read a page it does not own.
//
// Set FACEBOOK_PAGE_TOKEN in .env and in the Actions secrets.
const GRAPH = "https://graph.facebook.com/v21.0";
const AMAL_PAGE = "AmalBerlinNews";

/** What the configured token is, and what it can see. */
export async function amalFacebookDiagnose(token) {
  if (!token) return { ok: false, why: "FACEBOOK_PAGE_TOKEN is not set" };
  try {
    const res = await fetch(`${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`);
    const body = await res.json();
    if (body?.error) return { ok: false, why: body.error.message };
    const d = body?.data || {};
    return {
      ok: !!d.is_valid,
      type: d.type || "unknown",
      scopes: d.scopes || [],
      expires: d.expires_at ? new Date(d.expires_at * 1000).toISOString().slice(0, 10) : "never",
      why: d.is_valid ? "" : "token is not valid",
    };
  } catch (e) {
    return { ok: false, why: e.message };
  }
}

/**
 * Amal's Facebook posts, newest first, WITH dates.
 *
 * Returns [] and never throws when no token is set, so the scan keeps working
 * on the website alone until one is added.
 */
export async function amalFacebook({ token = "", limit = 8, days = 14, page = AMAL_PAGE } = {}) {
  if (!token) return [];
  const since = Math.floor((Date.now() - days * 86400000) / 1000);
  const fields = "id,message,created_time,permalink_url";
  const url = `${GRAPH}/${encodeURIComponent(page)}/posts`
    + `?fields=${fields}&limit=${Math.min(50, limit * 3)}&since=${since}`
    + `&access_token=${encodeURIComponent(token)}`;

  let rows = [];
  try {
    const res = await fetch(url);
    const body = await res.json();
    if (body?.error) throw new Error(body.error.message);
    rows = body?.data || [];
  } catch (e) {
    // Named, so a token that has expired does not read as a quiet news day.
    throw new Error(`Facebook: ${e.message}`);
  }

  return rows
    .map((r) => {
      const text = clean(r.message);
      // A Facebook post has no headline. Its first sentence is the headline.
      const title = text.split(/(?<=[.!؟])\s+/)[0]?.slice(0, 120) || "";
      return {
        title,
        url: r.permalink_url || `https://www.facebook.com/${page}`,
        publishedDate: String(r.created_time || "").slice(0, 10),
        text,
        source: "امل (فیسبوک)",
      };
    })
    .filter((r) => r.title && isPersian(r.title + " " + r.text) && r.publishedDate)
    .slice(0, limit);
}
