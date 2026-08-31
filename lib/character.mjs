// A small presenter along the bottom of the frame.
//
// Two things were wrong with the first attempt and both are fixed here by
// construction rather than by adjustment:
//
//   · it was positioned relative to the device, so it stood ON the screen and
//     covered the interface it was meant to point at. It now belongs to the
//     SCENE and sits on the bottom edge, in the band that was dead space.
//   · it held one pose for every slide, which is a sticker. The pose is now
//     chosen from what the slide actually says.
//
// Flat, few colours, no rendering pretence. It reads as a drawn presenter
// because that is what it is.

/** Which pose a line of Persian asks for. Order matters: first match wins. */
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

/** Arms and props per pose, drawn in the figure's own coordinate space. */
function limbs(pose, ink, skin) {
  const arm = (d, extra = "") =>
    `<path d="${d}" stroke="${skin}" stroke-width="17" stroke-linecap="round" fill="none"${extra}/>`;
  switch (pose) {
    case "write":
      return `${arm("M150 196 q40 14 52 44")}
        <rect x="196" y="228" width="15" height="58" rx="7" fill="#F2B23E" transform="rotate(28 203 257)"/>
        <path d="M84 196 q-26 34 -18 74" stroke="${skin}" stroke-width="17" stroke-linecap="round" opacity=".85"/>`;
    case "look":
      return `${arm("M150 194 q46 -10 62 -44")}
        <circle cx="220" cy="140" r="19" fill="none" stroke="${ink}" stroke-width="9"/>
        <path d="M233 154 l16 18" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M84 196 q-26 34 -18 74" stroke="${skin}" stroke-width="17" stroke-linecap="round" opacity=".85"/>`;
    case "cheer":
      return `${arm("M150 192 q40 -40 44 -78")}
        ${arm("M84 192 q-40 -40 -44 -78", ' opacity=".9"')}`;
    case "think":
      return `${arm("M150 196 q34 26 16 52")}
        <circle cx="96" cy="126" r="9" fill="${ink}" opacity=".5"/>
        <circle cx="76" cy="100" r="13" fill="${ink}" opacity=".35"/>
        <path d="M84 196 q-26 34 -18 74" stroke="${skin}" stroke-width="17" stroke-linecap="round" opacity=".85"/>`;
    default:
      return `<g class="ch-arm">${arm("M150 196 q48 6 66 -26")}
        <circle cx="222" cy="164" r="12" fill="${skin}"/></g>
        <path d="M84 196 q-26 34 -18 74" stroke="${skin}" stroke-width="17" stroke-linecap="round" opacity=".85"/>`;
  }
}

export function characterSVG({ pose = "point", ink = "#7C3AED", skin = "#F6CBA6" } = {}) {
  return `<svg class="ch ch-${pose}" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="ch-shadow" cx="118" cy="386" rx="76" ry="12" fill="rgba(90,60,30,.16)"/>
  <g class="ch-body">
    <path d="M96 286 L90 380 L116 380 L120 300" fill="#2F3444"/>
    <path d="M130 286 L140 380 L166 380 L154 300" fill="#2F3444"/>
    <path d="M82 186 q36 -16 74 0 l14 106 q-52 18 -104 0 z" fill="${ink}"/>
    ${limbs(pose, ink, skin)}
    <g class="ch-head">
      <rect x="106" y="166" width="26" height="26" rx="10" fill="${skin}"/>
      <ellipse cx="119" cy="128" rx="45" ry="49" fill="${skin}"/>
      <path d="M74 120 q4 -54 45 -54 q43 0 45 54 q-11 -25 -45 -25 q-34 0 -45 25 z" fill="#2B2F3A"/>
      <ellipse class="ch-eye ch-eye-l" cx="102" cy="130" rx="5" ry="6.5" fill="#2B2F3A"/>
      <ellipse class="ch-eye ch-eye-r" cx="136" cy="130" rx="5" ry="6.5" fill="#2B2F3A"/>
      <path d="M106 151 q13 11 26 0" stroke="#2B2F3A" stroke-width="4.5" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;
}

export const characterCSS = () => `
/* Bottom edge of the SCENE, never inside the device. Anchoring it to the phone
   is what put it on the screen last time; anchoring it to the frame also fills
   the band under the caption that was reading as unfinished. */
.charwrap{position:absolute;left:56px;bottom:26px;width:300px;z-index:6;pointer-events:none}
.charwrap .ch{width:100%;height:auto;display:block;
  filter:drop-shadow(0 14px 26px rgba(120,80,40,.20))}
.ch-arm{transform-origin:150px 196px}
.ch-head{transform-origin:119px 166px}
.ch-body{transform-origin:119px 380px}`;

/** Arrival, one gesture, then breathing — finite and seek-safe. */
export function characterTimeline(scope, at, dur) {
  const hold = Math.max(1.2, dur - 0.9);
  return `
tl.fromTo("${scope} .charwrap",{y:120,opacity:0},{y:0,opacity:1,duration:.52,ease:"back.out(1.5)"},${(at + 0.3).toFixed(3)});
tl.fromTo("${scope} .ch-head",{rotation:8},{rotation:-4,duration:.5,ease:"power2.out"},${(at + 0.5).toFixed(3)});
tl.to("${scope} .ch-body",{y:-8,duration:1.4,yoyo:true,repeat:${Math.max(1, Math.ceil(hold / 1.4))},ease:"sine.inOut"},${(at + 0.95).toFixed(3)});
tl.to("${scope} .ch-eye",{scaleY:.12,duration:.09,yoyo:true,repeat:1,ease:"none",transformOrigin:"50% 50%"},${(at + 1.7).toFixed(3)});`;
}
