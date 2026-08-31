// Every Telegram command that ends in a rendered video, checked at the step
// that actually broke: can the narration for the id that command produces be
// resolved?
//
// The CI failure was not in the renderer. content-draft.mjs mints a `draft-…`
// id and writes it into custom-current.mjs; narrationFor only read that file
// for ids beginning `custom-`, returned null, and REQUIRE_VOICE=on turned a
// naming mismatch into "Narration did not render". Nothing exercised the join
// between the two, so nothing caught it.
//
//   node test-telegram-paths.mjs
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { narrationFor } from "./lib/narration.mjs";
import { packsForDate, packForFeature } from "./lib/content.mjs";

const GENERATED = "lib/generated/custom-current.mjs";
const saved = existsSync(GENERATED) ? readFileSync(GENERATED, "utf8") : null;
const writeGenerated = (item) => {
  mkdirSync("lib/generated", { recursive: true });
  writeFileSync(GENERATED, `export const CURRENT_CUSTOM = ${JSON.stringify(item, null, 2)};\n`);
};

const rows = [];

// «تایید <id>» → approve-feature.mjs → daily-render --feature <id>
rows.push(["approved-feature", "pin-comment", () => narrationFor("pin-comment")]);

// «تأیید محتوا» → content-draft.mjs --build. The id is a hash of the draft, and
// the lines come from the file that build writes moments earlier.
rows.push(["content-approve", "draft-…", () => {
  const draft = { kind: "tutorial", featureId: "pin-comment", hook: "قلاب", steps: null, updatedAt: "fixed" };
  const id = `draft-${createHash("sha256").update(JSON.stringify(draft)).digest("hex").slice(0, 12)}`;
  const base = packForFeature(draft.featureId, new Date());
  writeGenerated({
    id, category: base.platform, hook: { ...base.hook, ask: draft.hook },
    payoff: base.payoff, steps: base.tips.map((t) => ({ text: t.head })),
  });
  return narrationFor(id);
}]);

// «محتوا: …» → custom-content.mjs
rows.push(["custom-content", "custom-…", () => {
  const raw = "قلاب|گام یک|گام دو";
  const id = `custom-${createHash("sha256").update(raw).digest("hex").slice(0, 10)}`;
  writeGenerated({ id, category: "tiktok", hook: { ask: "قلاب" }, steps: [{ text: "گام یک" }], payoff: "نتیجه" });
  return narrationFor(id);
}]);

// «بساز» / «فردا» → daily-render over the day's rotation
for (const [slot, pack] of Object.entries(packsForDate(new Date()))) {
  if (pack?.id) rows.push([`build-${slot}`, pack.id, () => narrationFor(pack.id)]);
}

// A stale generated file must not be mistaken for a resolved one.
rows.push(["stale file is rejected", "draft-NOTTHISONE", () => {
  writeGenerated({ id: "draft-SOMETHINGELSE", hook: { ask: "x" }, steps: [] });
  return narrationFor("draft-NOTTHISONE") ? null : { steps: [], sentinel: true };
}]);

let bad = 0;
for (const [action, id, run] of rows) {
  let vo = null;
  try { vo = run(); } catch (e) { vo = null; }
  const ok = !!vo;
  if (!ok) bad++;
  const detail = ok ? (vo.sentinel ? "correctly refused" : `${2 + vo.steps.length} lines`) : "narration NULL — the build would abort";
  console.log(`${ok ? "  ok  " : "  FAIL"} ${action.padEnd(24)} ${String(id).padEnd(22)} ${detail}`);
}

if (saved !== null) writeFileSync(GENERATED, saved);
console.log("");
console.log(bad === 0 ? `${rows.length} Telegram build paths, all resolve` : `${bad} of ${rows.length} would fail`);
process.exit(bad === 0 ? 0 : 1);
