// Builds and sends the next episode of the A1 German-lesson series —
// replaces the "German Insider" news channel (owner request 2026-09-08).
//
// One command:
//   node german-lesson-build.mjs
//
// Continuing/serialized: reads the next episode index from
// .german-lesson-progress.json (Actions-cache-persisted, same convention as
// the rest of this project's rolling state), builds that curriculum unit,
// and — only once the send actually confirms — advances the index so the
// next run picks up where this one left off, never repeating or skipping.
//
// Real, topic-matched photos (build-ink.mjs, the same real-photo renderer
// the rest of this project's tutorials use) — owner correction 2026-09-08:
// no mascot/cartoon animation. Each vocabulary item gets its own photo via
// lib/lesson-image.mjs (a live search, not a fixed set), and the same
// Visual Truth Gate (assertVisualProof) every other tutorial must pass
// applies here too — no photo found for a word means that episode does not
// ship, same as any other feature with no real evidence.
import { execSync, execFileSync } from "node:child_process";
import { writeFileSync, existsSync, readFileSync, mkdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildInkHTML } from "./lib/build-ink.mjs";
import { assertVisualProof } from "./lib/visual-proof.mjs";
import { findLessonImage } from "./lib/lesson-image.mjs";
import { GERMAN_A1, germanUnitAt } from "./lib/german-a1.mjs";
import { accentSpec } from "./music/mood.mjs";
import { loadEnv, telegramConfig, sendVideo, sendMessage } from "./lib/telegram.mjs";
import { fingerprint, check, register } from "./lib/dedupe.mjs";
import { narrationFor } from "./lib/narration.mjs";
import { minimaxSpeakable } from "./lib/pronounce.mjs";

const projectDir = dirname(fileURLToPath(import.meta.url));
process.chdir(projectDir);

const localEnv = loadEnv();
Object.assign(process.env, localEnv);
const tg = telegramConfig(localEnv);
const noTelegram = process.argv.includes("--no-telegram");

const HF = "npx --yes hyperframes@0.8.16";
const iso = new Date().toISOString().slice(0, 10);

const PROGRESS = ".german-lesson-progress.json";
function nextIndex() {
  try { return Math.max(0, Number(JSON.parse(readFileSync(PROGRESS, "utf8")).nextIndex) || 0); } catch { return 0; }
}
function saveProgress(i) {
  writeFileSync(PROGRESS, JSON.stringify({ nextIndex: i, lastBuiltAt: new Date().toISOString() }, null, 2));
}

const idx = nextIndex();
const unit = germanUnitAt(idx);
const episodeNo = idx + 1;
const nextUnit = germanUnitAt(idx + 1);

// Article colour-coding (owner's MASTER SYSTEM spec, 2026-09-10, sec. 2 & 11):
// der = blue, die = red, das = green, fixed for the whole course. A noun is
// never taught without its Artikel (lib/german-a1.mjs already only attaches
// der/die/das to real nouns, e.g. a1-06-family — verbs, phrases and question
// words correctly carry none), so this only ever colours the leading
// der/die/das token when one is actually present.
const ARTICLE_COLOR = { der: "#3B82F6", die: "#EF4444", das: "#22C55E" };
function colorArticle(de) {
  const m = /^(der|die|das)\s+(.*)$/.exec(de);
  if (!m) return de;
  const [, art, rest] = m;
  return `<span style="color:${ARTICLE_COLOR[art]}">${art}</span> ${rest}`;
}

// Total course length for the "A1 • 0XX/100" on-screen counter (sec. 17).
// GERMAN_A1 currently holds fewer than 100 real lessons; the denominator
// names the target course length the roadmap (sec. 16, 30 modules) is
// building toward, not a claim that 100 already exist.
const COURSE_TOTAL = 100;
const lessonCode = `A1-${String(episodeNo).padStart(3, "0")}`;
const lessonCounter = `A1 • ${String(episodeNo).padStart(3, "0")}/${COURSE_TOTAL}`;

