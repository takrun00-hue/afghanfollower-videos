import { readFileSync, writeFileSync } from "node:fs";
let s = readFileSync("daily-render.mjs", "utf8");
if (!s.includes("make-voice")) {
  s = s.replace(
    "  const silent = `${outDir}/${platform}-silent.mp4`;",
    `  // Persian voiceover, laid on the same scene timings, with the music ducked
  // under it so the words stay intelligible. VOICE=off skips it.
  let voice = null;
  if (process.env.VOICE !== "off") {
    const tipLen = (pack.duration - pack.hookDuration - pack.outroDuration) / pack.tips.length;
    const vFile = \`music/voice/\${platform}-\${pack.id}.m4a\`;
    try {
      execSync(
        \`node music/make-voice.mjs \${pack.id} \${pack.hookDuration} \${tipLen.toFixed(3)} \` +
        \`\${pack.tips.length} \${(pack.duration - pack.outroDuration).toFixed(3)} \${pack.duration} "\${vFile}"\`,
        { stdio: "inherit" }
      );
      if (existsSync(vFile)) voice = vFile;
    } catch (e) {
      console.error("   ✗ voice failed, continuing music-only:", e.message.split("\n")[0]);
    }
  }

  const silent = \`\${outDir}/\${platform}-silent.mp4\`;`
  );
  // mux: music ducked under voice when a voice track exists
  s = s.replace(
    'execSync(`ffmpeg -y -i "${silent}" -i "${music}" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${final}"`, { stdio: "inherit" });',
    `if (voice) {
    execSync(
      \`ffmpeg -y -hide_banner -loglevel error -i "\${silent}" -i "\${music}" -i "\${voice}" \` +
      \`-filter_complex "[1:a]volume=0.55[m];[m][2:a]sidechaincompress=threshold=0.03:ratio=12:attack=15:release=320[duck];[duck][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]" \` +
      \`-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "\${final}"\`,
      { stdio: "inherit" }
    );
  } else {
    execSync(\`ffmpeg -y -i "\${silent}" -i "\${music}" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "\${final}"\`, { stdio: "inherit" });
  }`
  );
  writeFileSync("daily-render.mjs", s);
  console.log("voice + ducking wired into the render");
} else console.log("already wired");
