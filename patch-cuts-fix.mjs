import { readFileSync, writeFileSync } from "node:fs";
let s = readFileSync("music/synth.mjs", "utf8");

if (!s.includes("const CUTS =")) {
  const anchor = "// paint the accents last so they sit on top of the arrangement";
  if (!s.includes(anchor)) throw new Error("accent loop not found");
  s = s.replace(
    anchor,
    `// ---------- scene-change accents ----------
// The picture changing is the event the ear should feel: a rising whoosh into
// each cut, then a hit on the frame where the new scene lands.
const CUTS = String(process.env.MUSIC_CUTS || "")
  .split(",").map(Number).filter((t) => t > 0.05 && t < DUR - 0.05);

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

${anchor}`
  );
  writeFileSync("music/synth.mjs", s);
  console.log("cut accents defined before use");
} else console.log("already defined");
