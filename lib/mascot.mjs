// New channel mascot — matches the reference reels the owner sent 2026-09-07
// (rejecting the old one-eyed dungarees character + dark bokeh screenshots):
// a simple round-headed kid in a blue crew-neck sweater, two dot eyes with
// expressive brows, flat geometric shapes only (circles, capsules, rounded
// rects) — no hatching, no engraving texture. Off-white paper, not dark.
//
// Parts carry classes so a timeline can animate them:
//   .mw-body  .mw-arm-l  .mw-arm-r  .mw-brow-l  .mw-brow-r  .mw-mouth

const BROWS = {
  neutral: { l: "M116 150q10-6 22-4", r: "M162 150q12-2 22 4" },
  worried: { l: "M114 146q12-10 26-4", r: "M160 142q14-6 26 4" },
  happy: { l: "M114 152q12-8 24-2", r: "M162 150q12-6 24 2" },
  think: { l: "M114 148q12-8 24-2", r: "M164 144q12-10 24 0" },
};
const MOUTHS = {
  neutral: `<path d="M138 190q12 8 24 0" stroke="#2B2E36" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  worried: `<path d="M136 194q12-8 28 0" stroke="#2B2E36" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  happy: `<path d="M132 186q18 18 36 0" stroke="#2B2E36" stroke-width="4" fill="#2B2E36" fill-opacity=".08" stroke-linecap="round"/>`,
  think: `<path d="M140 192q10 2 20-2" stroke="#2B2E36" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};

/** Arms per pose. Simple rounded capsules; a prop can hang off the hand. */
function arms(pose, sleeve) {
  const A = (cls, d) => `<path class="${cls}" d="${d}" stroke="${sleeve}" stroke-width="26" stroke-linecap="round" fill="none"/>`;
  const hand = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="15" fill="#FBEFE0"/>`;
  switch (pose) {
    case "point":
      return `${A("mw-arm-l", "M112 232q-30 14-34 46")}${hand(78, 280)}
        ${A("mw-arm-r", "M188 232q40-2 62-30")}${hand(252, 200)}`;
    case "worried":
      return `${A("mw-arm-l", "M112 232q-24 26-16 56")}${hand(96, 290)}
        ${A("mw-arm-r", "M188 232q24 26 16 56")}${hand(204, 290)}`;
    case "cheer":
      return `${A("mw-arm-l", "M112 228q-36-20-42-56")}${hand(66, 168)}
        ${A("mw-arm-r", "M188 228q36-20 42-56")}${hand(234, 168)}`;
    case "hold":
      return `${A("mw-arm-l", "M112 232q-14 30 6 54")}${hand(120, 288)}
        ${A("mw-arm-r", "M188 232q14 30-6 54")}${hand(180, 288)}`;
    default:
      return `${A("mw-arm-l", "M112 232q-26 20-24 52")}${hand(88, 284)}
        ${A("mw-arm-r", "M188 232q26 20 24 52")}${hand(212, 284)}`;
  }
}

/**
 * pose: "neutral" | "worried" | "cheer" | "point" | "think" | "hold"
 * sit: draw cross-legged (for a desk/floor scene) instead of standing
 */
export function mascotSVG({ pose = "neutral", sweater = "#5B8DEF", sit = false } = {}) {
  const face = pose === "worried" ? "worried" : pose === "cheer" ? "happy" : pose === "think" ? "think" : "neutral";
  const brow = BROWS[face];
  const legs = sit
    ? `<path d="M96 340q20 30 58 30q38 0 58-30" stroke="#20242E" stroke-width="30" stroke-linecap="round" fill="none"/>`
    : `<path d="M120 338v40" stroke="#20242E" stroke-width="26" stroke-linecap="round"/>
       <path d="M180 338v40" stroke="#20242E" stroke-width="26" stroke-linecap="round"/>
       <ellipse cx="120" cy="384" rx="20" ry="10" fill="#FFFFFF" stroke="#20242E" stroke-width="3"/>
       <ellipse cx="180" cy="384" rx="20" ry="10" fill="#FFFFFF" stroke="#20242E" stroke-width="3"/>`;
  return `<svg class="mw mw-${pose}" viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="mw-shadow" cx="150" cy="404" rx="72" ry="12" fill="rgba(30,40,70,.12)"/>
  <g class="mw-body">
    ${legs}
    <!-- sweater: rounded body -->
    <path d="M150 214q56 0 62 60l6 64q4 40-68 40q-72 0-68-40l6-64q6-60 62-60z" fill="${sweater}"/>
    <path d="M118 224q32 20 64 0" stroke="#3F6FD1" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M124 258h52" stroke="#3F6FD1" stroke-width="6" opacity=".55" stroke-linecap="round"/>
    ${arms(pose, sweater)}
    <!-- neck -->
    <rect x="134" y="196" width="32" height="26" rx="12" fill="#FBEFE0"/>
    <!-- head -->
    <circle cx="150" cy="140" r="66" fill="#FBEFE0" stroke="#20242E" stroke-width="4"/>
    <!-- hair tuft -->
    <path d="M96 108q4-40 30-52q-8 20 2 34q6-30 34-36q-10 22 0 36q14-24 40-22q-16 14-12 34" fill="#FFFFFF" stroke="#20242E" stroke-width="4" stroke-linejoin="round"/>
    <!-- eyes -->
    <circle cx="128" cy="140" r="9" fill="#20242E"/>
    <circle cx="131" cy="137" r="2.6" fill="#fff"/>
    <circle cx="174" cy="140" r="9" fill="#20242E"/>
    <circle cx="177" cy="137" r="2.6" fill="#fff"/>
    <!-- brows -->
    <path class="mw-brow-l" d="${brow.l}" stroke="#20242E" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path class="mw-brow-r" d="${brow.r}" stroke="#20242E" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- cheeks -->
    <circle cx="112" cy="160" r="10" fill="#F5A889" opacity=".35"/>
    <circle cx="190" cy="160" r="10" fill="#F5A889" opacity=".35"/>
    <!-- mouth -->
    <g class="mw-mouth">${MOUTHS[face]}</g>
  </g>
</svg>`;
}

export const mascotCSS = () => `
.mascotwrap{position:absolute;z-index:2;pointer-events:none}
.mascotwrap .mw{width:100%;height:auto;display:block;
  filter:drop-shadow(0 14px 26px rgba(30,40,70,.16))}
.mw-arm-l{transform-origin:112px 232px}
.mw-arm-r{transform-origin:188px 232px}
.mw-body{transform-origin:150px 384px}`;

/** Arrival, a small reaction beat, then an idle breathe + blink loop. */
export function mascotTimeline(scope, at, dur) {
  const hold = Math.max(1.0, dur - 0.8);
  const t = (x) => (at + x).toFixed(3);
  return `
tl.fromTo("${scope} .mascotwrap",{y:90,opacity:0},{y:0,opacity:1,duration:.5,ease:"back.out(1.5)"},${t(0.15)});
tl.fromTo("${scope} .mw-body",{scale:.92},{scale:1,duration:.4,ease:"back.out(2)"},${t(0.35)});
tl.to("${scope} .mw-body",{y:-8,duration:1.3,yoyo:true,repeat:${Math.max(1, Math.ceil(hold / 1.3))},ease:"sine.inOut"},${t(0.7)});`;
}
