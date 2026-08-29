// Creates an editable tutorial draft from a topic that the creator supplied in
// Telegram. The Worker prepares the concise hook and steps; this file only
// turns that approved structure into the existing editorial-gate format.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { replyOnFailure } from "./lib/fail-soft.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));
const clean = (value, max = 180) => String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const parts = process.argv.slice(2).join(" ").split("|").map((x) => clean(x)).filter(Boolean);
if (parts.length < 3) throw new Error("موضوعِ آماده باید عنوان، قلاب و دست‌کم یک گام داشته باشد.");

const [title, hook, ...stepText] = parts;
const category = /(انستا|instagram|reels|ریلز|edits)/i.test(title) ? "instagram"
  : /(تیک\s*تاک|tiktok|tik\s*tok)/i.test(title) ? "tiktok" : "tools";
const generated = {
  id: `creator-topic-${Date.now()}`,
  platform: category,
  feature: title,
  title,
  hook: { ask: hook, l1: hook, l2: "تا پایان، گام‌ها را ببین" },
  payoff: "این پیش‌نویس بر اساس موضوعی است که خودت فرستادی؛ قبل از ساخت آن را بررسی و ادیت کن.",
  outroAsk: "دوست داری ویدیوی بعدی دربارهٔ چه موضوعی باشد؟",
  tgTitle: `🎬 ${title}\n\n#viral #ContentCreator`,
  tips: stepText.slice(0, 4).map((head, i) => ({ head, icon: ["target", "play", "chart", "pen"][i] || "target" })),
};
const draft = {
  kind: "tutorial", featureId: generated.id, generated,
  hook: generated.hook.ask, steps: null, updatedAt: new Date().toISOString(),
};
writeFileSync(".content-draft.json", JSON.stringify(draft, null, 2) + "\n");
const result = spawnSync(process.execPath, ["content-draft.mjs", "--preview"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
