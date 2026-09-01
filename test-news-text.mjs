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
import { commandFromPending, prepareNewsLocally } from "./worker/src/index.js";

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
    name: "آموزش هنوز | لازم دارد",
    input: "یک موضوع بدون هیچ جداکننده",
    action: "custom-content",
    check(cmd) {
      return cmd?.error ? null : "custom-content accepted steps it cannot separate";
    },
  },
];

let bad = 0;
for (const c of CASES) {
  const cmd = commandFromPending({ action: c.action || "news-text-preview" }, c.input);
  const fail = c.check(cmd);
  if (fail) bad++;
  console.log(`${fail ? "  FAIL" : "  ok  "} ${c.name.padEnd(28)} ${fail || ""}`);
}

console.log("");
console.log(bad === 0
  ? `${CASES.length} inputs: a pasted article becomes a draft, a tutorial still asks for steps`
  : `${bad} of ${CASES.length} inputs are handled wrongly`);
process.exit(bad === 0 ? 0 : 1);
