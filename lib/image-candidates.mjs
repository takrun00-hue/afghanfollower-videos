// One place where a candidate image from ANY free stock provider is turned
// into a usable slide photo — or refused.
//
// Extracted when Pixabay joined Pexels (owner directive 2026-09-13, "all
// free APIs"): both providers return a list of {image, title, url}, and both
// then need the identical treatment — download, verify it is really an image,
// measure it against the project-wide 1080px/700k-pixel floor, and put it
// through the same LLM relevance judgement every other image source passes.
// Written once so a second provider cannot quietly ship with a weaker bar
// than the first.
//
// "Real photograph" is necessary, not sufficient: a stock library will
// happily return something only loosely associated with the search words,
// and an irrelevant real photo is still the «تصویر نامرتبط» PROJECT_RULES.md
// rule 41 forbids.
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { imageType, imageSize } from "./media-guard.mjs";
import { isRelevant } from "./auto-image.mjs";

const FETCH_TIMEOUT_MS = 20_000;
export const withTimeout = (init = {}, ms = FETCH_TIMEOUT_MS) => ({ ...init, signal: AbortSignal.timeout(ms) });

const MIN_LONG_SIDE = 1080;
const MIN_AREA = 700000;

/**
 * Download and verify candidates in order; return the first that passes
 * everything, or null.
 *
 * @param {Array<{image:string,title?:string,url?:string,credit?:string}>} hits
 * @param {{prefix:string, query:string, label:string, provider:string}} ctx
 * @returns {Promise<{photo:string, sourceUrl:string, sourceType:"labelled-explainer", alt:string}|null>}
 */
export async function firstVerifiedCandidate(hits, { prefix, query, label, provider }) {
  if (!hits?.length) return null;
  mkdirSync("public/user-media", { recursive: true });

  for (const hit of hits) {
    if (!hit?.image) continue;
    let bytes;
    try {
      const res = await fetch(hit.image, withTimeout());
      if (!res.ok) continue;
      bytes = Buffer.from(await res.arrayBuffer());
    } catch { continue; }

    const id = createHash("sha256").update(hit.image).digest("hex").slice(0, 12);
    const raw = `public/user-media/${prefix}-${id}.img`;
    writeFileSync(raw, bytes);
    const type = imageType(raw);
    if (!type) continue;
    const named = raw.replace(/\.img$/, `.${type === "jpeg" ? "jpg" : type}`);
    writeFileSync(named, bytes);

    const size = imageSize(named);
    if (!size || Math.max(size.width, size.height) < MIN_LONG_SIDE || size.width * size.height < MIN_AREA) continue;

    let relevant = false;
    try {
      relevant = await isRelevant(query, [label].filter(Boolean), {
        title: hit.title || "",
        url: hit.url || "",
        snippet: hit.title || "",
      });
    } catch { relevant = false; }
    if (!relevant) continue;

    console.error(`   ℹ ${provider}: «${query}» → ${named}${hit.credit ? ` (photo: ${hit.credit})` : ""}`);
    return { photo: named, sourceUrl: hit.url || "", sourceType: "labelled-explainer", alt: hit.title || label };
  }
  return null;
}

/** Collapse duplicate image URLs and drop entries with no usable URL. */
export function dedupe(entries) {
  const seen = new Set();
  return entries.filter((e) => e?.image && !seen.has(e.image) && seen.add(e.image));
}
