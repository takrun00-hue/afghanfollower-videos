// Content-driven concept graphics for the WHOLE video.
//
// The first version failed because every concept was "a few horizontal bars in
// the same white card", so profile and script looked identical at a glance and
// only the colour changed. The fix: each concept draws its OWN frame and its own
// dominant silhouette — a dark teleprompter screen, an ID card with a big ringed
// avatar, a vertical waveform, a split before/after, a calendar, a globe. No
// shared white card. So even before you read the text, the shape tells you what
// the video is about, and no two motifs read the same.
//
// The graphic ADVANCES across the four steps. Shared animation hooks let one
// seek-safe animator drive them all:
//   .mfx pops in · .mbar grows from base · .mdr strokes draw · .mpulse beats ·
//   .mghost sits faint (revealed on a later step)

export function motifFor(pack) {
  const id = (pack.id || "").toLowerCase();
  const hay = (
    id + " " + (pack.feature || "") + " " + (pack.hook?.l1 || "") + " " +
    (pack.hook?.l2 || "") + " " + (pack.tips || []).map((t) => t.head || "").join(" ")
  ).toLowerCase();
  const has = (...w) => w.some((x) => hay.includes(x));

  if (/retention|insight|search-insight/.test(id) || has("نمودار", "ماندگار", "نگه‌داشت", "افت")) return "chart";
  if (/audio|suno|eleven|podcast|dub|voice|music|reply-video/.test(id) || has("موسیقی", "صدا", "دوبله", "آهنگ", "روایت")) return "audio";
  if (/keyword/.test(id) || has("جستجو", "کلمهٔ", "کلمات کلیدی", "پیدا شو")) return "search";
  if (/kling|cleanup|removebg|upscayl|photopea|descript|green-screen|photo-mode/.test(id) || has("قبل", "بعد", "پس‌زمینه", "واضح")) return "transform";
  if (/translate|dubbing/.test(id) || has("زبان", "ترجمه")) return "translate";
  if (/reorder|pin-post|grid|pin-comment/.test(id) || has("چیدمان", "بچین", "سنجاق", "مرتب")) return "grid";
  if (/schedule/.test(id) || has("زمان‌بندی", "زمان بندی", "تقویم", "ساعت انتشار")) return "schedule";
  if (/media-kit|health-rating|qa\b/.test(id) || has("مدیا کیت", "رزومه", "امتیاز")) return "profile";
  if (/teleprompter|capcut-captions|hidden-words|saved-repl/.test(id) || has("تله‌پرامپتر", "زیرنویس", "بنویس", "کلمه‌ها")) return "script";
  if (/carousel|reels-template|add-yours/.test(id) || has("اسلاید", "کاروسل", "قالب")) return "slides";
  if (/story-highlight|close-friends|trial-reels|broadcast|collab/.test(id) || has("استوری", "هایلایت", "دوستان", "کانال", "دو پیج")) return "story";
  if (/toggle|close|enable/.test(id) || has("روشن کن", "فعال", "خاموش")) return "toggle";
  return "chart";
}

export function backdropIconFor(motif) {
  return {
    chart: "chart", audio: "music", search: "magnet", transform: "wand",
    translate: "globe", grid: "layers", schedule: "calendar", toggle: "bolt",
    profile: "user", script: "pen", slides: "layers", story: "heart",
  }[motif] || "star";
}

const draw = (s) =>
  s.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)\b/g, '<$1 pathLength="1"');

// how many items are "live" (revealed) at this step for progressive concepts
const upto = (step, total, count) =>
  step < 0 ? count : Math.min(count, Math.max(1, Math.round(((step + 1) / total) * count)));

