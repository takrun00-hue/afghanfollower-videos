import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { generateLocalFallbackImage } from "./lib/auto-image.mjs";
import { imageSize, imageType } from "./lib/media-guard.mjs";

const asset = generateLocalFallbackImage("آموزش رشد ویدیو", "نمودار ماندگاری ویدیو را بررسی کن");
try {
  assert.equal(asset.sourceType, "generated-fallback");
  assert.match(asset.sourceUrl, /^generated-fallback:/);
  assert.ok(existsSync(asset.photo), "local fallback must create an actual image file");
  assert.equal(imageType(asset.photo), "svg", "fallback must be valid SVG image data");
  assert.deepEqual(imageSize(asset.photo), { width: 1080, height: 1440 });
  console.log("local generated image fallback is a valid vertical visual asset");
} finally {
  rmSync(asset.photo, { force: true });
}
