// Explicit approval is the only path from a topic plan to a rendered tutorial.
import { spawnSync } from "node:child_process";
import { packForFeature } from "./lib/content.mjs";

const raw = process.argv.slice(2).join(" ").trim();
const match = raw.match(/(?:تایید|تأیید|approve)\s+([a-z0-9-]+)/i);
const id = match?.[1]?.toLowerCase();
const pack = id && packForFeature(id, new Date());
if (!pack) {
  console.error("موضوع تأییدشده معتبر نیست. شناسه را دقیقاً از برنامهٔ موضوع‌ها کپی کن.");
  process.exit(1);
}
const result = spawnSync("node", ["daily-render.mjs", "--feature", id], { stdio: "inherit" });
process.exit(result.status ?? 1);
