import assert from "node:assert/strict";
import { buildInkHTML } from "./lib/build-ink.mjs";
import { packForFeature } from "./lib/content.mjs";

const pack = packForFeature("search-insights-real-ui", new Date("2026-09-02T00:00:00Z"));
const html = buildInkHTML(pack);

assert.match(html, /function worldIn\(art\)/);
assert.match(html, /scanline/);
assert.match(html, /clipPath:\"inset\(38% 0 38% 0\)\"/);
assert.doesNotMatch(html, /\.stage\",\{height:/);
const authoredScript = html.slice(html.lastIndexOf("<script>\nwindow.__timelines"));
assert.ok(authoredScript.length > 0, "authored timeline script should be present");
assert.doesNotMatch(authoredScript, /Math\.random/);
assert.match(html, /window\.__timelines\["main"\] = tl/);

console.log("motion builder uses content-specific, seek-safe choreography");