const HOOK_DUR = 4, TIP_DUR = 4, OUTRO_DUR = 5;
const pack = {
  id: unit.id,
  // Distinguishes this series from every other "news"-platform pack for
  // lib/retention.mjs's hook nudge line (NEWS_NUDGES talks about "خبر" —
  // a news story — which reads as nonsense under a vocabulary lesson;
  // owner report 2026-09-10) without touching the news pipeline's own
  // platform value or layout.
  kind: "german-lesson",
  platform: "news", // unbranded layout, same as the news channel this replaces
  feature: `آموزش آلمانی A1 — قسمت ${episodeNo}`,
  title: `آموزش آلمانی هوشمند — قسمت ${episodeNo}: ${unit.topic}`,
  hook: { ask: unit.hook, l1: "آموزش آلمانی هوشمند" },
  // build-ink.mjs's hook scene renders this in the `.kick` slot at the very
  // top of the hook — it was defaulting to the generic "قابلیت" ("Feature"),
  // a leftover from the app-tutorial template this renderer was built for,
  // which read as meaningless over a language lesson (owner report
  // 2026-09-10). This is also the on-screen home for the "A1 • 0XX/100"
  // lesson counter (MASTER SYSTEM spec sec. 17) — there is no other slot
  // that renders it.
  kicker: lessonCounter,
  // Each on-screen card shows the German word/phrase AND its Persian
  // meaning (with register — رسمی/غیررسمی — spelled out where it matters);
  // the spoken narration (lib/narration.mjs, VO[unit.id]) stays Persian for
  // the explanation, with the German itself actually pronounced separately
  // (see the voice section below), never mispronounced by reading it as
  // part of a Persian sentence. The German half is run through
  // colorArticle() so a leading der/die/das keeps its fixed course colour.
  // step: forces build-ink.mjs's kindOf() to pick the "step" scene kind,
  // which is the ONLY kind that actually renders tip.photo — every other
  // kind (the "paper" default this pack fell into before) shows a generic
  // decorative icon and silently ignores tip.photo entirely. Without this,
  // findLessonImage()'s real photos were fetched but never displayed —
  // every episode looked identical regardless of vocabulary (owner report
  // 2026-09-10: "همان طرح قبلی است"). Confirmed via lib/build-ink.mjs: a
  // real photo's aspect ratio classifies as "panel"/"wide" (not "phone"),
  // so it renders full-frame with no iPhone chrome and no fake UI overlay —
  // exactly what MASTER SYSTEM spec sec. 3/5 requires.
  tips: unit.items.map((it, i) => ({ head: `${colorArticle(it.de)} — ${it.fa}`, step: i + 1 })),
  outroAsk: `قسمت بعد: ${nextUnit.topic}`,
  payoff: "واژه، مکالمه و نکتهٔ گرامری تازه یاد گرفتی — سطح A1.",
  tgTitle: `🇩🇪 آموزش آلمانی هوشمند | ${lessonCode} — ${unit.topic}\n\n#آلمانی #A1 #زبان_آلمانی #مکالمه #واژگان #گرامر`,
  // No mascot/character illustration — owner correction 2026-09-08, reaffirmed
  // 2026-09-10 (MASTER SYSTEM spec sec. 5: CHARACTER_MODE=DISABLED, no AI
  // avatar; real contextual images + typography + motion graphics only).
  noCharacters: true,
  // Exact palette from the owner's MASTER SYSTEM spec (sec. 2, 2026-09-10):
  // background #F7F6F2, primary text #111111, German accent #E53935,
  // secondary #F2C94C. PAIR[0] drives most on-screen text/accents in this
  // renderer, PAIR[1] the secondary band colour — mapped so the dominant
  // colour a viewer actually sees is the spec's German accent red, with the
  // near-black spec text colour as the second ink.
  ink: { pair: ["#E53935", "#111111"], paper: "#F7F6F2", tint: "rgba(229,57,53,.08)" },
  outro: { tag: "هر روز یک قدم به آلمانی بهتر —<br/>ما را دنبال کن.", follow: "دنبال کنید +" },
  mood: "calm",
  bpm: 92,
  musicVariant: "v1",
  music: "music/bed-60s-v1.m4a",
  musicOutroBars: 4,
  hookDuration: HOOK_DUR,
  tipDurations: unit.items.map(() => TIP_DUR),
  outroDuration: OUTRO_DUR,
  duration: HOOK_DUR + TIP_DUR * unit.items.length + OUTRO_DUR,
};

const compDir = `compositions/german/${iso}`;
const outDir = `renders/german/${iso}`;
mkdirSync(compDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

console.log(`\n=== german-lesson episode ${episodeNo}: ${unit.topic} (${unit.id}) ===`);

// Each tip scene's audio is TWO clips back to back: the German word/phrase,
// synthesised with language_boost="German" so it is actually pronounced in
// German (not read by the Persian voice — owner correction, 2026-09-08:
// text-only on screen was not enough), then the Persian line explaining it.
// Bypasses plan-voice.mjs/make-voice.mjs (built for one Persian line per
// scene) with the same technique in miniature: synthesise every clip first,
// measure it, then size the scene to fit — see make-voice.mjs's own
// adelay+amix approach, reused directly below.
function ttsSynthesize(text, languageBoost, outFile) {
  const env = { ...process.env };
  if (languageBoost) env.MINIMAX_LANGUAGE_BOOST = languageBoost;
  execFileSync("node", ["music/minimax-tts.mjs", text, "-o", outFile], { env, stdio: "inherit" });
}
function ffprobeDuration(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ], { encoding: "utf8" });
  return parseFloat(out.trim()) || 0;
}

