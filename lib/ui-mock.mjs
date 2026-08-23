// Stylised in-app UI mockups.
// Showing the actual screen the viewer must tap is both clearer than an abstract
// icon and far richer visually — it is the difference between "an icon of a
// camera" and "here is the exact row you press".
//
// Every mock is drawn in the editorial ink palette so it belongs to the design,
// not a screenshot pasted in.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// a list screen with one highlighted row (the thing being tapped)
function listScreen(ui, ink, MARK_SLOT = "") {
  const rows = (ui.rows || [])
    .map(
      (r, i) =>
        `<div class="prow${i === ui.hit ? " hit" : ""}"${i === ui.hit ? ` style="--hit:${ink}"` : ""}>
           <span class="pico"></span><span class="ptext">${esc(r)}</span><span class="pchev"></span>
         </div>`
    )
    .join("");
  return `
    <div class="ptop"><span class="pback"></span><span class="ptitle">${esc(ui.title || "")}</span>${MARK_SLOT}</div>
    <div class="plist">${rows}</div>`;
}

// a compose screen: media block + caption lines + primary action
function composeScreen(ui, ink, MARK_SLOT = "") {
  return `
    <div class="ptop"><span class="pback"></span><span class="ptitle">${esc(ui.title || "")}</span>${MARK_SLOT}</div>
    <div class="pmedia"><span class="pmedia-app">${MARK_SLOT}</span><span class="pmedia-mark"></span></div>
    <div class="pline w80"></div><div class="pline w60"></div>
    <div class="pcta" style="background:${ink}">${esc(ui.cta || "")}</div>`;
}

// the outcome: two avatars sharing one post, with a tick
function resultScreen(ui, ink, MARK_SLOT = "") {
  return `
    <div class="ptop"><span class="pback"></span><span class="ptitle">${esc(ui.title || "")}</span>${MARK_SLOT}</div>
    <div class="pduo">
      <span class="pav" style="border-color:${ink}"></span>
      <span class="plink" style="background:${ink}"></span>
      <span class="pav" style="border-color:${ink}"></span>
    </div>
    <div class="pmedia small"><span class="pmedia-app">${MARK_SLOT}</span><span class="pmedia-mark"></span></div>
    <div class="ptick" style="background:${ink}">✓</div>`;
}

// a comment thread with a reply-camera affordance
function commentScreen(ui, ink, MARK_SLOT = "") {
  const rows = (ui.rows || [])
    .map(
      (r, i) =>
        `<div class="pcmt${i === ui.hit ? " hit" : ""}">
           <span class="pav sm" style="border-color:${ink}"></span>
           <span class="pbubble">${esc(r)}</span>
           ${i === ui.hit ? `<span class="pcam" style="background:${ink}"></span>` : ""}
         </div>`
    )
    .join("");
  return `
    <div class="ptop"><span class="pback"></span><span class="ptitle">${esc(ui.title || "")}</span>${MARK_SLOT}</div>
    <div class="pcmts">${rows}</div>`;
}

// a desktop-style tool window (for web/app tools)
function toolScreen(ui, ink, MARK_SLOT = "") {
  return `
    <div class="pbar"><i></i><i></i><i></i><span class="purl">${esc(ui.url || "")}</span></div>
    <div class="pcompare">
      <span class="pshot before"><i class="pshot-img"></i><b class="pshot-tag">قبل</b></span>
      <span class="pshot after" style="border-color:${ink}">
        <i class="pshot-img"></i><b class="pshot-tag on" style="background:${ink}">بعد</b>
        <span class="pshot-app">${MARK_SLOT}</span>
      </span>
    </div>
    <div class="pcta" style="background:${ink}">${esc(ui.cta || "")}</div>`;
}

