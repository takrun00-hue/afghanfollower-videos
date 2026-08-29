// One command for the GapMedia daily pipeline: builds + renders + adds
// music for the day's 3 videos (TikTok / Instagram / social).
// Usage:
//   node daily-render.mjs              # today, 1080x1920
//   node daily-render.mjs 2026-08-20   # a specific date
//   node daily-render.mjs --4k         # today, 2160x3840
// This script self-locates the project dir, so a scheduler can call it directly.
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { buildHTML } from "./lib/build.mjs";
import { buildInkHTML } from "./lib/build-ink.mjs";
import { buildNeonHTML } from "./lib/build-neon.mjs";
import { packsForDate, packForFeature, CATEGORIES } from "./lib/content.mjs";
import { sceneArtPlan } from "./lib/scene-art.mjs";
import { creativeBriefFor } from "./lib/creative-brief.mjs";
import { accentSpec } from "./music/mood.mjs";
import { loadEnv, telegramConfig, sendVideo } from "./lib/telegram.mjs";
import { fingerprint, check, register, hasHistory } from "./lib/dedupe.mjs";

const projectDir = dirname(fileURLToPath(import.meta.url));
process.chdir(projectDir);

const args = process.argv.slice(2);
const is4k = args.includes("--4k");
const noTelegram = args.includes("--no-telegram");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null; // e.g. --only tiktok
// The Telegram helper already reads .env, but the subprocesses that generate
// MiniMax narration inherit only process.env.  Promote local .env values once
// here so local renders behave exactly like the GitHub Actions runner.
const localEnv = loadEnv();
Object.assign(process.env, localEnv);
const tg = noTelegram ? { enabled: false } : telegramConfig(localEnv);
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const date = dateArg ? new Date(dateArg + "T12:00:00") : new Date();
const iso = date.toISOString().slice(0, 10);

const HF = "npx --yes hyperframes@0.8.16";
const resFlag = is4k ? "--resolution portrait-4k" : "";

// --feature <id> publishes one named feature immediately, whatever the rotation
// says. A freshly researched update is worth shipping the day it lands.
const featIdx = args.indexOf("--feature");
const featureId = featIdx >= 0 ? args[featIdx + 1] : null;

const sel = packsForDate(date);
let generated = null;
if (featureId) {
  // One-off news and user-supplied tutorials live in generated files rather
  // than in the permanent feature banks.
  if (args.includes("--news-generated")) {
    const mod = await import("./lib/generated/news-current.mjs?t=" + Date.now());
    generated = mod.CURRENT_NEWS;
  } else if (args.includes("--custom-generated")) {
    const mod = await import("./lib/generated/custom-current.mjs?t=" + Date.now());
    generated = mod.CURRENT_CUSTOM;
  }
  const p = packForFeature(featureId, date, generated);
  if (!p) {
    console.error(`✗ unknown feature "${featureId}".`);
    process.exit(1);
  }
  sel[p.platform] = p;
}
// A news run is a separate channel: separate folder, separate filename, and a
// separate manifest, so it can never overwrite the tutorials' record for the day.
const isNewsRun = !!featureId && (args.includes("--news-generated") || generated?.category === "news" ||
  ["bverfg-ruling", "legal-route-works"].includes(featureId) || /^news-/.test(featureId));
