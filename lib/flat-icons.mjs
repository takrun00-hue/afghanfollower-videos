// Simple flat symbolic icons for the new "cartoon mascot" video style
// (2026-09-07 owner-directed pivot away from real-screenshot-in-phone-frame).
// Bold black outline, one or two flat fills, no hatching/engraving texture —
// matches the reference reels: an eye for views, a compass for the algorithm,
// stick people for the audience, etc. viewBox is 0 0 200 200 for every icon so
// they drop into the same wrapper regardless of which one a scene needs.

const FLAT = {
  eye: `<ellipse cx="100" cy="100" rx="70" ry="42" fill="#EDEFF5" stroke="#20242E" stroke-width="7"/>
    <circle cx="100" cy="100" r="30" fill="#3B4B66" stroke="#20242E" stroke-width="7"/>
    <circle cx="110" cy="90" r="8" fill="#fff"/>`,
  compass: `<circle cx="100" cy="100" r="76" fill="#EDEFF5" stroke="#20242E" stroke-width="7"/>
    <path d="M100 34 116 96 100 166 84 96z" fill="#5B8DEF" stroke="#20242E" stroke-width="6" stroke-linejoin="round"/>
    <path d="M34 100 96 84 166 100 96 116z" fill="#B7C4DE" stroke="#20242E" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="100" cy="100" r="10" fill="#20242E"/>`,
  growth: `<path d="M24 160h152" stroke="#20242E" stroke-width="7" stroke-linecap="round"/>
    <path d="M24 160 70 112l30 26 66-70" stroke="#3B8F5C" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M136 46h34v34" stroke="#3B8F5C" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  person: `<circle cx="100" cy="66" r="30" fill="#FBEFE0" stroke="#20242E" stroke-width="7"/>
    <path d="M46 168a54 54 0 0 1 108 0" fill="#5B8DEF" stroke="#20242E" stroke-width="7"/>`,
  personPlus: `<circle cx="86" cy="60" r="28" fill="#FBEFE0" stroke="#20242E" stroke-width="7"/>
    <path d="M36 160a50 50 0 0 1 100 0" fill="#5B8DEF" stroke="#20242E" stroke-width="7"/>
    <circle cx="156" cy="146" r="30" fill="#3B8F5C" stroke="#20242E" stroke-width="6"/>
    <path d="M156 132v28M142 146h28" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  heart: `<path d="M100 168C40 128 22 100 22 70a36 36 0 0 1 78-14 36 36 0 0 1 78 14c0 30-18 58-78 98z"
      fill="#E4574C" stroke="#20242E" stroke-width="7" stroke-linejoin="round"/>`,
  comment: `<path d="M22 40h156v88H84l-38 32v-32H22z" fill="#EDEFF5" stroke="#20242E" stroke-width="7" stroke-linejoin="round"/>
    <path d="M48 70h104M48 96h64" stroke="#20242E" stroke-width="8" stroke-linecap="round"/>`,
  share: `<path d="M24 100 176 34l-30 132-42-40z" fill="#5B8DEF" stroke="#20242E" stroke-width="7" stroke-linejoin="round"/>
    <path d="M24 100l80 26 42-92" stroke="#20242E" stroke-width="6" fill="none" stroke-linejoin="round"/>`,
  bookmark: `<path d="M54 24h92a8 8 0 0 1 8 8v144l-54-42-54 42V32a8 8 0 0 1 8-8z" fill="#F5A524" stroke="#20242E" stroke-width="7" stroke-linejoin="round"/>`,
  trash: `<path d="M50 66h100l-10 108a12 12 0 0 1-12 10H72a12 12 0 0 1-12-10z" fill="#B7C4DE" stroke="#20242E" stroke-width="7" stroke-linejoin="round"/>
    <path d="M34 66h132M78 66l8-24h28l8 24" stroke="#20242E" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M84 88v62M116 88v62" stroke="#20242E" stroke-width="7" stroke-linecap="round"/>`,
  phoneBlank: `<rect x="52" y="14" width="96" height="172" rx="22" fill="#fff" stroke="#20242E" stroke-width="7"/>
    <rect x="64" y="34" width="72" height="132" rx="4" fill="#EDEFF5"/>
    <circle cx="100" cy="178" r="5" fill="#20242E"/>`,
  clock: `<circle cx="100" cy="100" r="76" fill="#EDEFF5" stroke="#20242E" stroke-width="7"/>
    <path d="M100 56v46l32 20" stroke="#20242E" stroke-width="9" fill="none" stroke-linecap="round"/>`,
  calendar: `<rect x="26" y="40" width="148" height="134" rx="12" fill="#EDEFF5" stroke="#20242E" stroke-width="7"/>
    <path d="M26 78h148" stroke="#20242E" stroke-width="7"/>
    <path d="M62 24v28M138 24v28" stroke="#20242E" stroke-width="9" stroke-linecap="round"/>
    <rect x="46" y="98" width="26" height="26" rx="5" fill="#5B8DEF"/>
    <rect x="87" y="98" width="26" height="26" rx="5" fill="#B7C4DE"/>
    <rect x="128" y="98" width="26" height="26" rx="5" fill="#B7C4DE"/>
    <rect x="46" y="134" width="26" height="26" rx="5" fill="#B7C4DE"/>
    <rect x="87" y="134" width="26" height="26" rx="5" fill="#F5A524"/>
  `,
  lightbulb: `<path d="M100 26a52 52 0 0 0-30 94c6 6 8 10 8 16h44c0-6 2-10 8-16A52 52 0 0 0 100 26z" fill="#F5A524" stroke="#20242E" stroke-width="7"/>
    <path d="M82 150h36M86 164h28M92 176h16" stroke="#20242E" stroke-width="7" stroke-linecap="round"/>`,
  gear: `<circle cx="100" cy="100" r="34" fill="#B7C4DE" stroke="#20242E" stroke-width="7"/>
    <circle cx="100" cy="100" r="14" fill="#fff" stroke="#20242E" stroke-width="6"/>
    <path d="M100 20v26M100 154v26M20 100h26M154 100h26M42 42l18 18M140 140l18 18M158 42l-18 18M60 140l-18 18"
      stroke="#20242E" stroke-width="12" stroke-linecap="round"/>`,
  megaphone: `<path d="M30 84v32l28 8 60 34V44L58 76z" fill="#5B8DEF" stroke="#20242E" stroke-width="7" stroke-linejoin="round"/>
    <path d="M118 60c20 8 20 60 0 68" stroke="#20242E" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M58 124l10 42h22l-8-36" fill="#F5A524" stroke="#20242E" stroke-width="7" stroke-linejoin="round"/>`,
};

export const flatIcon = (key, extra = "") =>
  `<svg class="ficon ${extra}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${FLAT[key] || FLAT.growth}</svg>`;

export const FLAT_ICON_KEYS = Object.keys(FLAT);
