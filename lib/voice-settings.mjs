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
  // Whole numbers only.
  pitch: 2,
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

/** Whether a set of settings differs from what the ear approved. */
export function drift(s = voiceSettings()) {
  const out = [];
  for (const [k, want] of Object.entries(APPROVED)) {
    if (k === "vol" || k === "model" || k === "languageBoost") continue;
    if (s[k] !== want) out.push(`${k}: ${s[k]} (approved: ${want})`);
  }
  return out;
}
