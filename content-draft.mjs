// Editorial gate for tutorial videos. A Telegram request creates a draft first;
// only an explicit approval may render and post it.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { packForFeature } from "./lib/content.mjs";
import { reviewViralReadiness } from "./lib/viral-readiness.mjs";
import { assertVisualProof } from "./lib/visual-proof.mjs";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { replyOnFailure } from "./lib/fail-soft.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));
const DRAFT = ".content-draft.json";
const SCREEN_MANIFEST = "public/screens/candidates.json";
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ""; };
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clean = (s, max = 320) => String(s || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function load() {
  if (!existsSync(DRAFT)) throw new Error("پیش‌نویس آموزشی وجود ندارد. ابتدا «جستجوی محتوا» یا نام شبکه را بفرست.");
  return JSON.parse(readFileSync(DRAFT, "utf8"));
}
function save(draft) { writeFileSync(DRAFT, JSON.stringify(draft, null, 2) + "\n"); }
function verifiedScreenFor(featureId) {
  try {
    const candidates = JSON.parse(readFileSync(SCREEN_MANIFEST, "utf8"));
    const item = (candidates[featureId] || []).find((x) => x.verified && existsSync(x.file));
    return item || null;
  } catch { return null; }
}

function attachVerifiedScreen(base, featureId) {
  const image = verifiedScreenFor(featureId);
  if (!image) return base;
  const focuses = ["wide", "control", "action", "result"];
  return {
    ...base,
    source: base.source || image.page,
    tips: (base.tips || []).map((tip, i) => tip.photo ? tip : ({
      ...tip,
      photo: image.file,
      photoAlt: image.pageTitle || "تصویر واقعیِ تأییدشده",
      photoFocus: focuses[i] || `step-${i + 1}`,
      visualEvidence: {
        sourceUrl: image.page,
        sourceType: "official-asset",
        claim: tip.head || tip.text || "گام آموزشی",
        mainVisual: image.file,
        whatItProves: "تصویر واقعیِ منبع که برای همین پیش‌نویس تأیید شده است",
        motionAction: "روی بخش مرتبط با همین گام زوم می‌شود",
        secondaryMotion: "کنترل یا نتیجهٔ مرتبط برجسته می‌شود",
        ambientMotion: "حرکت نور بسیار آرام برای حفظ عمق",
        coverage: 0.55,
      },
    })),
  };
}

function baseFor(draft) {
  if (draft.generated && Array.isArray(draft.generated.tips)) return attachVerifiedScreen(draft.generated, draft.featureId);
  const pack = packForFeature(draft.featureId, new Date());
  if (!pack) throw new Error("موضوع پیش‌نویس دیگر در بانک محتوا نیست.");
  return attachVerifiedScreen(pack, draft.featureId);
}

function visualBlocker(base, id) {
  try {
    assertVisualProof({ ...base, id, tips: base.tips || [] });
    return "";
  } catch (error) {
    return String(error.message || error);
  }
}
async function announce(draft) {
  const base = baseFor(draft);
  const steps = (draft.steps?.length ? draft.steps : base.tips.map((x) => x.head)).slice(0, 4);
  const review = reviewViralReadiness({
    hook: draft.hook || base.hook.ask,
    tips: steps,
    outroAsk: base.outroAsk,
    source: base.source,
  });
  const state = review.status === "ready" ? "آمادهٔ بررسی" : review.status === "blocked" ? "نیازمند اصلاح" : "نیازمند بازبینی";
  const reviewNotes = [...review.blockers, ...review.notes].slice(0, 2);
  const visualIssue = visualBlocker(base, draft.featureId);
  // Present only when a caller (content-search.mjs, for its rule-8 draft)
  // actually set them — an old catalogue-feature draft has none of these and
  // the message renders exactly as it always did.
  const extra = [];
  if (Array.isArray(draft.hookOptions) && draft.hookOptions.length > 1) {
    extra.push(
      `<b>سه گزینهٔ قلاب:</b>\n` +
      draft.hookOptions.map((h, i) => `${i + 1}. ${esc(h)}${h === (draft.hook || base.hook.ask) ? " ✅" : ""}`).join("\n") +
      (draft.hookReason ? `\n<i>دلیل انتخاب: ${esc(draft.hookReason)}</i>` : "")
    );
  }
  if (draft.teaser) extra.push(`<b>زیرِ قلاب:</b> ${esc(draft.teaser)}`);
  if (draft.graphicPlan) extra.push(`<b>طرح گرافیک/موشن:</b> ${esc(draft.graphicPlan)}`);
  if (draft.imageNeed) extra.push(`<b>تصویر لازم:</b> ${esc(draft.imageNeed)}`);
  if (draft.musicPlan) extra.push(`<b>ریتم/موسیقی:</b> ${esc(draft.musicPlan)}`);
  if (draft.sourceUrl) extra.push(`<b>منبع رسمی:</b> <a href="${esc(draft.sourceUrl)}">${esc(draft.sourceDate || "باز کردن منبع")}</a>`);
  if (visualIssue) {
    extra.push(
      `<b>تصویر واقعی:</b> هنوز تأیید نشده است. نامزدِ تصویر از منبع ارسال می‌شود؛ ` +
      `پس از دیدن آن فقط «تأیید تصویر ${esc(draft.featureId)} شماره» را بفرستید. تا آن زمان ویدیویی ساخته نمی‌شود.`
    );
  } else {
    extra.push(`<b>تصویر واقعی:</b> تأیید شد و برای هر اسلاید با برش متفاوت استفاده می‌شود.`);
  }
  const text =
    `🎬 <b>پیش‌نویس آموزشی</b>\n` +
    `<b>${esc(base.feature)}</b>\n\n` +
    `<b>قلاب:</b> ${esc(draft.hook || base.hook.ask)}\n\n` +
    steps.map((s, i) => `${i + 1}. ${esc(s)}`).join("\n") +
    (extra.length ? `\n\n${extra.join("\n\n")}` : "") +
    `\n\n<b>آمادگی محتوا:</b> ${review.score}/100 — ${state}` +
    (reviewNotes.length ? `\n<i>${esc(reviewNotes.join(" "))}</i>` : "") +
    (visualIssue ? "" : `\n\n✅ ساخت با صدا: <code>تأیید محتوا</code>`) +
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
  // A direct claim can outperform a question. Preserve the editor's chosen
  // hook form instead of forcing every edit into a question.
  draft.hook = hook;
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
  const readiness = reviewViralReadiness({
    hook: draft.hook || base.hook.ask,
    tips: draft.steps?.length ? draft.steps : base.tips,
    outroAsk: base.outroAsk,
    source: base.source,
  });
  if (readiness.status === "blocked") {
    throw new Error(`پیش‌نویس برای ساخت آماده نیست: ${readiness.blockers.join(" ")}`);
  }
  const issue = visualBlocker(base, draft.featureId);
  if (issue) {
    const env = loadEnv(), tg = telegramConfig(env);
    const text = `🖼 <b>ساخت شروع نشد</b>\n\n${esc(issue)}\n\n` +
      `این پیش‌نویس اول به تصویر واقعیِ تأییدشده نیاز دارد. نامزدِ تصویر را ببینید و «تأیید تصویر ${esc(draft.featureId)} شماره» را بفرستید.`;
    if (tg.enabled && process.env.NO_TELEGRAM !== "1") await sendMessage({ token: tg.token, chatId: tg.chatId, text });
    else console.log(text);
    process.exit(0);
  }
  const customId = `draft-${createHash("sha256").update(JSON.stringify(draft)).digest("hex").slice(0, 12)}`;
  const override = draft.steps?.length ? draft.steps : null;
  const generated = {
    id: customId, category: base.platform, name: base.feature, title: base.title,
    benefit: base.hook.benefit || null,
    hook: { ...base.hook, ask: draft.hook || base.hook.ask },
    payoff: base.payoff, outroAsk: base.outroAsk, tgTitle: base.tgTitle,
    steps: base.tips.map((tip, i) => ({
      text: override?.[i] || tip.head, icon: tip.icon, path: tip.path,
      screen: tip.screen, ui: tip.ui, brand: tip.brand, photo: tip.photo, photoAlt: tip.photoAlt,
      photoFocus: tip.photoFocus, visualEvidence: tip.visualEvidence, video: tip.video, videoStart: tip.videoStart,
    })),
  };
  mkdirSync("lib/generated", { recursive: true });
  writeFileSync("lib/generated/custom-current.mjs", `export const CURRENT_CUSTOM = ${JSON.stringify(generated, null, 2)};\n`);
  const out = spawnSync("node", ["daily-render.mjs", "--feature", customId, "--custom-generated"], { stdio: "inherit", env: process.env });
  process.exit(out.status ?? 1);
} else {
  throw new Error("دستور پیش‌نویس ناشناخته است.");
}
