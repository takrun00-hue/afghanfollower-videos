// Content-driven concept graphics for the WHOLE video.
//
// These are meant to be appealing illustrations that literally depict the topic
// — a video camera for a media kit, text that types itself for a teleprompter,
// a waveform for audio — not minimal wireframes. Filled friendly shapes, the
// two brand colours plus soft tints, a baked ground shadow for depth, and a
// small motion accent per concept. Each draws its OWN object, so the silhouette
// alone tells the concepts apart.
//
// The graphic advances across the four steps. Shared animation hooks let one
// seek-safe animator drive them all:
//   .mfx pops in · .mbar grows · .mdr strokes draw · .mpulse beats ·
//   .mcaret blinks · .mghost sits faint until a later step

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
  if (/media-kit|health-rating|qa\b/.test(id) || has("مدیا کیت", "رزومه", "امتیاز")) return "camera";
  if (/teleprompter|capcut-captions|hidden-words|saved-repl/.test(id) || has("تله‌پرامپتر", "زیرنویس", "بنویس", "کلمه‌ها")) return "type";
  if (/carousel|reels-template|add-yours/.test(id) || has("اسلاید", "کاروسل", "قالب")) return "slides";
  if (/story-highlight|close-friends|trial-reels|broadcast|collab/.test(id) || has("استوری", "هایلایت", "دوستان", "کانال", "دو پیج")) return "story";
  if (/toggle|close|enable/.test(id) || has("روشن کن", "فعال", "خاموش")) return "toggle";
  return "chart";
}

export function backdropIconFor(motif) {
  return {
    chart: "chart", audio: "music", search: "magnet", transform: "wand",
    translate: "globe", grid: "layers", schedule: "calendar", toggle: "bolt",
    camera: "camera", type: "pen", slides: "layers", story: "heart",
  }[motif] || "star";
}

const draw = (s) =>
  s.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)\b/g, '<$1 pathLength="1"');
const upto = (step, total, count) =>
  step < 0 ? count : Math.min(count, Math.max(1, Math.round(((step + 1) / total) * count)));
const shadow = (cx, ry = 15) =>
  `<ellipse cx="${cx}" cy="236" rx="94" ry="${ry}" fill="var(--d)" opacity=".12"/>`;

export function conceptGraphic(motif, PAIR, step = -1, total = 4) {
  const P = { d: PAIR[0], a: PAIR[1] };
  const inner = (BUILDERS[motif] || BUILDERS.chart)(P, step, total);
  return `<div class="hero hero-${motif}" style="--d:${P.d};--a:${P.a}">
    <svg viewBox="0 0 240 260" fill="none" stroke-linecap="round" stroke-linejoin="round"
      style="overflow:visible">${draw(inner)}</svg></div>`;
}
export const heroGraphic = (motif, PAIR) => conceptGraphic(motif, PAIR, -1, 4);

export function stepStage(motif, PAIR, { step, total, iconSVG = "", markSVG = "" }) {
  return `<div class="stage stage-${motif}">
    <span class="stage-badge">${markSVG}</span>
    ${conceptGraphic(motif, PAIR, step, total)}
    <span class="stage-ico">${iconSVG}</span>
  </div>`;
}

