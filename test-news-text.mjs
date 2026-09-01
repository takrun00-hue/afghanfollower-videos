// A pasted news article must become a draft, not a format complaint.
//
// Menu 15 asked for «تیتر | جمله ۱ | جمله ۲» and refused anything else. But an
// article is copied out of a news site in paragraphs, with no separators in it,
// and that is the normal way to use this command — so the normal input was the
// one input it rejected.
//
// The refusal was not even necessary. prepareNewsLocally() in the worker and
// news-build.mjs BOTH split plain sentences already; two splitters written for
// this exact text, neither of which could be reached, because the gate ran
// first. The article also ran past the 900-character payload cap, so passing
// the gate alone would still have dropped a third of it without a word.
//
//   node test-news-text.mjs
// The tutorial side had the same fault in a quieter form: prepareTopicLocally()
// kept the first 180 characters as the topic and appended five fixed sentences,
// so pasted steps were replaced by boilerplate with nothing said. Those cases
// live here too, because it is one rule — what the creator wrote is what gets
// used — and it has now been broken twice in two commands.
import { commandFromPending, prepareNewsLocally, prepareTopicLocally, videoAction } from "./worker/src/index.js";

// The article that was refused, as it was pasted — paragraphs, a source link
// in the middle, no separators anywhere.
const ARTICLE = `هامبورگ از آغاز سال جاری تاکنون ۱۸۰ مجرم محکوم‌شده را از آلمان اخراج کرده است که در میان آن‌ها سه مجرم اهل افغانستان نیز قرار دارند. در مجموع، بیش از هزار نفر از افرادی که موظف به ترک آلمان بوده‌اند، در این مدت از هامبورگ اخراج شده یا به‌صورت داوطلبانه از آلمان خارج شده‌اند. برخی از مجرمانی که بازگردانده شده‌اند، به دلیل جرایم سنگین و خشونت‌آمیز پیش‌تر خبرساز شده بودند.
بر اساس اطلاعات اداره امور داخله هامبورگ، بیش از هزار نفر که موظف به ترک آلمان بودند، از آغاز سال جاری تاکنون از هامبورگ خارج شده‌اند. از این میان، حدود ۳۰۰ نفر به کشورهای مبدأ و حدود ۱۳۰ نفر به کشورهای ثالث منتقل شده‌اند. حدود ۶۰۰ نفر نیز به‌صورت داوطلبانه و تحت نظارت هامبورگ را ترک کرده‌اند.
اداره امور داخله هامبورگ می‌گوید آمار امسال تاکنون کمی پایین‌تر از سال گذشته است.
به گزارش روزنامه آبندبلات هامبورگ (https://www.abendblatt.de/hamburg/politik/article412946689/koerperverletzung-und-totschlag-diese-gewalttaeter-wurden-aus-hamburg-abgeschoben-1.html)، در سال ۲۰۲۵، در مجموع ۱۷۷۴ نفر از هامبورگ اخراج یا به کشورهای دیگر منتقل شدند؛ رقمی که از سال ۲۰۱۶ تاکنون بی‌سابقه بوده است.`;

