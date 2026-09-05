// Live-search-first content discovery — rules 1,2,3,4,5,6,7 of the 2026-09-03
// content-search specification (memory: gapmedia-content-selection-and-design-bar).
//
// Distinct from topic-plan.mjs on purpose: topic-plan.mjs answers "what's on
// the fixed TikTok/Instagram/tools schedule for today or tomorrow" from a
// curated catalogue. This answers a different question — "search live, right
// now, across income/reach/trend, and score what's actually out there" — for
// the two on-demand commands رule 12 defines: a bare search and the creator's
// own live query.
//
//   node content-search.mjs                     # 5 fresh topics, 3 lanes
//   node content-search.mjs --query "متن کاربر"  # creator's own live search
//   node content-search.mjs --pick 2             # build ONLY a draft (rule 8)
//   node content-search.mjs --dry-run            # print instead of sending
//
// Nothing here renders a video. --pick writes .content-draft.json in the same
// shape custom-draft.mjs already uses (generated.{feature,platform,hook,tips,
// payoff,outroAsk,tgTitle}) and hands off to content-draft.mjs --preview, so
// «تأیید محتوا» / «ادیت قلاب:» / «ادیت متن:» keep working unchanged.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { rejectReason } from "./lib/source-quality.mjs";
import { fingerprint, check } from "./lib/dedupe.mjs";
import { evaluate, detectAccessStatus, categorizeLane } from "./lib/selection-gate.mjs";
import { probeDemand } from "./lib/demand-probe.mjs";
import { recentlyProposed, recordProposed, rejectedIds, COOLDOWN_DAYS } from "./lib/proposed.mjs";
import { translateToPersian } from "./lib/translate-fa.mjs";
import { replyOnFailure } from "./lib/fail-soft.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const env = loadEnv();
const tg = telegramConfig(env);
const KEY = process.env.EXA_API_KEY || env.EXA_API_KEY || "";
const dryRun = process.argv.includes("--dry-run");
const queryAt = process.argv.indexOf("--query");
const query = queryAt >= 0
  ? String(process.argv[queryAt + 1] || "").replace(/https?:\/\/\S+|www\.\S+/gi, "").replace(/\s+/g, " ").trim().slice(0, 300)
  : "";
const pickArg = Number(process.argv[process.argv.indexOf("--pick") + 1] || 0);

const OFFERED = ".content-search-offered.json";
const BACKLOG = ".content-search-backlog.json";
const LEGACY_OFFERED = ".topic-offered.json"; // reject-topic.mjs reads this shared file

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FA = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

async function say(text) {
  if (tg.enabled && !dryRun && process.env.NO_TELEGRAM !== "1") {
    await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true });
  } else {
    console.log(text.replace(/<[^>]+>/g, ""));
  }
}

// ---- discovery --------------------------------------------------------------
const LANE_QUERIES = {
  income: [
    "official platform program that pays creators or helps them find paying customers, recent announcement",
    "creator monetization or bonus program update this month, how creators actually earn from it",
  ],
  reach: [
    "official platform update that increases video reach, views or discoverability for creators, recent",
    "TikTok Instagram search or algorithm change creators can use to get seen, recent official coverage",
  ],
  trend: [
    "TikTok Instagram AI app trend creators are actually using right now, this week",
    "new AI app feature creators are actually using this week, hands-on coverage",
  ],
  utility: [
    // The source must still pass the evidence, demand and visual-proof gates.
    // These searches deliberately seek useful cross-platform discoveries, not
    // generic 'top app' clickbait lists.
    "site:play.google.com OR site:apps.apple.com useful app productivity personalization reminder launcher recent",
    "official app store editorial useful iPhone Android web apps productivity personalization this month",
    "new useful app iPhone Android web daily workflow official announcement recent",
  ],
};

async function search(q, since) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify({ query: q, numResults: 8, startPublishedDate: since, type: "auto", contents: { text: { maxCharacters: 700 } } }),
  });
  if (!res.ok) throw new Error(`Exa ${res.status}`);
  return ((await res.json()).results || []).filter((r) => r?.title && r?.url);
}

