// Edit and approve the currently reviewed German Insider story.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadEnv, telegramConfig, sendMessage } from "./lib/telegram.mjs";
import { replyOnFailure } from "./lib/fail-soft.mjs";

replyOnFailure();

process.chdir(dirname(fileURLToPath(import.meta.url)));
const FILE = ".news-draft.json";
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ""; };
const clean = (s, max = 760) => String(s || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function load() { if (!existsSync(FILE)) throw new Error("پیش‌نویس خبر وجود ندارد. ابتدا «خبر فوری» یا «خبر: ...» را بفرست."); return JSON.parse(readFileSync(FILE, "utf8")); }
function save(d) { writeFileSync(FILE, JSON.stringify(d, null, 2) + "\n"); }
async function preview(d) {
  const text = `📰 <b>پیش‌نویس خبر</b>\n\n<b>قلاب:</b> ${esc(d.hook)}\n\n` +
    (d.body || []).slice(0, 4).map((x, i) => `${i + 1}. ${esc(x)}`).join("\n") +
    `\n\n✅ ساخت با صدا: <code>تأیید خبر</code>` +
    `\n✏️ تغییر قلاب: <code>ادیت قلاب خبر: متن تازه</code>` +
    `\n📝 تغییر متن: <code>ادیت متن خبر: جمله۱ | جمله۲ | جمله۳</code>`;
  const env = loadEnv(), tg = telegramConfig(env);
  if (tg.enabled && process.env.NO_TELEGRAM !== "1") await sendMessage({ token: tg.token, chatId: tg.chatId, text, disablePreview: true }); else console.log(text);
}
if (args[0] === "--edit-hook") {
  const d = load(), hook = clean(arg("--edit-hook"), 180); if (!hook) throw new Error("قلاب خبر خالی است.");
  d.hook = hook; d.updatedAt = new Date().toISOString(); save(d); await preview(d);
} else if (args[0] === "--edit-text") {
  const d = load(), body = clean(arg("--edit-text")).split("|").map((x) => clean(x, 180)).filter(Boolean).slice(0, 6);
  if (!body.length) throw new Error("متن خبر خالی است."); d.body = body; d.updatedAt = new Date().toISOString(); save(d); await preview(d);
} else if (args[0] === "--preview") {
  await preview(load());
} else if (args[0] === "--build") {
  const d = load();
  const result = spawnSync("node", ["news-build.mjs", "--text", [d.headline, ...(d.body || [])].join(" | "), "--source", d.source || "", "--hook", d.hook || ""], { stdio: "inherit", env: process.env });
  process.exit(result.status ?? 1);
} else throw new Error("دستور خبر ناشناخته است.");