const CASES = [
  {
    name: "پاراگراف بدون |",
    input: ARTICLE,
    check(cmd) {
      if (cmd?.error) return `refused: ${cmd.error}`;
      if (!cmd?.payload) return "no payload";
      // The cap must not eat the article. Allow the trailing newline trim.
      if (cmd.payload.length < ARTICLE.trim().length - 5) {
        return `truncated to ${cmd.payload.length} of ${ARTICLE.trim().length}`;
      }
      const cards = prepareNewsLocally(cmd.payload).split("|").map((x) => x.trim()).filter(Boolean);
      if (cards.length < 3) return `only ${cards.length} cards`;
      if (/https?:/.test(cards.join(" "))) return "the source link was left in a card";
      if (cards.some((c) => c.length < 12)) return "an empty-looking card was produced";
      return null;
    },
  },
  {
    name: "قالب | همچنان کار می‌کند",
    input: "تیتر خبر | جملهٔ اول این خبر است | جملهٔ دوم این خبر است",
    check(cmd) {
      if (cmd?.error) return `refused: ${cmd.error}`;
      const cards = prepareNewsLocally(cmd.payload).split("|").map((x) => x.trim()).filter(Boolean);
      return cards.length === 3 ? null : `expected 3 cards, got ${cards.length}`;
    },
  },
  {
    name: "متن خیلی کوتاه رد می‌شود",
    input: "سلام",
    check(cmd) {
      return cmd?.error ? null : "a two-word message was accepted as a news story";
    },
  },
  {
    name: "آموزش خیلی کوتاه رد می‌شود",
    input: "سلام",
    action: "custom-content",
    check(cmd) {
      return cmd?.error ? null : "a one-word message was accepted as a tutorial";
    },
  },
  {
    name: "آموزش: گام شماره‌دار",
    input: "راه پیدا کردن موضوع ترند در تیک‌تاک ۱. بخش Search را باز کن ۲. عبارت Creator Search Insights را بنویس ۳. روی Content gap بزن",
    action: "custom-content",
    check(cmd) {
      if (cmd?.error) return `refused: ${cmd.error}`;
      const cards = prepareTopicLocally(cmd.payload).split("|").map((x) => x.trim());
      // The creator's own steps, not the scaffold.
      if (cards.length < 4) return `only ${cards.length} parts`;
      if (!cards[1].includes("Search")) return `step 1 is not the creator's: ${cards[1]}`;
      if (cards.some((c) => SCAFFOLD_MARK.test(c))) return "boilerplate replaced the pasted steps";
      return null;
    },
  },
  {
    name: "آموزش: پاراگراف ساده",
    input: "کانال پخش اینستاگرام چطور ساخته می‌شود. دایرکت را باز کن و روی آیکون مداد بزن. نام کانال را بنویس و بساز. لینک کانال را در استوری بگذار.",
    action: "custom-content",
    check(cmd) {
      if (cmd?.error) return `refused: ${cmd.error}`;
      const cards = prepareTopicLocally(cmd.payload).split("|").map((x) => x.trim());
      if (cards.length < 3) return `only ${cards.length} parts`;
      if (cards.some((c) => SCAFFOLD_MARK.test(c))) return "boilerplate replaced the pasted sentences";
      return null;
    },
  },
  {
    name: "موضوع خالی ساختار می‌گیرد",
    input: "درآمد از تیک‌تاک",
    action: "content-topic-preview",
    check(cmd) {
      if (cmd?.error) return `refused: ${cmd.error}`;
      const cards = prepareTopicLocally(cmd.payload).split("|").map((x) => x.trim());
      // Nothing of the creator's to use, so the scaffold is the right answer.
      if (!cards.some((c) => SCAFFOLD_MARK.test(c))) return "a bare topic got no structure at all";
      return cards[0] === "درآمد از تیک‌تاک" ? null : `topic was mangled: ${cards[0]}`;
    },
  },
  {
    name: "«محتوا:» متن آزاد را می‌پذیرد",
    raw: "محتوا: راه پیدا کردن موضوع ترند در تیک‌تاک ۱. Search را باز کن ۲. Content gap را بزن",
    check() {
      const a = videoAction("محتوا: راه پیدا کردن موضوع ترند در تیک‌تاک ۱. Search را باز کن ۲. Content gap را بزن");
      return a?.action === "custom-content" ? null : `routed to ${a?.action} instead of custom-content`;
    },
  },
];

// Any line from the fixed scaffold. Its presence beside pasted content means
// the creator's words were thrown away.
const SCAFFOLD_MARK = /هدف و مخاطب اصلی|نمونهٔ واقعی و قابل‌فهم|مرحله‌به‌مرحله توضیح دهید|جمع‌بندی کنید|نتیجهٔ ویدیوی شما را بهتر/;

let bad = 0;
for (const c of CASES) {
  const cmd = c.input === undefined ? null : commandFromPending({ action: c.action || "news-text-preview" }, c.input);
  const fail = c.check(cmd);
  if (fail) bad++;
  console.log(`${fail ? "  FAIL" : "  ok  "} ${c.name.padEnd(28)} ${fail || ""}`);
}

console.log("");
console.log(bad === 0
  ? `${CASES.length} inputs: a pasted article and a pasted tutorial both become drafts`
  : `${bad} of ${CASES.length} inputs are handled wrongly`);
process.exit(bad === 0 ? 0 : 1);