// Independent corroboration count — the same "how newsworthy is this really"
// proxy content-radar.mjs uses, re-queried on the candidate's own title.
async function corroboration(title) {
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY },
      body: JSON.stringify({
        query: title, numResults: 8,
        startPublishedDate: new Date(Date.now() - 14 * 86400000).toISOString(),
        type: "auto", contents: { text: { maxCharacters: 1 } },
      }),
    });
    if (!res.ok) return 0;
    const hosts = new Set();
    for (const r of (await res.json()).results || []) {
      try { hosts.add(new URL(r.url).hostname.replace(/^www\./, "")); } catch { /* skip */ }
    }
    return hosts.size;
  } catch { return 0; }
}

// Real sentences pulled straight from the (translated) source text. Never
// invented — this is the only material practicalUse and the draft's steps
// are allowed to be built from.
function realSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ").trim()
    .split(/(?<=[.!؟?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 220);
}

const idFor = (url) => "search-" + createHash("sha256").update(String(url)).digest("hex").slice(0, 10);

function seedFromTitle(title) {
  return String(title || "").split(/\s+/).slice(0, 5).join(" ").slice(0, 40);
}

function platformFromHost(host) {
  if (/instagram|about\.fb\.com/i.test(host)) return "instagram";
  if (/tiktok/i.test(host)) return "tiktok";
  return "tools";
}

async function buildCandidates(items, laneHint) {
  const out = [];
  const perHost = new Map();
  for (const item of items) {
    let host = "";
    try { host = new URL(item.url).hostname.replace(/^www\./, ""); } catch { continue; }
    if ((perHost.get(host) || 0) >= 2) continue; // rule 6: not from a single source
    if (rejectReason(item)) continue;
    perHost.set(host, (perHost.get(host) || 0) + 1);
    out.push({
      id: idFor(item.url), url: item.url, host,
      title: String(item.title).slice(0, 180),
      text: String(item.text || "").replace(/\s+/g, " ").slice(0, 700),
      date: String(item.publishedDate || "").slice(0, 10),
      laneHint,
    });
  }
  return out;
}

async function enrich(candidates) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "";
  // Passed explicitly, same as geminiKey — translateToPersian()'s own default
  // reads process.env at import time, before this file's loadEnv() call has
  // populated it from .env, so a key sitting only in .env would otherwise be
  // invisible here (the same gap custom-draft.mjs had).
  const groqKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY || "";
  let translated = candidates;
  try {
    translated = await translateToPersian(candidates.map((c) => ({ title: c.title, text: c.text })), { geminiKey, groqKey });
  } catch (error) {
    throw new Error(`ترجمهٔ فارسیِ منابع آماده نشد: ${error.message}`);
  }
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    c.originalTitle = candidates[i].title;
    c.title = String(translated[i]?.title || c.title).slice(0, 180);
    c.text = String(translated[i]?.text || c.text).slice(0, 700);
    c.keyPoints = realSentences(c.text);
    c.benefitFa = c.keyPoints[0] || c.title;
    c.lane = categorizeLane(`${c.title} ${c.text}`) || c.laneHint || "trend";
    c.access = detectAccessStatus(`${c.title} ${c.text}`);
    c.corroboration = await corroboration(c.originalTitle);
    c.demandPhrases = await probeDemand(seedFromTitle(c.title), { english: false });
  }
  return candidates;
}

function gate(c) {
  return evaluate({
    topic: c.title, question: c.title,
    keyPoints: c.keyPoints,
    sources: [c.url],
    sourceDate: c.date || null,
    demandPhrases: c.demandPhrases,
    discussions: [],
  });
}

function alreadySentVerdict(c) {
  const fp = fingerprint({
    id: c.id, platform: c.host, feature: c.title, title: c.title,
    hook: { ask: c.title }, benefit: null, payoff: "", tips: c.keyPoints.map((t) => ({ text: t })),
  });
  const r = check(fp);
  return r.verdict === "DUPLICATE" ? r : null;
}

