// Content-driven concept graphics.
// Instead of dressing every video in the same step-card template, we read what
// the feature is ABOUT and build a graphic that means that thing: a retention
// video shows a real graph with a cliff; an audio video shows a waveform being
// swapped; a photo-to-video tool shows a before→after transform. The teaching
// steps stay the same underneath — this changes the hero and the visual language
// so the design is generated from the content, not stamped on top of it.
//
// Every hero uses the same small set of animation hooks so one generic animator
// (in the builder timeline) drives all of them under the seek-safe renderer:
//   .mfx    – pops in, staggered
//   .mbar   – grows from its base (waveform / chart bars)
//   .mdraw  – its child strokes draw on
//   .mpulse – gentle heartbeat
//   .mknob  – slides right (a switch turning on)

// Which concept a feature belongs to, inferred from its id/name/steps. The id
// checks come first (most specific); keywords are the safety net for new topics.
export function motifFor(pack) {
  const id = (pack.id || "").toLowerCase();
  const hay = (
    id + " " + (pack.feature || "") + " " + (pack.hook?.l1 || "") + " " +
    (pack.hook?.l2 || "") + " " + (pack.tips || []).map((t) => t.head || "").join(" ")
  ).toLowerCase();
  const has = (...w) => w.some((x) => hay.includes(x));

  if (/retention|insight|analytic|health-rating/.test(id) || has("نمودار", "ماندگار", "نگه‌داشت", "آمار", "امتیاز", "افت"))
    return "chart";
  if (/audio|suno|eleven|podcast|dub|voice|music/.test(id) || has("موسیقی", "صدا", "دوبله", "آهنگ", "روایت"))
    return "audio";
  if (/keyword|search-insight/.test(id) || has("جستجو", "کلمه", "کلمات کلیدی"))
    return "search";
  if (/kling|cleanup|removebg|upscayl|photopea|descript|reels-template/.test(id) || has("قبل", "بعد", "پس‌زمینه", "واضح", "تبدیل"))
    return "transform";
  if (/translate|dubbing|ai-translate/.test(id) || has("زبان", "ترجمه", "ترجمهٔ"))
    return "translate";
  if (/reorder|pin-post|grid/.test(id) || has("چیدمان", "بچین", "سنجاق", "مرتب"))
    return "grid";
  if (/schedule|meta-schedule/.test(id) || has("زمان‌بندی", "زمان بندی", "تقویم", "ساعت انتشار"))
    return "schedule";
  if (/qa|hidden-words|close-friends|trial-reels|broadcast/.test(id) || has("روشن کن", "فعال", "خاموش", "پنهان"))
    return "toggle";
  return "generic";
}

// A representative emblem name (reuses the builder's existing ART set) so the
// faint backdrop of every scene also echoes the concept.
export function backdropIconFor(motif) {
  return {
    chart: "chart", audio: "music", search: "magnet", transform: "wand",
    translate: "globe", grid: "layers", schedule: "calendar", toggle: "bolt",
  }[motif] || "star";
}

// pathLength normalises each stroke so one dash length draws them all.
const draw = (svg) =>
  svg.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)\b/g, '<$1 pathLength="1"');

// ---- the concept heroes ------------------------------------------------------
// Each returns markup coloured by two inline vars: --d (deep ink) and --a (accent).
export function heroGraphic(motif, PAIR) {
  const style = `--d:${PAIR[0]};--a:${PAIR[1]}`;
  const body = HEROES[motif] ? HEROES[motif]() : "";
  if (!body) return "";
  return `<div class="hero" style="${style}">${body}</div>`;
}

const svg = (inner, extra = "") =>
  `<svg class="mdraw" viewBox="0 0 200 200" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}>${draw(inner)}</svg>`;

