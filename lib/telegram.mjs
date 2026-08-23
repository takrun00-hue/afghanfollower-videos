// Telegram delivery for the daily pipeline. Reads credentials from .env
// (never hard-coded). Sends nothing unless TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
// are set. Bot API sendVideo supports files up to 50 MB — our clips are ~20 MB.
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";

// tiny .env loader (no external deps)
export function loadEnv(path = ".env") {
  const env = { ...process.env };
  if (existsSync(path)) {
    for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i === -1) continue;
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      env[key] = val;
    }
  }
  return env;
}

export function telegramConfig(env = loadEnv()) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  return { enabled: Boolean(token && chatId), token, chatId };
}

export async function sendMessage({ token, chatId, text }) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  return res.json().catch(() => ({}));
}

export async function getUpdates({ token, offset, timeout = 50 }) {
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=${timeout}&offset=${offset}`);
  const json = await res.json().catch(() => ({ ok: false }));
  return json.ok ? json.result : [];
}

// Telegram uploads occasionally fail on a transient network hiccup; a scheduled
// run has nobody watching it, so retry with backoff before giving up.
export async function sendVideo(opts) {
  const attempts = opts.attempts ?? 3;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await sendVideoOnce(opts);
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    }
  }
  throw lastErr;
}

async function sendVideoOnce({ token, chatId, file, caption }) {
  const buf = readFileSync(file);
  const form = new FormData();
  form.append("chat_id", chatId);
  if (caption) { form.append("caption", caption); form.append("parse_mode", "HTML"); }
  form.append("supports_streaming", "true");
  form.append("video", new Blob([buf], { type: "video/mp4" }), basename(file));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    throw new Error(`Telegram sendVideo failed (${res.status}): ${json.description || res.statusText}`);
  }
  return json.result;
}
