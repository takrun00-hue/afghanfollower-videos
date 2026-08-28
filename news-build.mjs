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
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { TOPICS, topicFor, SOURCES, FA_DOMAINS, DE_DOMAINS, SCOPES, inScope } from "./lib/news-templates.mjs";
import { photoFor, photoPlan } from "./lib/news-media.mjs";

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
const hookOverride = String(arg("--hook") || "").replace(/[\r\n]+/g, " ").trim().slice(0, 180);

// --from-queue N builds the story the operator actually read and approved.
// Re-running the search at approval time was a correctness bug: an hour later
// the same number could point at a different story than the one in the message.
if (has("--from-queue")) {
  const n = Math.max(1, Number(arg("--from-queue")) || 1);
  const q = existsSync(".news-queue.json")
    ? JSON.parse(readFileSync(".news-queue.json", "utf8")).find((x) => x.n === n)
    : null;
  if (!q) {
    await say("❌ خبر شماره " + n + " در فهرست نیست.");
    process.exit(1);
  }
  headline = q.title;
  body = q.sentences.slice();
  source = q.source;
} else if (has("--fetch")) {
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
if (!text && !has("--fetch") && !has("--from-queue")) {
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
// A news sentence runs 120-160 characters. On a card that becomes a wall of bold
// type — the thing that makes the news channel look heavier and duller than the
// tutorials, where every band holds one short line. So a long sentence is split
// at its own clause boundaries into cards of readable length. Nothing is
// rewritten or dropped: the words and their order are the source's.
function splitLong(sentence, max = 78) {
  const t = String(sentence).trim();
  if (t.length <= max) return [t];
  // Break where the sentence itself breaks: a comma, a semicolon, or a
  // connective word. Filling each card to the brim instead lands the cut
  // between «به» and «دلیل», which reads worse than a long line.
  const marks = [];
  for (const re of [/،/g, /؛/g, /\s(?:که|و|اما|ولی|زیرا|تا|چون|هرچند)\s/g]) {
    for (const m of t.matchAll(re)) marks.push({ at: m.index + (m[0][0] === " " ? 1 : 1), w: re.source.length });
  }
  const mid = t.length / 2;
  // Never cut inside a quotation. The ؛ in «اخراج‌ها را متوقف کنید؛ پناهجویان
  // خوش آمدید» is a real boundary in Persian, but splitting there severs a
  // slogan across two cards and leaves the quote marks unbalanced — on a news
  // video that changes what the source appears to have said.
  const inQuote = (i) => {
    const head = t.slice(0, i);
    return (head.split("«").length - 1) !== (head.split("»").length - 1);
  };
  const usable = marks.filter((m) => m.at > 18 && m.at < t.length - 18 && !inQuote(m.at));
  let cut;
  if (usable.length) {
    cut = usable.reduce((a, b) => (Math.abs(a.at - mid) <= Math.abs(b.at - mid) ? a : b)).at;
  } else {
    const w = t.slice(0, Math.ceil(mid) + 12);
    cut = w.lastIndexOf(" ");
    // A card must not end on a preposition — "…معترضان با در" then "دست داشتن…"
    // leaves the reader hanging on a word that means nothing by itself.
    const DANGLING = ["با", "در", "به", "از", "بر", "تا", "که", "و", "را", "این", "یک"];
    let guard = 0;
    while (cut > 18 && guard++ < 4 && DANGLING.includes(t.slice(0, cut).trim().split(" ").pop())) {
      cut = t.lastIndexOf(" ", cut - 1);
    }
    if (cut < 18) return [t];
  }
  const head = t.slice(0, cut).replace(/[،؛\s]+$/, "");
  const tail = t.slice(cut).replace(/^[،؛\s]+/, "");
  return [...splitLong(head, max), ...splitLong(tail, max)];
}

// Exa returns a truncated article body, so the last fragment often stops
// mid-word ("... نیز به افغانستا"). A half sentence on screen reads as a bug and,
// worse, can change what the news appears to say.
function dropUnterminated(list) {
  if (!list.length) return list;
  const last = list[list.length - 1];
  return /[.!؟?»]\s*$/.test(last) ? list : list.slice(0, -1);
}

body = dropUnterminated(body);
body = body.flatMap((x) => splitLong(x));

// Splitting long sentences already yields enough cards for a minute. The two
// boilerplate lines that used to close every story — "this is news, not legal
// advice" and a note that the source is named — are gone: the source is printed
// on the hook, and ending on a disclaimer ends the video on nothing.
body = body.slice(0, 10);

// Strip what a headline carries for a newspaper column but not for a 9:16 hook:
// the reporting verb up front ("به گزارش ...، "), a trailing question mark, and
// anything past the point where the fact is already delivered. Nothing is added
// — an invented word in a news hook is a lie, however well it performs.
function punchHeadline(h) {
  let t = String(h).trim()
    .replace(/^(?:به گزارش|بر اساس گزارش|بر اساس|طبق گزارش|طبق)\s+[^،]{0,40}،\s*/, "")
    .replace(/^(?:آیا)\s+/, "")
    .replace(/\s*[؟?]\s*$/, "")
    .replace(/\s+/g, " ");
  if (t.length > 96) {
    // cut on the last clause boundary that still fits, never mid-word
    const cut = t.slice(0, 96);
    const at = Math.max(cut.lastIndexOf("،"), cut.lastIndexOf(" و "), cut.lastIndexOf(" "));
    t = (at > 40 ? cut.slice(0, at) : cut).replace(/[،\s]+$/, "");
  }
  return t;
}

// ---- shape it into a pack --------------------------------------------------
const topic = topicFor(headline, body.join(" "));
const T = TOPICS[topic];
// Archive B-roll illustrates the subject; it is never presented as footage of
// this event. Only public-domain / CC0 assets are accepted by news-media.
let photos = [], hookPhoto = null;
try {
  hookPhoto = await photoFor(topic, headline + ":hook");
  photos = await photoPlan(topic, headline + ":slides", 4);
} catch {}

const feature = {
  id: "news-" + Date.now().toString(36),
  name: T.kicker,
  source: source || "—",
  // News is an independent German Insider channel, never AfghanFollowers.
  title: headline.slice(0, 70) + " — German Insider",
  hook: {
    // News does not ask. A viewer scrolling past a migration story wants the
    // fact, and "آیا از این خبر باخبرید؟" delays it by a whole line. The
    // headline itself is the hook; the detail follows on the slides after it.
    ask: hookOverride || punchHeadline(headline),
    l1: body[0] ? body[0].slice(0, 44) : "",
    l2: "",
  },
  payoff: "",
  outroAsk: "نظرت دربارهٔ این خبر چیست؟",
  hookPhoto,
  photos,
  steps: body.map((t, i) => ({
    path: "",
    icon: ["chart", "target", "key", "users", "clock", "globe", "chat", "bulb"][i % 8],
    text: t || "…",
    ui: { screen: "result", title: T.kicker },
  })),
  tgTitle:
    `📰 ${headline}\n\n` +
    `
#afghanistan #germany #migration #asylum #news`,
};

mkdirSync("lib/generated", { recursive: true });
writeFileSync(
  "lib/generated/news-current.mjs",
  "// Generated by news-build.mjs — overwritten on every run.\n" +
    "export const CURRENT_NEWS = " + JSON.stringify(feature, null, 2) + ";\n" +
    "export const CURRENT_TOPIC = " + JSON.stringify(topic) + ";\n"
);

// Editorial gate: a news story is shown in Telegram before a render. The
// operator can edit its impact line or its cards; the source is never placed
// on the finished video.
if (has("--preview")) {
  writeFileSync(".news-draft.json", JSON.stringify({
    headline, body, source, hook: feature.hook.ask, updatedAt: new Date().toISOString(),
  }, null, 2) + "\n");
  await say(
    `📰 <b>پیش‌نویس خبر</b>\n\n<b>قلاب:</b> ${feature.hook.ask}\n\n` +
    body.slice(0, 4).map((x, i) => `${i + 1}. ${x}`).join("\n") +
    `\n\n✅ ساخت با صدا: <code>تأیید خبر</code>` +
    `\n✏️ تغییر قلاب: <code>ادیت قلاب خبر: متن تازه</code>` +
    `\n📝 تغییر متن: <code>ادیت متن خبر: جمله۱ | جمله۲ | جمله۳</code>`
  );
  process.exit(0);
}

console.log(`topic=${topic} · headline=${headline.slice(0, 60)}`);
execSync(`node daily-render.mjs --feature ${feature.id} --news-generated`, { stdio: "inherit" });