const HEROES = {
  // a graph that climbs, then a line that falls off a cliff with a marked point
  chart: () => svg(`
    <line class="maxis" x1="26" y1="24" x2="26" y2="164" stroke="var(--d)" stroke-width="4"/>
    <line class="maxis" x1="26" y1="164" x2="182" y2="164" stroke="var(--d)" stroke-width="4"/>
    <rect class="mbar" x="44"  y="96"  width="26" height="68"  rx="6" fill="var(--d)" opacity=".85"/>
    <rect class="mbar" x="80"  y="72"  width="26" height="92"  rx="6" fill="var(--d)" opacity=".85"/>
    <rect class="mbar" x="116" y="118" width="26" height="46"  rx="6" fill="var(--a)"/>
    <rect class="mbar" x="152" y="138" width="26" height="26"  rx="6" fill="var(--a)"/>
    <path class="mline" d="M44 60 L92 48 L120 118 L176 150" stroke="var(--a)" stroke-width="6"/>
    <circle class="mpulse" cx="120" cy="118" r="12" fill="#fff" stroke="var(--a)" stroke-width="6"/>
  `),

  // a waveform whose bars pulse, with a circular "swap" arrow over it
  audio: () => {
    const hs = [30, 58, 84, 46, 96, 120, 74, 108, 52, 88, 34];
    const bars = hs.map((h, i) => {
      const x = 20 + i * 16, y = 100 - h / 2;
      return `<rect class="mbar" x="${x}" y="${y}" width="9" height="${h}" rx="4.5" fill="${i % 2 ? "var(--a)" : "var(--d)"}"/>`;
    }).join("");
    return svg(`${bars}
      <path class="mline" d="M150 150 a26 26 0 1 1 -12 -22" stroke="var(--a)" stroke-width="6"/>
      <path class="mline" d="M138 122 l4 14 -15 -2" stroke="var(--a)" stroke-width="6"/>
    `, `style="overflow:visible"`);
  },

  // a search bar with a magnifier and three result chips dropping in
  search: () => svg(`
    <rect class="mfx" x="20" y="34" width="160" height="48" rx="24" fill="#fff" stroke="var(--d)" stroke-width="5"/>
    <circle class="mline" cx="50" cy="58" r="14" stroke="var(--a)" stroke-width="6"/>
    <line class="mline" x1="61" y1="69" x2="74" y2="82" stroke="var(--a)" stroke-width="6"/>
    <rect class="mfx" x="20"  y="104" width="160" height="26" rx="13" fill="var(--d)" opacity=".16"/>
    <rect class="mfx" x="20"  y="140" width="120" height="26" rx="13" fill="var(--a)"/>
    <rect class="mfx" x="20"  y="176" width="150" height="18" rx="9"  fill="var(--d)" opacity=".16"/>
  `),

  // before → after: a blurry card becomes a crisp one, sparkle on the result
  transform: () => svg(`
    <rect class="mfx" x="14"  y="60" width="70" height="90" rx="12" fill="var(--d)" opacity=".28"/>
    <circle class="mfx" cx="49" cy="92" r="15" fill="#fff" opacity=".6"/>
    <path   class="mfx" d="M22 150 q27 -34 54 0" fill="#fff" opacity=".5"/>
    <path class="mline" d="M92 105 h30 m-12 -10 l12 10 -12 10" stroke="var(--d)" stroke-width="6"/>
    <rect class="mfx" x="116" y="60" width="70" height="90" rx="12" fill="none" stroke="var(--a)" stroke-width="6"/>
    <circle class="mfx" cx="151" cy="92" r="15" fill="var(--a)"/>
    <path   class="mfx" d="M124 150 q27 -34 54 0" fill="var(--a)" opacity=".85"/>
    <path class="mpulse" d="M150 30 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" fill="var(--a)"/>
  `),

  // a switch turning on, with a check
  toggle: () => svg(`
    <rect class="mtrack" x="34" y="78" width="132" height="60" rx="30" fill="var(--a)" opacity=".22"/>
    <rect x="34" y="78" width="132" height="60" rx="30" fill="none" stroke="var(--a)" stroke-width="5"/>
    <circle class="mknob" cx="66" cy="108" r="24" fill="var(--a)"/>
    <path class="mline" d="M58 108 l7 8 14 -16" stroke="#fff" stroke-width="6" transform="translate(0,0)"/>
  `),

  // nine tiles; one lifts to be rearranged
  grid: () => {
    const t = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const lift = r === 0 && c === 2;
      t.push(`<rect class="${lift ? "mpulse" : "mfx"}" x="${34 + c * 46}" y="${34 + r * 46}" width="36" height="36" rx="9"
        fill="${lift ? "var(--a)" : "var(--d)"}" opacity="${lift ? 1 : .8}"/>`);
    }
    return svg(t.join(""));
  },

  // a globe with two language chips
  translate: () => svg(`
    <circle class="mline" cx="86" cy="100" r="58" stroke="var(--d)" stroke-width="5"/>
    <ellipse class="mline" cx="86" cy="100" rx="24" ry="58" stroke="var(--d)" stroke-width="4"/>
    <line class="mline" x1="28" y1="100" x2="144" y2="100" stroke="var(--d)" stroke-width="4"/>
    <line class="mline" x1="36" y1="72"  x2="136" y2="72"  stroke="var(--d)" stroke-width="4"/>
    <line class="mline" x1="36" y1="128" x2="136" y2="128" stroke="var(--d)" stroke-width="4"/>
    <rect class="mfx" x="118" y="28" width="62" height="40" rx="12" fill="var(--a)"/>
    <rect class="mfx" x="132" y="150" width="56" height="38" rx="12" fill="var(--d)"/>
  `),

  // a calendar with a clock badge and a checked date
  schedule: () => svg(`
    <rect class="mfx" x="26" y="40" width="148" height="132" rx="16" fill="#fff" stroke="var(--d)" stroke-width="5"/>
    <rect class="mfx" x="26" y="40" width="148" height="34" rx="16" fill="var(--d)"/>
    <line class="maxis" x1="60" y1="30" x2="60" y2="52" stroke="var(--d)" stroke-width="6"/>
    <line class="maxis" x1="140" y1="30" x2="140" y2="52" stroke="var(--d)" stroke-width="6"/>
    <rect class="mfx" x="44"  y="90"  width="22" height="20" rx="5" fill="var(--d)" opacity=".2"/>
    <rect class="mfx" x="80"  y="90"  width="22" height="20" rx="5" fill="var(--d)" opacity=".2"/>
    <rect class="mfx" x="44"  y="124" width="22" height="20" rx="5" fill="var(--a)"/>
    <circle class="mpulse" cx="140" cy="140" r="34" fill="#fff" stroke="var(--a)" stroke-width="6"/>
    <path class="mline" d="M140 122 v20 l14 8" stroke="var(--a)" stroke-width="6"/>
  `),
};

export const MOTIF_CSS = `
/* ---------- content-driven concept hero ---------- */
.hero{position:relative;width:520px;height:520px;display:grid;place-items:center}
.hero .mdraw{width:100%;height:100%;overflow:visible;
  filter:drop-shadow(0 26px 44px rgba(30,20,10,.20))}
.hero .mdraw>*{stroke-dasharray:1;stroke-dashoffset:0}
.hero .mbar{transform-box:fill-box;transform-origin:50% 100%}
.hero .mknob{transform-box:fill-box}
/* the hook shows the hero larger, floating over the paper */
.hookpreview .hero{width:560px;height:520px}
`;
