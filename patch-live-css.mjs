import { readFileSync, writeFileSync } from "node:fs";
let b = readFileSync("lib/build-ink.mjs", "utf8");

// A past patch inlined a SNAPSHOT of UI_CSS into this file, so later edits to
// ui-mock.mjs silently never reached the output. Reference the live export.
const start = b.indexOf("/* ---------- in-app UI mockups ---------- */");
const end = b.indexOf("/* --- step scene --- */");
if (start < 0 || end < 0) throw new Error("anchors not found");
if (b.slice(start, end).includes("${UI_CSS}")) {
  console.log("already live");
} else {
  b = b.slice(0, start) + "${UI_CSS}\n" + b.slice(end);
  writeFileSync("lib/build-ink.mjs", b);
  console.log("build-ink now uses the live UI_CSS");
}
