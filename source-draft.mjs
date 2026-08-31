// Turns one explicitly selected, live-search source into an editable tutorial
// draft. It never renders: the creator sees and approves the source-based copy
// before a video is made.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { replyOnFailure } from "./lib/fail-soft.mjs";
import { isPersianEnough } from "./lib/source-quality.mjs";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));

const n = Math.max(1, Number(process.argv[2]) || 1);
const clean = (value, max = 180) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
const queue = existsSync(".content-search-queue.json")
  ? JSON.parse(readFileSync(".content-search-queue.json", "utf8")) : [];
const source = queue.find((item) => item.n === n);
if (!source) throw new Error(`منبع شمارهٔ ${n} در فهرست فعلی نیست.`);

// Every picked source used to get the same opening line — "فکر می‌کنی این تغییر
// تازه می‌تواند مسیر ساخت ویدیوی تو را عوض کند؟" — so choosing source 2 instead
// of source 5 changed the body and left the first thing on screen identical.
// The hook is what decides whether the video is watched, so it has to come from
// the source that was actually chosen.
function hookFromSource(src) {
  const title = clean(src.title, 120);
  const topic = topicOf(title);
  const hay = title;

  // A headline that already asks something is the question people are typing.
  // Nothing beats using it as it stands.
  if (/[؟?]\s*$/.test(topic)) {
    return { ask: topic.replace(/\s*[?]\s*$/, "؟"), l1: "جوابش", l2: "در همین ویدیو" };
  }

  // A mostly-Latin headline cannot be dropped into the middle of a Persian
  // sentence without reading badly, so it names the subject and the Persian
  // frame carries the rest.
  const latin = (topic.match(/[A-Za-z]/g) || []).length > (topic.match(/[؀-ۿ]/g) || []).length;

  // Angle chosen from what the source is actually about. A refund policy is not
  // a way to earn, and a news item is not a tutorial — matching those wrongly is
  // how the hook ends up promising something the video cannot deliver.
  if (/راهنما|آموزش|چطور|چگونه|how to|guide|step[- ]by[- ]step|tutorial/i.test(hay)) {
    return latin
      ? { ask: `${topic} — قدم‌به‌قدم`, l1: "مرحله به مرحله", l2: "بدون حدس زدن" }
      : { ask: `${topic} را قدم‌به‌قدم یاد بگیر`, l1: "مرحله به مرحله", l2: "بدون حدس زدن" };
  }
  if (/درآمد|کسب درآمد|monet|payout|earn|pay per/i.test(hay)) {
    return { ask: latin ? `${topic}: مسیر واقعی درآمد` : `از ${topic} چطور واقعاً درآمد می‌آید؟`,
             l1: "مسیر درآمد", l2: "بدون وعدهٔ بی‌پایه" };
  }
  if (/سرچ|جستجو|\bsearch\b|\bseo\b|کنسول/i.test(hay)) {
    return { ask: latin ? `${topic} و دیده‌شدن در سرچ` : `کاری کن ${topic} در سرچ پیدا شود`,
             l1: "دیده شدن در سرچ", l2: "بدون تبلیغ" };
  }
  // Anything else is treated as news about a change, which is what it usually is.
  return { ask: latin ? `${topic} — چه چیزی عوض می‌شود؟` : `${topic} برای تو چه فرقی می‌کند؟`,
           l1: "یک تغییر تازه", l2: "که به کارت می‌آید" };
}

// The subject of the headline, without the outlet name and the trailing clause.
function topicOf(title) {
  const cut = clean(String(title)
    .replace(/\s*[-–|؛].*$/, "")
    .replace(/^(آموزش|راهنمای|راهنما)\s+/, ""), 52);
  // A hard character cut lands mid-phrase ("… به سرچ  را"). Drop the dangling
  // last word so the hook ends on something whole.
  return cut.length >= 52 ? cut.replace(/\s+\S*$/, "").trim() : cut;
}

// The title and excerpt below go onto the cards and into the narration word
// for word. An English page therefore produced an English video on a Persian
// channel — the search deliberately allows English sources because the
// operator reads them, which is right for choosing and wrong for building.
// Refuse rather than ship it, and name the way round it.
if (!isPersianEnough(source.title) || !isPersianEnough(String(source.excerpt || "").slice(0, 400))) {
  const msg = [
    "🌐 <b>این منبع فارسی نیست.</b>",
    "",
    "<code>" + clean(source.title, 90) + "</code>",
    "",
    "متنش همان‌طور که هست روی کارت‌ها و در صدا می‌رفت و ویدیو انگلیسی می‌شد.",
    "",
    "اگر موضوعش را می‌خواهی، خودت فارسی‌اش را بفرست:",
    "<code>محتوا: قلاب | گام ۱ | گام ۲ | گام ۳</code>",
  ].join(String.fromCharCode(10));
  const env2 = loadEnv();
  const tg2 = telegramConfig(env2);
  if (tg2.enabled && process.env.NO_TELEGRAM !== "1") {
    await sendMessage({ token: tg2.token, chatId: tg2.chatId, text: msg });
  }
  console.log(msg.replace(/<[^>]*>/g, ""));
  process.exit(0);
}

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
  hook: hookFromSource(source),
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
