// Generate the narration, transcribe it, and report where what was said
// differs from what was written — with the second on the clock, so a fault can
// be checked at the point a listener would name it.
//
// This exists because level meters approved narration that was wrong. A flat
// −26 dB says nothing about «نمونه‌کارت» arriving as «کارت», or a possessive
// breaking off into its own syllable. Reading the audio back as words is the
// closest thing the pipeline has to listening, and it catches the class of
// fault that has actually been reported: a word that came out as a different
// word.
//
// It does not replace the ear. It cannot hear rhythm, breath placement, or
// whether a reading sounds human — a line can transcribe perfectly and still
// be robotic. Those stay with the listener.
//
//   node verify-voice.mjs --feature tiktok-pay
//   node verify-voice.mjs --text "آیا ویوهای تیک‌تاکت..." --text "..."
//   node verify-voice.mjs --feature tiktok-pay --send      # to Telegram
//   node verify-voice.mjs --reuse out/verify/tiktok-pay    # skip generation
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { minimaxSpeakable } from "./lib/pronounce.mjs";
import { ttsBody, voiceSettings, drift, trimDeadAir } from "./lib/voice-settings.mjs";
import { faults, mmss } from "./lib/hear.mjs";
import { loadEnv, telegramConfig, sendAudio, sendMessage } from "./lib/telegram.mjs";

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i < 0 ? null : argv[i + 1];
};
const many = (name) =>
  argv.reduce((acc, a, i) => (a === `--${name}` ? [...acc, argv[i + 1]] : acc), []);
const has = (name) => argv.includes(`--${name}`);

const env = loadEnv();
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v;

const feature = flag("feature");
const reuse = flag("reuse");
const model = flag("model") || "medium";

/** The lines the video will speak, in order — from narrationFor(), the same
 * function make-voice.mjs calls. Reconstructing hook+tips by hand here once
 * missed the payoff/outro line entirely — narrationFor() falls back to
 * pack.payoff for a feature with no hand-written script, and that line is
 * where «لای الگوریتم فید» actually lived. Whatever ships is what this reads. */
async function linesFor() {
  const given = many("text");
  if (given.length) return given;
  if (!feature) {
    console.error("give --feature <key> or one or more --text \"...\"");
    process.exit(1);
  }
  const { narrationFor } = await import("./lib/narration.mjs");
  const vo = narrationFor(feature);
  if (!vo) { console.error(`no narration found for "${feature}"`); process.exit(1); }
  return [vo.hook, ...vo.steps, vo.outro].filter(Boolean);
}

const written = await linesFor();
const spoken = written.map(minimaxSpeakable);
const dir = reuse || `out/verify/${feature || "text"}`;
mkdirSync(dir, { recursive: true });

// Generation is one request per line, the way the render does it. A single long
// request loses level as it runs, so a check built any other way would judge
// the narration on a fault the finished video does not have.
const settings = voiceSettings();
const files = [];
if (reuse) {
  files.push(
    ...readdirSync(dir)
      .filter((f) => /^line\d+\.mp3$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
      .map((f) => `${dir}/${f}`),
  );
  if (files.length !== spoken.length) {
    console.error(`--reuse found ${files.length} clips for ${spoken.length} lines; regenerate instead`);
    process.exit(1);
  }
} else {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) {
    console.error("MINIMAX_API_KEY is not set");
    process.exit(1);
  }
  for (let i = 0; i < spoken.length; i++) {
    const res = await fetch("https://api.minimax.io/v1/t2a_v2", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(ttsBody(spoken[i], settings)),
    });
    const data = await res.json().catch(() => ({}));
    if (!data?.data?.audio) {
      console.error(`line ${i + 1} failed: ${data?.base_resp?.status_msg || res.status}`);
      process.exit(1);
    }
    const f = `${dir}/line${i}.mp3`;
    writeFileSync(f, Buffer.from(data.data.audio, "hex"));
    trimDeadAir(f);
    files.push(f);
    process.stdout.write(`  generated ${i + 1}/${spoken.length}\r`);
  }
  console.log(`  generated ${spoken.length} lines            `);
}