function selectBalanced(passed, target) {
  const byLane = { income: [], reach: [], trend: [], utility: [] };
  const sorted = [...passed].sort((a, b) => b.gate.score - a.gate.score);
  for (const c of sorted) (byLane[c.lane] || byLane.trend).push(c);
  const chosen = [];
  for (const lane of ["income", "reach", "utility", "trend"]) chosen.push(...byLane[lane].slice(0, target[lane] || 0));
  if (chosen.length < 5) {
    const have = new Set(chosen.map((c) => c.id));
    const leftover = sorted.filter((c) => !have.has(c.id));
    chosen.push(...leftover.slice(0, 5 - chosen.length));
  }
  return chosen.slice(0, 5);
}

async function discover() {
  if (!KEY) { await say("🔑 <b>کلید جستجو تنظیم نشده</b>\nEXA_API_KEY را در Secrets تنظیم کن."); process.exit(0); }

  const since = new Date(Date.now() - (query ? 30 : 14) * 86400000).toISOString();
  let raw = [];
  const dropped = [];
  try {
    if (query) {
      for (const item of await search(`${query} — official, dated, real workflow for creators`, since)) raw.push({ item, lane: null });
    } else {
      for (const [lane, queries] of Object.entries(LANE_QUERIES)) {
        for (const q of queries) {
          for (const item of await search(q, since)) raw.push({ item, lane });
        }
      }
    }
  } catch (error) {
    await say(`⚠️ <b>جستجوی زنده انجام نشد</b>\n${esc(String(error.message).slice(0, 140))}`);
    process.exit(0);
  }

  const seen = new Set();
  const items = [];
  for (const { item, lane } of raw) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    items.push({ item, lane });
  }
  let candidates = [];
  for (const lane of [...new Set(items.map((x) => x.lane))]) {
    const group = items.filter((x) => x.lane === lane).map((x) => x.item);
    candidates.push(...await buildCandidates(group, lane));
  }
  if (!candidates.length) {
    await say(query
      ? `🔎 <b>نتیجهٔ جستجوی زندهٔ محتوا</b>\n<i>درخواست شما: ${esc(query)}</i>\n\nنتیجهٔ قابل‌استفاده‌ای پیدا نشد.`
      : "🔎 موضوع تازه‌ای از جستجوی زنده پیدا نشد.");
    process.exit(0);
  }

  try { candidates = await enrich(candidates); }
  catch (error) {
    await say(`⚠️ <b>جستجو انجام شد، اما برگردان فارسی آماده نشد.</b>\n${esc(String(error.message).slice(0, 140))}`);
    process.exit(0);
  }

  const cooldown = recentlyProposed();
  const refused = rejectedIds();
  const passed = [];
  const rejectedReport = [];
  const limitedNotes = [];

  for (const c of candidates) {
    if (refused.has(c.id)) { rejectedReport.push({ title: c.title, why: "قبلاً رد شده" }); continue; }
    if (cooldown.has(c.id)) { rejectedReport.push({ title: c.title, why: `در ${COOLDOWN_DAYS} روز اخیر پیشنهاد شده بود` }); continue; }
    const dup = alreadySentVerdict(c);
    if (dup) { rejectedReport.push({ title: c.title, why: `شبیه محتوای قبلاً ارسال‌شده (٪${dup.score})` }); continue; }
    const v = gate(c);
    if (v.decision === "REJECT") {
      const onlyAccess = v.failures.length === 1 && c.access === "limited";
      if (onlyAccess && c.corroboration >= 2) limitedNotes.push(c);
      else rejectedReport.push({ title: c.title, why: v.failures.join("، ") });
      continue;
    }
    c.gate = v;
    passed.push(c);
  }

  const selected = query ? passed.sort((a, b) => b.gate.score - a.gate.score).slice(0, 5)
    // Two of five live recommendations now reserve space for verified useful
    // app discoveries across phone, web and desktop. Income and reach keep a place, so the
    // feed is broader without becoming a generic app-list channel.
    : selectBalanced(passed, { income: 1, reach: 1, utility: 2, trend: 1 });
  const backlog = passed.filter((c) => !selected.some((s) => s.id === c.id));

  const laneFa = (l) => ({ income: "درآمد", reach: "دیده‌شدن", utility: "اپ کاربردی", trend: "ترند" }[l] || l);
  const accessFa = (a) => ({ public: "عمومی", limited: "محدود", unknown: "نامشخص" }[a] || "نامشخص");

  const formatTopic = (c, n) => {
    const demandNote = c.demandPhrases.length ? `${c.demandPhrases.length} عبارت جست‌وجوی واقعی` : "نشانهٔ جست‌وجوی مستقیم ثبت نشد";
    const corrNote = c.corroboration >= 2 ? `${c.corroboration} منبع مستقل` : "یک منبع";
    return `<b>موضوع ${FA(n)} — ${esc(laneFa(c.lane))}</b>\n` +
      `📌 ${esc(c.title)}\n` +
      `🎯 سود واقعی کاربر: ${esc(c.benefitFa)}\n` +
      `🏷 دسته: ${esc(laneFa(c.lane))}\n` +
      `🔥 دلیل ترند/تقاضا: ${esc(corrNote)}، ${esc(demandNote)}\n` +
      `🗓 منبع: <a href="${esc(c.url)}">${esc(c.date || "بدون تاریخ")}</a>\n` +
      `🔓 دسترسی: ${esc(accessFa(c.access))}\n` +
      `♻️ پیشنهاد قبلی: خیر، تازه است`;
  };

  const header = query
    ? `🔎 <b>نتیجهٔ جستجوی زندهٔ محتوا</b>\n<i>درخواست شما: ${esc(query)}</i>`
    : `🔎 <b>${FA(selected.length)} موضوع تازه — جستجوی زندهٔ محتوا</b>`;
  const body = selected.length
    ? selected.map((c, i) => formatTopic(c, i + 1)).join("\n\n")
    : "موضوع واجد شرایطی از جستجوی زنده پیدا نشد.";
  const limitedBlock = limitedNotes.length
    ? `\n\n<b>🔒 محدود — فقط خبر، قابل انتخاب نیست</b>\n` +
      limitedNotes.slice(0, 4).map((c) => `• ${esc(c.title)} — <a href="${esc(c.url)}">منبع</a>`).join("\n")
    : "";
  const rejectedBlock = rejectedReport.length
    ? `\n\n<b>🚫 رد شده</b>\n` + rejectedReport.slice(0, 8).map((r) => `• ${esc(r.title)} — ${esc(r.why)}`).join("\n")
    : "";
  const footer = selected.length
    ? `\n\nیکی را با شمارهٔ ساده انتخاب کن: ${selected.map((_, i) => `<code>${FA(i + 1)}</code>`).join("، ")}\n` +
      `برای رد یک موضوع: <code>رد ۲</code>\nهیچ ویدیویی پیش از تأیید پیش‌نویس ساخته نمی‌شود.`
    : `\n\nموضوع ضعیف نمی‌سازم.${query ? " برای عبارت دیگری امتحان کن: " : " "}<code>جستجوی جدید: عبارت</code>`;

  await say(`${header}\n\n${body}${limitedBlock}${rejectedBlock}${footer}`);

  if (selected.length && !dryRun) {
    writeFileSync(OFFERED, JSON.stringify(selected.map((c, i) => ({ n: i + 1, ...c })), null, 2) + "\n");
    writeFileSync(LEGACY_OFFERED, JSON.stringify(selected.map((c, i) => ({ n: i + 1, id: c.id, platform: c.host, hook: c.title })), null, 2) + "\n");
    writeFileSync(BACKLOG, JSON.stringify(backlog, null, 2) + "\n");
    recordProposed(selected.map((c) => c.id));
  }
}

