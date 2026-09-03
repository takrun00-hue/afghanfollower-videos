// content-search.mjs — the live-search-first discovery engine for «جستجوی
// محتوا» and «جستجوی جدید: X» (2026-09-03 content-search rules 1-7, 9).
// Network calls (Exa, Google/YouTube autocomplete, Grok translation) are not
// exercised here — importing the module is guarded (isMain check) so these
// pure functions can be tested without a live search or a Telegram send.
//
//   node test-content-search.mjs
import assert from "node:assert/strict";
import {
  realSentences, idFor, platformFromHost, seedFromTitle, buildCandidates, selectBalanced,
  buildHookOptions, scoreHook, pickBestHook, clip17, graphicPlanFor, imageNeedFor,
} from "./content-search.mjs";

let bad = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? "  ok  " : "  FAIL"} ${label.padEnd(58)} ${detail || ""}`);
  if (!cond) bad++;
};

// ---- realSentences: only real extracted text, never fabricated -------------
{
  const sentences = realSentences("اینستاگرام امروز برنامهٔ تازه‌ای معرفی کرد. سازنده‌ها می‌توانند از تب Bonuses استفاده کنند. کوتاه.");
  check("realSentences keeps substantial sentences", sentences.length === 2, JSON.stringify(sentences));
  check("realSentences drops fragments under 10 chars", !sentences.some((s) => s.length <= 10));
}
check("realSentences on empty text returns []", realSentences("").length === 0);

// ---- idFor: stable, deterministic, url-keyed --------------------------------
{
  const a = idFor("https://example.com/story");
  const b = idFor("https://example.com/story");
  const c = idFor("https://example.com/other");
  check("idFor is deterministic for the same URL", a === b);
  check("idFor differs for a different URL", a !== c);
  check("idFor is prefixed for downstream recognition", a.startsWith("search-"));
}

// ---- platformFromHost --------------------------------------------------------
check("platformFromHost recognises Instagram domains", platformFromHost("creators.instagram.com") === "instagram");
check("platformFromHost recognises TikTok domains", platformFromHost("newsroom.tiktok.com") === "tiktok");
check("platformFromHost falls back to tools for anything else", platformFromHost("techcrunch.com") === "tools");

// ---- seedFromTitle: short probe seed, not a full sentence -------------------
check("seedFromTitle caps to a handful of words", seedFromTitle("یک دو سه چهار پنج شش هفت هشت").split(" ").length <= 5);

// ---- buildCandidates: rule 6 — not from a single source ---------------------
{
  const items = [
    { url: "https://a.example.com/1", title: "یک", text: "متن" },
    { url: "https://a.example.com/2", title: "دو", text: "متن" },
    { url: "https://a.example.com/3", title: "سه", text: "متن" }, // 3rd from same host must be dropped
    { url: "https://b.example.com/1", title: "چهار", text: "متن" },
  ];
  const out = await buildCandidates(items, "trend");
  check("buildCandidates caps at 2 per host (rule 6)", out.filter((c) => c.host === "a.example.com").length === 2, `got ${out.length} total`);
  check("buildCandidates keeps a different host's result", out.some((c) => c.host === "b.example.com"));
}
{
  // A follower-shop page must never survive into the candidate list — this is
  // exactly the source-quality gate rule 1 ("official, credible sources only")
  // leans on.
  const spam = [{ url: "https://joingerald.com/x", title: "خرید فالوور ارزان", text: "" }];
  const out = await buildCandidates(spam, "reach");
  check("buildCandidates drops a blocked/sales source", out.length === 0);
}

// ---- selectBalanced: rules 2 & 6 — lane mix, at least 5 when available ------
{
  const mk = (lane, score, n) => ({ id: `${lane}-${n}`, lane, gate: { score } });
  const passed = [
    ...[1, 2, 3].map((n) => mk("income", 10 - n, n)),
    ...[1, 2, 3].map((n) => mk("reach", 10 - n, n)),
    ...[1, 2].map((n) => mk("trend", 10 - n, n)),
  ];
  const chosen = selectBalanced(passed, { income: 2, reach: 2, trend: 1 });
  check("selectBalanced returns 5 when enough candidates pass", chosen.length === 5, `got ${chosen.length}`);
  check("selectBalanced honours the income quota", chosen.filter((c) => c.lane === "income").length === 2);
  check("selectBalanced honours the reach quota", chosen.filter((c) => c.lane === "reach").length === 2);
  check("selectBalanced honours the trend quota", chosen.filter((c) => c.lane === "trend").length === 1);
}
{
  // Honesty over padding: selectBalanced must never invent a 5th slot when
  // fewer than 5 real candidates passed the gate.
  const passed = [{ id: "income-1", lane: "income", gate: { score: 9 } }];
  const chosen = selectBalanced(passed, { income: 2, reach: 2, trend: 1 });
  check("selectBalanced never pads past what actually passed", chosen.length === 1, `got ${chosen.length}`);
}

// ---- hook generation: rule 8 (3 hooks + best with a real reason) -----------
{
  const c = { title: "خبر آزمایشی", lane: "income", corroboration: 3 };
  const options = buildHookOptions(c);
  check("buildHookOptions returns exactly 3 distinct hooks", options.length === 3 && new Set(options.map((o) => o.text)).size === 3);
  for (const o of options) {
    check(`hook stays within the 3-second word budget: "${o.text.slice(0, 30)}…"`, o.text.trim().split(/\s+/).length <= 18);
  }
  const { best, reason } = pickBestHook(options);
  check("pickBestHook names a real reason", typeof reason === "string" && reason.length > 0, reason);
  check("pickBestHook's choice is one of the 3 offered options", options.some((o) => o.text === best.text));
}
check("scoreHook rewards an open question", scoreHook("این یک سؤال است؟").score > scoreHook("این یک جمله است.").score);
check("clip17 leaves a short hook untouched", clip17("سه کلمهٔ کوتاه") === "سه کلمهٔ کوتاه");
check("clip17 shortens a long hook to at most 17 words", clip17(Array(25).fill("کلمه").join(" ")).split(/\s+/).length <= 18);

// ---- graphic/image plan: rule 8 — tailored to the platform, not generic ----
{
  const c = { host: "creators.instagram.com", lane: "income" };
  check("graphicPlanFor names the real source host", graphicPlanFor(c).includes(c.host));
  check("imageNeedFor names the real source host and requires human approval", imageNeedFor(c).includes(c.host) && /تأیید/.test(imageNeedFor(c)));
}

console.log(bad === 0 ? "\ncontent-search.mjs pure functions hold" : `\n${bad} check(s) failed`);
process.exit(bad === 0 ? 0 : 1);