const seconds = (f) =>
  Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", f,
    ]).toString().trim(),
  );

// Offsets into the stitched track, so a reported second matches the file the
// listener is given rather than the clip it came from.
const offsets = [];
let running = 0;
for (const f of files) {
  offsets.push(running);
  running += seconds(f);
}

const stitched = `${dir}/full.mp3`;
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  ...files.flatMap((f) => ["-i", f]),
  "-filter_complex", `${files.map((_, i) => `[${i}:a]`).join("")}concat=n=${files.length}:v=0:a=1`,
  stitched,
]);

console.log(`  transcribing with whisper ${model} …`);
const job = JSON.stringify({ model, files });
const out = execFileSync("python", ["lib/asr.py"], {
  input: job,
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
});
const { results } = JSON.parse(out.toString());

const report = spoken.map((line, i) => {
  const r = results[i] || { text: "", words: [] };
  return {
    n: i + 1,
    at: mmss(offsets[i]),
    written: written[i],
    spoken: line,
    heard: r.text,
    faults: faults({ expected: line, heard: r.text, words: r.words, offset: offsets[i] }),
  };
});

const off = drift(settings);
console.log("");
console.log(`voice   ${settings.voiceId} · ${settings.emotion} · speed ${settings.speed} · pitch ${settings.pitch}`);
if (off.length) console.log(`        NOT the approved reading — ${off.join(", ")}`);
console.log(`track   ${stitched}  (${running.toFixed(1)}s)`);
console.log("");

let total = 0;
for (const line of report) {
  const bad = line.faults.filter((f) => f.kind !== "extra" || f.got.length > 1);
  total += bad.length;
  console.log(`${line.at}  line ${line.n}`);
  console.log(`      sent  ${line.spoken}`);
  console.log(`      heard ${line.heard}`);
  for (const f of bad) {
    if (f.kind === "wrong") console.log(`      ✗ ${f.where}  «${f.want}» heard as «${f.got}»`);
    else if (f.kind === "missing") console.log(`      ✗ ${f.where}  «${f.want}» not heard`);
    else console.log(`      ✗ ${f.where}  extra «${f.got}»`);
  }
  if (!bad.length) console.log("      ✓ every word came back");
  console.log("");
}

console.log(total === 0
  ? "No word-level fault. Rhythm, breath and naturalness still need a listener."
  : `${total} word-level fault${total === 1 ? "" : "s"} above, with the second to check each one.`);

writeFileSync(`${dir}/report.json`, JSON.stringify({ settings, report }, null, 2));

if (has("send")) {
  const tg = telegramConfig(env);
  const body = report
    .map((l) => {
      const bad = l.faults.filter((f) => f.kind !== "extra" || f.got.length > 1);
      const head = `<b>${l.at} · ${l.n}</b>\n<code>${l.spoken}</code>`;
      if (!bad.length) return `${head}\n✓ همه کلمات درست برگشت`;
      return `${head}\n` + bad.map((f) =>
        f.kind === "wrong"
          ? `✗ ${f.where} — «${f.want}» → «${f.got}»`
          : f.kind === "missing"
            ? `✗ ${f.where} — «${f.want}» شنیده نشد`
            : `✗ ${f.where} — اضافه «${f.got}»`,
      ).join("\n");
    })
    .join("\n\n");
  await sendMessage({
    token: tg.token, chatId: tg.chatId,
    text: `🎧 <b>بررسی تلفظ</b>\n<code>${settings.voiceId} · ${settings.emotion} · ${settings.speed} · pitch ${settings.pitch}</code>\n\n${body}\n\n<i>این بررسی ماشینی است و فقط کلمه را می‌سنجد. ریتم و انسانی بودن با گوش شما.</i>`,
  });
  await sendAudio({ token: tg.token, chatId: tg.chatId, file: stitched, title: feature || "verify" });
}
