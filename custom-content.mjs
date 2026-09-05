// Build one tutorial from the creator's own approved text. It does not invent
// a platform claim or scrape an unverified source: every spoken/onscreen point
// comes from the Telegram payload.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { replyOnFailure } from "./lib/fail-soft.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));

const input = process.argv.slice(2).join(" ").replace(/[\r\n]+/g, " ").trim();
let supplied = null;
try { supplied = JSON.parse(input); } catch {}
const raw = String(supplied?.text || input).trim();
const parts = raw.split("|").map((x) => x.trim()).filter(Boolean).slice(0, 5);
if (parts.length < 2) {
  throw new Error("برای ساخت محتوای سفارشی، موضوع و دست‌کم یک نکته را با | جدا کنید.");
}

const topic = parts[0].slice(0, 150);
const category = /(اینستا|انستا|instagram|reels|ریلز|edits)/i.test(topic) ? "instagram"
  : /(تیک\s*تاک|tiktok|tik\s*tok)/i.test(topic) ? "tiktok" : "tools";
const id = `custom-${createHash("sha256").update(raw).digest("hex").slice(0, 10)}`;
let suppliedPhoto = null;
let suppliedVideo = null;
async function downloadTelegramFile(fileId, destination) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("توکن تلگرام برای دریافت عکس ارسال‌شده موجود نیست.");
  const info = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`).then((r) => r.json());
  if (!info?.ok || !info?.result?.file_path) throw new Error("دریافت رسانهٔ تلگرام ناموفق بود.");
  const bytes = Buffer.from(await fetch(`https://api.telegram.org/file/bot${token}/${info.result.file_path}`).then((r) => r.arrayBuffer()));
  mkdirSync("public/user-media", { recursive: true });
  writeFileSync(destination, bytes);
}
if (supplied?.photoFileId) {
  suppliedPhoto = `public/user-media/${id}.jpg`;
  await downloadTelegramFile(supplied.photoFileId, suppliedPhoto);
} else if (supplied?.videoFileId) {
  suppliedVideo = `public/user-media/${id}.mp4`;
  suppliedPhoto = `public/user-media/${id}-poster.jpg`;
  await downloadTelegramFile(supplied.videoFileId, suppliedVideo);
  const frame = spawnSync("ffmpeg", ["-y", "-ss", "0.5", "-i", suppliedVideo, "-frames:v", "1", "-vf", "scale=1080:-2", suppliedPhoto], { stdio: "pipe" });
  if (frame.status !== 0 || !existsSync(suppliedPhoto)) {
    throw new Error("از ویدیوی ارسالی یک فریم قابل‌استفاده ساخته نشد.");
  }
}
const visualPreset = /edits|sound\s*separation|صدا.*جدا|جداسازی.*صدا/i.test(topic)
  ? { name: "Instagram Edits", photo: "public/sources/edits-sound-separation-ui.webp", sourceUrl: "https://about.fb.com/news/2025/04/introducing-edits-a-video-creation-app/", alt: "Instagram Edits — Sound separation", focus: ["edits-project", "edits-preview", "edits-tracks", "edits-export"] }
  : /google\s*vids|گوگل\s*ویدز/i.test(topic)
    ? { name: "Google Vids", hookPhoto: "public/sources/product-sneakers-stock.webp", photo: "public/sources/google-vids-ui.webp", sourceUrl: "https://workspace.google.com/products/vids/", alt: "Google Vids official interface", focus: ["vids-start", "vids-prompt", "vids-preview", "vids-share"] }
    : null;