// the concept graphic, advanced to `step` (step<0 = whole/hook state)
export function conceptGraphic(motif, PAIR, step = -1, total = 4) {
  const P = { d: PAIR[0], a: PAIR[1] };
  const inner = (BUILDERS[motif] || BUILDERS.chart)(P, step, total);
  return `<div class="hero hero-${motif}" style="--d:${P.d};--a:${P.a}">
    <svg viewBox="0 0 240 280" fill="none" stroke-linecap="round" stroke-linejoin="round"
      style="overflow:visible">${draw(inner)}</svg></div>`;
}
export const heroGraphic = (motif, PAIR) => conceptGraphic(motif, PAIR, -1, 4);

// the full step stage: the self-framed concept graphic + platform badge + the
// step's own icon (so the specific action still reads). No shared white card.
export function stepStage(motif, PAIR, { step, total, iconSVG = "", markSVG = "" }) {
  return `<div class="stage stage-${motif}">
    <span class="stage-badge">${markSVG}</span>
    ${conceptGraphic(motif, PAIR, step, total)}
    <span class="stage-ico">${iconSVG}</span>
  </div>`;
}

const BUILDERS = {
  // ── vertical waveform on a soft glow (frameless) ──────────────────────────
  audio: (P, step, total) => {
    const hs = [30, 60, 92, 50, 110, 140, 88, 120, 64, 100, 40, 74, 46];
    const active = step < 0 ? -1 : Math.round((step / Math.max(1, total - 1)) * (hs.length - 1));
    const bars = hs.map((h, i) => {
      const x = 20 + i * 16, y = 150 - h / 2, on = i === active;
      const fill = on ? "var(--a)" : (i % 2 ? "var(--a)" : "var(--d)");
      const op = on || step < 0 ? 1 : (i <= active ? .95 : .38);
      return `<rect class="mbar${on ? " mpulse" : ""}" x="${x}" y="${y}" width="9" height="${h}" rx="4.5" fill="${fill}" opacity="${op}"/>`;
    }).join("");
    return `<ellipse cx="120" cy="150" rx="130" ry="96" fill="var(--a)" opacity=".07"/>${bars}
      <path class="mdr" d="M198 236 a30 30 0 1 1 -14 -26" stroke="var(--a)" stroke-width="7"/>
      <path class="mdr" d="M184 204 l5 16 -17 -1" stroke="var(--a)" stroke-width="7"/>`;
  },

  // ── analytics: blueprint panel, axis, growing columns, cliff line ─────────
  chart: (P, step, total) => {
    const vals = [86, 120, 64, 40];
    const live = upto(step, total, 4);
    const grid = [70, 110, 150, 190].map((y) => `<line x1="34" y1="${y}" x2="214" y2="${y}" stroke="var(--d)" stroke-width="2" opacity=".10"/>`).join("");
    const bars = vals.map((h, i) => {
      const on = step >= 0 && i === live - 1, ghost = i >= live;
      return `<rect class="${ghost ? "mghost" : "mbar"}${on ? " mpulse" : ""}" x="${44 + i * 44}" y="${214 - h}" width="30" height="${h}" rx="7"
        fill="${on || i >= 2 ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .14 : .92}"/>`;
    }).join("");
    const line = step < 0 || step === total - 1;
    return `<rect x="20" y="34" width="200" height="212" rx="20" fill="#fff" stroke="var(--d)" stroke-width="4" opacity=".96"/>
      ${grid}
      <line class="mdr" x1="34" y1="46" x2="34" y2="214" stroke="var(--d)" stroke-width="4"/>
      <line class="mdr" x1="34" y1="214" x2="214" y2="214" stroke="var(--d)" stroke-width="4"/>
      ${bars}
      ${line ? `<path class="mdr" d="M50 92 L104 74 L140 150 L204 186" stroke="var(--a)" stroke-width="6"/>
        <circle class="mpulse" cx="140" cy="150" r="13" fill="#fff" stroke="var(--a)" stroke-width="6"/>` : ""}`;
  },

  // ── a huge magnifier dominates; keyword chips reveal one per step ─────────
  search: (P, step, total) => {
    const live = upto(step, total, 3);
    const chips = [[40, 150, 150], [40, 190, 118], [40, 230, 160]].map(([x, y, w], i) => {
      const ghost = i >= live, on = step >= 0 && i === live - 1;
      return `<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="${x}" y="${y}" width="${w}" height="26" rx="13"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .14 : (on ? 1 : .24)}"/>`;
    }).join("");
    return `<circle class="mdr" cx="112" cy="86" r="52" stroke="var(--d)" stroke-width="10" fill="#fff"/>
      <circle class="mdr" cx="112" cy="86" r="28" stroke="var(--a)" stroke-width="8"/>
      <line class="mdr" x1="150" y1="126" x2="196" y2="172" stroke="var(--d)" stroke-width="12"/>
      ${chips}`;
  },

  // ── before → arrow → after → sparkle, two distinct panels ────────────────
  transform: (P, step, total) => {
    const s = step < 0 ? 3 : step;
    return `<rect class="mfx" x="14" y="80" width="92" height="120" rx="16" fill="var(--d)" opacity=".26"/>
      <circle class="mfx" cx="60" cy="122" r="20" fill="#fff" opacity=".7"/>
      <path class="mfx" d="M26 200 q34 -44 68 0" fill="#fff" opacity=".55"/>
      ${s >= 1 ? `<path class="mdr" d="M112 140 h36 m-14 -13 l14 13 -14 13" stroke="var(--d)" stroke-width="7"/>` : ""}
      ${s >= 2
        ? `<rect class="mfx" x="134" y="80" width="92" height="120" rx="16" fill="#fff" stroke="var(--a)" stroke-width="7"/>
           <circle class="mfx" cx="180" cy="122" r="20" fill="var(--a)"/>
           <path class="mfx" d="M146 200 q34 -44 68 0" fill="var(--a)" opacity=".85"/>`
        : `<rect class="mghost" x="134" y="80" width="92" height="120" rx="16" fill="none" stroke="var(--d)" stroke-width="4" opacity=".14"/>`}
      ${s >= 3 ? `<path class="mpulse" d="M186 40 l7 16 16 7 -16 7 -7 16 -7 -16 -16 -7 16 -7z" fill="var(--a)"/>` : ""}`;
  },

  // ── a big switch sliding off → on ────────────────────────────────────────
  toggle: (P, step, total) => {
    const frac = step < 0 ? 1 : (step + 1) / total, on = frac >= 1;
    const cx = 74 + frac * 92;
    return `<rect class="mfx" x="44" y="112" width="152" height="72" rx="36" fill="var(--a)" opacity="${.14 + frac * .24}"/>
      <rect class="mdr" x="44" y="112" width="152" height="72" rx="36" fill="none" stroke="var(--a)" stroke-width="6"/>
      <circle class="mfx" cx="${cx}" cy="148" r="30" fill="var(--a)"/>
      ${on ? `<path class="mdr" d="M${cx - 12} 148 l8 10 17 -20" stroke="#fff" stroke-width="7"/>` : ""}`;
  },

  // ── nine tiles; the step-th lifts ────────────────────────────────────────
  grid: (P, step, total) => {
    const active = step < 0 ? -1 : Math.min(8, step * 2 + 2);
    let t = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const i = r * 3 + c, on = i === active;
      t += `<rect class="${on ? "mpulse" : "mfx"}" x="${50 + c * 52}" y="${64 + r * 52}" width="42" height="42" rx="11"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${on ? 1 : .82}"/>`;
    }
    return t;
  },

  // ── globe with language chips ────────────────────────────────────────────
  translate: (P, step, total) => {
    const live = upto(step, total, 3);
    const chips = [[150, 40, "var(--a)"], [160, 190, "var(--d)"], [24, 200, "var(--a)"]]
      .map(([x, y, f], i) => `<rect class="${i >= live ? "mghost" : "mfx"}" x="${x}" y="${y}" width="66" height="42" rx="13"
        fill="${f}" opacity="${i >= live ? .14 : 1}"/>`).join("");
    return `<circle class="mdr" cx="104" cy="128" r="66" stroke="var(--d)" stroke-width="6"/>
      <ellipse class="mdr" cx="104" cy="128" rx="28" ry="66" stroke="var(--d)" stroke-width="5"/>
      <line class="mdr" x1="38" y1="128" x2="170" y2="128" stroke="var(--d)" stroke-width="5"/>
      <line class="mdr" x1="48" y1="94" x2="160" y2="94" stroke="var(--d)" stroke-width="5"/>
      <line class="mdr" x1="48" y1="162" x2="160" y2="162" stroke="var(--d)" stroke-width="5"/>
      ${chips}`;
  },

  // ── calendar; a date fills each step, big clock badge at the end ─────────
  schedule: (P, step, total) => {
    const live = upto(step, total, 4);
    let cells = "";
    for (let i = 0; i < 4; i++) {
      const on = step >= 0 && i === live - 1, ghost = i >= live;
      const x = 52 + (i % 2) * 46, y = 118 + Math.floor(i / 2) * 40;
      cells += `<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="${x}" y="${y}" width="30" height="28" rx="6"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .14 : (on ? 1 : .24)}"/>`;
    }
    const clock = step < 0 || step === total - 1;
    return `<rect class="mfx" x="30" y="52" width="150" height="150" rx="18" fill="#fff" stroke="var(--d)" stroke-width="5"/>
      <rect class="mfx" x="30" y="52" width="150" height="38" rx="18" fill="var(--d)"/>
      ${cells}
      ${clock ? `<circle class="mpulse" cx="182" cy="196" r="42" fill="#fff" stroke="var(--a)" stroke-width="7"/>
        <path class="mdr" d="M182 172 v24 l16 10" stroke="var(--a)" stroke-width="7"/>` : ""}`;
  },

  // ── ID card: accent header, big ringed avatar, a stat gauge ──────────────
  profile: (P, step, total) => {
    const frac = step < 0 ? 1 : (step + 1) / total;
    const dash = (0.30 + frac * 0.55).toFixed(3); // gauge fills with progress
    return `<rect class="mfx" x="26" y="34" width="188" height="212" rx="22" fill="#fff" stroke="var(--d)" stroke-width="4"/>
      <path class="mfx" d="M26 56 a22 22 0 0 1 22 -22 h144 a22 22 0 0 1 22 22 v34 h-188z" fill="var(--a)"/>
      <circle cx="120" cy="120" r="50" fill="var(--d)" opacity=".10"/>
      <circle class="mdr" cx="120" cy="120" r="50" stroke="var(--a)" stroke-width="9"
        stroke-dasharray="${dash} 1" transform="rotate(-90 120 120)"/>
      <circle class="mfx" cx="120" cy="112" r="24" fill="var(--d)"/>
      <path class="mfx" d="M92 150 a28 26 0 0 1 56 0z" fill="var(--d)"/>
      <rect class="mbar" x="70"  y="196" width="46" height="20" rx="10" fill="var(--a)"/>
      <rect class="mbar" x="124" y="196" width="46" height="20" rx="10" fill="var(--d)" opacity=".5"/>`;
  },

  // ── teleprompter: DARK screen, bright scrolling lines, chevrons, REC dot ─
  script: (P, step, total) => {
    const live = upto(step, total, 4);
    const lines = [150, 172, 120, 158].map((w, i) => {
      const ghost = i >= live, on = step >= 0 && i === live - 1;
      return `<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="40" y="${86 + i * 30}" width="${w}" height="18" rx="9"
        fill="${on ? "var(--a)" : "#eaf1f7"}" opacity="${ghost ? .18 : (on ? 1 : .55)}"/>`;
    }).join("");
    return `<rect class="mfx" x="24" y="34" width="192" height="212" rx="20" fill="#141d2e"/>
      <rect x="24" y="34" width="192" height="212" rx="20" fill="none" stroke="var(--a)" stroke-width="4"/>
      <circle class="mpulse" cx="52" cy="60" r="9" fill="#ff4d5e"/>
      <rect x="70" y="52" width="60" height="16" rx="8" fill="#eaf1f7" opacity=".35"/>
      ${lines}
      <path class="mdr" d="M104 218 l16 14 16 -14" stroke="var(--a)" stroke-width="7"/>`;
  },

  // ── a fanned stack of cards, the active card forward + dots ──────────────
  slides: (P, step, total) => {
    const active = step < 0 ? 0 : Math.min(2, step % 3);
    const cards = [[-10, 2], [8, -1], [26, 3]].map(([dx, rot], i) => {
      const on = i === active;
      return `<g transform="translate(${40 + dx} ${54 + i * 6}) rotate(${rot} 90 110)">
        <rect class="${on ? "mfx mpulse" : "mghost"}" x="0" y="0" width="132" height="168" rx="16"
          fill="${on ? "#fff" : "var(--d)"}" stroke="${on ? "var(--a)" : "none"}" stroke-width="7" opacity="${on ? 1 : .2}"/>
        ${on ? `<rect x="20" y="112" width="80" height="16" rx="8" fill="var(--a)"/>
                <rect x="20" y="136" width="56" height="12" rx="6" fill="var(--d)" opacity=".4"/>` : ""}
      </g>`;
    }).join("");
    const dots = [0, 1, 2, 3].map((i) =>
      `<circle class="mfx" cx="${88 + i * 22}" cy="252" r="8" fill="${i === (step < 0 ? 0 : step) ? "var(--a)" : "var(--d)"}" opacity="${i === (step < 0 ? 0 : step) ? 1 : .3}"/>`
    ).join("");
    return `${cards}${dots}`;
  },

  // ── a row of story rings, active ring accents, add button ────────────────
  story: (P, step, total) => {
    const active = step < 0 ? 0 : Math.min(3, step);
    const rings = [0, 1, 2, 3].map((i) => {
      const on = i === active;
      return `<circle class="${on ? "mpulse" : "mfx"}" cx="${52 + i * 46}" cy="96" r="${on ? 30 : 24}"
        fill="none" stroke="${on ? "var(--a)" : "var(--d)"}" stroke-width="${on ? 8 : 6}" opacity="${on || step < 0 ? 1 : .4}"/>`;
    }).join("");
    return `${rings}
      <circle class="mfx" cx="120" cy="196" r="46" fill="var(--a)" opacity=".12"/>
      <path class="mdr" d="M120 172 v48 M96 196 h48" stroke="var(--a)" stroke-width="8"/>`;
  },
};

