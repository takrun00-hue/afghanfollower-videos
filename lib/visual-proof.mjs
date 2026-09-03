// Hard stop for tutorial visuals. A healthy image file is not enough: a video
// teaching an app must show the actual app/feature, not a generic icon or a
// guessed phone UI. News uses its own verified-news media pipeline.

import { existsSync } from "node:fs";

const isRealAsset = (tip) => typeof tip?.photo === "string" && tip.photo.startsWith("public/") && existsSync(tip.photo);

export function assertVisualProof(pack) {
  if (pack.platform === "news") return;
  const slides = pack.tips || pack.steps || [];
  if (!slides.length) throw new Error(`Visual QC: ${pack.id} هیچ اسلایدی ندارد.`);
  if (!pack.source && !pack.sources?.length) {
    throw new Error(`Visual QC: ${pack.id} منبع رسمی/معتبر برای قابلیت ندارد.`);
  }

  const repeated = new Map();
  for (const [index, tip] of slides.entries()) {
    if (!isRealAsset(tip)) {
      throw new Error(`Visual QC: اسلاید ${index + 1} در ${pack.id} تصویر واقعیِ همان قابلیت ندارد؛ رابط حدسی، آیکن یا تصویرسازی عمومی مجاز نیست.`);
    }
    repeated.set(tip.photo, [...(repeated.get(tip.photo) || []), tip]);
  }
  for (const [photo, uses] of repeated) {
    if (uses.length > 1 && new Set(uses.map((tip) => tip.photoFocus || "")).size < uses.length) {
      throw new Error(`Visual QC: تصویر ${photo} بدون برش/تمرکز متفاوت در چند اسلاید تکرار شده است.`);
    }
  }
}
