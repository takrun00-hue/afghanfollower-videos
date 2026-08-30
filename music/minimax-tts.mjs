// MiniMax Persian text-to-speech adapter.
// The API key is read only from MINIMAX_API_KEY; it is never logged or written
// into a composition, manifest, or Git repository.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ttsBody, voiceSettings, drift } from "../lib/voice-settings.mjs";

const argv = process.argv.slice(2);
const outAt = argv.indexOf("-o");
const text = argv.slice(0, outAt < 0 ? argv.length : outAt).join(" ").trim();
const output = outAt >= 0 ? argv[outAt + 1] : "";
if (!text || !output) {
  console.error("usage: minimax-tts.mjs <text> -o <output.mp3>");
  process.exit(1);
}

const apiKey = process.env.MINIMAX_API_KEY || "";
if (!apiKey) {
  console.error("MINIMAX_API_KEY is not set. Add it to .env locally and to GitHub Actions secrets.");
  process.exit(1);
}

// Voice, emotion, speed and pitch come from lib/voice-settings.mjs, which holds
// the values a listening test approved. They used to be inlined here at values
// that were auditioned and rejected, so every render shipped the wrong reading.
const settings = voiceSettings();
const off = drift(settings);
if (off.length) console.warn(`  voice differs from the approved reading — ${off.join(", ")}`);

const response = await fetch(process.env.MINIMAX_TTS_ENDPOINT || "https://api.minimax.io/v1/t2a_v2", {
  method: "POST",
  headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
  body: JSON.stringify(ttsBody(text, settings)),
});
const data = await response.json().catch(() => ({}));
if (!response.ok || data?.base_resp?.status_code !== 0 || !data?.data?.audio) {
  console.error(`MiniMax TTS failed: ${data?.base_resp?.status_msg || response.status}`);
  process.exit(1);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, Buffer.from(data.data.audio, "hex"));
console.log(`  MiniMax voice -> ${output}`);
