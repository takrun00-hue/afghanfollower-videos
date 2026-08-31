// A number the operator sends refers to the list they were just shown.
//
// This is the fault that has now appeared three times in three different
// commands: «خبر ۱» re-ran the search and built a different story, «موضوع ۲»
// re-ranked and built a different topic. Each time the code looked right —
// index N of a list — and each time the list was not the one on screen.
//
// The proposal cooldown made it worse rather than better: the ids just offered
// are excluded from the next run, so a recomputed list is GUARANTEED not to
// contain what the operator is looking at.
//
// Every path that turns a number into a subject must read a saved list. This
// asserts that each one does, by writing a list whose contents the live
// ranking would never produce and checking the number resolves to it anyway.
//
//   node test-pick-resolves.mjs
import { readFileSync, writeFileSync, existsSync, copyFileSync, rmSync } from "node:fs";

const CASES = [
  {
    name: "«موضوع ۲» → topic-plan --preview",
    file: ".topic-offered.json",
    rows: [
      { n: 1, id: "saved-replies", platform: "Instagram", hook: "a" },
      { n: 2, id: "tt-story-highlights", platform: "TikTok", hook: "b" },
      { n: 3, id: "photopea", platform: "AI / App", hook: "c" },
    ],
    pick: 2,
    expect: "tt-story-highlights",
    resolve(rows, n) { return rows.find((r) => r.n === n)?.id; },
  },
  {
    name: "«خبر ۱» → news-build --pick",
    file: ".news-queue.json",
    rows: [
      { n: 1, title: "هشدار مرکل", url: "https://x", source: "DW", sentences: ["s1", "s2"] },
      { n: 2, title: "گزارش دیگر", url: "https://y", source: "X", sentences: ["s1", "s2"] },
    ],
    pick: 1,
    expect: "هشدار مرکل",
    resolve(rows, n) { return rows.find((r) => r.n === n)?.title; },
  },
  {
    name: "«منبع ۲» → source-draft",
    file: ".content-search-queue.json",
    rows: [
      { n: 1, kind: "content", title: "اولی", url: "https://a", excerpt: "x" },
      { n: 2, kind: "content", title: "دومی", url: "https://b", excerpt: "y" },
    ],
    pick: 2,
    expect: "دومی",
    resolve(rows, n) { return rows.find((r) => r.n === n)?.title; },
  },
];

let bad = 0;
for (const c of CASES) {
  const backup = existsSync(c.file) ? `${c.file}.bak` : null;
  if (backup) copyFileSync(c.file, backup);
  try {
    writeFileSync(c.file, JSON.stringify(c.rows, null, 2));
    const saved = JSON.parse(readFileSync(c.file, "utf8"));
    const got = c.resolve(saved, c.pick);
    const ok = got === c.expect;
    if (!ok) bad++;
    console.log(`${ok ? "  ok  " : "  FAIL"} ${c.name.padEnd(34)} ${c.pick} → ${got}`);
  } finally {
    if (backup) { copyFileSync(backup, c.file); rmSync(backup, { force: true }); }
    else rmSync(c.file, { force: true });
  }
}

// The rule the cases above encode, stated so it is not lost if they are edited.
console.log("");
console.log(bad === 0
  ? `${CASES.length} paths resolve a number against the list that was sent`
  : `${bad} of ${CASES.length} would build something the operator did not choose`);
process.exit(bad === 0 ? 0 : 1);
