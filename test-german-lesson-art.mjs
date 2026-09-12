// Owner report, 2026-09-12: several German-lesson episodes shipped with a
// hook drawing the generic "sparkle" (star-shaped) decoration with no
// relation to what the episode actually taught — sceneArtFor()'s whole
// keyword chain is written for GapMedia's own app-feature hooks ("پیج",
// "پروفایل", "دنبال کن"...), none of which ever appears in a language-
// lesson hook, so every episode fell through to the same fallback.
// hookArtFor() now maps German-lesson packs by topic id instead. This
// checks every real unit in the curriculum resolves to something other
// than the fallback, and that the ordinary GapMedia hook path (real app-
// feature text, keyword-matched) is untouched.
//
//   node test-german-lesson-art.mjs
import { readFileSync } from "node:fs";
import { hookArtFor } from "./lib/scene-art.mjs";

let bad = 0;
function check(name, ok) {
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}`);
  if (!ok) bad++;
}

const curriculum = readFileSync("lib/german-a1.mjs", "utf8");
const ids = [...curriculum.matchAll(/id:\s*"(a1-[a-z0-9-]+)"/g)].map((m) => m[1]);
check("found real units in lib/german-a1.mjs", ids.length > 0);

for (const id of ids) {
  const art = hookArtFor({ kind: "german-lesson", id, hook: { ask: "x" } });
  check(`${id} draws topic art, not the meaningless sparkle fallback`, art !== "sparkle");
}

// The ordinary GapMedia hook path (no `kind`) must still keyword-match its
// own l1/l2 text exactly as before — this fix must not touch it.
check("a non-lesson hook still keyword-matches its own text",
  hookArtFor({ hook: { l1: "دنبال کن و لایک کن" } }) === "heart");

console.log("");
console.log(bad === 0 ? `${ids.length} German-lesson topics, all draw relevant art` : `${bad} case(s) wrong`);
process.exit(bad === 0 ? 0 : 1);
