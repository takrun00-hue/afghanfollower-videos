import { readFileSync, writeFileSync } from "node:fs";
import { MARK_CSS } from "./lib/platform-marks.mjs";
let b = readFileSync("lib/build-ink.mjs", "utf8");
if (!b.includes("platformMark")) {
  b = b.replace(
    'import { renderUI, UI_CSS } from "./ui-mock.mjs";',
    'import { renderUI, UI_CSS } from "./ui-mock.mjs";\nimport { platformMark, MARK_CSS } from "./platform-marks.mjs";'
  );
  b = b.replace(
    '      <div class="hookblock" style="background:${PAIR[1]}">',
    '      <div class="markwrap">${platformMark(pack.platform, PAIR[0], 150)}</div>\n      <div class="hookblock" style="background:${PAIR[1]}">'
  );
  b = b.replace(
    '    <div class="world" id="w${i + 2}">',
    '    <span class="backdrop" style="color:${ink}">${illo(tip.icon, i)}</span>\n    <div class="world" id="w${i + 2}">'
  );
  b = b.replace(
    "/* --- hook: block + huge type + a preview of the payoff --- */",
    MARK_CSS + "\n/* --- hook: block + huge type + a preview of the payoff --- */"
  );
  b = b.replace(
    'tl.fromTo("#s1 .hookq",{scale:1.1},{scale:1,duration:.32,ease:"power3.out"},0);',
    'tl.fromTo("#s1 .hookq",{scale:1.1},{scale:1,duration:.32,ease:"power3.out"},0);\n' +
    'tl.fromTo("#s1 .markwrap",{scale:0,rotation:-16},{scale:1,rotation:0,duration:.5,ease:"back.out(2.2)"},.04);\n' +
    'tl.to("#s1 .markwrap",{y:-10,duration:1.1,yoyo:true,repeat:2,ease:"sine.inOut"},.6);'
  );
  b = b.replace(
    "  // --- camera: arrive from depth",
    "  // the backdrop drifts so the frame is never static behind the device\n" +
    '  tl.fromTo(id+" .backdrop",{scale:.86,opacity:0,rotation:-6},{scale:1,opacity:.10,rotation:0,duration:.7,ease:"power3.out"},at+.1);\n' +
    '  tl.to(id+" .backdrop",{rotation:5,scale:1.05,duration:Math.max(1.2,t.dur),ease:"none"},at+.7);\n' +
    "  // --- camera: arrive from depth"
  );
  writeFileSync("lib/build-ink.mjs", b);
  console.log("platform marks + backdrops wired");
} else console.log("already patched");
