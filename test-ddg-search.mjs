import assert from "node:assert/strict";
import { unwrapResultUrl, parseLiteResults, extractPageImage, ddgSearch } from "./lib/ddg-search.mjs";

// DuckDuckGo is the keyless search index that actually lets Exa be replaced
// on the app-feature pipeline (owner directive 2026-09-13). It is the one
// provider here that parses HTML rather than a documented JSON API, and it
// could not be tried against the live service even once: the agent proxy
// reports connect_rejected — "gateway answered 403 to CONNECT (policy
// denial)" — for duckduckgo.com and lite.duckduckgo.com alike.
//
// So this suite leans hard on the property that makes shipping it safe
// anyway: every assumption below, if wrong, yields ZERO results, never a
// wrong one. findRealImage() then behaves exactly as it does today.

// --- unwrapResultUrl: DDG wraps most results in /l/?uddg=<encoded> ---
{
  assert.equal(
    unwrapResultUrl("//duckduckgo.com/l/?uddg=https%3A%2F%2Fnewsroom.tiktok.com%2Fen-us%2Ffeature&rut=abc"),
    "https://newsroom.tiktok.com/en-us/feature",
    "the real destination must be unwrapped out of the redirect",
  );
  assert.equal(
    unwrapResultUrl("https://duckduckgo.com/l/?uddg=https%3A%2F%2Fhelp.instagram.com%2F123"),
    "https://help.instagram.com/123",
  );
  assert.equal(unwrapResultUrl("https://about.instagram.com/blog/x"), "https://about.instagram.com/blog/x", "a direct link passes through");
  assert.equal(unwrapResultUrl("//newsroom.tiktok.com/post"), "https://newsroom.tiktok.com/post", "protocol-relative links resolve to https");

  // Not results:
  assert.equal(unwrapResultUrl("https://duckduckgo.com/?q=next+page"), "", "a link back into DuckDuckGo is navigation, not a result");
  assert.equal(unwrapResultUrl("javascript:alert(1)"), "", "a non-http scheme is never a result");
  assert.equal(unwrapResultUrl("//duckduckgo.com/l/?uddg=javascript%3Aalert(1)"), "", "a wrapped non-http scheme is refused too");
  assert.equal(unwrapResultUrl("//duckduckgo.com/l/?rut=abc"), "", "a redirect with no destination is not a result");
  assert.equal(unwrapResultUrl(""), "");
  assert.equal(unwrapResultUrl(null), "");
  console.log("ok   DDG result URLs unwrap correctly, and non-results (DDG's own pages, non-http schemes) are refused");
}

// --- parseLiteResults against realistic lite markup ---
const LITE_HTML = `<!DOCTYPE html><html><body><form>...</form>
<table>
  <tr><td class="result-count">1.</td>
      <td><a rel="nofollow" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fnewsroom.tiktok.com%2Fen-us%2Fhidden-words&amp;rut=1" class="result-link">TikTok&#39;s Hidden Words &amp; comment filters</a></td></tr>
  <tr><td class="result-snippet">Official newsroom post describing the filter and where it lives in Settings.</td></tr>
  <tr><td><a class="result-link" rel="nofollow" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fhelp.instagram.com%2F700284123459994">Hidden Words on Instagram &mdash; Help Center</a></td></tr>
  <tr><td class="result-snippet">Help Center article with a screenshot of the setting.</td></tr>
  <tr><td><a href="https://duckduckgo.com/?q=more&amp;s=30" class="result-link">Next Page</a></td></tr>
</table></body></html>`;

{
  const results = parseLiteResults(LITE_HTML);
  assert.equal(results.length, 2, "two real results; DuckDuckGo's own 'Next Page' link is not one of them");

  assert.equal(results[0].url, "https://newsroom.tiktok.com/en-us/hidden-words");
  assert.equal(results[0].title, "TikTok's Hidden Words & comment filters", "HTML entities in the title must be decoded");
  assert.match(results[0].snippet, /Official newsroom post/, "each result keeps its own snippet, in order");

  assert.equal(results[1].url, "https://help.instagram.com/700284123459994");
  assert.match(results[1].title, /Hidden Words on Instagram/);
  assert.match(results[1].snippet, /Help Center article/);
  console.log("ok   lite results parse with entities decoded, snippets matched in order, and DDG navigation excluded");
}

