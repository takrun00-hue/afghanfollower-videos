// Marks one fetch-screens.mjs candidate as verified — the human-approval
// half of "a person looks, and only then is one wired into a step."
// Nothing here decides *whether* a picture is right; a person already did
// that by looking at the photo Telegram sent and choosing this one number.
//
//   node approve-screen.mjs "تأیید تصویر trial-reels 2"
//   node approve-screen.mjs trial-reels 2
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const MANIFEST = "public/screens/candidates.json";
const env = loadEnv();
const tg = telegramConfig(env);
const say = async (text) => { if (tg.enabled) await sendMessage({ token: tg.token, chatId: tg.chatId, text }); console.log(text); };

const raw = process.argv.slice(2).join(" ").trim();
const match = raw.match(/(?:تایید|تأیید)?\s*تصویر\s+([a-z0-9-]+)\s+(\d+)/i) || raw.match(/^([a-z0-9-]+)\s+(\d+)$/i);
if (!match) {
  console.error('usage: node approve-screen.mjs "تأیید تصویر <id> <شماره>"');
  process.exit(1);
}
const [, id, numStr] = match;
const num = Number(numStr);

if (!existsSync(MANIFEST)) { await say("هیچ نامزد تصویری هنوز واکشی نشده است."); process.exit(0); }
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const list = manifest[id];
const entry = list?.[num - 1];
if (!entry) { await say(`تصویر شمارهٔ ${num} برای «${id}» پیدا نشد.`); process.exit(0); }

// Only one verified candidate per feature — approving a new one replaces
// the old choice instead of leaving two "true" entries for later code to
// have to pick between.
for (const e of list) e.verified = false;
entry.verified = true;
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

await say(`✅ تصویر ${num} برای «${id}» تأیید شد و از رندر بعدی (محلی یا ابری) استفاده می‌شود.`);
