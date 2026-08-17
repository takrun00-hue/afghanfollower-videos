// Generator: builds a self-contained index.html for the TikTok viral-tips video.
// Embeds Vazirmatn (Persian) fonts + AfghanFollower logo as base64 so the
// offline headless-Chrome renderer needs no external assets.
import { readFileSync, writeFileSync } from "node:fs";

const b64 = (p) => readFileSync(p).toString("base64");

const fonts = [
  ["Vazirmatn", 400, "public/fonts/Vazirmatn-Regular.woff2"],
  ["Vazirmatn", 500, "public/fonts/Vazirmatn-Medium.woff2"],
  ["Vazirmatn", 700, "public/fonts/Vazirmatn-Bold.woff2"],
  ["Vazirmatn", 800, "public/fonts/Vazirmatn-ExtraBold.woff2"],
  ["Vazirmatn", 900, "public/fonts/Vazirmatn-Black.woff2"],
];
const fontFaces = fonts
  .map(
    ([fam, w, p]) =>
      `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b64(
        p
      )}) format("woff2");}`
  )
  .join("\n");

const logo = "data:image/jpeg;base64," + b64("public/logo.jpg");

// ---- Scene copy (Persian) ----
const html = `<!doctype html>
<html lang="fa">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title> ۵ نکته وایرال شدن در تیک‌تاک — افغان فالور </title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
${fontFaces}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#05081f}
body{font-family:"Vazirmatn",sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#05081f}
.wrap,.sub,.brandchip,.kicker,.headline,.hook-l1,.hook-l2,.brandBig,.brandTag,.follow{direction:rtl}
.clip{position:absolute;inset:0;overflow:hidden}
.bg{position:absolute;inset:0;background:linear-gradient(160deg,#1a2a9e 0%,#0c1560 45%,#05081f 100%)}
.bg::before{content:"";position:absolute;width:1300px;height:1300px;border-radius:50%;top:-260px;right:-360px;
  background:radial-gradient(circle,rgba(58,91,255,.55),rgba(58,91,255,0) 62%)}
.bg::after{content:"";position:absolute;width:1100px;height:1100px;border-radius:50%;bottom:-320px;left:-320px;
  background:radial-gradient(circle,rgba(34,224,240,.30),rgba(34,224,240,0) 62%)}
.bg.m::after{background:radial-gradient(circle,rgba(255,45,155,.34),rgba(255,45,155,0) 62%)}
.bg.y::after{background:radial-gradient(circle,rgba(255,210,63,.30),rgba(255,210,63,0) 62%)}
.grid{position:absolute;inset:0;opacity:.10;
  background-image:linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px);
  background-size:90px 90px}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:200px 90px 360px}
.kicker{font-weight:800;font-size:40px;letter-spacing:.02em;color:#bcd0ff;margin-bottom:38px;
  padding:16px 34px;border:2px solid rgba(188,208,255,.5);border-radius:999px;background:rgba(255,255,255,.05)}
.num{font-weight:900;line-height:.85;font-size:360px;color:#05081f;position:relative}
.numwrap{position:relative;margin-bottom:14px}
.numwrap .blob{position:absolute;inset:-40px -70px;border-radius:60px;z-index:-1;filter:blur(2px)}
.headline{font-weight:900;font-size:118px;line-height:1.06;letter-spacing:-0.01em;margin-top:6px}
.headline .hl{color:#22e0f0}
.bar{height:16px;width:300px;border-radius:99px;margin:44px 0 0;transform-origin:right center}
.icon{margin-bottom:26px}
.sub{position:absolute;left:80px;right:80px;bottom:220px;font-weight:700;font-size:52px;line-height:1.5;
  color:#0a0f33;background:#ffffff;border-radius:34px;padding:34px 44px;
  box-shadow:0 24px 60px rgba(0,0,0,.45)}
.sub .em{color:#1732c9}
.hook-l1{font-weight:800;font-size:88px;line-height:1.18;color:#dfe7ff}
.hook-l2{font-weight:900;font-size:150px;line-height:.98;letter-spacing:-0.01em;margin-top:24px}
.hook-l2 .hl{color:#22e0f0}
.hook-badge{font-weight:900;font-size:44px;color:#05081f;background:#22e0f0;border-radius:99px;
  padding:20px 46px;margin-top:54px;display:inline-block}
.progress{position:absolute;top:0;left:0;right:0;height:14px;background:rgba(255,255,255,.12);z-index:50}
.progress .fill{height:100%;width:100%;transform-origin:right center;
  background:linear-gradient(90deg,#22e0f0,#3a5bff 45%,#ff2d9b)}
.brandchip{position:absolute;top:64px;right:64px;display:flex;align-items:center;gap:20px;z-index:40}
.brandchip img{width:96px;height:96px;border-radius:24px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.brandchip .bt{font-weight:900;font-size:40px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.5)}
/* outro */
.outro .bg{background:linear-gradient(160deg,#22e0f0 0%,#1e37c9 40%,#0b1560 100%)}
.outro .wrap{padding:0 90px}
.logoBig{width:360px;height:360px;border-radius:80px;box-shadow:0 40px 90px rgba(0,0,0,.55);margin-bottom:56px}
.brandBig{font-weight:900;font-size:170px;line-height:.95;letter-spacing:-0.01em}
.brandTag{font-weight:700;font-size:56px;color:#eaf6ff;margin-top:40px;line-height:1.4}
.follow{margin-top:64px;font-weight:900;font-size:60px;color:#0b1560;background:#fff;
  border-radius:99px;padding:34px 90px;box-shadow:0 22px 50px rgba(0,0,0,.4)}
.flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:45;pointer-events:none;mix-blend-mode:overlay}
svg{display:block}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="30">

  <!-- persistent progress bar -->
  <div class="clip" data-start="0" data-duration="30" data-track-index="20">
    <div class="progress"><div class="fill" id="pfill"></div></div>
  </div>

  <!-- persistent brand chip (hidden during outro window visually via its own clip) -->
  <div class="clip" data-start="0" data-duration="27" data-track-index="19">
    <div class="brandchip"><img src="${logo}" alt="logo" /><span class="bt">افغان فالور</span></div>
  </div>

  <!-- ===== HOOK 0-3 ===== -->
  <section id="s1" class="clip" data-start="0" data-duration="3" data-track-index="1">
    <div class="bg"></div><div class="grid"></div>
    <div class="wrap" id="s1c">
      <div class="hook-l1">می‌خوای ویدیوهای <span style="color:#22e0f0">TikTok</span><br/>بازدید بیشتری بگیره؟</div>
      <div class="hook-l2">این <span class="hl">۵ نکته</span><br/>رو ببین!</div>
    </div>
  </section>

  <!-- ===== TIP 1 3-8 ===== -->
  <section id="s2" class="clip" data-start="3" data-duration="5" data-track-index="1">
    <div class="bg"></div><div class="grid"></div>
    <div class="wrap" id="s2c">
      <div class="kicker">نکته اول</div>
      <div class="icon">${iconMagnet("#22e0f0")}</div>
      <div class="numwrap"><div class="blob" style="background:#22e0f0"></div><div class="num">۱</div></div>
      <div class="headline">قلاب قوی <span class="hl">بساز</span></div>
      <div class="bar" style="background:#22e0f0"></div>
    </div>
    <div class="sub">ویدیو رو با یک <b class="em">جملهٔ قوی</b>، سؤال یا چیزی که مخاطب رو کنجکاو کنه شروع کن.</div>
  </section>

  <!-- ===== TIP 2 8-13 ===== -->
  <section id="s3" class="clip" data-start="8" data-duration="5" data-track-index="1">
    <div class="bg m"></div><div class="grid"></div>
    <div class="wrap" id="s3c">
      <div class="kicker">نکته دوم</div>
      <div class="icon">${iconBolt("#ff2d9b")}</div>
      <div class="numwrap"><div class="blob" style="background:#ff2d9b"></div><div class="num">۲</div></div>
      <div class="headline">کوتاه و <span style="color:#ff6bbd">بی‌حاشیه</span></div>
      <div class="bar" style="background:#ff2d9b"></div>
    </div>
    <div class="sub">محتوات رو <b class="em">کوتاه و بدون حاشیه</b> بساز؛ چند ثانیهٔ اول خیلی مهمه.</div>
  </section>

  <!-- ===== TIP 3 13-18 ===== -->
  <section id="s4" class="clip" data-start="13" data-duration="5" data-track-index="1">
    <div class="bg y"></div><div class="grid"></div>
    <div class="wrap" id="s4c">
      <div class="kicker">نکته سوم</div>
      <div class="icon">${iconTrend("#ffd23f")}</div>
      <div class="numwrap"><div class="blob" style="background:#ffd23f"></div><div class="num">۳</div></div>
      <div class="headline">سوار موج <span style="color:#ffd23f">ترند</span> شو</div>
      <div class="bar" style="background:#ffd23f"></div>
    </div>
    <div class="sub">از <b class="em">ترندها و صداهای مرتبط</b> استفاده کن، اما متناسب با موضوع پیجت.</div>
  </section>

  <!-- ===== TIP 4 18-24 ===== -->
  <section id="s5" class="clip" data-start="18" data-duration="6" data-track-index="1">
    <div class="bg"></div><div class="grid"></div>
    <div class="wrap" id="s5c">
      <div class="kicker">نکته چهارم</div>
      <div class="icon">${iconChat("#22e0f0")}</div>
      <div class="numwrap"><div class="blob" style="background:#22e0f0"></div><div class="num">۴</div></div>
      <div class="headline">تعامل <span class="hl">بساز</span></div>
      <div class="bar" style="background:#22e0f0"></div>
    </div>
    <div class="sub">مخاطب رو به <b class="em">کامنت، لایک و اشتراک‌گذاری</b> دعوت کن.</div>
  </section>

  <!-- ===== TIP 5 24-27 ===== -->
  <section id="s6" class="clip" data-start="24" data-duration="3" data-track-index="1">
    <div class="bg m"></div><div class="grid"></div>
    <div class="wrap" id="s6c">
      <div class="kicker">نکته پنجم</div>
      <div class="icon">${iconChart("#ff2d9b")}</div>
      <div class="numwrap"><div class="blob" style="background:#ff2d9b"></div><div class="num">۵</div></div>
      <div class="headline">آمار رو بخون، <span style="color:#ff6bbd">تست کن</span></div>
      <div class="bar" style="background:#ff2d9b"></div>
    </div>
    <div class="sub"><b class="em">Watch Time</b> و <b class="em">Retention</b> رو بررسی کن و فرمت‌های مختلف رو تست کن.</div>
  </section>

  <!-- ===== OUTRO 27-30 ===== -->
  <section id="s7" class="clip outro" data-start="27" data-duration="3" data-track-index="1">
    <div class="bg"></div>
    <div class="wrap" id="s7c">
      <img class="logoBig" src="${logo}" alt="افغان فالور" />
      <div class="brandBig">افغان فالور</div>
      <div class="brandTag">اگر به فکر رشد هستید،<br/>ما را دنبال کنید.</div>
      <div class="follow">دنبال کنید +</div>
    </div>
  </section>

  <!-- cut flashes -->
  <div id="fx" class="clip" data-start="0" data-duration="30" data-track-index="30">
    <div class="flash" id="flash"></div>
  </div>

</div>

<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });

// progress bar across the whole video
tl.fromTo("#pfill",{scaleX:0},{scaleX:1,ease:"none",duration:30},0);

function ken(sel,at,dur){ tl.fromTo(sel,{scale:1},{scale:1.05,ease:"none",duration:dur},at); }
function flash(at){ tl.fromTo("#flash",{opacity:.0},{opacity:.55,duration:.12,ease:"power1.out"},at)
                      .to("#flash",{opacity:0,duration:.28,ease:"power1.in"},at+.12); }

// ---- HOOK ----
tl.from("#s1 .hook-l1",{y:70,opacity:0,duration:.6,ease:"power3.out"},0.05);
tl.from("#s1 .hook-l2",{y:90,opacity:0,scale:.9,duration:.7,ease:"back.out(1.6)"},0.35);
ken("#s1c",0,3);

// ---- tip scene helper ----
function tip(id,at){
  tl.from("#"+id+" .kicker",{y:-40,opacity:0,duration:.45,ease:"power3.out"},at+.05);
  tl.from("#"+id+" .icon",{scale:0,rotate:-35,opacity:0,duration:.6,ease:"back.out(2)"},at+.12);
  tl.from("#"+id+" .num",{scale:.3,rotate:-14,opacity:0,duration:.6,ease:"back.out(1.7)"},at+.2);
  tl.from("#"+id+" .blob",{scale:0,opacity:0,duration:.5,ease:"back.out(2)"},at+.2);
  tl.from("#"+id+" .headline",{y:60,opacity:0,duration:.55,ease:"power3.out"},at+.34);
  tl.fromTo("#"+id+" .bar",{scaleX:0},{scaleX:1,duration:.5,ease:"power2.out"},at+.5);
  tl.from("#"+id+" .sub",{y:50,opacity:0,duration:.5,ease:"power3.out"},at+.42);
  ken("#"+id+"c",at,3);
}
tip("s2",3); flash(3);
tip("s3",8); flash(8);
tip("s4",13); flash(13);
tip("s5",18); flash(18);
tip("s6",24); flash(24);

// ---- OUTRO ----
flash(27);
tl.from("#s7 .logoBig",{scale:.4,opacity:0,rotate:-10,duration:.7,ease:"back.out(1.7)"},27.05);
tl.from("#s7 .brandBig",{y:60,opacity:0,duration:.6,ease:"power3.out"},27.35);
tl.from("#s7 .brandTag",{y:40,opacity:0,duration:.5,ease:"power2.out"},27.6);
tl.from("#s7 .follow",{scale:.6,opacity:0,duration:.5,ease:"back.out(2)"},27.8);
tl.to("#s7 .follow",{scale:1.06,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},28.3);

window.__timelines["main"] = tl;
</script>
</body>
</html>`;

