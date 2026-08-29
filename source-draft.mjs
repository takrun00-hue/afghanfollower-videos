// Turns one explicitly selected, live-search source into an editable tutorial
// draft. It never renders: the creator sees and approves the source-based copy
// before a video is made.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { replyOnFailure } from "./lib/fail-soft.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));

const n = Math.max(1, Number(process.argv[2]) || 1);
const clean = (value, max = 180) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
const queue = existsSync(".content-search-queue.json")
  ? JSON.parse(readFileSync(".content-search-queue.json", "utf8")) : [];
const source = queue.find((item) => item.n === n);
if (!source) throw new Error(`منبع شمارهٔ ${n} در فهرست فعلی نیست.`);

const sentences = String(source.excerpt || "")
  .split(/(?<=[.!؟])\s+/)
  .map((item) => clean(item, 165))
  .filter((item) => item.length > 25)
  .slice(0, 4);
const category = ["tiktok", "instagram", "tools"].includes(source.category) ? source.category : "tools";
const generated = {
  id: `source-${n}-${Date.now()}`,
  platform: category,
  feature: clean(source.title, 110),
  title: clean(source.title, 130),
  hook: {
    ask: "فکر می‌کنی این تغییر تازه می‌تواند مسیر ساخت ویدیوی تو را عوض کند؟",
    l1: "یک تغییر تازه", l2: "که نباید از آن رد شوی",
  },
  payoff: "جزئیات را در منبع اصلی بررسی کن و فقط نکته‌ای را استفاده کن که با کار خودت مرتبط است.",
  outroAsk: "دوست داری نمونهٔ بعدی دربارهٔ کدام موضوع باشد؟",
  tgTitle: `🎬 ${clean(source.title, 100)}\n\n#viral #ContentCreator`,
  tips: (sentences.length ? sentences : [
    "خبر و جزئیات را در منبع اصلی بررسی کن",
    "ببین این تغییر برای چه کاری ساخته شده است",
  ]).map((head, i) => ({ head, icon: ["target", "play", "chart", "pen"][i] || "target", path: source.url })),
};

const draft = {
  kind: "tutorial", featureId: generated.id, generated,
  source: { title: source.title, url: source.url, date: source.date },
  hook: generated.hook.ask, steps: null, updatedAt: new Date().toISOString(),
};
writeFileSync(".content-draft.json", JSON.stringify(draft, null, 2) + "\n");
const result = spawnSync(process.execPath, ["content-draft.mjs", "--preview"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
