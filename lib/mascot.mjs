// Channel mascot — a green turtle character in a hoodie and cap, holding a
// phone. Replaces the round-headed kid (matches the reference photo the
// owner sent 2026-09-08: a turtle, big white cartoon eyes, blue hoodie,
// cap with a platform badge, phone in hand). Same flat geometric-shape
// style as before — circles, capsules, rounded rects, no hatching or
// texture — just a turtle instead of a kid. Off-white paper, not dark.
//
// Parts carry classes so a timeline can animate them:
//   .mw-body  .mw-arm-l  .mw-arm-r  .mw-brow-l  .mw-brow-r  .mw-mouth

const SKIN = "#7BC96F";       // turtle skin — head, neck, hands, legs
const SKIN_DARK = "#5DA652";  // shell + shading
const SKIN_LIGHT = "#A9E39C"; // cheeks, shell-plate highlights
const INK = "#20242E";

const BROWS = {
  neutral: { l: "M108 132q12-8 26-4", r: "M166 128q14-2 26 6" },
  worried: { l: "M106 126q14-12 30-4", r: "M164 122q16-8 30 4" },
  happy: { l: "M106 134q14-10 28-2", r: "M166 132q14-8 28 2" },
  think: { l: "M106 130q14-10 28-2", r: "M168 122q14-12 28 0" },
};
const MOUTHS = {
  neutral: `<path d="M136 190q14 8 28 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  worried: `<path d="M134 194q14-8 32 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  happy: `<path d="M122 182q28 34 56 0q-4 22-28 22q-24 0-28-22z" fill="#B5342E" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M132 186q18 12 36 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`,
  think: `<path d="M138 192q10 2 22-2" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};

/** Arms per pose. Stubby turtle capsules with a round green hand. */
function arms(pose, sleeve) {
  const A = (cls, d) => `<path class="${cls}" d="${d}" stroke="${sleeve}" stroke-width="28" stroke-linecap="round" fill="none"/>`;
  const hand = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="16" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`;
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
      return `${A("mw-arm-l", "M112 232q-10 26 8 50")}${hand(124, 284)}
        ${A("mw-arm-r", "M188 232q10 26-8 50")}${hand(176, 284)}
        <!-- phone, held between both hands -->
        <g transform="rotate(-6 150 250)">
          <rect x="126" y="212" width="48" height="82" rx="10" fill="#20242E"/>
          <rect x="131" y="220" width="38" height="62" rx="4" fill="#8FD7EA"/>
          <circle cx="150" cy="286" r="3.5" fill="#3A3F4C"/>
        </g>`;
    default:
      return `${A("mw-arm-l", "M112 232q-26 20-24 52")}${hand(88, 284)}
        ${A("mw-arm-r", "M188 232q26 20 24 52")}${hand(212, 284)}`;
  }
}

/** The shell: a domed plate behind the body, peeking past the hoodie at the
 * sides and above the shoulders — drawn first so the hoodie sits on top. */
function shell() {
  return `<g class="mw-shell">
    <path d="M150 200q86 0 92 96l4 46q4 46-96 46q-100 0-96-46l4-46q6-96 92-96z" fill="${SKIN_DARK}"/>
    <ellipse cx="150" cy="292" rx="46" ry="30" fill="${SKIN_LIGHT}" opacity=".55"/>
    <ellipse cx="96" cy="320" rx="20" ry="26" fill="${SKIN_LIGHT}" opacity=".4"/>
    <ellipse cx="204" cy="320" rx="20" ry="26" fill="${SKIN_LIGHT}" opacity=".4"/>
    <path d="M150 214v144M104 236q-6 60 8 116M196 236q6 60-8 116" stroke="${INK}" stroke-width="3" opacity=".18" fill="none"/>
  </g>`;
}

/** Cap: brim + crown, with a small round badge on the front (tinted with
 * the video's own accent so it reads as branding without naming one app). */
function cap(badge) {
  return `<g class="mw-cap">
    <path d="M84 118q4-64 66-64q62 0 66 64q-66-18-132 0z" fill="#20242E"/>
    <path d="M150 54q62 0 66 64l6 4q4-2 2-10q-10-70-74-70q-64 0-74 70q-2 8 2 10l6-4q4-64 66-64z" fill="#12141B"/>
    <path d="M74 122q30-16 76-16t76 16q4 10-8 12q-32-14-68-14t-68 14q-12-2-8-12z" fill="#12141B"/>
    <circle cx="150" cy="88" r="16" fill="${badge}"/>
    <circle cx="150" cy="88" r="16" fill="none" stroke="#fff" stroke-width="2.5" opacity=".85"/>
  </g>`;
}

/**
 * pose: "neutral" | "worried" | "cheer" | "point" | "think" | "hold"
 * sit: draw cross-legged (for a desk/floor scene) instead of standing
 */
export function mascotSVG({ pose = "neutral", sweater = "#5B8DEF", badge = "#E1306C", sit = false } = {}) {
  const face = pose === "worried" ? "worried" : pose === "cheer" || pose === "hold" ? "happy" : pose === "think" ? "think" : "neutral";
  const brow = BROWS[face];
  const legs = sit
    ? `<path d="M92 340q22 32 58 32q36 0 58-32" stroke="${SKIN}" stroke-width="32" stroke-linecap="round" fill="none"/>
       <path d="M92 340q22 32 58 32q36 0 58-32" stroke="${INK}" stroke-width="3" fill="none" opacity=".25"/>`
    : `<path d="M118 338v38" stroke="${SKIN}" stroke-width="28" stroke-linecap="round"/>
       <path d="M182 338v38" stroke="${SKIN}" stroke-width="28" stroke-linecap="round"/>
       <ellipse cx="114" cy="384" rx="24" ry="13" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
       <ellipse cx="186" cy="384" rx="24" ry="13" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`;
  return `<svg class="mw mw-${pose}" viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="mw-shadow" cx="150" cy="404" rx="80" ry="12" fill="rgba(30,40,70,.14)"/>
  <g class="mw-body">
    ${shell()}
    ${legs}
    <!-- hoodie: rounded body over the shell -->
    <path d="M150 214q56 0 62 60l6 64q4 40-68 40q-72 0-68-40l6-64q6-60 62-60z" fill="${sweater}"/>
    <path d="M118 224q32 20 64 0" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".22"/>
    <path d="M124 258h52" stroke="${INK}" stroke-width="6" opacity=".18" stroke-linecap="round"/>
    ${arms(pose, sweater)}
    <!-- neck -->
    <rect x="132" y="196" width="36" height="26" rx="14" fill="${SKIN}"/>
    <!-- head -->
    <circle cx="150" cy="140" r="66" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
    <!-- cheeks -->
    <circle cx="106" cy="158" r="11" fill="#F5A889" opacity=".4"/>
    <circle cx="194" cy="158" r="11" fill="#F5A889" opacity=".4"/>
    ${cap(badge)}
    <!-- eyes: big round cartoon eyes -->
    <ellipse cx="122" cy="140" rx="19" ry="22" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="180" cy="140" rx="19" ry="22" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <circle cx="126" cy="144" r="10" fill="${INK}"/>
    <circle cx="184" cy="144" r="10" fill="${INK}"/>
    <circle cx="129" cy="139" r="3.2" fill="#fff"/>
    <circle cx="187" cy="139" r="3.2" fill="#fff"/>
    <!-- brows -->
    <path class="mw-brow-l" d="${brow.l}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path class="mw-brow-r" d="${brow.r}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
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
