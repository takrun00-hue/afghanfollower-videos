import assert from "node:assert/strict";
import { reviewViralReadiness } from "./lib/viral-readiness.mjs";

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

console.log("viral-readiness review handles truthful hooks and blocks guarantees");
