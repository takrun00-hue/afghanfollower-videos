// Data-driven 1-minute video builder for the AfghanFollower daily pipeline.
// buildHTML(pack) -> self-contained standalone HyperFrames composition (fonts+logo inlined).
import { readFileSync } from "node:fs";

const b64 = (p) => readFileSync(p).toString("base64");
const fontDefs = [
  [400, "Regular"], [500, "Medium"], [700, "Bold"], [800, "ExtraBold"], [900, "Black"],
];
const FONT_FACES = fontDefs
  .map(([w, n]) => `@font-face{font-family:"Vazirmatn";font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64(`public/fonts/Vazirmatn-${n}.woff2`)}) format("woff2");}`)
  .join("\n")
  // modern rounded Persian display face for headings
  + `\n@font-face{font-family:"Baloo";font-weight:400 900;font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64("public/fonts/BalooBhaijaan2-ExtraBold.woff2")}) format("woff2");}`;
const LOGO = "data:image/jpeg;base64," + b64("public/logo.jpg");
// inline GSAP so rendering needs no internet (only Telegram delivery does)
const GSAP = readFileSync("public/gsap.min.js", "utf8");

// --- inline SVG icon library (88x88 viewbox), color-parameterized ---
const S = (inner) => `<svg width="120" height="120" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const ICONS = {
  magnet: (c) => S(`<path d="M20 12v22a24 24 0 0 0 48 0V12H54v22a10 10 0 0 1-20 0V12z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><rect x="20" y="8" width="14" height="10" fill="${c}"/><rect x="54" y="8" width="14" height="10" fill="${c}"/>`),
  bolt: (c) => S(`<path d="M50 6 22 48h20l-6 34 30-46H44z" fill="${c}"/>`),
  music: (c) => S(`<path d="M62 12v40" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M34 22v40" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M34 22 62 12" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="26" cy="62" r="10" fill="${c}"/><circle cx="54" cy="52" r="10" fill="${c}"/>`),
  hashtag: (c) => S(`<path d="M30 12 24 76M58 12 52 76M14 30h60M12 52h60" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`),
  chat: (c) => S(`<path d="M14 18h56a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H36L20 78V60h-6a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="${c}"/><circle cx="30" cy="39" r="5" fill="#05081f"/><circle cx="46" cy="39" r="5" fill="#05081f"/><circle cx="62" cy="39" r="5" fill="#05081f"/>`),
  clock: (c) => S(`<circle cx="44" cy="46" r="32" fill="none" stroke="${c}" stroke-width="7"/><path d="M44 28v20l14 8" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  camera: (c) => S(`<rect x="8" y="24" width="72" height="48" rx="10" fill="${c}"/><rect x="30" y="14" width="28" height="14" rx="5" fill="${c}"/><circle cx="44" cy="48" r="14" fill="#05081f"/><circle cx="44" cy="48" r="7" fill="${c}"/>`),
  chart: (c) => S(`<rect x="12" y="48" width="16" height="30" fill="${c}"/><rect x="36" y="30" width="16" height="48" fill="${c}"/><rect x="60" y="14" width="16" height="64" fill="${c}"/>`),
  trend: (c) => S(`<path d="M10 62 32 40l14 14 24-28" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 26h16v16" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`),
  user: (c) => S(`<circle cx="44" cy="30" r="16" fill="${c}"/><path d="M14 78a30 30 0 0 1 60 0z" fill="${c}"/>`),
  play: (c) => S(`<rect x="10" y="14" width="68" height="60" rx="14" fill="${c}"/><path d="M38 34v20l18-10z" fill="#05081f"/>`),
  star: (c) => S(`<path d="M44 8 55 33l27 3-20 18 6 27-24-14-24 14 6-27L6 36l27-3z" fill="${c}"/>`),
  calendar: (c) => S(`<rect x="12" y="18" width="64" height="58" rx="8" fill="none" stroke="${c}" stroke-width="7"/><path d="M12 34h64M28 10v14M60 10v14" stroke="${c}" stroke-width="7" stroke-linecap="round"/><rect x="26" y="46" width="14" height="12" fill="${c}"/>`),
  layers: (c) => S(`<path d="M44 10 78 28 44 46 10 28z" fill="${c}"/><path d="M10 44l34 18 34-18" stroke="${c}" stroke-width="7" stroke-linejoin="round" fill="none"/><path d="M10 60l34 18 34-18" stroke="${c}" stroke-width="7" stroke-linejoin="round" fill="none"/>`),
  heart: (c) => S(`<path d="M44 76C18 58 10 42 10 30a18 18 0 0 1 34-8 18 18 0 0 1 34 8c0 12-8 28-34 46z" fill="${c}"/>`),
  target: (c) => S(`<circle cx="44" cy="44" r="34" fill="none" stroke="${c}" stroke-width="7"/><circle cx="44" cy="44" r="20" fill="none" stroke="${c}" stroke-width="7"/><circle cx="44" cy="44" r="7" fill="${c}"/>`),
  sparkle: (c) => S(`<path d="M44 8c3 20 8 25 28 28-20 3-25 8-28 28-3-20-8-25-28-28 20-3 25-8 28-28z" fill="${c}"/>`),
  refresh: (c) => S(`<path d="M74 44a30 30 0 1 1-9-21" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M66 8v18H48" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  users: (c) => S(`<circle cx="30" cy="30" r="13" fill="${c}"/><circle cx="60" cy="34" r="11" fill="${c}"/><path d="M6 76a24 24 0 0 1 48 0z" fill="${c}"/><path d="M52 76a22 22 0 0 1 30-16" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`),
  bulb: (c) => S(`<path d="M44 8a24 24 0 0 0-14 43c3 2 4 4 4 8h20c0-4 1-6 4-8A24 24 0 0 0 44 8z" fill="${c}"/><path d="M34 66h20M37 74h14" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`),
  pen: (c) => S(`<path d="M18 70l6-16L56 22l10 10-32 32z" fill="${c}"/><path d="M52 26l10 10" stroke="#05081f" stroke-width="5"/><path d="M18 70l6-3-3-3z" fill="#05081f"/>`),
  wand: (c) => S(`<path d="M20 70 54 36" stroke="${c}" stroke-width="9" stroke-linecap="round"/><path d="M64 12l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="${c}"/><circle cx="26" cy="24" r="4" fill="${c}"/><circle cx="70" cy="52" r="4" fill="${c}"/>`),
  mic: (c) => S(`<rect x="34" y="10" width="20" height="40" rx="10" fill="${c}"/><path d="M24 42a20 20 0 0 0 40 0" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M44 62v14M32 78h24" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`),
  globe: (c) => S(`<circle cx="44" cy="44" r="34" fill="none" stroke="${c}" stroke-width="7"/><path d="M12 44h64M44 10c14 12 14 56 0 68M44 10c-14 12-14 56 0 68" fill="none" stroke="${c}" stroke-width="6"/>`),
  chip: (c) => S(`<rect x="22" y="22" width="44" height="44" rx="8" fill="${c}"/><rect x="34" y="34" width="20" height="20" rx="4" fill="#05081f"/><path d="M32 10v10M44 10v10M56 10v10M32 68v10M44 68v10M56 68v10M10 32h10M10 44h10M10 56h10M68 32h10M68 44h10M68 56h10" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`),
};

// Per-pack timing. Defaults match the original 60s daily explainer.
const TOTAL_DEFAULT = 60, HOOK_DEFAULT = 4, OUTRO_DEFAULT = 5;

// deterministic PRNG so particle positions are stable per build
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// animated background layer: soft drifting orbs + floating particle dots
function fxLayer(seed, accent) {
  const r = mulberry32(seed);
  let orbs = "";
  for (let i = 0; i < 2; i++) {
    const x = (r() * 68 + 8).toFixed(1), y = (r() * 58 + 8).toFixed(1), s = (r() * 150 + 190).toFixed(0);
    orbs += `<span class="orb" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:radial-gradient(circle,${accent}44,transparent 68%)"></span>`;
  }
  let dots = "";
  for (let i = 0; i < 8; i++) {
    const x = (r() * 90 + 4).toFixed(1), y = (r() * 82 + 4).toFixed(1), s = (r() * 14 + 8).toFixed(0), o = (r() * 0.28 + 0.22).toFixed(2);
    dots += `<span class="dot" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:${accent};opacity:${o}"></span>`;
  }
  return `<div class="fx">${orbs}${dots}</div>`;
}

export function buildHTML(pack) {
  const t = pack.theme;
  const n = pack.tips.length;
  const TOTAL = pack.duration ?? TOTAL_DEFAULT;
  const HOOK  = pack.hookDuration ?? HOOK_DEFAULT;
  const OUTRO = pack.outroDuration ?? OUTRO_DEFAULT;
  const TIP = (TOTAL - HOOK - OUTRO) / n;
  const acc = (i) => t.accents[i % t.accents.length];

  const tipStart = (i) => HOOK + i * TIP;
  const outroStart = HOOK + n * TIP;

  // Two-character dialogue mode (used by tiktokRemakePack). Each tip is a turn:
  // { speaker: 'ali'|'zahra', text, name, mood }. The 2 characters are
  // rendered in fixed frames, the active one glows + bounces, the speech
  // bubble shows the current line.
  const characterSVG = (who, color) => who === 'zahra' ? `
    <svg viewBox="0 0 220 220" class="char-svg" aria-hidden="true">
      <defs>
        <linearGradient id="zb-${color.slice(1)}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}55"/>
        </linearGradient>
      </defs>
      <circle cx="110" cy="110" r="92" fill="url(#zb-${color.slice(1)})" />
      <!-- hijab / hair -->
      <path d="M30 100 C30 40, 190 40, 190 100 C190 92, 175 80, 110 80 C45 80, 30 92, 30 100Z" fill="#1a1140"/>
      <!-- face -->
      <ellipse cx="110" cy="118" rx="58" ry="64" fill="#f4d3b3"/>
      <!-- blush -->
      <circle cx="78" cy="135" r="9" fill="#e88d8d" opacity=".5"/>
      <circle cx="142" cy="135" r="9" fill="#e88d8d" opacity=".5"/>
      <!-- brows -->
      <path d="M82 108 Q92 100 102 106" stroke="#1a1140" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M118 106 Q128 100 138 108" stroke="#1a1140" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- eyes (blink) -->
      <g class="eyes"><circle cx="92" cy="122" r="6" fill="#1a1140"/><circle cx="128" cy="122" r="6" fill="#1a1140"/></g>
      <!-- mouth -->
      <path class="mouth" d="M96 156 Q110 170 124 156" stroke="#7a3b3b" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>` : `
    <svg viewBox="0 0 220 220" class="char-svg" aria-hidden="true">
      <defs>
        <linearGradient id="ab-${color.slice(1)}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}55"/>
        </linearGradient>
      </defs>
      <circle cx="110" cy="110" r="92" fill="url(#ab-${color.slice(1)})" />
      <!-- hair -->
      <path d="M30 100 C30 40, 190 40, 190 100 C180 78, 145 70, 110 70 C75 70, 40 78, 30 100Z" fill="#2a1a08"/>
      <path d="M40 92 Q90 60 180 92 L180 110 Q160 70 110 68 Q60 70 40 110Z" fill="#2a1a08"/>
      <!-- face -->
      <ellipse cx="110" cy="120" rx="58" ry="64" fill="#e6c39b"/>
      <!-- brows -->
      <path d="M80 110 Q90 102 100 108" stroke="#1a0e02" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M120 108 Q130 102 140 110" stroke="#1a0e02" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- eyes -->
      <g class="eyes"><circle cx="90" cy="124" r="6" fill="#1a0e02"/><circle cx="130" cy="124" r="6" fill="#1a0e02"/></g>
      <!-- beard -->
      <path d="M70 144 Q90 200 110 200 Q130 200 150 144 Q130 184 110 184 Q90 184 70 144Z" fill="#2a1a08"/>
      <!-- mustache -->
      <path d="M88 152 Q110 162 132 152" stroke="#2a1a08" stroke-width="6" fill="none" stroke-linecap="round"/>
      <!-- mouth -->
      <path class="mouth" d="M95 170 Q110 180 125 170" stroke="#5b2e2e" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>`;

  const dialogueScene = (i, tip) => {
    const at = tipStart(i);
    const a = acc(i);
    const speaker = tip.speaker || 'zahra';
    const listener = speaker === 'ali' ? 'zahra' : 'ali';
    return `  <section id="s${i + 2}" class="clip dialogue-clip" data-start="${at.toFixed(3)}" data-duration="${TIP.toFixed(3)}" data-track-index="1" style="--acc:${a}">
    <div class="bg"></div><div class="grid"></div>${fxLayer(101 + i * 7, a)}
    <div class="char-stage" id="s${i + 2}c">
      <div class="char char-listener" data-who="${listener}">
        <div class="char-frame" style="--acc2:${a}66">
          ${characterSVG(listener, a === '#22d3ee' ? '#8a5cff' : '#22d3ee')}
        </div>
        <div class="char-name">${pack.dialogue[listener].name}</div>
      </div>
      <div class="char char-speaker" data-who="${speaker}">
        <div class="char-frame active" style="--acc2:${a}">
          ${characterSVG(speaker, a)}
        </div>
        <div class="char-name">${pack.dialogue[speaker].name}</div>
      </div>
    </div>
    <div class="bubble" id="bubble${i + 2}" data-speaker="${speaker}">
      <div class="bubble-tail"></div>
      <div class="bubble-text">${tip.text}</div>
    </div>
    <div class="reaction" id="rxn${i + 2}">${tip.mood || ''}</div>
  </section>`;
  };

  // strip tags → plain text (for card titles)
  const plain = (s) => String(s).replace(/<[^>]*>/g, "").trim();
  // Split a headline into animatable word spans WITHOUT breaking inline markup:
  // tokenize into tags vs text, drop the tags, and re-apply `hl` per word.
  const words = (s) => {
    let out = "", hl = false;
    for (const part of String(s).split(/(<[^>]+>)/)) {
      if (!part) continue;
      if (part[0] === "<") {
        if (/^<span[^>]*\bhl\b/.test(part)) hl = true;
        else if (/^<\/span>/i.test(part)) hl = false;
        else if (/^<br\s*\/?>/i.test(part)) out += "<br/>";
        continue;
      }
      for (const w of part.split(/\s+/)) {
        if (!w) continue;
        out += `<span class="w${hl ? " hl" : ""}">${w}</span> `;
      }
    }
    return out.trim();
  };

  // RGB-split glitch stack: ghosts behind, fully legible base on top.
  const gx = (html) =>
    `<span class="glitch-copy warm" aria-hidden="true">${html}</span>` +
    `<span class="glitch-copy cool" aria-hidden="true">${html}</span>` +
    `<span class="glitch-base">${html}</span>`;

  const LAYOUTS = ["focus", "bigtext", "card", "split", "burst"];
  const layoutOf = (i) => {
    const base = Number.isFinite(pack.layoutSeed) ? pack.layoutSeed : 0;
    return LAYOUTS[(i + base) % LAYOUTS.length];
  };
  // content shape wins over the rotating skin: a tip that carries a number, a
  // wrong/right pair, or a phone demo gets the scene built for it.
  const pickLayout = (tip, i) =>
    tip.layout || (tip.stat ? "stat" : tip.bad ? "mistake" : tip.phone ? "phone" : layoutOf(i));

  const sceneShell = (i, lay, inner, a, at) =>
    `  <section id="s${i + 2}" class="clip lay-${lay}" data-start="${at.toFixed(3)}" data-duration="${TIP.toFixed(3)}" data-track-index="1" style="--acc:${a}">
    <div class="bg"></div><div class="grid"></div>${fxLayer(101 + i * 7, a)}
    <div class="stage"><div class="world" id="w${i + 2}">
${inner}
    </div></div>
    <div class="pageflip"><span class="pgshine"></span></div>
    <div class="rgbcut a"></div><div class="rgbcut b"></div>
    <div class="scanband" style="top:32%"></div><div class="scanband" style="top:58%"></div>
  </section>`;

  const focusInner = (i, tip, a) => `    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="focus-frame" aria-hidden="true">
        <div class="frame-glow" style="background:radial-gradient(circle,${a}66,transparent 68%)"></div>
        <div class="frame-grid"></div>
        <i class="frame-corner corner-tl"></i><i class="frame-corner corner-tr"></i>
        <i class="frame-corner corner-bl"></i><i class="frame-corner corner-br"></i>
        <div class="frame-orbit orbit-a" style="border-color:${a}99"><span style="background:${a}"></span></div>
        <div class="frame-orbit orbit-b" style="border-color:${a}55"><span style="background:#fff"></span></div>
        <div class="frame-core" style="--frame-accent:${a}">
          <div class="icon">${(ICONS[tip.icon] || ICONS.star)(a)}</div>
        </div>
        <div class="signal"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="headline gstack">${gx(tip.head)}</div>
      <div class="bar" style="background:${a}"></div>
    </div>
    <div class="sub">${tip.sub}</div>`;

  // giant kinetic typography — no icon, words fly in one by one
  const bigtextInner = (i, tip, a) => `    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="headline big">${words(tip.head)}</div>
      <div class="sweep" style="background:${a}"></div>
    </div>
    <div class="sub">${tip.sub}</div>`;

  // mock app/browser window — ideal for showcasing a tool or site
  const cardInner = (i, tip, a) => `    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="appwin">
        <div class="appbar">
          <i class="appdot" style="background:#ff5f57"></i><i class="appdot" style="background:#febc2e"></i><i class="appdot" style="background:#28c840"></i>
          <div class="appurl">${plain(tip.tool || "AfghanFollower")}</div>
        </div>
        <div class="appbody">
          <div class="appglow" style="background:radial-gradient(circle,${a}55,transparent 70%)"></div>
          <div class="icon">${(ICONS[tip.icon] || ICONS.star)(a)}</div>
          <div class="apphead gstack">${gx(tip.head)}</div>
          <div class="appline" style="background:${a}"></div>
        </div>
      </div>
    </div>
    <div class="sub">${tip.sub}</div>`;

  // diagonal split — icon panel and text enter from opposite sides
  const splitInner = (i, tip, a) => `    <div class="splitbg" style="--acc:${a}"><span class="half top"></span><span class="half bottom"></span></div>
    <div class="wrap split" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="sidepanel" style="border-color:${a}">
        <div class="icon">${(ICONS[tip.icon] || ICONS.star)(a)}</div>
      </div>
      <div class="headline gstack">${gx(tip.head)}</div>
      <div class="bar" style="background:${a}"></div>
    </div>
    <div class="sub">${tip.sub}</div>`;

  // radiating burst behind the icon
  const burstInner = (i, tip, a) => {
    let rays = "";
    for (let r = 0; r < 12; r++) rays += `<i class="ray" style="transform:translate(-50%,0) rotate(${r * 30}deg);background:linear-gradient(to bottom,${a},transparent)"></i>`;
    return `    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="burst">
        <div class="rays">${rays}</div>
        <div class="ring1" style="border-color:${a}"></div>
        <div class="ring2" style="border-color:${a}"></div>
        <div class="burstcore" style="box-shadow:0 0 60px ${a}">
          <div class="icon">${(ICONS[tip.icon] || ICONS.star)(a)}</div>
        </div>
      </div>
      <div class="headline gstack">${gx(tip.head)}</div>
      <div class="bar" style="background:${a}"></div>
    </div>
    <div class="sub">${tip.sub}</div>`;
  };

  // giant animated counter + progress ring
  const statInner = (i, tip, a) => `    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="statwrap">
        <svg class="statring" viewBox="0 0 200 200">
          <circle class="ringbg" cx="100" cy="100" r="88"/>
          <circle class="ringfg" cx="100" cy="100" r="88" stroke="${a}"/>
        </svg>
        <div class="statnum" data-to="${tip.stat.value}" data-suffix="${tip.stat.suffix || ""}">۰</div>
      </div>
      <div class="statlabel">${tip.stat.label}</div>
      <div class="headline gstack">${gx(tip.head)}</div>
      <div class="bar" style="background:${a}"></div>
    </div>
    <div class="sub">${tip.sub}</div>`;

  // phone mockup with a feed that scrolls and a like that pops
  const phoneInner = (i, tip, a) => {
    let rows = "";
    for (let r = 0; r < 5; r++) {
      rows += `<div class="feedrow"><span class="fav" style="background:${r % 2 ? a : "rgba(255,255,255,.35)"}"></span><span class="fl"></span><span class="fl short"></span></div>`;
    }
    return `    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="phone">
        <div class="notch"></div>
        <div class="screen">
          <div class="feed">${rows}${rows}</div>
          <div class="phoneicon">${(ICONS[tip.icon] || ICONS.star)(a)}</div>
          <div class="likepop" style="color:${a}">♥</div>
        </div>
      </div>
      <div class="headline gstack">${gx(tip.head)}</div>
    </div>
    <div class="sub">${tip.sub}</div>`;
  };

  // wrong vs right comparison
  const mistakeInner = (i, tip, a) => `    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">${pack.kicker || "نکته"}</div>
      <div class="cmp bad"><span class="mark">✕</span><span class="cmptext">${tip.bad}</span></div>
      <div class="cmp good" style="border-color:${a}"><span class="mark ok" style="background:${a}">✓</span><span class="cmptext">${tip.good}</span></div>
      <div class="headline gstack">${gx(tip.head)}</div>
      <div class="bar" style="background:${a}"></div>
    </div>
    <div class="sub">${tip.sub}</div>`;

  const tipScene = (i, tip) => {
    const a = acc(i);
    const at = tipStart(i);
    const lay = pickLayout(tip, i);
    const inner =
      lay === "stat" ? statInner(i, tip, a) :
      lay === "phone" ? phoneInner(i, tip, a) :
      lay === "mistake" ? mistakeInner(i, tip, a) :
      lay === "bigtext" ? bigtextInner(i, tip, a) :
      lay === "card" ? cardInner(i, tip, a) :
      lay === "split" ? splitInner(i, tip, a) :
      lay === "burst" ? burstInner(i, tip, a) :
      focusInner(i, tip, a);
    return sceneShell(i, lay, inner, a, at);
  };

  const isDialogue = !!pack.dialogue;
  const scenes = pack.tips
    .map((tip, i) => isDialogue ? dialogueScene(i, tip) : tipScene(i, tip))
    .join("\n");

  const tipsData = pack.tips.map((tip, i) => ({
    id: "s" + (i + 2),
    at: +tipStart(i).toFixed(3),
    dur: +TIP.toFixed(3),
    lay: pickLayout(tip, i),
    i,
  }));

  const page = `<!doctype html>
<html lang="fa">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>${pack.title}</title>
<script>${GSAP}</script>
<style>
${FONT_FACES}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#05081f}
body{font-family:"Vazirmatn",sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#05081f;
  --grad:${t.grad};--gradOutro:${t.gradOutro};--glow1:${t.glow1};--glow2:${t.glow2};--emc:${t.emc}}
.wrap,.sub,.brandchip,.kicker,.headline,.hook-l1,.hook-l2,.brandBig,.brandTag,.follow{direction:rtl}
.clip{position:absolute;inset:0;overflow:hidden}
.fx{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.fx .orb{position:absolute;border-radius:50%;filter:blur(8px)}
.fx .dot{position:absolute;border-radius:50%}
.bg{position:absolute;inset:0;z-index:0;background:var(--grad)}
.bg::before{content:"";position:absolute;width:1300px;height:1300px;border-radius:50%;top:-260px;right:-360px;
  background:radial-gradient(circle,var(--glow1),transparent 62%)}
.bg::after{content:"";position:absolute;width:1100px;height:1100px;border-radius:50%;bottom:-320px;left:-320px;
  background:radial-gradient(circle,var(--glow2),transparent 62%)}
.grid{position:absolute;inset:0;z-index:0;opacity:.10;
  background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);
  background-size:90px 90px}
.wrap{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;
  /* keeps content inside the universal 900x1400 safe box */
  text-align:center;padding:270px 90px 540px}
.kicker{font-weight:800;font-size:40px;letter-spacing:.02em;color:#eaf0ff;margin-bottom:34px;
  padding:16px 34px;border:2px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(255,255,255,.08)}
.focus-frame{position:relative;width:370px;height:280px;margin-bottom:34px;display:grid;place-items:center;isolation:isolate}
.frame-glow{position:absolute;inset:16px;border-radius:50%;opacity:.72;filter:blur(14px);z-index:-3}
.frame-grid{position:absolute;inset:24px;border:1px solid rgba(255,255,255,.22);border-radius:42px;opacity:.72;
  background-image:linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px);
  background-size:28px 28px;transform:perspective(500px) rotateX(12deg);box-shadow:inset 0 0 34px rgba(255,255,255,.08),0 24px 70px rgba(0,0,0,.26)}
.frame-corner{position:absolute;width:42px;height:42px;border-color:rgba(255,255,255,.9);border-style:solid;z-index:4}
.corner-tl{top:34px;left:38px;border-width:3px 0 0 3px;border-radius:16px 0 0 0}
.corner-tr{top:34px;right:38px;border-width:3px 3px 0 0;border-radius:0 16px 0 0}
.corner-bl{bottom:34px;left:38px;border-width:0 0 3px 3px;border-radius:0 0 0 16px}
.corner-br{bottom:34px;right:38px;border-width:0 3px 3px 0;border-radius:0 0 16px 0}
.frame-orbit{position:absolute;width:224px;height:224px;border:2px dashed;border-radius:50%;z-index:1;transform:rotate(-18deg)}
.frame-orbit span{position:absolute;width:13px;height:13px;border-radius:50%;top:12px;left:50%;box-shadow:0 0 20px currentColor}
.orbit-b{width:178px;height:178px;transform:rotate(34deg);border-style:solid;opacity:.72}
.orbit-b span{width:9px;height:9px;top:auto;bottom:4px;left:18px}
.frame-core{width:148px;height:148px;border-radius:38px;display:grid;place-items:center;z-index:3;
  background:linear-gradient(145deg,rgba(255,255,255,.25),rgba(255,255,255,.06));border:2px solid rgba(255,255,255,.52);
  box-shadow:0 18px 50px rgba(0,0,0,.38),inset 0 2px 18px rgba(255,255,255,.3),0 0 34px var(--frame-accent)}
.frame-core .icon{margin:0}
.frame-core .icon svg{width:112px;height:112px;filter:drop-shadow(0 0 18px var(--frame-accent))}
.signal{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);height:34px;width:188px;display:flex;align-items:center;justify-content:center;gap:6px;z-index:5}
.signal i{display:block;width:7px;height:12px;border-radius:99px;background:var(--acc);opacity:.8;transform-origin:center}
.signal i:nth-child(2){height:22px}.signal i:nth-child(3){height:30px}.signal i:nth-child(4){height:18px}.signal i:nth-child(5){height:26px}
.signal i:nth-child(6){height:14px}.signal i:nth-child(7){height:28px}.signal i:nth-child(8){height:19px}.signal i:nth-child(9){height:11px}
.headline{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:104px;line-height:1.12;letter-spacing:0;margin-top:12px;
  text-shadow:0 6px 30px rgba(0,0,0,.35)}
.headline .hl{color:var(--acc)}
.bar{height:15px;width:280px;border-radius:99px;margin:38px 0 0;transform-origin:right center}
.icon{margin-bottom:22px}
.icon svg{width:150px;height:150px}
.sub{position:absolute;left:80px;right:80px;bottom:365px;z-index:3;font-weight:700;font-size:50px;line-height:1.55;
  color:#0a0f33;background:#fff;border-radius:32px;padding:32px 42px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
.sub .em{color:var(--emc)}
.hookwrap{padding:300px 60px 400px}
.hookflash{position:absolute;inset:0;z-index:1;opacity:0;background:#fff;mix-blend-mode:overlay;pointer-events:none}
.hookbadge{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:62px;color:#05081f;
  background:#fff;border-radius:99px;padding:18px 52px;margin-bottom:40px;
  box-shadow:0 18px 50px rgba(0,0,0,.45)}
.hookarrow{margin-top:92px;display:flex;flex-direction:column;align-items:center;gap:10px}
.hookarrow .chev{width:64px;height:64px;border-right:12px solid rgba(255,255,255,.92);
  border-bottom:12px solid rgba(255,255,255,.92);transform:rotate(45deg);border-radius:6px}
.hook-l1{font-weight:800;font-size:96px;line-height:1.22;color:#eef3ff}
.hook-l2{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:178px;line-height:1.02;letter-spacing:0;margin-top:24px;
  text-shadow:0 8px 40px rgba(0,0,0,.4),0 0 60px rgba(140,170,255,.30)}
.progress{position:absolute;top:0;left:0;right:0;height:14px;background:rgba(255,255,255,.12);z-index:50}
.progress .fill{height:100%;width:100%;transform-origin:right center;background:var(--grad-bar,linear-gradient(90deg,var(--glow1),var(--glow2)))}
.brandchip{position:absolute;top:140px;right:140px;display:flex;align-items:center;gap:18px;z-index:40}
.brandchip img{width:92px;height:92px;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.brandchip .bt{font-weight:900;font-size:38px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.outro .bg{background:var(--gradOutro)}
.outro .wrap{padding:120px 90px 300px}
.logoBig{width:340px;height:340px;border-radius:76px;box-shadow:0 40px 90px rgba(0,0,0,.55);margin-bottom:52px}
.brandBig{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:150px;line-height:1.0;letter-spacing:0;
  text-shadow:0 8px 40px rgba(0,0,0,.35)}
.brandTag{font-weight:700;font-size:54px;color:#f2f8ff;margin-top:38px;line-height:1.4}
.follow{margin-top:60px;font-weight:900;font-size:58px;color:#0b1560;background:#fff;
  border-radius:99px;padding:32px 84px;box-shadow:0 22px 50px rgba(0,0,0,.4)}
.flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:45;pointer-events:none;mix-blend-mode:overlay}
/* ---------- page-turn transition ---------- */
.stage{transform-style:preserve-3d}
.pageflip{position:absolute;inset:0;z-index:22;transform-origin:right center;backface-visibility:hidden;
  background:var(--grad);
  box-shadow:-40px 0 90px rgba(0,0,0,.55),inset 2px 0 0 rgba(255,255,255,.22)}
.pageflip::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,.28)}
.pageflip .pgshine{position:absolute;inset:0;z-index:1;
  background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.22) 50%,transparent 70%)}
/* ---------- RGB-split glitch (headlines) ---------- */
.gstack{display:grid}
.gstack .glitch-base,.gstack .glitch-copy{grid-area:1/1}
.gstack .glitch-base{z-index:2}
.gstack .glitch-copy{z-index:1;opacity:0;will-change:transform;mix-blend-mode:screen}
.gstack .glitch-copy.warm{color:#ff2d6f}
.gstack .glitch-copy.cool{color:#22e0f0}
.gstack .glitch-copy .hl{color:inherit}
/* full-frame chromatic cut: two offset colour fields spike then die */
.rgbcut{position:absolute;inset:0;z-index:46;pointer-events:none;opacity:0;mix-blend-mode:screen}
.rgbcut.a{background:linear-gradient(90deg,rgba(255,45,111,.85),transparent 55%)}
.rgbcut.b{background:linear-gradient(270deg,rgba(34,224,240,.85),transparent 55%)}
/* horizontal scan bands that sweep through a cut */
.scanband{position:absolute;left:-10%;width:120%;height:5px;background:rgba(255,255,255,.9);
  opacity:0;z-index:47;pointer-events:none;box-shadow:0 0 24px rgba(255,255,255,.75)}
/* ---------- 3D depth world (parallax + camera push) ---------- */
.stage{position:absolute;inset:0;z-index:2;perspective:1400px;perspective-origin:50% 45%}
.world{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}
/* ---------- gradient sweep through accent words ---------- */
.gstack .glitch-base .hl{background-image:linear-gradient(100deg,var(--acc) 0%,#ffffff 18%,var(--acc) 36%);
  background-size:300% 100%;background-position:100% 0;
  -webkit-background-clip:text;background-clip:text;color:transparent}
/* ---------- layout: stat (animated counter + ring) ---------- */
.statwrap{position:relative;width:380px;height:380px;display:grid;place-items:center;margin-bottom:18px}
.statring{position:absolute;inset:0;width:380px;height:380px;transform:rotate(-90deg)}
.statring circle{fill:none;stroke-width:14;stroke-linecap:round}
.statring .ringbg{stroke:rgba(255,255,255,.16)}
.statring .ringfg{stroke-dasharray:553;stroke-dashoffset:553;filter:drop-shadow(0 0 16px currentColor)}
.statnum{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:150px;line-height:1;
  text-shadow:0 8px 40px rgba(0,0,0,.45)}
.statlabel{font-weight:800;font-size:46px;color:#dbe6ff;margin-bottom:16px}
/* ---------- layout: phone (device mockup + live feed) ---------- */
.phone{position:relative;width:400px;height:640px;border-radius:56px;margin-bottom:30px;
  background:linear-gradient(160deg,#20264d,#0a0e28);border:8px solid rgba(255,255,255,.30);
  box-shadow:0 40px 100px rgba(0,0,0,.6),inset 0 2px 20px rgba(255,255,255,.18);overflow:hidden}
.phone .notch{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:130px;height:26px;
  border-radius:99px;background:rgba(0,0,0,.75);z-index:3}
.phone .screen{position:absolute;inset:14px;border-radius:44px;overflow:hidden;
  background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(0,0,0,.28))}
.phone .feed{position:absolute;left:0;right:0;top:0;padding:56px 22px 0;display:flex;flex-direction:column;gap:18px}
.feedrow{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.10);border-radius:20px;padding:16px 14px}
.feedrow .fav{width:44px;height:44px;border-radius:50%;flex:none}
.feedrow .fl{height:13px;border-radius:99px;background:rgba(255,255,255,.32);flex:1}
.feedrow .fl.short{flex:.45}
.phone .phoneicon{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2}
.phone .phoneicon svg{width:150px;height:150px;filter:drop-shadow(0 10px 30px rgba(0,0,0,.55))}
.phone .likepop{position:absolute;right:44px;bottom:56px;font-size:96px;line-height:1;z-index:3;
  text-shadow:0 0 30px currentColor}
/* ---------- layout: mistake (wrong vs right) ---------- */
.cmp{width:100%;max-width:840px;display:flex;align-items:center;gap:26px;direction:rtl;
  background:rgba(255,255,255,.10);border:3px solid rgba(255,255,255,.20);border-radius:34px;
  padding:30px 34px;margin-bottom:22px;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.cmp .mark{flex:none;width:74px;height:74px;border-radius:50%;display:grid;place-items:center;
  font-size:44px;font-weight:900;color:#fff;background:#e5484d}
.cmp .mark.ok{color:#05081f}
.cmp .cmptext{font-weight:700;font-size:44px;line-height:1.4;text-align:right}
.cmp.bad{opacity:.92}
.cmp.bad .cmptext{text-decoration:line-through;text-decoration-color:rgba(229,72,77,.85);color:#ffd9da}
.cmp.good{background:rgba(255,255,255,.16)}
/* ---------- layout: bigtext (kinetic typography) ---------- */
.headline.big{font-size:142px;line-height:1.12;margin-top:26px;perspective:900px}
.headline.big .w{display:inline-block;transform-origin:50% 100%}
.sweep{height:20px;width:56%;border-radius:99px;margin-top:52px;transform-origin:right center;
  box-shadow:0 10px 40px rgba(0,0,0,.35)}
/* ---------- layout: card (mock app window) ---------- */
.appwin{width:780px;border-radius:36px;overflow:hidden;margin:14px 0 6px;
  background:rgba(9,13,38,.80);border:2px solid rgba(255,255,255,.24);
  box-shadow:0 44px 110px rgba(0,0,0,.58);backdrop-filter:blur(10px)}
.appbar{height:78px;display:flex;align-items:center;gap:14px;padding:0 28px;
  background:rgba(255,255,255,.10);border-bottom:1px solid rgba(255,255,255,.16)}
.appdot{width:20px;height:20px;border-radius:50%;display:block}
.appurl{margin-right:auto;direction:ltr;font:600 30px/1 "Vazirmatn",monospace;color:#dfe7ff;opacity:.9;
  background:rgba(255,255,255,.10);padding:12px 24px;border-radius:99px}
.appbody{position:relative;padding:54px 44px 60px;display:flex;flex-direction:column;align-items:center;gap:26px}
.appglow{position:absolute;inset:-40px;z-index:0;filter:blur(10px);opacity:.85}
.appbody>*{position:relative;z-index:1}
.appbody .icon{margin:0}
.appbody .icon svg{width:156px;height:156px}
.apphead{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:86px;line-height:1.12;
  text-align:center;direction:rtl;text-shadow:0 6px 26px rgba(0,0,0,.4)}
.apphead .hl{color:var(--acc)}
.appline{height:14px;width:230px;border-radius:99px;transform-origin:right center}
/* ---------- layout: split (diagonal) ---------- */
.splitbg{position:absolute;inset:0;z-index:1;overflow:hidden}
.splitbg .half{position:absolute;left:-12%;width:124%;height:60%}
.splitbg .top{top:-14%;background:linear-gradient(180deg,rgba(255,255,255,.10),transparent);
  transform:rotate(-7deg);border-bottom:3px solid rgba(255,255,255,.18)}
.splitbg .bottom{bottom:-16%;background:linear-gradient(0deg,rgba(0,0,0,.34),transparent);transform:rotate(-7deg)}
.wrap.split .sidepanel{width:330px;height:330px;border-radius:56px;border:3px solid;display:grid;place-items:center;
  background:linear-gradient(150deg,rgba(255,255,255,.20),rgba(255,255,255,.05));
  box-shadow:0 30px 80px rgba(0,0,0,.45),inset 0 2px 20px rgba(255,255,255,.28);margin-bottom:44px}
.wrap.split .sidepanel .icon{margin:0}
.wrap.split .sidepanel .icon svg{width:170px;height:170px}
/* ---------- layout: burst ---------- */
.burst{position:relative;width:560px;height:430px;display:grid;place-items:center;margin-bottom:26px}
.burst .rays{position:absolute;width:520px;height:520px;left:50%;top:50%;transform:translate(-50%,-50%)}
.burst .ray{position:absolute;left:50%;top:50%;width:7px;height:250px;border-radius:99px;
  transform-origin:top center;opacity:.55}
.burst .ring1,.burst .ring2{position:absolute;border:3px solid;border-radius:50%;opacity:.55}
.burst .ring1{width:330px;height:330px}
.burst .ring2{width:430px;height:430px;border-style:dashed;opacity:.4}
.burstcore{width:210px;height:210px;border-radius:50%;display:grid;place-items:center;z-index:2;
  background:linear-gradient(150deg,rgba(255,255,255,.26),rgba(255,255,255,.08));
  border:3px solid rgba(255,255,255,.6)}
.burstcore .icon{margin:0}
.burstcore .icon svg{width:130px;height:130px}
/* persistent watermark band (TikTok-style brand + AI label) */
.wm{position:absolute;top:54px;left:50%;transform:translateX(-50%);
   z-index:50;font:600 26px/1 "Vazirmatn","Baloo Bhai 2","JetBrains Mono",sans-serif;
   color:#f5f7ff;background:rgba(8,12,30,.55);backdrop-filter:blur(8px);
   padding:12px 22px;border-radius:999px;display:flex;gap:10px;align-items:center;
   border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 22px rgba(0,0,0,.35);
   direction:rtl;letter-spacing:.01em}
.wm-dot{width:10px;height:10px;border-radius:50%;background:#22d3ee;
   box-shadow:0 0 0 4px rgba(34,211,238,.22);animation:pulse 1.6s ease-in-out infinite}
.wm-handle{color:#fff;font-weight:800}
.wm-sep{opacity:.45}
.wm-tag{opacity:.92}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
/* --- two-character dialogue scene --- */
.dialogue-clip .wrap{display:none}
.dialogue-clip .sub{display:none}
.char-stage{position:absolute;inset:0;z-index:3;display:flex;justify-content:space-between;
  align-items:flex-start;padding:170px 70px 0}
.char{width:46%;display:flex;flex-direction:column;align-items:center}
.char-frame{width:100%;aspect-ratio:1/1;border-radius:50%;position:relative;overflow:hidden;
  background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.12),rgba(8,12,40,.7));
  border:3px solid rgba(255,255,255,.18);box-shadow:0 18px 60px rgba(0,0,0,.42),inset 0 -16px 40px rgba(0,0,0,.4);
  transform:translateZ(0)}
.char-frame.active{border-color:var(--acc2);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 22px 70px rgba(0,0,0,.5),
  0 0 90px var(--acc2),inset 0 -16px 40px rgba(0,0,0,.4);animation:activeGlow 1.4s ease-in-out infinite}
.char-frame .char-svg{width:120%;height:120%;position:absolute;left:-10%;top:-4%}
.char-listener .char-frame{filter:saturate(.55) brightness(.78);transform:scale(.94)}
.char-name{font:800 38px/1 "Vazirmatn","Baloo Bhai 2",sans-serif;color:#fff;
  background:rgba(8,12,30,.6);backdrop-filter:blur(6px);padding:10px 22px;border-radius:999px;
  margin-top:30px;border:1px solid rgba(255,255,255,.22);direction:rtl;letter-spacing:.02em}
.char-speaker .char-name{background:var(--acc2);color:#0b0d2a;border-color:transparent}
@keyframes activeGlow{0%,100%{box-shadow:0 0 0 6px rgba(255,255,255,.08),0 22px 70px rgba(0,0,0,.5),0 0 60px var(--acc2),inset 0 -16px 40px rgba(0,0,0,.4)}50%{box-shadow:0 0 0 6px rgba(255,255,255,.08),0 22px 70px rgba(0,0,0,.5),0 0 110px var(--acc2),inset 0 -16px 40px rgba(0,0,0,.4)}}
/* blink */
.char-svg .eyes{transform-origin:center;transform-box:fill-box;animation:blink 4s ease-in-out infinite}
@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
/* mouth subtle flutter while speaking */
.char-speaker .char-svg .mouth{animation:speakMouth .42s ease-in-out infinite}
@keyframes speakMouth{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.4)}}
.bubble{position:absolute;left:60px;right:60px;bottom:220px;z-index:4;
  background:#fff;color:#0a0f33;border-radius:36px;padding:36px 44px;font-weight:700;font-size:48px;line-height:1.45;
  box-shadow:0 24px 60px rgba(0,0,0,.5);direction:rtl;text-align:right}
.bubble-tail{position:absolute;bottom:-22px;width:36px;height:36px;background:#fff;
  border-radius:8px;transform:rotate(45deg);box-shadow:6px 6px 14px rgba(0,0,0,.18)}
.bubble[data-speaker="ali"] .bubble-tail{left:64px}
.bubble[data-speaker="zahra"] .bubble-tail{right:64px;left:auto}
.reaction{position:absolute;top:170px;left:50%;transform:translateX(-50%);z-index:5;
  font:800 84px/1 "Baloo Bhai 2","Vazirmatn",sans-serif;color:#ffe66d;
  text-shadow:0 6px 30px rgba(0,0,0,.6),0 0 30px rgba(255,230,109,.6);pointer-events:none;opacity:0;
  letter-spacing:0;direction:rtl}
.subtitle-bar{position:absolute;left:0;right:0;bottom:90px;z-index:6;display:flex;justify-content:center;pointer-events:none}
.subtitle-bar .pill{font:900 32px/1 "Vazirmatn",sans-serif;color:#fff;background:rgba(0,0,0,.55);
  padding:14px 28px;border-radius:18px;direction:rtl;letter-spacing:.02em;border:1px solid rgba(255,255,255,.18)}
svg{display:block}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${TOTAL}">

  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="20">
    <div class="progress"><div class="fill" id="pfill"></div></div>
  </div>

  <div class="clip" data-start="0" data-duration="${outroStart.toFixed(3)}" data-track-index="19">
    <div class="brandchip"><img src="${LOGO}" alt="logo" /><span class="bt">افغان فالورز</span></div>
  </div>

  <section id="s1" class="clip" data-start="0" data-duration="${HOOK}" data-track-index="1">
    <div class="bg"></div><div class="grid"></div>
    ${fxLayer(41, t.accents[0])}
    <div class="hookflash" id="hookflash"></div>
    <div class="wrap hookwrap" id="s1c">
      <div class="hookbadge">${pack.hook.badge || "۸ نکته"}</div>
      <div class="hook-l1">${pack.hook.l1}</div>
      <div class="hook-l2">${pack.hook.l2}</div>
      <div class="hookarrow">
        <span class="chev"></span><span class="chev"></span><span class="chev"></span>
      </div>
    </div>
  </section>

${scenes}

  <section id="sOut" class="clip outro" data-start="${outroStart.toFixed(3)}" data-duration="${OUTRO}" data-track-index="1">
    <div class="bg"></div>
    <div class="wrap" id="sOutc">
      <img class="logoBig" src="${LOGO}" alt="افغان فالورز" />
      <div class="brandBig">افغان فالورز</div>
      <div class="brandTag">${pack.outro.tag}</div>
      <div class="follow">${pack.outro.follow}</div>
    </div>
  </section>

  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="30"><div class="flash" id="flash"></div></div>

  ${pack.waterMark ? `
  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="40">
    <div id="wm" class="wm">
      <span class="wm-dot"></span>
      <span class="wm-handle">${pack.waterMark.handle}</span>
      <span class="wm-sep">·</span>
      <span class="wm-tag">${pack.waterMark.tag}</span>
    </div>
  </div>` : ""}
</div>

<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
var TIPS = ${JSON.stringify(tipsData)};
var OUTRO_AT = ${outroStart.toFixed(3)};
tl.fromTo("#pfill",{scaleX:0},{scaleX:1,ease:"none",duration:${TOTAL}},0);
function ken(sel,at,dur){tl.fromTo(sel,{scale:1},{scale:1.05,ease:"none",duration:dur},at);}
function flash(at){tl.fromTo("#flash",{opacity:0},{opacity:.5,duration:.12,ease:"power1.out"},at).to("#flash",{opacity:0,duration:.3,ease:"power1.in"},at+.12);}
// hook
// HOOK — the strongest frame is frame 0: text is already legible, nothing fades up.
// Only a fast scale-snap plays, then two pattern interrupts before the body starts.
tl.fromTo("#s1 .hook-l1",{scale:1.10},{scale:1,duration:.28,ease:"power3.out"},0);
tl.fromTo("#s1 .hook-l2",{scale:1.16},{scale:1,duration:.34,ease:"back.out(2)"},.06);
tl.fromTo("#s1 .hookbadge",{scale:0,rotate:-14},{scale:1,rotate:0,duration:.42,ease:"back.out(2.6)"},.10);
// interrupt 1: punch + flash
tl.fromTo("#hookflash",{opacity:0},{opacity:.42,duration:.07,ease:"none"},1.05)
  .to("#hookflash",{opacity:0,duration:.22,ease:"power1.in"},1.12);
tl.to("#s1c",{scale:1.09,duration:.16,ease:"power2.out"},1.05)
  .to("#s1c",{scale:1.0,duration:.5,ease:"power2.out"},1.21);
// interrupt 2: the payoff line kicks again so the promise lands
tl.to("#s1 .hook-l2",{scale:1.08,duration:.16,ease:"power2.out"},2.1)
  .to("#s1 .hook-l2",{scale:1,duration:.45,ease:"elastic.out(1,.55)"},2.26);
// down-chevrons keep pulling the eye toward the payoff
tl.fromTo("#s1 .chev",{opacity:0,y:-26},{opacity:1,y:0,duration:.3,stagger:.09,ease:"power2.out"},.7);
tl.to("#s1 .chev",{y:18,duration:.55,yoyo:true,repeat:5,stagger:.09,ease:"sine.inOut"},1.1);
ken("#s1c",0,${HOOK});
tl.to("#s1 .dot",{y:"-=24",duration:1.4,yoyo:true,repeat:2,ease:"sine.inOut",stagger:0.12},0);
tl.to("#s1 .orb",{x:"+=26",y:"-=18",duration:2,yoyo:true,repeat:1,ease:"sine.inOut"},0);
// ---------- motion helpers (all seek-safe, deterministic) ----------
function gh(n){var x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
// percussive entrance — a DIFFERENT axis per scene so nothing feels repeated
function slam(sel,at,k){
  var v=((k%4)+4)%4;
  if(v===0) tl.fromTo(sel,{scale:1.5,filter:"blur(16px)",opacity:0},{scale:1,filter:"blur(0px)",opacity:1,duration:.5,ease:"power4.out"},at);
  else if(v===1) tl.fromTo(sel,{x:-380,opacity:0},{x:0,opacity:1,duration:.45,ease:"expo.out"},at);
  else if(v===2) tl.fromTo(sel,{y:120,rotation:-8,opacity:0},{y:0,rotation:0,opacity:1,duration:.52,ease:"back.out(1.9)"},at);
  else tl.fromTo(sel,{skewX:28,x:240,opacity:0},{skewX:0,x:0,opacity:1,duration:.5,ease:"expo.out"},at);
}
// RGB-split: quantized hash jitter that decays to an exact clean rest
function glitchIn(sel,at){
  var copies=gsap.utils.toArray(sel+" .glitch-copy");
  if(!copies.length) return;
  var amp={a:0};
  tl.set(amp,{a:1},at);
  tl.set(copies,{opacity:.9},at);
  tl.to(amp,{a:0,duration:.55,ease:"power3.in",onUpdate:function(){
    var step=Math.floor(tl.time()/0.05);
    copies.forEach(function(el,layer){
      gsap.set(el,{x:(gh(step*13+layer*7)*2-1)*30*amp.a,
                   y:(gh(step*29+layer*11)*2-1)*10*amp.a});
    });
  }},at);
  tl.set(copies,{opacity:0,x:0,y:0},at+.56);
}
// chromatic cut: colour fields + scan bands punch the seam between scenes
function rgbcut(id,at){
  tl.fromTo(id+" .rgbcut.a",{opacity:0,x:-60},{opacity:.38,x:0,duration:.06,ease:"none"},at)
    .to(id+" .rgbcut.a",{opacity:0,duration:.20,ease:"power2.in"},at+.06);
  tl.fromTo(id+" .rgbcut.b",{opacity:0,x:60},{opacity:.38,x:0,duration:.06,ease:"none"},at)
    .to(id+" .rgbcut.b",{opacity:0,duration:.20,ease:"power2.in"},at+.06);
  tl.fromTo(id+" .scanband",{opacity:0,y:-70},{opacity:.85,y:0,duration:.10,stagger:.04,ease:"none"},at)
    .to(id+" .scanband",{opacity:0,y:90,duration:.32,stagger:.04,ease:"power2.in"},at+.13);
}
// tips
var DIALOGUE = ${isDialogue ? 'true' : 'false'};
TIPS.forEach(function(t){
  var at=t.at, id="#"+t.id;
  if (DIALOGUE) {
    // Two-character dialogue animations
    var rId = "#rxn" + t.id.slice(1);
    tl.from(id+" .char-frame",{scale:.5,opacity:0,duration:.5,stagger:.08,ease:"back.out(1.7)"},at);
    tl.from(id+" .char-name",{y:30,opacity:0,duration:.4,stagger:.08,ease:"power3.out"},at+.18);
    tl.from(id+" .bubble",{y:60,opacity:0,scale:.85,duration:.5,ease:"back.out(1.6)"},at+.25);
    if (window.__packs && window.__packs.beatLengths) {
      // bubble swap to next line inside same beat (handled by re-rendering)
    }
    tl.fromTo(rId,{opacity:0,scale:.6,y:30},{opacity:1,scale:1.1,y:0,duration:.4,ease:"back.out(2)"},at+.05)
      .to(rId,{opacity:0,duration:.6,ease:"power1.in"},at+1.6);
    ken(id+" .char-stage",at,t.dur);
  } else if (t.lay === "stat") {
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
    tl.from(id+" .statwrap",{scale:.55,opacity:0,duration:.6,ease:"back.out(1.7)"},at+.1);
    tl.fromTo(id+" .ringfg",{strokeDashoffset:553},{strokeDashoffset:80,duration:1.5,ease:"power2.out"},at+.25);
    // seek-safe counter: GSAP re-evaluates onUpdate when the timeline is scrubbed
    (function(){
      var el=document.querySelector(id+" .statnum"); if(!el) return;
      var to=parseFloat(el.getAttribute("data-to"))||0, sfx=el.getAttribute("data-suffix")||"";
      var o={v:0};
      var fa=function(x){return String(Math.round(x)).replace(/[0-9]/g,function(d){return "۰۱۲۳۴۵۶۷۸۹"[+d];});};
      tl.to(o,{v:to,duration:1.4,ease:"power2.out",onUpdate:function(){el.textContent=fa(o.v)+sfx;}},at+.25);
    })();
    tl.from(id+" .statlabel",{y:30,opacity:0,duration:.45,ease:"power3.out"},at+.7);
    slam(id+" .headline",at+.85,t.i);glitchIn(id+" .headline",at+.85+.18);
    tl.fromTo(id+" .bar",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+1.0);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.95);
    ken("#"+t.id+"c",at,t.dur);
  } else if (t.lay === "phone") {
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
    tl.from(id+" .phone",{y:130,opacity:0,rotate:-6,scale:.86,duration:.75,ease:"back.out(1.5)"},at+.1);
    tl.from(id+" .feedrow",{x:60,opacity:0,duration:.4,stagger:.05,ease:"power3.out"},at+.4);
    // feed keeps scrolling for the whole scene
    tl.fromTo(id+" .feed",{y:0},{y:-330,duration:Math.max(2.5,t.dur-1),ease:"none"},at+.7);
    tl.from(id+" .phoneicon",{scale:.3,opacity:0,rotate:-20,duration:.6,ease:"back.out(2)"},at+.55);
    tl.fromTo(id+" .likepop",{scale:0,opacity:0},{scale:1.15,opacity:1,duration:.5,ease:"back.out(2.4)"},at+.95);
    tl.to(id+" .likepop",{scale:1,duration:.9,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/0.9)),ease:"sine.inOut"},at+1.45);
    slam(id+" .headline",at+.8,t.i);glitchIn(id+" .headline",at+.8+.18);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.9);
    ken("#"+t.id+"c",at,t.dur);
  } else if (t.lay === "mistake") {
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
    tl.from(id+" .cmp.bad",{x:-320,opacity:0,duration:.55,ease:"power4.out"},at+.15);
    tl.from(id+" .cmp.bad .mark",{scale:0,rotate:-90,duration:.45,ease:"back.out(2.2)"},at+.35);
    tl.from(id+" .cmp.good",{x:320,opacity:0,duration:.55,ease:"power4.out"},at+.5);
    tl.from(id+" .cmp.good .mark",{scale:0,rotate:90,duration:.45,ease:"back.out(2.2)"},at+.7);
    tl.to(id+" .cmp.good",{scale:1.04,duration:.35,yoyo:true,repeat:1,ease:"sine.inOut"},at+.95);
    slam(id+" .headline",at+.9,t.i);glitchIn(id+" .headline",at+.9+.18);
    tl.fromTo(id+" .bar",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+1.05);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+1.0);
    ken("#"+t.id+"c",at,t.dur);
  } else if (t.lay === "bigtext") {
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
    tl.from(id+" .headline .w",{y:90,opacity:0,rotationX:-60,duration:.5,stagger:.07,ease:"back.out(1.7)"},at+.12);
    tl.fromTo(id+" .sweep",{scaleX:0},{scaleX:1,duration:.55,ease:"power3.out"},at+.5);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.5);
    ken("#"+t.id+"c",at,t.dur);
  } else if (t.lay === "card") {
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
    tl.from(id+" .appwin",{y:110,scale:.82,opacity:0,rotationX:22,duration:.7,ease:"back.out(1.5)"},at+.1);
    tl.from(id+" .appdot",{scale:0,duration:.35,stagger:.07,ease:"back.out(2.5)"},at+.35);
    tl.from(id+" .appurl",{x:-40,opacity:0,duration:.45,ease:"power3.out"},at+.42);
    tl.from(id+" .appbody .icon",{scale:.3,opacity:0,rotate:-25,duration:.55,ease:"back.out(2)"},at+.5);
    slam(id+" .apphead",at+.62,t.i);glitchIn(id+" .apphead",at+.62+.18);
    tl.fromTo(id+" .appline",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+.78);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.7);
    ken("#"+t.id+"c",at,t.dur);
  } else if (t.lay === "split") {
    tl.from(id+" .splitbg .top",{yPercent:-120,duration:.65,ease:"power4.out"},at);
    tl.from(id+" .splitbg .bottom",{yPercent:120,duration:.65,ease:"power4.out"},at);
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.15);
    tl.from(id+" .sidepanel",{x:-260,opacity:0,rotate:-12,duration:.65,ease:"back.out(1.5)"},at+.2);
    tl.from(id+" .sidepanel .icon",{scale:.4,opacity:0,duration:.5,ease:"back.out(2)"},at+.38);
    tl.from(id+" .headline",{x:260,opacity:0,duration:.6,ease:"power3.out"},at+.34);
    tl.fromTo(id+" .bar",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+.55);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.5);
    ken("#"+t.id+"c",at,t.dur);
  } else if (t.lay === "burst") {
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
    tl.from(id+" .burstcore",{scale:0,opacity:0,duration:.6,ease:"back.out(2)"},at+.12);
    tl.from(id+" .ray",{scaleY:0,opacity:0,duration:.5,stagger:.03,ease:"power3.out"},at+.22);
    tl.from(id+" .ring1",{scale:0,opacity:0,duration:.55,ease:"back.out(1.8)"},at+.28);
    tl.from(id+" .ring2",{scale:0,opacity:0,duration:.6,ease:"back.out(1.6)"},at+.34);
    slam(id+" .headline",at+.42,t.i);glitchIn(id+" .headline",at+.42+.18);
    tl.fromTo(id+" .bar",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+.58);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.5);
    ken("#"+t.id+"c",at,t.dur);
  } else {
    tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
    tl.from(id+" .focus-frame",{scale:.62,rotate:-8,opacity:0,duration:.7,ease:"back.out(1.7)"},at+.1);
    tl.from(id+" .frame-grid",{scale:.72,opacity:0,duration:.55,ease:"power3.out"},at+.16);
    tl.from(id+" .frame-corner",{scale:0,opacity:0,duration:.42,stagger:.05,ease:"back.out(2)"},at+.18);
    tl.from(id+" .frame-core",{scale:.35,opacity:0,duration:.55,ease:"back.out(2)"},at+.22);
    tl.from(id+" .signal i",{scaleY:0,opacity:0,duration:.35,stagger:.04,ease:"power2.out"},at+.32);
    slam(id+" .headline",at+.34,t.i);glitchIn(id+" .headline",at+.34+.18);
    tl.fromTo(id+" .bar",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+.5);
    tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.42);
    ken("#"+t.id+"c",at,t.dur);
  }
  // continuous "alive" motion — deterministic finite repeats
  var rep=Math.max(2,Math.ceil(t.dur/1.3));
  tl.to(id+" .dot",{y:"-=26",duration:1.3,yoyo:true,repeat:rep,ease:"sine.inOut",stagger:0.1},at);
  tl.to(id+" .orb",{x:"+=32",y:"-=22",duration:2.2,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/2.2)),ease:"sine.inOut"},at);
  tl.to(id+" .frame-core",{y:-12,duration:1.3,yoyo:true,repeat:rep,ease:"sine.inOut"},at+.8);
  tl.to(id+" .orbit-a",{rotation:342,duration:3.2,repeat:Math.max(1,Math.ceil(t.dur/3.2)),ease:"none"},at+.35);
  tl.to(id+" .orbit-b",{rotation:-326,duration:2.7,repeat:Math.max(1,Math.ceil(t.dur/2.7)),ease:"none"},at+.35);
  tl.to(id+" .signal i",{scaleY:1.35,duration:.55,yoyo:true,repeat:rep,ease:"sine.inOut",stagger:.06},at+.8);
  // layout-specific ambient motion
  tl.to(id+" .appwin",{rotationY:6,y:-10,duration:2.4,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/2.4)),ease:"sine.inOut"},at+.9);
  tl.to(id+" .rays",{rotation:360,duration:9,repeat:Math.max(1,Math.ceil(t.dur/9)),ease:"none"},at+.4);
  tl.to(id+" .ring2",{rotation:-180,duration:6,repeat:Math.max(1,Math.ceil(t.dur/6)),ease:"none"},at+.4);
  tl.to(id+" .burstcore",{scale:1.05,duration:1.2,yoyo:true,repeat:rep,ease:"sine.inOut"},at+.8);
  tl.to(id+" .sidepanel",{y:-14,rotate:2,duration:1.6,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.6)),ease:"sine.inOut"},at+.9);
  // --- page turn: the scene is revealed by a page swinging away on its right edge ---
  tl.fromTo(id+" .pageflip",{rotationY:0,opacity:1},
            {rotationY:-118,duration:.44,ease:"power3.inOut"},at);
  tl.fromTo(id+" .pgshine",{xPercent:-60,opacity:.9},
            {xPercent:70,opacity:0,duration:.44,ease:"power2.out"},at);
  tl.set(id+" .pageflip",{opacity:0},at+.45);
  // --- camera: arrive from depth, then a continuous slow push (no static frames) ---
  tl.fromTo("#w"+(t.i+2),{scale:1.18,z:-260,rotationX:7,opacity:0},
                          {scale:1,z:0,rotationX:0,opacity:1,duration:.72,ease:"power3.out"},at+.22);
  tl.to("#w"+(t.i+2),{scale:1.06,duration:Math.max(.6,t.dur-.72),ease:"none"},at+.72);
  // parallax: background particles drift against the camera for depth
  tl.to(id+" .fx",{z:-90,scale:1.10,duration:t.dur,ease:"none"},at);
  // gradient shimmer travels through the accent words once the line has landed
  tl.fromTo(id+" .glitch-base .hl",{backgroundPosition:"100% 0"},
            {backgroundPosition:"0% 0",duration:1.15,ease:"power2.inOut"},at+.95);
  // --- pattern interrupts: reset attention mid-scene so the curve never flattens ---
  // punch-in on the scene itself (cheapest interrupt, needs no new art)
  tl.to(id,{scale:1.06,duration:.16,ease:"power2.out"},at+t.dur*0.46)
    .to(id,{scale:1.0,duration:.52,ease:"power2.out"},at+t.dur*0.62);
  // a second, smaller kick on the headline late in the scene
  tl.to(id+" .headline",{scale:1.05,duration:.15,ease:"power2.out"},at+t.dur*0.76)
    .to(id+" .headline",{scale:1,duration:.42,ease:"elastic.out(1,.6)"},at+t.dur*0.76+.15);
  rgbcut(id,at);
});
// outro
flash(OUTRO_AT);
tl.from("#sOut .logoBig",{scale:.4,opacity:0,rotate:-10,duration:.7,ease:"back.out(1.7)"},OUTRO_AT+.05);
tl.from("#sOut .brandBig",{y:60,opacity:0,duration:.6,ease:"power3.out"},OUTRO_AT+.35);
tl.from("#sOut .brandTag",{y:40,opacity:0,duration:.5,ease:"power2.out"},OUTRO_AT+.6);
tl.from("#sOut .follow",{scale:.6,opacity:0,duration:.5,ease:"back.out(2)"},OUTRO_AT+.8);
tl.to("#sOut .follow",{scale:1.06,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},OUTRO_AT+1.3);
window.__timelines["main"] = tl;
</script>
</body>
</html>`;
  return page;
}
