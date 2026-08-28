// Build one tutorial from the creator's own approved text. It does not invent
// a platform claim or scrape an unverified source: every spoken/onscreen point
// comes from the Telegram payload.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const raw = process.argv.slice(2).join(" ").replace(/[\r\n]+/g, " ").trim();
const parts = raw.split("|").map((x) => x.trim()).filter(Boolean).slice(0, 5);
if (parts.length < 2) {
  throw new Error("برای ساخت محتوای سفارشی، موضوع و دست‌کم یک نکته را با | جدا کنید.");
}

const topic = parts[0].slice(0, 150);
const category = /(اینستا|انستا|instagram|reels|ریلز|edits)/i.test(topic) ? "instagram"
  : /(تیک\s*تاک|tiktok|tik\s*tok)/i.test(topic) ? "tiktok" : "tools";
const id = `custom-${createHash("sha256").update(raw).digest("hex").slice(0, 10)}`;
const provided = parts.slice(1).map((text, i) => ({
  text: text.slice(0, 180),
  // Keyword-based scene art is selected by the existing renderer from this
  // exact text. No generic icon is forced onto an unrelated instruction.
  icon: ["target", "play", "chart", "pen"][i] || "target",
}));
const steps = provided.length >= 4 ? provided.slice(0, 4) : [
  ...provided,
  ...Array.from({ length: 4 - provided.length }, (_, i) => ({
    text: i === 0 ? "یک نمونهٔ واقعی از نتیجه را در ویدیو نشان بده" : "نکتهٔ بعدی را کوتاه و روشن نشان بده",
    icon: "play",
  })),
];

const pack = {
  id,
  category,
  name: category === "instagram" ? "Instagram" : category === "tiktok" ? "TikTok" : "اپ رایگان",
  title: topic,
  benefit: { key: "custom", fa: topic },
  hook: {
    // The hook is deliberately an open loop: it does not answer itself below.
    ask: topic.endsWith("؟") ? topic : `${topic}؛ نتیجه‌اش را تا آخر ببینید`,
    l1: topic,
    l2: "تا پایان ببینید",
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

