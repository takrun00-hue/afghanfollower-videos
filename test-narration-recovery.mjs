import assert from "node:assert/strict";
import { recoverSpokenLine } from "./lib/narration-recovery.mjs";

const repaired = recoverSpokenLine("روی ویدیو نریشن بگذارید", 3);
assert.equal(repaired.changed, true);
assert.equal(repaired.text, "روی ویدیو صدای خودکار بگذارید");

const preview = recoverSpokenLine("Preview را بررسی کنید", 1);
assert.equal(preview.changed, true);
assert.equal(preview.text, "پیش نمایش را بررسی کنید");

const unknown = recoverSpokenLine("این واژه ناشناخته است", 2);
assert.equal(unknown.changed, false);
assert.equal(unknown.reason, "no-safe-rewrite");

console.log("narration recovery stays bounded, word-specific, and meaning-preserving");
