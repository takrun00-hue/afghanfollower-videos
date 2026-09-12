// Real bug, 2026-09-12: the "instagram" daily slot alternated forever
// between two never-published, already-rejected ids ("pin-posts",
// "hashtags-hurt") instead of trying any of the many other untried
// candidates that actually existed — daily-render.mjs's own triedIds check
// then gave up with "no more topics to try" after only 2 of its allowed 6
// attempts. Root cause: featureFor()'s exhausted-category fallback picked
// the globally least-stale candidate WITHOUT checking exclude, and a
// never-published id (staleness 0) always wins that ranking — including one
// this very run had just rejected.
//
// The fix must hold two things at once: featureFor() must never re-offer an
// id already in `exclude` (any reason — published, or rejected this run),
// while aiFeatureFor()'s small AI_DAILY_IDS list — which has no bank-based
// fallback to escalate to — keeps its old guarantee of never returning
// nothing.
//
//   node test-feature-exhaustion.mjs
import { readFileSync } from "node:fs";
import { featureFor, aiFeatureFor } from "./lib/features.mjs";

const history = JSON.parse(readFileSync(".content-history.json", "utf8"));
const published = new Set(history.map((h) => String(h.id || "").toLowerCase()).filter(Boolean));
const staleness = new Map();
for (const h of history) {
  const id = String(h.id || "").toLowerCase();
  if (!id) continue;
  const t = Date.parse(h.sentAt || "") || 0;
  if (!staleness.has(id) || t > staleness.get(id)) staleness.set(id, t);
}
const dayIndex = Math.floor(Date.UTC(2026, 8, 12) / 86400000);

let bad = 0;
function check(name, ok) {
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}`);
  if (!ok) bad++;
}

// featureFor() must never repeat an id already in the exclude set it was
// given, growing that set with each real pick — this is exactly the
// sequence daily-render.mjs's retry loop drives it through.
{
  let exclude = new Set(published);
  const seen = new Set();
  let repeated = false;
  for (let n = 0; n < 10; n++) {
    const f = featureFor("instagram", dayIndex, exclude, staleness);
    if (!f) break;
    const id = String(f.id).toLowerCase();
    if (exclude.has(id)) { repeated = true; break; }
    seen.add(id);
    exclude = new Set([...exclude, id]);
  }
  check("featureFor() never re-offers an id already excluded, across 10 rounds", !repeated);
  check("featureFor() found more than the 2 real candidates today's run got stuck on", seen.size > 2);
}

// The exact reported scenario: only two never-published candidates remain,
// and both have already failed this run. featureFor() must give up (return
// nothing) rather than re-serve either one.
{
  // Build an exclude set that is everything except two synthetic never-
  // published stand-ins, then exclude those two as well ("this run already
  // rejected them") and confirm featureFor backs off instead of repeating.
  const a = featureFor("instagram", dayIndex, new Set(published), staleness);
  const excludeWithA = new Set([...published, String(a.id).toLowerCase()]);
  const b = featureFor("instagram", dayIndex, excludeWithA, staleness);
  const excludeWithBoth = new Set([...excludeWithA, String(b.id).toLowerCase()]);
  const third = featureFor("instagram", dayIndex, excludeWithBoth, staleness);
  const ok = !third || !excludeWithBoth.has(String(third.id).toLowerCase());
  check("once both fresh picks are excluded too, featureFor() does not loop back to either", ok);
}

// aiFeatureFor() has no bank fallback to escalate to (AI_DAILY_IDS is the
// whole list), so it must keep guaranteeing a pick even when every one of
// its candidates is excluded — unlike featureFor(), it must NOT return
// undefined here.
{
  const first = aiFeatureFor(dayIndex, new Set(published), staleness);
  check("aiFeatureFor() still returns a candidate against real history", !!first);
  // Exclude literally everything real + the one it just picked, forcing true
  // exhaustion of the whole AI_DAILY_IDS list.
  const massiveExclude = new Set([...published, ...Array.from({ length: 200 }, (_, i) => `x-${i}`)]);
  if (first) massiveExclude.add(String(first.id).toLowerCase());
  const stillGetsSomething = aiFeatureFor(dayIndex, massiveExclude, staleness);
  check("aiFeatureFor() guarantees a pick even when every AI_DAILY_IDS candidate is excluded", !!stillGetsSomething);
}

console.log("");
console.log(bad === 0 ? "all exhaustion-fallback cases behave as expected" : `${bad} case(s) wrong`);
process.exit(bad === 0 ? 0 : 1);
