// Real, relevant lifestyle photos for the German A1 lesson series — a
// separate search shape from lib/auto-image.mjs's findRealImage(), which is
// tuned for app/product screenshots ("official screenshot OR interface OR
// product page OR press photo"). A vocabulary word like "die Mutter" or
// "Hallo" needs a real photo of the actual thing (a mother, people
// greeting), not a product page, so the search query and the relevance
// check below are written for that instead — same mechanical bar (real
// downloaded file, 1080px/700k-pixel floor) and the same LLM relevance gate
// (exaSearch/isRelevant, reused from lib/auto-image.mjs) as everywhere else
// real images are sourced in this project.
//
// Unlike rescuePackPhotos() (one shared photo for a whole pack), each
// vocabulary item gets its OWN search and its OWN photo — four different
// words need four different pictures, not one screenshot cropped four ways.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { imageType, imageSize } from "./media-guard.mjs";
import { exaSearch, isRelevant } from "./auto-image.mjs";

async function attempt(searchQuery, relevanceTopic, label) {
  let hits = [];
  try {
    hits = await exaSearch(searchQuery);
  } catch {
    return null;
  }
  mkdirSync("public/user-media", { recursive: true });
  for (const hit of hits.slice(0, 6)) {
    let bytes;
    try {
      const res = await fetch(hit.image);
      if (!res.ok) continue;
      bytes = Buffer.from(await res.arrayBuffer());
    } catch { continue; }

    const id = createHash("sha256").update(hit.image).digest("hex").slice(0, 12);
    const rawFile = `public/user-media/lesson-${id}.img`;
    writeFileSync(rawFile, bytes);
    const type = imageType(rawFile);
    if (!type) continue;
    const named = rawFile.replace(/\.img$/, `.${type === "jpeg" ? "jpg" : type}`);
    writeFileSync(named, bytes);

    const size = imageSize(named);
    if (!size || Math.max(size.width, size.height) < 1080 || size.width * size.height < 700000) continue;

    const candidate = { title: String(hit.title || "").slice(0, 160), url: hit.url, snippet: String(hit.text || "").slice(0, 260) };
    let relevant = false;
    try { relevant = await isRelevant(relevanceTopic, [label], candidate); } catch { relevant = false; }
    if (!relevant) continue;

    return { photo: named, sourceUrl: hit.url, sourceType: "labelled-explainer", alt: candidate.title || label };
  }
  return null;
}

/**
 * query: a short English/German search phrase for the concept itself
 *   (e.g. "mother and child", "two people shaking hands greeting").
 * label: the Persian meaning, used only for the relevance check's prompt.
 *
 * Tries the specific query first, then a broader version of the same
 * phrase (its first three words) — confirmed live 2026-09-08: a four/five
 * word query ("friends waving goodbye") can come back empty from Exa's top
 * results even though shorter, more common phrasings of the same idea find
 * plenty of real stock-style photos. Never invents or loosens the
 * mechanical (1080px/700k-pixel) or relevance bar — only widens what is
 * searched for.
 */
export async function findLessonImage(query, label) {
  if (!process.env.EXA_API_KEY || (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && !process.env.GROQ_API_KEY)) return null;
  const found = await attempt(`${query} real photo`, query, label);
  if (found) return found;
  const broad = query.split(/\s+/).slice(0, 3).join(" ");
  if (broad && broad !== query) {
    const foundBroad = await attempt(`${broad} photo`, broad, label);
    if (foundBroad) return foundBroad;
  }
  return null;
}
