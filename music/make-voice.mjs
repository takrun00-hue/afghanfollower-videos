// Persian voiceover for one video, laid out on the scene timings.
// Uses MiniMax TTS with a Persian account voice. The API key and voice ID stay
// in environment variables, never in source code.
//
// Usage: node music/make-voice.mjs <feature-id> <hookDur> <tipDur> <tipCount> <outroAt> <total> <out.m4a>
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { narrationFor } from "../lib/narration.mjs";
import { minimaxSpeakable } from "../lib/pronounce.mjs";

process.chdir(dirname(dirname(fileURLToPath(import.meta.url))));

const argv = process.argv.slice(2);
// --tips a,b,c,d gives each scene its own measured length
let tipList = null;
const ti = argv.indexOf("--tips");
if (ti >= 0) { tipList = argv[ti + 1].split(",").map(Number); argv.splice(ti, 2); }
const [featureId, hookDur, tipDur, tipCount, outroAt, total, out] = argv;
if (!featureId || !out) {
  console.error("usage: make-voice.mjs <feature-id> <hookDur> <tipDur> <tipCount> <outroAt> <total> <out.m4a>");
  process.exit(1);
}
const HOOK = Number(hookDur), TIP = Number(tipDur), N = Number(tipCount);
const OUT_AT = Number(outroAt), TOTAL = Number(total);

const vo = narrationFor(featureId);
if (!vo) { console.log(`  no narration for ${featureId} — silent`); process.exit(0); }

const TTS = "music/minimax-tts.mjs";
const voiceKey = String(process.env.MINIMAX_VOICE_ID || "default")
  .replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 96);

mkdirSync("music/voice", { recursive: true });

const lines = [
  { text: vo.hook, at: 0.3 },
  ...vo.steps.slice(0, N).map((t, i) => ({
    text: t,
    // start of scene i, using the measured lengths when we have them
    at: (tipList ? HOOK + tipList.slice(0, i).reduce((a, d) => a + d, 0) : HOOK + i * TIP) + 0.2,
  })),
  { text: vo.outro, at: OUT_AT + 0.35 },
];

const parts = [];
for (let i = 0; i < lines.length; i++) {
  // Reuse the exact audio that plan-voice measured for the scene duration.
  // Re-synthesising here can vary the length slightly and makes a sentence run
  // into the next slide.
  const f = `music/voice/${featureId}-${voiceKey}-minimax-line${i}.mp3`;
  if (!existsSync(f)) {
    execFileSync("node", [TTS, minimaxSpeakable(lines[i].text), "-o", f], {
      stdio: ["ignore", "ignore", "inherit"],
    });
  }
  parts.push({ file: f, at: lines[i].at });
}

// place each line at its scene on one bed of the video's exact length
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
  "-f", "lavfi", "-t", String(TOTAL), "-i", "anullsrc=r=44100:cl=stereo",
  ...inputs,
  "-filter_complex", filter, "-map", "[out]",
  "-c:a", "aac", "-b:a", "192k", out,
], { stdio: "inherit" });

for (const p of parts) if (existsSync(p.file)) unlinkSync(p.file);
console.log(`  voice -> ${out} (${parts.length} lines)`);
