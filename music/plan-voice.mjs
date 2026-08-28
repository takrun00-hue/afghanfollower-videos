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
import { minimaxSpeakable } from "../lib/pronounce.mjs";

process.chdir(dirname(dirname(fileURLToPath(import.meta.url))));

const featureId = process.argv[2];
const requestedTips = Math.max(1, Number(process.argv[3]) || 4);
const vo = narrationFor(featureId);
if (!vo) { console.log(JSON.stringify({ ok: false })); process.exit(0); }

const TTS = "music/minimax-tts.mjs";
// Cached MiniMax lines must belong to the selected voice. Reusing a file named
// only after the feature silently kept the previous speaker after the user
// chose another Voice ID in Telegram.
// The profile is part of the cache key. Otherwise a new speed/pitch setting
// silently reuses last week's slow MP3 files.
const voiceKey = `${process.env.MINIMAX_VOICE_ID || "default"}-${process.env.TTS_PROFILE || "fa-natural-v3"}`
  .replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 96);

mkdirSync("music/voice", { recursive: true });

function dur(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
  ]).toString().trim();
  return Number(out) || 0;
}

// Only synthesise lines that will actually be on screen. Generating unseen
// cards wastes MiniMax balance and makes a short bulletin needlessly slow.
const texts = [vo.hook, ...vo.steps.slice(0, requestedTips), vo.outro];
const files = [], durs = [];
for (let i = 0; i < texts.length; i++) {
  const f = `music/voice/${featureId}-${voiceKey}-minimax-line${i}.mp3`;
  if (!existsSync(f)) {
    execFileSync("node", [TTS, minimaxSpeakable(texts[i]), "-o", f], {
      stdio: ["ignore", "ignore", "inherit"],
    });
  }
  files.push(f);
  durs.push(dur(f));
}

console.log(JSON.stringify({ ok: true, featureId, files, durs }));
