// Synthesizes a 30s energetic modern electronic bed (royalty-free, generated).
// Writes music/bed.wav (44.1kHz, 16-bit stereo). Swap freely with any track.
import { writeFileSync } from "node:fs";

const DUR = Number(process.argv[2]) || 30;
const VAR = Number(process.argv[3]) || 1;   // 1..3 → different mood/tempo/progression
const SR = 44100, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);

// three musical variants for daily rotation
const VARIANTS = {
  1: { bpm: 125, roots: [57, 53, 60, 55], types: ["min", "maj", "maj", "maj"] }, // Am F C G — energetic
  2: { bpm: 128, roots: [60, 55, 57, 53], types: ["maj", "maj", "min", "maj"] }, // C G Am F — bright/pop
  3: { bpm: 120, roots: [57, 55, 53, 55], types: ["min", "maj", "maj", "maj"] }, // Am G F G — uplifting
};
const V = VARIANTS[VAR] || VARIANTS[1];
const BPM = V.bpm, beat = 60 / BPM, bar = beat * 4;

const nf = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi -> Hz

function env(t, a, d, s, r, dur) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  if (t < dur) return s * (1 - (t - (dur - r)) / r);
  return 0;
}
function add(buf, start, dur, fn) {
  const s = Math.floor(start * SR), e = Math.min(N, Math.floor((start + dur) * SR));
  for (let i = s; i < e; i++) buf[i] += fn((i - s) / SR);
}
function stereo(start, dur, fn, pan = 0) {
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  add(L, start, dur, (t) => fn(t) * gl);
  add(R, start, dur, (t) => fn(t) * gr);
}
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));
const sq = (ph) => (ph % 1 < 0.5 ? 1 : -1);

// --- instruments ---
function kick(start) {
  stereo(start, 0.34, (t) => {
    const f = 120 * Math.exp(-t * 22) + 45;
    const e = Math.exp(-t * 7.5);
    return Math.sin(2 * Math.PI * f * t) * e * 0.95;
  });
}
function clap(start) {
  stereo(start, 0.18, (t) => {
    const e = Math.exp(-t * 26) * (t < 0.01 ? t / 0.01 : 1);
    return (Math.random() * 2 - 1) * e * 0.4;
  });
}
function hat(start, open = false) {
  const d = open ? 0.12 : 0.045;
  stereo(start, d, (t) => (Math.random() * 2 - 1) * Math.exp(-t * (open ? 26 : 70)) * 0.22, 0.15);
}
function bass(start, dur, midi) {
  const f = nf(midi);
  stereo(start, dur, (t) => {
    const e = env(t, 0.006, 0.05, 0.85, 0.06, dur);
    let s = saw(f * t) * 0.6 + Math.sin(2 * Math.PI * f * t) * 0.5;
    // simple lowpass-ish via soft clip + attenuate highs
    return Math.tanh(s * 1.4) * e * 0.5;
  });
}
function pluck(start, dur, midi, pan) {
  const f = nf(midi);
  stereo(start, dur, (t) => {
    const e = env(t, 0.004, 0.08, 0.25, 0.08, dur);
    const s = (saw(f * t) * 0.5 + sq(f * t) * 0.25);
    return s * e * 0.22;
  }, pan);
}
function lead(start, dur, midi, pan = 0) {
  const f = nf(midi);
  stereo(start, dur, (t) => {
    const vib = 1 + Math.sin(2 * Math.PI * 5 * t) * 0.004;
    const e = env(t, 0.02, 0.1, 0.7, 0.12, dur);
    return (saw(f * vib * t) * 0.5 + Math.sin(2 * Math.PI * f * t) * 0.4) * e * 0.26;
  }, pan);
}
function riser(start, dur) {
  stereo(start, dur, (t) => {
    const f = 200 + 1800 * (t / dur);
    const e = (t / dur) * (t / dur);
    return (Math.random() * 2 - 1) * 0.15 * e + Math.sin(2 * Math.PI * f * t) * 0.05 * e;
  });
}

// --- progression from the selected variant (4 chords, 1 bar each) ---
function makeChord(root, type) {
  const third = root + (type === "min" ? 3 : 4);
  const fifth = root + 7;
  return { bassN: root - 12, chord: [root, third, fifth], arp: [root, third, fifth, root + 12] };
}
const prog = V.roots.map((r, i) => makeChord(r, V.types[i]));

const nBars = Math.floor(DUR / bar); // ~15
for (let b = 0; b < nBars; b++) {
  const t0 = b * bar;
  const p = prog[b % 4];
  const intro = b < 1;          // lighter first bar
  const full = b >= 2;          // full energy after 2 bars

  // drums
  for (let k = 0; k < 4; k++) {
    const bt = t0 + k * beat;
    if (!intro) kick(bt);
    if (!intro && (k === 1 || k === 3)) clap(bt);
    // hats on 8ths
    hat(bt, false);
    hat(bt + beat / 2, k === 2 && full);
  }

  // bass (root, eighth-note pulse)
  for (let k = 0; k < 8; k++) if (!intro) bass(t0 + k * (beat / 2), beat / 2 * 0.9, p.bassN);

  // arp plucks (8ths, alternating pan)
  for (let k = 0; k < 8; k++) {
    const note = p.arp[k % p.arp.length] + 12;
    pluck(t0 + k * (beat / 2), beat / 2 * 0.85, note, k % 2 ? 0.35 : -0.35);
  }

  // lead melody on the full sections (quarter notes, follows chord top)
  if (full) {
    const mel = [p.chord[2] + 12, p.chord[1] + 12, p.chord[2] + 12, p.chord[0] + 24];
    for (let k = 0; k < 4; k++) lead(t0 + k * beat, beat * 0.9, mel[k], (k % 2 ? 0.2 : -0.2));
  }

  // riser into every 4th bar (build)
  if (b % 4 === 3 && b < nBars - 1) riser(t0 + beat * 3, beat);
}

// final downbeat hit + tail
kick(nBars * bar);
for (const n of prog[0].chord) lead(nBars * bar, 0.9, n + 12, 0);

// --- master: gentle limiter + global fade in/out ---
function finalize(buf) {
  const fin = 0.25 * SR, fout = 0.8 * SR;
  for (let i = 0; i < N; i++) {
    let s = buf[i] * 0.9;
    s = Math.tanh(s * 1.15); // soft limiter
    if (i < fin) s *= i / fin;
    if (i > N - fout) s *= (N - i) / fout;
    buf[i] = s;
  }
}
finalize(L); finalize(R);

// --- write 16-bit stereo WAV ---
const bytes = N * 4;
const buf = Buffer.alloc(44 + bytes);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + bytes, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(bytes, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  const cl = Math.max(-1, Math.min(1, L[i])), cr = Math.max(-1, Math.min(1, R[i]));
  buf.writeInt16LE((cl * 32767) | 0, o); o += 2;
  buf.writeInt16LE((cr * 32767) | 0, o); o += 2;
}
writeFileSync(`music/bed-${DUR}s-v${VAR}.wav`, buf);
console.log(`wrote music/bed-${DUR}s-v${VAR}.wav`, (bytes / 1e6).toFixed(1), "MB,", nBars, "bars @", BPM, "BPM (variant " + VAR + ")");
