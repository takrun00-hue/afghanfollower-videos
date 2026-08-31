// The channel's mascot.
//
// Round, short, bright, one big expressive eye behind a visor, stubby arms —
// the qualities that make a cartoon helper likeable, drawn as this channel's
// own character rather than as a copy of a studio's. A borrowed character gets
// a video removed and the account struck, which costs more than a drawing.
//
// The previous version was a stick figure: thin, tall, unappealing. This one is
// built the way appealing cartoon characters are — wide base, big head, small
// limbs, a single large eye that carries every expression.
//
// Parts carry classes so the timeline can drive them:
//   .ch-body  .ch-eye  .ch-pupil  .ch-arm-l  .ch-arm-r  .ch-mouth

const POSES = [
  { id: "write", re: /بنویس|بنویسید|متن|کپشن|عنوان|نام/ },
  { id: "look", re: /ببین|بررسی|پیدا کن|باز کن|چک کن|نگاه/ },
  { id: "think", re: /چرا|چطور|آیا|کدام|؟/ },
  { id: "cheer", re: /وایرال|ویو|رشد|درآمد|بیشتر|منتشر|تمام|آماده/ },
  { id: "point", re: /./ },
];

export function poseFor(text = "") {
  return (POSES.find((p) => p.re.test(String(text))) || POSES[POSES.length - 1]).id;
}

/** Arms and any prop, per pose. Stubby and rounded — never sticks. */
function arms(pose, skin, ink) {
  const A = (cls, d) =>
    `<path class="${cls}" d="${d}" stroke="${skin}" stroke-width="30" stroke-linecap="round" fill="none"/>`;
  const rest = A("ch-arm-l", "M74 250 q-30 24 -30 58");
  switch (pose) {
    case "cheer":
      return `${A("ch-arm-l", "M74 246 q-40 -34 -44 -76")}${A("ch-arm-r", "M206 246 q40 -34 44 -76")}`;
    case "write":
      return `${rest}${A("ch-arm-r", "M206 250 q34 20 40 50")}
        <rect x="238" y="286" width="17" height="62" rx="8" fill="#F5A524" transform="rotate(24 246 317)"/>`;
    case "look":
      return `${rest}${A("ch-arm-r", "M206 246 q42 -12 56 -46")}
        <circle cx="272" cy="188" r="21" fill="none" stroke="${ink}" stroke-width="10"/>
        <path d="M287 204 l18 20" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`;
    case "think":
      return `${rest}${A("ch-arm-r", "M206 252 q30 26 8 48")}
        <circle cx="252" cy="128" r="10" fill="${ink}" opacity=".45"/>
        <circle cx="276" cy="96" r="15" fill="${ink}" opacity=".3"/>`;
    default:
      return `${rest}${A("ch-arm-r", "M206 248 q46 4 64 -30")}`;
  }
}

const MOUTH = {
  cheer: "M104 306 q36 46 72 0 q-36 16 -72 0 z",
  think: "M116 312 q24 -12 48 4",
  look: "M112 308 q28 22 56 0",
  write: "M114 308 q26 18 52 0",
  point: "M108 306 q32 30 64 0 q-32 12 -64 0 z",
};

export function characterSVG({ pose = "point", ink = "#0E7C9B", skin = "#F7C948" } = {}) {
  return `<svg class="ch ch-${pose}" viewBox="0 0 300 470" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="ch-shadow" cx="140" cy="452" rx="86" ry="14" fill="rgba(90,70,30,.16)"/>
  <g class="ch-body">
    <!-- legs: short and thick, so the silhouette stays bottom-heavy -->
    <path d="M112 392 v34" stroke="#2C3140" stroke-width="26" stroke-linecap="round"/>
    <path d="M168 392 v34" stroke="#2C3140" stroke-width="26" stroke-linecap="round"/>
    <ellipse cx="112" cy="434" rx="24" ry="12" fill="#20242F"/>
    <ellipse cx="168" cy="434" rx="24" ry="12" fill="#20242F"/>
    <!-- body: a capsule, wider at the base -->
    <path d="M140 66 q78 0 78 96 v146 q0 62 -78 62 q-78 0 -78 -62 v-146 q0 -96 78 -96 z" fill="${skin}"/>
    <!-- dungarees, in the channel's accent so the mascot carries the palette -->
    <path d="M62 300 q78 26 156 0 v34 q0 62 -78 62 q-78 0 -78 -62 z" fill="${ink}"/>
    <rect x="118" y="330" width="44" height="34" rx="8" fill="#ffffff" opacity=".18"/>
    <path d="M96 292 l6 -54" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>
    <path d="M184 292 l-6 -54" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>
    ${arms(pose, skin, ink)}
    <!-- one large eye: the whole face, and every expression -->
    <g class="ch-face">
      <path d="M30 208 h240" stroke="#8A8F9B" stroke-width="13"/>
      <circle cx="140" cy="208" r="76" fill="#C9CED8"/>
      <circle class="ch-eye" cx="140" cy="208" r="60" fill="#FFFFFF"/>
      <circle class="ch-pupil" cx="140" cy="208" r="27" fill="#3B2A1E"/>
      <circle cx="150" cy="197" r="9" fill="#FFFFFF" opacity=".95"/>
      <path class="ch-mouth" d="${MOUTH[pose] || MOUTH.point}" fill="#7A4A2E" stroke="#7A4A2E" stroke-width="7" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`;
}

export const characterCSS = () => `
/* Large enough to reach the caption and standing behind it: the head clears the
   top of the band while the body passes behind the text, so the figure shares
   the space the words are in instead of sitting in a corner. */
.charwrap{position:absolute;left:14px;bottom:-34px;width:470px;z-index:1;
  opacity:.94;pointer-events:none}
.charwrap .ch{width:100%;height:auto;display:block;
  filter:drop-shadow(0 18px 32px rgba(120,90,40,.20))}
.ch-arm-l{transform-origin:74px 250px}
.ch-arm-r{transform-origin:206px 248px}
.ch-body{transform-origin:140px 434px}
.ch-face{transform-origin:140px 208px}`;

/** Arrival, a look, then breathing and a blink. Finite and seek-safe. */
export function characterTimeline(scope, at, dur) {
  const hold = Math.max(1.2, dur - 0.9);
  const t = (x) => (at + x).toFixed(3);
  return `
tl.fromTo("${scope} .charwrap",{y:130,opacity:0},{y:0,opacity:.94,duration:.55,ease:"back.out(1.6)"},${t(0.28)});
tl.fromTo("${scope} .ch-face",{scale:.86},{scale:1,duration:.42,ease:"back.out(2.2)"},${t(0.46)});
tl.fromTo("${scope} .ch-pupil",{x:-13},{x:0,duration:.5,ease:"power2.out"},${t(0.6)});
tl.to("${scope} .ch-body",{y:-10,duration:1.4,yoyo:true,repeat:${Math.max(1, Math.ceil(hold / 1.4))},ease:"sine.inOut"},${t(0.95)});
tl.to("${scope} .ch-eye",{scaleY:.08,duration:.1,yoyo:true,repeat:1,ease:"none",transformOrigin:"50% 50%"},${t(1.75)});
tl.to("${scope} .ch-eye",{scaleY:.08,duration:.1,yoyo:true,repeat:1,ease:"none",transformOrigin:"50% 50%"},${t(3.5)});`;
}
