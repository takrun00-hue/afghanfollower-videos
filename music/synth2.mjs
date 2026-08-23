// Multi-STYLE music generator.
// The previous engine varied key/tempo but every track used the same oscillators
// and the same arrangement, so everything sounded related. This one ships six
// genuinely different styles with their own instruments, grooves and structures:
//   uplift · lofi · cinematic · percussive · trap · corporate
//
// Usage: node music/synth2.mjs <seconds> <seed> <out.wav>
import { writeFileSync } from "node:fs";
import { styleFor } from "./style.mjs";

const DUR = Number(process.argv[2]) || 16;
const SEED = Math.max(1, Math.floor(Number(process.argv[3]) || 1));
const OUT = process.argv[4] || `music/auto/seed-${SEED}.wav`;
const SR = 44100, N = Math.floor(SR * DUR);

// ---------- deterministic RNG ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = mulberry32((SEED * 2654435761) % 2147483647 || 7);
const pick = (a) => a[Math.floor(R() * a.length)];
const rng = (lo, hi) => lo + R() * (hi - lo);

// ---------- style ----------
const { style: STYLE, bpm: BPM } = styleFor(SEED);
const beat = 60 / BPM, bar = beat * 4, eighth = beat / 2, sixteenth = beat / 4;

// ---------- harmony ----------
const PROGS = [
  { off: [0, -4, 3, 5], typ: ["min", "maj", "maj", "maj"] },
  { off: [0, 5, 7, 3], typ: ["maj", "maj", "maj", "min"] },
  { off: [0, 7, -4, 5], typ: ["min", "maj", "maj", "maj"] },
  { off: [0, 3, 5, 7], typ: ["min", "maj", "maj", "maj"] },
  { off: [0, -2, 5, -4], typ: ["maj", "min", "maj", "maj"] },
];
const KEY = 53 + Math.floor(R() * 8);
const PROG = pick(PROGS);
const MOTIF = pick([
  [0, 3, 7, 3, 5, 3, 0, -2], [7, 5, 4, 0, 2, 4, 7, 9],
  [0, 5, 3, 7, 5, 3, 2, 0], [12, 7, 9, 7, 5, 3, 5, 7],
]);
const chordOf = (root, type) => [root, root + (type === "min" ? 3 : 4), root + 7, root + 12];
const PROGRESSION = PROG.off.map((o, i) => ({ root: KEY + o, notes: chordOf(KEY + o, PROG.typ[i]) }));

// ---------- buses ----------
const drumL = new Float32Array(N), drumR = new Float32Array(N);
const musL = new Float32Array(N), musR = new Float32Array(N);
const revL = new Float32Array(N), revR = new Float32Array(N);
const kickTimes = [];

// ---------- dsp ----------
const noise = () => R() * 2 - 1;
const nf = (m) => 440 * Math.pow(2, (m - 69) / 12);
const saw = (p) => 2 * (p - Math.floor(p + 0.5));
const tri = (p) => 2 * Math.abs(2 * (p - Math.floor(p + 0.5))) - 1;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
function svf() {
  let low = 0, band = 0;
  return (x, fc, q = 1.1) => {
    const f = 2 * Math.sin(Math.PI * clamp(fc, 20, SR * 0.42) / SR);
    const high = x - low - q * band; band += f * high; low += f * band; return low;
  };
}
function svfHP() {
  let low = 0, band = 0;
  return (x, fc, q = 1) => {
    const f = 2 * Math.sin(Math.PI * clamp(fc, 20, SR * 0.42) / SR);
    const high = x - low - q * band; band += f * high; low += f * band; return high;
  };
}
function env(t, a, d, s, r, dur) {
  if (t < 0 || t > dur) return 0;
  if (t < a) return a > 0 ? t / a : 1;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t > dur - r) return s * Math.max(0, (dur - t) / r);
  return s;
}
function write(bl, br, start, dur, fn) {
  const s = Math.max(0, Math.floor(start * SR)), e = Math.min(N, Math.floor((start + dur) * SR));
  for (let i = s; i < e; i++) { const v = fn((i - s) / SR); bl[i] += v[0]; br[i] += v[1]; }
}
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];

