// "Editorial Ink" builder — matches the reference reel's visual language:
// warm paper ground, a strict two-colour palette (navy + crimson), engraved
// hand-drawn illustrations, solid circle colour-blocks, full-width text bands,
// and whip-blur transitions instead of hard cuts.
import { readFileSync } from "node:fs";
import { renderUI, UI_CSS } from "./ui-mock.mjs";
import { retentionLineFor } from "./retention.mjs";
import { sceneArtPlan, sceneArt, stepStage, iconKeyFor, hookArtFor, MOTIF_CSS } from "./scene-art.mjs";
import { appScreen, toolCard, platformHero, PLATFORM_HERO_CSS } from "./app-screen.mjs";
import { platformMark, MARK_CSS } from "./platform-marks.mjs";
import { brandFor } from "./brand.mjs";

const b64 = (p) => readFileSync(p).toString("base64");
const FONT_FACES = [
  [400, "Regular"], [500, "Medium"], [700, "Bold"], [800, "ExtraBold"], [900, "Black"],
]
  .map(([w, n]) => `@font-face{font-family:"Vazirmatn";font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64(`public/fonts/Vazirmatn-${n}.woff2`)}) format("woff2");}`)
  .join("\n");
const GSAP = readFileSync("public/gsap.min.js", "utf8");

// ---------- engraved line illustrations ----------
// Stroke-only art + hatching; a turbulence filter makes the strokes read hand-drawn.
const ART = {
  target: `<circle cx="100" cy="104" r="72" /><circle cx="100" cy="104" r="50" /><circle cx="100" cy="104" r="28" /><circle cx="100" cy="104" r="9" fill="currentColor"/>
    <path d="M104 100 168 38"/><path d="M150 30l22-8-6 22"/><path d="M156 52l16-14"/>
    <path d="M62 168l24-40M138 168l-24-40"/>
    <path d="M40 60l-12 8M46 44l-14 4M52 152l-16 8M160 150l16 10"/>`,
  bulb: `<path d="M100 24a48 48 0 0 0-28 87c6 5 8 9 8 15h40c0-6 2-10 8-15A48 48 0 0 0 100 24z"/>
    <path d="M80 140h40M86 154h28M92 168h16"/>
    <path d="M100 44v34M86 60l14 12M114 60l-14 12"/>
    <path d="M30 60l-14-8M170 60l14-8M28 118H12M172 118h16M44 26 34 16M156 26l10-10"/>`,
  phone: `<rect x="56" y="18" width="88" height="164" rx="16"/><rect x="66" y="34" width="68" height="126" rx="6"/>
    <path d="M88 26h24"/><circle cx="100" cy="172" r="7"/>
    <path d="M76 52h56M76 68h40M76 84h56M76 100h32M76 116h48M76 132h28"/>`,
  chart: `<path d="M28 172h150"/><path d="M28 172V28"/>
    <rect x="52" y="118" width="26" height="54"/><rect x="92" y="82" width="26" height="90"/><rect x="132" y="48" width="26" height="124"/>
    <path d="M56 124h18M56 134h18M96 88h18M96 98h18M136 54h18M136 64h18"/>
    <path d="M44 100l30-26 34 22 40-46"/>`,
  clock: `<circle cx="100" cy="102" r="74"/><circle cx="100" cy="102" r="62"/>
    <path d="M100 60v46l30 18"/><circle cx="100" cy="102" r="6" fill="currentColor"/>
    <path d="M100 34v10M100 160v10M32 102h10M158 102h10M52 54l7 7M141 150l7 7M148 54l-7 7M59 150l-7 7"/>`,
  megaphone: `<path d="M36 84v34l30 8 62 34V42L66 76z"/><path d="M128 60c22 8 22 62 0 70"/>
    <path d="M150 52c30 14 30 90 0 104"/><path d="M66 126l10 44h22l-8-38"/>
    <path d="M44 92h14M44 102h14M44 112h14"/>`,
  camera: `<rect x="24" y="56" width="152" height="106" rx="14"/><path d="M74 56l12-20h28l12 20"/>
    <circle cx="100" cy="110" r="34"/><circle cx="100" cy="110" r="22"/><circle cx="100" cy="110" r="10"/>
    <path d="M40 76h18M152 76h10M84 92l-8 8M116 128l8-8"/>`,
  rocket: `<path d="M100 16c26 22 38 54 38 88l-16 26H78l-16-26c0-34 12-66 38-88z"/>
    <circle cx="100" cy="82" r="18"/><path d="M62 118 34 146l30-4M138 118l28 28-30-4"/>
    <path d="M86 154c6 18 8 24 14 30 6-6 8-12 14-30"/><path d="M92 46h16M88 60h24"/>`,
  key: `<circle cx="66" cy="102" r="38"/><circle cx="66" cy="102" r="16"/>
    <path d="M104 102h72"/><path d="M150 102v26M172 102v20"/><path d="M40 78l-10-8M40 126l-10 8"/>`,
  magnet: `<path d="M50 40v58a50 50 0 0 0 100 0V40h-32v58a18 18 0 0 1-36 0V40z"/>
    <path d="M50 40h32M118 40h32"/><path d="M56 150l-12 12M144 150l12 12M100 168v16"/>`,
  star: `<path d="M100 18 124 76l62 6-47 42 14 62-53-34-53 34 14-62-47-42 62-6z"/>
    <path d="M100 44 88 78l-34 4M100 44l12 34 34 4"/>
    <path d="M74 132l10-30M126 132l-10-30"/>`,
  users: `<circle cx="70" cy="58" r="28"/><path d="M22 158a48 48 0 0 1 96 0"/>
    <circle cx="142" cy="70" r="22"/><path d="M116 152a40 40 0 0 1 64-8"/>
    <path d="M52 44c10-8 26-8 36 0M58 66h24"/>
    <path d="M34 140h72M40 152h60M126 140h44M132 152h34"/>
    <path d="M70 86v16M142 92v12"/>`,
  wand: `<path d="M40 168 128 80"/><path d="M120 72l16 16"/>
    <path d="M150 24l6 18 18 6-18 6-6 18-6-18-18-6 18-6z"/>
    <circle cx="60" cy="52" r="6"/><circle cx="168" cy="120" r="6"/><circle cx="96" cy="30" r="4"/>`,
  mic: `<rect x="80" y="20" width="40" height="76" rx="20"/><path d="M56 88a44 44 0 0 0 88 0"/>
    <path d="M100 132v34M74 168h52"/><path d="M88 40h24M88 56h24M88 72h24"/>`,
  globe: `<circle cx="100" cy="102" r="72"/><path d="M28 102h144"/>
    <path d="M100 30c26 22 26 122 0 144M100 30c-26 22-26 122 0 144"/>
    <path d="M46 62c30 14 78 14 108 0M46 142c30-14 78-14 108 0"/>`,
  calendar: `<rect x="28" y="42" width="144" height="130" rx="10"/><path d="M28 78h144"/>
    <path d="M64 26v28M136 26v28"/>
    <path d="M56 100h20M92 100h20M128 100h20M56 130h20M92 130h20M128 130h20"/>`,
  layers: `<path d="M100 22 178 64l-78 42-78-42z"/><path d="M22 100l78 42 78-42"/><path d="M22 136l78 42 78-42"/>
    <path d="M62 60l38-20 38 20M74 68l26-14"/>`,
  chat: `<path d="M24 36h152v92H88l-42 34V128H24z"/>
    <path d="M52 66h96M52 92h60"/>
    <path d="M36 46h8M36 118h8M164 46h-8"/>`,
  chip: `<rect x="52" y="52" width="96" height="96" rx="8"/><rect x="76" y="76" width="48" height="48" rx="4"/>
    <path d="M72 24v28M100 24v28M128 24v28M72 148v28M100 148v28M128 148v28M24 72h28M24 100h28M24 128h28M148 72h28M148 100h28M148 128h28"/>`,
  trend: `<path d="M24 150 76 96l32 30 66-76"/><path d="M144 46h34v34"/>
    <path d="M24 172h152"/><path d="M46 160v-18M86 160v-34M126 160v-26M166 160v-52"/>`,
  refresh: `<path d="M170 100a70 70 0 1 1-22-50"/><path d="M152 20v36h-36"/>
    <path d="M60 100a40 40 0 0 0 40 40"/>`,
  heart: `<path d="M100 174C40 130 22 104 22 74a38 38 0 0 1 78-16 38 38 0 0 1 78 16c0 30-18 56-78 100z"/>
    <path d="M56 66c-6 10-5 22 2 32M70 58c-8 10-8 22-2 32"/>
    <path d="M132 62c8 10 8 24 2 34"/>
    <path d="M84 132c8 8 24 8 32 0"/>`,
  bookmark: `<path d="M56 24h88a8 8 0 0 1 8 8v144l-52-40-52 40V32a8 8 0 0 1 8-8z"/>
    <path d="M80 62h40"/>`,
  write: `<path d="M28 172h144"/><path d="M62 146l16-52 62-62 26 26-62 62z"/>
    <path d="M128 58l26 26"/><path d="M78 94l26 26"/>`,
  toggle: `<rect x="24" y="66" width="152" height="68" rx="34"/>
    <circle cx="142" cy="100" r="22" fill="currentColor"/><path d="M52 100h34"/>`,
  send: `<path d="M24 100 176 34l-30 132-42-40z"/><path d="M104 126l-30 34v-46"/>
    <path d="M24 100l80 26 42-92"/>`,
  shop: `<path d="M32 78h136v96a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8z"/>
    <path d="M26 78l14-40h120l14 40"/><path d="M32 78h136"/>
    <path d="M84 182v-52h32v52"/><path d="M68 44v34M100 44v34M132 44v34"/>`,
  pen: `<path d="M36 168l10-34 92-92 24 24-92 92z"/><path d="M126 50l24 24"/><path d="M36 168l22-8-14-14z"/>
    <path d="M60 140l70-70"/>`,
  play: `<rect x="22" y="36" width="156" height="112" rx="16"/><path d="M84 68v48l44-24z"/>
    <path d="M22 60h156"/><circle cx="42" cy="48" r="5"/><circle cx="60" cy="48" r="5"/>
    <path d="M60 166h80M100 148v18"/>`,
  hashtag: `<path d="M68 24 50 178M138 24l-18 154M28 70h146M22 122h146"/>`,
  sparkle: `<path d="M100 20c6 44 16 54 60 60-44 6-54 16-60 60-6-44-16-54-60-60 44-6 54-16 60-60z"/>
    <path d="M48 128l4 16 16 4-16 4-4 16-4-16-16-4 16-4z"/>`,
  target2: `<circle cx="100" cy="100" r="70"/><circle cx="100" cy="100" r="44"/><circle cx="100" cy="100" r="18"/>`,
  user: `<circle cx="100" cy="66" r="34"/><path d="M32 176a68 68 0 0 1 136 0"/><path d="M60 150h80"/>`,
  bolt: `<path d="M112 16 58 106h36l-10 78 58-96h-38z"/>`,
  music: `<path d="M148 26v96"/><path d="M76 46v96"/><path d="M76 46 148 26"/>
    <ellipse cx="56" cy="146" rx="24" ry="18"/><ellipse cx="128" cy="126" rx="24" ry="18"/>`,
};
const artFor = (k) => ART[k] || ART.star;

