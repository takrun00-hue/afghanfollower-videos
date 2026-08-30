// Choose what to build next, from what has not gone out.
//
// The three features approved earlier had all been sent the same day, so the
// duplicate check refused them and was right to. This ranks everything the
// catalogue holds that is not in the 30-day registry, through the value gate
// rather than by taking the next name off a list — and it maps a feature onto
// the gate's inputs properly. An earlier pass fed it the wrong field names,
// every candidate scored zero, and "no qualified content" was a bug wearing the
// costume of a finding. A gate that reports nothing has to be read carefully:
// the question is always whether the emptiness is in the content or the input.
//
//   node pick-next.mjs                # rank everything unsent
//   node pick-next.mjs --n 3          # and name a pick per category
import { readFileSync, existsSync } from "node:fs";
import { featuresFor, featureById } from "./lib/features.mjs";
import { evaluate } from "./lib/selection-gate.mjs";
import { probeDemand, seedFor } from "./lib/demand-probe.mjs";

const CATS = ["tiktok", "instagram", "tools", "general", "ai"];

const sent = new Set(
  (existsSync(".content-registry.json")
    ? JSON.parse(readFileSync(".content-registry.json", "utf8"))
    : []
  ).flatMap((e) => [e.feature, e.id].filter(Boolean).map((s) => String(s).toLowerCase())),
);

/** A catalogue feature in the shape the gate reads. */
function asCandidate(f, cat) {
  const steps = (f.steps || []).map((s) => String(s.text || "")).filter(Boolean);
  return {
    topic: `${f.name || f.id} ${f.title || ""} ${f.benefit?.fa || ""}`,
    question: f.hook?.ask || "",
    keyPoints: steps.length ? steps : [f.payoff].filter(Boolean),
    // These are documented platform features, and that is what is claimed —
    // one source, not an official URL nobody checked. The gate scores it as
    // the weak evidence it is.
    sources: [`${cat} feature, catalogue entry`],
    // No date: these are standing features, not news. trendMomentum and
    // freshness score zero and say so, which is accurate — inventing a date
    // to lift a score is exactly what the gate exists to prevent.
  };
}

const rows = [];
for (const cat of CATS) {
  for (const f of featuresFor(cat) || []) {
    const key = String(f.name || f.id || "").toLowerCase();
    if (!f.id || sent.has(key) || sent.has(String(f.id).toLowerCase())) continue;
    if (rows.some((r) => r.f.id === f.id)) continue;
    rows.push({ cat, f });
  }
}
console.log(`${rows.length} features in the catalogue that have not gone out\n`);

const judged = [];
for (const { cat, f } of rows) {
  let phrases = [];
  try {
    phrases = await probeDemand(seedFor({ ...f, feature: f.name }));
  } catch {
    // A probe that will not answer is not evidence of no demand.
  }
  const verdict = evaluate({ ...asCandidate(f, cat), demandPhrases: phrases });
  judged.push({ cat, f, phrases: phrases.length, verdict });
  process.stdout.write(`  probed ${judged.length}/${rows.length}\r`);
}
console.log(`  probed ${judged.length}                    \n`);

const approved = judged
  .filter((j) => j.verdict.decision === "APPROVE")
  .sort((a, b) => b.verdict.score - a.verdict.score);
const rejected = judged.filter((j) => j.verdict.decision === "REJECT");

console.log(`${approved.length} passed, ${rejected.length} rejected\n`);
for (const j of approved.slice(0, 20)) {
  console.log(
    `  ${String(j.verdict.score).padStart(3)}  ${j.cat.padEnd(10)} ${String(j.f.id).padEnd(22)}` +
    ` ${j.verdict.demandLevel.padEnd(10)} ${String(j.phrases).padStart(2)}p  ${String(j.f.hook?.ask || "").slice(0, 46)}`,
  );
}

if (rejected.length) {
  const why = new Map();
  for (const j of rejected) for (const f of j.verdict.failures) why.set(f, (why.get(f) || 0) + 1);
  console.log("\nwhy the rest were rejected:");
  for (const [reason, n] of [...why].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${reason}`);
}

const nIdx = process.argv.indexOf("--n");
if (nIdx >= 0) {
  const want = Number(process.argv[nIdx + 1] || 3);
  const picked = [];
  const usedCats = new Set();
  // Spread across categories first, so three videos are not three versions of
  // the same subject, then fill from the ranking.
  for (const j of approved) {
    if (picked.length >= want) break;
    if (usedCats.has(j.cat)) continue;
    picked.push(j); usedCats.add(j.cat);
  }
  for (const j of approved) {
    if (picked.length >= want) break;
    if (!picked.includes(j)) picked.push(j);
  }
  console.log("");
  if (picked.length < want) {
    console.log(`NO QUALIFIED CONTENT for ${want - picked.length} of the ${want} slots — say so rather than filling them.`);
  }
  for (const j of picked) console.log(`pick  ${j.cat.padEnd(10)} ${j.f.id.padEnd(22)} ${j.verdict.score}  ${j.f.hook?.ask || ""}`);
  console.log("\nids: " + picked.map((j) => j.f.id).join(" "));
}
