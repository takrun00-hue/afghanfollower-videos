// Platform marks + a large ghosted backdrop illustration.
// The hook says which app the tutorial is for at a glance, and no step frame is
// left as empty paper — a big, faint engraving sits behind the device.
export const MARKS = {
  tiktok: `<path d="M118 34c8 12 20 20 35 22v26c-14-1-27-6-38-14v52c0 30-24 54-54 54S7 150 7 120s24-54 54-54c3 0 6 0 9 1v27c-3-1-6-2-9-2-15 0-27 12-27 28s12 28 27 28 27-12 27-28V34z"/>`,
  instagram: `<rect x="14" y="14" width="132" height="132" rx="38"/><circle cx="80" cy="80" r="32"/><circle cx="118" cy="42" r="3"/>`,
  tools: `<circle cx="80" cy="46" r="20"/><circle cx="36" cy="112" r="20"/><circle cx="124" cy="112" r="20"/>
    <path d="M66 60 50 98M94 60l16 38M56 112h48"/>`,
  news: `<rect x="18" y="34" width="110" height="96" rx="10"/><path d="M128 58h22a10 10 0 0 1 10 10v52a10 10 0 0 1-20 0V58z"/>
    <path d="M34 56h56M34 76h78M34 96h78M34 114h50"/>`,
  general: `<circle cx="80" cy="46" r="20"/><circle cx="36" cy="112" r="20"/><circle cx="124" cy="112" r="20"/>
    <path d="M66 60 50 98M94 60l16 38M56 112h48"/>`,
  ai: `<rect x="40" y="40" width="80" height="80" rx="14"/><rect x="62" y="62" width="36" height="36" rx="6"/>
    <path d="M60 18v22M80 18v22M100 18v22M60 120v22M80 120v22M100 120v22M18 60h22M18 80h22M18 100h22M120 60h22M120 80h22M120 100h22"/>`,
};

// filled marks read better small (TikTok / Instagram are filled brand shapes)
const FILLED = new Set(["tiktok"]);

export function platformMark(platform, color, size = 120) {
  const body = MARKS[platform] || MARKS.general;
  const filled = FILLED.has(platform);
  return `<svg class="pmark" width="${size}" height="${size}" viewBox="0 0 160 160"
    fill="${filled ? color : "none"}" stroke="${filled ? "none" : color}" stroke-width="9"
    stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

export const MARK_CSS = `
.markwrap{display:grid;place-items:center;width:150px;height:150px;border-radius:42px;
  background:rgba(255,255,255,.85);border:3px solid rgba(20,30,50,.10);
  box-shadow:0 18px 40px rgba(30,20,10,.18);margin-bottom:26px}
.markwrap .pmark{width:96px;height:96px}
/* a large, faint engraving so no frame reads as blank paper */
.backdrop{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);z-index:0;
  opacity:.10;pointer-events:none}
.backdrop svg{width:940px;height:940px}
`;
