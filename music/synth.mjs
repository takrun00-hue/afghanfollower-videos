// Modern social-media music bed generator (royalty-free, fully synthesized).
// Usage: node music/synth.mjs <seconds> <variant 1..3>
// Writes music/bed-<sec>s-v<variant>.wav
//
// Engine: layered kick, clap/snare, hats, sub + mid bass, supersaw chord stabs,
// filtered plucks w/ dotted-8th delay, lead hook, risers/impacts, sidechain
// pumping, Schroeder reverb, and an intro→build→drop→break→drop→outro arc.
import { writeFileSync } from "node:fs";
import { moodParams, MOODS } from "./mood.mjs";

const DUR = Number(process.argv[2]) || 60;
const VAR = Math.max(1, Math.floor(Number(process.argv[3]) || 1)); // seed
const OUT = process.argv[4] || null;
const SR = 44100, N = Math.floor(SR * DUR);

// ---------- seed-derived musical identity ----------
// The 2nd CLI arg is a SEED, not an index: every distinct seed yields a distinct
// tempo, key, chord progression, melodic motif and instrument mix.
function seedRand(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SR_ = seedRand((VAR * 2654435761) % 2147483647 || 7);
const MOOD_PARAMS = Object.fromEntries(Object.keys(MOODS).map((k) => [k, moodParams(k)]));
const pick = (arr) => arr[Math.floor(SR_() * arr.length)];

// chord-root offsets in semitones from the key centre (bar 1..4)
const PROGRESSIONS = [
  { off: [0, -4, 3, 5], typ: ["min", "maj", "maj", "maj"] },  // i - VI - III - IV
  { off: [0, 5, 7, 3], typ: ["maj", "maj", "maj", "min"] },   // I - IV - V - iii
  { off: [0, 7, -4, 5], typ: ["min", "maj", "maj", "maj"] },  // i - V - VI - IV
  { off: [0, 3, 5, 7], typ: ["min", "maj", "maj", "maj"] },   // i - III - IV - V
  { off: [0, -2, 5, -4], typ: ["maj", "min", "maj", "maj"] }, // I - vi - IV - VI
];
const MOTIFS = [
  [0, 3, 7, 3, 5, 3, 0, -2],
  [7, 5, 4, 0, 2, 4, 7, 9],
  [0, 5, 3, 7, 5, 3, 2, 0],
  [12, 7, 9, 7, 5, 3, 5, 7],
  [0, 2, 3, 5, 7, 5, 3, 2],
];

// The mood comes from the video's content (music/mood.mjs). The seed still
// varies key, chords and motif so two videos of the same mood differ, but tempo
// and instrumentation follow what the video is ABOUT.
const MOOD = process.env.MUSIC_MOOD || "";
const _moodBpm = Number(process.env.MUSIC_BPM || 0);
const _bpm = _moodBpm || 116 + Math.floor(SR_() * 20);
const _key = 53 + Math.floor(SR_() * 8);          // F3..C4 centre
const _prog = pick(PROGRESSIONS);
const V = {
  bpm: _bpm,
  key: "seed" + VAR,
  roots: _prog.off.map((o) => _key + o),
  types: _prog.typ,
  bright: 0.86 + SR_() * 0.34,
  motif: pick(MOTIFS),
  // instrumentation switches — not every track uses every voice
  useLead: SR_() > 0.25,
  usePluck: SR_() > 0.15,
  openHats: SR_() > 0.5,
  swing: SR_() * 0.03,
  groove: ["four", "half", "broken"][Math.floor(SR_() * 3)],
  palette: ["saw", "soft", "bright"][Math.floor(SR_() * 3)],
};
if (MOOD) {
  const P = MOOD_PARAMS[MOOD];
  if (P) Object.assign(V, P);
}
const BPM = V.bpm, beat = 60 / BPM, bar = beat * 4, eighth = beat / 2, sixteenth = beat / 4;

// ---------- buses ----------
const drumL = new Float32Array(N), drumR = new Float32Array(N);   // not ducked
const musL  = new Float32Array(N), musR  = new Float32Array(N);   // ducked
const revL  = new Float32Array(N), revR  = new Float32Array(N);   // reverb send
const dlyL  = new Float32Array(N), dlyR  = new Float32Array(N);   // delay send
const kickTimes = [];

// ---------- utils ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(9876 + VAR * 4177);
const noise = () => rnd() * 2 - 1;
const nf = (m) => 440 * Math.pow(2, (m - 69) / 12);
const saw = (p) => 2 * (p - Math.floor(p + 0.5));
const sqr = (p) => (p - Math.floor(p) < 0.5 ? 1 : -1);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

// state-variable lowpass (Chamberlin)
function svf() {
  let low = 0, band = 0;
  return (x, fc, q = 1.1) => {
    const f = 2 * Math.sin(Math.PI * clamp(fc, 20, SR * 0.42) / SR);
    const high = x - low - q * band;
    band += f * high;
    low += f * band;
    return low;
  };
}
function svfHP() {
  let low = 0, band = 0;
  return (x, fc, q = 1.0) => {
    const f = 2 * Math.sin(Math.PI * clamp(fc, 20, SR * 0.42) / SR);
    const high = x - low - q * band;
    band += f * high;
    low += f * band;
    return high;
  };
}
// ADSR-ish envelope
function env(t, a, d, s, r, dur) {
  if (t < 0 || t > dur) return 0;
  if (t < a) return a > 0 ? t / a : 1;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t > dur - r) return s * Math.max(0, (dur - t) / r);
  return s;
}
// write helper: fn(t) -> [l, r]
function write(busL, busR, start, dur, fn) {
  const s = Math.max(0, Math.floor(start * SR));
  const e = Math.min(N, Math.floor((start + dur) * SR));
  for (let i = s; i < e; i++) {
    const t = (i - s) / SR;
    const v = fn(t);
    busL[i] += v[0]; busR[i] += v[1];
  }
}
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];

