// Turn a script's validation errors into a Telegram reply.
//
// These scripts are reached from a Telegram menu: the bot asks for text, the
// person sends it, and a GitHub Actions step runs the script. When the text did
// not match the expected shape the script threw, which left the step red and the
// chat silent — from the phone it looked as though the bot had simply ignored
// the message, with nothing to say what to fix.
//
// The Persian messages those scripts already throw are good guidance. They only
// needed a way home.
import { loadEnv, telegramConfig, sendMessage } from "./telegram.mjs";

const isGuidance = (text) => /[؀-ۿ]/.test(text);

export function replyOnFailure() {
  const handle = async (err) => {
    const text = String((err && err.message) || err || "").trim();
    try {
      const tg = telegramConfig(loadEnv());
      if (tg.enabled) {
        await sendMessage({
          token: tg.token,
          chatId: tg.chatId,
          text: isGuidance(text) ? `⚠️ ${text}` : `⚠️ خطای غیرمنتظره در اجرا:\n<code>${text.slice(0, 300)}</code>`,
        });
      }
    } catch { /* the reply itself failing must not hide the original error */ }
    console.error(text);
    // A Persian message is guidance for the person, and the run did what it
    // could — exit clean so the chat carries the explanation. Anything else is a
    // real fault and stays red so it gets noticed rather than swallowed.
    process.exit(isGuidance(text) ? 0 : 1);
  };
  process.on("uncaughtException", handle);
  process.on("unhandledRejection", handle);
}
