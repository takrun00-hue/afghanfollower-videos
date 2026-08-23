import { readFileSync, writeFileSync } from "node:fs";
let s = readFileSync("daily-render.mjs", "utf8");
if (!s.includes("plan-voice")) {
  s = s.replace(
    "  const comp = `${compDir}/${platform}.html`;",
    `  // Measure the narration FIRST, then let each scene last as long as its own
  // spoken line (padded, and never shorter than a readable beat). Without this
  // the voice drifts past the caption it belongs to.
  if (process.env.VOICE !== "off") {
    try {
      const plan = JSON.parse(
        execSync(\`node music/plan-voice.mjs \${pack.id}\`, { encoding: "utf8" }).trim().split("\n").pop()
      );
      if (plan.ok && plan.durs.length === pack.tips.length + 2) {
        const PAD = 0.45, MIN = 1.9;
        pack.hookDuration = +Math.max(MIN + 0.3, plan.durs[0] + PAD).toFixed(3);
        pack.tipDurations = plan.durs.slice(1, -1).map((d) => +Math.max(MIN, d + PAD).toFixed(3));
        pack.outroDuration = +Math.max(3.2, plan.durs[plan.durs.length - 1] + 1.1).toFixed(3);
        pack.duration = +(
          pack.hookDuration + pack.tipDurations.reduce((a, d) => a + d, 0) + pack.outroDuration
        ).toFixed(3);
        pack.music = pack.music.replace(/\.m4a$/, "-vo.m4a");
        console.log(\`   timing follows speech: \${pack.duration}s\`);
      }
    } catch (e) {
      console.error("   ✗ voice planning failed, using the beat grid:", String(e.message).split(String.fromCharCode(10))[0]);
    }
  }

  const comp = \`\${compDir}/\${platform}.html\`;`
  );
  // the voice track must be built on the SAME timings
  s = s.replace(
    "    const tipLen = (pack.duration - pack.hookDuration - pack.outroDuration) / pack.tips.length;",
    "    const tipLen = (pack.duration - pack.hookDuration - pack.outroDuration) / pack.tips.length;\n    const tipList = (pack.tipDurations || []).join(\",\");"
  );
  s = s.replace(
    "`node music/make-voice.mjs ${pack.id} ${pack.hookDuration} ${tipLen.toFixed(3)} ` +",
    "`node music/make-voice.mjs ${pack.id} ${pack.hookDuration} ${tipLen.toFixed(3)} ` +\n        `${tipList ? `--tips ${tipList} ` : \"\"}` +"
  );
  writeFileSync("daily-render.mjs", s);
  console.log("render: speech-driven timing");
} else console.log("already wired");
