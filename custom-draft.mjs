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
import { loadEnv } from "./lib/telegram.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));
const clean = (value, max = 180) => String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const raw = process.argv.slice(2).join(" ").trim();
// GitHub Actions sets process.env directly from repo secrets, so this alone
// was enough in the cloud — but every other script in this project also
// falls back to a locally loaded .env (research.mjs, news-scan.mjs, demand.mjs,
// bot.mjs, content-search.mjs, topic-plan.mjs). This one didn't, so a key
// added only to .env for local testing was invisible to it.
const env = loadEnv();
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "";

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
  if (!geminiKey) return null;
  const prompt = [
    "You prepare a Persian (Farsi) short-video DRAFT for a human creator to review.",
    "Return ONLY valid JSON: {title,hook,steps}.",
    "The creator supplied only this topic: " + JSON.stringify(clean(topic, 300)),
    "Write natural Persian. title: at most 12 words. hook: 7-17 words, spoken, curiosity-led.",
    "The hook must not name the app, product, company, brand, or reveal the answer.",
    "Give 2 to 4 short, practical steps. Do not invent statistics, prices, features, UI paths, or guarantees.",
    "Do not promise views, virality, sales, followers, or income. Keep established product names in English only when essential.",
  ].join("\n");
  // gemini-2.5-flash is retired for new users (confirmed live, 2026-09-03:
  // 404 names gemini-3.6-flash as the nominal replacement). gemini-3.6-flash
  // itself turned out to be a poor fit for this project's call volume: it's a
  // "thinking" model that burns real output-token budget on internal
  // reasoning (confirmed: 541-789 tokens per call before the actual answer),
  // and its free tier caps at 20 requests/DAY — exhausted mid-session just
  // testing this fix. gemini-flash-lite-latest handles the same prompts with
  // no thinking overhead and a "-latest" alias, which avoids the sudden
  // retirement gemini-2.5-flash just hit.
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const call = () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": geminiKey },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.25, responseMimeType: "application/json" } }),
  });
  // Gemini's own "thinking" flash models returned a plain 503 "high demand"
  // on a real fraction of calls (confirmed live, 2026-09-03: 2 of 3
  // back-to-back attempts against gemini-3.6-flash) — a genuinely transient
  // condition, not a bad key or request, the same class of failure
  // sendVideo() in lib/telegram.mjs already retries. Kept here even after
  // switching to gemini-flash-lite-latest as cheap insurance.
  let response = await call();
  for (let i = 0; !response.ok && (response.status === 503 || response.status === 429) && i < 2; i++) {
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    response = await call();
  }
  if (!response.ok) throw new Error("پیش‌نویس هوش مصنوعی آماده نشد؛ موضوع را با گام‌ها بفرستید یا دوباره تلاش کنید.");
  const body = await response.json();
  const answer = String(body?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "");
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
      // Two genuinely different problems were sharing one message. draftBareTopic
      // only ever returns null (rather than throwing) when geminiKey is empty —
      // every other failure (bad key, wrong model, unreadable response) throws
      // its own specific error instead. So reaching here means the repo secret
      // is missing, not that the creator's message was malformed — telling a
      // creator to reformat their topic can't fix a key nobody set, and hid the
      // real cause from the one person (the owner) who could actually fix it.
      if (!geminiKey) {
        throw new Error(
          "🔑 پیش‌نویس خودکار برای موضوعات آزاد نیاز به کلید هوش مصنوعی دارد که هنوز تنظیم نشده.\n\n" +
          "برای فعال شدنش: Settings → Secrets and variables → Actions → New repository secret\n" +
          "نام: GEMINI_API_KEY\nمقدار: کلیدی که از aistudio.google.com/apikey می‌گیری (رایگان)\n\n" +
          "تا آن‌وقت، یکی از این دو شکل را بفرست:\n" +
          `۱) عنوان | قلاب | گام اول | گام دوم\nمثال: ${topic} | ${topic}؟ | یک نمونهٔ واقعی نشان بده | دعوت به کامنت بگذار\n\n` +
          `۲) اول قلاب، بعد گام‌های شماره‌گذاری‌شده\nمثال: ${topic}؟ ۱. یک نمونهٔ واقعی نشان بده ۲. دعوت به کامنت بگذار`
        );
      }
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
