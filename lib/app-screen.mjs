// Recognisable in-app screens and tool cards.
//
// The point is that the viewer should RECOGNISE the screen when they open the
// app, and be able to FIND a tool by sight. Real screenshots are not available
// here — there is no app access and no account, and stock screenshots from the
// web are the wrong language, the wrong version, and someone else's copyright.
// So these are faithful recreations: the platform's real chrome, the real
// English labels from the step's path, the target row highlighted with a
// pointer — which is what a person actually matches against when hunting a menu.
//
// Tools get a browser frame with the real URL and the tool's own wordmark and
// brand colour, because that is what people recognise on a landing page.

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Platform chrome. Instagram is light, TikTok is dark — getting this wrong is
// the fastest way to make a mock look fake.
const SKIN = {
  instagram: { bg: "#ffffff", fg: "#141414", sub: "#8e8e8e", line: "#dbdbdb", accent: "#E1306C" },
  tiktok: { bg: "#121212", fg: "#ffffff", sub: "#8a8b91", line: "#2a2a2e", accent: "#25F4EE" },
  tools: { bg: "#ffffff", fg: "#141414", sub: "#6b7280", line: "#e5e7eb", accent: "#0e7490" },
};

// A phone screen: title bar, a list of real English rows, the target highlighted.
export function appScreen(platform, { title, rows = [], hit = 0 }) {
  const s = SKIN[platform] || SKIN.tools;
  const list = rows
    .map((r, i) => {
      const on = i === hit;
      return `<div class="asrow${on ? " on" : ""}">
        <span class="asico"></span>
        <span class="astext">${esc(r)}</span>
        <span class="aschev"></span>
      </div>`;
    })
    .join("");
  return `<div class="ascreen" style="--bg:${s.bg};--fg:${s.fg};--sub:${s.sub};--line:${s.line};--acc:${s.accent}">
    <div class="asbar"><span class="asback"></span><span class="astitle">${esc(title)}</span></div>
    <div class="aslist">${list}</div>
    <span class="astap"></span>
  </div>`;
}

// A browser card carrying the tool's own name and colour, so it is findable.
export function toolCard({ name, url, color = "#0e7490", tagline = "" }) {
  return `<div class="tcard" style="--brand:${color}">
    <div class="tbar"><i></i><i></i><i></i><span class="turl">${esc(url)}</span></div>
    <div class="tbody">
      <span class="tmark">${esc(name.slice(0, 2)).toUpperCase()}</span>
      <span class="tname">${esc(name)}</span>
      ${tagline ? `<span class="ttag">${esc(tagline)}</span>` : ""}
      <span class="tcta">${esc(url.replace(/^https?:\/\//, ""))}</span>
    </div>
  </div>`;
}