// ---------- instruments ----------
function kick(t0, g = 1, deep = false) {
  kickTimes.push(t0);
  const hp = svfHP();
  write(drumL, drumR, t0, deep ? 0.75 : 0.42, (t) => {
    const click = hp(noise(), 2600) * Math.exp(-t * 420) * (deep ? 0.25 : 0.5);
    const f0 = deep ? 42 : 48, sweep = deep ? 90 : 120, k = deep ? 18 : 34;
    const body = Math.sin(2 * Math.PI * (f0 * t + (sweep / k) * (1 - Math.exp(-t * k)))) * Math.exp(-t * (deep ? 3.4 : 8.5));
    const s = (click + body * 1.05) * g * 0.95;
    return [s, s];
  });
}
function clap(t0, g = 1) {
  const bp = svf(), hp = svfHP();
  write(drumL, drumR, t0, 0.34, (t) => {
    let n = 0;
    for (const off of [0, 0.009, 0.019]) { const dt = t - off; if (dt >= 0) n += noise() * Math.exp(-dt * 120); }
    const s = hp(bp(n + noise() * Math.exp(-t * 16) * 0.55, 2200, 0.9), 700) * g * 0.7;
    return [s * 0.95, s];
  });
}
function rim(t0, g = 1) {
  const bp = svf();
  write(drumL, drumR, t0, 0.12, (t) => {
    const s = bp(noise() * Math.exp(-t * 90) + Math.sin(2 * Math.PI * 420 * t) * Math.exp(-t * 70), 1800, 1.4) * g * 0.5;
    return [s * 0.9, s];
  });
}
function hat(t0, open = false, g = 1) {
  const hp = svfHP();
  const p = pan(open ? 0.1 : 0.22);
  write(drumL, drumR, t0, open ? 0.17 : 0.05, (t) => {
    const s = hp(noise(), 7200, 0.7) * Math.exp(-t * (open ? 22 : 90)) * g * 0.28;
    return [s * p[0], s * p[1]];
  });
}
function shaker(t0, g = 1) {
  const hp = svfHP();
  write(drumL, drumR, t0, 0.09, (t) => {
    const s = hp(noise(), 5200, 0.8) * Math.exp(-t * 40) * g * 0.22;
    return [s * 0.8, s];
  });
}
// 808-style sub with a pitch glide — the trap backbone
function sub808(t0, dur, midi, g = 1) {
  const f1 = nf(midi - 12);
  write(musL, musR, t0, dur, (t) => {
    const gl = 1 + 0.55 * Math.exp(-t * 26);
    const e = env(t, 0.005, 0.06, 0.9, 0.12, dur);
    const s = Math.tanh(Math.sin(2 * Math.PI * f1 * gl * t) * 1.4) * e * g * 0.55;
    return [s, s];
  });
}
function bass(t0, dur, midi, g = 1) {
  const f = nf(midi), lp = svf();
  write(musL, musR, t0, dur, (t) => {
    const e = env(t, 0.006, 0.06, 0.75, 0.05, dur);
    const s = Math.tanh(lp(saw(f * t) * 0.7 + tri(f * t * 0.5) * 0.3, 420 + 900 * Math.exp(-t * 12), 1.5) * 1.3) * e * g * 0.32;
    return [s, s];
  });
}
// Karplus-Strong plucked string — a genuinely different timbre from any oscillator
function ksPluck(t0, dur, midi, g = 1, panP = 0, bright = 0.5) {
  const f = nf(midi);
  const L = Math.max(2, Math.floor(SR / f));
  const buf = new Float32Array(L);
  for (let i = 0; i < L; i++) buf[i] = noise();
  let idx = 0, last = 0;
  const p = pan(panP);
  write(musL, musR, t0, dur, (t) => {
    const cur = buf[idx];
    const avg = (cur + last) * 0.5 * (0.985 + bright * 0.012);
    buf[idx] = avg; last = cur; idx = (idx + 1) % L;
    const s = avg * env(t, 0.001, 0.02, 0.9, 0.08, dur) * g * 0.5;
    return [s * p[0], s * p[1]];
  });
  const lp2 = svf();
  write(revL, revR, t0, dur, (t) => {
    const s = lp2(Math.sin(2 * Math.PI * f * t), 2400) * env(t, 0.002, 0.1, 0.4, 0.1, dur) * g * 0.10;
    return [s, s];
  });
}
// FM bell — metallic, sparkly; nothing else in the kit sounds like it
function bell(t0, dur, midi, g = 1, panP = 0) {
  const f = nf(midi), p = pan(panP);
  write(musL, musR, t0, dur, (t) => {
    const mod = Math.sin(2 * Math.PI * f * 2.01 * t) * 3.2 * Math.exp(-t * 5);
    const s = Math.sin(2 * Math.PI * f * t + mod) * Math.exp(-t * 3.2) * g * 0.3;
    return [s * p[0], s * p[1]];
  });
  write(revL, revR, t0, dur, (t) => {
    const s = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 3) * g * 0.14;
    return [s, s];
  });
}
// warm electric-piano-ish tone for lofi / corporate beds
function epiano(t0, dur, midi, g = 1, panP = 0) {
  const f = nf(midi), p = pan(panP), lp = svf();
  write(musL, musR, t0, dur, (t) => {
    const mod = Math.sin(2 * Math.PI * f * 3 * t) * 1.1 * Math.exp(-t * 9);
    const raw = Math.sin(2 * Math.PI * f * t + mod) * 0.8 + tri(f * t) * 0.2;
    const s = lp(raw, 1600 + 900 * Math.exp(-t * 6)) * env(t, 0.006, 0.25, 0.4, 0.18, dur) * g * 0.34;
    return [s * p[0], s * p[1]];
  });
}
function pad(t0, dur, notes, g = 1) {
  const lp = svf();
  const det = [0.994, 1, 1.006];
  write(musL, musR, t0, dur, (t) => {
    let raw = 0;
    for (const m of notes) for (let k = 0; k < det.length; k++) raw += saw(nf(m) * det[k] * t + k * 0.21);
    raw /= notes.length * det.length;
    const s = lp(raw, 700 + 500 * Math.sin(t * 0.6)) * env(t, dur * 0.28, dur * 0.2, 0.85, dur * 0.3, dur) * g * 0.22;
    return [s * 0.98, s];
  });
  const lp2 = svf();
  write(revL, revR, t0, dur, (t) => {
    let raw = 0; for (const m of notes) raw += saw(nf(m) * t);
    const s = lp2(raw / notes.length, 1800) * env(t, dur * 0.3, dur * 0.2, 0.7, dur * 0.3, dur) * g * 0.14;
    return [s, s];
  });
}
function stab(t0, dur, notes, g = 1, panP = 0) {
  const lp = svf(), p = pan(panP);
  const det = [0.994, 0.997, 1, 1.003, 1.006];
  write(musL, musR, t0, dur, (t) => {
    let raw = 0;
    for (const m of notes) for (let k = 0; k < det.length; k++) raw += saw(nf(m) * det[k] * t + k * 0.13);
    raw /= notes.length * det.length;
    const s = lp(raw, 900 + 2600 * Math.exp(-t * 9), 1.2) * env(t, 0.006, 0.1, 0.55, 0.09, dur) * g * 0.28;
    return [s * p[0], s * p[1]];
  });
}
function lead(t0, dur, midi, g = 1) {
  const f = nf(midi), lp = svf();
  write(musL, musR, t0, dur, (t) => {
    const vib = 1 + Math.sin(2 * Math.PI * 5.2 * t) * 0.0035;
    let raw = 0; for (const d of [0.995, 1, 1.005]) raw += saw(f * d * vib * t);
    raw = raw / 3 * 0.7 + Math.sin(2 * Math.PI * f * t) * 0.4;
    const s = lp(raw, 1800 + 3200 * Math.exp(-t * 7), 1.1) * env(t, 0.02, 0.1, 0.7, 0.12, dur) * g * 0.28;
    return [s * 0.98, s];
  });
}
function riser(t0, dur) {
  const bp = svf(), hp = svfHP();
  write(musL, musR, t0, dur, (t) => {
    const x = t / dur, e = x * x;
    const s = hp(bp(noise(), 700 + 5200 * x, 1.6), 400) * 0.32 * e;
    return [s, s * 0.92];
  });
}
function vinyl(g = 0.05) { // lofi surface noise
  const hp = svfHP();
  write(musL, musR, 0, DUR, (t) => {
    const s = hp(noise(), 900) * g * (0.6 + 0.4 * Math.sin(t * 3.1));
    return [s, s * 0.9];
  });
}

