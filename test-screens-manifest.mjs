// public/screens/candidates.json must stay an id-keyed object: {"trial-reels":
// [ {file, page, verified}, ... ]}. Both verifiedScreenFor() (lib/content.mjs,
// read at render time) and approve-screen.mjs (the human-approval command)
// index it as `manifest[id]`.
//
// It was found as a flat array — the exact same data, just concatenated —
// which made `manifest[id]` resolve to `undefined` for every single feature.
// 14 already-approved real screenshots across 5 features had been sitting
// verified in that file and were silently never used; every render fell back
// to a generic default visual instead, with no error anywhere to notice by.
// This is the failure mode the human-approval step exists specifically to
// prevent, and it happened without a single thrown error.
//
//   node test-screens-manifest.mjs
import { existsSync, readFileSync } from "node:fs";
import { packForFeature } from "./lib/content.mjs";

const MANIFEST = "public/screens/candidates.json";
let bad = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? "  ok  " : "  FAIL"} ${label.padEnd(46)} ${detail || ""}`);
  if (!cond) bad++;
};

if (!existsSync(MANIFEST)) {
  console.log("no manifest yet — nothing to check");
  process.exit(0);
}

const raw = readFileSync(MANIFEST, "utf8");
const manifest = JSON.parse(raw);

check("manifest is an id-keyed object, not a flat array", !Array.isArray(manifest) && typeof manifest === "object");

let totalCandidates = 0, totalVerified = 0, verifiedIds = [];
for (const [id, list] of Object.entries(manifest)) {
  check(`  "${id}" holds an array of candidates`, Array.isArray(list), `${Array.isArray(list) ? list.length : typeof list}`);
  if (!Array.isArray(list)) continue;
  totalCandidates += list.length;
  const verified = list.filter((c) => c && c.verified);
  totalVerified += verified.length;
  if (verified.length) verifiedIds.push(id);
  for (const c of list) {
    check(`    ${c.file || "(no file)"} has a source page on record`, !!c.page, c.page || "MISSING");
  }
}

console.log("");
console.log(`${Object.keys(manifest).length} feature ids, ${totalCandidates} candidates, ${totalVerified} verified across ${verifiedIds.length} ids`);

// The regression test that actually matters: a verified candidate must come
// back out through the same function daily-render.mjs calls, not just look
// right sitting in the JSON.
if (verifiedIds.length) {
  const probeId = verifiedIds[0];
  const pack = packForFeature(probeId, new Date());
  const expected = manifest[probeId].find((c) => c.verified)?.file;
  check(
    `packForFeature("${probeId}") actually resolves its verified screenshot`,
    pack && pack.hookPhoto === expected,
    `got ${pack?.hookPhoto || "null"}, expected ${expected}`
  );
} else {
  check("at least one feature has a verified real screenshot", false, "zero verified — nothing to probe");
}

console.log(bad === 0 ? "\nreal screenshots resolve correctly at render time" : `\n${bad} check(s) failed`);
process.exit(bad === 0 ? 0 : 1);
