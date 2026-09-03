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
//   · a bare sentence         — becomes a draft only when the workflow supplies
//     its Grok key; without that key it must fail clearly and must not write a
//     draft. This keeps the local/offline path deterministic and honest.
//
//   node test-custom-draft.mjs
import { existsSync, readFileSync, rmSync, writeFileSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const DRAFT = ".content-draft.json";
const saved = existsSync(DRAFT) ? readFileSync(DRAFT, "utf8") : null;

function run(text, { noGemini = false } = {}) {
  rmSync(DRAFT, { force: true });
  // custom-draft.mjs's own loadEnv() reads .env straight off disk and lets it
  // win over whatever this subprocess's env carries — a real key sitting in
  // .env (correctly, for normal local use) can't be hidden by clearing
  // GEMINI_API_KEY/GOOGLE_API_KEY from `env:` below. To genuinely exercise
  // the no-key path, .env is moved aside for the duration of this one call.
  const ENV_FILE = ".env", ENV_BAK = ".env.test-custom-draft.bak";
  const hadEnv = noGemini && existsSync(ENV_FILE);
  if (hadEnv) renameSync(ENV_FILE, ENV_BAK);
  let r;
  try {
    r = spawnSync(process.execPath, ["custom-draft.mjs", text], {
      encoding: "utf8",
      env: noGemini
        ? { ...process.env, NO_TELEGRAM: "1", GEMINI_API_KEY: "", GOOGLE_API_KEY: "" }
        : { ...process.env, NO_TELEGRAM: "1" },
    });
  } finally {
    if (hadEnv) renameSync(ENV_BAK, ENV_FILE);
  }
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

// 5) Offline/no-key fallback. Cloud execution supplies GEMINI_API_KEY for
// this shape; local execution must not pretend it drafted a topic without it.
{
  const r = run("محتوا: چگونه با یک ویدیوی کوتاه، مشتری مناسب برای خدماتت جذب کنی؟".replace(/^محتوا:\s*/, ""), { noGemini: true });
  check("موضوع خام: هیچ پیش‌نویسی ساخته نمی‌شود", r.draft === null, r.draft ? "یک پیش‌نویس ساخته شد — این نادرست است" : "");
  // Names the actual missing secret (GEMINI_API_KEY), not just "try a
  // different format" — a creator can't fix a key nobody set, and the old
  // wording hid that from the one person who could (the owner).
  check("  و خطا مشخص و راهنماست، نه پیام عمومی", /GEMINI_API_KEY/.test(r.out) && /عنوان \| قلاب \| گام/.test(r.out) && /شماره‌گذاری‌شده/.test(r.out));
  check("  و فرآیند سالم خارج می‌شود (پیام رفت، نه کرش)", r.status === 0, `exit ${r.status}`);
}

if (saved !== null) writeFileSync(DRAFT, saved); else rmSync(DRAFT, { force: true });

console.log("");
console.log(bad === 0 ? "custom-draft.mjs handles structured input and safely refuses a bare topic without the cloud drafting key" : `${bad} check(s) failed`);
process.exit(bad === 0 ? 0 : 1);
