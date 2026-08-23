// "Neon" builder — matches the agency reference: near-black ground, one electric
// accent, glowing type, a floating device mock, callout chips and whip-blur cuts.
// Reuses the UI mock system so the step-by-step teaching stays intact.
import { readFileSync } from "node:fs";
import { renderUI, UI_CSS } from "./ui-mock.mjs";

const b64 = (p) => readFileSync(p).toString("base64");
const FONT_FACES = [
  [400, "Regular"], [500, "Medium"], [700, "Bold"], [800, "ExtraBold"], [900, "Black"],
]
  .map(([w, n]) => `@font-face{font-family:"Vazirmatn";font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64(`public/fonts/Vazirmatn-${n}.woff2`)}) format("woff2");}`)
  .join("\n") +
  `\n@font-face{font-family:"Baloo";font-weight:400 900;font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64("public/fonts/BalooBhaijaan2-ExtraBold.woff2")}) format("woff2");}`;
const LOGO = "data:image/jpeg;base64," + b64("public/logo.jpg");
const GSAP = readFileSync("public/gsap.min.js", "utf8");

const PD = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const plain = (s) => String(s).replace(/<[^>]*>/g, "").trim();

// one electric accent per network — the ground stays near-black for all of them
const NEON = {
  instagram: { hot: "#FF2E9A", warm: "#FF8A3D" },
  tiktok: { hot: "#25F4EE", warm: "#FE2C55" },
  tools: { hot: "#7CFF3F", warm: "#22D3EE" },
  general: { hot: "#43F57C", warm: "#3A8BFF" },
  ai: { hot: "#A78BFA", warm: "#22D3EE" },
};