// ---------- arrangement per style ----------
const nBars = Math.max(3, Math.floor(DUR / bar));
const P = (b) => PROGRESSION[b % PROGRESSION.length];
const intro = (b) => b === 0;
const last = (b) => b >= nBars - 1;

for (let b = 0; b < nBars; b++) {
  const t0 = b * bar, C = P(b);

  if (STYLE === "uplift") {
    for (let k = 0; k < 4; k++) {
      const bt = t0 + k * beat;
      if (!intro(b)) kick(bt);
      if (!intro(b) && (k === 1 || k === 3)) clap(bt);
      hat(bt + eighth, k === 2 && !intro(b));
      hat(bt, false, 0.7);
    }
    if (!intro(b)) for (let k = 0; k < 8; k++) bass(t0 + k * eighth, eighth * 0.85, C.root - 12);
    for (let k = 0; k < 4; k++) stab(t0 + k * beat + eighth, eighth * 0.9, C.notes, intro(b) ? 0.6 : 1, k % 2 ? 0.25 : -0.25);
    if (!intro(b) && !last(b)) for (let k = 0; k < 4; k++) lead(t0 + k * beat, beat * 0.9, C.root + 12 + MOTIF[(b * 2 + k) % MOTIF.length], 0.9);
    if (b === 0) riser(t0 + bar - beat, beat);

  } else if (STYLE === "lofi") {
    for (let k = 0; k < 4; k++) {
      const bt = t0 + k * beat;
      if (k === 0 || k === 2) kick(bt, 0.85);
      if (k === 2) rim(bt, 0.9);
      hat(bt + eighth, false, 0.5);
      shaker(bt + eighth + sixteenth, 0.6);
    }
    epiano(t0, bar * 0.95, C.notes[0], 1, -0.2);
    epiano(t0 + beat * 1.5, bar * 0.5, C.notes[1] + 12, 0.8, 0.25);
    epiano(t0 + beat * 2.5, bar * 0.5, C.notes[2] + 12, 0.7, -0.15);
    bass(t0, beat * 1.8, C.root - 12, 0.9);
    bass(t0 + beat * 2, beat * 1.6, C.root - 12, 0.8);
    if (b % 2 === 1) bell(t0 + beat * 3, beat * 1.2, C.root + 24, 0.5, 0.3);

  } else if (STYLE === "cinematic") {
    pad(t0, bar * 1.02, C.notes, 1.1);
    epiano(t0, beat * 2, C.root, 0.8, -0.1);
    if (b >= 1) epiano(t0 + beat * 2, beat * 1.8, C.notes[1], 0.6, 0.2);
    if (b >= Math.floor(nBars / 2)) {
      for (let k = 0; k < 4; k++) if (k === 0 || k === 2) kick(t0 + k * beat, 0.7, true);
      shaker(t0 + beat * 1.5, 0.5); shaker(t0 + beat * 3.5, 0.5);
    }
    if (b >= 1) bell(t0 + beat * 1, beat * 2.2, C.root + 24 + MOTIF[b % MOTIF.length], 0.45, 0.25);
    if (b === Math.floor(nBars / 2) - 1) riser(t0 + bar - beat * 1.5, beat * 1.5);

  } else if (STYLE === "percussive") {
    for (let k = 0; k < 4; k++) {
      const bt = t0 + k * beat;
      if (k !== 1) kick(bt, 0.9);
      if (k === 1 || k === 3) rim(bt);
      shaker(bt + eighth, 0.8);
      shaker(bt + eighth + sixteenth, 0.5);
    }
    const arp = [C.notes[0] + 12, C.notes[1] + 12, C.notes[2] + 12, C.notes[3] + 12];
    for (let k = 0; k < 8; k++) ksPluck(t0 + k * eighth, eighth * 1.6, arp[k % 4] + (k >= 4 ? 12 : 0), 0.9, k % 2 ? 0.3 : -0.3, 0.7);
    bass(t0, beat * 1.5, C.root - 12, 0.9);
    bass(t0 + beat * 2.5, beat * 1.2, C.root - 12, 0.8);

  } else if (STYLE === "trap") {
    for (let k = 0; k < 4; k++) {
      const bt = t0 + k * beat;
      if (k === 0) kick(bt, 1, true);
      if (k === 2) clap(bt);
      // rolling triplet hats
      for (let h = 0; h < 3; h++) hat(bt + (h * beat) / 3, false, h === 0 ? 0.8 : 0.5);
      if (k === 3) for (let h = 0; h < 4; h++) hat(bt + beat * 0.5 + h * sixteenth * 0.5, false, 0.4);
    }
    sub808(t0, beat * 2.4, C.root - 12, 1);
    if (b % 2 === 1) sub808(t0 + beat * 2.6, beat * 1.2, C.notes[1] - 12, 0.85);
    bell(t0 + beat * 0.5, beat * 1.6, C.root + 24 + MOTIF[b % MOTIF.length], 0.5, -0.2);
    if (b >= 1) bell(t0 + beat * 2.5, beat * 1.2, C.root + 24 + MOTIF[(b + 3) % MOTIF.length], 0.4, 0.25);

  } else { // corporate
    for (let k = 0; k < 4; k++) {
      const bt = t0 + k * beat;
      if (!intro(b) && (k === 0 || k === 2)) kick(bt, 0.8);
      if (!intro(b) && k === 2) clap(bt, 0.6);
      shaker(bt + eighth, 0.7);
    }
    pad(t0, bar * 0.98, C.notes, 0.7);
    const arp = [C.notes[0] + 12, C.notes[2] + 12, C.notes[1] + 12, C.notes[3] + 12];
    for (let k = 0; k < 8; k++) ksPluck(t0 + k * eighth, eighth * 1.3, arp[k % 4], 0.7, k % 2 ? 0.32 : -0.32, 0.9);
    if (!intro(b)) bass(t0, beat * 2, C.root - 12, 0.8);
    if (!intro(b)) bass(t0 + beat * 2, beat * 1.8, C.root - 12, 0.7);
  }
}
if (STYLE === "lofi") vinyl(0.045);

