// Content-driven concept graphics for the WHOLE video, not just the opening.
//
// Every video is classified into a concept, and that concept draws a single
// graphic that ADVANCES across the four steps: an audio video is a waveform
// whose active bar walks forward; a chart video fills one more column each step;
// a transform video reveals before → arrow → after → sparkle; a toggle video
// slides its switch from off to on. The hook shows the concept whole; each step
// shows the same concept progressed to that step, with the step's own icon and
// instruction. Nothing falls back to a generic phone card any more.
//
// Shared animation hooks (one seek-safe animator in the builder drives them all):
//   .mfx    – pops in, staggered      .mbar  – grows from its base
//   .mdr    – its stroke draws on      .mpulse – gentle heartbeat
//   .mghost – revealed later; sits faint and still

// ---- classify: every feature maps to a concept, never "generic" -------------
export function motifFor(pack) {
  const id = (pack.id || "").toLowerCase();
  const hay = (
    id + " " + (pack.feature || "") + " " + (pack.hook?.l1 || "") + " " +
    (pack.hook?.l2 || "") + " " + (pack.tips || []).map((t) => t.head || "").join(" ")
  ).toLowerCase();
  const has = (...w) => w.some((x) => hay.includes(x));

  if (/retention|insight|search-insight/.test(id) || has("نمودار", "ماندگار", "نگه‌داشت", "افت"))
    return "chart";
  if (/audio|suno|eleven|podcast|dub|voice|music|reply-video/.test(id) || has("موسیقی", "صدا", "دوبله", "آهنگ", "روایت"))
    return "audio";
  if (/keyword/.test(id) || has("جستجو", "کلمهٔ", "کلمات کلیدی", "پیدا شو"))
    return "search";
  if (/kling|cleanup|removebg|upscayl|photopea|descript|reels-template|green-screen|photo-mode/.test(id) || has("قبل", "بعد", "پس‌زمینه", "واضح"))
    return "transform";
  if (/translate|dubbing/.test(id) || has("زبان", "ترجمه"))
    return "translate";
  if (/reorder|pin-post|grid|pin-comment/.test(id) || has("چیدمان", "بچین", "سنجاق", "مرتب"))
    return "grid";
  if (/schedule/.test(id) || has("زمان‌بندی", "زمان بندی", "تقویم", "ساعت انتشار"))
    return "schedule";
  if (/media-kit|health-rating|qa\b/.test(id) || has("مدیا کیت", "رزومه", "امتیاز", "آمار"))
    return "profile";
  if (/teleprompter|capcut-captions|hidden-words|saved-repl/.test(id) || has("متن", "زیرنویس", "بنویس", "کلمه‌ها"))
    return "script";
  if (/carousel|reels-template|add-yours/.test(id) || has("اسلاید", "کاروسل", "قالب"))
    return "slides";
  if (/story-highlight|close-friends|trial-reels|broadcast|collab/.test(id) || has("استوری", "هایلایت", "دوستان", "کانال", "دو پیج"))
    return "story";
  if (/toggle|close|enable/.test(id) || has("روشن کن", "فعال", "خاموش"))
    return "toggle";
  return "chart";
}

// a faint scene-backdrop emblem that echoes the concept (reuses the ART set)
export function backdropIconFor(motif) {
  return {
    chart: "chart", audio: "music", search: "magnet", transform: "wand",
    translate: "globe", grid: "layers", schedule: "calendar", toggle: "bolt",
    profile: "user", script: "pen", slides: "layers", story: "heart",
  }[motif] || "star";
}

const draw = (svg) =>
  svg.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)\b/g, '<$1 pathLength="1"');

// conceptGraphic renders the concept advanced to `step` (0..total-1); step<0 is
// the whole-concept hook state.
export function conceptGraphic(motif, PAIR, step = -1, total = 4) {
  const P = { d: PAIR[0], a: PAIR[1] };
  const inner = (BUILDERS[motif] || BUILDERS.chart)(P, step, total);
  return `<div class="hero" style="--d:${P.d};--a:${P.a}">
    <svg viewBox="0 0 220 250" fill="none" stroke-linecap="round" stroke-linejoin="round"
      style="overflow:visible">${draw(inner)}</svg></div>`;
}
// keep the old name working for the hook call site
export const heroGraphic = (motif, PAIR) => conceptGraphic(motif, PAIR, -1, 4);

// how many "live" (non-ghost) items to show at a given step for progressive reveals
const upto = (step, total, count) =>
  step < 0 ? count : Math.min(count, Math.round(((step + 1) / total) * count));

