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
import { execSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage, getUpdates } from "./lib/telegram.mjs";
import { parseCommand, normalize, HELP_TEXT } from "./lib/commands.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
const tg = telegramConfig(loadEnv());
if (!tg.enabled) { console.error("✗ Telegram not configured (.env)."); process.exit(1); }

const today = () => new Date().toISOString().slice(0, 10);
const say = (text) => sendMessage({ token: tg.token, chatId: tg.chatId, text });

// Was its own hand-copied text here, independent of lib/commands.mjs's
// HELP_TEXT — which cloud-listen.mjs already used — so the two silently
// drifted: this one never listed موضوع فردا/برنامه هفته/تأیید/صداها even
// after those commands were wired up below. One shared string now.
const HELP = HELP_TEXT;

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

export async function handle(text) {
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
  // commands.mjs names these actions "build-tiktok"/"build-instagram"/
  // "build-tools" — a LABEL object keyed by "tiktok"/"instagram"/"tools"
  // never matched cmd.action, so this branch was always false and every
  // platform-specific build command ("تیک‌تاک بساز" etc.) silently fell
  // through to the catch-all "بساز" handler and built all 3 videos
  // instead of just the one asked for. daily-render.mjs's --only also
  // filters on the newer 4-slot names (tiktok/instagram/ai-tiktok/
  // ai-instagram), not the older 3-category ones, so "ابزار" maps to
  // ai-tiktok (the AI topic's TikTok-native package), not a literal
  // "tools" slot that no longer exists.
  const BUILD_SLOT = { "build-tiktok": "tiktok", "build-instagram": "instagram", "build-tools": "ai-tiktok" };
  const BUILD_LABEL = { "build-tiktok": "تیک‌تاک", "build-instagram": "اینستاگرام", "build-tools": "ابزارها" };
  if (cmd && BUILD_SLOT[cmd.action]) {
    const label = BUILD_LABEL[cmd.action];
    await say(`🎬 در حال ساخت ویدیوی ${label}…`);
    const r = build(`--only ${BUILD_SLOT[cmd.action]}`);
    return say(r.ok ? `✅ ویدیوی ${label} ساخته و ارسال شد.` : "✗ خطا: " + r.err);
  }

  // Content-selection (proposal, not build) commands. commands.mjs already
  // recognises these — "موضوع فردا"/"برنامه هفته"/bare "تیک تاک" etc. —
  // but bot.mjs had no branch for any of them, so typing one to the local
  // bot produced no reply at all. topic-plan.mjs sends the proposal
  // itself (to the same Telegram chat) and never renders anything.
  const PLAN_CATEGORY = { "plan-tiktok": "tiktok", "plan-instagram": "instagram", "plan-tools": "tools" };
  if (cmd && PLAN_CATEGORY[cmd.action]) {
    try { execSync(`node topic-plan.mjs --category=${PLAN_CATEGORY[cmd.action]}`, { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }
  if (cmd && cmd.action === "plan-tomorrow") {
    try { execSync("node topic-plan.mjs", { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }
  if (cmd && cmd.action === "plan-week") {
    try { execSync("node topic-plan.mjs --week", { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }
  if (cmd && cmd.action === "approved-feature") {
    await say("🎬 در حال ساخت موضوع تأییدشده…");
    try { execFileSync("node", ["approve-feature.mjs", text], { stdio: "inherit" }); return say("✅ ساخته و فرستاده شد."); }
    catch (e) { return say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
  }
  if (cmd && cmd.action === "approved-screen") {
    try { execFileSync("node", ["approve-screen.mjs", text], { stdio: "inherit" }); }
    catch (e) { return say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;   // approve-screen.mjs reports the result itself
  }
  if (cmd && cmd.action === "voice-list") {
    try { execSync("node music/minimax-voices.mjs", { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }
  if (cmd && cmd.action === "content-radar") {
    await say("📡 در حال رتبه‌بندی نامزدهای محتوا…");
    try { execSync("node content-radar.mjs", { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }
  if (cmd && cmd.action === "news-radar") {
    await say("📡 در حال رتبه‌بندی خبرها به میزان خبرساز بودن…");
    try { execSync("node news-radar.mjs", { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }

  if (cmd && (cmd.action === "news-scan" || cmd.action === "news-search-live")) {
    const query = cmd.action === "news-search-live"
      ? text.replace(/^\s*جستجو(?:ی)?\s+(?:خبر|اخبار)\s*[:：]?\s*/i, "").trim().slice(0, 300)
      : "";
    await say(query ? `🔎 در حال جستجوی زندهٔ خبر دربارهٔ «${query}»…` : "🔎 در حال جستجوی تازه‌ترین خبرهای آلمان و اروپا…");
    try { execFileSync("node", ["news-scan.mjs", ...(query ? ["--query", query] : [])], { stdio: "inherit" }); }
    catch (e) { await say("✗ خطای جستجوی خبر: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }
  if (cmd && (cmd.action === "news-breaking" || cmd.action === "news-today")) {
    await say("📰 در حال جستجوی خبر…");
    const flag = cmd.action === "news-today" ? " --today --list" : "";
    try { execSync("node news-build.mjs --fetch" + flag, { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }

  if (cmd && (cmd.action === "news-germany" || cmd.action === "news-europe")) {
    const eu = cmd.action === "news-europe";
    await say(eu ? "🇪🇺 در حال جستجوی خبرهای اروپا و مهاجرت…" : "🇩🇪 در حال جستجوی خبرهای آلمان…");
    try { execSync("node news-build.mjs --fetch --list" + (eu ? " --europe" : ""), { stdio: "inherit" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
  }

  if (cmd && cmd.action === "europe-pick") {
    const n = String(text).replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
    await say("🎬 در حال ساخت ویدیو از خبر اروپای شمارهٔ " + n + "…");
    try { execSync("node news-build.mjs --fetch --europe --pick " + (Number(n) || 1), { stdio: "inherit" }); return say("✅ ساخته و فرستاده شد."); }
    catch (e) { return say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
  }

  if (cmd && cmd.action === "news-pick") {
    const n = String(text).replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
    await say("🎬 در حال ساخت ویدیو از خبر شمارهٔ " + n + "…");
    try { execSync("node news-build.mjs --fetch --pick " + (Number(n) || 1), { stdio: "inherit" }); return say("✅ ساخته و فرستاده شد."); }
    catch (e) { return say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
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

  if (cmd && cmd.action === "undo-news") {
    try { execSync("node undo-send.mjs 1 --news", { encoding: "utf8" }); }
    catch (e) { await say("✗ خطا: " + String(e.message).split(String.fromCharCode(10))[0]); }
    return;
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

// Only start long-polling when this file is run directly (`node bot.mjs`),
// not when test-bot-dispatch.mjs imports `handle` to exercise real dispatch
// in-process. Telegram refuses getUpdates with a 409 while a webhook is set
// (the Cloudflare Worker owns that today), so importing this file must never
// have the side effect of polling.
// pathToFileURL handles drive letters, backslashes and space-encoding
// correctly on Windows — a hand-built "file://" + argv[1] string does not.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
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
}