export function renderUI(ui, ink, appMark = "") {
  if (!ui) return "";
  const mark = appMark ? `<span class="papp">${appMark}</span>` : "";
  const body =
    ui.screen === "compose" ? composeScreen(ui, ink, mark) :
    ui.screen === "result" ? resultScreen(ui, ink, mark) :
    ui.screen === "comment" ? commentScreen(ui, ink, mark) :
    ui.screen === "tool" ? toolScreen(ui, ink, mark) :
    listScreen(ui, ink, mark);

  const frameClass = ui.screen === "tool" ? "pmock win" : "pmock";
  return `<div class="${frameClass}">
      <div class="pshadow"></div>
      <div class="pscreen">${body}</div>
      ${ui.hit != null || ui.tap ? '<div class="tap"><span class="ripple"></span><span class="finger"></span></div>' : ""}
    </div>`;
}

export const UI_CSS = `
/* ---------- in-app UI mockups ---------- */
.pmock{position:relative;width:430px;height:660px;border-radius:44px;padding:16px;
  background:#fdfbf7;border:4px solid var(--ink);box-shadow:0 34px 70px rgba(30,20,10,.26);
  display:flex;flex-direction:column}
.pmock.win{width:520px;height:520px;border-radius:22px;padding:0}
.pshadow{position:absolute;inset:12px;border-radius:36px;box-shadow:inset 0 0 40px rgba(18,58,99,.06);pointer-events:none}
.pscreen{flex:1;border-radius:32px;overflow:hidden;display:flex;flex-direction:column;gap:14px;padding:18px 16px}
.pmock.win .pscreen{border-radius:18px;padding:0;gap:0}
.ptop{display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:2px solid rgba(18,58,99,.14)}
.pback{width:22px;height:22px;border-left:4px solid var(--ink);border-bottom:4px solid var(--ink);
  transform:rotate(45deg);border-radius:3px;opacity:.85}
.ptitle{font-weight:800;font-size:30px;color:#123a63}
.plist{display:flex;flex-direction:column;gap:14px;margin-top:6px}
.prow{display:flex;align-items:center;gap:16px;padding:22px 18px;border-radius:16px;
  background:rgba(18,58,99,.05);border:2px solid rgba(18,58,99,.10)}
.prow.hit{background:color-mix(in srgb, var(--hit) 14%, #fff);border-color:var(--hit)}
.pico{width:34px;height:34px;border-radius:9px;background:rgba(18,58,99,.20);flex:none}
.prow.hit .pico{background:var(--hit)}
.ptext{flex:1;text-align:right;font-weight:700;font-size:27px;color:#22303f;direction:rtl}
.pchev{width:14px;height:14px;border-left:3px solid rgba(18,58,99,.45);border-bottom:3px solid rgba(18,58,99,.45);
  transform:rotate(45deg)}
.pmedia{position:relative;flex:1;min-height:200px;border-radius:18px;overflow:hidden;
  display:grid;place-items:center;border:2px solid rgba(18,58,99,.16);
  background:linear-gradient(150deg,color-mix(in srgb,var(--ink) 55%,#fff) 0%,color-mix(in srgb,var(--ink) 18%,#fff) 55%,#fff 100%)}
.pmedia::after{content:"";position:absolute;left:-20%;bottom:-30%;width:150%;height:80%;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.65),transparent 65%)}
.pmedia.small{min-height:150px}
.pmedia-app{position:absolute;top:16px;right:16px;z-index:2;display:grid;place-items:center;
  width:104px;height:104px;border-radius:28px;background:rgba(255,255,255,.92);
  box-shadow:0 8px 18px rgba(0,0,0,.22)}
.pmedia-app .papp{background:none;width:auto;height:auto}
.pmedia-app svg{width:68px;height:68px}
.pmedia-mark{width:86px;height:70px;border:5px solid rgba(255,255,255,.9);border-radius:12px;position:relative;z-index:1}
.pmedia-mark::after{content:"";position:absolute;left:12px;bottom:10px;width:0;height:0;
  border-left:26px solid transparent;border-right:16px solid transparent;border-bottom:26px solid rgba(255,255,255,.9)}
.pline{height:14px;border-radius:99px;background:rgba(18,58,99,.16)}
.pline.w80{width:80%}.pline.w60{width:56%}
.pcta{margin-top:auto;border-radius:14px;color:#fff;font-weight:800;font-size:28px;
  padding:20px;text-align:center;direction:rtl}
.pduo{display:flex;align-items:center;justify-content:center;gap:18px;padding:12px 0}
.pav{width:82px;height:82px;border-radius:50%;border:5px solid;display:block;background:rgba(18,58,99,.08)}
.pav.sm{width:46px;height:46px;border-width:3px;flex:none}
.plink{width:56px;height:8px;border-radius:99px}
.ptick{width:70px;height:70px;border-radius:50%;color:#fff;font-size:40px;font-weight:900;
  display:grid;place-items:center;align-self:center;margin-top:6px}
.pcmts{display:flex;flex-direction:column;gap:16px;margin-top:6px}
.pcmt{display:flex;align-items:center;gap:14px;padding:14px;border-radius:16px;background:rgba(18,58,99,.05)}
.pcmt.hit{background:rgba(18,58,99,.12)}
.pbubble{flex:1;text-align:right;font-weight:700;font-size:25px;color:#22303f;direction:rtl;line-height:1.4}
.pcam{width:46px;height:38px;border-radius:9px;flex:none;position:relative}
.pcam::after{content:"";position:absolute;right:-8px;top:9px;border-top:10px solid transparent;
  border-bottom:10px solid transparent;border-left:12px solid currentColor}
.pbar{height:56px;display:flex;align-items:center;gap:10px;padding:0 18px;background:rgba(18,58,99,.10);
  border-bottom:2px solid rgba(18,58,99,.16)}
.pbar i{width:14px;height:14px;border-radius:50%;background:rgba(18,58,99,.35)}
.purl{margin-right:auto;margin-left:96px;direction:ltr;font-weight:700;font-size:24px;color:#123a63;opacity:.85}
.pcompare{flex:1;min-height:300px;display:flex;gap:16px;padding:20px}
.pshot{position:relative;flex:1;min-height:260px;border-radius:16px;overflow:hidden;
  border:3px solid rgba(18,58,99,.22);display:block}
.pshot.before{filter:blur(2.2px) saturate(.55)}
.pshot.after{border-width:5px;box-shadow:0 10px 26px rgba(0,0,0,.18)}
.pshot-img{position:absolute;inset:0;
  background:linear-gradient(150deg,color-mix(in srgb,var(--ink) 62%,#fff),color-mix(in srgb,var(--ink) 22%,#fff) 55%,#fff)}
.pshot-img::after{content:"";position:absolute;left:16%;top:52%;width:70%;height:60%;border-radius:50% 50% 44% 44%;
  background:rgba(255,255,255,.55)}
.pshot-img::before{content:"";position:absolute;left:28%;top:16%;width:34%;aspect-ratio:1;border-radius:50%;
  background:rgba(255,255,255,.85)}
.pshot-tag{position:absolute;bottom:12px;right:12px;z-index:2;font-weight:800;font-size:24px;direction:rtl;
  background:rgba(255,255,255,.9);color:#1b2430;border-radius:999px;padding:6px 18px}
.pshot-tag.on{color:#fff}
.pshot-app{position:absolute;top:12px;left:12px;z-index:2;display:grid;place-items:center;
  width:74px;height:74px;border-radius:20px;background:rgba(255,255,255,.92);box-shadow:0 8px 18px rgba(0,0,0,.22)}
.pshot-app .papp{background:none;width:auto;height:auto;margin:0}
.pshot-app svg{width:48px;height:48px}
.pmock.win .pcta{margin:0 20px 20px}
.papp{margin-left:auto;display:grid;place-items:center;width:64px;height:64px;border-radius:18px;
  background:rgba(18,58,99,.08);flex:none}
.papp svg{width:44px;height:44px}
/* tap affordance */
.tap{position:absolute;left:50%;top:50%;width:0;height:0;z-index:5;pointer-events:none}
.tap .ripple{position:absolute;left:-70px;top:-70px;width:140px;height:140px;border-radius:50%;
  border:5px solid var(--ink);opacity:0}
.tap .finger{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;
  background:rgba(18,58,99,.30);border:4px solid var(--ink);opacity:0}
`;
