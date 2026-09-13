import assert from "node:assert/strict";
import { GERMAN_A1 } from "./lib/german-a1.mjs";

// Regression guard for the production report 2026-09-13: a1-17-adjectives'
// hook ("با این ۴ صفت، هر چیزی را توصیف کن.") reused the exact "این ۴
// کلمه/صفت ..." scaffold already used by a1-06-family and a1-07-question-
// words — a viewer who saw more than one of these videos got the same
// opening line three times. A systematic scan at the time this test was
// written found the SAME scaffold reused by a1-03-politeness too, and a
// separate "اولین ...ت در آلمان را ..." scaffold shared by a1-13-food-drink
// and a1-14-cafe — neither had been reported, both were fixed alongside
// a1-17. This test exists so the next reused scaffold is caught before a
// video ships, not after a viewer notices.
//
// A generic Persian text-similarity check would false-positive constantly
// on this corpus: every hook legitimately says "به آلمانی" ("in German")
// since that is the whole point of the series. So the check only flags a
// shared 3-word sequence that survives stripping this project's own
// function/domain-glue words — that is what an actual copy-pasted
// template scaffold ("این ۴ کلمه ...", "اولین ...ت در ...") looks like,
// while thematically-expected repetition ("را به آلمانی") does not.
const STOPWORDS = new Set([
  "این", "آن", "با", "به", "از", "در", "را", "که", "است", "هم", "یا", "و",
  "تا", "برای", "هر", "یک", "دو", "سه", "چهار", "۲", "۳", "۴", "۵", "خیلی",
  "دیگر", "هنوز", "حالا", "همین", "بدون", "آلمانی", "آلمان", "کن", "شو",
  "بزن", "بگیر", "بشو",
]);

function normalize(hook) {
  return hook
    .replace(/[.,،:؛!؟«»\-—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
}

// Only a 3-word (or longer) span counts as a "scaffold" — two hooks
// sharing one content word, or only function words, is not evidence of a
// copy-pasted template.
function meaningfulTrigrams(words) {
  const grams = new Set();
  for (let i = 0; i <= words.length - 3; i++) {
    const gram = words.slice(i, i + 3);
    if (gram.some((w) => !STOPWORDS.has(w))) grams.add(gram.join(" "));
  }
  return grams;
}

const hooks = GERMAN_A1.map((unit) => ({
  id: unit.id,
  grams: meaningfulTrigrams(normalize(unit.hook)),
}));

const collisions = [];
for (let i = 0; i < hooks.length; i++) {
  for (let j = i + 1; j < hooks.length; j++) {
    const shared = [...hooks[i].grams].filter((g) => hooks[j].grams.has(g));
    if (shared.length) {
      collisions.push(`${hooks[i].id} <-> ${hooks[j].id}: "${shared.join('", "')}"`);
    }
  }
}

assert.equal(
  collisions.length, 0,
  `German A1 hooks reuse a scaffold — give each unit its own hook that names its ` +
    `actual content instead:\n  ${collisions.join("\n  ")}`,
);

console.log(`ok   all ${GERMAN_A1.length} German A1 hooks are free of reused scaffolds`);