const BUILDERS = {
  // waveform: the active bar walks forward across the steps
  audio: (P, step, total) => {
    const hs = [26, 52, 80, 44, 96, 120, 78, 104, 58, 86, 34, 64, 40];
    const active = step < 0 ? -1 : Math.round((step / Math.max(1, total - 1)) * (hs.length - 1));
    const bars = hs.map((h, i) => {
      const x = 14 + i * 15, y = 130 - h / 2;
      const on = i === active;
      const cls = on ? "mbar mpulse" : "mbar";
      const fill = on ? "var(--a)" : (i % 2 ? "var(--a)" : "var(--d)");
      const op = on || step < 0 ? 1 : (i <= active ? .9 : .4);
      return `<rect class="${cls}" x="${x}" y="${y}" width="8" height="${h}" rx="4" fill="${fill}" opacity="${op}"/>`;
    }).join("");
    return `${bars}
      <path class="mdr" d="M176 214 a30 30 0 1 1 -14 -25" stroke="var(--a)" stroke-width="6"/>
      <path class="mdr" d="M162 182 l5 16 -17 -2" stroke="var(--a)" stroke-width="6"/>`;
  },

  // a graph that fills one more column each step, line + cliff on the last
  chart: (P, step, total) => {
    const vals = [70, 96, 50, 30];
    const live = upto(step, total, 4);
    const bars = vals.map((h, i) => {
      const on = step >= 0 && i === live - 1;
      const ghost = i >= live;
      return `<rect class="${ghost ? "mghost" : "mbar"}${on ? " mpulse" : ""}" x="${40 + i * 40}" y="${168 - h}" width="28" height="${h}" rx="6"
        fill="${on || i >= 2 ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .16 : .9}"/>`;
    }).join("");
    const showLine = step < 0 || step === total - 1;
    return `
      <line class="mdr" x1="26" y1="26" x2="26" y2="168" stroke="var(--d)" stroke-width="4"/>
      <line class="mdr" x1="26" y1="168" x2="196" y2="168" stroke="var(--d)" stroke-width="4"/>
      ${bars}
      ${showLine ? `<path class="mdr" d="M40 66 L96 52 L128 122 L188 150" stroke="var(--a)" stroke-width="6"/>
      <circle class="mpulse" cx="128" cy="122" r="12" fill="#fff" stroke="var(--a)" stroke-width="6"/>` : ""}`;
  },

  // search bar + result chips revealing one per step
  search: (P, step, total) => {
    const live = upto(step, total, 4);
    const chips = [0, 1, 2, 3].map((i) => {
      const ghost = i >= live, on = step >= 0 && i === live - 1;
      const w = [150, 120, 160, 110][i];
      return `<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="30" y="${112 + i * 34}" width="${w}" height="24" rx="12"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .16 : (on ? 1 : .22)}"/>`;
    }).join("");
    return `
      <rect class="mfx" x="26" y="40" width="168" height="50" rx="25" fill="#fff" stroke="var(--d)" stroke-width="5"/>
      <circle class="mdr" cx="58" cy="65" r="15" stroke="var(--a)" stroke-width="6"/>
      <line class="mdr" x1="70" y1="77" x2="84" y2="91" stroke="var(--a)" stroke-width="6"/>
      ${chips}`;
  },

  // before → arrow → after → sparkle, revealed by step
  transform: (P, step, total) => {
    const s = step < 0 ? 3 : step;
    return `
      <rect class="mfx" x="16" y="78" width="78" height="100" rx="14" fill="var(--d)" opacity=".28"/>
      <circle class="mfx" cx="55" cy="112" r="17" fill="#fff" opacity=".6"/>
      <path class="mfx" d="M26 178 q29 -38 58 0" fill="#fff" opacity=".5"/>
      ${s >= 1 ? `<path class="mdr" d="M104 128 h30 m-12 -11 l12 11 -12 11" stroke="var(--d)" stroke-width="6"/>` : ""}
      ${s >= 2 ? `<rect class="mfx" x="126" y="78" width="78" height="100" rx="14" fill="none" stroke="var(--a)" stroke-width="6"/>
      <circle class="mfx" cx="165" cy="112" r="17" fill="var(--a)"/>
      <path class="mfx" d="M136 178 q29 -38 58 0" fill="var(--a)" opacity=".85"/>` :
        `<rect class="mghost" x="126" y="78" width="78" height="100" rx="14" fill="none" stroke="var(--d)" stroke-width="4" opacity=".16"/>`}
      ${s >= 3 ? `<path class="mpulse" d="M170 40 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="var(--a)"/>` : ""}`;
  },

  // a switch sliding from off toward on across the steps
  toggle: (P, step, total) => {
    const frac = step < 0 ? 1 : (step + 1) / total;
    const on = frac >= 1;
    const cx = 66 + frac * 88;
    return `
      <rect class="mfx" x="40" y="96" width="140" height="64" rx="32" fill="var(--a)" opacity="${.14 + frac * .2}"/>
      <rect class="mdr" x="40" y="96" width="140" height="64" rx="32" fill="none" stroke="var(--a)" stroke-width="5"/>
      <circle class="mfx" cx="${cx}" cy="128" r="26" fill="var(--a)"/>
      ${on ? `<path class="mdr" d="M${cx - 10} 128 l7 9 15 -18" stroke="#fff" stroke-width="6"/>` : ""}`;
  },

  // nine tiles; the step-th tile lifts and accents
  grid: (P, step, total) => {
    const active = step < 0 ? -1 : Math.min(8, step * 2 + 2);
    const t = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const i = r * 3 + c, on = i === active;
      t.push(`<rect class="${on ? "mpulse" : "mfx"}" x="${44 + c * 48}" y="${58 + r * 48}" width="38" height="38" rx="9"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${on ? 1 : .8}"/>`);
    }
    return t.join("");
  },

  // globe with language chips appearing one per step
  translate: (P, step, total) => {
    const live = upto(step, total, 3);
    const chips = [[128, 34, "var(--a)"], [140, 168, "var(--d)"], [30, 176, "var(--a)"]]
      .map(([x, y, f], i) => `<rect class="${i >= live ? "mghost" : "mfx"}" x="${x}" y="${y}" width="60" height="38" rx="12"
        fill="${f}" opacity="${i >= live ? .16 : 1}"/>`).join("");
    return `
      <circle class="mdr" cx="92" cy="112" r="58" stroke="var(--d)" stroke-width="5"/>
      <ellipse class="mdr" cx="92" cy="112" rx="24" ry="58" stroke="var(--d)" stroke-width="4"/>
      <line class="mdr" x1="34" y1="112" x2="150" y2="112" stroke="var(--d)" stroke-width="4"/>
      <line class="mdr" x1="42" y1="82" x2="142" y2="82" stroke="var(--d)" stroke-width="4"/>
      <line class="mdr" x1="42" y1="142" x2="142" y2="142" stroke="var(--d)" stroke-width="4"/>
      ${chips}`;
  },

  // a calendar filling one date per step, clock badge at the end
  schedule: (P, step, total) => {
    const live = upto(step, total, 4);
    const cells = [];
    for (let i = 0; i < 4; i++) {
      const on = step >= 0 && i === live - 1, ghost = i >= live;
      const x = 44 + (i % 2) * 40, y = 96 + Math.floor(i / 2) * 34;
      cells.push(`<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="${x}" y="${y}" width="24" height="22" rx="5"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .16 : (on ? 1 : .22)}"/>`);
    }
    const showClock = step < 0 || step === total - 1;
    return `
      <rect class="mfx" x="26" y="46" width="140" height="128" rx="16" fill="#fff" stroke="var(--d)" stroke-width="5"/>
      <rect class="mfx" x="26" y="46" width="140" height="32" rx="16" fill="var(--d)"/>
      ${cells.join("")}
      ${showClock ? `<circle class="mpulse" cx="160" cy="164" r="34" fill="#fff" stroke="var(--a)" stroke-width="6"/>
      <path class="mdr" d="M160 146 v18 l13 8" stroke="var(--a)" stroke-width="6"/>` : ""}`;
  },

  // a profile card whose stat bars grow one per step
  profile: (P, step, total) => {
    const live = upto(step, total, 3);
    const bars = [130, 96, 150].map((w, i) => {
      const ghost = i >= live, on = step >= 0 && i === live - 1;
      return `<rect class="${ghost ? "mghost" : "mbar"}${on ? " mpulse" : ""}" x="44" y="${132 + i * 30}" width="${w}" height="20" rx="10"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .16 : (on ? 1 : .5)}"/>`;
    }).join("");
    return `
      <rect class="mfx" x="26" y="30" width="168" height="200" rx="18" fill="#fff" stroke="var(--d)" stroke-width="5"/>
      <circle class="mfx" cx="110" cy="76" r="30" fill="var(--a)"/>
      <rect class="mfx" x="78" y="112" width="64" height="14" rx="7" fill="var(--d)" opacity=".5"/>
      ${bars}`;
  },

  // a script/document; the active line highlights, a camera badge watches
  script: (P, step, total) => {
    const live = upto(step, total, 4);
    const lines = [150, 168, 120, 158].map((w, i) => {
      const ghost = i >= live, on = step >= 0 && i === live - 1;
      return `<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="30" y="${96 + i * 30}" width="${w}" height="18" rx="9"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .16 : (on ? 1 : .4)}"/>`;
    }).join("");
    return `
      <rect class="mfx" x="22" y="40" width="176" height="188" rx="16" fill="#fff" stroke="var(--d)" stroke-width="5"/>
      <circle class="mfx" cx="170" cy="66" r="18" fill="var(--a)"/>
      <circle class="mfx" cx="170" cy="66" r="7" fill="#fff"/>
      ${lines}`;
  },

  // stacked carousel cards; the active card comes forward, dots track progress
  slides: (P, step, total) => {
    const active = step < 0 ? 2 : Math.min(3, step);
    const cards = [0, 1, 2].map((i) => {
      const on = i === active % 3;
      return `<rect class="${on ? "mfx mpulse" : "mghost"}" x="${44 + i * 14}" y="${44 + i * 12}" width="120" height="150" rx="14"
        fill="${on ? "#fff" : "var(--d)"}" stroke="${on ? "var(--a)" : "none"}" stroke-width="6" opacity="${on ? 1 : .18}"/>`;
    }).join("");
    const dots = [0, 1, 2, 3].map((i) =>
      `<circle class="mfx" cx="${80 + i * 20}" cy="222" r="7" fill="${i === active ? "var(--a)" : "var(--d)"}" opacity="${i === active ? 1 : .3}"/>`
    ).join("");
    return `${cards}
      <rect class="mfx" x="${44 + (active % 3) * 14 + 16}" y="150" width="70" height="14" rx="7" fill="var(--a)"/>
      ${dots}`;
  },

  // a row of story rings; the active ring accents
  story: (P, step, total) => {
    const active = step < 0 ? -1 : Math.min(3, step);
    const rings = [0, 1, 2, 3].map((i) => {
      const on = i === active;
      return `<circle class="${on ? "mpulse" : "mfx"}" cx="${48 + i * 42}" cy="110" r="${on ? 26 : 22}"
        fill="none" stroke="${on ? "var(--a)" : "var(--d)"}" stroke-width="${on ? 7 : 5}" opacity="${on || step < 0 ? 1 : .4}"/>`;
    }).join("");
    return `${rings}
      <circle class="mfx" cx="110" cy="188" r="30" fill="var(--a)" opacity=".14"/>
      <path class="mdr" d="M110 172 v32 M94 188 h32" stroke="var(--a)" stroke-width="6"/>`;
  },
};

