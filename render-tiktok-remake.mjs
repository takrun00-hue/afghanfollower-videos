// Build + render the Persian TikTok-style remake of the reference video.
//   node render-tiktok-remake.mjs                  # 1080x1920, no music, voice only
//   node render-tiktok-remake.mjs --with-music     # add sidechain-ducked music bed
//   node render-tiktok-remake.mjs --voice=fa-IR-DilaraNeural
//   node render-tiktok-remake.mjs --4k
//
// Reads pack from lib/content.mjs (tiktokRemakePack()), derives the timing
// from pack.duration / pack.hookDuration / pack.outroDuration, renders the
// silent master via Hyperframes, then muxes the Persian voiceover.
import { spawnSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildHTML } from "./lib/build.mjs";
import { tiktokRemakePack } from "./lib/content.mjs";
import { synthesize } from "./lib/edge-tts.mjs";

const projectDir = dirname(fileURLToPath(import.meta.url));
process.chdir(projectDir);

const args = process.argv.slice(2);
const is4k = args.includes("--4k");
const withMusic = args.includes("--with-music");
const force = args.includes("--force");
const voiceArg = args.find((a) => a.startsWith("--voice="));
const HF = "npx --yes hyperframes@0.8.16";
const resFlag = is4k ? "--resolution portrait-4k" : "";

const pack = tiktokRemakePack();
if (voiceArg) pack.voice.name = voiceArg.slice("--voice=".length);

const isDialogue = !!pack.dialogue;
// Choose voice for each narration line based on whether it's a dialogue
// turn (line[1..] follows tip[1..]) and which character speaks in that beat.
// The hook line is pack.voice.name; the outro line is also pack.voice.name.
// Each dialogue tip's speaker picks its configured Edge neural voice.
function voiceForLine(i) {
  if (!isDialogue) return pack.voice.name;
  if (i === 0 || i === pack.tips.length + 1) return pack.voice.name; // hook / outro
  const turn = pack.tips[i - 1];                 // i=1..tips.length
  const who = turn.speaker || "zahra";
  return (pack.dialogue[who] && pack.dialogue[who].voice) || pack.voice.name;
}

// Timeline derived from the pack so it stays in sync with the composition.
const TOTAL = pack.duration;
const HOOK  = pack.hookDuration;
const OUTRO = pack.outroDuration;
const n = pack.tips.length;
const TIP = (TOTAL - HOOK - OUTRO) / n;
const slot = (i) =>
  i === 0
    ? { start: 0, dur: HOOK }
    : i <= n
      ? { start: HOOK + (i - 1) * TIP, dur: TIP }
      : { start: HOOK + n * TIP, dur: OUTRO };

const outDir = "renders/tiktok-remake";
const voiceDir = `${outDir}/voice`;
mkdirSync(voiceDir, { recursive: true });

// 1) Silent master (video only) — reused unless --force.
const silent = `${outDir}/tiktok-remake-silent.mp4`;
if (!existsSync(silent) || is4k || force) {
  const compDir = "compositions/tiktok-remake";
  mkdirSync(compDir, { recursive: true });
  const comp = `${compDir}/index.html`;
  writeFileSync(comp, buildHTML(pack));
  console.log(`\n=== rendering silent master (${is4k ? "4K" : "1080p"}) ===`);
  execSync(
    `${HF} render -c "${comp}" --quality high --fps 30 ${resFlag} --skill=faceless-explainer -o "${silent}"`,
    { stdio: "inherit" }
  );
} else {
  console.log(`\n=== reusing silent master: ${silent} ===`);
}

// 2) Synthesize each Persian narration line.
console.log(`\n=== voiceover (per-speaker) ===`);
const lines = [];
for (let i = 0; i < pack.narration.length; i++) {
  const text = pack.narration[i];
  const voice = voiceForLine(i);
  const file = `${voiceDir}/line-${String(i).padStart(2, "0")}.mp3`;
  process.stdout.write(`  [tts ${i + 1}/${pack.narration.length}] (${voice}) ${text.slice(0, 44)}…`);
  const mp3 = await synthesize({ text, voice, rate: pack.voice.rate });
  writeFileSync(file, mp3);
  const dur = parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${file}"`,
      { encoding: "utf8" }
    ).trim()
  );
  const s = slot(i);
  // Compress gently into the slot — never speed up by more than 1.28x.
  const fit = Math.max(s.dur - 0.4, 1);
  const factor = dur > fit ? Math.min(dur / fit, 1.28) : 1;
  // Slight anchor within each section so the line hits the visual beat.
  const delay = Math.round((s.start + 0.15) * 1000);
  lines.push({ i, file, dur, factor, delay });
  console.log(` → ${dur.toFixed(2)}s (slot ${s.dur.toFixed(2)}s, atempo x${factor.toFixed(2)})`);
}

// 3) Mix audio. Voice first (independent graph), optional music ducking, then mux.
function runFfmpeg(args, label) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n✗ ffmpeg failed with exit ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

const voiceMix = `${outDir}/voice-mix.wav`;
const voiceInputs = [];
for (const l of lines) voiceInputs.push("-i", l.file);
const voiceFilters = lines.map(
  (l) =>
    `[${l.i}:a]aformat=sample_rates=44100:channel_layouts=stereo,` +
    `atempo=${l.factor.toFixed(4)},adelay=${l.delay}|${l.delay}[v${l.i}]`
);
voiceFilters.push(
  `[${lines.map((l) => `v${l.i}`).join("][")}]amix=inputs=${lines.length}:duration=longest:normalize=0,` +
    `apad,atrim=0:${TOTAL}[aout]`
);
runFfmpeg(
  [
    ...voiceInputs,
    "-filter_complex", voiceFilters.join(";"),
    "-map", "[aout]", "-ar", "44100", "-ac", "2",
    "-c:a", "pcm_s16le", "-t", String(TOTAL), "-y", voiceMix,
  ],
  `placing ${lines.length} Persian narration lines into the timeline`
);

let audioSource = voiceMix;
if (withMusic) {
  const music = existsSync(pack.music) ? pack.music : "music/bed-60s.m4a";
  const audioMix = `${outDir}/voice-mix.m4a`;
  runFfmpeg(
    [
      "-i", voiceMix, "-i", music,
      "-filter_complex",
      `[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=2[vmain][vside];` +
        `[1:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:${TOTAL},volume=0.85[music];` +
        `[music][vside]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=300[ducked];` +
        `[vmain][ducked]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:${TOTAL}[aout]`,
      "-map", "[aout]", "-c:a", "aac", "-b:a", "192k", "-t", String(TOTAL), "-y", audioMix,
    ],
    "ducking music under the voice"
  );
  audioSource = audioMix;
}

const final = `${outDir}/tiktok-remake.mp4`;
runFfmpeg(
  [
    "-i", silent, "-i", audioSource,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-t", String(TOTAL), "-movflags", "+faststart", "-y", final,
  ],
  `muxing voiceover → ${final}`
);

console.log(`\n✅ ${resolve(final)}\n`);
