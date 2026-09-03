import assert from "node:assert/strict";
import { reviewViralReadiness } from "./lib/viral-readiness.mjs";
import { evaluate } from "./lib/selection-gate.mjs";
import { translateToPersian } from "./lib/translate-fa.mjs";

const strong = reviewViralReadiness({
  hook: "مخاطب در ثانیهٔ اول می‌رود؛ نقطهٔ افت را پیدا کن",
  tips: ["Insights را باز کن", "نقطهٔ افت را بررسی کن", "شروع ویدیو را تست کن"],
  outroAsk: "مخاطب تو بیشتر در کدام ثانیه می‌رود؟",
  source: "https://support.tiktok.com/",
});
assert.equal(strong.status, "ready");

const overclaim = reviewViralReadiness({
  hook: "حتماً وایرال شو و ویو را چند برابر کن",
  tips: ["یک کار انجام بده", "کار بعدی را انجام بده"],
  outroAsk: "لایک و فالو کن",
});
assert.equal(overclaim.status, "blocked");
assert.ok(overclaim.blockers.length > 0);

const inventedRetention = reviewViralReadiness({
  hook: "چرا بعضی ویدیوها را کسانی که زبانت را نمی‌دانند هم تا آخر تماشا می‌کنند؟",
  tips: ["ویدیو را آماده کن", "تنظیمات را باز کن", "زبان را انتخاب کن"],
  outroAsk: "ویدیوی بی‌صدا را چطور قابل‌فهم می‌کنی؟",
  source: "https://support.tiktok.com/",
});
assert.equal(inventedRetention.status, "blocked");
assert.ok(inventedRetention.blockers.some((item) => item.includes("Retention")));

const publicFeature = {
  topic: "راه عملی برای بهتر دیده‌شدن محتوا",
  question: "چطور مخاطب تازه پیدا کنی؟",
  keyPoints: ["مسیر واقعی را باز کن", "نتیجه را بررسی کن"],
  demandPhrases: [{ text: "چطور مخاطب تازه پیدا کنم" }],
  sourceDate: new Date().toISOString(),
  sources: ["https://support.tiktok.com/example"],
};
assert.equal(evaluate(publicFeature).decision, "APPROVE");
const inviteOnly = evaluate({
  ...publicFeature,
  topic: "Instagram Bonuses فقط با دعوت فعال می‌شود",
  keyPoints: [...publicFeature.keyPoints, "Invite-only"],
});
assert.equal(inviteOnly.decision, "REJECT");
assert.ok(inviteOnly.failures.includes("قابلیت برای بیشتر مخاطبان قابل‌استفاده نیست"));

const realFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url) => {
  calls.push(String(url));
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '[{"index":0,"title":"عنوان فارسی","excerpt":"متن فارسی"}]' }] } }] }) };
};
try {
  const translated = await translateToPersian([{ title: "English title", text: "English source text" }], { geminiKey: "test-gemini" });
  assert.match(calls[0], /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-flash-lite-latest:generateContent$/);
  assert.equal(translated[0].title, "عنوان فارسی");
} finally {
  globalThis.fetch = realFetch;
}

console.log("viral-readiness blocks guarantees/unavailable topics; Gemini Persian translation resolves");
