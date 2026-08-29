// Refuse to embed a file that is not really an image.
//
// `public/sources/tiktok-comments-real.png` turned out to be the saved HTML of a
// follower-selling site — a download that went wrong months ago and sat there
// with a .png extension. Nothing had read it yet, but the moment a step pointed
// at it the video would have carried a broken image, or worse, embedded a sales
// page's markup as a data URI.
//
// The rule the videos are held to is that everything on screen is real. A file
// extension is not evidence of anything; the first bytes are.
import { existsSync, readFileSync } from "node:fs";

const SIGNATURES = [
  { type: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // RIFF....WEBP — the middle four bytes are the file size
  { type: "webp", bytes: [0x52, 0x49, 0x46, 0x46], at8: [0x57, 0x45, 0x42, 0x50] },
];

// Returns the real image type, or "" when the file is not an image.
export function imageType(path) {
  if (!path || !existsSync(path)) return "";
  let head;
  try { head = readFileSync(path).subarray(0, 12); } catch { return ""; }
  for (const sig of SIGNATURES) {
    if (!sig.bytes.every((b, i) => head[i] === b)) continue;
    if (sig.at8 && !sig.at8.every((b, i) => head[8 + i] === b)) continue;
    return sig.type;
  }
  return "";
}

// Throws with a message that names the file, so a broken asset is fixed rather
// than silently skipped and forgotten.
export function assertImage(path) {
  if (!existsSync(path)) throw new Error(`تصویر پیدا نشد: ${path}`);
  const type = imageType(path);
  if (!type) throw new Error(`این فایل تصویر نیست: ${path} — با پسوند عکس ذخیره شده ولی محتوایش چیز دیگری است.`);
  return type;
}
