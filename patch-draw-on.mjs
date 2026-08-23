// Ink draw-on: the engraved illustrations are DRAWN stroke by stroke instead of
// just fading in — the single most on-brand upgrade for hand-drawn line art.
// Uses pathLength="1" so one dash length works for every shape, no DOM measuring.
import { readFileSync, writeFileSync } from "node:fs";

let b = readFileSync("lib/build-ink.mjs", "utf8");
if (!b.includes("pathLength")) {
  // 1. normalise every shape's length so dasharray:1 draws it fully
  b = b.replace(
    "  const illo = (icon, i) =>",
    `  // pathLength="1" normalises each shape so a single dash length draws them all
  const drawable = (svgBody) =>
    svgBody.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)\\b/g, '<$1 pathLength="1"');

  const illo = (icon, i) =>`
  );
  b = b.replace(
    'stroke-linecap="round" stroke-linejoin="round" filter="url(#sketch${i % 3})">${artFor(icon)}</svg>`;',
    'stroke-linecap="round" stroke-linejoin="round" filter="url(#sketch${i % 3})">${drawable(artFor(icon))}</svg>`;'
  );

  // 2. dash state lives in CSS; GSAP tweens the offset
  b = b.replace(
    ".illo-wrap{display:block}",
    `.illo-wrap{display:block}
.illo path,.illo circle,.illo rect,.illo ellipse,.illo line,.illo polyline,.illo polygon{
  stroke-dasharray:1;stroke-dashoffset:0}`
  );

  // 3. one helper, used by every scene that shows an illustration
  b = b.replace(
    "// ---- BODY: whip-blur entrance, then held motion ----",
    `// draw the ink on: strokes appear as if being sketched
function drawIn(sel, at, dur){
  var parts = gsap.utils.toArray(sel + " > *");
  if(!parts.length) return;
  tl.fromTo(parts,{strokeDashoffset:1},
    {strokeDashoffset:0,duration:dur||.55,ease:"power2.out",
     stagger:Math.min(.05, .35/parts.length)},at);
}

// ---- BODY: whip-blur entrance, then held motion ----`
  );

  // 4. call it wherever an illustration enters
  b = b.replace(
    'tl.fromTo(id+" .illo",{scale:.6,opacity:0,rotation:-10},{scale:1,opacity:1,rotation:0,duration:.55,ease:"back.out(1.8)"},at+.34);',
    'tl.fromTo(id+" .illo",{scale:.6,opacity:0,rotation:-10},{scale:1,opacity:1,rotation:0,duration:.55,ease:"back.out(1.8)"},at+.34);\n    drawIn(id+" .illo",at+.4);'
  );
  b = b.replace(
    'tl.fromTo(id+" .step-illo",{scale:.66,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.5,ease:"back.out(1.8)"},at+.16);',
    'tl.fromTo(id+" .step-illo",{scale:.66,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.5,ease:"back.out(1.8)"},at+.16);\n    drawIn(id+" .step-illo .illo",at+.22,.6);'
  );
  b = b.replace(
    'tl.fromTo(id+" .illo",{scale:.7,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.6,ease:"back.out(1.7)"},at+.3);',
    'tl.fromTo(id+" .illo",{scale:.7,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.6,ease:"back.out(1.7)"},at+.3);\n    drawIn(id+" .illo",at+.36,.6);'
  );
  // hook illustration draws too
  b = b.replace(
    'tl.fromTo("#s1 .hookillo",{y:60,opacity:0,rotation:-6},{y:0,opacity:1,rotation:0,duration:.55,ease:"back.out(1.6)"},.3);',
    'tl.fromTo("#s1 .hookillo",{y:60,opacity:0,rotation:-6},{y:0,opacity:1,rotation:0,duration:.55,ease:"back.out(1.6)"},.3);\ndrawIn("#s1 .hookillo .illo",.36,.7);'
  );

  // 5. editorial polish: hairline rules framing each band
  b = b.replace(
    ".band{width:calc(100% + 140px);",
    `.band{position:relative;width:calc(100% + 140px);`
  );
  b = b.replace(
    ".band .hl{color:#ffd98a}",
    `.band .hl{color:#ffd98a}
.band::before,.band::after{content:"";position:absolute;left:60px;right:60px;height:2px;
  background:rgba(255,255,255,.32)}
.band::before{top:10px}
.band::after{bottom:10px}`
  );

  writeFileSync("lib/build-ink.mjs", b);
  console.log("draw-on + band rules applied");
} else {
  console.log("already patched");
}