// ---------- instruments ----------
function kick(t0, gain = 1) {
  kickTimes.push(t0);
  const hp = svfHP();
  write(drumL, drumR, t0, 0.42, (t) => {
    // click transient
    const click = hp(noise(), 2600) * Math.exp(-t * 420) * 0.5;
    // pitched body 165 -> 48 Hz
    const f = 48 + 120 * Math.exp(-t * 34);
    const body = Math.sin(2 * Math.PI * (48 * t + (120 / 34) * (1 - Math.exp(-t * 34)))) * Math.exp(-t * 8.5);
    // sub tail
    const sub = Math.sin(2 * Math.PI * 46 * t) * Math.exp(-t * 5.2) * 0.5;
    const s = (click + body * 1.05 + sub) * gain * 1.15;
    return [s, s];
  });
}
function clap(t0, gain = 1) {
  const bp = svf(), hp = svfHP();
  write(drumL, drumR, t0, 0.34, (t) => {
    // 3 offset bursts = clap
    let n = 0;
    for (const off of [0, 0.009, 0.019]) {
      const dt = t - off;
      if (dt >= 0) n += noise() * Math.exp(-dt * 120);
    }
    const tail = noise() * Math.exp(-t * 16) * 0.55;
    let s = hp(bp(n + tail, 2200, 0.9), 700) * gain * 0.9;
    return [s * 0.95, s];
  });
  // reverb send
  const bp2 = svf();
  write(revL, revR, t0, 0.3, (t) => {
    const s = bp2(noise() * Math.exp(-t * 22), 2000, 0.9) * gain * 0.3;
    return [s, s * 0.9];
  });
}
function snare(t0, gain = 1) {
  const hp = svfHP();
  write(drumL, drumR, t0, 0.3, (t) => {
    const n = hp(noise(), 900) * Math.exp(-t * 26);
    const tone = (Math.sin(2 * Math.PI * 186 * t) + Math.sin(2 * Math.PI * 278 * t)) * 0.5 * Math.exp(-t * 30);
    const s = (n * 0.8 + tone * 0.6) * gain * 0.7;
    return [s, s];
  });
}
function hat(t0, open = false, gain = 1) {
  const hp = svfHP();
  const d = open ? 0.17 : 0.05;
  const k = open ? 22 : 90;
  const p = pan(open ? 0.1 : 0.22);
  write(drumL, drumR, t0, d, (t) => {
    const s = hp(noise(), 7200, 0.7) * Math.exp(-t * k) * gain * 0.30;
    return [s * p[0], s * p[1]];
  });
}
function sub(t0, dur, midi, gain = 1) {
  const f = nf(midi - 12);
  write(musL, musR, t0, dur, (t) => {
    const e = env(t, 0.008, 0.04, 0.9, 0.05, dur);
    const s = Math.sin(2 * Math.PI * f * t) * e * gain * 0.62;
    return [s, s];
  });
}
function bass(t0, dur, midi, gain = 1) {
  const f = nf(midi);
  const lp = svf();
  write(musL, musR, t0, dur, (t) => {
    const e = env(t, 0.006, 0.06, 0.75, 0.05, dur);
    const cut = (420 + 900 * Math.exp(-t * 12)) * V.bright;
    const raw = saw(f * t) * 0.7 + sqr(f * t * 0.5) * 0.3;
    const s = Math.tanh(lp(raw, cut, 1.5) * 1.35) * e * gain * 0.34;
    return [s, s];
  });
}
// supersaw chord stab
function stab(t0, dur, notes, gain = 1, panP = 0) {
  const lp = svf();
  const p = pan(panP);
  const det = [0.994, 0.997, 1, 1.003, 1.006];
  write(musL, musR, t0, dur, (t) => {
    const e = env(t, 0.006, 0.10, 0.55, 0.09, dur);
    let raw = 0;
    for (const m of notes) {
      const f = nf(m);
      for (let k = 0; k < det.length; k++) raw += saw(f * det[k] * t + k * 0.13);
    }
    raw /= notes.length * det.length;
    const cut = (900 + 2600 * Math.exp(-t * 9)) * V.bright * (V.palette === "soft" ? .7 : V.palette === "bright" ? 1.25 : 1);
    const s = lp(raw, cut, 1.2) * e * gain * 0.30;
    return [s * p[0], s * p[1]];
  });
  // reverb send
  const lp2 = svf();
  write(revL, revR, t0, dur, (t) => {
    const e = env(t, 0.006, 0.10, 0.5, 0.09, dur);
    let raw = 0;
    for (const m of notes) raw += saw(nf(m) * t);
    const s = lp2(raw / notes.length, 2200, 1.0) * e * gain * 0.12;
    return [s, s];
  });
}
function pluck(t0, dur, midi, gain = 1, panP = 0) {
  const f = nf(midi);
  const lp = svf();
  const p = pan(panP);
  write(musL, musR, t0, dur, (t) => {
    const e = env(t, 0.003, 0.09, 0.18, 0.06, dur);
    const raw = V.palette === "soft"
      ? Math.sin(2 * Math.PI * f * t) * 0.8 + saw(f * t) * 0.15
      : V.palette === "bright"
      ? saw(f * t) * 0.5 + sqr(f * t) * 0.45
      : saw(f * t) * 0.6 + sqr(f * t) * 0.25;
    const cut = (1400 + 4200 * Math.exp(-t * 16)) * V.bright;
    const s = lp(raw, cut, 1.4) * e * gain * 0.26;
    return [s * p[0], s * p[1]];
  });
  // delay send (dotted 8th)
  const lp2 = svf();
  write(dlyL, dlyR, t0, dur, (t) => {
    const e = env(t, 0.003, 0.09, 0.18, 0.06, dur);
    const s = lp2(saw(f * t), 2600, 1.2) * e * gain * 0.22;
    return [s * p[1], s * p[0]];
  });
}
function lead(t0, dur, midi, gain = 1) {
  const f = nf(midi);
  const lp = svf();
  const det = [0.995, 1, 1.005];
  write(musL, musR, t0, dur, (t) => {
    const e = env(t, 0.015, 0.10, 0.7, 0.10, dur);
    const vib = 1 + Math.sin(2 * Math.PI * 5.2 * t) * 0.0035;
    let raw = 0;
    for (let k = 0; k < det.length; k++) raw += saw(f * det[k] * vib * t + k * 0.2);
    raw = raw / det.length * 0.7 + Math.sin(2 * Math.PI * f * t) * 0.4;
    const cut = (1800 + 3200 * Math.exp(-t * 7)) * V.bright;
    const s = lp(raw, cut, 1.1) * e * gain * 0.30;
    return [s * 0.98, s];
  });
  const lp2 = svf();
  write(revL, revR, t0, dur, (t) => {
    const e = env(t, 0.015, 0.10, 0.7, 0.10, dur);
    const s = lp2(saw(f * t), 2600, 1.0) * e * gain * 0.16;
    return [s, s];
  });
}
function riser(t0, dur) {
  const bp = svf(), hp = svfHP();
  write(musL, musR, t0, dur, (t) => {
    const x = t / dur;
    const e = x * x;
    const nz = hp(bp(noise(), 700 + 5200 * x, 1.6), 400) * 0.36 * e;
    const tone = Math.sin(2 * Math.PI * (220 + 900 * x * x) * t) * 0.10 * e;
    return [nz + tone, nz * 0.92 + tone];
  });
}
function impact(t0) {
  write(drumL, drumR, t0, 1.1, (t) => {
    const boom = Math.sin(2 * Math.PI * (55 * Math.exp(-t * 3)) * t) * Math.exp(-t * 3.4) * 0.75;
    const nz = noise() * Math.exp(-t * 12) * 0.22;
    const s = boom + nz;
    return [s, s];
  });
  write(revL, revR, t0, 1.0, (t) => {
    const s = noise() * Math.exp(-t * 8) * 0.16;
    return [s, s * 0.9];
  });
}

