// The gate a topic must pass before any content is made for it.
//
// The order matters and is not negotiable: value first, then demand, then trend
// and viral potential, with verification throughout. A topic that would travel
// well and teach nothing does not pass. That is the whole point of scoring
// audience value separately instead of folding it into one number.
//
// Nothing here invents evidence. Every axis is scored from something that was
// actually gathered — a dated source, a real autocomplete phrase, a published
// announcement — and an axis with nothing behind it scores zero and says so.
// A gate that guesses is worse than no gate, because it produces a number that
// looks like a check.

// What counts as a real benefit. A topic has to let the viewer do at least one
// of these, or there is no answer to "what does the viewer get".
const VALUE_MARKERS = [
  { re: /درآمد|مونیتایز|monet|earn|payout|فروش|اسپانسر|brand deal/i, label: "درآمد", weight: 10 },
  { re: /ویو|بازدید|views|reach|دیده|وایرال|viral/i, label: "دیده‌شدن", weight: 9 },
  { re: /فالوور|follower|رشد|growth|مخاطب تازه/i, label: "رشد", weight: 9 },
  { re: /اشتباه|جریمه|شدو ?بن|از دست می‌دهی|کم می‌کند|حذف می‌شود|بن می‌شوی|mistake|avoid|penal/i, label: "پرهیز از اشتباه", weight: 9 },
  { re: /رایگان|free|بدون هزینه|بدون نصب/i, label: "صرفهٔ هزینه", weight: 7 },
  { re: /سریع‌تر|وقت|زمان|نصف|در چند ثانیه|faster|save time/i, label: "صرفهٔ وقت", weight: 6 },
  { re: /چطور|چگونه|قدم‌به‌قدم|مرحله|how to|step/i, label: "روش عملی", weight: 6 },
  { re: /آپدیت|قابلیت تازه|قابلیت جدید|ابزار تازه|new feature|new tool|رونمایی از قابلیت/i, label: "قابلیت تازه", weight: 6 },
];

const daysOld = (iso) => {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? (Date.now() - t) / 86400000 : Infinity;
};

// ---- the nine axes (rule 10) ----------------------------------------------
// Each returns { score 0..10, why } so a rejection can name its reason rather
// than producing an unexplained number.
function audienceValue(c) {
  const hay = `${c.topic || ""} ${c.question || ""} ${(c.keyPoints || []).join(" ")}`;
  const hits = VALUE_MARKERS.filter((m) => m.re.test(hay));
  if (!hits.length) return { score: 0, why: "هیچ سود مشخصی برای بیننده پیدا نشد" };
  const best = hits.reduce((a, b) => (a.weight >= b.weight ? a : b));
  // A second, different kind of benefit is worth something, but not as much as
  // the first: two weak benefits do not equal one strong one.
  const bonus = Math.min(2, hits.length - 1);
  return { score: Math.min(10, best.weight + bonus), why: hits.map((h) => h.label).join("، ") };
}

function searchDemand(c) {
  const n = (c.demandPhrases || []).length;
  if (!n) return { score: 0, why: "عبارت جست‌وجوی واقعی جمع نشده" };
  // Real autocomplete phrases, which are queries people actually typed.
  const both = (c.demandPhrases || []).filter((p) => p.crossPlatform).length;
  return { score: Math.min(10, 3 + Math.min(4, Math.floor(n / 4)) + Math.min(3, both)),
           why: `${n} عبارت واقعی${both ? `، ${both} تا در هر دو موتور` : ""}` };
}

function trendMomentum(c) {
  const age = daysOld(c.sourceDate);
  if (!Number.isFinite(age)) return { score: 0, why: "تاریخ منبع نامعلوم" };
  const score = age <= 1 ? 10 : age <= 3 ? 9 : age <= 7 ? 7 : age <= 30 ? 4 : 1;
  return { score, why: `منبع ${Math.round(age)} روزه` };
}

function freshness(c) {
  const age = daysOld(c.sourceDate);
  if (!Number.isFinite(age)) return { score: 0, why: "بدون تاریخ" };
  return { score: age <= 3 ? 10 : age <= 7 ? 8 : age <= 30 ? 5 : 2, why: `${Math.round(age)} روز` };
}

function viralPotential(c) {
  const q = String(c.question || "");
  let s = 3;
  const why = [];
  if (/[؟?]$/.test(q)) { s += 2; why.push("سؤال باز"); }
  if (/\d|۰|۱|۲|۳|۴|۵|۶|۷|۸|۹/.test(q)) { s += 2; why.push("عدد مشخص"); }
  if (/رایگان|free/i.test(q)) { s += 1; why.push("رایگان"); }
  if (/اشتباه|نکن|از دست/.test(q)) { s += 2; why.push("هشدار"); }
  return { score: Math.min(10, s), why: why.join("، ") || "قلاب خنثی" };
}

