// Thirty-day duplicate control.
//
// Measured before this existed: 27 deliveries in the window carried 14 distinct
// pieces of content. Some of that was me re-sending while iterating, but nothing
// in the pipeline would have stopped it, and nothing recorded a send made
// outside daily-render — today's four videos are absent from the log entirely.
//
// Two things fix that: every send registers a fingerprint, and every candidate
// is compared against the window before it is built and again before it is sent.
//
// The comparison is on meaning, not wording. A different title, hook, source or
// format does not make content new; the same steps under a new headline is the
// same video to the person watching it.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const REGISTRY = ".content-registry.json";
const WINDOW_DAYS = 30;

const readJSON = (p, d) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d; } catch { return d; } };

// ---- text handling ---------------------------------------------------------
const STOP = new Set(["از", "به", "در", "را", "که", "با", "این", "برای", "است", "شد", "شده",
  "های", "یک", "بر", "تا", "هم", "و", "بود", "کرد", "می", "خود", "تو", "کن", "بگیر", "چه",
  "the", "a", "an", "of", "to", "in", "on", "for", "your", "you", "and", "is", "it"]);

const words = (s) => String(s || "")
  .replace(/[‌‏]/g, " ")
  .replace(/[يى]/g, "ی").replace(/ك/g, "ک")
  .replace(/[^\p{L}\p{N}\s]/gu, " ")
  .toLowerCase()
  .split(/\s+/)
  .filter((w) => w.length > 2 && !STOP.has(w))
  // «ویدیو» and «ویدیوها» are the same subject
  .map((w) => w.replace(/(های|ها|ان|ی)$/, ""))
  .filter((w) => w.length > 2);

// Shared vocabulary over the smaller set: two texts about the same thing score
// high even when one is much longer.
function overlap(a, b) {
  const A = new Set(words(a)), B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

// ---- fingerprint (rule 4) --------------------------------------------------
export function fingerprint(pack, extra = {}) {
  const steps = (pack.tips || pack.steps || []).map((t) => t.head || t.text || "").filter(Boolean);
  return {
    id: pack.id,
    platform: pack.platform || "",
    feature: String(pack.feature || "").trim(),
    topic: String(pack.title || pack.feature || pack.id || "").replace(/\s*[—-]\s*GapMedia\s*$/, "").trim(),
    question: String(pack.hook?.ask || "").trim(),
    angle: String(pack.benefit?.fa || pack.hook?.l1 || "").trim(),
    hookConcept: String(pack.hook?.l1 || "") + " " + String(pack.hook?.l2 || ""),
    keyPoints: steps,
    claim: String(pack.payoff || "").trim(),
    keywords: [...new Set(words(`${pack.title} ${pack.hook?.ask} ${steps.join(" ")}`))].slice(0, 24),
    sources: extra.sources || (pack.source ? [pack.source] : []),
    sentAt: new Date().toISOString(),
    messageId: extra.messageId || null,
    kind: extra.kind || "daily",
  };
}

// ---- comparison (rules 3, 5, 8) --------------------------------------------
// Each axis is scored separately so the reason for a rejection can be named.
export function compare(candidate, past) {
  const axes = {
    // Same feature id is the strongest signal there is.
    identity: candidate.id && candidate.id === past.id ? 1 : 0,
    feature: overlap(candidate.feature, past.feature),
    topic: overlap(candidate.topic, past.topic),
    question: overlap(candidate.question, past.question),
    keyPoints: overlap((candidate.keyPoints || []).join(" "), (past.keyPoints || []).join(" ")),
    angle: overlap(candidate.angle, past.angle),
    hook: overlap(candidate.hookConcept, past.hookConcept),
  };
  // Weighted toward what the viewer actually receives: the same steps under a
  // new headline is the same video, while a shared hook shape on genuinely
  // different information is not.
  const score = Math.round(100 * Math.min(1,
    axes.identity * 1.0
    + axes.keyPoints * 0.45
    + axes.question * 0.20
    + axes.topic * 0.15
    + axes.feature * 0.10
    + axes.angle * 0.06
    + axes.hook * 0.04));
  return { score, axes };
}

export function history(days = WINDOW_DAYS) {
  const cutoff = Date.now() - days * 86400000;
  return readJSON(REGISTRY, []).filter((e) => new Date(e.sentAt).getTime() > cutoff);
}

// Returns the verdict of rule 7 plus the closest thing already published.
export function check(candidate, { days = WINDOW_DAYS, alsoAgainst = [] } = {}) {
  const past = [...history(days), ...alsoAgainst];
  if (!past.length) {
    return { verdict: "UNIQUE", score: 0, closest: null, checked: readJSON(REGISTRY, []).length > 0 };
  }
  let closest = null, best = null;
  for (const p of past) {
    const r = compare(candidate, p);
    if (!best || r.score > best.score) { best = r; closest = p; }
  }
  // The same steps about the same feature is the same video, whatever the
  // headline says. Scoring alone let that through at 59 because the title and
  // the question had been rewritten — which is exactly the case rule 5 names:
  // a different title, hook or source does not make content new.
  const sameSubstance = best.axes.keyPoints >= 0.85
    && (best.axes.feature >= 0.9 || best.axes.identity === 1);

  const verdict = sameSubstance || best.score >= 70 ? "DUPLICATE"
    : best.score >= 45 ? "PARTIALLY_OVERLAPPING"
      : "UNIQUE";
  return { verdict, score: best.score, axes: best.axes, closest, checked: true, sameSubstance };
}

// ---- registry (rule 11) ----------------------------------------------------
export function register(entry) {
  const all = readJSON(REGISTRY, []);
  all.push(entry);
  // Two windows of history: enough to answer "was this sent recently" without
  // the file growing without limit.
  const cutoff = Date.now() - 2 * WINDOW_DAYS * 86400000;
  writeFileSync(REGISTRY, JSON.stringify(all.filter((e) => new Date(e.sentAt).getTime() > cutoff), null, 2) + "\n");
  return entry;
}

// True when there is real history to compare against. Rule 12: never report a
// clean check that did not happen.
export const hasHistory = () => history().length > 0;
