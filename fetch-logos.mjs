// Fetch the real logo for each app we teach, once, into public/logos/.
//
//   node fetch-logos.mjs           # resolve anything not yet cached
//   node fetch-logos.mjs --recheck # re-resolve everything
//
// Why this is not done at render time: renders must be deterministic and work
// offline, and a network lookup in the middle of a render is a lookup nobody
// reviews. This writes files and a manifest; the renderer only reads them.
//
// Why the matching is strict to the point of refusing most brands: a loose
// search returns the 7-Eleven logo for ElevenLabs, Undertale for Suno, and
// Adobe AIR for Adobe Podcast. It says so with complete confidence. A wrong
// logo shown as the real one is worse than an honest drawing, so anything that
// is not an exact name match is left for the drawn mark to handle.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const DIR = "public/logos";
const MANIFEST = "public/logos/manifest.json";
const UA = { "user-agent": "GapMedia/1.0 (video pipeline; logo lookup)" };
const recheck = process.argv.includes("--recheck");

// The apps the tutorials name. The string is the product's real name, because
// that is what has to match.
const BRANDS = [
  "Canva", "CapCut", "Adobe Podcast", "Suno", "ElevenLabs", "Photopea",
  "Pexels", "Descript", "Upscayl", "Google Trends", "Kling AI", "remove.bg",
  "Ideogram", "Cleanup.pictures",
];

const GENERIC = /\b(logo|icon|wordmark|vector|official|inc|app|svg|png|black|white|colou?r|new|old|20[0-9]{2})\b/g;
const norm = (s) => String(s).toLowerCase().replace(/^file:/, "").replace(/\.[a-z0-9]+$/, "")
  .replace(/[^a-z0-9]+/g, " ").replace(GENERIC, " ").replace(/\s+/g, " ").trim();

// A historical version is a real logo, but not the current one, and the rule
// asks for imagery as current as it can be.
const isDated = (title) => /\((?:19|20)\d\d\s*[-–]\s*(?:19|20)?\d\d\)|\bold\b|\bformer\b/i.test(title);

const OPEN = /^(cc0|public domain|pd|cc[ -]?by)/i;

async function resolve(brand) {
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search"
    + "&gsrsearch=" + encodeURIComponent("intitle:logo " + brand)
    + "&gsrlimit=25&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800";
  // A failed request and a genuine "no such logo" are different facts, and
  // reporting them the same way is how twelve brands looked unresolvable when
  // Commons was simply rate-limiting a burst of lookups.
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url, { headers: UA });
      if (res.ok) break;
    } catch (e) {
      res = { ok: false, status: e.message };
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  if (!res || !res.ok) throw new Error(`جستجو ناموفق (${res ? res.status : "بدون پاسخ"})`);
  const pages = Object.values(((await res.json()).query || {}).pages || {});
  for (const p of pages) {
    const ii = (p.imageinfo || [])[0];
    if (!ii || !ii.thumburl) continue;
    const licence = String((((ii.extmetadata || {}).LicenseShortName || {}).value) || "");
    if (!OPEN.test(licence)) continue;
    if (isDated(p.title)) continue;
    if (norm(p.title) !== norm(brand)) continue;
    return { title: p.title.replace(/^File:/, ""), licence, thumb: ii.thumburl };
  }
  return null;
}

mkdirSync(DIR, { recursive: true });
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

let added = 0, skipped = 0;
for (const brand of BRANDS) {
  const key = brand.toLowerCase();
  if (!recheck && manifest[key]) { skipped++; continue; }

  let hit;
  try { hit = await resolve(brand); }
  catch (e) { console.log(`!  ${brand}: ${e.message} — دوباره اجرا کنید`); continue; }
  if (!hit) {
    console.log(`—  ${brand}: هیچ لوگوی واقعیِ مطمئنی پیدا نشد (نقاشی فعلی می‌ماند)`);
    continue;
  }
  await new Promise((r) => setTimeout(r, 400));   // be a polite API client
  // Splitting the whole URL on "." takes the extension from the query string and
  // produces names like "canva.orgutmcampaignimageinfo…". Read the path only.
  let ext = "png";
  try { ext = (new URL(hit.thumb).pathname.split(".").pop() || "png").toLowerCase(); } catch { /* keep png */ }
  if (!/^(png|jpe?g|webp|gif)$/.test(ext)) ext = "png";
  const file = `${DIR}/${key.replace(/[^a-z0-9]+/g, "-")}.${ext}`;
  try {
    // The download is rate-limited separately from the search, and backing off
    // only on the search left three brands looking unresolvable when they were
    // simply asked for too fast.
    let img;
    for (let attempt = 0; attempt < 4; attempt++) {
      img = await fetch(hit.thumb, { headers: UA });
      if (img.ok) break;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
    if (!img.ok) throw new Error("HTTP " + img.status);
    writeFileSync(file, Buffer.from(await img.arrayBuffer()));
  } catch (e) {
    console.log(`✗  ${brand}: دانلود نشد — ${e.message}`);
    continue;
  }
  manifest[key] = { file, source: hit.title, licence: hit.licence, fetchedAt: new Date().toISOString().slice(0, 10) };
  added++;
  console.log(`✓  ${brand} → ${hit.title}  [${hit.licence}]`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`\nلوگوی واقعی: ${Object.keys(manifest).length} از ${BRANDS.length}` + (skipped ? `  (${skipped} از قبل موجود)` : ""));
