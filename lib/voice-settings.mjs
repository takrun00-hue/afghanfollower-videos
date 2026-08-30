import { renameSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";

// The narration settings that were chosen by ear, in one place.
//
// They were previously chosen in audition scripts and never written down, so
// `minimax-tts.mjs` kept its own defaults — happy, pitch 1, speed 1.1 — and
// every rendered video used the reading that was listened to and rejected as
// robotic. A setting that is approved by ear and lives only in a scratch script
// is not approved in anything that ships.
//
// Change these only after a listening test says to, and record the test in
// VOICE-LOG.md. An environment variable still wins, so an audition can try
// something without editing the locked values.

export const APPROVED = {
  // MiniMax has no Persian voice. This is an Arabic timbre carrying Persian
  // words through language_boost. Turkish was auditioned and heard as robotic.
  voiceId: "Arabic_CalmWoman",
  // "happy" and its louder reading were both heard as robotic. "surprised"
  // carries the energy the channel wants. The API accepts only happy, sad,
  // angry, fearful, disgusted, surprised, neutral and calm.
  emotion: "surprised",
  // 1.1 ran the phrases together — «تند تند پشت هم». Slower reads as a person
  // talking rather than an announcer clearing a script.
  speed: 0.95,
  // Whole numbers only. 3, not 2: measured against the five reference speakers
  // the channel is compared against, pitch 3 widens the range the voice travels
  // from 8.1 to 12.4 semitones, which is where a human reading starts. 4 and 5
  // are worse, not better — the voice tightens again above 3.
  pitch: 3,
  vol: 1,
  model: "speech-2.8-hd",
  languageBoost: "Persian",
};

/** Approved values, with environment overrides for auditions. */
export function voiceSettings(env = process.env) {
  return {
    voiceId: env.MINIMAX_VOICE_ID || APPROVED.voiceId,
    emotion: env.MINIMAX_EMOTION || APPROVED.emotion,
    speed: Number(env.VOICE_SPEED || APPROVED.speed),
    pitch: Math.round(Number(env.MINIMAX_VOICE_PITCH ?? APPROVED.pitch)),
    vol: Number(env.MINIMAX_VOICE_VOL || APPROVED.vol),
    model: env.MINIMAX_TTS_MODEL || APPROVED.model,
    languageBoost: APPROVED.languageBoost,
  };
}

/** The request body MiniMax expects, so every caller sends the same shape. */
export function ttsBody(text, s = voiceSettings()) {
  return {
    model: s.model,
    text,
    stream: false,
    language_boost: s.languageBoost,
    output_format: "hex",
    voice_setting: {
      voice_id: s.voiceId,
      speed: s.speed,
      vol: s.vol,
      pitch: s.pitch,
      emotion: s.emotion,
    },
    audio_setting: { sample_rate: 44100, bitrate: 128000, format: "mp3", channel: 1 },
  };
}

// MiniMax pads every clip with silence at both ends and leaves a long gap at
// each comma. Measured against the five reference speakers this channel is
// compared against, that put the narration at 70 voiced frames a second against
// their 74-78, with a third of the track silent against their quarter.
//
// Trimming the ends and capping any interior silence at 0.22s — a real breath,
// and about the length a person actually takes — brings both inside the human
// range without removing the breaths. It belongs with the settings because it
// is part of the approved delivery, and it has to run at the moment a clip is
// written: plan-voice and the render both measure these files, and trimming
// later would leave the scene timings disagreeing with the audio.
export function trimDeadAir(file) {
  const tmp = `${file}.trim.mp3`;
  try {
    execFileSync("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error", "-i", file,
      "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05"
        + ":stop_periods=-1:stop_threshold=-45dB:stop_silence=0.22",
      "-c:a", "libmp3lame", "-b:a", "128k", tmp,
    ]);
    // A clip that will not trim is still a usable clip; keep the original
    // rather than losing the line.
    if (statSync(tmp).size > 1024) renameSync(tmp, file);
    else rmSync(tmp, { force: true });
  } catch {
    rmSync(tmp, { force: true });
  }
}

/** Whether a set of settings differs from what the ear approved. */
export function drift(s = voiceSettings()) {
  const out = [];
  for (const [k, want] of Object.entries(APPROVED)) {
    if (k === "vol" || k === "model" || k === "languageBoost") continue;
    if (s[k] !== want) out.push(`${k}: ${s[k]} (approved: ${want})`);
  }
  return out;
}