// ---------- arrangement ----------
function chordOf(root, type) {
  const third = root + (type === "min" ? 3 : 4);
  return [root, third, root + 7, root + 12];
}
const prog = V.roots.map((r, i) => ({ root: r, notes: chordOf(r, V.types[i]) }));
const nBars = Math.max(4, Math.floor(DUR / bar));
const PROGRESSION_FIRST = prog[0] ? prog[0].root : null;

// section per bar: 0=intro 1=build 2=drop 3=break
const OUTRO_BARS = Number(process.env.MUSIC_OUTRO_BARS || 4);
const SHORT_CUT = DUR < 25;   // a 15s clip cannot afford an intro
function sectionOf(b) {
  if (b >= nBars - OUTRO_BARS) return 4;   // final: lighter, lets the CTA land
  if (SHORT_CUT) return 2;                 // full energy from the very first bar
  const p = b / nBars;
  if (p < 0.10) return 0;
  if (p < 0.17) return 1;
  if (p < 0.46) return 2;
  if (p < 0.56) return 3;
  return 2;
}

for (let b = 0; b < nBars; b++) {
  const t0 = b * bar;
  const P = prog[b % prog.length];
  const sec = sectionOf(b);
  const full = sec === 2;
  const build = sec === 1;
  const brk = sec === 3;
  const fin = sec === 4;

  // ---- drums ----
  for (let k = 0; k < 4; k++) {
    const bt = t0 + k * beat;
    if (full) {
      if (V.groove === "four") kick(bt);
      else if (V.groove === "half") { if (k === 0 || k === 2) kick(bt); }
      else { if (k === 0 || k === 2) kick(bt); if (k === 1) kick(bt + eighth, .8); }
    }
    else if (fin) kick(bt, 0.85);
    else if (build) { if (k % 2 === 0) kick(bt, 0.9); }
    else if (brk && k === 0) kick(bt, 0.8);

    if ((full || fin) && (V.groove === "half" ? k === 2 : (k === 1 || k === 3))) clap(bt, fin ? 0.8 : 1);
    if (brk && k === 2) snare(bt, 0.6);

    if (full || build || fin) {
      hat(bt + eighth + (k % 2 ? V.swing : 0), k === 2 && full && V.openHats);
      hat(bt, false, 0.75);
      if (full && k === 3) { hat(bt + eighth + sixteenth, false, 0.6); hat(bt + eighth + 2 * sixteenth, false, 0.5); }
    } else if (brk) {
      hat(bt + eighth, false, 0.5);
    }
  }
  // build: 16th snare roll accelerating in the last build bar
  if (build) {
    for (let k = 0; k < 16; k++) if (k >= 8) snare(t0 + k * sixteenth, 0.18 + 0.5 * (k / 16));
  }

  // ---- bass ----
  if (fin) sub(t0, bar * 0.96, P.root - 12, 0.85);
  if (full) {
    sub(t0, bar * 0.98, P.root - 12, 1);
    for (let k = 0; k < 8; k++) {
      const off = k * eighth;
      if (k % 2 === 0 || k === 3 || k === 7) bass(t0 + off, eighth * 0.85, P.root - 12 + (k === 7 ? 7 : 0));
    }
  } else if (brk) {
    sub(t0, bar * 0.9, P.root - 12, 0.6);
  }

  // ---- chords ----
  if (full) {
    // offbeat stabs (classic modern pop/house)
    for (let k = 0; k < 4; k++) stab(t0 + k * beat + eighth, eighth * 0.9, P.notes, 1, k % 2 ? 0.25 : -0.25);
  } else if (build || brk || fin || sec === 0) {
    stab(t0, bar * 0.95, P.notes, sec === 0 ? 0.55 : fin ? 0.9 : 0.8, 0);
  }

  // ---- plucks / arp ----
  if ((full || sec === 0) && V.usePluck) {
    const arp = [P.notes[0] + 12, P.notes[1] + 12, P.notes[2] + 12, P.notes[3] + 12];
    for (let k = 0; k < 8; k++) {
      const n = arp[k % 4] + (k >= 4 ? 12 : 0);
      pluck(t0 + k * eighth, eighth * 0.9, n, sec === 0 ? 0.6 : 1, k % 2 ? 0.35 : -0.35);
    }
  }

  // ---- lead motif (second half drops) ----
  if (full && V.useLead && b / nBars > 0.55) {
    for (let k = 0; k < 4; k++) {
      const deg = V.motif[(b * 2 + k) % V.motif.length];
      lead(t0 + k * beat, beat * 0.92, P.root + 12 + deg, 0.95);
    }
  }

  // --- fills: a phrase that ends the same way every 2 bars feels flat ---
  const phraseEnd = (b % 2 === 1);
  if (full && phraseEnd) {
    // 16th snare roll across the last beat, accelerating in level
    for (let k = 0; k < 4; k++) snare(t0 + beat * 3 + k * sixteenth, 0.22 + k * 0.16);
    // open hat to punctuate the seam
    hat(t0 + beat * 3.75, true, 0.9);
  }
  if (full && b % 4 === 3) {
    // bigger fill every 4 bars: tom-ish kick triplet into the downbeat
    kick(t0 + beat * 3.33, 0.7);
    kick(t0 + beat * 3.66, 0.85);
    clap(t0 + beat * 3.5, 0.5);
  }
  // hat roll lifts the second half of every bar
  if (full) {
    hat(t0 + beat * 2 + sixteenth, false, 0.45);
    hat(t0 + beat * 2 + sixteenth * 2, false, 0.55);
    hat(t0 + beat * 2 + sixteenth * 3, false, 0.4);
  }
  // syncopated bass push on the "and" of 2 — the groove people nod to
  if (full) bass(t0 + beat * 1.5, eighth * 0.8, P.root - 12 + 7, 0.9);

  // ---- transitions ----
  const nextSec = sectionOf(b + 1);
  if (nextSec !== sec && nextSec === 2) { riser(t0 + bar - beat * 2, beat * 2); }
  if (sec !== 2 && nextSec === 2) impact(t0 + bar);
}

