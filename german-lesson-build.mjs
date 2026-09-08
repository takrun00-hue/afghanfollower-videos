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
// Animated, cartoon-style (mascot + flat icons), same as STYLE=cartoon
// elsewhere in this project: a language lesson has no "real screenshot" to
// show, so the Visual Truth Gate does not apply here, exactly as it already
// does not apply to the cartoon mascot style.
import { execSync, execFileSync } from "node:child_process";
import { writeFileSync, existsSync, readFileSync, mkdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildCartoonHTML } from "./lib/build-cartoon.mjs";
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

const HOOK_DUR = 4, TIP_DUR = 4, OUTRO_DUR = 5;
const pack = {
  id: unit.id,
  platform: "news",
  feature: `آموزش آلمانی A1 — قسمت ${episodeNo}`,
  title: `آموزش آلمانی A1 — قسمت ${episodeNo}: ${unit.topic}`,
  hook: { ask: unit.hook, l1: "آموزش آلمانی A1", l2: `قسمت ${episodeNo}` },
  // Each on-screen card shows the German word/phrase AND its Persian
  // meaning; the spoken narration (lib/narration.mjs, VO[unit.id]) stays
  // Persian-only, so the German is read by the viewer, never mispronounced
  // by the TTS voice.
  tips: unit.items.map((it) => ({ text: `${it.de}\n${it.fa}` })),
  outroAsk: `قسمت بعد: ${nextUnit.topic}`,
  payoff: "چهار کلمهٔ تازهٔ آلمانی یاد گرفتی — سطح A1.",
  tgTitle: `🇩🇪 آموزش آلمانی A1 | قسمت ${episodeNo}: ${unit.topic}\n\n#آلمانی #A1 #زبان_آلمانی #GapMedia`,
  mood: "calm",
  bpm: 92,
  musicVariant: "v1",
  music: "music/bed-60s-v1.m4a",
  musicOutroBars: 4,
  hookDuration: HOOK_DUR,
  tipDurations: [TIP_DUR, TIP_DUR, TIP_DUR, TIP_DUR],
  outroDuration: OUTRO_DUR,
  duration: HOOK_DUR + TIP_DUR * 4 + OUTRO_DUR,
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

  const comp = `${compDir}/${pack.id}.html`;
  writeFileSync(comp, buildCartoonHTML(pack));

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
