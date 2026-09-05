// Cloudflare Worker command contract. This is deliberately separate from the
// local-PC bot test: the phone uses worker/src/index.js, so it needs its own
// regression test for the exact commands the creator actually types.
import assert from "node:assert/strict";
import worker, { NUMBERED_ACTIONS, menuCode, videoAction, commandFromPending, acknowledgementFor, bareTopicPick } from "./src/index.js";

assert.equal(videoAction("تیک تاک بساز").action, "plan-tiktok");
assert.equal(videoAction("انستا بساز").action, "plan-instagram");
assert.equal(videoAction("بساز").action, "plan-today");
assert.equal(videoAction("تأیید محتوا").action, "content-approve");
assert.equal(videoAction("تأیید خبر").action, "news-approve-draft");
assert.equal(videoAction("محتوا: یک موضوع واقعی با سه گام کامل برای ویدیوی آموزشی").action, "content-topic-preview");
assert.equal(videoAction("ویدیو مستقیم: یک موضوع واقعی با سه گام کامل برای ویدیوی آموزشی").action, "custom-content-media");
assert.equal(menuCode("۱"), "1");
assert.equal(NUMBERED_ACTIONS["1"].action, "content-search");
assert.equal(NUMBERED_ACTIONS["2"].pending, "content-search-live");
assert.equal(NUMBERED_ACTIONS["3"].pending, "content-topic-preview");
assert.equal(NUMBERED_ACTIONS["4"].action, "content-preview");
assert.equal(NUMBERED_ACTIONS["5"].pending, "content-edit-hook");
assert.equal(NUMBERED_ACTIONS["6"].pending, "content-edit-steps");
assert.equal(NUMBERED_ACTIONS["7"].action, "content-approve");
assert.equal(NUMBERED_ACTIONS["8"].action, "content-radar");
assert.equal(NUMBERED_ACTIONS["9"].pending, "demand-research");
assert.equal(NUMBERED_ACTIONS["10"].action, "voice-list");
assert.equal(NUMBERED_ACTIONS["26"].pending, "custom-content-media");
assert.equal(menuCode("۶"), "6");
assert.equal(commandFromPending({ action: "content-edit-hook" }, "قلاب تازه و روشن").action, "content-edit-hook");
assert.equal(commandFromPending({ action: "custom-content-media" }, "یک موضوع کامل | گام یک | گام دو").action, "custom-content-media");
assert.match(commandFromPending({ action: "custom-content-media" }, "خیلی کوتاه").error, /خیلی کوتاه/);
assert.match(acknowledgementFor({ action: "plan-tiktok" }), /هنوز ساخته نمی‌شود/);
assert.match(acknowledgementFor({ action: "content-approve" }), /ساخت واقعی/);

// Rule 12 (2026-09-03 content-search spec): «جستجوی محتوا» and «جستجوی جدید: X»
// already existed as direct phrase matches; "موضوع: متن من" is the new alias
// onto the same content-topic-preview path «محتوا:» already uses.
assert.equal(videoAction("جستجوی محتوا").action, "content-search");
assert.equal(videoAction("جستجوی جدید: درآمد از تیک‌تاک").action, "content-search-live");
assert.equal(videoAction("موضوع: چطور از قابلیت تازهٔ اینستاگرام مشتری جذب کنیم").action, "content-topic-preview");
assert.equal(videoAction("رد ۲").action, "topic-reject");

// A bare "۱".."۵" is ambiguous with the fixed numbered menu (NUMBERED_ACTIONS)
// and must only resolve to picking a content-search topic when that list is
// the one currently active — never merely because a digit was sent.
assert.equal(bareTopicPick("3", "search").action, "search-topic-pick");
assert.equal(bareTopicPick("3", "search").pick, "3");
assert.equal(bareTopicPick("۴", "search").pick, "4");
assert.equal(bareTopicPick("3", null), null);
assert.equal(bareTopicPick("3", "news"), null);
assert.equal(bareTopicPick("6", "search"), null); // only 1-5 are offered topics
assert.match(acknowledgementFor({ action: "search-topic-pick" }), /هنوز ساخته نمی‌شود/);

// A captioned Telegram video must use the same direct-build path as a photo.
// This is an in-memory Worker request: no message or workflow is sent outside
// the test process.
const savedFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  if (String(url).includes("api.github.com/")) return new Response(null, { status: 204 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
const response = await worker.fetch(new Request("https://worker.test/", {
  method: "POST",
  body: JSON.stringify({ message: {
    chat: { id: 7 },
    caption: "یک موضوع واقعی | گام یک | گام دو | گام سه",
    video: { file_id: "telegram-video-id" },
  } }),
}), { ALLOWED_CHAT_ID: "7", TELEGRAM_BOT_TOKEN: "test", GITHUB_TOKEN: "test" });
globalThis.fetch = savedFetch;
assert.equal(response.status, 200);
const dispatch = calls.find((c) => c.url.includes("api.github.com/"));
assert.ok(dispatch, `captioned video dispatches the workflow; observed ${calls.map((c) => c.url).join(", ")}`);
const inputs = JSON.parse(dispatch.init.body).inputs;
assert.equal(inputs.action, "custom-content-media");
assert.equal(JSON.parse(inputs.payload).videoFileId, "telegram-video-id");

console.log("cloud Telegram command contract holds");
