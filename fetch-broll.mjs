// Pull the official announcement VIDEO for a feature, and cut the part that
// shows the interface.
//
//   node fetch-broll.mjs                 # every mapped feature
//   node fetch-broll.mjs broadcast-channel
//
// The reference videos this channel is measured against put real footage on
// screen — a screen recording of the actual app, not a drawing of it. A still
// screenshot is the weaker version of the same idea; when the platform itself
// published a launch clip, that clip is the real thing moving.
//
// Same discipline as fetch-screens.mjs and for the same reason: a video found
// on an official domain is not automatically a video OF the feature. Meta's
// newsroom hosts brand films, creator montages and unrelated product clips on
// the same pages. So this downloads CANDIDATES, records the page each came
// from, probes them for duration and dimensions, and marks every one
// unverified. Somebody looks before one is wired into a step.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const DIR = "public/broll";
const MANIFEST = `${DIR}/candidates.json`;
const env = loadEnv();
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const only = process.argv[2];

const TIKTOK = ["newsroom.tiktok.com", "support.tiktok.com", "business.tiktok.com"];
const META = ["about.instagram.com", "creators.instagram.com", "about.fb.com", "help.instagram.com"];

const WANTED = {
  "broadcast-channel": { q: "Instagram broadcast channels creators announcement video", domains: META },
  "trial-reels": { q: "Trial reels test content with non-followers video", domains: META },
  "add-yours": { q: "Instagram Add Yours sticker stories video", domains: META },
  collab: { q: "Instagram collab posts co-author video", domains: META },
  "tt-ai-dubbing": { q: "TikTok AI dubbing translate video announcement", domains: TIKTOK },
  "auto-translate": { q: "TikTok auto translation captions announcement", domains: TIKTOK },
  "tt-keywords": { q: "TikTok search keywords creators announcement", domains: TIKTOK },
  "view-jail": { q: "TikTok analytics views watch time creators video", domains: TIKTOK },
};

if (!KEY) { console.error("EXA_API_KEY تنظیم نشده است"); process.exit(1); }

const readJSON = (p, d) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d; } catch { return d; } };

/** Video URLs appearing in a page's own markup, on the platform's own hosts. */
function videoUrlsIn(html, allowHosts) {
  const urls = new Set();
  const patterns = [
    /<video[^>]+src=["']([^"']+\.mp4[^"']*)["']/gi,
    /<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/gi,
    /["'](https?:\/\/[^"']+\.mp4(?:\?[^"']*)?)["']/gi,
    /["']([^"']*\/video\/[^"']+\.mp4(?:\?[^"']*)?)["']/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) {
      let u = m[1];
      if (u.startsWith("//")) u = "https:" + u;
      if (!/^https?:/i.test(u)) continue;
      try {
        const host = new URL(u).hostname;
        // Accept the platform's own CDNs, which are not the page's own host.
        if (allowHosts.some((h) => host.endsWith(h)) || /(?:tiktokcdn|fbcdn|cdninstagram|akamaized)\./.test(host)) {
          urls.add(u);
        }
      } catch { /* not a usable URL */ }
    }
  }
  return [...urls];
}

/** Duration and dimensions, so a caller knows what it has without opening it. */
function probe(file) {
  try {
    const out = execFileSync("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height:format=duration",
      "-of", "json", file,
    ]).toString();
    const j = JSON.parse(out);
    const s = j.streams?.[0] || {};
    return {
      width: s.width || null,
      height: s.height || null,
      seconds: j.format?.duration ? Number(Number(j.format.duration).toFixed(2)) : null,
    };
  } catch {
    return null;
  }
}

mkdirSync(DIR, { recursive: true });
const manifest = readJSON(MANIFEST, []);
const ids = only ? [only] : Object.keys(WANTED);
let saved = 0;

for (const id of ids) {
  const spec = WANTED[id];
  if (!spec) { console.error(`—  ${id}: در فهرست نیست`); continue; }

  let pages = [];
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY },
      body: JSON.stringify({
        query: spec.q, numResults: 6, includeDomains: spec.domains,
        type: "auto", contents: { text: { maxCharacters: 100 } },
      }),
    });
    if (!res.ok) throw new Error("Exa " + res.status);
    pages = (await res.json()).results || [];
  } catch (e) {
    console.error(`✗  ${id}: جست‌وجو ناموفق — ${e.message}`);
    continue;
  }

  let n = 0;
  for (const page of pages) {
    if (n >= 2) break;
    let html = "";
    try {
      const r = await fetch(page.url, { headers: { "user-agent": "Mozilla/5.0" } });
      if (!r.ok) continue;
      html = await r.text();
    } catch { continue; }

    for (const url of videoUrlsIn(html, spec.domains)) {
      if (n >= 2) break;
      if (manifest.some((m) => m.url === url)) continue;
      const file = `${DIR}/${id}-${manifest.length + 1}.mp4`;
      try {
        const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        // An mp4 begins with a box-size word then "ftyp"; anything else is an
        // error page wearing an .mp4 name.
        if (buf.length < 4096 || buf.toString("latin1", 4, 8) !== "ftyp") {
          console.error(`   (رد شد: فایل ویدیو نبود — ${url.slice(0, 62)})`);
          continue;
        }
        writeFileSync(file, buf);
        const meta = probe(file);
        manifest.push({
          feature: id, file, url, page: page.url, pageTitle: page.title || "",
          ...(meta || {}), verified: false,
        });
        n++; saved++;
      } catch { /* next candidate */ }
    }
  }
  console.log(n ? `✓  ${id}: ${n} ویدیوی نامزد` : `—  ${id}: ۰ نامزد`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${saved} ویدیو ذخیره شد. هیچ‌کدام هنوز تأیید نشده‌اند — پیش از استفاده باید دیده شوند.`);
