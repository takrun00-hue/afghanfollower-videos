import { readFileSync, writeFileSync } from "node:fs";

// ---- 1. sticker styling was wiped when the CSS region was swapped; re-add it ----
let b = readFileSync("lib/build-ink.mjs", "utf8");
if (!b.includes(".sticker{")) {
  b = b.replace(
    "/* --- step scene --- */",
    `/* stickers fill the corners the layout leaves bare */
.sticker{position:absolute;z-index:1;pointer-events:none;display:grid;place-items:center;
  width:132px;height:132px;border-radius:38px;background:rgba(255,255,255,.92);
  border:3px solid currentColor;box-shadow:0 14px 30px rgba(30,20,10,.16)}
.sticker svg{width:78px!important;height:78px!important}
.sticker.s-a{left:64px;top:470px}
.sticker.s-b{right:64px;top:400px;width:110px;height:110px;border-radius:32px}
.sticker.s-b svg{width:62px!important;height:62px!important}
/* --- step scene --- */`
  );
  writeFileSync("lib/build-ink.mjs", b);
  console.log("sticker styling restored");
}

// ---- 2. music: a whoosh into every cut and a hit on it ----
let s = readFileSync("music/synth.mjs", "utf8");
if (!s.includes("MUSIC_CUTS")) {
  s = s.replace(
    "// ---------- arrangement per style ----------",
    `// ---------- scene-change accents ----------
// The picture changing is the event the ear should feel: a rising whoosh into
// each cut, then a hit on the frame where the new scene lands.
const CUTS = String(process.env.MUSIC_CUTS || "")
  .split(",").map(Number).filter((t) => t > 0.05 && t < DUR - 0.05);

function whoosh(t0, dur) {
  const bp = svf(), hp = svfHP();
  write(musL, musR, t0, dur, (t) => {
    const x = Math.min(1, t / dur);
    const e = x * x * x;                       // stays quiet, then rushes in
    const nz = hp(bp(noise(), 500 + 5200 * x, 1.7), 350) * 0.42 * e;
    return [nz * (1 - x * 0.35), nz * (0.65 + x * 0.35)];   // sweeps across the stereo field
  });
}
function hit(t0) {
  const hp = svfHP();
  write(drumL, drumR, t0, 0.9, (t) => {
    const crash = hp(noise(), 3800, 0.8) * Math.exp(-t * 7) * 0.34;
    const thump = Math.sin(2 * Math.PI * (68 * Math.exp(-t * 6)) * t) * Math.exp(-t * 9) * 0.5;
    const s2 = crash + thump;
    return [s2, s2];
  });
  write(revL, revR, t0, 0.8, (t) => {
    const s2 = noise() * Math.exp(-t * 9) * 0.16;
    return [s2, s2 * 0.9];
  });
}

// ---------- arrangement per style ----------`
  );
  s = s.replace(
    "// ---------- delay (dotted 8th feedback) ----------",
    `// paint the accents last so they sit on top of the arrangement
for (const c of CUTS) { whoosh(Math.max(0, c - 0.45), 0.45); hit(c); }

// ---------- delay (dotted 8th feedback) ----------`
  );
  writeFileSync("music/synth.mjs", s);
  console.log("music: cut accents added");
}

// ---- 3. pass the scene starts, and drop the voice by default ----
let d = readFileSync("daily-render.mjs", "utf8");
if (!d.includes("MUSIC_CUTS")) {
  d = d.replace(
    'if (process.env.VOICE !== "off") {\n    try {\n      const plan = JSON.parse(',
    'if (process.env.VOICE === "on") {\n    try {\n      const plan = JSON.parse('
  );
  d = d.replace(
    '  if (process.env.VOICE !== "off") {\n    const tipLen',
    '  if (process.env.VOICE === "on") {\n    const tipLen'
  );
  // hand the cut times to the music generator
  d = d.replace(
    "      `node music/make-one.mjs ${pack.duration} ${pack.musicVariant} \"${pack.music}\" ${pack.musicOutroBars || 4}`,\n      { stdio: \"inherit\" }",
    `      \`node music/make-one.mjs \${pack.duration} \${pack.musicVariant} "\${pack.music}" \${pack.musicOutroBars || 4}\`,
      { stdio: "inherit", env: { ...process.env, MUSIC_CUTS: cutTimes.join(",") } }`
  );
  d = d.replace(
    "  let music = pack.music;",
    `  // every scene boundary, so the score can punctuate the picture changing
  const cutTimes = (() => {
    const lens = pack.tipDurations ||
      Array.from({ length: pack.tips.length },
        () => (pack.duration - pack.hookDuration - pack.outroDuration) / pack.tips.length);
    const out = [pack.hookDuration];
    let acc = pack.hookDuration;
    for (const L of lens) { acc += L; out.push(+acc.toFixed(3)); }
    return out;
  })();

  let music = pack.music;`
  );
  writeFileSync("daily-render.mjs", d);
  console.log("render: cuts passed to music; voice now opt-in (VOICE=on)");
}
