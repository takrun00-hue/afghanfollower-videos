import { readFileSync, writeFileSync } from "node:fs";
let p = readFileSync("lib/pronounce.mjs", "utf8");
if (!p.includes("افغاان")) {
  p = p.replace(
    "const FIXES = [",
    `const FIXES = [
  // Brand: written "افغان فالورز", spoken with a slightly drawn-out "افغاان"
  // and the fuller "فالوورز". Must stay first so it matches before any
  // single-word rule can touch part of it.
  ["افغان فالورز", "افغاان فالوورز"],`
  );
  // the script is standard Persian now; drop rules written for the colloquial forms
  for (const stale of ['  ["ریلزت", "ریلْست"],\n', '  ["پستت", "پُستِت"],\n', '  ["پیجت", "پِیجِت"],\n']) {
    p = p.split(stale).join("");
  }
  p = p.replace('  ["کامنت‌ها", "کامِنت ها"],', '  ["کامنت‌ها", "کامِنت ها"],\n  ["کامنت‌های", "کامِنت های"],');
  writeFileSync("lib/pronounce.mjs", p);
  console.log("brand pronunciation set");
} else console.log("already set");
