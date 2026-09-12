// Generates the narration lines, measures each one, and prints a timing plan.
// Scene lengths then follow the SPEECH instead of a fixed grid — which is the
// only way the caption on screen and the words being spoken stay together.
//
// Usage: node music/plan-voice.mjs <feature-id>   -> JSON on stdout
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { narrationFor } from "../lib/narration.mjs";
import { minimaxSpeakable, pocketSpeakable } from "../lib/pronounce.mjs";
import { narrationLineCheck } from "../lib/voice-settings.mjs";

process.chdir(dirname(dirname(fileURLToPath(import.meta.url))));

const featureId = process.argv[2];
const requestedTips = Math.max(1, Number(process.argv[3]) || 4);
const vo = narrationFor(featureId);
if (!vo) { console.log(JSON.stringify({ ok: false })); process.exit(0); }

// TTS_ENGINE=pocket switches to the local, free pocket-tts pipeline (see
// music/pocket-tts.mjs) instead of the paid MiniMax API. Default stays
// MiniMax — pocket-tts is a 2026-09-07 prototype, not yet load-bearing.
const ENGINE = process.env.TTS_ENGINE === "pocket" ? "pocket" : "minimax";
const speakable = ENGINE === "pocket" ? pocketSpeakable : minimaxSpeakable;
const TTS = ENGINE === "pocket" ? "music/pocket-tts.mjs" : "music/minimax-tts.mjs";
// Cached MiniMax lines must belong to the selected voice. Reusing a file named
// only after the feature silently kept the previous speaker after the user
// chose another Voice ID in Telegram.
// The profile is part of the cache key. Otherwise a new speed/pitch setting
// silently reuses last week's slow MP3 files.
const voiceKey = `${process.env.MINIMAX_VOICE_ID || "default"}-${process.env.TTS_PROFILE || "fa-natural-v6"}`
  .replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 96);
// The engine name is part of the cache filename too (not just voiceKey), so
// switching TTS_ENGINE never reuses — or is mistaken for — the other
// engine's cached line, even when neither MINIMAX_VOICE_ID nor TTS_PROFILE
// changed.

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
const spokenLines = texts.map(speakable);
// The spoken-copy hash belongs in the cache key.  A pronunciation correction
// must always create fresh audio; reusing a line by feature ID alone would
// silently ship yesterday's mispronounced MP3 with today's corrected text.
const copyKey = createHash("sha256").update(spokenLines.join("\n")).digest("hex").slice(0, 12);
const files = spokenLines.map((_, i) => `music/voice/${featureId}-${voiceKey}-${ENGINE}-${copyKey}-line${i}.mp3`);

function synthesizeMissing() {
  for (let i = 0; i < texts.length; i++) {
    const spoken = spokenLines[i];
    const issues = narrationLineCheck(spoken);
    if (issues.length) {
      console.error(`Narration QC failed for line ${i + 1}: ${issues.join(", ")}`);
      process.exit(1);
    }
    const f = files[i];
    if (!existsSync(f)) {
      execFileSync("node", [TTS, spoken, "-o", f], {
        stdio: ["ignore", "ignore", "inherit"],
      });
    }
  }
}

synthesizeMissing();

// This gate examines the exact per-line audio cached above — not a separately
// generated audition. A single retry is allowed because MiniMax synthesis is
// non-deterministic; a second ASR failure is a release failure, never a silent
// music-only fallback.
if (process.env.NARRATION_QC !== "off") {
  const manifest = `music/voice/${featureId}-${voiceKey}-${ENGINE}-${copyKey}-qc.json`;
  const writeManifest = () => writeFileSync(manifest, JSON.stringify({
    featureId,
    entries: texts.map((written, i) => ({ written, spoken: spokenLines[i], file: files[i] })),
  }, null, 2));
  let passed = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    writeManifest();
    try {
      execFileSync("node", ["music/voice-qc.mjs", "--manifest", manifest], { stdio: "inherit" });
      passed = true;
      break;
    } catch {
      if (attempt === 2) break;
      console.error("Narration ASR QC rejected this take; synthesizing one fresh take.");
      for (const f of files) rmSync(f, { force: true });
      synthesizeMissing();
    }
  }
  if (!passed) {
    console.error("Narration ASR QC failed twice; this video is blocked before visual rendering.");
    process.exit(1);
  }
}

const durs = [];
for (const f of files) {
  durs.push(dur(f));
}

console.log(JSON.stringify({ ok: true, featureId, files, durs }));
