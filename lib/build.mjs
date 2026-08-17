// Data-driven 1-minute video builder for the AfghanFollower daily pipeline.
// buildHTML(pack) -> self-contained standalone HyperFrames composition (fonts+logo inlined).
import { readFileSync } from "node:fs";

const b64 = (p) => readFileSync(p).toString("base64");
const fontDefs = [
  [400, "Regular"], [500, "Medium"], [700, "Bold"], [800, "ExtraBold"], [900, "Black"],
];
const FONT_FACES = fontDefs
  .map(([w, n]) => `@font-face{font-family:"Vazirmatn";font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64(`public/fonts/Vazirmatn-${n}.woff2`)}) format("woff2");}`)
  .join("\n")
  // modern rounded Persian display face for headings + numbers
  + `\n@font-face{font-family:"Baloo";font-weight:400 900;font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64("public/fonts/BalooBhaijaan2-ExtraBold.woff2")}) format("woff2");}`;
const LOGO = "data:image/jpeg;base64," + b64("public/logo.jpg");
// inline GSAP so rendering needs no internet (only Telegram delivery does)
const GSAP = readFileSync("public/gsap.min.js", "utf8");

const PDIGIT = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const ORD = ["", "اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم", "نهم", "دهم", "یازدهم", "دوازدهم"];