// ---------- opening hit ----------
function openingHit() {
  const hp = svfHP(), bp = svf();
  write(drumL, drumR, 0, 1.4, (t) => {
    // bright transient — this is what cuts through a phone speaker
    const crash = hp(noise(), 4200, 0.7) * Math.exp(-t * 5.5) * 0.5;
    // mid punch — the part that reads as "loud" on small drivers
    const punch = bp(noise(), 260, 1.6) * Math.exp(-t * 26) * 0.55
                + Math.sin(2 * Math.PI * (210 * Math.exp(-t * 24) + 90) * t) * Math.exp(-t * 13) * 0.6;
    // sub boom — felt on headphones, harmless on phones
    const boom = Math.sin(2 * Math.PI * (58 * Math.exp(-t * 4)) * t) * Math.exp(-t * 4.2) * 0.75;
    const v = crash + punch + boom;
    return [v, v];
  });
  write(revL, revR, 0, 1.1, (t) => {
    const v = noise() * Math.exp(-t * 6) * 0.2;
    return [v, v * 0.9];
  });
  // a bright stinger right after the hit so the ear has something to follow
  const st = PROGRESSION_FIRST;
  if (st) {
    lead(0.14, 0.5, st + 24, 1.15);
    lead(0.42, 0.42, st + 19, 0.9);
  }
}