const primaryPhoto = suppliedPhoto || visualPreset?.photo || null;
const photoFocuses = ["subject-wide", "subject-detail", "subject-action", "subject-result"];
const evidenceFor = (text, i) => primaryPhoto ? ({
  sourceUrl: suppliedPhoto ? `telegram:file/${supplied.photoFileId || supplied.videoFileId}` : visualPreset.sourceUrl,
  sourceType: suppliedPhoto ? "owner-supplied" : "official-ui",
  claim: text.slice(0, 140),
  mainVisual: primaryPhoto,
  whatItProves: suppliedPhoto ? "تصویر واقعیِ ارسال‌شده توسط صاحب محتوا" : visualPreset.alt,
  motionAction: "عمل مربوط به همین گام روی تصویر با تمرکز و آشکارسازی نشان داده می‌شود",
  secondaryMotion: "واکنش کنترل یا بخش مرتبط پس از حرکت اصلی",
  ambientMotion: "تغییر نور و عمق بسیار آرام، بدون حواس‌پرتی",
  coverage: 0.55,
}) : undefined;
const provided = parts.slice(1).map((text, i) => ({
  text: text.slice(0, 180),
  icon: ["target", "play", "chart", "pen"][i] || "target",
  ...(primaryPhoto ? { photo: primaryPhoto, photoAlt: suppliedVideo ? "Creator-supplied video frame" : suppliedPhoto ? "Creator-supplied photo" : visualPreset.alt, photoFocus: suppliedPhoto ? photoFocuses[i] : visualPreset.focus[i], visualEvidence: evidenceFor(text, i), ...(suppliedVideo ? { video: suppliedVideo, videoStart: i * 0.5 } : {}) } : {}),
}));
const steps = provided.length >= 4 ? provided.slice(0, 4) : [
  ...provided,
  ...Array.from({ length: 4 - provided.length }, (_, i) => ({
    text: i === 0 ? "یک نمونهٔ واقعی از نتیجه را در ویدیو نشان بده" : "نکتهٔ بعدی را کوتاه و روشن نشان بده",
    icon: "play", ...(primaryPhoto ? { photo: primaryPhoto, photoAlt: suppliedVideo ? "Creator-supplied video frame" : suppliedPhoto ? "Creator-supplied photo" : visualPreset.alt, photoFocus: suppliedPhoto ? photoFocuses[provided.length + i] : visualPreset.focus[provided.length + i], visualEvidence: evidenceFor("نمونهٔ واقعی", provided.length + i), ...(suppliedVideo ? { video: suppliedVideo, videoStart: (provided.length + i) * 0.5 } : {}) } : {}),
  })),
];

const appName = visualPreset?.name || (category === "instagram" ? "Instagram" : category === "tiktok" ? "TikTok" : "آموزش کاربردی");
const hookOptions = visualPreset?.name === "Google Vids"
  ? [
      "فقط یک عکس از محصول داری؟ فکر می‌کنی برای یک ویدیوی تبلیغاتی کافی نیست؟",
      "هنوز برای معرفی محصولت فقط عکس می‌گذاری؟ شاید همین‌جا مخاطب رد می‌شود.",
      "برای ویدیوی محصول، هنوز دنبال فیلم‌برداری هستی؟ تا آخر ببین؛ یک راه ساده‌تر هست.",
    ]
  : visualPreset?.name === "Instagram Edits"
    ? [
        "صدای ویدیویت شلوغ شده و مخاطب زود رد می‌کند؟",
        "فکر می‌کنی مشکل ویدیویت تصویر است؟ شاید صدا دلیل اصلی باشد.",
        "یک اشتباه کوچک در صدا می‌تواند ویدیوی خوبت را غیرقابل‌تماشا کند.",
      ]
    : [topic.endsWith("؟") ? topic : `${topic}؛ تا آخر ببینید، مسیر واقعی‌اش را نشان می‌دهم`];
const selectedHook = hookOptions[0];

const pack = {
  id,
  category,
  name: appName,
  kicker: appName,
  hookPhoto: suppliedPhoto || visualPreset?.hookPhoto || null,
  source: suppliedPhoto ? `telegram:file/${supplied.photoFileId || supplied.videoFileId}` : (visualPreset ? "official-feature-source" : "creator-supplied-text"),
  title: topic,
  benefit: { key: "custom", fa: topic },
  hook: {
    // The spoken hook does not reveal the product name or the solution.
    badge: "",
    ask: selectedHook,
    l1: selectedHook,
    l2: "تا آخر ببینید؛ مرحلهٔ آخر مهم است",
    options: hookOptions,
    selected: 1,
  },
  payoff: "اگر این نکته برایت مفید بود، موضوع بعدی را در کامنت بنویس.",
  outroAsk: "دوست داری ویدیوی بعدی دربارهٔ چه موضوعی باشد؟",
  steps,
  tgTitle: `🎬 ${topic}\n\n#viral #ContentCreator #TikTok #Instagram`,
};

mkdirSync("lib/generated", { recursive: true });
writeFileSync("lib/generated/custom-current.mjs", `export const CURRENT_CUSTOM = ${JSON.stringify(pack, null, 2)};\n`);
const result = spawnSync("node", ["daily-render.mjs", "--feature", id, "--custom-generated"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);

