// Rules the user has stated, turned into a test that fails the build.
//
// Each of these was corrected by hand at least once and came back anyway,
// because a rule that lives only in a conversation gets re-broken the next time
// content is written. A rule that fails a test does not.
//
//   node test-locked-rules.mjs
import { featuresFor } from "./lib/features.mjs";
import { minimaxSpeakable } from "./lib/pronounce.mjs";

const CATS = ["tiktok", "instagram", "tools", "general", "ai"];
const failures = [];

for (const cat of CATS) {
  for (const f of featuresFor(cat) || []) {
    const ask = String(f.hook?.ask || "");
    if (!ask) continue;
    const where = `${cat}/${f.id}`;

    // LOCKED: the word رایگان never appears in a hook. Not first, not last,
    // not after a dash. The value comes first; free is mentioned later in the
    // body if it is mentioned at all.
    if (/رایگان|\bfree\b/i.test(ask)) {
      failures.push(`${where}: hook contains «رایگان» — ${ask}`);
    }

    // LOCKED: a brand or product name is one spoken unit. If breathe() drops a
    // pause inside one, the narration says «تیک، تاک».
    const spoken = minimaxSpeakable(ask);
    for (const name of ["تیک تاک", "بک گراند", "ری اکشن", "کپ کات", "اسکرین شات"]) {
      const broken = name.replace(" ", "، ");
      if (spoken.includes(broken)) {
        failures.push(`${where}: «${name}» split by a breath — ${spoken}`);
      }
    }

    // LOCKED: no hook may open by naming the tool. Curiosity first, name later.
    const opener = ask.trim().split(/\s+/).slice(0, 2).join(" ");
    if (/^(گوگل|کپ‌?کات|کنوا|کانوا|فتوشاپ|اپ‌?سکیل|سونو)/i.test(opener)) {
      failures.push(`${where}: hook opens with the tool's name — ${ask}`);
    }
  }
}

if (failures.length) {
  console.error(`${failures.length} locked-rule violation${failures.length === 1 ? "" : "s"}:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("all locked rules hold across every hook in the catalogue");
