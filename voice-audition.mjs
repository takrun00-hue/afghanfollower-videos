// Read one Persian sentence in several voices, so a person can pick by ear.
//
//   node voice-audition.mjs
//
// MiniMax has no Persian-named voice — the system list carries 332 voices and
// not one of them is Persian or Dari. What it does have is language_boost, which
// makes a voice speak a language its name does not advertise. Whether that comes
// out sounding like a native speaker or like an accent is not something a
// specification can answer and not something I can hear, so this generates the
// same line in each candidate and sends them to Telegram to be judged.
//
// The sentence is a real hook from the channel, not "testing 1 2 3": a voice can
// sound fine on a greeting and wrong on the thing it will actually read.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendAudio, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const env = loadEnv();
const key = process.env.MINIMAX_API_KEY || env.MINIMAX_API_KEY || "";
if (!key) { console.error("MINIMAX_API_KEY تنظیم نشده"); process.exit(1); }

const LINE = "آیا می‌دانید چرا ویدیوهایت روی ۲۰۰ ویو گیر می‌کند؟ تا آخر ببین، چهار مرحله را می‌گویم.";

// Arabic and Turkish share more phonemes with Persian than English does, so they
// lead; the English narrators are here because a multilingual model sometimes
// carries a cleaner delivery than a same-family voice.
const CANDIDATES = [
  { id: "Arabic_FriendlyGuy", label: "عربی — مرد صمیمی" },
  { id: "Arabic_CalmWoman", label: "عربی — زن آرام" },
  { id: "Turkish_Trustworthyman", label: "ترکی — مرد قابل‌اعتماد" },
  { id: "Turkish_CalmWoman", label: "ترکی — زن آرام" },
  { id: "English_Steadymentor", label: "انگلیسی — مرد مطمئن" },
  { id: "English_expressive_narrator", label: "انگلیسی — روایتگر" },
];

async function speak(voiceId) {
  const res = await fetch("https://api.minimax.io/v1/t2a_v2", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "speech-2.8-hd",
      text: LINE,
      stream: false,
      language_boost: "Persian",
      output_format: "hex",
      voice_setting: { voice_id: voiceId, speed: 1.1, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 44100, bitrate: 128000, format: "mp3", channel: 1 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.base_resp?.status_code !== 0 || !data?.data?.audio) {
    return { ok: false, why: data?.base_resp?.status_msg || res.statusText || "خطای ناشناخته" };
  }
  return { ok: true, buf: Buffer.from(data.data.audio, "hex") };
}

mkdirSync("music/audition", { recursive: true });
const tg = telegramConfig(env);
const made = [];

for (const c of CANDIDATES) {
  const out = await speak(c.id);
  if (!out.ok) { console.log(`✗ ${c.id}: ${out.why}`); continue; }
  const file = `music/audition/${c.id}.mp3`;
  writeFileSync(file, out.buf);
  made.push({ ...c, file, kb: Math.round(out.buf.length / 1024) });
  console.log(`✓ ${c.label.padEnd(26)} ${c.id}  (${Math.round(out.buf.length / 1024)} KB)`);
}

if (tg.enabled && made.length) {
  await sendMessage({
    token: tg.token, chatId: tg.chatId,
    text: `🎙 <b>انتخاب صدای فارسی</b>\n\nMiniMax هیچ صدای فارسی‌نام ندارد، ولی با <code>language_boost: Persian</code> صداهای دیگر فارسی می‌خوانند.\n\n`
      + `${made.length} نمونه با یک جملهٔ واقعی از کانال می‌فرستم. هر کدام را پسندیدی، شناسه‌اش را بگو تا ثابتش کنم.`,
  });
  for (const m of made) {
    await sendAudio({ token: tg.token, chatId: tg.chatId, file: m.file, title: m.label, caption: `${m.label}\n<code>${m.id}</code>` });
  }
  console.log("\n✈ نمونه‌ها به تلگرام رفت");
}
