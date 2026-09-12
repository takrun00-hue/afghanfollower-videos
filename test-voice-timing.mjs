import assert from "node:assert/strict";
import { assertVoiceSchedule } from "./lib/voice-timing.mjs";

assert.doesNotThrow(() => assertVoiceSchedule([
  { at: 0.3, duration: 1.4 },
  { at: 2.2, duration: 1.5 },
  { at: 4.3, duration: 1.1 },
], 6.4));

assert.throws(() => assertVoiceSchedule([
  { at: 0.3, duration: 2.1 },
  { at: 2.2, duration: 1.0 },
], 5), /next scene/);

try {
  assertVoiceSchedule([{ at: 0.3, duration: 2.1 }, { at: 2.2, duration: 1 }], 5);
} catch (error) {
  assert.deepEqual(error.voiceTiming, { line: 1, reason: "crosses-next-scene", start: 0.3, duration: 2.1, limit: 2.08 });
}

assert.throws(() => assertVoiceSchedule([
  { at: 0.3, duration: 1.0 },
  { at: 3.8, duration: 1.0 },
], 4.9), /end of the video/);

console.log("measured narration is blocked before it can overlap or be cut off");