const PD = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export function buildInkHTML(pack) {
  const n = pack.tips.length;
  // the video's concept decides its graphics; generic falls back to the device
  // every slide draws art for its OWN action, so there is no single video motif
  const HERO = true;
  // one art plan per video: four different drawings, never a repeat
  const ART_PLAN = sceneArtPlan(pack.tips);
  const BRAND = brandFor(pack.platform);
  // The hook is where the viewer decides whether this is for them, so it has to
  // plant the identity: the tool's own wordmark and colour, or the app's real
  // screen. An abstract drawing leaves nothing to recognise later.
  const HOOK_BRAND = (pack.tips.find((t) => t.brand) || {}).brand || null;
  const HOOK_SCREEN = HOOK_BRAND ? null : ((pack.tips.find((t) => t.screen) || {}).screen || null);
  // A verified official screen always wins in the hook. Do not replace it with a generic illustration.
  const HOOK_MEDIA_TIP = pack.tips.find((t) => t.photo) || null;
  const HOOK_MEDIA = pack.hookPhoto || HOOK_MEDIA_TIP?.photo || null;
  const HOOK_MEDIA_ALT = HOOK_MEDIA === pack.hookPhoto ? "تصویر محصول" : (HOOK_MEDIA_TIP?.photoAlt || pack.feature || "Official app interface");
  const TOTAL = pack.duration ?? 56;
  const HOOK = pack.hookDuration ?? 4;
  const OUTRO = pack.outroDuration ?? 6;
  // When the narration has been measured, each scene lasts as long as its own
  // spoken line; otherwise fall back to an even split.
  const DURS = Array.isArray(pack.tipDurations) && pack.tipDurations.length === n
    ? pack.tipDurations
    : Array.from({ length: n }, () => (TOTAL - HOOK - OUTRO) / n);
  const TIP = DURS[0];
  const tipStart = (i) => HOOK + DURS.slice(0, i).reduce((a, d) => a + d, 0);
  const tipLen = (i) => DURS[i];
  // Under ~3.2s a two-line caption cannot be read — drop the chrome and let the
  // band headline + illustration carry the message (short-form scanning).
  const COMPACT = TIP < 3.2;

  // strict two-colour system, alternating per scene
  const PAIR = (pack.ink && pack.ink.pair) || ["#123a63", "#b31739"];
  const PAPER = (pack.ink && pack.ink.paper) || "#efe9e1";
  const TINT = (pack.ink && pack.ink.tint) || "rgba(18,58,99,.10)";
  const inkOf = (i) => PAIR[i % PAIR.length];

  const plain = (s) => String(s).replace(/<[^>]*>/g, "").trim();
  // A verified public app screen can be used for a tutorial step. It is encoded
  // into the composition so the renderer never relies on a network request.
  const photoSrc = (photo) => {
    const raw = photo?.dataURI || photo?.src || photo;
    if (typeof raw === "string" && raw.startsWith("public/")) {
      const ext = raw.split(".").pop().toLowerCase();
      const type = ext === "jpg" || ext === "jpeg" ? "jpeg" : ext === "webp" ? "webp" : "png";
      return `data:image/${type};base64,${b64(raw)}`;
    }
    return raw || "";
  };

  // pathLength="1" normalises each shape so a single dash length draws them all
  const drawable = (svgBody) =>
    svgBody.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)\b/g, '<$1 pathLength="1"');

  const illo = (icon, i) =>
    `<svg class="illo" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="3.2"
       stroke-linecap="round" stroke-linejoin="round" filter="url(#sketch${i % 3})">${drawable(artFor(icon))}</svg>`;

  // --- scene A: solid circle block + illustration inside + band caption
  const sceneCircle = (i, tip, ink) => `
      <div class="circleblock" style="background:${ink}">
        <span class="illo-wrap light">${illo(tip.icon, i)}</span>
      </div>
      <div class="band" style="background:${ink}"><span>${tip.head}</span></div>`;

  // --- scene B: band on top, big ink illustration on paper below
  const scenePaper = (i, tip, ink) => `
      <div class="band top" style="background:${ink}"><span>${tip.head}</span></div>
      <span class="illo-wrap ink big" style="color:${ink}">${illo(tip.icon, i)}</span>`;

  // --- scene C: wrong / right pair inside bands
  const sceneCompare = (i, tip, ink) => `
      <span class="illo-wrap ink cmp-illo" style="color:${ink}">${illo(tip.icon, i)}</span>
      <div class="cmprow bad"><span class="mk">✕</span><span>${tip.bad}</span></div>
      <div class="cmprow good" style="background:${ink}"><span class="mk ok">✓</span><span>${tip.good}</span></div>
      <div class="band" style="background:${ink}"><span>${tip.head}</span></div>`;

  // --- scene S: one numbered step of a single feature
  // The exact English path the viewer must tap, rendered LTR as breadcrumbs. Most
  // people run their apps in English, so the Persian instruction alone leaves
  // them hunting; the real label removes the guesswork. The last crumb is the
  // thing being tapped, so it is highlighted.
  const pathCrumbs = (path) => {
    const parts = String(path).split(">").map((p) => p.trim()).filter(Boolean);
    return parts
      .map((p, i) => {
        const last = i === parts.length - 1;
        return `${i ? '<i class="pcrumb-sep">›</i>' : ""}<span class="pcrumb${last ? " on" : ""}">${p}</span>`;
      })
      .join("");
  };

  const iphoneFrame = (inner, kind = "") => `<div class="iphone-stage ${kind}">
    <span class="iphone-island"></span><span class="iphone-time">9:41</span>
    <span class="iphone-signal">● ◔ ▰</span><div class="iphone-screen">${inner}</div>
    <span class="iphone-home"></span></div>`;

  // A phone is evidence, not a default template. Only a supplied UI schema
  // (or a real screenshot above) earns an iPhone frame. A written path alone
  // is still an action and must receive artwork derived from that action.
  const screenTip = (tip) => {
    if (tip.screen) return tip;
    if (tip.ui) return { ...tip, screen: { title: tip.ui.title || "Instagram", rows: tip.ui.rows || ["Continue"], hit: tip.ui.hit || 0 } };
    return tip;
  };

  // Which steps may show a phone screen: the first one that asks for it, and
  // only that one. Four identical frames read as one picture repeated, which is
  // the single thing this channel has been told most often to stop doing.
  const SCREEN_USED = (() => {
    const taken = pack.tips.map(() => true);
    const first = pack.tips.findIndex((t) => t.screen || t.ui);
    if (first >= 0) taken[first] = false;
    return taken;
  })();

  const sceneStep = (i, tip, ink) => `
      <div class="stepwrap">
        <span class="stepnum" style="background:${ink}">${PD(tip.step)}</span>
        ${tip.photo
          ? `<div class="official-ui focus-${tip.photoFocus || "default"}"><img src="${photoSrc(tip.photo)}" alt="${tip.photoAlt || "Official app interface"}"/><span class="focusframe"></span><span class="tapdot"></span></div>`
          : pack.photos?.[i]
          ? `<div class="newsphoto ${pack.platform === "news" ? "" : "tutorialphoto"}"><img src="${pack.photos[i].dataURI}" alt=""/>${pack.platform === "news" ? "<span>تصویر آرشیوی</span>" : ""}</div>`
          : (tip.screen || tip.ui) && ["tiktok", "instagram"].includes(pack.platform) && !SCREEN_USED[i]
            ? stepStage(PAIR, { tip: screenTip(tip), art: ART_PLAN[i], platform: pack.platform, iconSVG: `<span class="illo-wrap ink" style="color:${ink}">${illo(iconKeyFor(ART_PLAN[i]), i)}</span>`, markSVG: platformMark(pack.platform, ink, 40) })
            : stepStage(PAIR, { tip, art: ART_PLAN[i], platform: pack.platform, allowScreen: false, iconSVG: `<span class="illo-wrap ink" style="color:${ink}">${illo(iconKeyFor(ART_PLAN[i]), i)}</span>`, markSVG: platformMark(pack.platform, ink, 40) })}
      </div>
      <div class="band" style="background:${ink}"><span>${tip.head}</span></div>
      ${tip.path ? `<div class="pathchip" style="--ink:${ink}">${pathCrumbs(tip.path)}</div>` : ""}`;

  // --- scene D: giant number in a circle
  const sceneStat = (i, tip, ink) => `
      <div class="circleblock" style="background:${ink}">
        <span class="bignum" data-to="${tip.stat.value}">۰</span>
      </div>
      <div class="statcap">${tip.stat.label}</div>
      <div class="band" style="background:${ink}"><span>${tip.head}</span></div>`;

  const kindOf = (tip) => tip.step ? "step" : (tip.stat ? "stat" : tip.bad ? "cmp" : tip.icon && (tip.feature || tip.tool) ? "circle" : "paper");

  const scenes = pack.tips
    .map((tip, i) => {
      const ink = inkOf(i);
      const at = tipStart(i);
      const k = kindOf(tip);
      // A faithful iPhone guide is the graphic for an in-app step. Floating
      // stars, chips or unrelated sketch art around it only distract from the
      // exact row the viewer needs to tap.
      const usesPhoneGuide = (tip.screen || tip.ui) && ["tiktok", "instagram"].includes(pack.platform);
      const inner =
        k === "step" ? sceneStep(i, tip, ink) :
        k === "stat" ? sceneStat(i, tip, ink) :
        k === "cmp" ? sceneCompare(i, tip, ink) :
        k === "circle" ? sceneCircle(i, tip, ink) :
        scenePaper(i, tip, ink);
      return `  <section id="s${i + 2}" class="clip scene k-${k}" data-start="${at.toFixed(3)}" data-duration="${tipLen(i).toFixed(3)}" data-track-index="1" style="--ink:${ink}">
    <div class="paper" style="--glow:${ink}2e;--glow2:${PAIR[(1)]}22"></div><div class="grain"></div>
    ${usesPhoneGuide ? "" : `<span class="backdrop" style="color:${ink}">${illo(iconKeyFor(ART_PLAN[i]), i)}</span>
    <span class="sticker s-a" style="color:${ink}">${illo(iconKeyFor(ART_PLAN[i]), i)}</span>
    <span class="sticker s-b" style="color:${PAIR[(i + 1) % PAIR.length]}">${illo(i % 2 ? "sparkle" : "star", i + 3)}</span>`}
    <div class="world" id="w${i + 2}">
      ${COMPACT || pack.platform === "news" ? "" : `<div class="kick">${pack.kicker || "قابلیت"}</div>`}
${inner}
      ${COMPACT
        ? (tip.feature || tip.tool ? `<div class="chip">${plain(tip.feature || tip.tool)}</div>` : "")
        : (tip.sub ? `<div class="cap">${tip.sub}</div>` : "")}
    </div>
  </section>`;
    })
    .join("\n");

  const tipsData = pack.tips.map((tip, i) => ({
    id: "s" + (i + 2), at: +tipStart(i).toFixed(3), dur: +TIP.toFixed(3), i, k: kindOf(tip),
  }));

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
body{font-family:"Vazirmatn",sans-serif;color:#16233a;-webkit-font-smoothing:antialiased}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:${PAPER}}
.clip{position:absolute;inset:0;overflow:hidden}
.scene,.hookscene,.outroscene{direction:rtl}
/* --- warm paper ground --- */
.paper{position:absolute;inset:0;z-index:0;
  background:
    radial-gradient(circle at 50% 30%, var(--glow), transparent 62%),
    radial-gradient(circle at 12% 88%, var(--glow2), transparent 55%),
    linear-gradient(180deg,#ffffff 0%,${PAPER} 38%,rgba(0,0,0,.05) 100%)}
.paper::after{content:"";position:absolute;inset:0;
  background:linear-gradient(115deg,rgba(255,255,255,.75) 0%,transparent 32%,transparent 72%,rgba(0,0,0,.06) 100%)}
.grain{position:absolute;inset:0;z-index:1;opacity:.20;pointer-events:none;
  background-image:radial-gradient(rgba(60,50,40,.30) 1px,transparent 1px);
  background-size:4px 4px}
.world{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:280px 70px 470px;will-change:transform,filter}
/* --- kicker --- */
.kick{font-weight:800;font-size:34px;letter-spacing:.16em;color:#6b6257;margin-bottom:36px}
/* --- solid circle colour block --- */
.circleblock{width:660px;height:660px;border-radius:50%;display:grid;place-items:center;
  box-shadow:0 40px 90px rgba(30,20,10,.22)}
.illo-wrap{display:block}
.illo path,.illo circle,.illo rect,.illo ellipse,.illo line,.illo polyline,.illo polygon{
  stroke-dasharray:1;stroke-dashoffset:0}
.illo{width:420px;height:420px}
.illo-wrap.light{color:#f7f3ec}
.illo-wrap.ink.big .illo{width:520px;height:520px}
/* --- full-width text band --- */
.band{--safe:840px;position:relative;width:calc(100% + 140px);margin:52px -70px 0;padding:30px 60px;color:#fff;
  font-weight:800;font-size:66px;line-height:1.35;
  box-shadow:0 22px 50px rgba(30,20,10,.28)}
.band.top{margin:0 -70px 56px}
.band .hl{color:#ffd98a}
.band span{display:block;max-width:var(--safe);margin:0 auto}
.band::before,.band::after{content:"";position:absolute;left:60px;right:60px;height:2px;
  background:rgba(255,255,255,.32)}
.band::before{top:10px}
.band::after{bottom:10px}
/* --- compare rows --- */
.cmp-illo .illo{width:300px;height:300px;margin-bottom:34px}
.compact .cmp-illo .illo{width:330px;height:330px}
.cmprow{width:100%;max-width:840px;display:flex;align-items:center;gap:24px;padding:26px 32px;border-radius:14px;
  font-weight:700;font-size:44px;line-height:1.35;text-align:right;margin-bottom:20px;
  background:rgba(255,255,255,.72);border:2px solid rgba(20,30,50,.14);color:#3a3a3a}
.cmprow .mk{flex:none;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;
  font-size:36px;font-weight:900;color:#fff;background:${PAIR[1]}}
.cmprow.bad{opacity:.72}
.cmprow.good{color:#fff;border-color:transparent}
.cmprow.good .mk{background:#fff;color:#123a63}
/* --- stat --- */
.bignum{font-weight:900;font-size:320px;line-height:1;color:#f7f3ec}
.statcap{font-weight:800;font-size:44px;color:#6b6257;margin-top:30px}
/* --- caption (kept above the platform UI rail) --- */
.cap{position:absolute;left:120px;right:120px;bottom:330px;font-weight:700;font-size:46px;line-height:1.55;
  color:#22303f;background:rgba(255,255,255,.92);border-radius:20px;padding:28px 34px;
  border:2px solid rgba(20,30,50,.10);box-shadow:0 18px 44px rgba(30,20,10,.16)}
.cap .em{color:${PAIR[1]}}

${UI_CSS}
${MOTIF_CSS}
${PLATFORM_HERO_CSS}
/* stickers fill the corners the layout leaves bare */
.sticker{position:absolute;z-index:1;pointer-events:none;display:grid;place-items:center;
  width:132px;height:132px;border-radius:38px;background:rgba(255,255,255,.92);
  border:3px solid currentColor;box-shadow:0 14px 30px rgba(30,20,10,.16)}
.sticker svg{width:78px!important;height:78px!important}
.sticker.s-a{left:64px;top:470px}
.sticker.s-b{right:64px;top:400px;width:110px;height:110px;border-radius:32px}
.sticker.s-b svg{width:62px!important;height:62px!important}
/* --- step scene --- */
.stepwrap{position:relative;display:grid;place-items:center;margin-bottom:10px}
/* The step marker is a glossy 3D object, not a flat disc: a specular hot spot
   at the top-left, a darker terminator at the bottom-right and a contact shadow
   below. That single lit sphere is what makes the reference read as "3D motion"
   rather than "moving flat shapes". */
.stepnum{position:absolute;top:-38px;left:-40px;z-index:3;width:128px;height:128px;border-radius:50%;
  display:grid;place-items:center;color:#fff;font-weight:900;font-size:66px;
  text-shadow:0 3px 6px rgba(0,0,0,.35);
  background-image:radial-gradient(circle at 33% 27%,
      rgba(255,255,255,.95) 0 6%,
      rgba(255,255,255,.42) 16%,
      rgba(255,255,255,0) 46%),
    radial-gradient(circle at 72% 82%, rgba(0,0,0,.42), rgba(0,0,0,0) 58%);
  box-shadow:inset 0 -14px 26px rgba(0,0,0,.30),
             inset 0 10px 18px rgba(255,255,255,.35),
             0 22px 34px -10px rgba(30,20,10,.45)}
/* the sphere's own cast shadow on the paper, so it floats above the surface */
.stepnum::after{content:"";position:absolute;left:12%;bottom:-26px;width:76%;height:26px;border-radius:50%;
  background:radial-gradient(ellipse,rgba(30,20,10,.34),transparent 70%);z-index:-1}
/* soft light pooling behind the card */
.stepwrap::before{content:"";position:absolute;left:50%;top:46%;width:760px;height:760px;
  transform:translate(-50%,-50%);border-radius:50%;z-index:0;pointer-events:none;
  background:radial-gradient(circle,color-mix(in srgb,var(--ink) 26%,transparent) 0%,transparent 62%)}
/* ground contact shadow under the device */
.stepwrap::after{content:"";position:absolute;left:50%;bottom:-34px;width:390px;height:44px;
  transform:translate(-50%,0);border-radius:50%;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse,rgba(30,20,10,.30),transparent 72%)}
.stepwrap .pmock{z-index:2}
/* A recreated phone screen is the proof for an in-app step. Do not cover it
   with decorative badges or floating icons: the viewer must read the exact
   English row and see one clear tap target. */
.stage-screen .stage-badge,.stage-screen .stage-ico{display:none}
/* the card grows in height, so its contents must be clipped — never squashed */
.plist,.pcmts{flex:none}
.pscreen{justify-content:flex-start}
.step-illo .illo{width:440px;height:440px}
.compact .step-illo .illo{width:420px;height:420px}
.compact .band{line-height:1.32}
/* --- news: long sentences need room, not weight --- */
.newsvid .band,.newsvid.compact .band{font-size:56px;font-weight:700;line-height:1.5;
  padding:32px 56px}
.newsvid .band span{max-width:800px}
.newsvid .band::before,.newsvid .band::after{opacity:.5}
.newsvid .hookask{font-size:74px;line-height:1.3;font-weight:800}
.newsvid .hookend span{font-size:36px;font-weight:700}
/* --- compact (short-form) --- */
.compact .world{padding:250px 60px 380px}
.compact .band{font-size:84px;padding:34px 60px;margin-top:56px}
.compact .circleblock{width:640px;height:640px}
.compact .illo{width:400px}
.compact .illo-wrap.ink.big .illo{width:500px}
.chip{margin-top:34px;font-weight:800;font-size:46px;color:#123a63;background:rgba(255,255,255,.92);
  border:2px solid rgba(18,58,99,.25);border-radius:999px;padding:16px 44px;direction:ltr;
  box-shadow:0 12px 30px rgba(30,20,10,.14)}

.markwrap{display:grid;place-items:center;width:190px;height:190px;border-radius:52px;
  background:rgba(255,255,255,.85);border:3px solid rgba(20,30,50,.10);
  box-shadow:0 18px 40px rgba(30,20,10,.18);margin-bottom:26px}
.markwrap .pmark{width:124px;height:124px}
/* a large, faint engraving so no frame reads as blank paper */
.backdrop{position:absolute;left:50%;top:50%;z-index:1;
  opacity:.30;pointer-events:none}
.backdrop svg{width:1020px;height:1020px;stroke-width:6}

/* the promise that earns the next three seconds */
.benefit{display:flex;align-items:center;gap:16px;margin-bottom:22px;max-width:100%;
  font-weight:900;font-size:40px;line-height:1.34;color:#fff;border-radius:26px;padding:18px 32px;
  box-shadow:0 16px 34px rgba(30,20,10,.26);text-align:center}
.benefit span{flex:1}
.benefit::before{content:"";width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.9)}
.b-viral{background:#E0245E}
.b-seen{background:#0E7490}
.b-money{background:#15803D}
/* --- hook: block + huge type + a preview of the payoff --- */
.hookworld{padding:170px 80px 330px;justify-content:flex-start}
/* the question is the headline — it is what stops the scroll */
.hookask{font-weight:900;font-size:86px;line-height:1.24;color:${PAIR[0]};margin-top:6px}
.hookworld .hookq{font-size:44px;font-weight:800;line-height:1.35;margin-top:24px}
.hookworld .hookq .hl{color:#fff;background:${PAIR[1]};border-radius:16px;padding:10px 26px;
  box-shadow:0 12px 28px rgba(30,20,10,.22);display:inline-block}
.hookblock{width:calc(100% + 180px);margin:0 -90px 34px;padding:20px 90px;display:flex;justify-content:center;
  box-shadow:0 18px 44px rgba(30,20,10,.28)}
.hookkicker{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:58px;color:#fff;
  direction:ltr;letter-spacing:.01em}
.hookpreview{position:relative;margin-top:26px;display:grid;place-items:center}
.hookpreview{margin-top:20px}
.hookpreview .pmock{width:330px;height:470px;transform:rotate(-4deg)}
/* Official product media is the hook hero: no invented camera or generic artwork. */
.hookpreview .hookofficial{width:720px;max-width:100%;height:460px;overflow:hidden;border-radius:36px;background:#fff;box-shadow:0 24px 54px rgba(30,20,10,.26);border:5px solid rgba(20,30,50,.10);transform:rotate(-2deg);position:relative;z-index:2}
.hookpreview .hookofficial img{width:100%;height:100%;display:block;object-fit:contain;background:#fff}
.hookpreview .hookofficial:after{content:"";position:absolute;inset:0;border:2px solid rgba(255,255,255,.8);border-radius:31px;pointer-events:none}
/* the identity card leads the hook, tilted so it reads as an object, not a UI */
.hookpreview .tcard{transform:rotate(-3deg) scale(1.0);transform-origin:center}
.hookpreview .ascreen{transform:rotate(-3deg) scale(.98);transform-origin:center}
/* the app's own logo, beside the hook graphic — it is the app being taught,
   so its mark belongs here, not the channel's */
.hooklogo{position:absolute;right:-6px;bottom:6px;z-index:4;display:grid;place-items:center;
  width:150px;height:150px;border-radius:44px;background:#fff;
  box-shadow:0 20px 44px rgba(30,20,10,.26);border:4px solid rgba(20,30,50,.08)}
.hooklogo svg{width:96px;height:96px}
.hookpreview .pmock .ptext,.hookpreview .pmock .pbubble{font-size:24px}
.hookpreview .pmock .ptitle{font-size:26px}
.hookburst{position:absolute;width:520px;height:520px;border-radius:50%;border:5px dashed;opacity:.35;z-index:-1}
.hookend{margin-top:30px;display:flex;justify-content:center}
.hookend span{font-size:40px;font-weight:800;line-height:1.35;color:${PAIR[0]};
  border:5px solid ${PAIR[1]};border-radius:22px;padding:14px 34px;background:rgba(255,255,255,.72)}
.hookcue{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:22px}
.hookcue i{width:44px;height:44px;border-right:10px solid;border-bottom:10px solid;transform:rotate(45deg);border-radius:4px}
/* --- hook --- */
.hookscene .world{justify-content:center;padding:300px 70px 430px}
.hookbadge{font-weight:900;font-size:52px;color:#fff;background:${PAIR[1]};border-radius:999px;
  padding:16px 46px;margin-bottom:44px;box-shadow:0 18px 40px rgba(30,20,10,.28)}
.hookq{font-weight:900;font-size:104px;line-height:1.24;color:${PAIR[0]}}
.hookq .hl{color:${PAIR[1]}}
.hookillo{margin-top:56px;color:${PAIR[0]}}
.hookillo .illo{width:360px;height:360px}
/* --- exact in-app path, shown in English under the caption --- */
.pathchip{margin-top:22px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;
  direction:ltr;background:#fff;border:3px solid color-mix(in srgb,var(--ink) 30%,#fff);
  border-radius:18px;padding:14px 24px;box-shadow:0 14px 30px rgba(30,20,10,.16);max-width:900px}
.pcrumb{font-family:"Baloo","Vazirmatn",sans-serif;font-weight:800;font-size:34px;color:#4a5568;
  white-space:nowrap}
.pcrumb.on{color:#fff;background:var(--ink);border-radius:11px;padding:4px 16px}
.pcrumb-sep{font-style:normal;font-weight:900;font-size:32px;color:color-mix(in srgb,var(--ink) 45%,#fff)}
/* The source and date, on screen. News the viewer cannot check is a rumour. */
.srcline{margin-top:14px;font-weight:700;font-size:28px;color:#6b7280;direction:rtl}
.newsphoto{position:relative;width:500px;height:600px;overflow:hidden;border:12px solid #fff;box-shadow:0 24px 54px rgba(18,23,31,.22);background:#d9dde2;transform:rotate(-2deg)}
.newsphoto img{width:100%;height:100%;object-fit:cover;display:block}
.newsphoto::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,transparent 45%,rgba(0,0,0,.35))}
.newsphoto span{position:absolute;z-index:2;bottom:20px;right:20px;color:#fff;background:rgba(18,23,31,.78);padding:9px 16px;font-size:21px;font-weight:600;border-radius:99px;direction:rtl}
.hookphoto{width:350px;height:560px;transform:rotate(-3deg);background:#c8ddfb}
.hookphoto img{object-fit:contain;object-position:center}
.tutorialphoto{transform:rotate(0deg);border-radius:34px}
/* A real, recognisable in-app screen is the graphic when the lesson is about
   finding a real TikTok feature. Each focus uses a different crop and target. */
.official-ui{position:relative;width:400px;height:720px;overflow:hidden;border-radius:52px;background:#c8ddfb;border:7px solid #fff;box-shadow:0 34px 76px rgba(28,54,82,.22)}
.official-ui img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;display:block}
/* Cyan focus respects TikTok's own visual language; it avoids the old red/orange treatment. */
.official-ui .focusframe{position:absolute;border:6px solid #25f4ee;border-radius:20px;box-shadow:0 0 0 12px rgba(37,244,238,.18),0 0 34px rgba(37,244,238,.42)}
.official-ui .tapdot{position:absolute;width:48px;height:48px;border:5px solid #fff;border-radius:50%;background:#25f4ee;box-shadow:0 9px 22px rgba(20,54,76,.28)}
.official-ui.focus-search .focusframe{left:78px;top:66px;width:238px;height:58px}.official-ui.focus-search .tapdot{left:289px;top:102px}
.official-ui.focus-gap .focusframe{left:112px;top:430px;width:190px;height:56px}.official-ui.focus-gap .tapdot{left:273px;top:460px}
.official-ui.focus-analytics .focusframe{left:50px;top:207px;width:208px;height:126px}.official-ui.focus-analytics .tapdot{left:230px;top:296px}
.official-ui.focus-edits-project .focusframe{left:38px;top:56px;width:244px;height:78px}.official-ui.focus-edits-project .tapdot{left:258px;top:105px}
.official-ui.focus-edits-preview .focusframe{left:92px;top:136px;width:216px;height:252px}.official-ui.focus-edits-preview .tapdot{left:282px;top:364px}
.official-ui.focus-edits-tracks .focusframe{left:30px;top:434px;width:340px;height:178px}.official-ui.focus-edits-tracks .tapdot{left:340px;top:574px}
.official-ui.focus-edits-export .focusframe{left:292px;top:56px;width:82px;height:52px}.official-ui.focus-edits-export .tapdot{left:316px;top:98px}
.official-ui.focus-vids-start .focusframe{left:38px;top:78px;width:300px;height:110px}.official-ui.focus-vids-start .tapdot{left:310px;top:158px}
.official-ui.focus-vids-prompt .focusframe{left:52px;top:230px;width:296px;height:92px}.official-ui.focus-vids-prompt .tapdot{left:322px;top:294px}
.official-ui.focus-vids-preview .focusframe{left:70px;top:112px;width:260px;height:265px}.official-ui.focus-vids-preview .tapdot{left:302px;top:342px}
.official-ui.focus-vids-share .focusframe{left:264px;top:62px;width:106px;height:58px}.official-ui.focus-vids-share .tapdot{left:334px;top:105px}
.iphone-stage{position:relative;width:610px;height:780px;padding:78px 28px 48px;border-radius:78px;
  background:linear-gradient(125deg,#e7ebf0,#5e6874 35%,#11161e 48%,#2d3540);box-shadow:0 38px 76px rgba(18,23,31,.28);z-index:3}
.iphone-screen{height:100%;overflow:hidden;border-radius:55px;background:#101114;display:grid;place-items:center}
.iphone-stage .stage{width:500px;height:600px;transform:scale(1.02);transform-origin:center}
.iphone-stage .ascreen{width:450px;height:570px;border-radius:34px}
.iphone-island{position:absolute;z-index:6;top:23px;left:50%;width:184px;height:42px;margin-left:-92px;border-radius:30px;background:#000}
.iphone-time,.iphone-signal{position:absolute;z-index:7;top:32px;color:#fff;font:700 18px Arial}.iphone-time{left:43px}.iphone-signal{right:40px;letter-spacing:3px}
.iphone-home{position:absolute;z-index:6;bottom:19px;left:50%;width:190px;height:7px;margin-left:-95px;border-radius:8px;background:#fff}
/* One faithful phone, never a phone frame wrapped around another fake screen. */
.stage-screen .pmock{width:438px;height:716px;padding:70px 16px 42px;border:12px solid #111318;border-radius:64px;background:#111318;box-shadow:0 38px 74px rgba(15,18,27,.32)}
.stage-screen .pmock::before{content:"";position:absolute;z-index:8;top:18px;left:50%;width:164px;height:34px;margin-left:-82px;border-radius:24px;background:#000}
.stage-screen .pmock::after{content:"";position:absolute;z-index:8;bottom:17px;left:50%;width:154px;height:7px;margin-left:-77px;border-radius:9px;background:#fff}
.stage-screen .pmock .pscreen{border-radius:38px;background:#fdfbf7}
/* --- outro --- */
.outroscene .paper{background:radial-gradient(circle at 50% 42%,#123a6318,transparent 60%),linear-gradient(180deg,#f6f1ea,#e4dbd0)}
.payoff{font-weight:800;font-size:40px;line-height:1.5;color:${PAIR[0]};margin-bottom:46px;
  background:rgba(255,255,255,.9);border:2px solid rgba(18,58,99,.18);border-radius:22px;
  padding:26px 32px;box-shadow:0 14px 34px rgba(30,20,10,.14)}
.outrocircle{width:380px;height:380px;border-radius:50%;background:${PAIR[0]};display:grid;place-items:center;
  box-shadow:0 40px 90px rgba(30,20,10,.26)}
.outrocircle img{width:260px;height:260px;border-radius:50%;object-fit:cover}
.brandname{font-weight:900;font-size:74px;color:${PAIR[0]};margin-top:46px}
.brandsub{font-weight:700;font-size:38px;color:#4a5568;margin-top:22px;line-height:1.45}
/* A question, not a request. Asking for likes costs about 60% of them; a
   question lifts comments ~26%, and comments carry more reach weight. */
.askbox{width:100%;max-width:840px;margin-top:22px;background:#fff;border:4px solid;
  border-radius:24px;padding:26px 30px;box-shadow:0 18px 40px rgba(30,20,10,.18);
  display:flex;flex-direction:column;gap:10px;align-items:center}
.askq{font-weight:900;font-size:44px;line-height:1.34;color:#16233a;text-align:center}
.askhint{font-weight:700;font-size:30px;color:#6b7280}
.actchips{width:100%;max-width:840px;margin-top:18px;display:flex;flex-direction:column;gap:12px}
.actchip{display:flex;align-items:center;gap:14px;background:#fff;border-radius:14px;padding:13px 20px;
  border:2px solid rgba(20,30,50,.10);box-shadow:0 12px 28px rgba(30,20,10,.16)}
.actchip span{font-weight:800;font-size:34px;color:#1b2430}
.actchip i{width:40px;height:40px;border-radius:11px;flex:none;display:block}
.cta{margin-top:30px;font-weight:900;font-size:46px;color:#fff;background:${PAIR[1]};border-radius:999px;
  padding:26px 74px;box-shadow:0 20px 44px rgba(30,20,10,.28)}
/* --- persistent brand mark, clear of platform UI --- */
.mark{position:absolute;top:54px;right:32px;z-index:40;display:flex;align-items:center;gap:12px}
.mark img{width:58px;height:58px;border-radius:16px;box-shadow:0 8px 22px rgba(30,20,10,.28)}
.mark span{font-weight:900;font-size:29px;color:${PAIR[0]}}
/* --- progress rule --- */
.rule{position:absolute;top:0;left:0;right:0;height:8px;background:rgba(20,30,50,.10);z-index:50}
.rule i{display:block;height:100%;background:${PAIR[1]};transform-origin:right center}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="sketch0"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="sketch1"><feTurbulence type="fractalNoise" baseFrequency="0.026" numOctaves="3" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="sketch2"><feTurbulence type="fractalNoise" baseFrequency="0.019" numOctaves="3" seed="23" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>
  </defs>
</svg>

<div id="root" class="${COMPACT ? 'compact' : ''} ${pack.platform === "news" ? "newsvid" : ""}" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="${TOTAL}">

  <div class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="20">
    <div class="rule"><i id="rulefill"></i></div>
  </div>
  <div class="clip" data-start="0" data-duration="${(HOOK + DURS.reduce((a, d) => a + d, 0)).toFixed(3)}" data-track-index="19">
    ${BRAND.hasName || BRAND.logoData
      ? `<div class="mark">${BRAND.logoData ? `<img src="${BRAND.logoData}" alt=""/>` : ""}${BRAND.hasName ? `<span>${BRAND.name}</span>` : ""}</div>`
      : ""}
  </div>

  <!-- HOOK -->
  <section id="s1" class="clip hookscene" data-start="0" data-duration="${HOOK}" data-track-index="1">
    <div class="paper" style="--glow:${PAIR[1]}2e;--glow2:${PAIR[0]}1f"></div><div class="grain"></div>
    <div class="world hookworld" id="w1">
      <div class="markwrap">${platformMark(pack.platform, PAIR[0], 150)}</div>
      <div class="hookask">${pack.hook.ask || pack.hook.l1}</div>

      <div class="hookpreview">
        ${pack.platform === "news" && (pack.hookPhoto || pack.photos?.[0])
          ? `<div class="newsphoto hookphoto"><img src="${(pack.hookPhoto || pack.photos[0]).dataURI}" alt=""/><span>تصویر آرشیوی</span></div>`
          : pack.platform !== "news" && HOOK_MEDIA
            ? `<div class="hookofficial"><img src="${photoSrc(HOOK_MEDIA)}" alt="${HOOK_MEDIA_ALT}"/></div>`
          : HOOK_BRAND
            ? toolCard(HOOK_BRAND)
            : HOOK_SCREEN
            ? (["tiktok", "instagram"].includes(pack.platform)
              ? iphoneFrame(appScreen(pack.platform, HOOK_SCREEN), "hookiphone")
              : appScreen(pack.platform, HOOK_SCREEN))
            : sceneArt(hookArtFor(pack), PAIR)}
        ${HOOK_BRAND ? "" : `<span class="hooklogo">${platformMark(pack.platform, PAIR[0], 96)}</span>`}
        <span class="hookburst" style="border-color:${PAIR[1]}"></span>
      </div>
      <div class="hookend"><span>${retentionLineFor(pack)}</span></div>
      <div class="hookcue"><i style="border-color:${PAIR[1]}"></i><i style="border-color:${PAIR[1]}"></i></div>
    </div>
  </section>

${scenes}

  <!-- OUTRO -->
  <section id="sOut" class="clip outroscene" data-start="${(HOOK + DURS.reduce((a, d) => a + d, 0)).toFixed(3)}" data-duration="${OUTRO}" data-track-index="1">
    <div class="paper"></div><div class="grain"></div>
    <div class="world" id="wOut">
      ${pack.payoff ? `<div class="payoff">${pack.payoff}</div>` : ""}
      ${BRAND.logoData ? `<div class="outrocircle"><img src="${BRAND.logoData}" alt=""/></div>` : ""}
      ${BRAND.hasName ? `<div class="brandname">${BRAND.name}</div>` : ""}
      <div class="brandsub">${pack.outro.tag}</div>
      <div class="cta">${pack.outro.follow}</div>
      ${pack.outroAsk ? `<div class="askbox" style="border-color:${PAIR[1]}">
        <span class="askq">${pack.outroAsk}</span>
        <span class="askhint">جوابت را در کامنت بنویس</span>
      </div>` : ""}
      <div class="actchips">
        <div class="actchip"><i style="background:${PAIR[0]}"></i><span>${pack.platform === "news" ? "برای خبرهای بعدی، ما را دنبال کن" : "برای ترفند بعدی، ما را دنبال کن"}</span></div>
      </div>
    </div>
  </section>
</div>

<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({ paused: true });
var COMPACT_JS = ${COMPACT};
var HERO = ${HERO};
// one animator drives every concept hero via its shared class hooks
function animateHero(R, at){
  tl.fromTo(R+" .mfx",{opacity:0,y:34,scale:.8},{opacity:1,y:0,scale:1,duration:.5,stagger:.08,ease:"back.out(1.7)"},at);
  tl.fromTo(R+" .mbar",{scaleY:.06,opacity:.4},{scaleY:1,opacity:1,duration:.6,stagger:.06,ease:"back.out(1.6)"},at+.15);
  var dr=gsap.utils.toArray(R+" .mdr");
  if(dr.length) tl.fromTo(dr,{strokeDashoffset:1},{strokeDashoffset:0,duration:.8,stagger:.04,ease:"power2.out"},at+.1);
  tl.to(R+" .mpulse",{scale:1.16,duration:.5,yoyo:true,repeat:6,ease:"sine.inOut"},at+.5);
  tl.to(R+" .mcaret",{opacity:0,duration:.34,yoyo:true,repeat:10,ease:"steps(1)"},at+.5);
}
var TIPS = ${JSON.stringify(tipsData)};
var OUT_AT = ${(HOOK + DURS.reduce((a, d) => a + d, 0)).toFixed(3)};

tl.fromTo("#rulefill",{scaleX:0},{scaleX:1,ease:"none",duration:${TOTAL}},0);

// ---- HOOK: legible at frame 0, then two punches ----
tl.fromTo("#s1 .hookask",{scale:1.09},{scale:1,duration:.34,ease:"power3.out"},0);
tl.fromTo("#s1 .hookend",{y:26,opacity:0},{y:0,opacity:1,duration:.44,ease:"back.out(1.6)"},1.05);
tl.to("#s1 .hookend span",{scale:1.05,duration:.42,yoyo:true,repeat:3,ease:"sine.inOut"},1.6);
tl.fromTo("#s1 .srcline",{opacity:0},{opacity:1,duration:.4,ease:"power2.out"},.62);
tl.fromTo("#s1 .markwrap",{scale:0,rotation:-16},{scale:1,rotation:0,duration:.5,ease:"back.out(2.2)"},.04);
tl.to("#s1 .markwrap",{y:-10,duration:1.1,yoyo:true,repeat:2,ease:"sine.inOut"},.6);
tl.fromTo("#s1 .benefit",{scale:.6,opacity:0},{scale:1,opacity:1,duration:.42,ease:"back.out(2)"},0);
tl.to("#s1 .benefit",{scale:1.06,duration:.4,yoyo:true,repeat:3,ease:"sine.inOut"},.9);
tl.fromTo("#s1 .hookblock",{clipPath:"inset(0 0 0 100%)"},{clipPath:"inset(0 0 0 0%)",duration:.4,ease:"power4.out"},0);
tl.fromTo("#s1 .hookkicker",{opacity:0,x:50},{opacity:1,x:0,duration:.34,ease:"power3.out"},.2);
if(HERO){ animateHero("#s1 .hookpreview", .28);
  tl.fromTo("#s1 .hookpreview .hero",{scale:.6,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.6,ease:"back.out(1.6)"},.24);
  tl.to("#s1 .hookpreview .hero",{y:-14,duration:1.6,yoyo:true,repeat:3,ease:"sine.inOut"},1.0);
} else {
tl.fromTo("#s1 .hookpreview .pmock",{y:90,scale:.7,rotation:-16,opacity:0},
          {y:0,scale:1,rotation:-4,opacity:1,duration:.62,ease:"back.out(1.7)"},.26);
tl.fromTo("#s1 .hookpreview .pmock",{height:190},{height:470,duration:.72,ease:"expo.out"},.3);
tl.fromTo("#s1 .hookpreview .prow, #s1 .hookpreview .pcmt",{opacity:0,y:40},{opacity:1,y:0,duration:.34,stagger:.075,ease:"back.out(1.5)"},.5);
tl.fromTo("#s1 .hookpreview .tutorialphoto, #s1 .hookpreview .hookofficial",{y:90,scale:.72,rotation:-12,opacity:0},{y:0,scale:1,rotation:-3,opacity:1,duration:.62,ease:"back.out(1.7)"},.26);
}
tl.fromTo("#s1 .hookburst",{scale:.5,opacity:0},{scale:1,opacity:.35,duration:.6,ease:"power3.out"},.3);
tl.fromTo("#s1 .hooklogo",{scale:0,rotation:-18},{scale:1,rotation:0,duration:.55,ease:"back.out(2)"},.5);
tl.to("#s1 .hooklogo",{y:-12,duration:1.3,yoyo:true,repeat:3,ease:"sine.inOut"},1.1);
tl.to("#s1 .hookburst",{rotation:180,duration:6,ease:"none",repeat:1},.4);
tl.fromTo("#s1 .hookcue i",{opacity:0,y:-18},{opacity:1,y:0,duration:.26,stagger:.1,ease:"power2.out"},.62);
tl.to("#s1 .hookcue i",{y:16,duration:.5,yoyo:true,repeat:5,stagger:.1,ease:"sine.inOut"},.9);
tl.to("#s1 .hookask",{scale:1.05,duration:.14,ease:"power2.out"},1.15)
  .to("#s1 .hookask",{scale:1,duration:.4,ease:"elastic.out(1,.6)"},1.29);
tl.to("#s1 .hookillo",{rotation:4,duration:1.0,yoyo:true,repeat:2,ease:"sine.inOut"},.9);

// draw the ink on: strokes appear as if being sketched
function drawIn(sel, at, dur){
  var parts = gsap.utils.toArray(sel + " > *");
  if(!parts.length) return;
  tl.fromTo(parts,{strokeDashoffset:1},
    {strokeDashoffset:0,duration:dur||.55,ease:"power2.out",
     stagger:Math.min(.05, .35/parts.length)},at);
}

// ---- BODY: whip-blur entrance, then held motion ----
TIPS.forEach(function(t){
  var at=t.at, id="#"+t.id, W="#w"+(t.i+2);
  // Each slide behaves like a tangible editorial card: it swings in, settles,
  // shows the exact step, then leaves toward the next card. This is deliberate
  // slide motion rather than a static infographic fading between cuts.
  tl.fromTo(W,{x:720,rotation:7,scale:.86,filter:"blur(22px)",opacity:0},
              {x:0,rotation:0,scale:1,filter:"blur(0px)",opacity:1,duration:COMPACT_JS?.34:.52,ease:"power4.out"},at);
  tl.fromTo(id+" .paper",{scale:1.12,rotation:-1.4},{scale:1,rotation:0,duration:.7,ease:"expo.out"},at);
  tl.fromTo(id+" .official-ui",{y:110,scale:.78,rotation:-5,opacity:0},{y:0,scale:1,rotation:0,opacity:1,duration:.58,ease:"back.out(1.45)"},at+.1);
  tl.fromTo(id+" .official-ui .focusframe",{scale:.5,opacity:0},{scale:1,opacity:1,duration:.34,ease:"back.out(2)"},at+.48);
  tl.to(id+" .official-ui .tapdot",{scale:1.22,duration:.32,yoyo:true,repeat:3,ease:"sine.inOut"},at+.74);
  tl.fromTo(id+" .kick",{y:-24,opacity:0},{y:0,opacity:1,duration:.35,ease:"power2.out"},at+.2);

  if(t.k==="circle"||t.k==="stat"){
    tl.fromTo(id+" .circleblock",{scale:.45},{scale:1,duration:.62,ease:"back.out(1.5)"},at+.18);
    tl.fromTo(id+" .illo",{scale:.6,opacity:0,rotation:-10},{scale:1,opacity:1,rotation:0,duration:.55,ease:"back.out(1.8)"},at+.34);
    drawIn(id+" .illo",at+.4);
    tl.to(id+" .circleblock",{rotation:2,duration:2.2,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/2.2)),ease:"sine.inOut"},at+.8);
  }
  if(t.k==="stat"){
    (function(){
      var el=document.querySelector(id+" .bignum"); if(!el) return;
      var to=parseFloat(el.getAttribute("data-to"))||0, o={v:0};
      var fa=function(x){return String(Math.round(x)).replace(/[0-9]/g,function(d){return "۰۱۲۳۴۵۶۷۸۹"[+d];});};
      tl.to(o,{v:to,duration:1.1,ease:"power2.out",onUpdate:function(){el.textContent=fa(o.v);}},at+.4);
    })();
    tl.fromTo(id+" .statcap",{y:22,opacity:0},{y:0,opacity:1,duration:.4,ease:"power2.out"},at+.9);
  }
  if(t.k==="step"){
    // 1. the concept panel lands with a spring, then grows open
    tl.fromTo(id+" .stepwrap",{y:64,scale:.84,opacity:0},
              {y:0,scale:1,opacity:1,duration:.58,ease:"back.out(1.5)"},at+.08);
    tl.fromTo(id+" .stage",{height:250,opacity:.2},{height:600,opacity:1,duration:.6,ease:"expo.out"},at+.16);
    // 2. the content-driven graphic draws/pops/grows into place
    animateHero(id+" .stage", at+.28);
    tl.fromTo(id+" .stage-badge",{scale:0,rotation:-20},{scale:1,rotation:0,duration:.5,ease:"back.out(2)"},at+.4);
    // 3. the step's own icon flags what THIS step does
    tl.fromTo(id+" .stage-ico",{scale:.5,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.5,ease:"back.out(1.8)"},at+.5);
    drawIn(id+" .stage-ico .illo",at+.56,.6);
    tl.to(id+" .stage-ico",{y:-12,duration:1.4,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.4)),ease:"sine.inOut"},at+.9);
    // 4. the glossy number sphere drops in and floats at its own rate (depth)
    tl.fromTo(id+" .stepnum",{scale:0,y:-70,rotation:-40},{scale:1,y:0,rotation:0,duration:.62,ease:"back.out(2.2)"},at+.26);
    tl.to(id+" .stepnum",{y:-16,duration:1.6,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.6)),ease:"sine.inOut"},at+1.0);
    // 5. ambient — the panel breathes so no frame is dead
    tl.to(id+" .stage",{y:-10,rotation:.4,duration:2.0,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/2)),ease:"sine.inOut"},at+.9);
  }
  if(t.k==="paper"){
    tl.fromTo(id+" .illo",{scale:.7,opacity:0,rotation:-8},{scale:1,opacity:1,rotation:0,duration:.6,ease:"back.out(1.7)"},at+.3);
    drawIn(id+" .illo",at+.36,.6);
    tl.to(id+" .illo",{y:-16,duration:1.6,yoyo:true,repeat:Math.max(1,Math.ceil(t.dur/1.6)),ease:"sine.inOut"},at+.9);
  }
  if(t.k==="cmp"){
    tl.fromTo(id+" .cmprow.bad",{x:-280,opacity:0},{x:0,opacity:1,duration:.45,ease:"power4.out"},at+.24);
    tl.fromTo(id+" .cmprow.good",{x:280,opacity:0},{x:0,opacity:1,duration:.45,ease:"power4.out"},at+.5);
    tl.to(id+" .cmprow.good",{scale:1.04,duration:.28,yoyo:true,repeat:1,ease:"sine.inOut"},at+.9);
  }
  // band wipes open from the right, like a printed rule being drawn
  tl.fromTo(id+" .band",{clipPath:"inset(0 0 0 100%)"},{clipPath:"inset(0 0 0 0%)",duration:.42,ease:"power3.out"},at+.34);
  tl.fromTo(id+" .band span",{opacity:0,x:40},{opacity:1,x:0,duration:.36,ease:"power2.out"},at+.55);
  tl.fromTo(id+" .pathchip",{y:26,opacity:0},{y:0,opacity:1,duration:.42,ease:"back.out(1.5)"},at+.72);
  tl.fromTo(id+" .pcrumb",{opacity:0,y:10},{opacity:1,y:0,duration:.26,stagger:.07,ease:"power2.out"},at+.8);
  tl.fromTo(id+" .cap",{y:44,opacity:0},{y:0,opacity:1,duration:.42,ease:"power3.out"},at+.62);
  // slow push so no frame is static
  tl.to(W,{scale:1.05,duration:Math.max(.8,t.dur-.5),ease:"none"},at+.5);
  if(t.dur>1.0){
    tl.to(W,{x:-130,rotation:-2.5,scale:.94,filter:"blur(10px)",opacity:0,duration:.34,ease:"power2.in"},at+t.dur-.34);
  }
});

// ---- OUTRO ----
tl.fromTo("#wOut",{x:560,filter:"blur(26px)",opacity:0},{x:0,filter:"blur(0px)",opacity:1,duration:.5,ease:"power3.out"},OUT_AT);
tl.fromTo("#sOut .payoff",{y:40,opacity:0},{y:0,opacity:1,duration:.45,ease:"power3.out"},OUT_AT+.1);
tl.fromTo("#sOut .outrocircle",{scale:.5},{scale:1,duration:.6,ease:"back.out(1.7)"},OUT_AT+.15);
tl.fromTo("#sOut .brandname",{y:40,opacity:0},{y:0,opacity:1,duration:.5,ease:"power3.out"},OUT_AT+.4);
tl.fromTo("#sOut .brandsub",{y:30,opacity:0},{y:0,opacity:1,duration:.45,ease:"power2.out"},OUT_AT+.6);
tl.fromTo("#sOut .cta",{scale:.6,opacity:0},{scale:1,opacity:1,duration:.5,ease:"back.out(2)"},OUT_AT+.8);
tl.fromTo("#sOut .askbox",{y:34,opacity:0},{y:0,opacity:1,duration:.5,ease:"back.out(1.5)"},OUT_AT+0.9);
tl.to("#sOut .askbox",{scale:1.03,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},OUT_AT+1.5);
tl.fromTo("#sOut .actchip",{x:-220,opacity:0},{x:0,opacity:1,duration:.38,stagger:.11,ease:"power4.out"},OUT_AT+1.25);
tl.to("#sOut .cta",{scale:1.05,duration:.5,yoyo:true,repeat:2,ease:"sine.inOut"},OUT_AT+1.4);

window.__timelines["main"] = tl;
</script>
</body>
</html>`;
}

