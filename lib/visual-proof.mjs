// Hard stop for tutorial visuals. A healthy image file is not enough: a video
// teaching an app must show the actual app/feature, not a generic icon or a
// guessed phone UI. News uses its own verified-news media pipeline.

import { existsSync } from "node:fs";
import { imageSize } from "./media-guard.mjs";

const isRealAsset = (tip) => typeof tip?.photo === "string" && tip.photo.startsWith("public/") && existsSync(tip.photo);
const VALID_SOURCE_TYPES = new Set(["official-ui", "official-asset", "owner-supplied", "labelled-explainer"]);

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
    const evidence = tip.visualEvidence;
    if (!evidence?.sourceUrl || !evidence?.sourceType || !evidence?.claim || !evidence?.mainVisual || !evidence?.whatItProves || !evidence?.motionAction) {
      throw new Error(`Visual QC: اسلاید ${index + 1} در ${pack.id} شناسنامهٔ مدرک بصری ندارد.`);
    }
    if (!VALID_SOURCE_TYPES.has(evidence.sourceType)) {
      throw new Error(`Visual QC: اسلاید ${index + 1} در ${pack.id} نوع منبع بصریِ معتبر ندارد.`);
    }
    if (!evidence.secondaryMotion || !evidence.ambientMotion) {
      throw new Error(`Visual QC: اسلاید ${index + 1} در ${pack.id} باید حرکت اصلی، واکنش ثانویه و حرکت محیطیِ مرتبط داشته باشد.`);
    }
    const coverage = Number(evidence.coverage);
    if (!Number.isFinite(coverage) || coverage < 0.34) {
      throw new Error(`Visual QC: تصویر اصلی اسلاید ${index + 1} در ${pack.id} باید دست‌کم یک‌سوم قاب را بگیرد.`);
    }
    const size = imageSize(tip.photo);
    if (!size || Math.max(size.width, size.height) < 1080 || size.width * size.height < 700000) {
      throw new Error(`Visual QC: تصویر اسلاید ${index + 1} در ${pack.id} برای قاب عمودی باکیفیت کافی ندارد.`);
    }
    repeated.set(tip.photo, [...(repeated.get(tip.photo) || []), tip]);
  }
  for (const [photo, uses] of repeated) {
    if (uses.length > 1 && new Set(uses.map((tip) => tip.photoFocus || "")).size < uses.length) {
      throw new Error(`Visual QC: تصویر ${photo} بدون برش/تمرکز متفاوت در چند اسلاید تکرار شده است.`);
    }
  }
}
