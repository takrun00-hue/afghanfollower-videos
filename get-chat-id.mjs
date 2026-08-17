// Finds your Telegram chat id(s) using your bot token.
// Steps:
//   1) Put TELEGRAM_BOT_TOKEN in .env  (or pass the token as an argument)
//   2) In Telegram: message your bot / add it to the group and send a message /
//      add it as admin to the channel and post something.
//   3) Run:  node get-chat-id.mjs
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
const token = process.argv[2] || loadEnv().TELEGRAM_BOT_TOKEN;
if (!token || token.includes("ABCdEfGh")) {
  console.error("✗ No real bot token. Put TELEGRAM_BOT_TOKEN in .env, or run: node get-chat-id.mjs <token>");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const json = await res.json();
if (!json.ok) { console.error("✗ Telegram error:", json.description); process.exit(1); }

const chats = new Map();
for (const u of json.result) {
  const c = (u.message || u.channel_post || u.my_chat_member || u.chat_member || {}).chat;
  if (c) chats.set(c.id, c);
}

if (chats.size === 0) {
  console.log("هیچ چتی پیدا نشد. اول به ربات پیام بده (یا در کانال/گروهی که ربات ادمین است پیامی بفرست)، بعد دوباره اجرا کن.");
} else {
  console.log("چت‌های پیداشده — یکی را برای TELEGRAM_CHAT_ID در .env بگذار:\n");
  for (const c of chats.values()) {
    const name = c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || "";
    console.log(`  chat_id = ${c.id}   [${c.type}]  ${name}${c.username ? " (@" + c.username + ")" : ""}`);
  }
}
