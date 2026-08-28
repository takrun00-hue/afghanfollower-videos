// Which brand a video carries.
//
// The news videos are a separate channel from the tutorials and must never wear
// the GapMedia name or logo. The news channel is German Insider, with its
// own mark, its own palette (BRAND_INK below) and its own sign-off.
import { existsSync, readFileSync } from "node:fs";

const b64 = (p) => readFileSync(p).toString("base64");

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
  // the news channel — its own identity, never AfghanFollowers
  news: {
    name: "German Insider",
    logo: "public/news-logo.jpg",
    tag: { news: 'برای خبرهای آلمان و اروپا،<br/>ما را دنبال کن.' },
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