const GAP = 0.45; // pause between the German word and its Persian explanation
const LEAD = 0.2; // pause before a clip starts within its scene
const SCENE_PAD = 0.7; // breathing room after the explanation, before the next scene

let voiceParts = null; // { hookFile, tips: [{deFile, faFile, deDur, faDur}], outroFile } once synthesised

try {
  if (process.env.VOICE === "on") {
    const vo = narrationFor(pack.id);
    if (!vo) throw new Error(`no narration for "${pack.id}"`);
    const voiceDir = "music/voice";
    mkdirSync(voiceDir, { recursive: true });
    try {
      const hookFile = `${voiceDir}/german-${pack.id}-hook.mp3`;
      ttsSynthesize(minimaxSpeakable(vo.hook), null, hookFile);
      const hookDur = ffprobeDuration(hookFile);

      const tips = [];
      for (let i = 0; i < unit.items.length; i++) {
        const deFile = `${voiceDir}/german-${pack.id}-de${i}.mp3`;
        const faFile = `${voiceDir}/german-${pack.id}-fa${i}.mp3`;
        ttsSynthesize(unit.items[i].de, "German", deFile);
        ttsSynthesize(minimaxSpeakable(vo.steps[i]), null, faFile);
        tips.push({ deFile, faFile, deDur: ffprobeDuration(deFile), faDur: ffprobeDuration(faFile) });
      }

      const outroFile = `${voiceDir}/german-${pack.id}-outro.mp3`;
      ttsSynthesize(minimaxSpeakable(vo.outro), null, outroFile);
      const outroDur = ffprobeDuration(outroFile);

      voiceParts = { hookFile, hookDur, tips, outroFile, outroDur };

      const MIN_TIP = 2.5;
      pack.hookDuration = +Math.max(3.0, hookDur + LEAD + 0.8).toFixed(3);
      pack.tipDurations = tips.map((t) => +Math.max(MIN_TIP, LEAD + t.deDur + GAP + t.faDur + SCENE_PAD).toFixed(3));
      pack.outroDuration = +Math.max(3.6, outroDur + 1.0).toFixed(3);
      pack.duration = +(pack.hookDuration + pack.tipDurations.reduce((a, d) => a + d, 0) + pack.outroDuration).toFixed(3);
      pack.music = pack.music.replace(/.m4a$/, "-vo.m4a");
      console.log(`   timing follows speech (incl. German pronunciation): ${pack.duration}s`);
    } catch (e) {
      console.error("   ✗ voice planning failed, using the beat grid:", String(e.message).split(String.fromCharCode(10))[0]);
      voiceParts = null;
      if (process.env.REQUIRE_VOICE === "on") throw e;
    }
  }

  // One real photo per vocabulary item — not one shared photo for the whole
  // episode (rescuePackPhotos() reuses a single search for a whole pack,
  // which fits an app-feature video but not four different words).
  for (let i = 0; i < unit.items.length; i++) {
    const item = unit.items[i];
    const found = await findLessonImage(item.img, item.fa);
    if (!found) {
      throw Object.assign(
        new Error(`هیچ عکس واقعی و مرتبطی برای «${item.de} — ${item.fa}» پیدا نشد`),
        { kind: "visualQc" },
      );
    }
    pack.tips[i].photo = found.photo;
    pack.tips[i].photoAlt = found.alt;
    pack.tips[i].photoFocus = "subject-wide";
    // A real vocabulary photo is never device-shaped, so lib/build-ink.mjs's
    // usual native-aspect-ratio "panel" (sized to whatever the source photo
    // happens to be — often a wide 4:3/16:9 web photo) rendered small,
    // horizontal and high up on the vertical canvas (owner report
    // 2026-09-10). photoAspect forces a fixed portrait ratio instead; the
    // frame's own object-fit:cover crops the source photo into it cleanly.
    pack.tips[i].photoAspect = 0.75;
  }
  assertVisualProof(pack);

  const comp = `${compDir}/${pack.id}.html`;
  writeFileSync(comp, buildInkHTML(pack));

  const cutTimes = (() => {
    const lens = pack.tipDurations;
    const out = [pack.hookDuration];
    let acc = pack.hookDuration;
    for (const L of lens) { acc += L; out.push(+acc.toFixed(3)); }
    return out;
  })();

  let music = pack.music;
  if (pack.duration && pack.musicVariant) {
    execSync(
      `node music/make-one.mjs ${pack.duration} ${pack.musicVariant} "${pack.music}" ${pack.musicOutroBars || 4}`,
      { stdio: "inherit", env: { ...process.env, MUSIC_CUTS: cutTimes.join(","), MUSIC_MOOD: pack.mood || "", MUSIC_BPM: String(pack.bpm || ""), MUSIC_ACCENTS: accentSpec(cutTimes, ["", "", "", "", ""]) } }
    );
  }
  if (!existsSync(music)) music = "music/bed-60s-v1.m4a";

  let voice = null;
  if (voiceParts) {
    const vFile = `music/voice/german-${pack.id}.m4a`;
    try {
      // Place each already-synthesised clip at its measured offset in the
      // final track — same adelay+amix technique make-voice.mjs uses for a
      // single line per scene, extended to two clips (German, then Persian)
      // per tip scene.
      const parts = [{ file: voiceParts.hookFile, at: LEAD }];
      let sceneStart = pack.hookDuration;
      for (let i = 0; i < voiceParts.tips.length; i++) {
        const t = voiceParts.tips[i];
        parts.push({ file: t.deFile, at: sceneStart + LEAD });
        parts.push({ file: t.faFile, at: sceneStart + LEAD + t.deDur + GAP });
        sceneStart += pack.tipDurations[i];
      }
      parts.push({ file: voiceParts.outroFile, at: sceneStart + LEAD });

      const inputs = parts.flatMap((p) => ["-i", p.file]);
      const delays = parts
        .map((p, i) => `[${i + 1}:a]adelay=${Math.round(p.at * 1000)}|${Math.round(p.at * 1000)}[v${i}]`)
        .join(";");
      const mixIns = parts.map((_, i) => `[v${i}]`).join("");
      const filter =
        `${delays};[0:a]${mixIns}amix=inputs=${parts.length + 1}:duration=first:normalize=0[m];` +
        `[m]loudnorm=I=-16:TP=-2:LRA=11[out]`;
      execFileSync("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-t", String(pack.duration), "-i", "anullsrc=r=44100:cl=stereo",
        ...inputs,
        "-filter_complex", filter, "-map", "[out]",
        "-c:a", "aac", "-b:a", "192k", vFile,
      ], { stdio: "inherit" });

      for (const p of parts) if (existsSync(p.file)) unlinkSync(p.file);
      if (existsSync(vFile)) voice = vFile;
      if (!voice && process.env.REQUIRE_VOICE === "on") {
        throw new Error(`Narration did not render for "${pack.id}"`);
      }
    } catch (e) {
      console.error("   ✗ voice assembly failed, continuing music-only:", String(e.message).split(String.fromCharCode(10))[0]);
      if (process.env.REQUIRE_VOICE === "on") throw e;
    }
  }

  const silent = `${outDir}/${pack.id}-silent.mp4`;
  const final = `${outDir}/german-a1-${pack.id}-${iso}.mp4`;
  execSync(`${HF} render -c "${comp}" --quality high --fps 30 --skill=faceless-explainer -o "${silent}"`, { stdio: "inherit" });
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

  // Same 30-day duplicate control every other daily video goes through —
  // a fixed curriculum should never actually collide, but the check is
  // cheap insurance against a progress-counter bug repeating an episode.
  const print = fingerprint(pack);
  const dup = check(print);
  if (dup.verdict === "DUPLICATE" && process.env.ALLOW_DUPLICATE !== "1") {
    throw Object.assign(new Error(`تکراری (${dup.score}) — قسمت «${dup.closest?.id}» قبلاً رفته است`), { kind: "duplicate" });
  }

  if (tg.enabled) {
    const res = await sendVideo({ token: tg.token, chatId: tg.chatId, file: final, caption: pack.tgTitle });
    console.log("   ✈ sent to Telegram");
    if (res && res.message_id) {
      register({ ...print, messageId: res.message_id, kind: "german-lesson", sentAt: new Date().toISOString() });
      saveProgress(idx + 1);
      console.log(`   → next episode: ${idx + 2} (${germanUnitAt(idx + 1).topic})`);
    }
  } else if (!noTelegram) {
    throw new Error("Telegram is not configured; refusing to mark a local-only render as delivered.");
  } else {
    saveProgress(idx + 1);
  }

  console.log(`\n✅ episode ${episodeNo} ready: ${resolve(final)}`);
} catch (err) {
  console.error(`   ✗ episode ${episodeNo} (${unit.id}) failed: ${err.message}`);
  if (tg.enabled) {
    try {
      await sendMessage({
        token: tg.token, chatId: tg.chatId,
        text: `⚠ قسمت ${episodeNo} آموزش آلمانی ساخته نشد.\n\nعلت: ${err.message}`,
      });
    } catch {}
  }
  process.exit(1);
}
