// Builds the daily programme: three topics (TikTok, Instagram, useful AI),
// with the AI topic packaged separately for TikTok and Instagram.
// Rendering + music mux is done by daily-render.sh (kept separate so renders
// can run in the background). Usage: node daily.mjs [YYYY-MM-DD]
import { mkdirSync, writeFileSync } from "node:fs";
import { buildHTML } from "./lib/build.mjs";
import { buildInkHTML } from "./lib/build-ink.mjs";
import { buildNeonHTML } from "./lib/build-neon.mjs";
import { packsForDate, dailyDeliveriesForDate } from "./lib/content.mjs";

const arg = process.argv[2];
const date = arg ? new Date(arg + "T12:00:00") : new Date();
const iso = date.toISOString().slice(0, 10);

const sel = packsForDate(date);
const deliveries = dailyDeliveriesForDate(date);
const outDir = `compositions/daily/${iso}`;
mkdirSync(outDir, { recursive: true });

const manifest = [];
for (const delivery of deliveries) {
  const { slot, pack } = delivery;
  const file = `${outDir}/${slot}.html`;
  writeFileSync(file, (process.env.STYLE === "neon" ? buildNeonHTML : process.env.STYLE === "legacy" ? buildHTML : buildInkHTML)(pack));
  manifest.push({ slot, channel: delivery.deliveryChannel, topicLane: delivery.sourceCategory, mirrorOf: delivery.mirrorOf, packId: pack.id, file, title: pack.title });
  console.log(`built ${slot.padEnd(12)} → ${file}   (${pack.id})`);
}
writeFileSync(`${outDir}/manifest.json`, JSON.stringify({ date: iso, dayIndex: sel.dayIndex, videos: manifest }, null, 2));
console.log(`\nDATE=${iso}  DAYINDEX=${sel.dayIndex}  DIR=${outDir}`);
