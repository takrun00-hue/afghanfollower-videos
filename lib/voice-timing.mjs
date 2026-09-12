// A narration line is only publishable when its measured audio fits wholly
// inside its own scene.  This is deliberately based on the encoded clip's
// duration, never an estimate from its text: TTS can vary from take to take.
export function assertVoiceSchedule(parts, total, { gap = 0.12, tail = 0.45 } = {}) {
  const length = Number(total);
  if (!Number.isFinite(length) || length <= 0) throw new Error("Invalid video duration for narration schedule");
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const start = Number(p.at);
    const duration = Number(p.duration);
    if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) {
      throw new Error(`Narration line ${i + 1} has no measurable audio duration`);
    }
    const limit = i + 1 < parts.length ? Number(parts[i + 1].at) - gap : length - tail;
    if (start + duration > limit + 0.001) {
      const where = i + 1 < parts.length ? `the next scene` : `the end of the video`;
      throw new Error(`Narration line ${i + 1} would be cut off at ${where}; refusing to render a partial sentence`);
    }
  }
}
