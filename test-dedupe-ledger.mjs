import assert from "node:assert/strict";
import { check, history } from "./lib/dedupe.mjs";
import { featureById } from "./lib/features.mjs";

// The real reported duplicate: playlists was sent twice on 2026-09-11. A
// fresh candidate with that id must be rejected before any paid TTS/render.
assert.ok(history(Infinity).length > 0, "editorial history must not be empty");
const verdict = check({ id: "playlists", feature: "playlists", topic: "playlists", question: "", keyPoints: [] });
assert.equal(verdict.verdict, "DUPLICATE");
console.log("complete delivery ledger blocks an already-published feature");

// A correction is not a new editorial subject.  Its known feature id must
// resolve even when a transport layer leaves harmless whitespace around it.
assert.equal(featureById("  tts-voice \r\n")?.feature.id, "tts-voice");
console.log("correction feature ids tolerate transport whitespace");
