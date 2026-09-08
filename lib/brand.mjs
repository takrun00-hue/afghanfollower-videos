// Which brand a video carries.
//
// The "news" channel is a separate identity from the tutorials and must
// never wear the GapMedia name or logo. It was German Insider (a news
// feed); the owner renamed and re-logoed it 2026-09-08 to
// "آموزش آلمانی هوشمند" (Smart German Learning) when the feed itself
// became the German A1 lesson series (german-lesson-build.mjs) — same
// platform key ("news"), new identity end to end: name, logo, sign-off tag.
import { existsSync, readFileSync } from "node:fs";
import { imageType } from "./media-guard.mjs";

const b64 = (p) => readFileSync(p).toString("base64");
// The logo file's extension isn't trustworthy on its own (the news logo is
// now a .png, the default .jpg) — sniff the real type so the data URI's
// declared MIME always matches its bytes.
const mimeOf = (p) => {
  const t = imageType(p);
  return t === "png" ? "image/png" : t === "webp" ? "image/webp" : "image/jpeg";
};

const BRANDS = {
  // the tutorial channel
  default: {
    name: "GapMedia",
    logo: "public/gapmedia-logo.jpg",
    tag: {
      tiktok: 'برای رشد واقعی در تیک‌تاک،<br/>ما را دنبال کن.',
      instagram: 'برای رشد پیج اینستاگرامت،<br/>ما را دنبال کن.',
      tools: 'برای محتوای حرفه‌ای‌تر،<br/>ما را دنبال کن.',
    },
  },
  // the (former German Insider) channel — its own identity, never GapMedia
  news: {
    name: "آموزش آلمانی هوشمند",
    logo: "public/german-lesson-logo.png",
    tag: { news: 'هر روز یک قدم به آلمانی بهتر —<br/>ما را دنبال کن.' },
  },
};

export function brandFor(platform) {
  const b = platform === "news" ? BRANDS.news : BRANDS.default;
  const hasLogo = b.logo && existsSync(b.logo);
  return {
    name: b.name || "",
    hasName: !!b.name,
    logoData: hasLogo ? `data:${mimeOf(b.logo)};base64,` + b64(b.logo) : null,
    tag: (b.tag && b.tag[platform]) || "",
  };
}
