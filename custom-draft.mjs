// Creates an editable tutorial draft from a topic that the creator supplied in
// Telegram. The Worker forwards the raw text; this file turns it into the
// existing editorial-gate format.  Explicit creator steps always win.  If the
// creator sends only a topic, the already-configured Grok workflow expands it
// into a *reviewable* draft — never a render or publication.
//
// Two input shapes are genuinely supported:
//   1. "title|hook|step1|step2..." — full control, unchanged since this file
//      was written.
//   2. Numbered or dashed steps in one line — "۱. قلاب اینجا ۲. گام اول
//      ۳. گام دوم" — because by the time this script runs, GitHub Actions'
//      own "Read commands" step has already replaced every real newline with
//      a space (`tr '\r\n' ' '`, telegram.yml), so a message the creator typed
//      as separate lines in Telegram is indistinguishable here from one typed
//      as a single line. Numbered markers are the one structural cue that
//      survives that flattening, so they are what this parses.
// A bare sentence with neither shape has no hook/step boundary to find, and
// nothing in this project can draft them — see the thrown error below for
// exactly what to send instead.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { replyOnFailure } from "./lib/fail-soft.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));
const clean = (value, max = 180) => String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const raw = process.argv.slice(2).join(" ").trim();
const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";

// Splits "متن قلاب ۱. اول ۲) دوم - سوم" into a lead line plus its numbered/
// dashed segments. Matches a digit run (Persian or Latin) followed by one of
// the separators creators actually use, or a plain leading dash for a simple
// bullet list.
const NUMBERED = /(?:^|\s)(?:[0-9۰-۹]+\s*[.\-)、]\s*|-\s+)/gu;

function numberedShape(text) {
  const hits = [...text.matchAll(NUMBERED)];
  if (hits.length < 2) return null; // need at least two real steps
  const steps = [];
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index + hits[i][0].length;
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    const seg = clean(text.slice(start, end));
    if (seg) steps.push(seg);
  }
  if (steps.length < 2) return null;
  // Whatever came before the first marker is the topic line — the natural
  // hook. A list with nothing before its first marker still needs an
  // opening line, so that first step doubles as the hook in that case.
  const lead = clean(text.slice(0, hits[0].index));
  return { hook: lead || steps[0], steps };
}

let parts = raw.split("|").map((x) => clean(x)).filter(Boolean);
let title, hook, stepText;

async function draftBareTopic(topic) {
  if (!grokKey) return null;
  const prompt = [
    "You prepare a Persian (Farsi) short-video DRAFT for a human creator to review.",
    "Return ONLY valid JSON: {title,hook,steps}.",
    "The creator supplied only this topic: " + JSON.stringify(clean(topic, 300)),
    "Write natural Persian. title: at most 12 words. hook: 7-17 words, spoken, curiosity-led.",
    "The hook must not name the app, product, company, brand, or reveal the answer.",
    "Give 2 to 4 short, practical steps. Do not invent statistics, prices, features, UI paths, or guarantees.",
    "Do not promise views, virality, sales, followers, or income. Keep established product names in English only when essential.",
  ].join("\n");
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${grokKey}` },
    body: JSON.stringify({ model: "grok-4-1-fast-reasoning", temperature: 0.25, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error("پیش‌نویس هوش مصنوعی آماده نشد؛ موضوع را با گام‌ها بفرستید یا دوباره تلاش کنید.");
  const body = await response.json();
  const answer = String(body?.choices?.[0]?.message?.content || "");
  const json = answer.match(/\{[\s\S]*\}/)?.[0] || answer;
  let drafted;
  try { drafted = JSON.parse(json); }
  catch { throw new Error("پاسخ پیش‌نویس قابل‌خواندن نبود؛ دوباره تلاش کنید."); }
  const nextTitle = clean(drafted?.title || topic, 160);
  const nextHook = clean(drafted?.hook, 180);
  const nextSteps = Array.isArray(drafted?.steps) ? drafted.steps.map((item) => clean(item, 180)).filter(Boolean).slice(0, 4) : [];
  if (!nextHook || nextSteps.length < 2) throw new Error("پیش‌نویس کامل نبود؛ دوباره تلاش کنید یا گام‌ها را خودتان بفرستید.");
  return { title: nextTitle, hook: nextHook, steps: nextSteps };
}

if (parts.length >= 3) {
  [title, hook, ...stepText] = parts;
} else {
  const shape = numberedShape(raw);
  if (shape) {
    title = shape.hook; hook = shape.hook; stepText = shape.steps;
  } else if (parts.length >= 2) {
    // Exactly one "|" used: read as hook|step, no separate title.
    [hook, ...stepText] = parts; title = hook;
  } else {
    const drafted = await draftBareTopic(raw);
    if (!drafted) {
      const topic = clean(raw, 120).replace(/[؟?]+$/, "") || "موضوع شما";
      throw new Error(
        "پیش‌نویس خودکار در دسترس نیست. یکی از این دو شکل را بفرست:\n" +
        `۱) عنوان | قلاب | گام اول | گام دوم\nمثال: ${topic} | ${topic}؟ | یک نمونهٔ واقعی نشان بده | دعوت به کامنت بگذار\n\n` +
        `۲) اول قلاب، بعد گام‌های شماره‌گذاری‌شده\nمثال: ${topic}؟ ۱. یک نمونهٔ واقعی نشان بده ۲. دعوت به کامنت بگذار`
      );
    }
    ({ title, hook, steps: stepText } = drafted);
  }
}
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
