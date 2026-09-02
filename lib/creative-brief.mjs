// Mandatory, per-video creative direction. This is deliberately data rather
// than another visual template: the renderer receives a different brief for
// every topic before it creates HTML, audio or a delivery message.
import { sceneArtFor } from "./scene-art.mjs";
import { moodFor } from "../music/mood.mjs";

const PALETTES = [
  ["ink-blue", "#0B1F3A", "#42D7C7", "#F3F7F8"],
  ["orchid-night", "#23133B", "#C084FC", "#FAF5FF"],
  ["paper-cobalt", "#EAF0FF", "#123A8C", "#101827"],
  ["mint-charcoal", "#102A2A", "#5EEAD4", "#F0FDFA"],
  ["sand-ink", "#F4EFE5", "#234B63", "#1B1F24"],
  ["plum-cream", "#3A183F", "#F2B4CE", "#FFF7FB"],
];
const TRANSITIONS = ["whip-cut", "paper-fold", "focus-pull", "iris-reveal", "card-morph", "shutter-snap"];
const TYPE = ["Vazirmatn + monospace UI", "Baloo Bhaijaan + Vazirmatn", "Vazirmatn Black + English UI sans", "editorial serif + Vazirmatn"];

const hash = (value) => {
  let out = 2166136261;
  for (const char of String(value)) out = Math.imul(out ^ char.charCodeAt(0), 16777619);
  return out >>> 0;
};
const choose = (items, seed, offset = 0) => items[(seed + offset) % items.length];
const plain = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function routeFor(pack, tip) {
  if (tip.photo || tip.screen || tip.ui) return "real-interface";
  if (tip.brand) return "recognisable-app-card";
  const art = sceneArtFor(tip);
  if (["chart", "trend", "found"].includes(art)) return "data-in-motion";
  if (["bookmark", "send", "upload", "download", "search"].includes(art)) return "action-metaphor";
  if (pack.platform === "news") return "verified-news-card";
  return "editorial-illustration";
}

function proofFor(tip) {
  if (tip.photo || tip.screen || tip.ui) return "یک نقطهٔ قابل‌کلیک روی صفحهٔ واقعی";
  const art = sceneArtFor(tip);
  if (["chart", "trend"].includes(art)) return "نمودار یا شاخصی که حرکتِ پیام را نشان می‌دهد";
  if (["search", "menu", "write"].includes(art)) return "نمایش عملِ جست‌وجو، انتخاب یا نوشتن";
  return "تصویرسازیِ عمل اصلی، نه آیکن تزئینی";
}

function motionFor(tip) {
  const art = sceneArtFor(tip);
  if (["search", "chart"].includes(art)) return { entrance: "inspection-rise", proofBeat: "scan-and-lock", exit: "vertical-cut" };
  if (["send", "upload", "download"].includes(art)) return { entrance: "directional-flight", proofBeat: "impact-lock", exit: "follow-through" };
  if (["write", "menu"].includes(art)) return { entrance: "build-up", proofBeat: "cursor-or-selection", exit: "paper-snap" };
  return { entrance: "editorial-whip", proofBeat: "draw-and-settle", exit: "whip-cut" };
}

export function creativeBriefFor(pack, { date = new Date(), recent = [] } = {}) {
  const seed = hash(`${date.toISOString().slice(0, 10)}:${pack.platform}:${pack.id}`);
  const palette = choose(PALETTES, seed);
  // Some legacy feature entries keep the retention cue in `ask`. Split it
  // here so the creative brief never designs the answer/cue as part of the
  // headline; the hook must remain a single unresolved promise.
  const rawHook = plain(pack.hook?.ask || `${pack.hook?.l1 || ""} ${pack.hook?.l2 || ""}`);
  const hook = rawHook.replace(/\s*تا آخر ببین[؛،.!؟\s].*$/u, "").trim() || rawHook;
  const scenes = (pack.tips || []).map((tip, index) => ({
    number: index + 1,
    message: plain(tip.head),
    visualRoute: routeFor(pack, tip),
    proof: proofFor(tip),
    conceptArt: sceneArtFor(tip),
    motion: motionFor(tip),
    primaryMotion: motionFor(tip).entrance,
    secondaryMotion: choose(["shadow-shift", "cursor-click", "counter-slide", "label-stagger", "parallax-card"], seed, index + 2),
    ambientMotion: choose(["subtle-drift", "grain-breathe", "light-sweep", "quiet-pulse", "still-hold"], seed, index + 4),
    transitionOut: choose(TRANSITIONS, seed, index + 1),
  }));
  return {
    version: 1,
    project: { platform: pack.platform, featureId: pack.id, date: date.toISOString().slice(0, 10) },
    analysis: {
      audience: pack.platform === "news" ? "فارسی‌زبانان دنبال خبر دقیق آلمان و اروپا" : "سازندگان محتوای فارسی‌زبان که دنبال درآمد، رشد یا ایدهٔ تازه‌اند",
      primaryNeed: /درآمد|فروش|مشتری/.test(hook) ? "درآمد و پاسخ‌گویی به مشتری" : /ویو|وایرال|دیده/.test(hook) ? "دیده‌شدن و نگه‌داشتن مخاطب" : "حل یک مشکل واقعی در تولید محتوا",
      verifiedOnly: true,
    },
    goal: pack.platform === "news" ? "انتقال روشن و دقیق خبر" : "توضیح یک اقدام قابل‌انجام بدون وعدهٔ نتیجه",
    hook: { text: hook, holdLine: pack.platform === "news" ? "" : "تا آخر ببین؛ گام آخر مهم است." },
    visualIdentity: {
      route: choose(["editorial-action", "clean-product-demo", "kinetic-explainer", "documentary-data", "tactile-paper"], seed),
      palette: { name: palette[0], background: palette[1], accent: palette[2], text: palette[3] },
      typography: choose(TYPE, seed),
      transitionFamily: choose(TRANSITIONS, seed),
      antiRepeat: `شناسهٔ ${seed.toString(36)}؛ مسیر بصری، پالت و گذار با ${recent.length || 3} خروجی اخیر مقایسه می‌شود.`,
    },
    sound: { mood: moodFor(pack), narration: "فارسی روان، جمله‌محور، بدون مکث میان عبارت‌های وابسته", music: "ضرب‌های اختصاصی هماهنگ با تغییر صحنه" },
    storyboard: scenes,
    sources: { liveSearch: "فقط در موضوع‌های زمان‌حساس و با اجازهٔ صریح کاربر", confirmedClaimsOnly: true },
  };
}
