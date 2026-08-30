// A light demand probe, for judging a candidate rather than researching a topic.
//
// The gate refuses to assert audience interest that was never observed, which is
// right — and it meant every curated topic failed, because nobody had ever
// measured demand for them. The answer is to measure it, not to lower the bar.
//
// demand.mjs walks the alphabet and returns hundreds of phrases; that is the
// tool for exploring a subject. This asks a handful of question-shaped probes,
// enough to answer "do people ask about this at all" for each candidate in a
// list without making six hundred requests per run.
//
// Autocomplete is free and needs no key: every suggestion is a query enough
// people typed that the engine now offers it.
const UA = { "user-agent": "GapMedia-Research/1.0" };

const PREFIX_FA = ["چطور", "چگونه", "چرا", "آیا"];
const PREFIX_EN = ["how to", "what is", "why"];

async function suggest(query, youtube) {
  const url = "https://suggestqueries.google.com/complete/search?client=firefox"
    + (youtube ? "&ds=yt" : "") + "&q=" + encodeURIComponent(query);
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return [];
    const body = JSON.parse(await res.text());
    return Array.isArray(body[1]) ? body[1] : [];
  } catch { return []; }
}

// Returns the real phrases people type around this subject, marked with whether
// both engines suggest them — which is stronger evidence than one surface.
export async function probeDemand(seed, { english = false, cap = 24 } = {}) {
  const s = String(seed || "").trim();
  if (!s) return [];
  const prefixes = english ? PREFIX_EN : PREFIX_FA;
  const probes = [s, ...prefixes.map((p) => `${p} ${s}`)];

  const found = new Map();
  for (const probe of probes) {
    for (const [phrase, where] of [
      ...(await suggest(probe, false)).map((p) => [p, "google"]),
      ...(await suggest(probe, true)).map((p) => [p, "youtube"]),
    ]) {
      const key = phrase.toLowerCase().trim();
      if (!key || key === s.toLowerCase()) continue;
      const row = found.get(key) || { phrase, google: false, youtube: false };
      row[where] = true;
      found.set(key, row);
    }
  }
  return [...found.values()]
    .map((r) => ({ phrase: r.phrase, crossPlatform: r.google && r.youtube }))
    .slice(0, cap);
}

// The subject worth probing, taken from a curated topic. A whole hook sentence
// returns nothing — autocomplete answers short subjects, not paragraphs.
export function seedFor(item) {
  const raw = String(item.seed || item.feature || item.id || "").replace(/-/g, " ");
  return raw.trim().slice(0, 40);
}
