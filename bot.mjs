// Telegram control bot — make videos on demand from your phone.
// Runs on the PC, long-polls Telegram, and only answers your own chat.
//
// Commands (Persian or English, with or without a leading /):
//   بساز            → build + render + send today's 3 videos
//   تیک‌تاک | انستا | ابزار → build just that one
//   بفرست           → resend today's videos
//   وضعیت           → what exists for today
//   فردا            → build tomorrow's set early
//   دیاگنوز         → list open/escalated failures (see lib/diagnose.mjs)
//   راهنما          → this list
import { execSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage, getUpdates } from "./lib/telegram.mjs";
import { parseCommand, normalize, HELP_TEXT } from "./lib/commands.mjs";
import { reportFailure, sweep, recordOwnerReply, listOpenCases } from "./lib/diagnose.mjs";

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

// One place every failed command is tracked, instead of a bare "✗ خطا: ..."
// that only the person watching the chat at that exact moment ever sees.
// reportFailure() (not runTracked()) because every command reachable from
// here may already have sent a video/message or deleted one — see
// lib/diagnose.mjs's own comment on why those are never auto-retried
// unattended (2026-09-11's duplicate-publish incident).
async function fail(source, command, e) {
  const error = [e.stdout, e.stderr, e.message].filter(Boolean).join(String.fromCharCode(10)).trim();
  await reportFailure({ source, command, error });
}

// one place that runs a build, so every command tracks failures the same way
async function build(args, source) {
  const command = `node daily-render.mjs ${args}`.trim();
  try {
    execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", cwd: process.cwd() });
    return { ok: true };
  } catch (e) {
    await fail(source, command, e);
    return { ok: false };
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
    try { execSync("node send-telegram.mjs", { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
    catch (e) { await fail("بات:بفرست", "node send-telegram.mjs", e); }
    return;
  }

  if (has(c, "فردا", "tomorrow")) {
    const d = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await say(`🎬 در حال ساخت ویدیوهای فردا (${d})…`);
    const r = await build(d, "بات:فردا");
    return r.ok ? say(`✅ ویدیوهای ${d} آماده و ارسال شد.`) : undefined;
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
    const r = await build(`--only ${BUILD_SLOT[cmd.action]}`, `بات:${cmd.action}`);
    return r.ok ? say(`✅ ویدیوی ${label} ساخته و ارسال شد.`) : undefined;
  }

  // Content-selection (proposal, not build) commands. commands.mjs already
  // recognises these — "موضوع فردا"/"برنامه هفته"/bare "تیک تاک" etc. —
  // but bot.mjs had no branch for any of them, so typing one to the local
  // bot produced no reply at all. topic-plan.mjs sends the proposal
  // itself (to the same Telegram chat) and never renders anything.
  const PLAN_CATEGORY = { "plan-tiktok": "tiktok", "plan-instagram": "instagram", "plan-tools": "tools" };
  if (cmd && PLAN_CATEGORY[cmd.action]) {
    const command = `node topic-plan.mjs --category=${PLAN_CATEGORY[cmd.action]}`;
    try { execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
    catch (e) { await fail(`بات:${cmd.action}`, command, e); }
    return;
  }
  if (cmd && cmd.action === "plan-tomorrow") {
    const command = "node topic-plan.mjs";
    try { execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
    catch (e) { await fail("بات:plan-tomorrow", command, e); }
    return;
  }
  if (cmd && cmd.action === "plan-week") {
    const command = "node topic-plan.mjs --week";
    try { execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
    catch (e) { await fail("بات:plan-week", command, e); }
    return;
  }
  if (cmd && cmd.action === "approved-feature") {
    await say("🎬 در حال ساخت موضوع تأییدشده…");
    try { execFileSync("node", ["approve-feature.mjs", text], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); return say("✅ ساخته و فرستاده شد."); }
    catch (e) { return fail("بات:approved-feature", `node approve-feature.mjs "${text}"`, e); }
  }
  if (cmd && cmd.action === "approved-screen") {
    const command = `node approve-screen.mjs "${text}"`;
    try { execFileSync("node", ["approve-screen.mjs", text], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
    catch (e) { await fail("بات:approved-screen", command, e); }
    return;   // approve-screen.mjs reports the result itself on success
  }
  if (cmd && cmd.action === "voice-list") {
    const command = "node music/minimax-voices.mjs";
    try { execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
    catch (e) { await fail("بات:voice-list", command, e); }
    return;
  }
  if (cmd && cmd.action === "content-radar") {
    await say("📡 در حال رتبه‌بندی نامزدهای محتوا…");
    const command = "node content-radar.mjs";
    try { execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
    catch (e) { await fail("بات:content-radar", command, e); }
    return;
  }
  if (cmd && cmd.action === "undo") {
    const command = "node undo-send.mjs";
    try { execSync(command, { encoding: "utf8" }); }
    catch (e) { await fail("بات:undo", command, e); }
    return;   // undo-send.mjs reports the result itself on success
  }

  if (cmd && cmd.action === "diagnose-status") return say(listOpenCases());

  if (cmd && cmd.action === "research") {
    await say("🔎 در حال جستجوی آپدیت‌های تازه…");
    const command = "node research.mjs";
    try {
      const out = execSync(command, { encoding: "utf8" });
      const line = out.trim().split(String.fromCharCode(10)).pop() || "";
      if (/sent digest/.test(line)) return;                 // the digest speaks for itself
      if (/not set/.test(line)) return;                     // research.mjs already explained
      await say("⚠️ جستجو تمام شد ولی گزارشی فرستاده نشد: " + line.slice(0, 160));
    } catch (e) {
      await fail("بات:research", command, e);
    }
    return;
  }

  if (has(c, "بساز", "make", "today", "ساخت")) {
    await say("🎬 در حال ساخت ۳ ویدیوی امروز… چند دقیقه صبر کن.");
    const r = await build("", "بات:بساز-همه");
    return r.ok ? say("✅ هر ۳ ویدیوی امروز ساخته و ارسال شد.") : undefined;
  }

  // Nothing matched — if there's an open Diagnose case waiting for an
  // answer, treat this free-text message as the owner's reply to it rather
  // than silently doing nothing (the exact "typed a command, got no reply
  // at all" gap test-bot-commands.mjs was written to catch, just for the
  // one case a fixed command list can never cover: an actual conversation).
  const reply = await recordOwnerReply(text);
  if (reply) await say(reply.message);
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
      // Cheap on every tick (checks timestamps only) — this is what makes
      // "escalated to Telegram, then nobody answered" resume on its own
      // instead of sitting open forever; see lib/diagnose.mjs's file header.
      await sweep();
    } catch (e) {
      console.error("poll error:", e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

