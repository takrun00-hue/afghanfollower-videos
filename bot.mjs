// Telegram control bot — make videos on demand from your phone.
// Runs on the PC, long-polls Telegram, and only answers your own chat.
//
// Commands (Persian or English, with or without a leading /):
//   بساز            → build + render + send today's 3 videos
//   تیک‌تاک | انستا | ابزار → build just that one
//   بفرست           → resend today's videos
//   وضعیت           → what exists for today
//   فردا            → build tomorrow's set early
//   راهنما          → this list
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage, getUpdates } from "./lib/telegram.mjs";
import { parseCommand, normalize } from "./lib/commands.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
const tg = telegramConfig(loadEnv());
if (!tg.enabled) { console.error("✗ Telegram not configured (.env)."); process.exit(1); }

const today = () => new Date().toISOString().slice(0, 10);
const say = (text) => sendMessage({ token: tg.token, chatId: tg.chatId, text });

const HELP =
  "🤖 <b>ربات افغان فالورز</b>\n\n" +
  "🎬 <b>ساخت ویدیو</b>\n" +
  "• <b>تیک‌تاک بساز</b> — فقط ویدیوی تیک‌تاک\n" +
  "• <b>انستا بساز</b> — فقط ویدیوی اینستاگرام\n" +
  "• <b>ابزار بساز</b> — فقط ویدیوی ابزارها\n" +
  "• <b>بساز</b> — هر ۳ ویدیوی امروز\n" +
  "• <b>فردا</b> — ویدیوهای فردا را از حالا بساز\n\n" +
  "🔎 <b>بقیه</b>\n" +
  "• <b>خبر</b> — آپدیت‌های تازه‌ای که هنوز ویدیو نشده‌اند\n" +
  "• <b>بفرست</b> — ارسال دوبارهٔ ویدیوهای امروز\n" +
  "• <b>وضعیت</b> — چه چیزی برای امروز آماده است\n" +
  "• <b>راهنما</b> — همین فهرست\n\n" +
  "جمله را هر طور خواستی بنویس — «یک ویدیوی تیک تاک برایم بساز» هم کار می‌کند.";

const norm = normalize;
const has = (c, ...words) => words.some((w) => c.includes(w));

// one place that runs a build, so every command reports failures the same way
function build(args, label) {
  try {
    execSync(`node daily-render.mjs ${args}`, { stdio: "inherit", cwd: process.cwd() });
    return { ok: true };
  } catch (e) {
    return { ok: false, err: String(e.message).split(String.fromCharCode(10))[0] };
  }
}

async function handle(text) {
  const c = norm(text);

  if (has(c, "راهنما", "help", "start", "شروع")) return say(HELP);

  if (has(c, "وضعیت", "status")) {
    const mf = `renders/daily/${today()}/manifest.json`;
    if (!existsSync(mf)) return say("امروز هنوز ویدیویی ساخته نشده. «بساز» را بفرست.");
    const m = JSON.parse(readFileSync(mf, "utf8"));
    const lines = m.videos.map((v) => `• ${v.platform} — ${v.packId} ${v.telegram ? "✅" : "⏳"}`);
    return say(`📊 امروز (${m.date}):\n${lines.join("\n")}`);
  }

  if (has(c, "بفرست", "send", "ارسال")) {
    await say("✈ در حال ارسال ویدیوهای امروز…");
    try { execSync("node send-telegram.mjs", { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }

  if (has(c, "فردا", "tomorrow")) {
    const d = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await say(`🎬 در حال ساخت ویدیوهای فردا (${d})…`);
    const r = build(d);
    return say(r.ok ? `✅ ویدیوهای ${d} آماده و ارسال شد.` : "✗ خطا: " + r.err);
  }

  const cmd = parseCommand(text);
  const LABEL = { tiktok: "تیک‌تاک", instagram: "اینستاگرام", tools: "ابزارها" };
  if (cmd && LABEL[cmd.action]) {
    await say(`🎬 در حال ساخت ویدیوی ${LABEL[cmd.action]}…`);
    const r = build(`--only ${cmd.action}`);
    return say(r.ok ? `✅ ویدیوی ${LABEL[cmd.action]} ساخته و ارسال شد.` : "✗ خطا: " + r.err);
  }

  if (cmd && (cmd.action === "news-breaking" || cmd.action === "news-today")) {
    await say("📰 در حال جستجوی خبر…");
    const flag = cmd.action === "news-today" ? " --today" : "";
    try { execSync("node news-build.mjs --fetch" + flag, { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }

  if (cmd && cmd.action === "news-text") {
    const payload = text.replace(/^\s*(خبر|news)\s*[:：]\s*/i, "").trim();
    if (payload.length < 20) return say("متن خبر خیلی کوتاه است. این شکل را بفرست:\nخبر: تیتر | جمله ۱ | جمله ۲ | جمله ۳ | جمله ۴");
    await say("🎬 در حال ساخت ویدیوی خبری…");
    try {
      execSync("node news-build.mjs --text " + JSON.stringify(payload), { stdio: "inherit" });
      return say("✅ ویدیوی خبری ساخته و فرستاده شد.");
    } catch (e) { return say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
  }

  if (cmd && cmd.action === "undo") {
    try { execSync("node undo-send.mjs", { encoding: "utf8" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;   // undo-send.mjs reports the result itself
  }

  if (cmd && cmd.action === "research") {
    await say("🔎 در حال جستجوی آپدیت‌های تازه…");
    try {
      const out = execSync("node research.mjs", { encoding: "utf8" });
      const line = out.trim().split(String.fromCharCode(10)).pop() || "";
      if (/sent digest/.test(line)) return;                 // the digest speaks for itself
      if (/not set/.test(line)) return;                     // research.mjs already explained
      await say("⚠️ جستجو تمام شد ولی گزارشی فرستاده نشد: " + line.slice(0, 160));
    } catch (e) {
      const msg = [e.stdout, e.stderr, e.message].filter(Boolean).join(" ").trim();
      await say("✗ خطای جستجو: " + msg.split(String.fromCharCode(10)).slice(-1)[0].slice(0, 200));
    }
    return;
  }

  if (has(c, "بساز", "make", "today", "ساخت")) {
    await say("🎬 در حال ساخت ۳ ویدیوی امروز… چند دقیقه صبر کن.");
    const r = build("");
    return say(r.ok ? "✅ هر ۳ ویدیوی امروز ساخته و ارسال شد." : "✗ خطا: " + r.err);
  }
}

console.log("bot: listening for", tg.chatId);
say("🤖 ربات آنلاین شد. «راهنما» را بفرست تا دستورها را ببینی.");

let offset = 0;
for (;;) {
  try {
    for (const u of await getUpdates({ token: tg.token, offset, timeout: 50 })) {
      offset = u.update_id + 1;
      const msg = u.message || u.channel_post;
      if (!msg || String(msg.chat.id) !== String(tg.chatId)) continue;  // owner only
      if (msg.text) await handle(msg.text);
    }
  } catch (e) {
    console.error("poll error:", e.message);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
