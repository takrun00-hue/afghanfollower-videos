import assert from "node:assert/strict";
import { pexelsSearch } from "./lib/pexels-image.mjs";

// Owner directive 2026-09-13: Pexels becomes the primary real-photo source
// for German vocabulary after Exa's credits ran out (402) and stopped
// delivery. api.pexels.com is unreachable from this environment (the egress
// proxy blocks it — a request returns http=000, not 401), and no PEXELS_KEY
// is configured here, so the live call cannot be exercised in this suite.
// What CAN be pinned without the network is the request this code builds and
// the answer it derives — which is where the specified snippet had its real
// bugs.

const realFetch = globalThis.fetch;
const calls = [];
const mockPexels = (photos, { status = 200 } = {}) => {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init?.headers || {} });
    if (status !== 200) return { ok: false, status, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ photos }) };
  };
};
const restore = () => { globalThis.fetch = realFetch; };

// --- No key: no call at all. The snippet's `Authorization: key!` would have
// --- sent "undefined" and read the resulting 401 as "no photos found".
{
  calls.length = 0;
  delete process.env.PEXELS_KEY;
  delete process.env.PEXELS_API_KEY;
  mockPexels([]);
  assert.deepEqual(await pexelsSearch("einkaufen"), []);
  assert.equal(calls.length, 0, "with no key configured the API must not be called at all");
  restore();
  console.log("ok   no PEXELS_KEY means no request — never an unauthenticated call misread as an empty result");
}

process.env.PEXELS_KEY = "test-key-not-real";

// --- Request shape: portrait (these are 9:16 videos), and the key in the
// --- Authorization header.
{
  calls.length = 0;
  mockPexels([]);
  await pexelsSearch("supermarket checkout germany");
  restore();
  assert.equal(calls.length, 1);
  const { url, headers } = calls[0];
  assert.match(url, /^https:\/\/api\.pexels\.com\/v1\/search\?/);
  assert.match(url, /query=supermarket%20checkout%20germany/, "the query must be URL-encoded");
  assert.match(url, /orientation=portrait/, "9:16 video with photoAspect 0.75 needs portrait, not the specified landscape");
  assert.doesNotMatch(url, /orientation=landscape/);
  assert.equal(headers.Authorization, "test-key-not-real");
  console.log("ok   request is portrait-oriented and authenticated — landscape would fetch the wrong shape for every slide");
}

// --- Source selection: the largest rendition, not `src.large`. The mid-size
// --- renditions are narrower than the project's 1080px floor, so selecting
// --- `large` (as specified) would have failed Visual QC on every photo.
{
  calls.length = 0;
  mockPexels([{
    alt: "a shopper at a supermarket checkout",
    url: "https://www.pexels.com/photo/123/",
    photographer: "Some Photographer",
    src: {
      original: "https://images.pexels.com/photos/123/original.jpg",
      large2x: "https://images.pexels.com/photos/123/large2x.jpg",
      large: "https://images.pexels.com/photos/123/large.jpg",
      medium: "https://images.pexels.com/photos/123/medium.jpg",
    },
  }]);
  const hits = await pexelsSearch("einkaufen");
  restore();
  assert.equal(hits.length, 1);
  assert.match(hits[0].image, /original\.jpg$/, "must take the largest rendition available");
  assert.doesNotMatch(hits[0].image, /\/large\.jpg$|medium/, "the mid-size renditions are below the 1080px floor");
  assert.equal(hits[0].title, "a shopper at a supermarket checkout");
  assert.equal(hits[0].photographer, "Some Photographer");
  console.log("ok   picks the largest rendition — `src.large` as specified is narrower than the 1080px floor and would fail QC");
}

// --- Falls back through the size keys when the biggest is absent, rather
// --- than returning an entry with no usable image URL.
{
  calls.length = 0;
  mockPexels([
    { alt: "no usable src", url: "u", src: {} },
    { alt: "only large", url: "u2", src: { large: "https://images.pexels.com/photos/9/large.jpg" } },
  ]);
  const hits = await pexelsSearch("brot");
  restore();
  assert.equal(hits.length, 1, "an entry with no usable source must be dropped, not returned with a null image");
  assert.match(hits[0].image, /large\.jpg$/);
  console.log("ok   unusable entries are dropped and smaller renditions still serve as a last resort");
}

// --- Duplicate images collapse (the same photo can appear twice in results).
{
  calls.length = 0;
  const same = { src: { original: "https://images.pexels.com/photos/7/original.jpg" }, alt: "x", url: "u" };
  mockPexels([same, same, same]);
  const hits = await pexelsSearch("kasse");
  restore();
  assert.equal(hits.length, 1, "the same image must not be offered as several candidates");
  console.log("ok   duplicate results collapse to one candidate");
}

// --- A non-2xx answer throws with the real status, so 402/429/401 are
// --- distinguishable in the logs instead of all looking like "no results".
// --- This is exactly how the Exa outage was diagnosed.
{
  calls.length = 0;
  mockPexels([], { status: 429 });
  await assert.rejects(() => pexelsSearch("einkaufen"), /Pexels 429/, "the real status must surface");
  restore();

  mockPexels([], { status: 402 });
  await assert.rejects(() => pexelsSearch("einkaufen"), /Pexels 402/);
  restore();
  console.log("ok   a failing call reports its real status — quota and credit failures stay diagnosable");
}

delete process.env.PEXELS_KEY;
restore();
