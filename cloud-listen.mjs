// Cloud command listener.
// GitHub Actions cannot hold a socket open, so instead of a long-running bot we
// poll Telegram on a schedule: read any new messages, act on the newest command,
// and remember the last update id so the same order never runs twice.
//
// Prints the chosen action for the workflow to consume, e.g.  ACTION=all
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage, getUpdates } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const STATE = ".telegram-offset";
const tg = telegramConfig(loadEnv());
if (!tg.enabled) { console.log("ACTION=none"); process.exit(0); }

const stored = existsSync(STATE) ? Number(readFileSync(STATE, "utf8").trim()) || 0 : 0;

// timeout=0 → return immediately; a scheduled job must not sit and wait
const updates = await getUpdates({ token: tg.token, offset: stored ? stored + 1 : 0, timeout: 0 });

let action = "none", label = "", highest = stored;
const norm = (t) => (t || "").trim().replace(/^\//, "").replace(/‌/g, " ").toLowerCase();

for (const u of updates) {
  highest = Math.max(highest, u.update_id);
  const msg = u.message || u.channel_post;
  if (!msg || String(msg.chat.id) !== String(tg.chatId) || !msg.text) continue;
  const c = norm(msg.text);

  if (c.startsWith("تیک تاک") || c.startsWith("تیکتاک") || c.startsWith("tiktok")) { action = "tiktok"; label = "تیک‌تاک"; }
  else if (c.startsWith("انستا") || c.startsWith("اینستا") || c.startsWith("insta")) { action = "instagram"; label = "اینستاگرام"; }
  else if (c.startsWith("ابزار") || c.startsWith("tool")) { action = "tools"; label = "ابزارها"; }
  else if (c.startsWith("بساز") || c.startsWith("make") || c.startsWith("ساخت")) { action = "all"; label = "هر ۳ ویدیو"; }
  else if (c.startsWith("خبر") || c.startsWith("تحقیق") || c.startsWith("news") || c.startsWith("research")) { action = "research"; label = "گزارش آپدیت‌ها"; }
  else if (c.startsWith("راهنما") || c.startsWith("help") || c.startsWith("start")) action = "help";
  else if (c.startsWith("وضعیت") || c.startsWith("status")) action = "status";
}

writeFileSync(STATE, String(highest));

if (action === "help") {
  await sendMessage({
    token: tg.token, chatId: tg.chatId,
    text:
      "🤖 <b>افغان فالورز — از هر جا</b>\n\n" +
      "• <b>بساز</b> — هر ۳ ویدیوی امروز\n" +
      "• <b>تیک‌تاک</b> / <b>انستا</b> / <b>ابزار</b> — فقط همان یکی\n" +
      "• <b>وضعیت</b> — بررسی سیستم\n\n" +
      "دستورها هر چند دقیقه یک‌بار خوانده می‌شوند و ساخت در فضای ابری انجام می‌شود؛ " +
      "کامپیوتر لازم نیست روشن باشد.",
  });
  console.log("ACTION=none");
} else if (action === "status") {
  await sendMessage({
    token: tg.token, chatId: tg.chatId,
    text: "✅ سیستم ابری فعال است. هر روز ساعت ۸ صبح خودکار می‌سازد، و هر وقت «بساز» بفرستی هم می‌سازد.",
  });
  console.log("ACTION=none");
} else if (action !== "none") {
  await sendMessage({
    token: tg.token, chatId: tg.chatId,
    text: `🎬 دستور دریافت شد: ${label}. ساخت در فضای ابری شروع شد — چند دقیقه صبر کن.`,
  });
  console.log(`ACTION=${action}`);
} else {
  console.log("ACTION=none");
}