// ---------- scene-change accents ----------
// The picture changing is the event the ear should feel: a rising whoosh into
// each cut, then a hit on the frame where the new scene lands.
const CUTS = String(process.env.MUSIC_CUTS || "")
  .split(",").map(Number).filter((t) => t > 0.05 && t < DUR - 0.05);

// Each slide's accent is chosen from that slide's own art (music/mood.mjs), so
// the ear hears WHICH kind of step just happened: sending rises and releases,
// writing ticks, opening clicks, finishing chimes, audio sweeps.
// Format: "12.34:riser,15.02:tick"
const ACCENTS = String(process.env.MUSIC_ACCENTS || "")
  .split(",")
  .map((p) => { const [t, k] = p.split(":"); return { t: Number(t), k: (k || "").trim() }; })
  .filter((a) => a.t > 0.05 && a.t < DUR - 0.05 && a.k);

function whoosh(t0, wdur) {
  const bp = svf(), hp = svfHP();
  write(musL, musR, t0, wdur, (t) => {
    const x = Math.min(1, t / wdur);
    const e = x * x * x;                    // quiet, then rushes in
    const nz = hp(bp(noise(), 500 + 5200 * x, 1.7), 350) * 0.42 * e;
    return [nz * (1 - x * 0.35), nz * (0.65 + x * 0.35)];  // sweeps across the field
  });
}
function hit(t0) {
  const hp = svfHP();
  write(drumL, drumR, t0, 0.9, (t) => {
    const crash = hp(noise(), 3800, 0.8) * Math.exp(-t * 7) * 0.34;
    const thump = Math.sin(2 * Math.PI * (68 * Math.exp(-t * 6)) * t) * Math.exp(-t * 9) * 0.5;
    const v = crash + thump;
    return [v, v];
  });
  write(revL, revR, t0, 0.8, (t) => {
    const v = noise() * Math.exp(-t * 9) * 0.16;
    return [v, v * 0.9];
  });
}