// --- inline SVG icon library (88x88 viewbox), color-parameterized ---
const S = (inner) => `<svg width="120" height="120" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const ICONS = {
  magnet: (c) => S(`<path d="M20 12v22a24 24 0 0 0 48 0V12H54v22a10 10 0 0 1-20 0V12z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><rect x="20" y="8" width="14" height="10" fill="${c}"/><rect x="54" y="8" width="14" height="10" fill="${c}"/>`),
  bolt: (c) => S(`<path d="M50 6 22 48h20l-6 34 30-46H44z" fill="${c}"/>`),
  music: (c) => S(`<path d="M62 12v40" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M34 22v40" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M34 22 62 12" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="26" cy="62" r="10" fill="${c}"/><circle cx="54" cy="52" r="10" fill="${c}"/>`),
  hashtag: (c) => S(`<path d="M30 12 24 76M58 12 52 76M14 30h60M12 52h60" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`),
  chat: (c) => S(`<path d="M14 18h56a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H36L20 78V60h-6a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="${c}"/><circle cx="30" cy="39" r="5" fill="#05081f"/><circle cx="46" cy="39" r="5" fill="#05081f"/><circle cx="62" cy="39" r="5" fill="#05081f"/>`),
  clock: (c) => S(`<circle cx="44" cy="46" r="32" fill="none" stroke="${c}" stroke-width="7"/><path d="M44 28v20l14 8" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  camera: (c) => S(`<rect x="8" y="24" width="72" height="48" rx="10" fill="${c}"/><rect x="30" y="14" width="28" height="14" rx="5" fill="${c}"/><circle cx="44" cy="48" r="14" fill="#05081f"/><circle cx="44" cy="48" r="7" fill="${c}"/>`),
  chart: (c) => S(`<rect x="12" y="48" width="16" height="30" fill="${c}"/><rect x="36" y="30" width="16" height="48" fill="${c}"/><rect x="60" y="14" width="16" height="64" fill="${c}"/>`),
  trend: (c) => S(`<path d="M10 62 32 40l14 14 24-28" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 26h16v16" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`),
  user: (c) => S(`<circle cx="44" cy="30" r="16" fill="${c}"/><path d="M14 78a30 30 0 0 1 60 0z" fill="${c}"/>`),
  play: (c) => S(`<rect x="10" y="14" width="68" height="60" rx="14" fill="${c}"/><path d="M38 34v20l18-10z" fill="#05081f"/>`),
  star: (c) => S(`<path d="M44 8 55 33l27 3-20 18 6 27-24-14-24 14 6-27L6 36l27-3z" fill="${c}"/>`),
  calendar: (c) => S(`<rect x="12" y="18" width="64" height="58" rx="8" fill="none" stroke="${c}" stroke-width="7"/><path d="M12 34h64M28 10v14M60 10v14" stroke="${c}" stroke-width="7" stroke-linecap="round"/><rect x="26" y="46" width="14" height="12" fill="${c}"/>`),
  layers: (c) => S(`<path d="M44 10 78 28 44 46 10 28z" fill="${c}"/><path d="M10 44l34 18 34-18" stroke="${c}" stroke-width="7" stroke-linejoin="round" fill="none"/><path d="M10 60l34 18 34-18" stroke="${c}" stroke-width="7" stroke-linejoin="round" fill="none"/>`),
  heart: (c) => S(`<path d="M44 76C18 58 10 42 10 30a18 18 0 0 1 34-8 18 18 0 0 1 34 8c0 12-8 28-34 46z" fill="${c}"/>`),
  target: (c) => S(`<circle cx="44" cy="44" r="34" fill="none" stroke="${c}" stroke-width="7"/><circle cx="44" cy="44" r="20" fill="none" stroke="${c}" stroke-width="7"/><circle cx="44" cy="44" r="7" fill="${c}"/>`),
  sparkle: (c) => S(`<path d="M44 8c3 20 8 25 28 28-20 3-25 8-28 28-3-20-8-25-28-28 20-3 25-8 28-28z" fill="${c}"/>`),
  refresh: (c) => S(`<path d="M74 44a30 30 0 1 1-9-21" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M66 8v18H48" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  users: (c) => S(`<circle cx="30" cy="30" r="13" fill="${c}"/><circle cx="60" cy="34" r="11" fill="${c}"/><path d="M6 76a24 24 0 0 1 48 0z" fill="${c}"/><path d="M52 76a22 22 0 0 1 30-16" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`),
  bulb: (c) => S(`<path d="M44 8a24 24 0 0 0-14 43c3 2 4 4 4 8h20c0-4 1-6 4-8A24 24 0 0 0 44 8z" fill="${c}"/><path d="M34 66h20M37 74h14" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`),
  pen: (c) => S(`<path d="M18 70l6-16L56 22l10 10-32 32z" fill="${c}"/><path d="M52 26l10 10" stroke="#05081f" stroke-width="5"/><path d="M18 70l6-3-3-3z" fill="#05081f"/>`),
  wand: (c) => S(`<path d="M20 70 54 36" stroke="${c}" stroke-width="9" stroke-linecap="round"/><path d="M64 12l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="${c}"/><circle cx="26" cy="24" r="4" fill="${c}"/><circle cx="70" cy="52" r="4" fill="${c}"/>`),
  mic: (c) => S(`<rect x="34" y="10" width="20" height="40" rx="10" fill="${c}"/><path d="M24 42a20 20 0 0 0 40 0" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M44 62v14M32 78h24" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`),
  globe: (c) => S(`<circle cx="44" cy="44" r="34" fill="none" stroke="${c}" stroke-width="7"/><path d="M12 44h64M44 10c14 12 14 56 0 68M44 10c-14 12-14 56 0 68" fill="none" stroke="${c}" stroke-width="6"/>`),
  chip: (c) => S(`<rect x="22" y="22" width="44" height="44" rx="8" fill="${c}"/><rect x="34" y="34" width="20" height="20" rx="4" fill="#05081f"/><path d="M32 10v10M44 10v10M56 10v10M32 68v10M44 68v10M56 68v10M10 32h10M10 44h10M10 56h10M68 32h10M68 44h10M68 56h10" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`),
};

const TOTAL = 60, HOOK = 4, OUTRO = 5;

// deterministic PRNG so particle positions are stable per build
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// animated background layer: soft drifting orbs + floating particle dots
function fxLayer(seed, accent) {
  const r = mulberry32(seed);
  let orbs = "";
  for (let i = 0; i < 2; i++) {
    const x = (r() * 68 + 8).toFixed(1), y = (r() * 58 + 8).toFixed(1), s = (r() * 150 + 190).toFixed(0);
    orbs += `<span class="orb" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:radial-gradient(circle,${accent}44,transparent 68%)"></span>`;
  }
  let dots = "";
  for (let i = 0; i < 8; i++) {
    const x = (r() * 90 + 4).toFixed(1), y = (r() * 82 + 4).toFixed(1), s = (r() * 14 + 8).toFixed(0), o = (r() * 0.28 + 0.22).toFixed(2);
    dots += `<span class="dot" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:${accent};opacity:${o}"></span>`;
  }
  return `<div class="fx">${orbs}${dots}</div>`;
}

export function buildHTML(pack) {
  const t = pack.theme;
  const n = pack.tips.length;
  const TIP = (TOTAL - HOOK - OUTRO) / n;
  const acc = (i) => t.accents[i % t.accents.length];

  const tipStart = (i) => HOOK + i * TIP;
  const outroStart = HOOK + n * TIP;

  const scenes = pack.tips
    .map((tip, i) => {
      const a = acc(i);
      const at = tipStart(i);
      return `  <section id="s${i + 2}" class="clip" data-start="${at.toFixed(3)}" data-duration="${TIP.toFixed(3)}" data-track-index="1" style="--acc:${a}">
    <div class="bg"></div><div class="grid"></div>${fxLayer(101 + i * 7, a)}
    <div class="wrap" id="s${i + 2}c">
      <div class="kicker">نکته ${ORD[i + 1]}</div>
      <div class="icon">${(ICONS[tip.icon] || ICONS.star)(a)}</div>
      <div class="numwrap"><div class="blob" style="background:${a}"></div><div class="ring"></div><div class="num">${PDIGIT(i + 1)}</div></div>
      <div class="headline">${tip.head}</div>
      <div class="bar" style="background:${a}"></div>
    </div>
    <div class="sub">${tip.sub}</div>
  </section>`;
    })
    .join("\n");

  const tipsData = pack.tips.map((_, i) => ({ id: "s" + (i + 2), at: +tipStart(i).toFixed(3), dur: +TIP.toFixed(3) }));

  const page = `<!doctype html>
<html lang="fa">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>${pack.title}</title>
<script>${GSAP}</script>
<style>
${FONT_FACES}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#05081f}
body{font-family:"Vazirmatn",sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#05081f;
  --grad:${t.grad};--gradOutro:${t.gradOutro};--glow1:${t.glow1};--glow2:${t.glow2};--emc:${t.emc}}
.wrap,.sub,.brandchip,.kicker,.headline,.hook-l1,.hook-l2,.brandBig,.brandTag,.follow{direction:rtl}
.clip{position:absolute;inset:0;overflow:hidden}
.fx{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.fx .orb{position:absolute;border-radius:50%;filter:blur(8px)}
.fx .dot{position:absolute;border-radius:50%}
.bg{position:absolute;inset:0;z-index:0;background:var(--grad)}
.bg::before{content:"";position:absolute;width:1300px;height:1300px;border-radius:50%;top:-260px;right:-360px;
  background:radial-gradient(circle,var(--glow1),transparent 62%)}
.bg::after{content:"";position:absolute;width:1100px;height:1100px;border-radius:50%;bottom:-320px;left:-320px;
  background:radial-gradient(circle,var(--glow2),transparent 62%)}
.grid{position:absolute;inset:0;z-index:0;opacity:.10;
  background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);
  background-size:90px 90px}
.wrap{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:200px 90px 380px}
.kicker{font-weight:800;font-size:40px;letter-spacing:.02em;color:#eaf0ff;margin-bottom:34px;
  padding:16px 34px;border:2px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(255,255,255,.08)}
.num{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;line-height:.9;font-size:300px;color:#05081f;position:relative}
.numwrap{position:relative;margin-bottom:56px}
.numwrap .blob{position:absolute;inset:-24px -52px;border-radius:54px;z-index:-1;
  box-shadow:0 30px 70px rgba(0,0,0,.35),inset 0 4px 20px rgba(255,255,255,.35)}
.numwrap .ring{position:absolute;inset:-24px -52px;border-radius:54px;z-index:-1;border:3px solid rgba(255,255,255,.35)}
.headline{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:104px;line-height:1.12;letter-spacing:0;margin-top:12px;
  text-shadow:0 6px 30px rgba(0,0,0,.35)}
.headline .hl{color:var(--acc)}
.bar{height:15px;width:280px;border-radius:99px;margin:38px 0 0;transform-origin:right center}
.icon{margin-bottom:22px}
.icon svg{width:150px;height:150px}
.sub{position:absolute;left:80px;right:80px;bottom:210px;z-index:3;font-weight:700;font-size:50px;line-height:1.55;
  color:#0a0f33;background:#fff;border-radius:32px;padding:32px 42px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
.sub .em{color:var(--emc)}
.hook-l1{font-weight:800;font-size:80px;line-height:1.25;color:#eef3ff}
.hook-l2{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:150px;line-height:1.02;letter-spacing:0;margin-top:24px;
  text-shadow:0 8px 40px rgba(0,0,0,.4),0 0 60px rgba(140,170,255,.30)}
.progress{position:absolute;top:0;left:0;right:0;height:14px;background:rgba(255,255,255,.12);z-index:50}
.progress .fill{height:100%;width:100%;transform-origin:right center;background:var(--grad-bar,linear-gradient(90deg,var(--glow1),var(--glow2)))}
.brandchip{position:absolute;top:60px;right:60px;display:flex;align-items:center;gap:18px;z-index:40}
.brandchip img{width:92px;height:92px;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.brandchip .bt{font-weight:900;font-size:38px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.outro .bg{background:var(--gradOutro)}
.outro .wrap{padding:0 90px}
.logoBig{width:340px;height:340px;border-radius:76px;box-shadow:0 40px 90px rgba(0,0,0,.55);margin-bottom:52px}
.brandBig{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:150px;line-height:1.0;letter-spacing:0;
  text-shadow:0 8px 40px rgba(0,0,0,.35)}
.brandTag{font-weight:700;font-size:54px;color:#f2f8ff;margin-top:38px;line-height:1.4}
.follow{margin-top:60px;font-weight:900;font-size:58px;color:#0b1560;background:#fff;
  border-radius:99px;padding:32px 84px;box-shadow:0 22px 50px rgba(0,0,0,.4)}
.flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:45;pointer-events:none;mix-blend-mode:overlay}
svg{display:block}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${TOTAL}">

  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="20">
    <div class="progress"><div class="fill" id="pfill"></div></div>
  </div>

  <div class="clip" data-start="0" data-duration="${outroStart.toFixed(3)}" data-track-index="19">
    <div class="brandchip"><img src="${LOGO}" alt="logo" /><span class="bt">افغان فالور</span></div>
  </div>

  <section id="s1" class="clip" data-start="0" data-duration="${HOOK}" data-track-index="1">
    <div class="bg"></div><div class="grid"></div>
    ${fxLayer(41, t.accents[0])}
    <div class="wrap" id="s1c">
      <div class="hook-l1">${pack.hook.l1}</div>
      <div class="hook-l2">${pack.hook.l2}</div>
    </div>
  </section>

${scenes}

  <section id="sOut" class="clip outro" data-start="${outroStart.toFixed(3)}" data-duration="${OUTRO}" data-track-index="1">
    <div class="bg"></div>
    <div class="wrap" id="sOutc">
      <img class="logoBig" src="${LOGO}" alt="افغان فالور" />
      <div class="brandBig">افغان فالور</div>
      <div class="brandTag">${pack.outro.tag}</div>
      <div class="follow">${pack.outro.follow}</div>
    </div>
  </section>

  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="30"><div class="flash" id="flash"></div></div>
</div>

<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
var TIPS = ${JSON.stringify(tipsData)};
var OUTRO_AT = ${outroStart.toFixed(3)};
tl.fromTo("#pfill",{scaleX:0},{scaleX:1,ease:"none",duration:${TOTAL}},0);
function ken(sel,at,dur){tl.fromTo(sel,{scale:1},{scale:1.05,ease:"none",duration:dur},at);}
function flash(at){tl.fromTo("#flash",{opacity:0},{opacity:.5,duration:.12,ease:"power1.out"},at).to("#flash",{opacity:0,duration:.3,ease:"power1.in"},at+.12);}
// hook
tl.from("#s1 .hook-l1",{y:70,opacity:0,duration:.6,ease:"power3.out"},.05);
tl.from("#s1 .hook-l2",{y:90,opacity:0,scale:.9,duration:.7,ease:"back.out(1.6)"},.35);
ken("#s1c",0,${HOOK});
tl.to("#s1 .dot",{y:"-=24",duration:1.4,yoyo:true,repeat:2,ease:"sine.inOut",stagger:0.12},0);
tl.to("#s1 .orb",{x:"+=26",y:"-=18",duration:2,yoyo:true,repeat:1,ease:"sine.inOut"},0);
// tips
TIPS.forEach(function(t){
  var at=t.at, id="#"+t.id;
  tl.from(id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
  tl.from(id+" .icon",{scale:0,rotate:-35,opacity:0,duration:.55,ease:"back.out(2)"},at+.12);
  tl.from(id+" .num",{scale:.3,rotate:-14,opacity:0,duration:.55,ease:"back.out(1.7)"},at+.2);
  tl.from(id+" .blob",{scale:0,opacity:0,duration:.5,ease:"back.out(2)"},at+.2);
  tl.from(id+" .headline",{y:55,opacity:0,duration:.5,ease:"power3.out"},at+.34);
  tl.fromTo(id+" .bar",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+.5);
  tl.from(id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.42);
  ken("#"+t.id+"c",at,t.dur);
  // continuous "alive" motion — deterministic finite repeats
  var rep=Math.max(2,Math.ceil(t.dur/1.3));
  tl.to(id+" .dot",{y:"-=26",duration:1.3,yoyo:true,repeat:rep,ease:"sine.inOut",stagger:0.1},at);
  tl.to(id+" .orb",{x:"+=32",y:"-=22",duration:2.2,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/2.2)),ease:"sine.inOut"},at);
  tl.to(id+" .icon",{y:-16,duration:1.3,yoyo:true,repeat:rep,ease:"sine.inOut"},at+.8);
  tl.to(id+" .blob",{scale:1.06,duration:1.2,yoyo:true,repeat:rep,ease:"sine.inOut"},at+.8);
  flash(at);
});
// outro
flash(OUTRO_AT);
tl.from("#sOut .logoBig",{scale:.4,opacity:0,rotate:-10,duration:.7,ease:"back.out(1.7)"},OUTRO_AT+.05);
tl.from("#sOut .brandBig",{y:60,opacity:0,duration:.6,ease:"power3.out"},OUTRO_AT+.35);
tl.from("#sOut .brandTag",{y:40,opacity:0,duration:.5,ease:"power2.out"},OUTRO_AT+.6);
tl.from("#sOut .follow",{scale:.6,opacity:0,duration:.5,ease:"back.out(2)"},OUTRO_AT+.8);
tl.to("#sOut .follow",{scale:1.06,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},OUTRO_AT+1.3);
window.__timelines["main"] = tl;
</script>
</body>
</html>`;
  return page;
}
