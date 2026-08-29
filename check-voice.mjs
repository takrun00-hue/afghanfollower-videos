// Confirm the MiniMax voice is actually usable before a render depends on it.
//
//   node check-voice.mjs
//
// Renders started from Telegram run with REQUIRE_VOICE=on, which is correct: a
// video asked for with narration must never quietly arrive silent. The cost is
// that a bad key fails the whole run several minutes in. This checks the same
// path in a few seconds, and it checks the file too — this project's .env has
// been corrupted before by a PowerShell append writing UTF-16 into a UTF-8 file,
// which makes a perfectly correct key unreadable.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { console.log(`  ✗ ${m}`); return false; };

console.log("بررسی صدای MiniMax\n");

// ---- 1. the file itself ----------------------------------------------------
if (!existsSync(".env")) {
  console.log(bad(".env وجود ندارد") && "");
  process.exit(1);
}
const raw = readFileSync(".env");
if (raw[0] === 0xff || raw[0] === 0xfe || (raw[0] === 0 && raw[1] !== 0)) {
  bad(".env با کدگذاری UTF-16 ذخیره شده — Node آن را نمی‌خواند");
  console.log("     با این دستور درستش کنید:");
  console.log("     node -e \"const f=require('fs');f.writeFileSync('.env',f.readFileSync('.env','utf16le'),'utf8')\"");
  process.exit(1);
}
if (raw.includes(0)) {
  bad(".env بایت صفر دارد — احتمالاً بخشی UTF-16 نوشته شده");
  process.exit(1);
}
ok("کدگذاری .env سالم است");

// ---- 2. the values ---------------------------------------------------------
const env = loadEnv();
const key = env.MINIMAX_API_KEY || "";
const voice = env.MINIMAX_VOICE_ID || "";

if (!key) { bad("MINIMAX_API_KEY تنظیم نشده"); process.exit(1); }
// A Persian placeholder once ended up here because a copy-pasteable command
// contained one. A key that is not ASCII is not a key.
if (/[^\x20-\x7e]/.test(key)) { bad("MINIMAX_API_KEY کاراکتر غیرانگلیسی دارد — احتمالاً متن راهنما به‌جای کلید کپی شده"); process.exit(1); }
ok(`MINIMAX_API_KEY موجود است (${key.length} کاراکتر)`);

if (!voice) {
  bad("MINIMAX_VOICE_ID تنظیم نشده");
  console.log("     بعد از گذاشتن کلید، صداهای موجود را ببینید:  node music/minimax-voices.mjs");
} else ok(`MINIMAX_VOICE_ID: ${voice}`);

// ---- 3. the real call ------------------------------------------------------
if (!voice) process.exit(1);

console.log("\nیک جملهٔ کوتاه فارسی می‌فرستم…");
const res = await fetch(process.env.MINIMAX_TTS_ENDPOINT || "https://api.minimax.io/v1/t2a_v2", {
  method: "POST",
  headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
  body: JSON.stringify({
    model: process.env.MINIMAX_TTS_MODEL || "speech-2.8-hd",
    text: "سلام، این یک آزمایش صدا است.",
    stream: false,
    language_boost: "Persian",
    output_format: "hex",
    voice_setting: { voice_id: voice, speed: 1.1, vol: 1, pitch: 0 },
    audio_setting: { sample_rate: 44100, bitrate: 128000, format: "mp3", channel: 1 },
  }),
}).catch((e) => ({ ok: false, statusText: e.message }));

const data = await (res.json?.().catch(() => ({})) ?? {});
if (!res.ok || data?.base_resp?.status_code !== 0 || !data?.data?.audio) {
  bad(`سرویس جواب نداد: ${data?.base_resp?.status_msg || res.statusText || "خطای ناشناخته"}`);
  console.log("\n  اگر پیام دربارهٔ اعتبار یا مجوز است، کلید درست است ولی حساب شارژ/دسترسی ندارد.");
  process.exit(1);
}

const bytes = data.data.audio.length / 2;
ok(`صدا ساخته شد (${(bytes / 1024).toFixed(0)} کیلوبایت)`);
console.log("\nصدا آماده است. رندر با VOICE=on حالا صدا خواهد داشت.");