// paint the accents last so they sit on top of the arrangement
openingHit();

// ---- per-slide accent voices ------------------------------------------------
// A tick that reads as typing: short, dry, mid-band clicks.
function tick(t0) {
  for (let i = 0; i < 4; i++) {
    const lp = svf();
    write(drumL, drumR, t0 - 0.18 + i * 0.06, 0.07, (t) => {
      const v = lp(noise(), 2600, 1.2) * Math.exp(-t * 90) * 0.30;
      return [v, v * 0.92];
    });
  }
}
// A single bright click, like a UI tap.
function click(t0) {
  const hp = svfHP();
  write(drumL, drumR, t0, 0.16, (t) => {
    const v = hp(noise(), 2200) * Math.exp(-t * 46) * 0.34
            + Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 60) * 0.16;
    return [v, v];
  });
}
// A bright bell that says "done".
function chime(t0) {
  const f = 1174.7; // D6
  write(musL, musR, t0, 1.1, (t) => {
    const e = Math.exp(-t * 4.2);
    const v = (Math.sin(2 * Math.PI * f * t) * 0.5
             + Math.sin(2 * Math.PI * f * 2.01 * t) * 0.22
             + Math.sin(2 * Math.PI * f * 3.02 * t) * 0.10) * e * 0.30;
    return [v * 0.9, v];
  });
  write(revL, revR, t0, 1.1, (t) => {
    const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 4.2) * 0.16;
    return [v, v];
  });
}
// A filter sweep across the noise floor — the sound of audio being processed.
function sweep(t0) {
  const bp = svf();
  write(musL, musR, t0 - 0.3, 0.85, (t) => {
    const x = Math.min(1, t / 0.85);
    const v = bp(noise(), 300 + 4200 * Math.sin(x * Math.PI), 3.2) * 0.34
            * Math.sin(x * Math.PI);
    return [v * (1 - x * 0.4), v * (0.6 + x * 0.4)];
  });
}

for (const c of CUTS) {
  const a = ACCENTS.find((x) => Math.abs(x.t - c) < 0.06);
  const kind = a ? a.k : "impact";
  if (kind === "riser") { whoosh(Math.max(0, c - 0.55), 0.55); hit(c); }
  else if (kind === "tick") { tick(c); click(c); }
  else if (kind === "click") { click(c); }
  else if (kind === "chime") { chime(c); hit(c); }
  else if (kind === "sweep") { sweep(c); hit(c); }
  else { whoosh(Math.max(0, c - 0.45), 0.45); hit(c); }
}