// --- The safety property: unfamiliar markup yields nothing, never a guess ---
{
  assert.deepEqual(parseLiteResults("<html><body><p>no results here</p></body></html>"), []);
  assert.deepEqual(parseLiteResults('<a href="https://example.com" class="totally-different">x</a>'), [],
    "if DuckDuckGo renames its classes this must return zero results — the caller reads that as 'found nothing' and falls through");
  assert.deepEqual(parseLiteResults(""), []);
  assert.deepEqual(parseLiteResults(null), []);
  console.log("ok   markup this parser does not recognise produces zero results — it can never fabricate one");
}

// --- Duplicate destinations collapse ---
{
  const dupes = `<a class="result-link" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fa.com%2Fx">One</a>
                 <a class="result-link" href="https://a.com/x">Same page again</a>`;
  assert.equal(parseLiteResults(dupes).length, 1, "the same destination reached two ways is one candidate");
  console.log("ok   duplicate destinations collapse to one candidate");
}

// --- extractPageImage: the image a page is about ---
{
  assert.equal(
    extractPageImage('<meta property="og:image" content="https://cdn.tiktok.com/shot.png">', "https://newsroom.tiktok.com/p"),
    "https://cdn.tiktok.com/shot.png",
  );
  assert.equal(
    extractPageImage('<meta content="https://cdn.example.com/a.jpg" property="og:image">', "https://example.com/p"),
    "https://cdn.example.com/a.jpg",
    "attribute order is not a contract — both orders must work",
  );
  assert.equal(
    extractPageImage('<meta name="twitter:image" content="/relative/shot.png">', "https://help.instagram.com/article/123"),
    "https://help.instagram.com/relative/shot.png",
    "a relative image must resolve against the page it came from",
  );
  assert.equal(
    extractPageImage('<meta property="og:image:secure_url" content="https://x.com/s.png">', "https://x.com/p"),
    "https://x.com/s.png",
  );
  assert.equal(extractPageImage("<html><head><title>no image</title></head></html>", "https://x.com/p"), "",
    "a page with no declared image is not a candidate — there is nothing to show");
  assert.equal(extractPageImage('<meta property="og:image" content="data:image/png;base64,AAAA">', "https://x.com/p"), "",
    "a data: URI is not a fetchable source");
  console.log("ok   a page's own og:image/twitter:image is extracted, resolved, and absent images stay absent");
}

// --- ddgSearch request shape, and a failing service surfacing as itself ---
{
  const realFetch = globalThis.fetch;
  let seen = null;
  globalThis.fetch = async (url, init) => {
    seen = { url: String(url), headers: init?.headers || {} };
    return { ok: true, status: 200, text: async () => LITE_HTML };
  };
  const results = await ddgSearch("instagram hidden words official screenshot");
  globalThis.fetch = realFetch;

  assert.match(seen.url, /^https:\/\/lite\.duckduckgo\.com\/lite\/\?q=/, "the lite endpoint, as the owner specified");
  assert.match(seen.url, /q=instagram%20hidden%20words%20official%20screenshot/, "the query must be encoded");
  assert.doesNotMatch(seen.url, /key=|token=/i, "this index must never need a key");
  assert.ok(seen.headers["user-agent"], "an empty user-agent gets a challenge page instead of results");
  assert.equal(results.length, 2);

  globalThis.fetch = async () => ({ ok: false, status: 429, text: async () => "" });
  await assert.rejects(() => ddgSearch("x"), /DuckDuckGo 429/, "rate limiting must surface as itself, never as 'nothing found'");
  globalThis.fetch = realFetch;
  console.log("ok   ddgSearch calls the keyless lite endpoint and reports a failing service as itself");
}
