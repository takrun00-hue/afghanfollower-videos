// Regenerates all music beds and encodes them with broadcast-safe loudness.
// Usage: node music/build-music.mjs [seconds]   (default 60)
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));
process.chdir(projectDir);

const DUR = Number(process.argv[2]) || 60;

for (const v of [1, 2, 3]) {
  console.log(`\n=== variant ${v} ===`);
  execSync(`node music/synth.mjs ${DUR} ${v}`, { stdio: "inherit" });
  const wav = `music/bed-${DUR}s-v${v}.wav`;
  const m4a = `music/bed-${DUR}s-v${v}.m4a`;
  // loudnorm: streaming-friendly loudness with true-peak ceiling at -1.5 dBTP
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i "${wav}" ` +
    `-af "loudnorm=I=-13:TP=-2.5:LRA=9" -c:a aac -b:a 192k "${m4a}"`,
    { stdio: "inherit" }
  );
  console.log(`  -> ${m4a}`);
}
console.log("\n✅ music rebuilt");