// ---- pick -> draft only (rule 8) --------------------------------------------
function loadOffered() {
  try { return existsSync(OFFERED) ? JSON.parse(readFileSync(OFFERED, "utf8")) : []; }
  catch { return []; }
}

function clip17(text) {
  const words = text.trim().split(/\s+/);
  return words.length <= 17 ? text : words.slice(0, 17).join(" ") + "…";
}

function buildHookOptions(c) {
  const laneWord = { income: "این فرصت درآمدی", reach: "این راه دیده‌شدن", utility: "این اپ کاربردی", trend: "این ترند" }[c.lane] || "این موضوع";
  const raw = [
    { angle: "هشدار/فرصت از دست‌رفته", text: `اگه هنوز از ${laneWord} خبر نداری، شاید داری یه فرصت واقعی رو از دست می‌دی؟` },
    { angle: "کنجکاوی/شواهد", text: c.corroboration >= 2 ? `${FA(c.corroboration)} منبع مستقل دربارهٔ این خبر نوشتن؛ می‌دونی دقیقاً چیه؟` : `منبع رسمی دربارهٔ این خبر نوشته؛ می‌دونی دقیقاً چیه؟` },
    { angle: "فایدهٔ مستقیم", text: `می‌خوای از ${laneWord} واقعی استفاده کنی، نه فقط بشنوی؟` },
  ];
  return raw.map((o) => ({ ...o, text: clip17(o.text) }));
}

