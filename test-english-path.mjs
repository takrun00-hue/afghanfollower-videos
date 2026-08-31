// A tutorial step must show the English label the viewer has to tap.
//
// Most people run Instagram and TikTok in English. A step that says only
// «گزینهٔ سنجاق را بزن» leaves them hunting a menu for a word the video never
// shows them. The path chip — Comment › Pin comment — is the whole point of a
// how-to video, and it is rendered from `tip.path`.
//
// The fault this guards: a feature can be authored with a verified English
// screen schema and no `path`, and then ships with no English anywhere. That is
// what happened to Pin Comment, and to nine other features — the chip was in
// the renderer, the CSS was there, the animation was there, and no data ever
// reached it. Nothing failed; the English simply was not on screen.
//
// So: any feature carrying English UI data MUST render a chip. Features with no
// English data anywhere are listed, not failed — inventing a menu path for them
// would be worse than showing none.
//
//   node test-english-path.mjs
import { packForFeature } from "./lib/content.mjs";
import { buildInkHTML } from "./lib/build-ink.mjs";

const BANKS = {
  features: (await import("./lib/features.mjs")).FEATURES,
  extra: (await import("./lib/features-extra.mjs")).EXTRA,
  fresh: (await import("./lib/features-fresh.mjs")).FRESH,
  y2026: (await import("./lib/features-2026.mjs")).Y2026,
  demand: (await import("./lib/features-demand.mjs")).DEMAND,
  visual: (await import("./lib/features-visual.mjs")).VISUAL,
};

// The two places a step can legitimately carry English: an explicit path, or a
// screen schema whose title and highlighted row already name the same thing.
const hasEnglish = (t) =>
  Boolean(t.path) || Boolean(t.screen?.title && t.screen?.rows?.length);

const chipsIn = (html) =>
  [...html.matchAll(/<div class="pathchip"[^>]*>([\s\S]*?)<\/div>/g)]
    .map((m) => m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

let checked = 0;
let bad = 0;
const dark = [];

for (const [bank, obj] of Object.entries(BANKS)) {
  for (const list of Object.values(obj || {})) {
    for (const f of list || []) {
      const pack = packForFeature(f.id, new Date());
      if (!pack) continue;
      const owed = (f.steps || []).some(hasEnglish);
      const chips = chipsIn(buildInkHTML(pack));
      if (!owed) {
        dark.push(`${bank}/${f.id}`);
        continue;
      }
      checked++;
      if (!chips.length) {
        bad++;
        console.log(`  FAIL ${`${bank}/${f.id}`.padEnd(34)} has English data, shows none`);
      } else {
        console.log(`  ok   ${`${bank}/${f.id}`.padEnd(34)} ${chips[0]}`);
      }
    }
  }
}

console.log("");
if (dark.length) {
  console.log(`${dark.length} features carry no English at all — a real path must be`);
  console.log(`written for these, not guessed: ${dark.join(", ")}`);
  console.log("");
}
console.log(bad === 0
  ? `${checked} features show the English label the viewer has to tap`
  : `${bad} of ${checked} hide the English the viewer needs`);
process.exit(bad === 0 ? 0 : 1);
