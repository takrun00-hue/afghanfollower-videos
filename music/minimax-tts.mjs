// MiniMax Persian text-to-speech adapter.
// The API key is read only from MINIMAX_API_KEY; it is never logged or written
// into a composition, manifest, or Git repository.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const argv = process.argv.slice(2);
const outAt = argv.indexOf("-o");
const text = argv.slice(0, outAt < 0 ? argv.length : outAt).join(" ").trim();
const output = outAt >= 0 ? argv[outAt + 1] : "";
if (!text || !output) {
  console.error("usage: minimax-tts.mjs <text> -o <output.mp3>");
  process.exit(1);
}

const apiKey = process.env.MINIMAX_API_KEY || "";
const voiceId = process.env.MINIMAX_VOICE_ID || "";
if (!apiKey) {
  console.error("MINIMAX_API_KEY is not set. Add it to .env locally and to GitHub Actions secrets.");
  process.exit(1);
}
if (!voiceId) {
  console.error("MINIMAX_VOICE_ID is not set. Run node music/minimax-voices.mjs after adding the key, then choose a Persian voice.");
  process.exit(1);
}

const response = await fetch(process.env.MINIMAX_TTS_ENDPOINT || "https://api.minimax.io/v1/t2a_v2", {
  method: "POST",
  headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
  body: JSON.stringify({
    model: process.env.MINIMAX_TTS_MODEL || "speech-2.8-hd",
    text,
    stream: false,
    language_boost: "Persian",
    output_format: "hex",
    voice_setting: {
      voice_id: voiceId,
      // 0.96 made Persian sentence endings unnaturally long. A small lift keeps
      // the delivery lively without turning it into a rushed announcer voice.
      speed: Number(process.env.VOICE_SPEED || 1.1),
      vol: 1,
      // MiniMax requires a whole-number pitch. Keep the default neutral: the
      // small speed lift above supplies clarity without an artificial tone.
      pitch: Math.round(Number(process.env.MINIMAX_VOICE_PITCH || 0)),
    },
    audio_setting: { sample_rate: 44100, bitrate: 128000, format: "mp3", channel: 1 },
  }),
});
const data = await response.json().catch(() => ({}));
if (!response.ok || data?.base_resp?.status_code !== 0 || !data?.data?.audio) {
  console.error(`MiniMax TTS failed: ${data?.base_resp?.status_msg || response.status}`);
  process.exit(1);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, Buffer.from(data.data.audio, "hex"));
console.log(`  MiniMax voice -> ${output}`);