function scoreHook(text) {
  let score = 3; const why = [];
  if (/[؟?]$/.test(text)) { score += 2; why.push("سؤال باز"); }
  if (/[۰-۹0-9]/.test(text)) { score += 2; why.push("عدد مشخص"); }
  if (text.trim().split(/\s+/).length <= 14) { score += 1; why.push("کوتاه و مناسب سه‌ثانیه"); }
  return { score, why };
}

function pickBestHook(options) {
  const scored = options.map((o) => ({ ...o, ...scoreHook(o.text) })).sort((a, b) => b.score - a.score);
  return { best: scored[0], reason: scored[0].why.join("، ") || "واضح‌ترین گزینه برای سه ثانیهٔ اول" };
}

const MUSIC_BY_LANE = {
  income: "ریتم آرام و مطمئن با ضرب‌آهنگ متوسط؛ تأکید روی کلمهٔ سود یا مشتری.",
  reach: "ریتم رو به اوج با افزایش تدریجی؛ تأکید روی لحظهٔ کشف قابلیت.",
  trend: "ریتم کنجکاوی‌محور با یک سکوت کوتاه پیش از نکتهٔ اصلی.",
};
const OUTRO_BY_LANE = {
  income: "تجربهٔ خودت از این روش رو کامنت کن.",
  reach: "این نکته رو امتحان کردی؟ نتیجه‌ش رو بنویس.",
  trend: "به نظرت این چقدر دووم میاره؟ بگو.",
};

function graphicPlanFor(c) {
  const platformFa = { instagram: "اینستاگرام", tiktok: "تیک‌تاک", tools: "اپ" }[platformFromHost(c.host)] || "پلتفرم";
  return `موشن روی رابط واقعیِ ${platformFa} با زوم روی همان بخشی که در منبع (${c.host}) توضیح داده شده؛ رنگ برند ${platformFa} حفظ شود، بدون افزودن عدد یا آمار ساختگی.`;
}

function imageNeedFor(c) {
  return `اسکرین‌شات یا فریم واقعی از صفحهٔ رسمیِ ${c.host} دربارهٔ همین موضوع؛ طبق قاعدهٔ پروژه با fetch-screens.mjs تهیه و پیش از استفاده با «تأیید تصویر» تأیید انسانی شود.`;
}

