// Saves a real screenshot the channel owner sends as a Telegram photo
// message (caption = the feature id) so the next render of that feature
// uses it — the other half of the route PROJECT_RULES §14-د/14-ه already
// calls for when no official source has the image: ask the owner directly,
// with the exact id to reply with, instead of stopping at "no real photo".
//
//   node save-user-photo.mjs <feature-id> <telegram-file-id>
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage, downloadFile } from "./lib/telegram.mjs";
import { imageType, imageSize } from "./lib/media-guard.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const DIR = "public/user-photos";
const [rawId, fileId] = process.argv.slice(2);
const env = loadEnv();
const tg = telegramConfig(env);
const say = async (text) => { if (tg.enabled) await sendMessage({ token: tg.token, chatId: tg.chatId, text }); console.log(text); };

// The caption is free text typed on a phone — keep only what a filename
// needs and can safely hold, same character class the "تأیید تصویر" id
// pattern in lib/commands.mjs already requires.
const idFromCaption = String(rawId || "").trim().toLowerCase().match(/[a-z0-9-]+/)?.[0] || "";

// Owner report 2026-09-10: typing the exact feature id by hand on a phone
// keyboard is real friction, and it's unnecessary the moment there is only
// one pending tutorial draft to attach a photo to — content-draft.mjs's own
// DRAFT file already names it. A caption still wins when given (so a second,
// unrelated draft can be targeted on purpose); this is a fallback, not a
// replacement for the size/real-photo checks below, which still apply.
function currentDraftFeatureId() {
  try {
    const draft = JSON.parse(readFileSync(".content-draft.json", "utf8"));
    return String(draft.featureId || "").trim().toLowerCase().match(/[a-z0-9-]+/)?.[0] || "";
  } catch { return ""; }
}

const id = idFromCaption || currentDraftFeatureId();

if (!id || !fileId) {
  await say('این عکس را به کدام موضوع مربوط کنم؟ کپشن عکس را شناسهٔ همان قابلیت بگذارید — مثلاً «tt-schedule» — یا اول یک پیش‌نویس فعال بسازید.');
  process.exit(0);
}
if (!tg.enabled) { console.error("Telegram not configured."); process.exit(1); }

let bytes, filePath;
try {
  ({ bytes, filePath } = await downloadFile({ token: tg.token, fileId }));
} catch (e) {
  await say(`✗ دریافت عکس از تلگرام ناموفق بود: ${e.message}`);
  process.exit(0);
}

mkdirSync(DIR, { recursive: true });
const rawExt = (filePath.match(/\.(\w+)$/)?.[1] || "jpg").toLowerCase();
const probe = `${DIR}/.probe-${id}-${Date.now()}.${rawExt}`;
writeFileSync(probe, bytes);

const type = imageType(probe);
if (!type) {
  unlinkSync(probe);
  await say(`✗ فایلی که فرستادی عکس واقعی نبود — «${id}» همچنان نیاز به اسکرین‌شات دارد.`);
  process.exit(0);
}

const size = imageSize(probe);
// Same floor every other real asset in this project is held to
// (lib/visual-proof.mjs / PROJECT_RULES §42): long edge ≥1080px, area
// ≥700,000px. Telling the owner exactly why a real screenshot was still
// rejected is what makes this route usable from a phone on the first try.
if (!size || Math.max(size.width, size.height) < 1080 || size.width * size.height < 700000) {
  unlinkSync(probe);
  await say(
    `✗ عکس «${id}» خیلی کوچک است` +
    (size ? ` (${size.width}×${size.height})` : "") +
    ` — ضلع بلند باید حداقل ۱۰۸۰ پیکسل باشد. اسکرین‌شات کامل صفحه (بدون کراپ یا زوم) را دوباره بفرست.`,
  );
  process.exit(0);
}

const ext = type === "jpeg" ? "jpg" : type;
const dest = `${DIR}/${id}.${ext}`;
// One photo per id: a fresh submission replaces the old one rather than
// leaving a stale ${id}.png behind a new ${id}.jpg for later code to
// have to choose between (same rule approve-screen.mjs already applies).
for (const e of ["jpg", "png", "gif", "webp"]) {
  const stale = `${DIR}/${id}.${e}`;
  if (stale !== dest && existsSync(stale)) unlinkSync(stale);
}
writeFileSync(dest, bytes);
unlinkSync(probe);

await say(`✅ عکس «${id}» ذخیره شد (${size.width}×${size.height}) — رندر بعدی همین موضوع از آن استفاده می‌کند.`);
