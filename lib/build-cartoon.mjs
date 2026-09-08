// "Cartoon Mascot" builder — the visual style the channel owner sent
// reference reels for on 2026-09-07, replacing the real-screenshot-in-phone
// system (build-ink.mjs) entirely: an off-white paper ground, one consistent
// illustrated character (lib/mascot.mjs) reacting to each line, simple flat
// symbolic icons (lib/flat-icons.mjs) instead of real app screenshots, and a
// dark rounded caption pill instead of a full-width colour band.
//
// Keeps the same timing contract as build-ink.mjs (data-start/data-duration
// per clip, pack.hookDuration/tipDurations/outroDuration) so it plugs into
// the existing plan-voice/make-voice/daily-render pipeline unchanged — only
// the picture changes, not how long anything is on screen.
import { readFileSync } from "node:fs";
import { mascotSVG, mascotCSS, mascotTimeline } from "./mascot.mjs";
import { flatIcon, FLAT_ICON_KEYS } from "./flat-icons.mjs";

const b64 = (p) => readFileSync(p).toString("base64");
const FONT_FACES = [
  [400, "Regular"], [500, "Medium"], [700, "Bold"], [800, "ExtraBold"], [900, "Black"],
]
  .map(([w, n]) => `@font-face{font-family:"Vazirmatn";font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64(`public/fonts/Vazirmatn-${n}.woff2`)}) format("woff2");}`)
  .join("\n");
const GSAP = readFileSync("public/gsap.min.js", "utf8");
const PD = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

// Keyword -> icon, checked in order (first match wins). Falls back to
// "lightbulb", a safe generic "here's the idea" icon.
const ICON_RULES = [
  [/ویو|بازدید|search|جست/i, "eye"],
  [/الگوریتم|پیشنهاد|فید|توصیه|discover|explore/i, "compass"],
  [/رشد|افزایش|درصد|بیشتر|ترند|viral|وایرال/i, "growth"],
  [/فالوور|مخاطب|دنبال کن|follow/i, "personPlus"],
  [/لایک|قلب|like/i, "heart"],
  [/کامنت|نظر|comment/i, "comment"],
  [/اشتراک|شیر|share|فوروارد/i, "share"],
  [/ذخیره|بوکمارک|save/i, "bookmark"],
  [/حذف|پاک|دور بریز|هدر|trash/i, "trash"],
  [/زمان|ساعت|وقت/i, "clock"],
  [/برنامه|تقویم|جدول|هر روز|روزانه/i, "calendar"],
  [/ایده|نکته|ترفند|تیپ/i, "lightbulb"],
  [/تنظیم|ادمین|مدیریت|کنترل/i, "gear"],
  [/تبلیغ|معرفی|اعلام/i, "megaphone"],
  [/گوشی|اپلیکیشن|اپ|phone/i, "phoneBlank"],
];
export function iconFor(text = "") {
  const t = String(text);
  for (const [re, key] of ICON_RULES) if (re.test(t)) return key;
  return "lightbulb";
}

