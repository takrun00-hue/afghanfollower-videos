// Wires "one feature, explained step by step" into the SHORT pipeline.
import { readFileSync, writeFileSync } from "node:fs";

// ---------- content.mjs ----------
let c = readFileSync("lib/content.mjs", "utf8");
if (!c.includes("featureFor")) {
  c = c.replace(
    'import { ACTIVE_BANKS } from "./banks-active.mjs";',
    'import { ACTIVE_BANKS } from "./banks-active.mjs";\nimport { featureFor } from "./features.mjs";'
  );

  // In SHORT mode a pack becomes ONE feature walked through in steps.
  c = c.replace(
    "function buildPack(cat, dayIndex) {",
    `function buildFeaturePack(cat, dayIndex, variant, bpm, beat) {
  const f = featureFor(cat, dayIndex);
  if (!f) return null;
  const steps = f.steps.slice(0, TIPS_PER_VIDEO);
  const totalBeats = BEATS_HOOK + steps.length * BEATS_TIP + BEATS_OUTRO;
  return {
    id: f.id,
    platform: cat,
    theme: THEMES[cat],
    title: f.title,
    feature: f.name,
    hook: { badge: f.name, l1: f.hook.l1, l2: f.hook.l2 },
    tgTitle: f.tgTitle,
    kicker: KICKERS[cat] || "قابلیت",
    layoutSeed: 0,
    // each step is a scene: numbered, one short instruction, one illustration
    tips: steps.map((s, i) => ({ icon: s.icon, step: i + 1, head: s.text })),
    payoff: f.payoff,
    outro: OUTRO[cat],
    bpm,
    musicVariant: variant,
    musicOutroBars: Math.max(2, Math.round(BEATS_OUTRO / 4)),
    duration: +(totalBeats * beat).toFixed(3),
    hookDuration: +(BEATS_HOOK * beat).toFixed(3),
    outroDuration: +(BEATS_OUTRO * beat).toFixed(3),
    beat: +beat.toFixed(4),
    music: \`music/auto/\${cat}-v\${variant}-s.m4a\`,
  };
}

function buildPack(cat, dayIndex) {`
  );

  // short mode prefers the feature walkthrough
  c = c.replace(
    "  const bank = interleaveKinds(BANKS[cat]);",
    `  const variantEarly = ((dayIndex + CATEGORIES.indexOf(cat)) % MUSIC_VARIANTS) + 1;
  if (SHORT) {
    const fp = buildFeaturePack(cat, dayIndex, variantEarly, BPMS[variantEarly], 60 / BPMS[variantEarly]);
    if (fp) return fp;
  }
  const bank = interleaveKinds(BANKS[cat]);`
  );
  writeFileSync("lib/content.mjs", c);
  console.log("content.mjs: feature mode wired");
}

// ---------- build-ink.mjs ----------
let b = readFileSync("lib/build-ink.mjs", "utf8");
if (!b.includes("sceneStep")) {
  // a step scene: big numeral, illustration, one instruction line
  b = b.replace(
    "  // --- scene D: giant number in a circle",
    `  // --- scene S: one numbered step of a single feature
  const sceneStep = (i, tip, ink) => \`
      <div class="stepwrap">
        <span class="stepnum" style="background:\${ink}">\${PD(tip.step)}</span>
        <span class="illo-wrap ink step-illo" style="color:\${ink}">\${illo(tip.icon, i)}</span>
      </div>
      <div class="band" style="background:\${ink}"><span>\${tip.head}</span></div>\`;

  // --- scene D: giant number in a circle`
  );
  b = b.replace(
    '  const kindOf = (tip) =>',
    '  const kindOf = (tip) => tip.step ? "step" :'
  );
  b = b.replace(
    "      const inner =\n        k === \"stat\"",
    "      const inner =\n        k === \"step\" ? sceneStep(i, tip, ink) :\n        k === \"stat\""
  );
  // step styling
  b = b.replace(
    "/* --- compact (short-form) --- */",
    `/* --- step scene --- */
.stepwrap{position:relative;display:grid;place-items:center;margin-bottom:10px}
.stepnum{position:absolute;top:-10px;right:-10px;z-index:2;width:118px;height:118px;border-radius:50%;
  display:grid;place-items:center;color:#fff;font-weight:900;font-size:66px;
  box-shadow:0 16px 36px rgba(30,20,10,.28)}
.step-illo .illo{width:440px;height:440px}
.compact .step-illo .illo{width:420px;height:420px}
.compact .band{line-height:1.32}
/* --- compact (short-form) --- */`
  );
  // step motion
  b = b.replace(
    '  if(t.k==="paper"){',
    `  if(t.k==="step"){
    tl.fromTo(id+" .step-illo",{scale:.66,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.5,ease:"back.out(1.8)"},at+.16);
    tl.fromTo(id+" .stepnum",{scale:0,rotation:-40},{scale:1,rotation:0,duration:.45,ease:"back.out(2.4)"},at+.3);
    tl.to(id+" .step-illo",{y:-14,duration:1.4,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.4)),ease:"sine.inOut"},at+.7);
  }
  if(t.k==="paper"){`
  );
  writeFileSync("lib/build-ink.mjs", b);
  console.log("build-ink.mjs: step scene added");
}
