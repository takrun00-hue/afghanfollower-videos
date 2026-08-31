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
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { rejectTopic, unrejectTopic, rejectedList } from "./lib/proposed.mjs";
import { featureById } from "./lib/features.mjs";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const env = loadEnv();
const tg = telegramConfig(env);
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
if (Number.isFinite(asNumber) && asNumber > 0 && /^[۰-۹0-9]{1,2}$/.test(String(raw).trim())) {
  const offered = lastOffer();
  const hit = offered[asNumber - 1];
  if (!hit) {
    await say(`❌ موضوع شمارهٔ ${asNumber} در آخرین فهرست نیست. نامش را بفرست.`);
    process.exit(1);
  }
  id = hit.id;
}

if (undo) {
  await say(unrejectTopic(id)
    ? `↩️ <b>${nameOf(id)}</b> دوباره به فهرست برگشت.`
    : `این موضوع رد نشده بود: <code>${id}</code>`);
  process.exit(0);
}

await say(rejectTopic(id)
  ? `🚫 <b>${nameOf(id)}</b> رد شد و دیگر پیشنهاد نمی‌شود.\n<code>${id}</code>\n\nبرای برگرداندن: <code>برگردان ${id}</code>`
  : `این موضوع از قبل رد شده بود: <code>${id}</code>`);
