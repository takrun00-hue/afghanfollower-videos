import assert from "node:assert/strict";
import { dailyDeliveriesForDate } from "./lib/content.mjs";
import { AI_DAILY_IDS } from "./lib/features.mjs";

const deliveries = dailyDeliveriesForDate(new Date("2026-09-02T12:00:00Z"));

assert.equal(deliveries.length, 4, "three topics should create four platform files");
assert.deepEqual(deliveries.map((d) => d.slot), ["tiktok", "instagram", "ai-tiktok", "ai-instagram"]);
assert.equal(deliveries[2].pack.id, deliveries[3].pack.id, "AI formats should share one researched topic");
assert.ok(AI_DAILY_IDS.includes(deliveries[2].pack.id), "the third daily topic must be an AI workflow");
assert.notEqual(deliveries[2].pack.music, deliveries[3].pack.music, "AI formats need separate music/render assets");
assert.equal(deliveries[2].pack.platform, "tiktok");
assert.equal(deliveries[3].pack.platform, "instagram");
assert.equal(deliveries[3].mirrorOf, "ai-tiktok");

console.log("daily programme produces three topics and two native AI formats");
