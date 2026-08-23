// Turns the 3 fixed music variants into an unlimited, seed-derived generator so
// every video gets its own track (tempo, key, progression, motif, instrumentation).
import { readFileSync, writeFileSync } from "node:fs";

let s = readFileSync("music/synth.mjs", "utf8");
if (!s.includes("seed-derived")) {
  const start = s.indexOf("// ---------- variants ----------");
  const end = s.indexOf("// ---------- buses ----------");
  if (start < 0 || end < 0) throw new Error("variant block anchors not found");

  const block = `// ---------- seed-derived musical identity ----------
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

const _bpm = 116 + Math.floor(SR_() * 20);        // 116..135
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
};
`;
  s = s.slice(0, start) + block + s.slice(end);

  // honour the instrumentation switches
  s = s.replace(
    "  // ---- plucks / arp ----\n  if (full || sec === 0) {",
    "  // ---- plucks / arp ----\n  if ((full || sec === 0) && V.usePluck) {"
  );
  s = s.replace(
    "  if (full && b / nBars > 0.55) {",
    "  if (full && V.useLead && b / nBars > 0.55) {"
  );
  s = s.replace(
    "      hat(bt + eighth, k === 2 && full);",
    "      hat(bt + eighth + (k % 2 ? V.swing : 0), k === 2 && full && V.openHats);"
  );
  writeFileSync("music/synth.mjs", s);
  console.log("synth: seed-derived music");
}

// ---------- content.mjs: a unique seed per video ----------
let c = readFileSync("lib/content.mjs", "utf8");
if (!c.includes("musicSeed")) {
  c = c.replace(
    "function buildFeaturePack(cat, dayIndex, variant, bpm, beat) {",
    `// distinct per category, per feature, per day -> a track no other video shares
function musicSeedFor(cat, id, dayIndex) {
  const str = cat + "|" + id + "|" + dayIndex;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 100000;
}

function buildFeaturePack(cat, dayIndex, variant, bpm, beat) {`
  );
  c = c.replace(
    "    musicVariant: variant,\n    musicOutroBars: Math.max(2, Math.round(BEATS_OUTRO / 4)),\n    duration: +(totalBeats * beat).toFixed(3),",
    "    musicVariant: musicSeedFor(cat, f.id, dayIndex),\n    musicOutroBars: Math.max(2, Math.round(BEATS_OUTRO / 4)),\n    duration: +(totalBeats * beat).toFixed(3),"
  );
  c = c.replace(
    "    music: `music/auto/${cat}-v${variant}-s.m4a`,",
    "    music: `music/auto/${cat}-${f.id}-s.m4a`,"
  );
  // long-form packs get their own seed too
  c = c.replace(
    "    musicVariant: variant,\n    musicOutroBars: Math.max(2, Math.round(BEATS_OUTRO / 4)),\n    duration: +(totalBeats * beat).toFixed(3),\n    hookDuration: +(BEATS_HOOK * beat).toFixed(3),\n    outroDuration: +(BEATS_OUTRO * beat).toFixed(3),\n    beat: +beat.toFixed(4),\n    music: `music/auto/${cat}-v${variant}${SHORT ? \"-s\" : \"\"}.m4a`,",
    "    musicVariant: musicSeedFor(cat, \"long\", dayIndex),\n    musicOutroBars: Math.max(2, Math.round(BEATS_OUTRO / 4)),\n    duration: +(totalBeats * beat).toFixed(3),\n    hookDuration: +(BEATS_HOOK * beat).toFixed(3),\n    outroDuration: +(BEATS_OUTRO * beat).toFixed(3),\n    beat: +beat.toFixed(4),\n    music: `music/auto/${cat}-long.m4a`,"
  );
  writeFileSync("lib/content.mjs", c);
  console.log("content: per-video music seed");
}
