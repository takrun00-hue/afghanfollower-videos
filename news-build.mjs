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
import { TOPICS, topicFor, SOURCES, FA_DOMAINS, DE_DOMAINS, SCOPES, inScope } from "./lib/news-templates.mjs";

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
  const days = has("--today") ? 3 : 7;
  const scope = has("--europe") ? "europe" : "germany";
  const SC = SCOPES[scope];

  // Persian and Dari outlets first. They already write for this audience in this
  // language, so their sentences can be used as they stand — no translation step,
  // which is where a migration story would pick up errors.
  async function search(domains, extraDays = 0) {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY },
      body: JSON.stringify({
        query: SC.query,
        numResults: 10,
        startPublishedDate: new Date(Date.now() - (days + extraDays) * 86400000).toISOString(),
        includeDomains: domains,
        type: "auto",
        contents: { text: { maxCharacters: 2000 } },
      }),
    });
    if (!res.ok) throw new Error("Exa " + res.status + ": " + (await res.text()).slice(0, 160));
    return (await res.json()).results || [];
  }

  const keep = (rs) => rs.filter((r) => inScope(scope, r.title, String(r.text || "").slice(0, 600)));
  // Germany first asks Amal, whose whole beat is Afghans living in Germany, then
  // widens to the general Persian outlets if that turns up nothing.
  let results = [];
  if (scope === "germany") {
    results = keep(await search(DE_DOMAINS));
    const wider = keep(await search(FA_DOMAINS));
    const seen = new Set(results.map((r) => r.url));
    results = results.concat(wider.filter((r) => !seen.has(r.url)));
  } else {
    results = keep(await search(FA_DOMAINS));
  }
  if (!results.length) results = keep(await search(FA_DOMAINS, 10));

  if (!results.length) {
    await say(`📭 ${SC.label}: خبر تازه‌ای در این حوزه پیدا نشد.`);
    process.exit(0);
  }

  // Newest first — a two-day-old story is not "فوری".
  results.sort((a, b) => String(b.publishedDate || "").localeCompare(String(a.publishedDate || "")));

  if (has("--list")) {
    const lines = results.slice(0, 6).map((r, i) =>
      `${i + 1}. <a href="${r.url}">${String(r.title).slice(0, 90)}</a>\n   <i>${new URL(r.url).hostname.replace(/^www\./, "")} · ${String(r.publishedDate || "").slice(0, 10)}</i>`
    );
    await say(`📰 <b>${SC.label}</b>\n\n` + lines.join("\n\n") +
      `\n\nبرای ساخت ویدیو از یکی، شماره‌اش را بفرست: <code>${scope === "europe" ? "اروپا" : "خبر"} ۱</code>`);
    process.exit(0);
  }

  const pick = Math.max(1, Number(arg("--pick")) || 1) - 1;
  const top = results[Math.min(pick, results.length - 1)];

  headline = String(top.title || "").replace(/\s*[-–|]\s*(BBC News دری|DW\.com|.*اینترنشنال).*$/, "").trim();
  const host = new URL(top.url).hostname.replace(/^www\./, "");
  const known = Object.values(SOURCES).find((x) => host.includes(x.domain));
  source = `${known ? known.name : host} · ${String(top.publishedDate || "").slice(0, 10)}`;

  // Persian sentences, long enough to carry a fact, short enough to read on a card
  body = String(top.text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!؟])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 45 && x.length < 190)
    .slice(0, 6);

  if (body.length < 2) {
    await say(`📰 <b>${headline}</b>\n${source}\n<a href="${top.url}">لینک</a>\n\n` +
      "متن این خبر برای ساخت خودکار کافی نبود. جمله‌ها را خودت بفرست:\n" +
      "<code>خبر: تیتر | جمله ۱ | جمله ۲ | جمله ۳ | جمله ۴</code>");
    process.exit(0);
  }
}

const text = arg("--text");
if (!text && !has("--fetch")) {
  console.error('usage: node news-build.mjs --text "تیتر | جمله ۱ | جمله ۲ | جمله ۳ | جمله ۴" [--source "DW · تاریخ"]');
  process.exit(1);
}

if (text && text.includes("|")) {
  const parts = text.split("|").map((x) => x.trim()).filter(Boolean);
  headline = parts[0];
  body = parts.slice(1, 9);
} else if (text) {
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
