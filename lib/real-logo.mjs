// The real logo for an app, when we have one.
//
// Priority, as the channel's imagery rule sets it out:
//   1. the real logo, from an openly licensed source, verified to be this exact
//      product — fetched once by fetch-logos.mjs into public/logos/
//   2. the drawn mark, which stands in as a conceptual representation
//
// Nothing is resolved over the network here. The manifest is written by a
// separate step that a person can review, because a logo lookup is exactly the
// kind of thing that returns the 7-Eleven mark for ElevenLabs and says so with
// complete confidence.
import { existsSync, readFileSync } from "node:fs";
import { imageType } from "./media-guard.mjs";

const MANIFEST = "public/logos/manifest.json";

const load = () => {
  try { return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {}; }
  catch { return {}; }
};

let cache = null;
const manifest = () => (cache ||= load());

// Matches on the product name the tutorial uses, so "Kling AI" and "kling ai"
// both find the same file.
const keyOf = (name) => String(name || "").toLowerCase().trim();

// Returns a data URI for the real logo, or "" when there isn't one.
export function realLogoData(name) {
  const entry = manifest()[keyOf(name)];
  if (!entry || !entry.file || !existsSync(entry.file)) return "";
  const type = imageType(entry.file);
  if (!type) return "";
  return `data:image/${type};base64,${readFileSync(entry.file).toString("base64")}`;
}

export const hasRealLogo = (name) => realLogoData(name) !== "";

// What the manifest knows, for reporting.
export const logoManifest = () => ({ ...manifest() });
