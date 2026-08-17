// One command for the AfghanFollower daily pipeline: builds + renders + adds
// music for the day's 3 videos (TikTok / Instagram / social).
// Usage:
//   node daily-render.mjs              # today, 1080x1920
//   node daily-render.mjs 2026-08-20   # a specific date
//   node daily-render.mjs --4k         # today, 2160x3840
// This script self-locates the project dir, so a scheduler can call it directly.
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { buildHTML } from "./lib/build.mjs";
import { packsForDate, CATEGORIES } from "./lib/content.mjs";
import { loadEnv, telegramConfig, sendVideo } from "./lib/telegram.mjs";

const projectDir = dirname(fileURLToPath(import.meta.url));
process.chdir(projectDir);

const args = process.argv.slice(2);
const is4k = args.includes("--4k");
const noTelegram = args.includes("--no-telegram");
const tg = noTelegram ? { enabled: false } : telegramConfig(loadEnv());
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const date = dateArg ? new Date(dateArg + "T12:00:00") : new Date();
const iso = date.toISOString().slice(0, 10);

const HF = "npx --yes hyperframes@0.7.109";
const resFlag = is4k ? "--resolution portrait-4k" : "";

const sel = packsForDate(date);
const compDir = `compositions/daily/${iso}`;
const outDir = `renders/daily/${iso}`;
mkdirSync(compDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const results = [];
for (const platform of CATEGORIES) {
  const pack = sel[platform];
  const comp = `${compDir}/${platform}.html`;
  writeFileSync(comp, buildHTML(pack));
  const music = existsSync(pack.music) ? pack.music : "music/bed-60s.m4a";

  const silent = `${outDir}/${platform}-silent.mp4`;
  const final = `${outDir}/afghanfollower-${platform}-${iso}.mp4`;
  console.log(`\n=== ${platform} (${pack.id}) — ${is4k ? "4K" : "1080p"} — ${music} ===`);
  execSync(`${HF} render -c "${comp}" --quality high --fps 30 ${resFlag} --skill=faceless-explainer -o "${silent}"`, { stdio: "inherit" });
  execSync(`ffmpeg -y -i "${silent}" -i "${music}" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${final}"`, { stdio: "inherit" });

  let sent = false;
  if (tg.enabled) {
    try {
      await sendVideo({ token: tg.token, chatId: tg.chatId, file: final, caption: pack.tgTitle });
      console.log(`   ✈ sent to Telegram`);
      sent = true;
    } catch (e) {
      console.error(`   ✗ Telegram send failed: ${e.message}`);
    }
  }
  results.push({ platform, packId: pack.id, file: resolve(final), telegram: sent });
}

if (!tg.enabled && !noTelegram) {
  console.log("\nℹ Telegram not configured — videos saved locally only. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env to auto-send.");
}

writeFileSync(`${outDir}/manifest.json`, JSON.stringify({ date: iso, dayIndex: sel.dayIndex, resolution: is4k ? "2160x3840" : "1080x1920", videos: results }, null, 2));
console.log(`\n✅ ${iso}: ${results.length} videos ready in ${outDir}\n` + results.map((r) => "   " + r.file).join("\n"));
