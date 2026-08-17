// Telegram control bot for the AfghanFollower pipeline — trigger from your phone.
// Runs on the PC (long-polls Telegram), responds ONLY to your chat id.
// Commands (Persian or English, with or without a leading /):
//   بساز | make | today   → build + render + send today's 4 videos
//   بفرست | send          → resend today's videos to Telegram
//   وضعیت | status        → report today's status
//   راهنما | help | start → list commands
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage, getUpdates } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
const tg = telegramConfig(loadEnv());
if (!tg.enabled) { console.error("✗ Telegram not configured (.env)."); process.exit(1); }

const today = () => new Date().toISOString().slice(0, 10);
const say = (text) => sendMessage({ token: tg.token, chatId: tg.chatId, text });

const HELP =
  "🤖 <b>ربات افغان فالور</b>\n\nدستورها:\n" +
  "• <b>بساز</b> — ساخت و ارسال ۴ ویدیوی امروز\n" +
  "• <b>بفرست</b> — ارسال دوبارهٔ ویدیوهای امروز\n" +
  "• <b>وضعیت</b> — وضعیت امروز\n" +
  "• <b>راهنما</b> — همین راهنما";

function norm(t) { return (t || "").trim().replace(/^\//, "").toLowerCase(); }

async function handle(text) {
  const c = norm(text);
  if (["بساز", "make", "today", "ساخت", "بساز"].includes(c)) {
    await say("🎬 در حال ساخت ۴ ویدیوی امروز... چند دقیقه صبر کن.");
    try {
      execSync("node daily-render.mjs", { stdio: "inherit", cwd: process.cwd() });
      await say("✅ ۴ ویدیوی امروز ساخته و ارسال شد.");
    } catch (e) { await say("✗ خطا در ساخت: " + (e.message || "")); }
  } else if (["بفرست", "send", "ارسال"].includes(c)) {
    await say("✈ در حال ارسال ویدیوهای امروز...");
    try { execSync("node send-telegram.mjs", { stdio: "inherit", cwd: process.cwd() }); }
    catch (e) { await say("✗ خطا: " + (e.message || "")); }
  } else if (["وضعیت", "status", "وضيعت"].includes(c)) {
    const mf = `renders/daily/${today()}/manifest.json`;
    if (existsSync(mf)) {
      const m = JSON.parse(readFileSync(mf, "utf8"));
      await say(`📊 امروز (${m.date}): ${m.videos.length} ویدیو ساخته شده — کیفیت ${m.resolution}.`);
    } else { await say("امروز هنوز ویدیویی ساخته نشده. «بساز» را بفرست."); }
  } else if (["راهنما", "help", "start", "شروع"].includes(c)) {
    await say(HELP);
  }
}

console.log("bot: listening for commands from chat", tg.chatId);
say("🤖 ربات آنلاین شد. «راهنما» را بفرست تا دستورها را ببینی.");

let offset = 0;
while (true) {
  try {
    const updates = await getUpdates({ token: tg.token, offset, timeout: 50 });
    for (const u of updates) {
      offset = u.update_id + 1;
      const msg = u.message || u.channel_post;
      if (!msg || String(msg.chat.id) !== String(tg.chatId)) continue; // only owner
      if (msg.text) await handle(msg.text);
    }
  } catch (e) {
    console.error("poll error:", e.message);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
