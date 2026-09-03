// Refuse a proposed topic so it is never offered again.
//
// «رد موضوع ۲» from Telegram lands here. The number refers to the list that was
// just sent, so it resolves against the saved copy of that list — re-deriving
// the ranking would refuse whatever happens to sit second today, which is a
// different topic than the one the operator was looking at.
//
//   node reject-topic.mjs 2                 # by position in the last proposal
//   node reject-topic.mjs saved-replies     # by id
//   node reject-topic.mjs --undo photopea
//   node reject-topic.mjs --list
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { rejectTopic, unrejectTopic, rejectedList, recordProposed } from "./lib/proposed.mjs";
import { featureById } from "./lib/features.mjs";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const env = loadEnv();
const tg = telegramConfig(env);
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const say = async (t) => {
  if (tg.enabled && process.env.NO_TELEGRAM !== "1") {
    await sendMessage({ token: tg.token, chatId: tg.chatId, text: t });
  }
  console.log(t.replace(/<[^>]*>/g, ""));
};

const OFFERED = ".topic-offered.json";
const lastOffer = () => {
  try {
    return existsSync(OFFERED) ? JSON.parse(readFileSync(OFFERED, "utf8")) : [];
  } catch {
    return [];
  }
};

const nameOf = (id) => {
  const hit = featureById(id);
  return hit ? (hit.feature?.name || hit.feature?.id || id) : id;
};

// Rule 12: rejecting a content-search topic proposes one replacement right
// away rather than leaving a hole in the list. Only content-search's own
// offers carry a backlog of already-gated spares (id "search-…"); catalogue
// topics from topic-plan.mjs have no such reserve and get none.
const SEARCH_OFFERED = ".content-search-offered.json";
const BACKLOG = ".content-search-backlog.json";
const readJSON = (p, d) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d; } catch { return d; } };

function proposeReplacement(position) {
  const offered = readJSON(SEARCH_OFFERED, []);
  const backlog = readJSON(BACKLOG, []);
  if (!offered.length || !backlog.length) return null;
  const next = backlog.shift();
  const updated = offered.map((c) => (c.n === position ? { ...next, n: position } : c));
  writeFileSync(SEARCH_OFFERED, JSON.stringify(updated, null, 2) + "\n");
  writeFileSync(BACKLOG, JSON.stringify(backlog, null, 2) + "\n");
  writeFileSync(OFFERED, JSON.stringify(updated.map((c) => ({ n: c.n, id: c.id, platform: c.host, hook: c.title })), null, 2) + "\n");
  recordProposed([next.id]);
  return next;
}

if (args.includes("--list")) {
  const rows = rejectedList();
  await say(rows.length
    ? "🚫 <b>موضوع‌های رد شده</b>\n\n" + rows.map((r) => `• ${nameOf(r.id)} — <code>${r.id}</code>`).join("\n")
    + "\n\nبرای برگرداندن: <code>برگردان &lt;نام&gt;</code>"
    : "هیچ موضوعی رد نشده است.");
  process.exit(0);
}

const undo = args.includes("--undo");
const raw = args.find((a) => !a.startsWith("--")) || "";
if (!raw) {
  await say("شمارهٔ موضوع یا نامش را بفرست: <code>رد موضوع ۲</code>");
  process.exit(1);
}

// A bare number means "the Nth of the list you just sent me".
const digits = String(raw).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const asNumber = Number(digits);
let id = raw;
let position = null;
if (Number.isFinite(asNumber) && asNumber > 0 && /^[۰-۹0-9]{1,2}$/.test(String(raw).trim())) {
  const offered = lastOffer();
  const hit = offered[asNumber - 1];
  if (!hit) {
    await say(`❌ موضوع شمارهٔ ${asNumber} در آخرین فهرست نیست. نامش را بفرست.`);
    process.exit(1);
  }
  id = hit.id;
  position = asNumber;
}

if (undo) {
  await say(unrejectTopic(id)
    ? `↩️ <b>${nameOf(id)}</b> دوباره به فهرست برگشت.`
    : `این موضوع رد نشده بود: <code>${id}</code>`);
  process.exit(0);
}

const removed = rejectTopic(id);
if (!removed) {
  await say(`این موضوع از قبل رد شده بود: <code>${id}</code>`);
  process.exit(0);
}

const replacement = position && String(id).startsWith("search-") ? proposeReplacement(position) : null;
await say(
  `🚫 <b>${nameOf(id)}</b> رد شد و دیگر پیشنهاد نمی‌شود.\n<code>${id}</code>\n\nبرای برگرداندن: <code>برگردان ${id}</code>` +
  (replacement
    ? `\n\n<b>جایگزین موضوع ${position}:</b>\n📌 ${esc(replacement.title)}\n<a href="${esc(replacement.url)}">منبع</a>\nبرای انتخاب: <code>${position}</code>`
    : position ? "\n\nجایگزینی برای این جایگاه در دسترس نیست؛ برای موضوع تازه: <code>جستجوی محتوا</code>" : "")
);
