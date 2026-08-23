import { readFileSync, writeFileSync } from "node:fs";

// The third video is the loanword-heavy one (tool names), which is where the
// engine drifts toward an Urdu colour. Two levers: say the tool names the way an
// Afghan speaker would, and prefer Dari word choices over Iranian ones.
let n = readFileSync("lib/narration.mjs", "utf8");
const DARI = [
  // tool names: spell them as they are actually said aloud here
  ["سایت ریموو دات بی جی را باز کنید.", "ویب‌سایت ریموو بی‌جی را باز کنید."],
  ["برنامهٔ رایگان آپ‌اسکیل را نصب کنید.", "برنامهٔ رایگان اپ‌سکیل را نصب کنید."],
  ["ویدیو را در کپ کات باز کنید.", "ویدیو را در کپ‌کات باز کنید."],
  // Dari-leaning wording
  ["عکس خود را بارگذاری کنید.", "عکس خود را آپلود کنید."],
  ["خروجی بگیرید. عکس واضح‌تر و بزرگ‌تر می‌شود.", "فایل را ذخیره کنید. عکس واضح‌تر و کلان‌تر می‌شود."],
  ["خروجی را در طراحی کاور خود استفاده کنید.", "از همین عکس در دیزاین کاور خود کار بگیرید."],
  ["حالت بزرگ‌نمایی را انتخاب کنید.", "حالت کلان‌نمایی را انتخاب کنید."],
  ["پس‌زمینه به صورت خودکار حذف می‌شود.", "پس‌منظر به شکل خودکار حذف می‌شود."],
  ["می‌خواهید پس‌زمینهٔ عکس را سریع پاک کنید؟", "می‌خواهید پس‌منظر عکس را زود پاک کنید؟"],
  ["عکس کم‌کیفیت را در آن باز کنید.", "عکس کم‌کیفیت را در آن باز کنید."],
];
let c = 0;
for (const [a, b] of DARI) if (n.includes(a)) { n = n.split(a).join(b); c++; }
writeFileSync("lib/narration.mjs", n);
console.log("Dari wording applied to", c, "lines");

// respellings tuned for how these are pronounced in Dari
let p = readFileSync("lib/pronounce.mjs", "utf8");
if (!p.includes("اپ‌سکیل")) {
  p = p.replace(
    '  ["پروفایل", "پُروفایْل"],',
    `  ["پروفایل", "پُروفایْل"],
  ["اپ‌سکیل", "اَپ سْکِیل"],
  ["ریموو بی‌جی", "ریمُوو بی جی"],
  ["کپ‌کات", "کَپ کات"],
  ["ویب‌سایت", "وِب سایت"],
  ["آپلود", "آپ لُود"],
  ["دیزاین", "دیزایْن"],
  ["کلان‌تر", "کَلان تَر"],
  ["کلان‌نمایی", "کَلان نُمایی"],
  ["پس‌منظر", "پَس مَنظَر"],`
  );
  // this rule is superseded by the pair above
  p = p.split('  ["آپ‌اسکیل", "آپ اِسکیل"],\n').join("");
  writeFileSync("lib/pronounce.mjs", p);
  console.log("Dari respellings added");
}
