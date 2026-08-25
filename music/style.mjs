// Single source of truth for a seed's musical identity.
// Both the synth (which renders the audio) and the composition builder (which
// places the cuts) read this, so every cut still lands on a beat even though the
// tempo now comes from the chosen style rather than a fixed table.
import { bpmFor } from "./mood.mjs";

export const STYLES = ["uplift", "lofi", "cinematic", "percussive", "trap", "corporate"];

const TEMPO = {
  uplift: [124, 132],
  lofi: [78, 92],
  cinematic: [70, 84],
  percussive: [100, 112],
  trap: [68, 80],
  corporate: [104, 116],
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function styleFor(seed, mood) {
  // Tempo comes from music/mood.mjs so the composition's cut times and the
  // rendered audio can never disagree — there is exactly one bpm function.
  const bpm = bpmFor(seed, mood);
  return { style: mood || "play", bpm, beat: 60 / bpm };
}

// Slow styles need fewer beats to fill the same wall-clock time, so the section
// lengths are derived from the tempo instead of being hard-coded.
export function beatPlan(seed, targetSeconds, tipCount, mood) {
  const { beat } = styleFor(seed, mood);
  const total = Math.max(8, Math.round(targetSeconds / beat));
  const hook = Math.max(3, Math.round(total * 0.16));
  const outro = Math.max(3, Math.round(total * 0.2));
  const tip = Math.max(2, Math.floor((total - hook - outro) / tipCount));
  return { beat, hook, tip, outro, duration: +((hook + tip * tipCount + outro) * beat).toFixed(3) };
}
