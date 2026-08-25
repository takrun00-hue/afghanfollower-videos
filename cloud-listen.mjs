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
import { parseCommand, HELP_TEXT } from "./lib/commands.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const STATE = ".telegram-offset";
const tg = telegramConfig(loadEnv());
if (!tg.enabled) { console.log("ACTION=none"); process.exit(0); }

const stored = existsSync(STATE) ? Number(readFileSync(STATE, "utf8").trim()) || 0 : 0;

// timeout=0 → return immediately; a scheduled job must not sit and wait
const updates = await getUpdates({ token: tg.token, offset: stored ? stored + 1 : 0, timeout: 0 });

let action = "none", label = "", highest = stored;

for (const u of updates) {
  highest = Math.max(highest, u.update_id);
  const msg = u.message || u.channel_post;
  if (!msg || String(msg.chat.id) !== String(tg.chatId) || !msg.text) continue;
  const cmd = parseCommand(msg.text);
  if (cmd) { action = cmd.action; label = cmd.label; }
}

writeFileSync(STATE, String(highest));

if (action === "help") {
  await sendMessage({ token: tg.token, chatId: tg.chatId, text: HELP_TEXT });
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