export function buildCartoonHTML(pack) {
  const n = pack.tips.length;
  const TOTAL = pack.duration ?? 56;
  const HOOK = pack.hookDuration ?? 4;
  const OUTRO = pack.outroDuration ?? 6;
  const DURS = Array.isArray(pack.tipDurations) && pack.tipDurations.length === n
    ? pack.tipDurations
    : Array.from({ length: n }, () => (TOTAL - HOOK - OUTRO) / n);
  const tipStart = (i) => HOOK + DURS.slice(0, i).reduce((a, d) => a + d, 0);
  const tipLen = (i) => DURS[i];

  const PAPER = "#F3EFE6";
  const INK = "#20242E";
  const SWEATER = (pack.ink && pack.ink.pair && pack.ink.pair[0]) || "#5B8DEF";
  // The cap badge reads as "branding" without drawing a specific app's
  // logo (never guessed/generic per the Visual Truth Gate) — tinted with
  // the video's own accent colour so it still matches the rest of the scene.
  const BADGE = (pack.ink && pack.ink.pair && pack.ink.pair[1]) || "#E1306C";
  const PILL_BG = "#181B22";

  const plain = (s) => String(s).replace(/<[^>]*>/g, "").trim();

  // A short line rides in the pill; a long one still fits by shrinking once.
  const pill = (text) => {
    const t = plain(text);
    const long = t.length > 34;
    return `<div class="pill${long ? " long" : ""}"><span>${t}</span></div>`;
  };

  const iconStage = (key, big = false) =>
    `<div class="iconstage${big ? " big" : ""}">${flatIcon(key)}</div>`;

  // Hook: mascot worried/curious + the icon for the video's own topic.
  const hookIconKey = iconFor(pack.hook.ask || pack.title || "");
  const hookSection = `
  <section id="s1" class="clip scene hookscene" data-start="0" data-duration="${HOOK}" data-track-index="1">
    <div class="paper"></div>
    ${iconStage(hookIconKey, true)}
    <div class="kicktop">${pack.kicker || pack.name || "نکتهٔ رشد"}</div>
    <div class="mascotwrap m-left"><div class="mwbox">${mascotSVG({ pose: "worried", sweater: SWEATER, badge: BADGE })}</div></div>
    ${pill(pack.hook.ask || pack.hook.l1)}
  </section>`;

  const POSES = ["point", "worried", "hold", "cheer"];
  const scenes = pack.tips
    .map((tip, i) => {
      const at = tipStart(i);
      const dur = tipLen(i);
      const key = iconFor(tip.text || tip.head || "");
      const pose = POSES[i % POSES.length];
      const side = i % 2 === 0 ? "m-left" : "m-right";
      return `
  <section id="s${i + 2}" class="clip scene" data-start="${at.toFixed(3)}" data-duration="${dur.toFixed(3)}" data-track-index="1">
    <div class="paper"></div>
    ${iconStage(key)}
    <div class="stepbadge">${PD(i + 1)}</div>
    <div class="mascotwrap ${side}"><div class="mwbox">${mascotSVG({ pose, sweater: SWEATER, badge: BADGE })}</div></div>
    ${pill(tip.text || tip.head)}
  </section>`;
    })
    .join("\n");

  const OUT_AT = HOOK + DURS.reduce((a, d) => a + d, 0);
  const outroSection = `
  <section id="sOut" class="clip outroscene" data-start="${OUT_AT.toFixed(3)}" data-duration="${OUTRO}" data-track-index="1">
    <div class="paper"></div>
    ${iconStage("growth", true)}
    <div class="mascotwrap m-center"><div class="mwbox big">${mascotSVG({ pose: "cheer", sweater: SWEATER, badge: BADGE, sit: true })}</div></div>
    ${pack.outroAsk ? pill(pack.outroAsk) : ""}
    <div class="followchip"><span>${pack.name || "GapMedia"} را دنبال کن</span></div>
  </section>`;

  const tipsData = pack.tips.map((tip, i) => ({ id: "s" + (i + 2), at: +tipStart(i).toFixed(3), dur: +tipLen(i).toFixed(3), i }));

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
html,body{width:1080px;height:1920px;overflow:hidden;background:${PAPER}}
body{font-family:"Vazirmatn",sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:${PAPER}}
.clip{position:absolute;inset:0;overflow:hidden;direction:rtl}
.paper{position:absolute;inset:0;z-index:0;
  background:radial-gradient(ellipse 900px 700px at 50% -6%, rgba(255,255,255,.9), transparent 60%),
    linear-gradient(180deg,#F8F5EF 0%,${PAPER} 55%,#EAE4D6 100%)}

.kicktop{position:absolute;top:120px;left:0;right:0;z-index:3;text-align:center;
  font-weight:800;font-size:34px;color:#8a8272;letter-spacing:.04em}

/* --- the illustration stage: one big icon, centred in the upper 2/3 --- */
.iconstage{position:absolute;left:50%;top:300px;transform:translateX(-50%);z-index:2;
  width:520px;height:520px;display:grid;place-items:center}
.iconstage.big{width:600px;height:600px;top:250px}
.iconstage .ficon{width:100%;height:100%;filter:drop-shadow(0 22px 40px rgba(30,30,20,.14))}
.stepbadge{position:absolute;left:80px;top:130px;z-index:4;width:96px;height:96px;border-radius:50%;
  background:${PILL_BG};color:#fff;font-weight:900;font-size:48px;display:grid;place-items:center;
  box-shadow:0 14px 30px rgba(20,20,20,.28)}

/* --- mascot --- */
.mascotwrap{width:420px}
.mascotwrap .mwbox{width:100%}
.mascotwrap .mwbox.big{width:130%;margin-left:-15%}
.mascotwrap.m-left{position:absolute;left:40px;bottom:120px;z-index:2}
.mascotwrap.m-right{position:absolute;right:40px;bottom:120px;z-index:2}
.mascotwrap.m-center{position:absolute;left:50%;bottom:60px;transform:translateX(-50%);z-index:2;width:460px}
${mascotCSS()}

/* --- caption pill --- */
.pill{position:absolute;left:70px;right:70px;bottom:210px;z-index:5;
  background:${PILL_BG};border-radius:34px;padding:30px 46px;
  box-shadow:0 20px 44px rgba(10,10,10,.30);text-align:center}
.pill span{display:block;color:#fff;font-weight:800;font-size:52px;line-height:1.4}
.pill.long span{font-size:42px}
.outroscene .pill{bottom:270px}
.followchip{position:absolute;left:50%;bottom:110px;transform:translateX(-50%);z-index:5;
  background:${SWEATER};color:#fff;font-weight:900;font-size:38px;border-radius:999px;
  padding:22px 52px;box-shadow:0 16px 34px rgba(20,20,20,.24)}

.rule{position:absolute;top:0;left:0;right:0;height:8px;background:rgba(20,20,20,.08);z-index:50}
.rule i{display:block;height:100%;background:${SWEATER};transform-origin:right center}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${TOTAL}">
  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="20">
    <div class="rule"><i id="rulefill"></i></div>
  </div>
${hookSection}
${scenes}
${outroSection}
</div>

<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
var TIPS = ${JSON.stringify(tipsData)};
var HOOK_DUR = ${HOOK};
var OUT_AT = ${OUT_AT.toFixed(3)};
var TOTAL = ${TOTAL};

tl.fromTo("#rulefill",{scaleX:0},{scaleX:1,ease:"none",duration:TOTAL},0);

// hook
tl.fromTo("#s1 .iconstage",{scale:.7,opacity:0,rotate:-6},{scale:1,opacity:1,rotate:0,duration:.5,ease:"back.out(1.6)"},.1);
tl.fromTo("#s1 .kicktop",{opacity:0,y:-16},{opacity:1,y:0,duration:.4,ease:"power2.out"},.05);
tl.fromTo("#s1 .pill",{y:40,opacity:0},{y:0,opacity:1,duration:.45,ease:"back.out(1.5)"},.35);
${mascotTimeline("#s1", 0.15, HOOK)}

TIPS.forEach(function(t){
  var sel = "#" + t.id;
  tl.fromTo(sel+" .iconstage",{scale:.7,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:.5,ease:"back.out(1.6)"},t.at+.08);
  tl.fromTo(sel+" .stepbadge",{scale:0,rotate:-20},{scale:1,rotate:0,duration:.4,ease:"back.out(2.2)"},t.at+.02);
  tl.fromTo(sel+" .pill",{y:40,opacity:0},{y:0,opacity:1,duration:.45,ease:"back.out(1.5)"},t.at+.3);
});
${pack.tips.map((_, i) => mascotTimeline(`#s${i + 2}`, tipStart(i), tipLen(i))).join("\n")}

// outro
tl.fromTo("#sOut .iconstage",{scale:.7,opacity:0},{scale:1,opacity:1,duration:.5,ease:"back.out(1.6)"},OUT_AT+.1);
tl.fromTo("#sOut .pill",{y:30,opacity:0},{y:0,opacity:1,duration:.4,ease:"back.out(1.5)"},OUT_AT+.3);
tl.fromTo("#sOut .followchip",{scale:.8,opacity:0},{scale:1,opacity:1,duration:.4,ease:"back.out(1.8)"},OUT_AT+.5);
${mascotTimeline("#sOut", OUT_AT + 0.15, OUTRO)}

window.__timelines.main = tl;
</script>
</body>
</html>`;
}

// exported for the composition dry-run/QC scripts (mirrors buildInkHTML's shape)
export function tipStart(pack, i) {
  const HOOK = pack.hookDuration ?? 4;
  const n = pack.tips.length;
  const TOTAL = pack.duration ?? 56;
  const OUTRO = pack.outroDuration ?? 6;
  const DURS = Array.isArray(pack.tipDurations) && pack.tipDurations.length === n
    ? pack.tipDurations
    : Array.from({ length: n }, () => (TOTAL - HOOK - OUTRO) / n);
  return HOOK + DURS.slice(0, i).reduce((a, d) => a + d, 0);
}
