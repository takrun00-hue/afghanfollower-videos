// Editorial gate for tutorial videos. A Telegram request creates a draft first;
// only an explicit approval may render and post it.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { packForFeature } from "./lib/content.mjs";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
const DRAFT = ".content-draft.json";
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ""; };
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clean = (s, max = 320) => String(s || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function load() {
  if (!existsSync(DRAFT)) throw new Error("پیش‌نویس آموزشی وجود ندارد. ابتدا «جستجوی محتوا» یا نام شبکه را بفرست.");
  return JSON.parse(readFileSync(DRAFT, "utf8"));
}
function save(draft) { writeFileSync(DRAFT, JSON.stringify(draft, null, 2) + "\n"); }
function baseFor(draft) {
  const pack = packForFeature(draft.featureId, new Date());
  if (!pack) throw new Error("موضوع پیش‌نویس دیگر در بانک محتوا نیست.");
  return pack;
}
async function announce(draft) {
  const base = baseFor(draft);
  const steps = (draft.steps?.length ? draft.steps : base.tips.map((x) => x.head)).slice(0, 4);
  const text =
    `🎬 <b>پیش‌نویس آموزشی</b>\n` +
    `<b>${esc(base.feature)}</b>\n\n` +
    `<b>قلاب:</b> ${esc(draft.hook || base.hook.ask)}\n\n` +
    steps.map((s, i) => `${i + 1}. ${esc(s)}`).join("\n") +
    `\n\n✅ ساخت با صدا: <code>تأیید محتوا</code>` +
    `\n✏️ تغییر قلاب: <code>ادیت قلاب: متن تازه</code>` +
    `\n📝 تغییر اسلایدها: <code>ادیت متن: گام۱ | گام۲ | گام۳ | گام۴</code>` +
    `\n🔎 پیشنهاد تازه: <code>جستجوی محتوا</code>`;
  const env = loadEnv(), tg = telegramConfig(env);
  if (tg.enabled && process.env.NO_TELEGRAM !== "1") await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true });
  else console.log(text);
}

if (args[0] === "--create") {
  const featureId = clean(args[1], 100).toLowerCase();
  const base = packForFeature(featureId, new Date());
  if (!base) throw new Error("موضوع انتخاب‌شده معتبر نیست.");
  const draft = { kind: "tutorial", featureId, hook: base.hook.ask, steps: null, updatedAt: new Date().toISOString() };
  save(draft);
  await announce(draft);
} else if (args[0] === "--edit-hook") {
  const draft = load();
  const hook = clean(arg("--edit-hook"), 180);
  if (!hook) throw new Error("متن قلاب خالی است.");
  draft.hook = hook.endsWith("؟") || hook.endsWith(".") || hook.endsWith("!") ? hook : `${hook}؟`;
  draft.updatedAt = new Date().toISOString(); save(draft); await announce(draft);
} else if (args[0] === "--edit-steps") {
  const draft = load();
  const steps = clean(arg("--edit-steps"), 760).split("|").map((x) => clean(x, 180)).filter(Boolean).slice(0, 4);
  if (!steps.length) throw new Error("دست‌کم یک گام لازم است.");
  draft.steps = steps; draft.updatedAt = new Date().toISOString(); save(draft); await announce(draft);
} else if (args[0] === "--preview") {
  await announce(load());
} else if (args[0] === "--build") {
  const draft = load();
  const base = baseFor(draft);
  const customId = `draft-${createHash("sha256").update(JSON.stringify(draft)).digest("hex").slice(0, 12)}`;
  const override = draft.steps?.length ? draft.steps : null;
  const generated = {
    id: customId, category: base.platform, name: base.feature, title: base.title,
    benefit: base.hook.benefit || null,
    hook: { ...base.hook, ask: draft.hook || base.hook.ask },
    payoff: base.payoff, outroAsk: base.outroAsk, tgTitle: base.tgTitle,
    steps: base.tips.map((tip, i) => ({
      text: override?.[i] || tip.head, icon: tip.icon, path: tip.path,
      screen: tip.screen, ui: tip.ui, brand: tip.brand, photo: tip.photo, photoFocus: tip.photoFocus,
    })),
  };
  mkdirSync("lib/generated", { recursive: true });
  writeFileSync("lib/generated/custom-current.mjs", `export const CURRENT_CUSTOM = ${JSON.stringify(generated, null, 2)};\n`);
  const out = spawnSync("node", ["daily-render.mjs", "--feature", customId, "--custom-generated"], { stdio: "inherit", env: process.env });
  process.exit(out.status ?? 1);
} else {
  throw new Error("دستور پیش‌نویس ناشناخته است.");
}