// ---------- delay (dotted 8th feedback) ----------
{
  const dt = Math.floor(eighth * 1.5 * SR);
  const fb = 0.42;
  for (let i = dt; i < N; i++) {
    dlyL[i] += dlyL[i - dt] * fb;
    dlyR[i] += dlyR[i - dt] * fb;
  }
  for (let i = 0; i < N; i++) { musL[i] += dlyR[i] * 0.5; musR[i] += dlyL[i] * 0.5; }
}

// ---------- reverb (Schroeder: 4 combs + 2 allpass) ----------
function reverb(inBuf, seedOffset) {
  const out = new Float32Array(N);
  const combs = [1116, 1188, 1277, 1356].map((d) => ({ d: d + seedOffset, buf: new Float32Array(d + seedOffset), i: 0, fb: 0.80, lp: 0 }));
  for (const c of combs) {
    for (let i = 0; i < N; i++) {
      const y = c.buf[c.i];
      c.lp = y * 0.72 + c.lp * 0.28;          // damping
      c.buf[c.i] = inBuf[i] + c.lp * c.fb;
      c.i = (c.i + 1) % c.d;
      out[i] += y * 0.25;
    }
  }
  for (const D of [225, 556]) {
    const buf = new Float32Array(D); let idx = 0;
    const g = 0.5;
    for (let i = 0; i < N; i++) {
      const bufOut = buf[idx];
      const x = out[i] + bufOut * -g;
      buf[idx] = x;
      out[i] = bufOut + x * g;
      idx = (idx + 1) % D;
    }
  }
  return out;
}
const rvL = reverb(revL, 0), rvR = reverb(revR, 23);

// ---------- sidechain duck ----------
const duck = new Float32Array(N).fill(1);
{
  const rel = 0.22;
  for (const kt of kickTimes) {
    const s = Math.floor(kt * SR), e = Math.min(N, s + Math.floor(rel * SR));
    for (let i = Math.max(0, s); i < e; i++) {
      const x = (i - s) / (rel * SR);
      const v = 0.24 + 0.76 * Math.pow(x, 0.55);   // dip then recover
      if (v < duck[i]) duck[i] = v;
    }
  }
}

// ---------- mix ----------
const outL = new Float32Array(N), outR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const d = duck[i];
  outL[i] = drumL[i] * 1.35 + musL[i] * d * 0.9 + rvL[i] * d * 0.42;
  outR[i] = drumR[i] * 1.35 + musR[i] * d * 0.9 + rvR[i] * d * 0.42;
}

// gentle bus compression + soft clip + fades
function master(buf) {
  let envF = 0;
  const fin = Math.floor(0.12 * SR), fout = Math.floor(1.2 * SR);
  for (let i = 0; i < N; i++) {
    let s = buf[i] * 1.15;
    // simple peak follower compressor
    const a = Math.abs(s);
    envF = a > envF ? a * 0.35 + envF * 0.65 : envF * 0.9995;
    const thr = 0.78;
    if (envF > thr) s /= 1 + (envF - thr) * 0.8;
    s = Math.tanh(s * 1.02);                      // soft clip / glue
    if (i < fin) s *= i / fin;
    if (i > N - fout) s *= (N - i) / fout;
    buf[i] = s;
  }
}
master(outL); master(outR);

// peak-normalize to -1.5 dBFS so inter-sample peaks stay under 0 dBFS
{
  let pk = 0;
  for (let i = 0; i < N; i++) {
    const a = Math.abs(outL[i]); if (a > pk) pk = a;
    const b = Math.abs(outR[i]); if (b > pk) pk = b;
  }
  const target = 0.84, g = pk > 0 ? target / pk : 1;
  for (let i = 0; i < N; i++) { outL[i] *= g; outR[i] *= g; }
}

// ---------- write 16-bit stereo WAV ----------
const bytes = N * 4;
const buf = Buffer.alloc(44 + bytes);
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
const out = OUT || `music/bed-${DUR}s-v${VAR}.wav`;
writeFileSync(out, buf);
console.log(`wrote ${out} — ${nBars} bars @ ${BPM} BPM, groove ${V.groove}, tone ${V.palette}, lead ${V.useLead?"on":"off"}`);
