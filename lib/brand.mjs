// Which brand a video carries.
//
// The news videos are a separate channel from the tutorials and must not wear
// the AfghanFollowers name or logo. The name has not been chosen yet, so the
// news brand is deliberately a placeholder rather than a borrowed identity —
// a wrong logo on a migration video is worse than none.
//
// To set it later: fill in `name` below, drop the logo file at the given path,
// and nothing else needs to change.
import { existsSync, readFileSync } from "node:fs";

const b64 = (p) => readFileSync(p).toString("base64");

const BRANDS = {
  // the tutorial channel
  default: {
    name: "افغان فالورز",
    logo: "public/logo.jpg",
    tag: {
      tiktok: 'برای رشد واقعی در تیک‌تاک،<br/>ما را دنبال کن.',
      instagram: 'برای رشد پیج اینستاگرامت،<br/>ما را دنبال کن.',
      tools: 'برای محتوای حرفه‌ای‌تر،<br/>ما را دنبال کن.',
    },
  },
  // the news channel — name and logo still to be chosen
  news: {
    name: "",                       // ← put the channel name here
    logo: "public/news-logo.jpg",   // ← put the logo file here
    tag: { news: 'برای خبرهای مهاجرت،<br/>ما را دنبال کن.' },
  },
};

export function brandFor(platform) {
  const b = platform === "news" ? BRANDS.news : BRANDS.default;
  const hasLogo = b.logo && existsSync(b.logo);
  return {
    name: b.name || "",
    hasName: !!b.name,
    logoData: hasLogo ? "data:image/jpeg;base64," + b64(b.logo) : null,
    tag: (b.tag && b.tag[platform]) || "",
  };
}
