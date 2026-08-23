// Builds the 3 daily 1-minute compositions (TikTok / Instagram / social) for a
// given date and writes them under compositions/daily/<YYYY-MM-DD>/.
// Rendering + music mux is done by daily-render.sh (kept separate so renders
// can run in the background). Usage: node daily.mjs [YYYY-MM-DD]
import { mkdirSync, writeFileSync } from "node:fs";
import { buildHTML } from "./lib/build.mjs";
import { buildInkHTML } from "./lib/build-ink.mjs";
import { buildNeonHTML } from "./lib/build-neon.mjs";
import { packsForDate, CATEGORIES } from "./lib/content.mjs";

const arg = process.argv[2];
const date = arg ? new Date(arg + "T12:00:00") : new Date();
const iso = date.toISOString().slice(0, 10);

const sel = packsForDate(date);
const outDir = `compositions/daily/${iso}`;
mkdirSync(outDir, { recursive: true });

const manifest = [];
for (const platform of CATEGORIES) {
  const pack = sel[platform];
  const file = `${outDir}/${platform}.html`;
  writeFileSync(file, (process.env.STYLE === "neon" ? buildNeonHTML : process.env.STYLE === "legacy" ? buildHTML : buildInkHTML)(pack));
  manifest.push({ platform, packId: pack.id, file, title: pack.title });
  console.log(`built ${platform.padEnd(9)} → ${file}   (${pack.id})`);
}
writeFileSync(`${outDir}/manifest.json`, JSON.stringify({ date: iso, dayIndex: sel.dayIndex, videos: manifest }, null, 2));
console.log(`\nDATE=${iso}  DAYINDEX=${sel.dayIndex}  DIR=${outDir}`);