// ---- inline SVG icons ----
function iconMagnet(c){return svg('<path d="M20 12v22a24 24 0 0 0 48 0V12H54v22a10 10 0 0 1-20 0V12z" fill="none" stroke="'+c+'" stroke-width="7" stroke-linejoin="round"/><rect x="20" y="8" width="14" height="10" fill="'+c+'"/><rect x="54" y="8" width="14" height="10" fill="'+c+'"/>');}
function iconBolt(c){return svg('<path d="M50 6 22 48h20l-6 34 30-46H44z" fill="'+c+'"/>');}
function iconTrend(c){return svg('<path d="M10 62 32 40l14 14 24-28" fill="none" stroke="'+c+'" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 26h16v16" fill="none" stroke="'+c+'" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>');}
function iconChat(c){return svg('<path d="M14 18h56a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H36L20 78V60h-6a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill="'+c+'"/><circle cx="30" cy="39" r="5" fill="#05081f"/><circle cx="46" cy="39" r="5" fill="#05081f"/><circle cx="62" cy="39" r="5" fill="#05081f"/>');}
function iconChart(c){return svg('<rect x="12" y="48" width="16" height="30" fill="'+c+'"/><rect x="36" y="30" width="16" height="48" fill="'+c+'"/><rect x="60" y="14" width="16" height="64" fill="'+c+'"/>');}
function svg(inner){return '<svg width="120" height="120" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">'+inner+'</svg>';}

writeFileSync("index.html", html);
console.log("wrote index.html", html.length, "bytes");