const compDir = isNewsRun ? `compositions/news/${iso}` : `compositions/daily/${iso}`;
const outDir = isNewsRun ? `renders/news/${iso}` : `renders/daily/${iso}`;
mkdirSync(compDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const forcedCat = featureId ? sel[Object.keys(sel).find((k) => sel[k] && sel[k].id === featureId)]?.platform : null;
const pick = only || forcedCat;
const ALL_CATS = forcedCat && !CATEGORIES.includes(forcedCat) ? [...CATEGORIES, forcedCat] : CATEGORIES;
const cats = pick ? ALL_CATS.filter((c) => c === pick) : CATEGORIES;
if (pick && cats.length === 0) { console.error(`✗ unknown category "${pick}". Use one of: ${ALL_CATS.join(", ")}`); process.exit(1); }

const SENT_LOG = ".telegram-sent.json";
// Unlike the short Telegram delete log, this file is committed by the cloud
// workflow after a successful delivery.  It is the editorial memory used by
// topic research: a subject that has already reached Telegram is not a fresh
// candidate, even if it is still present in a feature bank.
const CONTENT_HISTORY = ".content-history.json";

// A small rolling log of what the bot posted, so "پاک کن" has something to act
// on. Kept to the last 30 entries — anything older is past the delete window.
function recordSent(entry) {
  let log = [];
  try { log = JSON.parse(readFileSync(SENT_LOG, "utf8")); } catch {}
  log.push(entry);
  writeFileSync(SENT_LOG, JSON.stringify(log.slice(-30), null, 2));
}

function recordPublishedTopic(pack, entry) {
  let history = [];
  try { history = JSON.parse(readFileSync(CONTENT_HISTORY, "utf8")); } catch {}
  const topic = String(pack.feature || pack.title || pack.id || "").replace(/<[^>]*>/g, " ").trim();
  history.push({
    id: pack.id,
    platform: pack.platform,
    topic,
    hook: String(pack.hook?.ask || "").replace(/<[^>]*>/g, " ").trim(),
    messageId: entry.messageId || null,
    sentAt: new Date().toISOString(),
  });
  writeFileSync(CONTENT_HISTORY, JSON.stringify(history.slice(-180), null, 2) + "\n");
}

const results = [];
// rule 10: items in one run are compared against each other, not only history
const batchPrints = [];
for (const platform of cats) {
  const pack = sel[platform];
  // Generate the topic-specific creative contract before any sound, HTML or
  // render work. It is saved beside the composition for review and prevents a
  // generic visual decision from being made after the script is already built.
  const creativeBrief = creativeBriefFor(pack, { date });
  pack.creative = creativeBrief;
  writeFileSync(`${compDir}/${platform}-creative-brief.json`, JSON.stringify(creativeBrief, null, 2));
  // Measure the narration FIRST, then let each scene last as long as its own
  // spoken line (padded, and never shorter than a readable beat). Without this
  // the voice drifts past the caption it belongs to.
  if (process.env.VOICE === "on") {
    try {
      const plan = JSON.parse(
        execSync(`node music/plan-voice.mjs ${pack.id} ${pack.tips.length}`, { encoding: "utf8" }).trim().split(String.fromCharCode(10)).pop()
      );
      if (plan.ok && plan.durs.length === pack.tips.length + 2) {
        // A clear end-breath is better than the last word colliding with the
        // next card. This padding is preserved because make-voice reuses the
        // very files measured above.
        // Leave a full spoken landing before the next card. The voice files
        // themselves are reused by the mixer, so this is a real gap after the
        // sentence — not a guessed visual duration.
        const PAD = 1.15, MIN = 2.5;
        pack.hookDuration = +Math.max(MIN + 0.3, plan.durs[0] + PAD).toFixed(3);
        pack.tipDurations = plan.durs.slice(1, -1).map((d) => +Math.max(MIN, d + PAD).toFixed(3));
        pack.outroDuration = +Math.max(3.6, plan.durs[plan.durs.length - 1] + 1.3).toFixed(3);
        pack.duration = +(
          pack.hookDuration + pack.tipDurations.reduce((a, d) => a + d, 0) + pack.outroDuration
        ).toFixed(3);
        pack.music = pack.music.replace(/.m4a$/, "-vo.m4a");
        console.log(`   timing follows speech: ${pack.duration}s`);
      }
    } catch (e) {
      console.error("   ✗ voice planning failed, using the beat grid:", String(e.message).split(String.fromCharCode(10))[0]);
    }
  }

  const comp = `${compDir}/${platform}.html`;
  writeFileSync(comp, (process.env.STYLE === "neon" ? buildNeonHTML : process.env.STYLE === "legacy" ? buildHTML : buildInkHTML)(pack));
  // Beat-synced score: generated at this video's exact length so every cut lands
  // on a bar, and the intro/drop/outro line up with hook/tips/CTA.
  // every scene boundary, so the score can punctuate the picture changing
  const cutTimes = (() => {
    const lens = pack.tipDurations ||
      Array.from({ length: pack.tips.length },
        () => (pack.duration - pack.hookDuration - pack.outroDuration) / pack.tips.length);
    const out = [pack.hookDuration];
    let acc = pack.hookDuration;
    for (const L of lens) { acc += L; out.push(+acc.toFixed(3)); }
    return out;
  })();

  let music = pack.music;
  if (pack.duration && pack.musicVariant) {
    execSync(
      `node music/make-one.mjs ${pack.duration} ${pack.musicVariant} "${pack.music}" ${pack.musicOutroBars || 4}`,
      {
        stdio: "inherit",
        env: {
          ...process.env,
          MUSIC_CUTS: cutTimes.join(","),
          // mood from the video's topic, one accent per slide from that slide's art
          MUSIC_MOOD: pack.mood || "",
          MUSIC_BPM: String(pack.bpm || ""),
          MUSIC_ACCENTS: accentSpec(cutTimes, ["", ...sceneArtPlan(pack.tips)]),
        },
      }
    );
  }
  if (!existsSync(music)) music = "music/bed-60s-v1.m4a";

  // Persian voiceover, laid on the same scene timings, with the music ducked
  // under it so the words stay intelligible. VOICE=off skips it.
  let voice = null;
  if (process.env.VOICE === "on") {
    const tipLen = (pack.duration - pack.hookDuration - pack.outroDuration) / pack.tips.length;
    const tipList = (pack.tipDurations || []).join(",");
    const vFile = `music/voice/${platform}-${pack.id}.m4a`;
    try {
      execSync(
        `node music/make-voice.mjs ${pack.id} ${pack.hookDuration} ${tipLen.toFixed(3)} ` +
        `${tipList ? `--tips ${tipList} ` : ""}` +
        `${pack.tips.length} ${(pack.duration - pack.outroDuration).toFixed(3)} ${pack.duration} "${vFile}"`,
        { stdio: "inherit" }
      );
      if (existsSync(vFile)) voice = vFile;
      if (!voice && process.env.REQUIRE_VOICE === "on") throw new Error("Narration did not render for voice-required run");
    } catch (e) {
      console.error("   ✗ voice failed, continuing music-only:", String(e.message).split(String.fromCharCode(10))[0]);
      // A requested narrated video must not silently arrive as music-only.
      // Production workflows set REQUIRE_VOICE=on; local design previews can
      // still deliberately fall back to music when that flag is absent.
      if (process.env.REQUIRE_VOICE === "on") throw e;
    }
  }

  const silent = `${outDir}/${platform}-silent.mp4`;
  const stamp = isNewsRun ? new Date().toISOString().slice(11, 16).replace(":", "") : "";
  const final = isNewsRun
    ? `${outDir}/khabar-${iso}-${stamp}.mp4`
    : `${outDir}/gapmedia-${platform}-${iso}.mp4`;
  console.log(`\n=== ${platform} (${pack.id}) — ${is4k ? "4K" : "1080p"} — ${music} ===`);
  execSync(`${HF} render -c "${comp}" --quality high --fps 30 ${resFlag} --skill=faceless-explainer -o "${silent}"`, { stdio: "inherit" });
  if (voice) {
    execSync(
      `ffmpeg -y -hide_banner -loglevel error -i "${silent}" -i "${music}" -i "${voice}" ` +
      `-filter_complex "[1:a]volume=0.85[m];[m][2:a]sidechaincompress=threshold=0.02:ratio=20:attack=8:release=260:makeup=1[duck];[duck][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]" ` +
      `-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${final}"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`ffmpeg -y -i "${silent}" -i "${music}" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${final}"`, { stdio: "inherit" });
  }

  let sent = false;
  // Checkpoint 2: the last gate before delivery. The first gate is at topic
  // selection, but two research runs can arrive at the same subject by
  // different routes, and the batch itself has to be checked against its own
  // earlier items — so the decision is made again here, against the registry
  // plus whatever this run has already queued.
  const print = fingerprint(pack);
  const dup = check(print, { alsoAgainst: batchPrints });
  if (dup.verdict === "DUPLICATE" && process.env.ALLOW_DUPLICATE !== "1") {
    console.error(`   ✗ تکراری (${dup.score}) — همان محتوای «${dup.closest?.id}» در ۳۰ روز اخیر رفته است. ارسال نشد.`);
    results.push({ platform, final, sent: false, duplicate: dup });
    continue;
  }
  if (dup.verdict === "PARTIALLY_OVERLAPPING") {
    console.warn(`   ⚠ هم‌پوشانی ${dup.score}٪ با «${dup.closest?.id}» — بررسی کن که چیز تازه‌ای می‌گوید`);
  }
  if (!dup.checked) console.warn("   ⚠ تاریخچه‌ای برای مقایسه نبود؛ یکتا بودن تأیید نشده است");
  batchPrints.push(print);

  if (tg.enabled) {
    try {
      const res = await sendVideo({ token: tg.token, chatId: tg.chatId, file: final, caption: pack.tgTitle });
      console.log(`   ✈ sent to Telegram`);
      sent = true;
      // remember the message so it can be taken back; Telegram allows a bot to
      // delete its own messages for 48 hours and nothing else
      if (res && res.message_id) {
        const delivery = { kind: isNewsRun ? "news" : "daily", platform, packId: pack.id, messageId: res.message_id, at: Date.now() };
        recordSent(delivery);
        // This is the editorial memory for both channels.  A story counts as
        // published only after Telegram confirms a message id; drafts and
        // aborted renders must never suppress a future story.
        recordPublishedTopic(pack, delivery);
        register({ ...print, messageId: res.message_id, kind: delivery.kind, sentAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error(`   ✗ Telegram send failed: ${e.message}`);
      throw e;
    }
  } else if (!noTelegram) {
    throw new Error("Telegram is not configured; refusing to mark a local-only render as delivered.");
  }
  results.push({ platform, packId: pack.id, file: resolve(final), telegram: sent });
}

writeFileSync(`${outDir}/${isNewsRun ? "news-manifest" : "manifest"}.json`, JSON.stringify({ date: iso, dayIndex: sel.dayIndex, resolution: is4k ? "2160x3840" : "1080x1920", videos: results }, null, 2));
console.log(`\n✅ ${iso}: ${results.length} videos ready in ${outDir}\n` + results.map((r) => "   " + r.file).join("\n"));