function practicalUse(c) {
  const steps = (c.keyPoints || []).filter((x) => String(x).trim().length > 8);
  if (!steps.length) return { score: 0, why: "هیچ گام عملی ندارد" };
  return { score: Math.min(10, 4 + steps.length), why: `${steps.length} گام` };
}

function evidenceStrength(c) {
  const official = /support\.|help\.|newsroom\.|about\.|blog\.google|blog\.youtube|creators\./i;
  const srcs = (c.sources || []).filter(Boolean);
  if (!srcs.length) return { score: 0, why: "بدون منبع" };
  const isOfficial = srcs.some((s) => official.test(String(s)));
  return { score: isOfficial ? 10 : srcs.length > 1 ? 6 : 4,
           why: isOfficial ? "منبع رسمی پلتفرم" : `${srcs.length} منبع غیررسمی` };
}

function growthRelevance(c) {
  const hay = `${c.topic || ""} ${(c.keyPoints || []).join(" ")}`;
  return /درآمد|monet|فروش|اسپانسر|فالوور|رشد|ویو|reach/i.test(hay)
    ? { score: 9, why: "مستقیم به رشد یا درآمد وصل است" }
    : { score: 4, why: "غیرمستقیم" };
}

function audienceInterest(c) {
  // Interest is only claimed when something was observed: autocomplete phrases
  // or a discussion thread. Rule 17 — never assert a trend without evidence.
  const n = (c.demandPhrases || []).length + (c.discussions || []).length;
  return n ? { score: Math.min(10, 4 + Math.min(6, n)), why: `${n} نشانهٔ واقعی` }
           : { score: 0, why: "علاقهٔ مخاطب مشاهده نشد" };
}

// ---- the gate --------------------------------------------------------------
export function evaluate(candidate) {
  const axes = {
    audienceValue: audienceValue(candidate),
    searchDemand: searchDemand(candidate),
    trendMomentum: trendMomentum(candidate),
    viralPotential: viralPotential(candidate),
    freshness: freshness(candidate),
    practicalUse: practicalUse(candidate),
    audienceInterest: audienceInterest(candidate),
    evidence: evidenceStrength(candidate),
    growthRelevance: growthRelevance(candidate),
  };

  // Value is weighted highest on purpose: a topic that would travel well and
  // teach nothing must not outrank one that teaches something real.
  const W = {
    audienceValue: 0.26, practicalUse: 0.14, searchDemand: 0.13, evidence: 0.12,
    freshness: 0.09, trendMomentum: 0.09, growthRelevance: 0.07,
    viralPotential: 0.06, audienceInterest: 0.04,
  };
  const score = Math.round(10 * Object.entries(W).reduce((sum, [k, w]) => sum + axes[k].score * w, 0));

  // Hard conditions from rule 12. These are not tradeable against a high score:
  // a topic with no benefit, no practical content or no source does not pass
  // however well it would perform.
  const failures = [];
  if (axes.audienceValue.score < 5) failures.push("سود مشخصی برای بیننده ندارد");
  if (axes.practicalUse.score < 4) failures.push("محتوای عملی ندارد");
  if (axes.evidence.score < 4) failures.push("منبع قابل اتکا ندارد");
  if (axes.searchDemand.score === 0 && axes.audienceInterest.score === 0) {
    failures.push("هیچ نشانهٔ واقعی از تقاضا یا علاقهٔ مخاطب نیست");
  }

  return {
    decision: failures.length ? "REJECT" : "APPROVE",
    score, axes, failures,
    // Rule 6: a level, never an invented number.
    demandLevel: axes.searchDemand.score >= 9 ? "VERY HIGH"
      : axes.searchDemand.score >= 7 ? "HIGH"
        : axes.searchDemand.score >= 5 ? "RISING"
          : axes.searchDemand.score >= 3 ? "MODERATE"
            : axes.searchDemand.score > 0 ? "EMERGING" : "UNVERIFIED",
  };
}

// Rule 16: an empty result is a real answer. Returning the best of a bad set is
// how a schedule gets filled with content nobody needed.
export function selectBest(candidates) {
  const judged = candidates.map((c) => ({ candidate: c, verdict: evaluate(c) }));
  const passed = judged.filter((j) => j.verdict.decision === "APPROVE")
    .sort((a, b) => b.verdict.score - a.verdict.score);
  return {
    approved: passed,
    rejected: judged.filter((j) => j.verdict.decision === "REJECT"),
    best: passed[0] || null,
    none: passed.length === 0,
  };
}