export const MOTIF_CSS = `
/* ---------- content-driven concept graphic ---------- */
.hero{position:relative;width:100%;height:100%;display:grid;place-items:center}
.hero svg{width:100%;height:100%;filter:drop-shadow(0 24px 44px rgba(30,20,10,.20))}
.hero .mdr{stroke-dasharray:1;stroke-dashoffset:0}
.hero .mbar{transform-box:fill-box;transform-origin:50% 100%}
.hero .mpulse{transform-box:fill-box;transform-origin:center}
.hookpreview .hero{width:540px;height:480px}
/* the step stage is now just a transparent sizing frame — each concept brings
   its own look, so no shared white card flattens them into the same design */
.stage{position:relative;width:500px;height:600px;display:grid;place-items:center;z-index:2}
.stage .hero{width:100%;height:100%}
.stage-badge{position:absolute;top:6px;left:6px;z-index:4;display:grid;place-items:center;
  width:66px;height:66px;border-radius:19px;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.16)}
.stage-badge svg{width:42px;height:42px}
.stage-ico{position:absolute;top:2px;right:2px;z-index:4;width:104px;height:104px;
  display:grid;place-items:center;opacity:.92;filter:drop-shadow(0 8px 16px rgba(30,20,10,.18))}
.stage-ico .illo{width:80px;height:80px}
`;