export const APP_SCREEN_CSS = `
/* ---------- recreated in-app screen ---------- */
.ascreen{direction:ltr;position:relative;width:430px;height:530px;border-radius:34px;overflow:hidden;
  background:var(--bg);border:5px solid rgba(20,20,20,.16);
  box-shadow:0 30px 62px rgba(30,20,10,.26);display:flex;flex-direction:column}
.asbar{direction:ltr;display:flex;align-items:center;gap:16px;padding:22px 22px 18px;
  border-bottom:2px solid var(--line);flex:none}
.asback{width:20px;height:20px;border-left:4px solid var(--fg);border-bottom:4px solid var(--fg);
  transform:rotate(45deg);border-radius:3px;opacity:.9;flex:none}
.astitle{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:30px;color:var(--fg);
  direction:ltr}
.aslist{display:flex;flex-direction:column;gap:12px;padding:18px 18px;flex:none}
.asrow{display:flex;align-items:center;gap:14px;padding:20px 16px;border-radius:14px;
  background:color-mix(in srgb, var(--fg) 5%, transparent);border:2px solid transparent}
.asrow.on{background:color-mix(in srgb, var(--acc) 16%, var(--bg));border-color:var(--acc)}
.asico{width:30px;height:30px;border-radius:9px;background:color-mix(in srgb,var(--fg) 22%,transparent);flex:none}
.asrow.on .asico{background:var(--acc)}
.astext{flex:1;text-align:left;direction:ltr;font-family:"Baloo","Vazirmatn",sans-serif;
  font-weight:700;font-size:26px;color:var(--fg)}
.asrow.on .astext{font-weight:900}
.aschev{width:12px;height:12px;border-right:3px solid var(--sub);border-top:3px solid var(--sub);
  transform:rotate(45deg);flex:none}
/* the finger that lands on the highlighted row */
.astap{position:absolute;left:330px;top:214px;width:56px;height:56px;border-radius:50%;
  background:color-mix(in srgb,var(--acc) 34%,transparent);border:5px solid var(--acc);opacity:0}

/* ---------- tool card: the tool's own name and colour ---------- */
.tcard{direction:ltr;position:relative;width:470px;height:470px;border-radius:26px;overflow:hidden;background:#fff;
  border:4px solid rgba(20,20,20,.14);box-shadow:0 30px 62px rgba(30,20,10,.24);
  display:flex;flex-direction:column}
.tbar{direction:ltr;height:58px;display:flex;align-items:center;gap:10px;padding:0 20px;background:#f1f3f5;
  border-bottom:2px solid #e5e7eb;flex:none}
.tbar i{width:13px;height:13px;border-radius:50%;background:#c9ced6}
.turl{margin-left:16px;direction:ltr;font-family:"Baloo","Vazirmatn",sans-serif;font-weight:700;
  font-size:23px;color:#4b5563;background:#fff;border-radius:999px;padding:6px 20px;flex:1;
  text-align:center;overflow:hidden;white-space:nowrap}
.tbody{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  padding:26px}
.tmark{width:120px;height:120px;border-radius:32px;background:var(--brand);color:#fff;
  display:grid;place-items:center;direction:ltr;
  font-family:"Baloo","Vazirmatn",sans-serif;font-weight:900;font-size:58px;
  box-shadow:0 16px 34px color-mix(in srgb,var(--brand) 45%,transparent)}
.tname{direction:ltr;font-family:"Baloo","Vazirmatn",sans-serif;font-weight:900;font-size:52px;
  color:#141414}
.ttag{direction:ltr;font-weight:700;font-size:26px;color:#6b7280;text-align:center}
.tcta{direction:ltr;font-weight:800;font-size:26px;color:#fff;background:var(--brand);
  border-radius:999px;padding:12px 30px;margin-top:6px}
`;

// The hook for an app video: the platform's mark, big, with the feature name.
// Previously the hook borrowed slide 1's screen, so the hook and the first two
// steps were three near-identical dark phone lists in a row. A large logo also
// does what a hook must: says in one glance which app this is for.
export function platformHero(platform, markSVG, name) {
  const s = SKIN[platform] || SKIN.tools;
  return `<div class="phero" style="--acc:${s.accent}">
    <span class="phalo"></span>
    <span class="pheromark">${markSVG}</span>
    ${name ? `<span class="pheroname">${esc(name)}</span>` : ""}
  </div>`;
}

export const PLATFORM_HERO_CSS = `
.phero{position:relative;width:440px;height:440px;display:grid;place-items:center}
.phalo{position:absolute;width:400px;height:400px;border-radius:50%;
  background:radial-gradient(circle,color-mix(in srgb,var(--acc) 30%,transparent),transparent 68%)}
.pheromark{position:relative;display:grid;place-items:center;width:300px;height:300px;
  border-radius:84px;background:#fff;box-shadow:0 34px 70px rgba(30,20,10,.26);
  border:5px solid color-mix(in srgb,var(--acc) 34%,#fff)}
.pheromark svg{width:190px;height:190px}
.pheroname{position:absolute;bottom:-8px;direction:ltr;
  font-family:"Baloo","Vazirmatn",sans-serif;font-weight:900;font-size:40px;color:#fff;
  background:var(--acc);border-radius:999px;padding:10px 34px;
  box-shadow:0 14px 30px rgba(30,20,10,.28);white-space:nowrap}
`;