// ---------- reverb ----------
function reverb(inBuf, off) {
  const out = new Float32Array(N);
  const size = STYLE === "cinematic" ? 1.6 : STYLE === "lofi" ? 0.8 : 1;
  for (const d0 of [1116, 1188, 1277, 1356]) {
    const d = Math.floor(d0 * size) + off;
    const buf = new Float32Array(d); let i2 = 0, lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[i2]; lp = y * 0.72 + lp * 0.28;
      buf[i2] = inBuf[i] + lp * (STYLE === "cinematic" ? 0.86 : 0.8);
      i2 = (i2 + 1) % d; out[i] += y * 0.25;
    }
  }
  for (const D of [225, 556]) {
    const buf = new Float32Array(D); let idx = 0;
    for (let i = 0; i < N; i++) {
      const bo = buf[idx], x = out[i] + bo * -0.5;
      buf[idx] = x; out[i] = bo + x * 0.5; idx = (idx + 1) % D;
    }
  }
  return out;
}
const rvL = reverb(revL, 0), rvR = reverb(revR, 23);

// ---------- sidechain (only for styles that pump) ----------
const duck = new Float32Array(N).fill(1);
if (STYLE === "uplift" || STYLE === "corporate") {
  const rel = 0.26;
  for (const kt of kickTimes) {
    const s = Math.floor(kt * SR), e = Math.min(N, s + Math.floor(rel * SR));
    for (let i = Math.max(0, s); i < e; i++) {
      const v = 0.28 + 0.72 * Math.pow((i - s) / (rel * SR), 0.55);
      if (v < duck[i]) duck[i] = v;
    }
  }
}

