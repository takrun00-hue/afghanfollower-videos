// Telegram delivery for the daily pipeline. Reads credentials from .env
// (never hard-coded). Sends nothing unless TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
// are set. Bot API sendVideo supports files up to 50 MB — our clips are usually
// ~20-30 MB, but a longer multi-step video (7+ steps, real narration) can cross
// 50 MB and get a flat 413 from Telegram — confirmed live 2026-09-04, twice in
// a row for a 7-step listicle. sendVideo() now compresses and retries once
// instead of failing the whole render after 8 minutes of work.
import { readFileSync, existsSync, statSync } from "node:fs";
import { basename } from "node:path";
import { execFileSync } from "node:child_process";

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

export async function sendMessage({ token, chatId, text, disablePreview = false }) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId, text, parse_mode: "HTML",
      // a digest of links should read as a list, not as one giant link card
      disable_web_page_preview: disablePreview,
    }),
  });
  return res.json().catch(() => ({}));
}

export async function getUpdates({ token, offset, timeout = 50 }) {
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=${timeout}&offset=${offset}`);
  const json = await res.json().catch(() => ({ ok: false }));
  return json.ok ? json.result : [];
}

// A file over Telegram's 50 MB bot-upload cap gets a flat, non-transient 413 —
// retrying the same file changes nothing, so this re-encodes once at a lower
// bitrate (video-only re-encode, audio copied through unchanged — narration
// stays exactly what was verified) and retries with the smaller file.
function compressForTelegram(file) {
  const out = file.replace(/\.mp4$/i, "") + "-tg-compressed.mp4";
  execFileSync("ffmpeg", [
    "-y", "-i", file,
    "-c:v", "libx264", "-b:v", "3000k", "-maxrate", "3200k", "-bufsize", "4000k",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out,
  ], { stdio: "pipe" });
  return out;
}

// Telegram uploads occasionally fail on a transient network hiccup; a scheduled
// run has nobody watching it, so retry with backoff before giving up.
export async function sendVideo(opts) {
  const attempts = opts.attempts ?? 3;
  let lastErr;
  let file = opts.file;
  let compressedOnce = false;
  for (let i = 0; i < attempts; i++) {
    try {
      return await sendVideoOnce({ ...opts, file });
    } catch (e) {
      lastErr = e;
      // A 413 is Telegram telling us the file itself is the problem — compress
      // once and use the smaller file for the remaining attempts, rather than
      // burning the whole retry budget resending something that can't work.
      if (!compressedOnce && /\(413\)/.test(e.message) && statSync(file).size > 45 * 1024 * 1024) {
        compressedOnce = true;
        try { file = compressForTelegram(file); continue; } catch { /* fall through to the normal retry/backoff below */ }
      }
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    }
  }
  throw lastErr;
}

// A downloaded screenshot/broll-frame candidate, for the operator to eyeball
// on their phone and approve or reject — fetch-screens.mjs/fetch-broll.mjs
// only ever produce unverified candidates; this is how "a person looks" now
// happens over Telegram instead of requiring someone at the keyboard.
export async function sendPhoto({ token, chatId, file, caption }) {
  const form = new FormData();
  form.append("chat_id", chatId);
  if (caption) { form.append("caption", caption); form.append("parse_mode", "HTML"); }
  form.append("photo", new Blob([readFileSync(file)]), basename(file));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(`Telegram sendPhoto failed (${res.status}): ${json.description || res.statusText}`);
  return json.result;
}

// Audio, for auditioning a narration voice. sendAudio rather than sendVoice so
// Telegram keeps the caption and lets the file be scrubbed — a voice note plays
// once as a blob, which is no way to compare six takes of the same line.
export async function sendAudio({ token, chatId, file, caption, title }) {
  const form = new FormData();
  form.append("chat_id", chatId);
  if (caption) { form.append("caption", caption); form.append("parse_mode", "HTML"); }
  if (title) form.append("title", title);
  form.append("audio", new Blob([readFileSync(file)], { type: "audio/mpeg" }), basename(file));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(`Telegram sendAudio failed (${res.status}): ${json.description || res.statusText}`);
  return json.result;
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

// Telegram only lets a bot delete its OWN messages, and only within 48 hours.
// Past that the API refuses and the user has to remove it by hand.
export async function deleteMessage({ token, chatId, messageId }) {
  const res = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: !!json.ok, error: json.description || null };
}
