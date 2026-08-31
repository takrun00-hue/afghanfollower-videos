// Look for frames that carry nothing.
//
// A blank frame does not fail a render, does not fail a lint, and does not show
// up in any duration or file-size check — the video is the right length and the
// audio keeps talking over an empty card. It is found by looking, and looking
// at 26 seconds of video one frame at a time is not something anyone does
// twice. So it is done here.
//
// The fault this was written for: every scene was handed the average slide
// duration instead of its own, so the exit animation fired early on any slide
// longer than the average and left the card empty until the next one started.
// Three quarters of a second of nothing, in the middle of a sentence.
//
//   node check-frames.mjs renders/daily/2026-08-31/gapmedia-instagram-2026-08-31.mp4
//   node check-frames.mjs <file> --every 0.4 --write out/frames
import { execFileSync } from "node:child_process";
import { mkdtempSync, statSync, readdirSync, rmSync, mkdirSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith("--"));
const flag = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i < 0 ? d : argv[i + 1];
};
if (!file) {
  console.error("usage: node check-frames.mjs <video.mp4> [--every 0.5] [--write dir]");
  process.exit(1);
}

const every = Number(flag("every", 0.5));
const writeTo = flag("write", null);

const seconds = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nk=1:nw=1", file]).toString().trim(),
);

const dir = mkdtempSync(join(tmpdir(), "frames-"));
// One pass, sampled at a fixed rate, scaled small: the measurement is about how
// much of the frame differs from itself, and that survives downscaling.
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", file,
  "-vf", `fps=${(1 / every).toFixed(4)},scale=160:-1`,
  join(dir, "f%05d.png"),
]);

const frames = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();

// How much detail a frame carries, measured by how well it compresses. A card
// with type, a screenshot and a caption compresses far worse than a smooth
// gradient, and the gap between them is not subtle — no image library needed,
// and no ffmpeg metadata parsing, which was the first attempt and was both
// slower and harder to read.
const sizes = frames.map((f) => statSync(join(dir, f)).size);

const median = [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
// 0.42 flagged a slide that was simply simple — one illustration and a line of
// text compresses well and is not empty. An empty frame is a smooth gradient
// and sits far below even that, so the bar is lower and the false alarms stop.
const floor = median * 0.26;

const blanks = [];
sizes.forEach((size, i) => {
  if (size < floor) blanks.push({ at: +(i * every).toFixed(2), size, frame: frames[i] });
});

console.log(`${file}`);
console.log(`${seconds.toFixed(1)}s, ${frames.length} frames sampled every ${every}s`);
console.log(`median detail ${median} bytes, empty below ${Math.round(floor)}`);
console.log("");

if (!blanks.length) {
  console.log("no empty frames");
} else {
  // Neighbouring hits are one gap, not several faults.
  const runs = [];
  for (const b of blanks) {
    const last = runs[runs.length - 1];
    if (last && b.at - last.end <= every * 1.5) { last.end = b.at; last.n++; }
    else runs.push({ start: b.at, end: b.at, n: 1, frame: b.frame });
  }
  for (const r of runs) {
    const len = (r.end - r.start + every).toFixed(2);
    console.log(`  ✗ ${r.start.toFixed(1)}s – ${(r.end + every).toFixed(1)}s   ${len}s empty`);
  }
  if (writeTo) {
    mkdirSync(writeTo, { recursive: true });
    for (const r of runs) copyFileSync(join(dir, r.frame), join(writeTo, `blank-${r.start}s.png`));
    console.log(`\nframes written to ${writeTo}`);
  }
}

rmSync(dir, { recursive: true, force: true });
process.exit(blanks.length ? 1 : 0);