export const MOTIF_CSS = `
/* ---------- content-driven concept graphic ---------- */
.hero{position:relative;width:100%;height:100%;display:grid;place-items:center}
.hero svg{width:100%;height:100%;filter:drop-shadow(0 22px 40px rgba(30,20,10,.18))}
.hero .mfx,.hero .mbar,.hero .mdr,.hero .mghost{}
.hero .mdr{stroke-dasharray:1;stroke-dashoffset:0}
.hero .mbar{transform-box:fill-box;transform-origin:50% 100%}
.hero .mpulse{transform-box:fill-box;transform-origin:center}
/* the hook shows the concept large and floating */
.hookpreview .hero{width:520px;height:470px}
/* the step stage: a soft concept panel (NOT a phone) that carries the graphic */
.stage{position:relative;width:470px;height:600px;border-radius:40px;padding:34px;
  background:linear-gradient(180deg,#fffdfa, color-mix(in srgb,var(--ink) 6%,#fff));
  border:3px solid color-mix(in srgb,var(--ink) 22%,#fff);
  box-shadow:0 34px 70px rgba(30,20,10,.20);display:grid;place-items:center;z-index:2}
.stage .hero{width:100%;height:100%}
.stage-badge{position:absolute;top:20px;left:20px;z-index:3;display:grid;place-items:center;
  width:64px;height:64px;border-radius:18px;background:#fff;box-shadow:0 8px 18px rgba(0,0,0,.14)}
.stage-badge svg{width:40px;height:40px}
.stage-ico{position:absolute;top:16px;right:16px;z-index:3;width:96px;height:96px;
  display:grid;place-items:center;opacity:.9}
.stage-ico .illo{width:76px;height:76px}
`;
