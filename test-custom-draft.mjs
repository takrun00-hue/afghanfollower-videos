// custom-draft.mjs is what "محتوا: …" actually runs. By the time it sees the
// text, GitHub Actions' own "Read commands" step has already collapsed every
// real newline to a space (`tr '\r\n' ' '`, telegram.yml) — so a message the
// creator typed as separate lines is byte-for-byte the same as one typed as a
// single line once it gets here. Only "|" and numbered markers survive that.
//
// This checks the three real shapes plus the one that has no shape at all:
//   · title|hook|steps       — unchanged, explicit control
//   · hook|step               — the same separator, shorter
//   · lead line + ۱./۲./… steps — the only structural cue that survives the
//     newline flattening; this is what "خط‌به‌خط" actually has to mean now
//   · a bare sentence         — genuinely unsupported (no content-drafting AI
//     key exists anywhere in this project) and must fail with a specific,
//     actionable message, not the old generic one, and must not write a draft
//
//   node test-custom-draft.mjs
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const DRAFT = ".content-draft.json";
const saved = existsSync(DRAFT) ? readFileSync(DRAFT, "utf8") : null;

function run(text) {
  rmSync(DRAFT, { force: true });
  const r = spawnSync(process.execPath, ["custom-draft.mjs", text], {
    encoding: "utf8",
    env: { ...process.env, NO_TELEGRAM: "1" },
  });
  const draft = existsSync(DRAFT) ? JSON.parse(readFileSync(DRAFT, "utf8")) : null;
  return { status: r.status, out: (r.stdout || "") + (r.stderr || ""), draft };
}

let bad = 0;
const check = (label, cond, detail) => {
  console.log(`${cond ? "  ok  " : "  FAIL"} ${label.padEnd(38)} ${detail || ""}`);
  if (!cond) bad++;
};

// 1) full pipe format — unchanged behaviour
{
  const r = run("تیک تاک: ترفند رشد|چطور در ۳۰ روز رشد کنی؟|هر روز پست کن|تحلیل کن");
  check("عنوان | قلاب | گام‌ها", r.draft?.generated?.hook?.ask === "چطور در ۳۰ روز رشد کنی؟", `hook: ${r.draft?.generated?.hook?.ask}`);
  check("  و گام‌ها را می‌گیرد", r.draft?.generated?.tips?.length === 2);
}

// 2) two-part pipe: hook|step, no title
{
  const r = run("چطور مشتری جذب کنی؟|یک نمونهٔ واقعی نشان بده");
  check("قلاب | یک گام", r.draft?.generated?.hook?.ask === "چطور مشتری جذب کنی؟" && r.draft?.generated?.tips?.length === 1);
}

// 3) the shape that actually survives Telegram → GitHub Actions today: a lead
// line the creator wrote, followed by numbered steps, all on one flattened line
{
  const topic = "چگونه با یک ویدیوی کوتاه، مشتری مناسب برای خدماتت جذب کنی؟";
  const flattened = `${topic} ۱. یک نمونهٔ واقعی از قبل و بعد نشان بده ۲. یک پیشنهاد مشخص و قیمت را در همان ویدیو بگو ۳. زیر ویدیو از مخاطب بخواه کامنت بگذارد`;
  const r = run(flattened);
  check("لید + گام‌های شماره‌گذاری‌شده", r.status === 0 && !!r.draft, `exit ${r.status}`);
  check("  لیدِ پیش از ۱. همان قلاب می‌شود", r.draft?.generated?.hook?.ask === topic, r.draft?.generated?.hook?.ask);
  check("  هر سه گام را جدا می‌کند", r.draft?.generated?.tips?.length === 3, `${r.draft?.generated?.tips?.length} تا`);
  check("  متنِ گام‌ها شمارهٔ خودشان را حمل نمی‌کند", !/^[0-9۰-۹]/.test(r.draft?.generated?.tips?.[0]?.head || ""), r.draft?.generated?.tips?.[0]?.head);
}

// 4) numbered list with nothing before the first marker — the first step
// doubles as the hook rather than being silently dropped
{
  const r = run("۱. یک نمونهٔ واقعی نشان بده ۲. دعوت به کامنت بگذار");
  check("بدون لید: گام اول قلاب هم می‌شود", r.draft?.generated?.hook?.ask === "یک نمونهٔ واقعی نشان بده" && r.draft?.generated?.tips?.length === 2);
}

// 5) the exact assignment topic, sent exactly as a real creator would type it
// in Telegram — no pipes, no numbers. This has no structural boundary for a
// hook vs. a step, and nothing in this project drafts one from free text.
{
  const r = run("محتوا: چگونه با یک ویدیوی کوتاه، مشتری مناسب برای خدماتت جذب کنی؟".replace(/^محتوا:\s*/, ""));
  check("موضوع خام: هیچ پیش‌نویسی ساخته نمی‌شود", r.draft === null, r.draft ? "یک پیش‌نویس ساخته شد — این نادرست است" : "");
  check("  و خطا مشخص و راهنماست، نه پیام عمومی", /هوش مصنوعی.*تنظیم نشده/.test(r.out) && /عنوان \| قلاب \| گام/.test(r.out) && /شماره‌گذاری‌شده/.test(r.out));
  check("  و فرآیند سالم خارج می‌شود (پیام رفت، نه کرش)", r.status === 0, `exit ${r.status}`);
}

if (saved !== null) writeFileSync(DRAFT, saved); else rmSync(DRAFT, { force: true });

console.log("");
console.log(bad === 0 ? "custom-draft.mjs handles all three real input shapes, and refuses a bare topic clearly" : `${bad} check(s) failed`);
process.exit(bad === 0 ? 0 : 1);
