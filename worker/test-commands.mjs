// Cloudflare Worker command contract. This is deliberately separate from the
// local-PC bot test: the phone uses worker/src/index.js, so it needs its own
// regression test for the exact commands the creator actually types.
import assert from "node:assert/strict";
import { menuCode, videoAction, commandFromPending, acknowledgementFor } from "./src/index.js";

assert.equal(videoAction("تیک تاک بساز").action, "plan-tiktok");
assert.equal(videoAction("انستا بساز").action, "plan-instagram");
assert.equal(videoAction("بساز").action, "plan-today");
assert.equal(videoAction("تأیید محتوا").action, "content-approve");
assert.equal(videoAction("تأیید خبر").action, "news-approve-draft");
assert.equal(videoAction("محتوا: یک موضوع واقعی با سه گام کامل برای ویدیوی آموزشی").action, "content-topic-preview");
assert.equal(menuCode("۶"), "6");
assert.equal(commandFromPending({ action: "content-edit-hook" }, "قلاب تازه و روشن").action, "content-edit-hook");
assert.match(acknowledgementFor({ action: "plan-tiktok" }), /هنوز ساخته نمی‌شود/);
assert.match(acknowledgementFor({ action: "content-approve" }), /ساخت واقعی/);

console.log("cloud Telegram command contract holds");
