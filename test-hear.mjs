// The comparison in lib/hear.mjs has to hold two lines at once: forgive how a
// transcriber spells a sound, and refuse to forgive a sound that changed. Each
// case below came from a real reported fault or a real false alarm, so loosening
// the comparison to silence one of them will fail one of these.
//
//   node test-hear.mjs
import { faults } from "./lib/hear.mjs";

const cases = [
  // Spelling decisions by the transcriber. The audio has no spaces in it and
  // Persian does not write short vowels, so none of these is a fault.
  ["pass", "the possessive heard as one word",
    "آیا ویوهایِ تیک تاکَت، اَصلَن برای درآمد، واجِدِ شَرایِط هستند؟",
    "آیا ویوهای تیکتاکات اصلن برای درامد واجد شرایت هستند؟"],
  ["pass", "«درآمد» written as two",
    "آیا ویوهایِ تیک تاکَت، اَصلَن برای درآمد، واجِدِ شَرایِط هستند؟",
    "آیا ویوهای تیک تاکت اصلن برای در آمد واجد شرایت هستند؟"],
  ["pass", "«نمونه کارَت» run together, medial ه lost",
    "برای همکاری تبلیغی، پروفایل و نمونه کارَت را کامل کن",
    "برای همکاری تبلیغی، پروفایل و نمونکارت را کامل کن."],
  ["pass", "final ه dropped, and واو معدوله in «بخوان»",
    "تَعریف ویو، واجِدِ شَرایِط را داخل همان صفحه بخوان",
    "تعریف ویو، واجد شرایت را داخل همان صفح بخان"],
  ["pass", "colloquial «رو» for «را», ط written as ت",
    "کشور، سن و شرایط، برنامه را با حساب خودت",
    "کشور، سن و شرائط برنامه رو با حساب خودت"],
  ["pass", "short vowel left out of the brand — «تکتاکت»",
    "آیا ویوهایِ تیک تاکَت، اَصلَن برای درآمد، واجِدِ شَرایِط هستند؟",
    "آیا ویوهای تکتاکت اصلن برای درامد واجد شرایت هستند"],

  // Sounds that actually changed. Each one alters the sentence.
  ["fail", "an ezafe the grammar has no room for",
    "برای درآمد واجِدِ شَرایِط", "برای درآمده واجد شرایت"],
  ["fail", "«نمونه‌کار» collapsing to «کارت», a card",
    "نمونه کارَت را کامل کن", "کارت را کامل کن"],
  ["fail", "the possessive breaking off — «تیک تاک کَت»",
    "ویوهایِ تیک تاکَت", "ویوهای تیک تاک کت"],
  ["fail", "the same break with a long vowel in it",
    "ویوهایِ تیک تاکَت", "ویوهای تیک تاک کات"],
  ["fail", "«ویو» taking a vowel it does not have",
    "تعریف ویو را بخوان", "تعریف ویویه را بخان"],
  ["fail", "words missing from the line",
    "کشور، سن و شرایط، برنامه را باز کن", "کشور و شرایط را باز کن"],
];

let bad = 0;
for (const [want, name, expected, heard] of cases) {
  const found = faults({ expected, heard });
  const got = found.length ? "fail" : "pass";
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? "  ok  " : "  NOT "} ${want.padEnd(4)} ${name}`);
  if (!ok) {
    console.log(`         expected ${want}, got ${got}`);
    for (const f of found) console.log(`         ${f.kind}: «${f.want}» → «${f.got}»`);
  }
}

console.log("");
console.log(bad === 0 ? `${cases.length} cases, all as expected` : `${bad} of ${cases.length} wrong`);
process.exit(bad === 0 ? 0 : 1);
