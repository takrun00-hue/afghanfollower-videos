// Builds a news video from text.
//
//   node news-build.mjs --text "خبر…" --source "DW · ۲۵ آگست ۲۰۲۶"
//   node news-build.mjs --fetch            # newest item from the trusted sources
//   node news-build.mjs --fetch --today    # the day's roundup
//
// The text-to-video path splits the story mechanically: first sentence becomes
// the headline, the next few become the steps. That is honest but blunt — it
// cannot judge which sentence actually matters. When a person writes the four
// lines themselves the video is better, so --text accepts a "|"-separated form:
//   "تیتر | جملهٔ ۱ | جملهٔ ۲ | جملهٔ ۳ | جملهٔ ۴"
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { TOPICS, topicFor, SOURCE_DOMAINS } from "./lib/news-templates.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const has = (k) => argv.includes(k);

const env = loadEnv();
const tg = telegramConfig(env);
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";

const say = async (t) => { if (tg.enabled) await sendMessage({ token: tg.token, chatId: tg.chatId, text: t }); console.log(t); };

// ---- get the story ---------------------------------------------------------
let headline = "", body = [], source = arg("--source") || "";

if (has("--fetch")) {
  if (!KEY) {
    await say("🔑 برای جستجوی خبر، EXA_API_KEY لازم است.");
    process.exit(0);
  }
  const days = has("--today") ? 2 : 5;
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({
      query: "news about Afghan refugees and migrants in Germany or Europe: asylum, deportation, visa, court ruling",
      numResults: 6,
      startPublishedDate: new Date(Date.now() - days * 86400000).toISOString(),
      includeDomains: SOURCE_DOMAINS,
      type: "auto",
      contents: { text: { maxCharacters: 1200 } },
    }),
  });
  const j = await res.json();
  const top = (j.results || [])[0];
  if (!top) {
    await say("📭 در منابع مورد اعتماد، خبر تازه‌ای دربارهٔ افغان‌ها پیدا نشد.");
    process.exit(0);
  }
  headline = String(top.title || "").trim();
  source = `${new URL(top.url).hostname.replace(/^www\./, "")} · ${String(top.publishedDate || "").slice(0, 10)}`;
  body = String(top.text || "")
    .split(/(?<=[.!?؟])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 40)
    .slice(0, 4);
  // The fetched text is German or English; a person still has to write the
  // Persian. Say so rather than publishing a machine-mangled translation.
  await say(
    `📰 <b>خبر تازه پیدا شد</b>\n\n<b>${headline}</b>\n${source}\n<a href="${top.url}">لینک خبر</a>\n\n` +
      `متن فارسی‌اش را بنویس و بفرست تا ویدیو بسازم:\n<code>خبر: تیتر | جملهٔ ۱ | جملهٔ ۲ | جملهٔ ۳ | جملهٔ ۴</code>`
  );
  process.exit(0);
}

const text = arg("--text");
if (!text) {
  console.error('usage: node news-build.mjs --text "تیتر | جمله ۱ | جمله ۲ | جمله ۳ | جمله ۴" [--source "DW · تاریخ"]');
  process.exit(1);
}

if (text.includes("|")) {
  const parts = text.split("|").map((x) => x.trim()).filter(Boolean);
  headline = parts[0];
  body = parts.slice(1, 9);
} else {
  const sentences = text.split(/(?<=[.!?؟])\s+/).map((x) => x.trim()).filter(Boolean);
  headline = sentences[0] || text.slice(0, 90);
  body = sentences.slice(1, 9);
}
// A minute needs at least six scenes. Rather than padding with empty cards,
// close on the two lines every migration story owes the viewer.
if (body.length < 6) {
  body.push("این خبر از منبع نام‌برده گرفته شده و تاریخش روی ویدیو است.");
  body.push("شرایط هر پرونده فرق می‌کند؛ برای پروندهٔ خودت با وکیل مشورت کن.");
}
body = body.slice(0, 8);

// ---- shape it into a pack --------------------------------------------------
const topic = topicFor(headline, body.join(" "));
const T = TOPICS[topic];

const feature = {
  id: "news-" + Date.now().toString(36),
  name: T.kicker,
  source: source || "—",
  title: headline.slice(0, 70) + " — افغان فالورز",
  hook: {
    ask: headline.endsWith("؟") ? headline : `آیا از این خبر باخبرید؟ ${headline}`.slice(0, 120),
    l1: body[0] ? body[0].slice(0, 44) : "",
    l2: "",
  },
  payoff: T.disclaimer,
  outroAsk: "نظرت دربارهٔ این خبر چیست؟",
  steps: body.map((t, i) => ({
    path: "",
    icon: ["chart", "target", "key", "users", "clock", "globe", "chat", "bulb"][i % 8],
    text: t || "…",
    ui: { screen: "result", title: T.kicker },
  })),
  tgTitle:
    `📰 ${headline}\n\n` +
    (source ? `منبع: ${source}\n` : "") +
    `⚠️ ${T.disclaimer}\n\n#افغانستان #آلمان #مهاجرت #پناهندگی`,
};

mkdirSync("lib/generated", { recursive: true });
writeFileSync(
  "lib/generated/news-current.mjs",
  "// Generated by news-build.mjs — overwritten on every run.\n" +
    "export const CURRENT_NEWS = " + JSON.stringify(feature, null, 2) + ";\n" +
    "export const CURRENT_TOPIC = " + JSON.stringify(topic) + ";\n"
);

console.log(`topic=${topic} · headline=${headline.slice(0, 60)}`);
execSync(`node daily-render.mjs --feature ${feature.id} --news-generated`, { stdio: "inherit" });
