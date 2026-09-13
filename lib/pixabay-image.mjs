// Pixabay — the second free real-photo provider for the German A1
// vocabulary series (owner directive 2026-09-13, "all free APIs"). Free key,
// no card, and its licence permits commercial use without attribution.
//
// Same scope limit as lib/pexels-image.mjs, for the same reason: this serves
// VOCABULARY slides, where the claim is what a word means and a real
// photograph of the thing is real evidence for it. It is never a source for
// app-feature videos, where the claim is "this app has this feature and it
// looks like this" — no stock photograph establishes that, and using one
// there is the «تصویرسازی عمومی» PROJECT_RULES.md rule 41 forbids.
//
// Like Pexels here: portrait (these are 9:16 slides), the largest rendition
// (the project floor is 1080px, and the smaller Pixabay renditions are below
// it), candidates verified rather than assumed, and no key means no call —
// never an unauthenticated request whose error reads as "nothing found".
import { firstVerifiedCandidate, dedupe, withTimeout } from "./image-candidates.mjs";

/**
 * @returns {Promise<Array<{image:string,title:string,url:string,credit:string}>>}
 * @throws when the API answers non-2xx, so a real status (429 rate limit,
 *   400 bad key) stays visible in the logs instead of looking like "no
 *   results" — the distinction that made the Exa 402 outage diagnosable.
 */
export async function pixabaySearch(query, { perPage = 8 } = {}) {
  const key = process.env.PIXABAY_KEY || process.env.PIXABAY_API_KEY || "";
  if (!key) return [];
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(key)}`
    + `&q=${encodeURIComponent(query)}`
    + `&image_type=photo&orientation=vertical&safesearch=true&per_page=${perPage}`;
  const res = await fetch(url, withTimeout());
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  const data = await res.json();
  return dedupe((data?.hits || []).map((h) => ({
    // largeImageURL is the biggest rendition the free tier returns; webformatURL
    // is capped at 640px and would fail the project's 1080px floor outright.
    image: typeof h?.largeImageURL === "string" ? h.largeImageURL : (typeof h?.fullHDURL === "string" ? h.fullHDURL : ""),
    title: String(h?.tags || "").slice(0, 160),
    url: String(h?.pageURL || ""),
    credit: String(h?.user || ""),
  })));
}

/**
 * One verified real photograph for a vocabulary concept, or null.
 * @param {string} query  English search phrase for the concept itself
 * @param {string} label  the Persian meaning, for the relevance judgement
 */
export async function findPixabayImage(query, label) {
  let hits = [];
  try {
    hits = await pixabaySearch(query);
  } catch (e) {
    console.error(`   ⚠ findPixabayImage(${query}): ${e.message}`);
    return null;
  }
  return firstVerifiedCandidate(hits, { prefix: "pixabay", query, label, provider: "Pixabay" });
}
