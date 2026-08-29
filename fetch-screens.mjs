// Find the official image for a platform feature, from the platform's own site.
//
//   node fetch-screens.mjs                # fetch candidates for every mapped feature
//   node fetch-screens.mjs trial-reels    # just one
//
// A logo can be matched by name. A screenshot cannot — "Edits sound separation"
// once resolved to an Android promo frame with a person's face on it, which is a
// real image, officially published, and shows nothing to do with the feature. So
// this script only ever produces CANDIDATES: it downloads them, records where
// each came from, and marks it unverified. A person looks, and only then is one
// wired into a step.
//
// Candidates come from the platform's own newsroom, help centre or business
// site, because those publish their own interface and are the authoritative
// source for what a feature looks like.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv } from "./lib/telegram.mjs";
import { imageType } from "./lib/media-guard.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const DIR = "public/screens";
const MANIFEST = `${DIR}/candidates.json`;
const env = loadEnv();
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const only = process.argv[2];

const TIKTOK = ["newsroom.tiktok.com", "support.tiktok.com", "business.tiktok.com"];
const META = ["about.instagram.com", "creators.instagram.com", "help.instagram.com", "about.fb.com"];

// What to ask for, per feature. The query names the feature the way its own
// platform names it — that is what the official page is titled.
const WANTED = {
  "trial-reels": { q: "Trial reels test content with non-followers", domains: META },
  "tt-media-kit": { q: "TikTok Creator Marketplace media kit for creators", domains: TIKTOK },
  "replace-audio": { q: "Instagram replace audio on a published reel", domains: META },
  "reels-teleprompter": { q: "Instagram Reels teleprompter camera tool", domains: META },
  "broadcast-channel": { q: "Instagram broadcast channels for creators", domains: META },
  "tt-keywords": { q: "TikTok search keywords ranking for creators", domains: TIKTOK },
  "tt-ai-dubbing": { q: "TikTok AI dubbing translate your video", domains: TIKTOK },
  "auto-translate": { q: "TikTok auto translation captions creators", domains: TIKTOK },
  "add-yours": { q: "Instagram Add Yours sticker", domains: META },
  "collab": { q: "Instagram collab posts co-author", domains: META },
};

if (!KEY) { console.error("EXA_API_KEY تنظیم نشده است"); process.exit(1); }

const readJSON = (p, d) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d; } catch { return d; } };

async function candidates(spec) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: spec.q, numResults: 8, includeDomains: spec.domains,
      type: "auto", contents: { text: { maxCharacters: 200 } },
    }),
  });
  if (!res.ok) throw new Error("Exa " + res.status);
  const seen = new Set();
  return ((await res.json()).results || [])
    .filter((r) => r.image && !seen.has(r.image) && seen.add(r.image))
    .slice(0, 3);
}

mkdirSync(DIR, { recursive: true });
const manifest = readJSON(MANIFEST, {});
const ids = only ? [only] : Object.keys(WANTED);

for (const id of ids) {
  const spec = WANTED[id];
  if (!spec) { console.log(`—  ${id}: در فهرست نیست`); continue; }

  let hits = [];
  try { hits = await candidates(spec); }
  catch (e) { console.log(`!  ${id}: ${e.message}`); continue; }
  if (!hits.length) { console.log(`—  ${id}: هیچ تصویری در صفحات رسمی نبود`); continue; }

  manifest[id] = manifest[id] || [];
  let n = 0;
  for (const hit of hits) {
    const file = `${DIR}/${id}-${manifest[id].length + n + 1}.img`;
    try {
      const img = await fetch(hit.image);
      if (!img.ok) continue;
      writeFileSync(file, Buffer.from(await img.arrayBuffer()));
    } catch { continue; }

    const type = imageType(file);
    if (!type) { console.log(`   (رد شد: فایل تصویر نبود — ${hit.image.slice(0, 50)})`); continue; }

    const named = file.replace(/\.img$/, `.${type === "jpeg" ? "jpg" : type}`);
    writeFileSync(named, readFileSync(file));
    manifest[id].push({
      file: named,
      page: hit.url,
      pageTitle: String(hit.title || "").slice(0, 120),
      // Never assume the picture shows the feature. A human confirms.
      verified: false,
    });
    n++;
  }
  console.log(`${n ? "✓" : "—"}  ${id}: ${n} نامزد`);
  await new Promise((r) => setTimeout(r, 500));
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
const total = Object.values(manifest).flat().length;
console.log(`\n${total} نامزد ذخیره شد. هیچ‌کدام هنوز تأیید نشده‌اند.`);
