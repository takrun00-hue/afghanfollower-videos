import { readFileSync, writeFileSync } from "node:fs";

// ---- build-ink: honour per-scene durations coming from the narration ----
let b = readFileSync("lib/build-ink.mjs", "utf8");
if (!b.includes("tipDurations")) {
  b = b.replace(
    "  const TIP = (TOTAL - HOOK - OUTRO) / n;\n  const tipStart = (i) => HOOK + i * TIP;",
    `  // When the narration has been measured, each scene lasts as long as its own
  // spoken line; otherwise fall back to an even split.
  const DURS = Array.isArray(pack.tipDurations) && pack.tipDurations.length === n
    ? pack.tipDurations
    : Array.from({ length: n }, () => (TOTAL - HOOK - OUTRO) / n);
  const TIP = DURS[0];
  const tipStart = (i) => HOOK + DURS.slice(0, i).reduce((a, d) => a + d, 0);
  const tipLen = (i) => DURS[i];`
  );
  // every place that stamped the uniform TIP now stamps this scene's own length
  b = b.replace(
    'data-start="${at.toFixed(3)}" data-duration="${TIP.toFixed(3)}" data-track-index="1" style="--acc:${a}"',
    'data-start="${at.toFixed(3)}" data-duration="${tipLen(i).toFixed(3)}" data-track-index="1" style="--acc:${a}"'
  );
  b = b.replace(
    'data-start="${at.toFixed(3)}" data-duration="${TIP.toFixed(3)}" data-track-index="1" style="--ink:${ink}"',
    'data-start="${at.toFixed(3)}" data-duration="${tipLen(i).toFixed(3)}" data-track-index="1" style="--ink:${ink}"'
  );
  b = b.replace(
    "    dur: +TIP.toFixed(3),",
    "    dur: +tipLen(i).toFixed(3),"
  );
  // the outro starts after the LAST scene, not after n uniform slots
  b = b.replace(
    /\$\{\(HOOK \+ n \* TIP\)\.toFixed\(3\)\}/g,
    "${(HOOK + DURS.reduce((a, d) => a + d, 0)).toFixed(3)}"
  );
  b = b.replace(
    "var OUT_AT = ${(HOOK + n * TIP).toFixed(3)};",
    "var OUT_AT = ${(HOOK + DURS.reduce((a, d) => a + d, 0)).toFixed(3)};"
  );
  console.log("build-ink: per-scene durations");
}

// ---- ui-mock: platform icon in the app bar + real-looking media ----
let u = readFileSync("lib/ui-mock.mjs", "utf8");
if (!u.includes("papp")) {
  u = u.replace(
    'export function renderUI(ui, ink) {',
    'export function renderUI(ui, ink, appMark = "") {'
  );
  u = u.replace(
    "  const body =",
    "  const mark = appMark ? `<span class=\"papp\">${appMark}</span>` : \"\";\n  const body ="
  );
  // put the mark in every screen's top bar
  u = u.replace(
    /<div class="ptop"><span class="pback"><\/span><span class="ptitle">\$\{esc\(ui\.title \|\| ""\)\}<\/span><\/div>/g,
    '<div class="ptop"><span class="pback"></span><span class="ptitle">${esc(ui.title || "")}</span>${MARK_SLOT}</div>'
  );
  u = u.replace(/function listScreen\(ui, ink\) \{/, "function listScreen(ui, ink, MARK_SLOT = \"\") {");
  u = u.replace(/function composeScreen\(ui, ink\) \{/, "function composeScreen(ui, ink, MARK_SLOT = \"\") {");
  u = u.replace(/function resultScreen\(ui, ink\) \{/, "function resultScreen(ui, ink, MARK_SLOT = \"\") {");
  u = u.replace(/function commentScreen\(ui, ink\) \{/, "function commentScreen(ui, ink, MARK_SLOT = \"\") {");
  u = u.replace(
    /ui\.screen === "compose" \? composeScreen\(ui, ink\) :\s*\n\s*ui\.screen === "result" \? resultScreen\(ui, ink\) :\s*\n\s*ui\.screen === "comment" \? commentScreen\(ui, ink\) :\s*\n\s*ui\.screen === "tool" \? toolScreen\(ui, ink\) :\s*\n\s*listScreen\(ui, ink\);/,
    `ui.screen === "compose" ? composeScreen(ui, ink, mark) :
    ui.screen === "result" ? resultScreen(ui, ink, mark) :
    ui.screen === "comment" ? commentScreen(ui, ink, mark) :
    ui.screen === "tool" ? toolScreen(ui, ink) :
    listScreen(ui, ink, mark);`
  );
  // media blocks become colourful "photos" rather than grey hatch
  u = u.replace(
    /\.pmedia\{flex:1;min-height:200px;border-radius:18px;background:\n  repeating-linear-gradient\(135deg,rgba\(18,58,99,\.10\) 0 14px,rgba\(18,58,99,\.05\) 14px 28px\);\n  display:grid;place-items:center;border:2px solid rgba\(18,58,99,\.16\)\}/,
    `.pmedia{position:relative;flex:1;min-height:200px;border-radius:18px;overflow:hidden;
  display:grid;place-items:center;border:2px solid rgba(18,58,99,.16);
  background:linear-gradient(150deg,color-mix(in srgb,var(--ink) 55%,#fff) 0%,color-mix(in srgb,var(--ink) 18%,#fff) 55%,#fff 100%)}
.pmedia::after{content:"";position:absolute;left:-20%;bottom:-30%;width:150%;height:80%;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.65),transparent 65%)}`
  );
  u = u.replace(
    /\.pmedia-mark\{width:70px;height:56px;border:4px solid rgba\(18,58,99,\.5\);border-radius:10px;position:relative\}/,
    ".pmedia-mark{width:86px;height:70px;border:5px solid rgba(255,255,255,.9);border-radius:12px;position:relative;z-index:1}"
  );
  u = u.replace(
    /\.pmedia-mark::after\{content:"";position:absolute;left:10px;bottom:8px;width:0;height:0;\n  border-left:22px solid transparent;border-right:14px solid transparent;border-bottom:22px solid rgba\(18,58,99,\.5\)\}/,
    `.pmedia-mark::after{content:"";position:absolute;left:12px;bottom:10px;width:0;height:0;
  border-left:26px solid transparent;border-right:16px solid transparent;border-bottom:26px solid rgba(255,255,255,.9)}`
  );
  u = u.replace(
    "/* tap affordance */",
    `.papp{margin-left:auto;display:grid;place-items:center;width:52px;height:52px;border-radius:14px;
  background:rgba(18,58,99,.08);flex:none}
.papp svg{width:34px;height:34px}
/* tap affordance */`
  );
  writeFileSync("lib/ui-mock.mjs", u);
  console.log("ui-mock: app icon + photo-like media");
}

// pass the platform mark into every mock
b = b.replace(
  "? renderUI(tip.ui, ink)",
  "? renderUI(tip.ui, ink, platformMark(pack.platform, ink, 34))"
);
b = b.replace(
  "? renderUI(pack.tips[pack.tips.length - 1].ui || pack.tips[0].ui, PAIR[0])",
  "? renderUI(pack.tips[pack.tips.length - 1].ui || pack.tips[0].ui, PAIR[0], platformMark(pack.platform, PAIR[0], 34))"
);
writeFileSync("lib/build-ink.mjs", b);
console.log("platform mark passed into the mocks");