export function buildNeonHTML(pack) {
  const n = pack.tips.length;
  const TOTAL = pack.duration ?? 16;
  const HOOK = pack.hookDuration ?? 3.5;
  const OUTRO = pack.outroDuration ?? 4;
  const TIP = (TOTAL - HOOK - OUTRO) / n;
  const tipStart = (i) => HOOK + i * TIP;
  const C = NEON[pack.platform] || NEON.tools;

  const scenes = pack.tips
    .map((tip, i) => {
      const at = tipStart(i);
      const accent = i % 2 === 0 ? C.hot : C.warm;
      return `  <section id="s${i + 2}" class="clip scene" data-start="${at.toFixed(3)}" data-duration="${TIP.toFixed(3)}" data-track-index="1" style="--ink:${accent};--neon:${accent}">
    <div class="ground"></div><div class="grid"></div><div class="sparks">${sparks(i)}</div>
    <div class="world" id="w${i + 2}">
      <span class="stepchip">گام ${PD(tip.step || i + 1)}</span>
      ${tip.ui ? renderUI(tip.ui, accent) : ""}
      <div class="capline"><span>${tip.head}</span></div>
    </div>
  </section>`;
    })
    .join("\n");

  const tipsData = pack.tips.map((t, i) => ({ id: "s" + (i + 2), at: +tipStart(i).toFixed(3), dur: +TIP.toFixed(3), i }));
  const outAt = HOOK + n * TIP;

  return `<!doctype html>
<html lang="fa">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>${pack.title}</title>
<script>${GSAP}</script>
<style>
${FONT_FACES}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#05070a}
body{font-family:"Vazirmatn",sans-serif;color:#eaf6ea;-webkit-font-smoothing:antialiased}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#05070a;--hot:${C.hot};--warm:${C.warm}}
.clip{position:absolute;inset:0;overflow:hidden}
.scene,.hookscene,.outroscene{direction:rtl}
/* ---------- near-black ground with one glow ---------- */
.ground{position:absolute;inset:0;z-index:0;background:
  radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--neon) 22%, transparent), transparent 58%),
  radial-gradient(circle at 20% 92%, color-mix(in srgb, var(--neon) 12%, transparent), transparent 55%),
  linear-gradient(180deg,#080c10 0%,#05070a 55%,#030406 100%)}
.grid{position:absolute;inset:0;z-index:0;opacity:.16;
  background-image:linear-gradient(color-mix(in srgb,var(--neon) 45%,transparent) 1px,transparent 1px),
    linear-gradient(90deg,color-mix(in srgb,var(--neon) 45%,transparent) 1px,transparent 1px);
  background-size:120px 120px;
  mask-image:radial-gradient(circle at 50% 40%,#000 10%,transparent 72%)}
.sparks{position:absolute;inset:0;z-index:1;pointer-events:none}
.sparks i{position:absolute;border-radius:50%;background:var(--neon);filter:blur(1px)}
.world{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:260px 60px 400px;will-change:transform,filter}
/* ---------- neon type ---------- */
.stepchip{font-weight:800;font-size:36px;letter-spacing:.08em;color:#04070a;background:var(--neon);
  border-radius:999px;padding:12px 34px;margin-bottom:34px;
  box-shadow:0 0 24px color-mix(in srgb,var(--neon) 70%,transparent)}
.capline{margin-top:46px;font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:76px;
  line-height:1.28;color:#f2fff2;
  text-shadow:0 0 10px color-mix(in srgb,var(--neon) 85%,transparent),
              0 0 34px color-mix(in srgb,var(--neon) 60%,transparent),
              0 4px 20px rgba(0,0,0,.8)}
.capline .hl{color:var(--neon)}
${UI_CSS}
/* ---------- device mock, dark skin ---------- */
.pmock{background:#0b1016;border-color:var(--neon);
  box-shadow:0 0 40px color-mix(in srgb,var(--neon) 42%,transparent),0 40px 80px rgba(0,0,0,.75)}
.pscreen{background:#0e141b}
.ptitle{color:#e8f6ff}
.pback{border-color:var(--neon)}
.ptop{border-bottom-color:rgba(255,255,255,.14)}
.prow,.pcmt{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.10)}
.prow.hit{background:color-mix(in srgb,var(--hit) 22%,#0e141b);border-color:var(--hit);
  box-shadow:0 0 22px color-mix(in srgb,var(--hit) 55%,transparent)}
.ptext,.pbubble{color:#dbe8f2}
.pico{background:rgba(255,255,255,.22)}
.pchev{border-color:rgba(255,255,255,.35)}
.pmedia,.pbefore,.pafter{border-color:rgba(255,255,255,.16);
  background:repeating-linear-gradient(135deg,rgba(255,255,255,.10) 0 14px,rgba(255,255,255,.03) 14px 28px)}
.pmedia-mark{border-color:rgba(255,255,255,.45)}
.pmedia-mark::after{border-bottom-color:rgba(255,255,255,.45)}
.pline{background:rgba(255,255,255,.18)}
.pav{background:rgba(255,255,255,.08)}
.pbar{background:rgba(255,255,255,.08);border-bottom-color:rgba(255,255,255,.14)}
.purl{color:#cfe9ff}
.pcta{color:#04070a;font-weight:900;box-shadow:0 0 24px color-mix(in srgb,var(--ink) 60%,transparent)}
.tap .ripple,.tap .finger{border-color:var(--neon)}
.tap .finger{background:color-mix(in srgb,var(--neon) 35%,transparent)}
/* ---------- hook ---------- */
.hookscene .world{padding:300px 60px 380px}
.hookname{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:74px;color:var(--neon);
  direction:ltr;letter-spacing:.01em;margin-bottom:30px;
  text-shadow:0 0 12px var(--neon),0 0 40px color-mix(in srgb,var(--neon) 70%,transparent)}
.hookq{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:112px;line-height:1.2;color:#fff;
  text-shadow:0 0 14px color-mix(in srgb,var(--neon) 70%,transparent),0 6px 26px rgba(0,0,0,.9)}
.hookq .hl{color:var(--neon)}
.hookline{width:220px;height:8px;border-radius:99px;background:var(--neon);margin-top:46px;
  box-shadow:0 0 26px var(--neon);transform-origin:right center}
/* ---------- callout chips ---------- */
.chips{width:100%;margin-top:40px;display:flex;flex-direction:column;gap:14px}
.chip2{display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.94);border-radius:16px;
  padding:20px 26px;direction:rtl;box-shadow:0 14px 34px rgba(0,0,0,.6)}
.chip2 span{font-weight:800;font-size:38px;color:#0b1016}
.chip2 i{width:44px;height:44px;border-radius:12px;flex:none;display:block;background:var(--neon)}
/* ---------- outro ---------- */
.outroscene .ground{background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--neon) 26%,transparent),transparent 60%),linear-gradient(180deg,#080c10,#030406)}
.brandmark{width:230px;height:230px;border-radius:74px;display:grid;place-items:center;background:#0b1016;
  border:3px solid var(--neon);box-shadow:0 0 50px color-mix(in srgb,var(--neon) 55%,transparent)}
.brandmark img{width:160px;height:160px;border-radius:40px}
.brandname{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:80px;color:#fff;margin-top:40px;
  text-shadow:0 0 14px color-mix(in srgb,var(--neon) 70%,transparent)}
.brandsub{font-weight:700;font-size:44px;color:#b9c9d6;margin-top:20px;line-height:1.45}
.cta{margin-top:40px;font-weight:900;font-size:50px;color:#04070a;background:var(--neon);border-radius:999px;
  padding:24px 68px;box-shadow:0 0 34px color-mix(in srgb,var(--neon) 70%,transparent)}
/* ---------- chrome ---------- */
.mark{position:absolute;top:140px;right:140px;z-index:40;display:flex;align-items:center;gap:16px}
.mark img{width:70px;height:70px;border-radius:18px}
.mark span{font-weight:900;font-size:32px;color:#fff;opacity:.92}
.rule{position:absolute;top:0;left:0;right:0;height:7px;background:rgba(255,255,255,.10);z-index:50}
.rule i{display:block;height:100%;background:var(--hot);transform-origin:right center;
  box-shadow:0 0 18px var(--hot)}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${TOTAL}">

  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="20">
    <div class="rule"><i id="rulefill"></i></div>
  </div>
  <div class="clip" data-start="0" data-duration="${outAt.toFixed(3)}" data-track-index="19">
    <div class="mark"><img src="${LOGO}" alt=""/><span>افغان فالورز</span></div>
  </div>

  <section id="s1" class="clip hookscene" data-start="0" data-duration="${HOOK}" data-track-index="1" style="--neon:${C.hot}">
    <div class="ground"></div><div class="grid"></div><div class="sparks">${sparks(0)}</div>
    <div class="world" id="w1">
      <div class="hookname">${plain(pack.hook.badge || pack.feature || "")}</div>
      <div class="hookq">${pack.hook.l1}<br/><span class="hl">${plain(pack.hook.l2)}</span></div>
      <div class="hookline"></div>
    </div>
  </section>

${scenes}

  <section id="sOut" class="clip outroscene" data-start="${outAt.toFixed(3)}" data-duration="${OUTRO}" data-track-index="1" style="--neon:${C.hot}">
    <div class="ground"></div><div class="grid"></div>
    <div class="world" id="wOut">
      <div class="brandmark"><img src="${LOGO}" alt="افغان فالورز"/></div>
      <div class="brandname">افغان فالورز</div>
      <div class="brandsub">${pack.outro.tag}</div>
      <div class="cta">${pack.outro.follow}</div>
      <div class="chips">
        <div class="chip2"><i></i><span>پست مارو لایک کن!</span></div>
        <div class="chip2"><i></i><span>پیج مارو فالو کن!</span></div>
        <div class="chip2"><i></i><span>پست مارو شیر کن!</span></div>
      </div>
    </div>
  </section>
</div>

<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
var TIPS = ${JSON.stringify(tipsData)};
var OUT_AT = ${outAt.toFixed(3)};

tl.fromTo("#rulefill",{scaleX:0},{scaleX:1,ease:"none",duration:${TOTAL}},0);

// HOOK — readable at frame 0, then a neon pulse
tl.fromTo("#s1 .hookq",{scale:1.07},{scale:1,duration:.3,ease:"power3.out"},0);
tl.fromTo("#s1 .hookname",{opacity:0,y:-24},{opacity:1,y:0,duration:.35,ease:"power3.out"},.06);
tl.fromTo("#s1 .hookline",{scaleX:0},{scaleX:1,duration:.45,ease:"power3.out"},.28);
tl.to("#s1 .hookq",{scale:1.045,duration:.14,ease:"power2.out"},1.0)
  .to("#s1 .hookq",{scale:1,duration:.4,ease:"elastic.out(1,.6)"},1.14);
tl.to("#s1 .hookname",{opacity:.55,duration:.5,yoyo:true,repeat:3,ease:"sine.inOut"},.7);

TIPS.forEach(function(t){
  var at=t.at, id="#"+t.id, W="#w"+(t.i+2);
  // whip-blur cut — the reference's signature seam
  tl.fromTo(W,{x:520,filter:"blur(24px)",opacity:0},
              {x:0,filter:"blur(0px)",opacity:1,duration:.4,ease:"power3.out"},at);
  tl.fromTo(id+" .stepchip",{opacity:0,y:-20,scale:.8},{opacity:1,y:0,scale:1,duration:.3,ease:"back.out(2)"},at+.16);
  // device + screen (primary / secondary)
  tl.fromTo(id+" .pmock",{y:60,scale:.92,opacity:0},{y:0,scale:1,opacity:1,duration:.46,ease:"back.out(1.5)"},at+.14);
  tl.fromTo(id+" .prow, "+id+" .pcmt",{opacity:0,x:30},{opacity:1,x:0,duration:.3,stagger:.06,ease:"power3.out"},at+.36);
  tl.fromTo(id+" .pmedia, "+id+" .pcompare, "+id+" .pduo",{opacity:0,scale:.94},{opacity:1,scale:1,duration:.32,ease:"power2.out"},at+.36);
  tl.fromTo(id+" .pcta",{opacity:0,y:18},{opacity:1,y:0,duration:.28,ease:"power2.out"},at+.5);
  // the tap
  tl.fromTo(id+" .tap .finger",{opacity:0,scale:1.7},{opacity:1,scale:1,duration:.2,ease:"power3.out"},at+.7);
  tl.fromTo(id+" .tap .ripple",{opacity:.9,scale:.3},{opacity:0,scale:1.3,duration:.5,ease:"power2.out"},at+.74);
  tl.to(id+" .tap .finger",{scale:.86,duration:.1,ease:"power2.out"},at+.74)
    .to(id+" .tap .finger",{scale:1,duration:.2,ease:"back.out(2)"},at+.84);
  tl.to(id+" .tap .finger",{opacity:0,duration:.26,ease:"power1.in"},at+1.1);
  tl.fromTo(id+" .prow.hit, "+id+" .pcmt.hit",{scale:1},{scale:1.05,duration:.14,ease:"power2.out"},at+.76);
  tl.to(id+" .prow.hit, "+id+" .pcmt.hit",{scale:1,duration:.28,ease:"elastic.out(1,.6)"},at+.9);
  tl.fromTo(id+" .ptick",{scale:0,rotation:-30},{scale:1,rotation:0,duration:.45,ease:"back.out(2.2)"},at+.62);
  // caption
  tl.fromTo(id+" .capline",{opacity:0,y:34},{opacity:1,y:0,duration:.34,ease:"power3.out"},at+.5);
  // ambient — device breathes, sparks drift, glow pulses
  tl.to(id+" .pmock",{y:-9,rotation:.5,duration:1.9,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.9)),ease:"sine.inOut"},at+.8);
  tl.to(id+" .sparks i",{y:-30,duration:1.6,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.6)),ease:"sine.inOut",stagger:.08},at);
  tl.to(id+" .ground",{opacity:.86,duration:1.3,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.3)),ease:"sine.inOut"},at+.4);
});

// OUTRO
tl.fromTo("#wOut",{x:520,filter:"blur(24px)",opacity:0},{x:0,filter:"blur(0px)",opacity:1,duration:.45,ease:"power3.out"},OUT_AT);
tl.fromTo("#sOut .brandmark",{scale:.5},{scale:1,duration:.55,ease:"back.out(1.7)"},OUT_AT+.12);
tl.fromTo("#sOut .brandname",{y:36,opacity:0},{y:0,opacity:1,duration:.45,ease:"power3.out"},OUT_AT+.34);
tl.fromTo("#sOut .brandsub",{y:26,opacity:0},{y:0,opacity:1,duration:.4,ease:"power2.out"},OUT_AT+.5);
tl.fromTo("#sOut .cta",{scale:.6,opacity:0},{scale:1,opacity:1,duration:.45,ease:"back.out(2)"},OUT_AT+.66);
tl.fromTo("#sOut .chip2",{x:-260,opacity:0},{x:0,opacity:1,duration:.4,stagger:.12,ease:"power4.out"},OUT_AT+.8);
tl.to("#sOut .cta",{scale:1.05,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},OUT_AT+1.3);

window.__timelines["main"] = tl;
</script>
</body>
</html>`;
}

// deterministic drifting spark field
function sparks(seed) {
  let a = 1337 + seed * 977, out = "";
  const rnd = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 14; i++) {
    const x = (rnd() * 94 + 3).toFixed(1), y = (rnd() * 88 + 4).toFixed(1);
    const s = (rnd() * 8 + 4).toFixed(0), o = (rnd() * 0.5 + 0.25).toFixed(2);
    out += `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o}"></i>`;
  }
  return out;
}
