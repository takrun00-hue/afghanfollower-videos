// Verifies every image a feature claims to use.
//
//   node check-media.mjs
//
// The videos are held to a rule: everything on screen is real, and nothing is
// reconstructed from guesswork. That rule needs enforcement, because the way it
// breaks is quiet — a file downloaded months ago that turned out to be a sales
// page's HTML with a .png name, a path that no longer exists, a photo attached
// to a step it does not actually show.
//
// This checks the two things a machine can check: the file exists, and it really
// is an image. Whether the picture matches the sentence is a human judgement and
// is listed here so it can be looked at, not asserted.
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { imageType } from "./lib/media-guard.mjs";
import { featureFor } from "./lib/features.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const declared = new Map();   // path -> [where it is used]
const walk = (obj, where) => {
  if (!obj || typeof obj !== "object") return;
  for (const [k, v] of Object.entries(obj)) {
    if ((k === "photo" || k === "hookPhoto" || k === "logo") && typeof v === "string" && v.startsWith("public/")) {
      declared.set(v, [...(declared.get(v) || []), where]);
    } else if (v && typeof v === "object") walk(v, where);
  }
};

// Walk what actually ships: featureFor resolves the visual, 2026, fresh and base
// banks in the same order the renderer does, so a photo declared in an override
// bank is seen here too.
const seen = new Set();
for (let day = 0; day < 80; day++) {
  for (const cat of ["tiktok", "instagram", "tools"]) {
    const f = featureFor(cat, 20689 + day);
    if (!f || seen.has(f.id)) continue;
    seen.add(f.id);
    walk(f, `${cat}/${f.id}`);
  }
}

let bad = 0;
console.log(`تصاویر اعلام‌شده: ${declared.size}\n`);
for (const [path, where] of declared) {
  const type = imageType(path);
  if (!type) { bad++; console.log(`  ✗ ${path}\n      ${type === "" ? "فایل نیست یا عکس نیست" : ""} — ${where.join(", ")}`); }
  else console.log(`  ✓ ${type.padEnd(5)} ${path}`);
}

// Files sitting in public/ that nothing points at: not an error, but an asset
// nobody is checking is the one that quietly rots.
const pool = [];
for (const dir of ["public/sources", "public/official-ui"]) {
  try { for (const n of readdirSync(dir)) if (statSync(join(dir, n)).isFile()) pool.push(`${dir}/${n}`); }
  catch { /* directory may not exist */ }
}
const unused = pool.filter((p) => !declared.has(p));
if (unused.length) {
  console.log(`\nبدون استفاده (${unused.length}):`);
  for (const p of unused) {
    const t = imageType(p);
    console.log(`  ${t ? "·" : "✗"} ${p}${t ? "" : "   ← عکس نیست"}`);
  }
}

if (bad) { console.error(`\n${bad} تصویر معیوب است.`); process.exit(1); }
console.log("\nهمهٔ تصاویرِ در حال استفاده سالم‌اند.");
