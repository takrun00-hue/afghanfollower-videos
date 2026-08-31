// Amal must be reachable, and must be reached from Amal.
//
// The «امل» commands searched through Exa, which has none of the four Amal
// domains indexed — every query, every date range, zero results. The commands
// therefore never once returned an Amal story; what arrived came from dw.com
// and wdr.de sitting in the domain list beside Amal, and when those were
// already seen the scan said "no new stories" and stopped.
//
// That message is the reason this ran broken for weeks: "no new stories" reads
// as "nothing happened today", not as "the source was never reachable". This
// test distinguishes the two.
//
//   node test-amal.mjs
import { amalPersian, isAmal } from "./lib/amal.mjs";

const CASES = [
  { name: "Persian desk", city: null },
  { name: "برلین", city: "berlin" },
  { name: "هامبورگ", city: "hamburg" },
  { name: "فرانکفورت", city: "frankfurt" },
];

let bad = 0;
for (const c of CASES) {
  let rows = [];
  let err = null;
  try {
    rows = await amalPersian({ city: c.city, limit: 4 });
  } catch (e) {
    err = e.message;
  }

  if (err) {
    bad++;
    console.log(`  FAIL ${c.name.padEnd(14)} ${err}`);
    continue;
  }
  // Every row must be Persian, from Amal, and carry a usable date.
  const notAmal = rows.filter((r) => !isAmal(r.url));
  const notPersian = rows.filter((r) => !/[\u0600-\u06FF]/.test(r.title));
  const undated = rows.filter((r) => !/^\d{4}-\d{2}-\d{2}$/.test(r.publishedDate));

  const ok = rows.length > 0 && !notAmal.length && !notPersian.length && !undated.length;
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${c.name.padEnd(14)} ${rows.length} stories` +
    (notAmal.length ? `, ${notAmal.length} not from Amal` : "") +
    (notPersian.length ? `, ${notPersian.length} not Persian` : "") +
    (undated.length ? `, ${undated.length} undated` : ""));
  if (rows[0]) console.log(`       ${rows[0].publishedDate}  ${rows[0].title.slice(0, 54)}`);
}

console.log("");
console.log(bad === 0
  ? "Amal answers on every command, in Persian, from its own domain"
  : `${bad} of ${CASES.length} Amal commands would return nothing`);
process.exit(bad === 0 ? 0 : 1);
