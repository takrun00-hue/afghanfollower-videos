import assert from "node:assert/strict";
import { minimaxSpeakable } from "./lib/pronounce.mjs";
import { narrationFor } from "./lib/narration.mjs";

const sample = narrationFor("search-insights-real-ui");
const spoken = [sample.hook, ...sample.steps, sample.outro]
  .map(minimaxSpeakable)
  .join("\n");

// UI labels are genuine English. They must not become Persian transliterations
// or acquire an artificial pause while being prepared for the TTS engine.
assert.match(spoken, /Creator Search Insights/);
assert.match(spoken, /Content gap/);
assert.match(spoken, /Search analytics/);
assert.doesNotMatch(spoken, /کریتر|کانتنت گَپ|سرچ اَنالیتیکس/);

// Brand names and colloquial Persian remain natural, with no space introduced
// inside a spoken word.
assert.match(spoken, /تیک تاک/);
assert.equal(minimaxSpeakable("می‌خواهید سریع‌تر کار کنید."), "میخواین سریعتر کار کنین.");
assert.equal(minimaxSpeakable("می‌توانید این کار را انجام دهید."), "میتونین این کار را انجام دهید.");

console.log("Persian TTS copy keeps UI labels clear and Persian words connected");
