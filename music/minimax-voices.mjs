// Lists the voices available to this MiniMax account. The command deliberately
// prints IDs and descriptions only; it never prints or persists the API key.
import { loadEnv, telegramConfig, sendMessage } from "../lib/telegram.mjs";

const apiKey = process.env.MINIMAX_API_KEY || "";
if (!apiKey) {
  console.error("MINIMAX_API_KEY is not set.");
  process.exit(1);
}
const response = await fetch("https://api.minimax.io/v1/get_voice", {
  method: "POST",
  headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
  body: JSON.stringify({ voice_type: "all" }),
});
const data = await response.json().catch(() => ({}));
if (!response.ok || data?.base_resp?.status_code !== 0) {
  console.error(`MiniMax voice list failed: ${data?.base_resp?.status_msg || response.status}`);
  process.exit(1);
}
const all = ["system_voice", "voice_cloning", "voice_generation"]
  .flatMap((kind) => (data[kind] || []).map((voice) => ({ kind, ...voice })));
const persian = all.filter((voice) => /persian|farsi|dari|iran|afghan/i.test(
  `${voice.voice_id || ""} ${voice.voice_name || ""} ${(voice.description || []).join(" ")}`
));
// MiniMax may list a multilingual Persian voice by ID only in a project's
// saved configuration, not in get_voice. Never fall back to unrelated Chinese
// voices and call them Persian — that makes selection misleading and produces
// the wrong pronunciation.
const configuredPersian = process.env.MINIMAX_VOICE_ID
  ? [{ voice_id: process.env.MINIMAX_VOICE_ID, voice_name: "صدای فارسی پیش‌فرض پروژه", kind: "configured" }]
  : [];
const unique = (items) => [...new Map(items.filter((v) => v.voice_id).map((v) => [v.voice_id, v])).values()];
const voices = unique([...configuredPersian, ...persian]);
if (process.argv.includes("--telegram")) {
  const tg = telegramConfig(loadEnv());
  if (!tg.enabled) {
    console.error("Telegram is not configured.");
    process.exit(1);
  }
  const lines = voices.slice(0, 18).map((voice, index) =>
    `${index + 1}. <code>${String(voice.voice_id || "")}</code>\n${String(voice.voice_name || voice.kind || "MiniMax voice")}`
  );
  const note = persian.length
    ? "صداهای فارسی/دری قابل استفاده:"
    : "فقط صدای فارسیِ تنظیم‌شدهٔ پروژه نمایش داده می‌شود؛ صدای غیر فارسی حذف شد.";
  const body = lines.length ? lines.join("\n\n") : "فعلاً Voice ID فارسی در تنظیمات پروژه نیست.";
  await sendMessage({
    token: tg.token, chatId: tg.chatId,
    text: `🎙️ <b>${note}</b>\n\n${body}\n\nبرای تغییر صدای یک ویدیو بنویس: <code>انستا بساز با صدا: Voice_ID</code>`,
  });
}
console.log(JSON.stringify({ voices }, null, 2));