const BUILDERS = {
  // ── a video camera: media kit = you as a creator on camera + your numbers ──
  camera: (P, step, total) => {
    const live = upto(step, total, 3);
    const stats = [26, 40, 56].map((h, i) => {
      const ghost = i >= live;
      return `<rect class="${ghost ? "mghost" : "mbar"}" x="${150 + i * 20}" y="${196 - h}" width="14" height="${h}" rx="7"
        fill="${i === 2 ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .16 : .92}"/>`;
    }).join("");
    return `${shadow(96)}
      <rect class="mfx" x="30" y="96" width="150" height="100" rx="22" fill="var(--d)"/>
      <path class="mfx" d="M180 128 l40 -24 v72 l-40 -24z" fill="var(--d)" opacity=".8"/>
      <rect class="mfx" x="74" y="72" width="48" height="26" rx="9" fill="var(--d)"/>
      <circle class="mfx" cx="96" cy="146" r="42" fill="#fff"/>
      <circle class="mfx" cx="96" cy="146" r="31" fill="var(--a)"/>
      <circle class="mfx" cx="96" cy="146" r="15" fill="var(--d)"/>
      <circle cx="84" cy="134" r="7" fill="#fff" opacity=".85"/>
      <circle class="mpulse" cx="158" cy="118" r="9" fill="#ff4d5e"/>
      ${stats}`;
  },

  // ── text that types itself: a caret advances, lines appear ────────────────
  type: (P, step, total) => {
    const live = upto(step, total, 3);
    let lines = "", caret = "";
    const ws = [150, 118, 158];
    for (let i = 0; i < 3; i++) {
      const ghost = i >= live, active = step >= 0 ? i === live - 1 : i === 2;
      const w = active ? Math.round(ws[i] * 0.62) : ws[i];
      lines += `<rect class="${ghost ? "mghost" : "mfx"}" x="46" y="${104 + i * 32}" width="${w}" height="18" rx="9"
        fill="${active ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .16 : (active ? 1 : .5)}"/>`;
      if (active && !ghost)
        caret = `<rect class="mcaret" x="${46 + w + 8}" y="${101 + i * 32}" width="8" height="24" rx="3" fill="var(--a)"/>`;
    }
    return `${shadow(120, 12)}
      <rect class="mfx" x="30" y="46" width="180" height="168" rx="22" fill="#fff" stroke="var(--d)" stroke-width="4"/>
      <rect class="mfx" x="30" y="46" width="180" height="34" rx="22" fill="var(--a)"/>
      <circle cx="50" cy="63" r="5" fill="#fff"/><circle cx="68" cy="63" r="5" fill="#fff" opacity=".7"/>
      ${lines}${caret}
      <path class="mdr" d="M150 214 l40 -40 14 14 -40 40 -18 4z" fill="var(--a)"/>
      <path class="mdr" d="M190 174 l14 14" stroke="#fff" stroke-width="3"/>`;
  },

  // ── waveform on a soft glow, with a mic and a swap arrow ──────────────────
  audio: (P, step, total) => {
    const hs = [28, 58, 92, 48, 112, 138, 86, 118, 62, 98, 38, 72, 44];
    const active = step < 0 ? -1 : Math.round((step / Math.max(1, total - 1)) * (hs.length - 1));
    const bars = hs.map((h, i) => {
      const x = 26 + i * 15, y = 150 - h / 2, on = i === active;
      const fill = on ? "var(--a)" : (i % 2 ? "var(--a)" : "var(--d)");
      const op = on || step < 0 ? 1 : (i <= active ? .95 : .36);
      return `<rect class="mbar${on ? " mpulse" : ""}" x="${x}" y="${y}" width="9" height="${h}" rx="4.5" fill="${fill}" opacity="${op}"/>`;
    }).join("");
    return `<ellipse cx="120" cy="150" rx="128" ry="92" fill="var(--a)" opacity=".07"/>
      ${bars}
      <path class="mdr" d="M198 234 a28 28 0 1 1 -13 -24" stroke="var(--a)" stroke-width="7"/>
      <path class="mdr" d="M185 204 l5 15 -16 -1" stroke="var(--a)" stroke-width="7"/>`;
  },

  // ── a big magnifier + keyword chips + a sparkle ───────────────────────────
  search: (P, step, total) => {
    const live = upto(step, total, 3);
    const chips = [[42, 158, 150], [42, 196, 116], [42, 234, 158]].map(([x, y, w], i) => {
      const ghost = i >= live, on = step >= 0 && i === live - 1;
      return `<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="${x}" y="${y}" width="${w}" height="26" rx="13"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .14 : (on ? 1 : .22)}"/>`;
    }).join("");
    return `${shadow(112, 12)}
      <circle class="mfx" cx="110" cy="84" r="56" fill="#fff" stroke="var(--d)" stroke-width="9"/>
      <circle class="mfx" cx="110" cy="84" r="30" fill="var(--a)" opacity=".18"/>
      <circle class="mdr" cx="110" cy="84" r="30" stroke="var(--a)" stroke-width="7"/>
      <line class="mfx" x1="150" y1="124" x2="196" y2="170" stroke="var(--d)" stroke-width="14"/>
      <path class="mpulse" d="M176 40 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" fill="var(--a)"/>
      ${chips}`;
  },

  // ── before → after photo cards + a magic wand ─────────────────────────────
  transform: (P, step, total) => {
    const s = step < 0 ? 3 : step;
    return `${shadow(120)}
      <rect class="mfx" x="14" y="78" width="94" height="120" rx="16" fill="var(--d)" opacity=".22"/>
      <circle class="mfx" cx="42" cy="150" r="14" fill="#fff" opacity=".7"/>
      <path class="mfx" d="M24 198 q34 -40 68 0" fill="#fff" opacity=".5"/>
      ${s >= 1 ? `<path class="mdr" d="M112 140 h34 m-13 -12 l13 12 -13 12" stroke="var(--d)" stroke-width="7"/>` : ""}
      ${s >= 2
        ? `<rect class="mfx" x="134" y="78" width="94" height="120" rx="16" fill="#fff" stroke="var(--a)" stroke-width="7"/>
           <circle class="mfx" cx="196" cy="120" r="16" fill="#ffd24a"/>
           <path class="mfx" d="M146 198 q34 -46 92 0 v0 h-92z" fill="var(--a)"/>
           <path class="mfx" d="M162 168 q20 -26 44 -6" stroke="#fff" stroke-width="6"/>`
        : `<rect class="mghost" x="134" y="78" width="94" height="120" rx="16" fill="none" stroke="var(--d)" stroke-width="4" opacity=".14"/>`}
      <path class="mpulse" d="M150 44 l6 15 15 6 -15 6 -6 15 -6 -15 -15 -6 15 -6z" fill="var(--a)" opacity="${s >= 3 ? 1 : .2}"/>`;
  },

  toggle: (P, step, total) => {
    const frac = step < 0 ? 1 : (step + 1) / total, on = frac >= 1;
    const cx = 76 + frac * 88;
    return `${shadow(120, 12)}
      <rect class="mfx" x="46" y="112" width="148" height="74" rx="37" fill="var(--a)" opacity="${.16 + frac * .26}"/>
      <rect class="mdr" x="46" y="112" width="148" height="74" rx="37" fill="none" stroke="var(--a)" stroke-width="6"/>
      <circle class="mfx" cx="${cx}" cy="149" r="31" fill="var(--a)"/>
      <circle cx="${cx - 9}" cy="140" r="8" fill="#fff" opacity=".7"/>
      ${on ? `<path class="mdr" d="M${cx - 12} 149 l8 10 17 -20" stroke="#fff" stroke-width="7"/>` : ""}`;
  },

  grid: (P, step, total) => {
    const active = step < 0 ? -1 : Math.min(8, step * 2 + 2);
    const tints = ["var(--d)", "var(--a)", "var(--d)"];
    let t = "";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const i = r * 3 + c, on = i === active;
      const y = on ? 60 + r * 52 - 14 : 60 + r * 52;
      t += `<rect class="${on ? "mpulse" : "mfx"}" x="${52 + c * 52}" y="${y}" width="44" height="44" rx="12"
        fill="${on ? "var(--a)" : tints[(r + c) % 3]}" opacity="${on ? 1 : (i % 2 ? .82 : .5)}"/>`;
    }
    return `${shadow(120)}${t}`;
  },

  translate: (P, step, total) => {
    const live = upto(step, total, 3);
    const chips = [["A", 150, 44, "var(--a)"], ["文", 162, 188, "var(--d)"], ["ع", 22, 198, "var(--a)"]]
      .map(([, x, y, f], i) => `<rect class="${i >= live ? "mghost" : "mfx"}" x="${x}" y="${y}" width="66" height="42" rx="14"
        fill="${f}" opacity="${i >= live ? .14 : 1}"/>`).join("");
    return `${shadow(104)}
      <circle class="mfx" cx="104" cy="120" r="66" fill="var(--a)" opacity=".16"/>
      <circle class="mdr" cx="104" cy="120" r="66" stroke="var(--d)" stroke-width="6"/>
      <ellipse class="mdr" cx="104" cy="120" rx="28" ry="66" stroke="var(--d)" stroke-width="5"/>
      <line class="mdr" x1="38" y1="120" x2="170" y2="120" stroke="var(--d)" stroke-width="5"/>
      <line class="mdr" x1="48" y1="86" x2="160" y2="86" stroke="var(--d)" stroke-width="5"/>
      <line class="mdr" x1="48" y1="154" x2="160" y2="154" stroke="var(--d)" stroke-width="5"/>
      ${chips}`;
  },

  schedule: (P, step, total) => {
    const live = upto(step, total, 4);
    let cells = "";
    for (let i = 0; i < 4; i++) {
      const on = step >= 0 && i === live - 1, ghost = i >= live;
      const x = 54 + (i % 2) * 46, y = 120 + Math.floor(i / 2) * 40;
      cells += `<rect class="${ghost ? "mghost" : "mfx"}${on ? " mpulse" : ""}" x="${x}" y="${y}" width="30" height="28" rx="7"
        fill="${on ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .14 : (on ? 1 : .24)}"/>`;
    }
    const clock = step < 0 || step === total - 1;
    return `${shadow(108)}
      <rect class="mfx" x="30" y="54" width="152" height="150" rx="18" fill="#fff" stroke="var(--d)" stroke-width="5"/>
      <rect class="mfx" x="30" y="54" width="152" height="40" rx="18" fill="var(--a)"/>
      <rect class="mfx" x="58" y="42" width="10" height="26" rx="5" fill="var(--d)"/>
      <rect class="mfx" x="144" y="42" width="10" height="26" rx="5" fill="var(--d)"/>
      ${cells}
      ${clock ? `<circle class="mpulse" cx="184" cy="196" r="42" fill="#fff" stroke="var(--a)" stroke-width="7"/>
        <path class="mdr" d="M184 172 v24 l16 10" stroke="var(--a)" stroke-width="7"/>` : ""}`;
  },

  // ── fanned photo cards + progress dots ────────────────────────────────────
  slides: (P, step, total) => {
    const active = step < 0 ? 0 : Math.min(2, step % 3);
    const cards = [[-14, -6], [8, 0], [30, 6]].map(([dx, rot], i) => {
      const on = i === active;
      return `<g transform="translate(${44 + dx} ${52 + i * 4}) rotate(${rot} 90 100)">
        <rect class="${on ? "mfx mpulse" : "mghost"}" x="0" y="0" width="132" height="164" rx="16"
          fill="${on ? "#fff" : "var(--d)"}" stroke="${on ? "var(--a)" : "none"}" stroke-width="7" opacity="${on ? 1 : .2}"/>
        ${on ? `<rect x="14" y="14" width="104" height="80" rx="10" fill="var(--a)" opacity=".22"/>
                <circle cx="44" cy="54" r="16" fill="var(--a)"/>
                <path d="M18 94 q28 -34 100 0z" fill="var(--a)" opacity=".5"/>
                <rect x="18" y="112" width="80" height="14" rx="7" fill="var(--a)"/>
                <rect x="18" y="134" width="52" height="10" rx="5" fill="var(--d)" opacity=".4"/>` : ""}
      </g>`;
    }).join("");
    const dots = [0, 1, 2, 3].map((i) =>
      `<circle class="mfx" cx="${90 + i * 22}" cy="248" r="8" fill="${i === (step < 0 ? 0 : step) ? "var(--a)" : "var(--d)"}" opacity="${i === (step < 0 ? 0 : step) ? 1 : .3}"/>`
    ).join("");
    return `${shadow(120)}${cards}${dots}`;
  },

  // ── story rings with little avatars + add button ──────────────────────────
  story: (P, step, total) => {
    const active = step < 0 ? 0 : Math.min(3, step);
    const rings = [0, 1, 2, 3].map((i) => {
      const on = i === active, cx = 54 + i * 44;
      return `<g opacity="${on || step < 0 ? 1 : .45}">
        <circle class="${on ? "mpulse" : "mfx"}" cx="${cx}" cy="92" r="${on ? 30 : 24}" fill="none"
          stroke="${on ? "var(--a)" : "var(--d)"}" stroke-width="${on ? 8 : 6}"/>
        <circle cx="${cx}" cy="92" r="${on ? 20 : 16}" fill="var(--a)" opacity=".2"/>
        <circle cx="${cx}" cy="${on ? 86 : 88}" r="${on ? 8 : 6}" fill="var(--d)"/>
        <path d="M${cx - (on ? 12 : 9)} ${on ? 104 : 102} a${on ? 12 : 9} ${on ? 11 : 9} 0 0 1 ${on ? 24 : 18} 0z" fill="var(--d)"/>
      </g>`;
    }).join("");
    return `${shadow(120)}${rings}
      <circle class="mfx" cx="120" cy="192" r="44" fill="var(--a)" opacity=".14"/>
      <path class="mdr" d="M120 170 v44 M98 192 h44" stroke="var(--a)" stroke-width="8"/>`;
  },

  chart: (P, step, total) => {
    const vals = [86, 120, 64, 40];
    const live = upto(step, total, 4);
    const grid = [78, 118, 158, 198].map((y) => `<line x1="36" y1="${y}" x2="216" y2="${y}" stroke="var(--d)" stroke-width="2" opacity=".10"/>`).join("");
    const bars = vals.map((h, i) => {
      const on = step >= 0 && i === live - 1, ghost = i >= live;
      return `<rect class="${ghost ? "mghost" : "mbar"}${on ? " mpulse" : ""}" x="${46 + i * 44}" y="${216 - h}" width="30" height="${h}" rx="8"
        fill="${on || i >= 2 ? "var(--a)" : "var(--d)"}" opacity="${ghost ? .14 : .92}"/>`;
    }).join("");
    const line = step < 0 || step === total - 1;
    return `${shadow(120, 12)}
      <rect class="mfx" x="22" y="40" width="200" height="176" rx="20" fill="#fff" stroke="var(--d)" stroke-width="4"/>
      ${grid}
      ${bars}
      ${line ? `<path class="mdr" d="M52 96 L106 78 L142 152 L206 188" stroke="var(--a)" stroke-width="6"/>
        <circle class="mpulse" cx="142" cy="152" r="13" fill="#fff" stroke="var(--a)" stroke-width="6"/>` : ""}`;
  },
};

export const MOTIF_CSS = `
/* ---------- content-driven concept graphic ---------- */
.hero{position:relative;width:100%;height:100%;display:grid;place-items:center}
.hero svg{width:100%;height:100%;filter:drop-shadow(0 22px 40px rgba(30,20,10,.18))}
.hero .mdr{stroke-dasharray:1;stroke-dashoffset:0}
.hero .mbar{transform-box:fill-box;transform-origin:50% 100%}
.hero .mpulse{transform-box:fill-box;transform-origin:center}
.hookpreview .hero{width:540px;height:480px}
.stage{position:relative;width:500px;height:600px;display:grid;place-items:center;z-index:2}
.stage .hero{width:100%;height:100%}
.stage-badge{position:absolute;top:6px;left:6px;z-index:4;display:grid;place-items:center;
  width:66px;height:66px;border-radius:19px;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.16)}
.stage-badge svg{width:42px;height:42px}
.stage-ico{position:absolute;top:2px;right:2px;z-index:4;width:104px;height:104px;
  display:grid;place-items:center;opacity:.92;filter:drop-shadow(0 8px 16px rgba(30,20,10,.18))}
.stage-ico .illo{width:80px;height:80px}
`;
