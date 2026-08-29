// Real photographs for the news channel, from Wikimedia Commons.
//
// The obvious source — the lead image Exa returns with each article — is the
// publisher's own photo. BBC and Amal license those for their own pages, not for
// republication in someone else's video, and a copyright strike is exactly the
// thing that removes a channel. So the pictures come from Commons instead, where
// the licence permits reuse.
//
// Two rules hold this honest:
//   · Only openly-licensed files (CC BY, CC BY-SA, CC0, public domain).
//   · The picture illustrates the SUBJECT, never the event. A plane at an airport
//     next to a deportation story is B-roll; a photo presented as that flight
//     would be a claim we cannot support.
// Attribution-bearing licences carry the photographer's name on screen, because
// that is the condition the licence is given on.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CACHE = ".media-cache";
const UA = "GermanInsider/1.0 (Persian news video pipeline; contact via Telegram)";

// The videos carry no credit strip, and that is only compatible with material
// whose licence waives attribution — so this is the whole test, and a CC BY
// photo whose creator must be named is skipped however well it ranks.
const NO_CREDIT_NEEDED = /^(cc0|public domain|pd(-|\b)|no restrictions)/i;

// What to look for, per subject. Generic and current: buildings, aircraft,
// documents — never a query that would return an identifiable person in
// distress, which is neither ours to publish nor honest to put beside a story
// it does not depict.
const QUERIES = {
  // Tutorial cards: one real, openly licensed visual per action. The art key
  // comes from sceneArtPlan(), so an "add keywords" card cannot receive the
  // same generic camera picture as a "save" card.
  menu: ["smartphone app settings menu", "mobile phone settings screen"],
  wand: ["laptop artificial intelligence interface", "computer creative editing screen"],
  keywords: ["computer keyboard typing close up", "phone keyboard typing"],
  found: ["mobile phone search screen", "internet search on smartphone"],
  bookmark: ["bookmark book page close up", "save bookmark browser"],
  upload: ["smartphone filming video creator", "phone camera recording"],
  download: ["file download computer screen", "laptop download document"],
  chart: ["analytics dashboard laptop", "social media analytics screen"],
  camera: ["creator recording video smartphone", "smartphone camera filming"],
  text: ["phone text editing screen", "computer writing text"],
  comment: ["smartphone social media comments", "phone messaging screen"],
  collab: ["two creators filming smartphone", "people creating video together"],
  // `timeline` is claimed by the news beat further down, and the later key wins
  // in an object literal — so this one silently did nothing and an editing step
  // was illustrated with archive papers. Renamed to what it actually is.
  editcut: ["video editing timeline computer", "editing software screen"],
  deport: ["airport departure gate aircraft", "airliner taxiing runway Germany", "airport terminal Germany"],
  protest: ["protest banner demonstration street", "demonstration placards crowd Europe"],
  court: ["courtroom interior Germany", "Bundesverfassungsgericht Karlsruhe building", "court building Germany"],
  decree: ["passport documents desk", "residence permit document", "official form paperwork"],
  family: ["refugee accommodation building Germany", "asylum housing Germany"],
  timeline: ["calendar desk documents", "archive papers"],
  shield: ["police car Germany street", "Polizei vehicle Germany"],
  globe: ["Berlin skyline", "Germany flag Bundestag"],
};

const say = (...a) => process.env.NEWS_MEDIA_QUIET ? null : console.log(...a);

async function commonsSearch(query, limit = 30) {
  const u =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search" +
    "&gsrsearch=" + encodeURIComponent("filetype:bitmap " + query) +
    "&gsrlimit=" + limit + "&gsrnamespace=6" +
    "&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1400";
  const res = await fetch(u, { headers: { "user-agent": UA } });
  if (!res.ok) return [];
  const j = await res.json();
  return Object.values((j.query && j.query.pages) || {});
}

const meta = (p, k) => {
  const m = ((p.imageinfo || [])[0] || {}).extmetadata || {};
  return String((m[k] || {}).value || "").replace(/<[^>]*>/g, "").trim();
};

// deterministic pick, so re-rendering the same story gives the same picture
const hash = (s) => {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
  return h;
};

export async function photoFor(subject, seed = "") {
  const queries = QUERIES[subject] || QUERIES.globe;
  const q = queries[hash(seed + subject) % queries.length];

  let pages = [];
  try { pages = await commonsSearch(q); } catch { return null; }

  const usable = pages.filter((p) => {
    const ii = (p.imageinfo || [])[0];
    if (!ii || !ii.thumburl) return false;
    // The final video intentionally carries no source/credit strip. That is
    // compatible only with public-domain/CC0 material, so do not silently use
    // a CC BY photo whose creator must be credited.
    if (!NO_CREDIT_NEEDED.test(meta(p, "LicenseShortName"))) return false;
    // portrait crops of a wide photo lose the subject; the card is landscape
    return (ii.thumbwidth || 0) >= 900 && (ii.thumbwidth || 0) >= (ii.thumbheight || 0);
  });
  if (!usable.length) return null;

  const pick = usable[hash(seed + q) % usable.length];
  const ii = pick.imageinfo[0];
  const licence = meta(pick, "LicenseShortName");
  const author = meta(pick, "Artist").slice(0, 44);

  mkdirSync(CACHE, { recursive: true });
  const file = `${CACHE}/${hash(ii.thumburl).toString(36)}.jpg`;
  if (!existsSync(file)) {
    const r = await fetch(ii.thumburl, { headers: { "user-agent": UA } });
    if (!r.ok) return null;
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }

  return {
    file,
    dataURI: "data:image/jpeg;base64," + readFileSync(file).toString("base64"),
    licence,
    // "Photo: <author> / CC BY-SA 4.0" — omitted only where the licence waives it
    credit: NO_CREDIT_NEEDED.test(licence) ? "" : `${author || "Wikimedia Commons"} · ${licence}`,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(pick.title)}`,
  };
}

// Photographs on every card would read as a slideshow and bury the text. Two per
// bulletin — the hook and one body card — keeps the drawn style as the channel's
// look while grounding it in something real.
export async function photoPlan(subject, seed, count = 2) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < Math.max(4, count * 5); i++) {
    const p = await photoFor(subject, seed + ":" + i);
    if (p && !seen.has(p.file)) { seen.add(p.file); out.push(p); }
  }
  return out;
}
