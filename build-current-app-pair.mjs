// Renders one verified useful-app tutorial in two native social formats.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { APP_PAIR } from "./lib/generated/app-pair-current.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));
mkdirSync("lib/generated", { recursive: true });

function evidence(step) {
  return {
    sourceUrl: APP_PAIR.source,
    sourceType: "official-ui",
    claim: step.text,
    mainVisual: step.photo,
    whatItProves: step.photoAlt,
    motionAction: "تمرکز آرام روی کنترل واقعیِ مرتبط با همین گام",
    secondaryMotion: "هایلایت کوتاهِ همان کنترل پس از ورود متن",
    ambientMotion: "حرکت بسیار ظریف نور و عمق، بدون پوشاندن رابط واقعی",
    coverage: 0.58,
  };
}

function pack(platform) {
  const isTikTok = platform === "tiktok";
  return {
    id: `${APP_PAIR.id}-${platform}`,
    category: platform,
    name: APP_PAIR.name,
    kicker: "اپ کاربردی",
    title: APP_PAIR.name,
    source: APP_PAIR.source,
    hookPhoto: APP_PAIR.steps[0].photo,
    hook: {
      badge: "",
      ask: APP_PAIR.hook,
      l1: APP_PAIR.hook,
      l2: APP_PAIR.hookCue,
      options: [APP_PAIR.hook],
      selected: 1,
    },
    benefit: { key: "faster-writing", fa: "آماده‌کردن سریع‌تر پیام‌های طولانی" },
    payoff: APP_PAIR.payoff,
    outroAsk: APP_PAIR.outroAsk,
    steps: APP_PAIR.steps.map((step, index) => ({
      ...step,
      icon: ["mic", "bolt", "pen", "check"][index],
      visualEvidence: evidence(step),
    })),
    tgTitle: isTikTok
      ? "🎙️ بدون تایپ، پیام طولانی‌ات را مرتب کن\n\n#viral #TikTok #Apps #AI #GapMedia"
      : "🎙️ پیام طولانی را با صدا آماده کن\n\n#viral #Instagram #Apps #AI #GapMedia",
    design: isTikTok
      ? { mood: "lift", rhythm: "brisk", ink: { pair: ["#010101", "#20D5EC"], paper: "#F6F7F8", tint: "rgba(32,213,236,.12)" } }
      : { mood: "warm", rhythm: "default", ink: { pair: ["#6C3BE8", "#E864A2"], paper: "#FFF8FC", tint: "rgba(232,100,162,.12)" } },
    noCharacters: true,
  };
}

for (const platform of ["tiktok", "instagram"]) {
  writeFileSync("lib/generated/custom-current.mjs", `export const CURRENT_CUSTOM = ${JSON.stringify(pack(platform), null, 2)};\n`);
  execFileSync(process.execPath, ["daily-render.mjs", "--feature", `${APP_PAIR.id}-${platform}`, "--custom-generated"], {
    stdio: "inherit",
    env: { ...process.env, VOICE: "on", REQUIRE_VOICE: "on", ...(platform === "instagram" ? { ALLOW_DUPLICATE: "1" } : {}) },
  });
}