// ---------- mix + master ----------
const outL = new Float32Array(N), outR = new Float32Array(N);
const revAmt = STYLE === "cinematic" ? 0.85 : STYLE === "lofi" ? 0.4 : 0.55;
for (let i = 0; i < N; i++) {
  const d = duck[i];
  outL[i] = drumL[i] + musL[i] * d + rvL[i] * d * revAmt;
  outR[i] = drumR[i] + musR[i] * d + rvR[i] * d * revAmt;
}
function master(buf) {
  let e = 0;
  const fin = Math.floor(0.12 * SR), fout = Math.floor(1.0 * SR);
  for (let i = 0; i < N; i++) {
    let s = buf[i] * 1.1;
    const a = Math.abs(s);
    e = a > e ? a * 0.35 + e * 0.65 : e * 0.9995;
    if (e > 0.62) s /= 1 + (e - 0.62) * 1.5;
    s = Math.tanh(s * 1.06);
    if (i < fin) s *= i / fin;
    if (i > N - fout) s *= (N - i) / fout;
    buf[i] = s;
  }
}
master(outL); master(outR);
{
  let pk = 0;
  for (let i = 0; i < N; i++) { pk = Math.max(pk, Math.abs(outL[i]), Math.abs(outR[i])); }
  const g = pk > 0 ? 0.84 / pk : 1;
  for (let i = 0; i < N; i++) { outL[i] *= g; outR[i] *= g; }
}

// ---------- WAV ----------
const bytes = N * 4, buf = Buffer.alloc(44 + bytes);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + bytes, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(bytes, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  buf.writeInt16LE((clamp(outL[i], -1, 1) * 32767) | 0, o); o += 2;
  buf.writeInt16LE((clamp(outR[i], -1, 1) * 32767) | 0, o); o += 2;
}
writeFileSync(OUT, buf);
console.log(`wrote ${OUT} — style ${STYLE}, ${BPM} BPM, ${nBars} bars`);