async function pick(n) {
  const offered = loadOffered();
  const c = offered.find((x) => x.n === n);
  // exit(0), not exit(1): the operator was just told exactly what happened
  // and what to do about it. Every other "explained, nothing more to do"
  // branch in this file already exits 0 — this one exiting 1 was the only
  // outlier, and the only reason a stale/invalid pick number ever showed up
  // as a red CI failure instead of a normal Telegram reply.
  if (!c) { await say(`❌ موضوع شمارهٔ ${n} در آخرین فهرست نیست. ابتدا «جستجوی محتوا» را بفرست.`); process.exit(0); }

  if ((c.keyPoints || []).length < 2) {
    await say(
      `🚫 <b>این موضوع پیش از پیش‌نویس رد شد</b>\n${esc(c.title)}\n\n` +
      `مسیر عملی و قابل‌اجرای کافی در منبع نیست — طبق قاعدهٔ پروژه، پیش‌نویس ساختگی ساخته نمی‌شود.\n` +
      `<a href="${esc(c.url)}">منبع</a>`
    );
    process.exit(0);
  }

  const hookOptions = buildHookOptions(c);
  const { best, reason } = pickBestHook(hookOptions);
  const platform = platformFromHost(c.host);
  const steps = c.keyPoints.slice(0, 4);
  const payoff = steps[steps.length - 1] || c.benefitFa || c.title;

  const generated = {
    id: c.id, platform, feature: c.title, title: c.title,
    hook: { ask: best.text, l1: best.text, l2: `تا آخر ببین؛ ${({ income: "سود واقعی", reach: "دیده‌شدن", utility: "کاربرد واقعی", trend: "این ترند" }[c.lane] || "نکتهٔ اصلی")} توی گام آخر مشخص می‌شه.` },
    payoff, outroAsk: OUTRO_BY_LANE[c.lane] || OUTRO_BY_LANE.trend,
    tgTitle: `🎬 ${c.title}\n\n#GapMedia`,
    tips: steps.map((head, i) => ({ head, icon: ["target", "play", "chart", "pen"][i] || "target" })),
  };
  const draft = {
    kind: "tutorial", featureId: generated.id, generated,
    hook: generated.hook.ask, steps: null,
    hookOptions: hookOptions.map((h) => h.text), hookReason: reason,
    teaser: generated.hook.l2,
    graphicPlan: graphicPlanFor(c), imageNeed: imageNeedFor(c), musicPlan: MUSIC_BY_LANE[c.lane] || MUSIC_BY_LANE.trend,
    sourceUrl: c.url, sourceDate: c.date,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(".content-draft.json", JSON.stringify(draft, null, 2) + "\n");
  // A fresh research result has no local UI screenshot yet.  Fetch only the
  // source page's own image as a candidate and send it to Telegram for visual
  // approval.  It is deliberately not wired into the draft until «تأیید
  // تصویر …» arrives; an unverified preview must never become a fake UI.
  const screenResult = spawnSync(process.execPath, ["fetch-screens.mjs", "--id", generated.id, "--source", c.url], { stdio: "inherit", env: process.env });
  if (screenResult.status && screenResult.status !== 0) {
    console.error(`تصویر نامزد برای ${generated.id} دریافت نشد؛ پیش‌نویس بدون تصویر باقی ماند.`);
  }
  const result = spawnSync(process.execPath, ["content-draft.mjs", "--preview"], { stdio: "inherit", env: process.env });
  process.exit(result.status ?? 1);
}

// ---- entry -------------------------------------------------------------------
// Guarded so test-content-search.mjs can import the pure functions above
// without triggering a live search or a Telegram send as a side effect.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  // Registered only for real CLI runs, not when test-content-search.mjs
  // imports the pure functions above — an uncaught bug here used to fail
  // the CI step red with nothing sent to Telegram, leaving the chat silent
  // (the exact failure mode custom-draft.mjs/content-draft.mjs already
  // guard against with this same helper).
  replyOnFailure();
  if (pickArg) await pick(pickArg);
  else await discover();
}

export {
  realSentences, idFor, platformFromHost, seedFromTitle, buildCandidates, selectBalanced,
  buildHookOptions, scoreHook, pickBestHook, clip17, graphicPlanFor, imageNeedFor,
};
