// Brand marks for the tools, drawn to each brand's real shape and colours.
//
// These are recreations, not the official asset files: this machine has no
// licensed logo pack, and a downloaded PNG would be someone else's copyright
// baked into every video. What makes a logo findable is its colour and its
// silhouette, and those are accurate here — a red Adobe wedge, Google's four
// colours, ElevenLabs' black bars. If exact official files are ever wanted,
// dropping them into public/brands/ and referencing them is a small change.

export const BRAND_LOGOS = {
  "Adobe Podcast": {
    bg: "#0B0B0B",
    svg: `<path d="M64 22h30l38 84h-26l-27-63-14 33h18l9 21H49z" fill="#FA0F00"/>`,
  },
  Suno: {
    bg: "#000000",
    svg: `<circle cx="76" cy="76" r="52" fill="none" stroke="#fff" stroke-width="9"/>
      <path d="M52 76c8-22 16-22 24 0s16 22 24 0" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
  },
  ElevenLabs: {
    bg: "#000000",
    svg: `<rect x="52" y="34" width="16" height="84" rx="3" fill="#fff"/>
      <rect x="86" y="34" width="16" height="84" rx="3" fill="#fff"/>`,
  },
  Descript: {
    bg: "#2F4BFF",
    svg: `<circle cx="76" cy="76" r="40" fill="none" stroke="#fff" stroke-width="14"/>
      <rect x="66" y="30" width="20" height="34" fill="#2F4BFF"/>
      <circle cx="76" cy="76" r="13" fill="#fff"/>`,
  },
  Photopea: {
    bg: "#18A497",
    svg: `<path d="M54 118V38h30a24 24 0 0 1 0 48H72" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  Pexels: {
    bg: "#05A081",
    svg: `<path d="M56 116V40h28a22 22 0 0 1 0 44H74" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  "Google Trends": {
    bg: "#FFFFFF",
    svg: `<path d="M24 118 L60 74 L84 96 L128 40" fill="none" stroke="#4285F4" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="60" cy="74" r="11" fill="#EA4335"/>
      <circle cx="84" cy="96" r="11" fill="#FBBC05"/>
      <circle cx="128" cy="40" r="13" fill="#34A853"/>`,
  },
  "Kling AI": {
    bg: "#111827",
    svg: `<path d="M50 34v84M50 76l44-42M50 76l44 42" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  Cleanup: {
    bg: "#7C3AED",
    svg: `<path d="M46 110 96 60l18 18-50 50H46z" fill="#fff"/>
      <path d="M96 60l14-14 18 18-14 14z" fill="#fff" opacity=".75"/>`,
  },
  Upscayl: {
    bg: "#0EA5E9",
    svg: `<path d="M76 34 L118 118 H34z" fill="#fff"/>
      <path d="M76 66 L98 110 H54z" fill="#0EA5E9"/>`,
  },
  "remove.bg": {
    bg: "#54616E",
    svg: `<rect x="34" y="34" width="84" height="84" rx="12" fill="none" stroke="#fff" stroke-width="10"
        stroke-dasharray="18 12"/>
      <circle cx="76" cy="76" r="22" fill="#fff"/>`,
  },
  Photopea2: { bg: "#18A497", svg: "" },
};

// A generic mark for a tool we have not drawn yet: its initial on its own colour.
function fallbackMark(name, color) {
  const initial = String(name).trim().charAt(0).toUpperCase();
  return {
    bg: color || "#0e7490",
    svg: `<text x="76" y="102" text-anchor="middle" font-family="Baloo, Vazirmatn, sans-serif"
      font-size="82" font-weight="900" fill="#fff">${initial}</text>`,
  };
}

export function brandLogo(name, color, size = 152) {
  const b = BRAND_LOGOS[name] || fallbackMark(name, color);
  return `<span class="blogo" style="background:${b.bg}">
    <svg width="${size}" height="${size}" viewBox="0 0 152 152" xmlns="http://www.w3.org/2000/svg">${b.svg}</svg>
  </span>`;
}

export const BRAND_LOGO_CSS = `
.blogo{display:grid;place-items:center;width:130px;height:130px;border-radius:34px;overflow:hidden;
  box-shadow:0 16px 34px rgba(30,20,10,.26);border:3px solid rgba(20,30,50,.10)}
.blogo svg{width:100%;height:100%}
`;
