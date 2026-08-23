// Generates the narration lines, measures each one, and prints a timing plan.
// Scene lengths then follow the SPEECH instead of a fixed grid — which is the
// only way the caption on screen and the words being spoken stay together.
//
// Usage: node music/plan-voice.mjs <feature-id>   -> JSON on stdout
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { narrationFor } from "../lib/narration.mjs";
import { sayable } from "../lib/pronounce.mjs";

process.chdir(dirname(dirname(fileURLToPath(import.meta.url))));

const featureId = process.argv[2];
const vo = narrationFor(featureId);
if (!vo) { console.log(JSON.stringify({ ok: false })); process.exit(0); }

const TTS = process.env.TTS_SCRIPT ||
  "C:/Users/mohse/.claude/skills/media-use/audio/scripts/heygen-tts.mjs";
const VOICE = process.env.VOICE_ID || "330290724a1b470fb63153f34d4c0183";
const SPEED = process.env.VOICE_SPEED || "1.0";

mkdirSync("music/voice", { recursive: true });

function dur(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
  ]).toString().trim();
  return Number(out) || 0;
}

const texts = [vo.hook, ...vo.steps, vo.outro];
const files = [], durs = [];
for (let i = 0; i < texts.length; i++) {
  const f = `music/voice/${featureId}-line${i}.mp3`;
  if (!existsSync(f)) {
    execFileSync("node", [TTS, sayable(texts[i]), "-o", f, "--voice", VOICE, "--speed", SPEED], {
      stdio: ["ignore", "ignore", "inherit"],
    });
  }
  files.push(f);
  durs.push(dur(f));
}

console.log(JSON.stringify({ ok: true, featureId, files, durs }));
