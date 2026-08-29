// Build the duplicate registry from the history that already exists.
//
//   node backfill-registry.mjs
//
// Without this the first thirty days of duplicate checking would have nothing to
// compare against, and rule 12 says a check with no data must be reported as
// unverified rather than clean. Two records already exist: .telegram-sent.json
// has confirmed message ids with dates, and .content-history.json has topics and
// hooks. Neither carries the steps, so those are recovered from the feature
// banks where the content still lives.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { featureById } from "./lib/features.mjs";
import { fingerprint, register, history } from "./lib/dedupe.mjs";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const readJSON = (p, d) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d; } catch { return d; } };

const sent = readJSON(".telegram-sent.json", []);
const topics = readJSON(".content-history.json", []);
const already = new Set(history(60).map((e) => `${e.id}@${e.messageId}`));

let added = 0, partial = 0;
for (const s of sent) {
  const key = `${s.packId}@${s.messageId}`;
  if (already.has(key)) continue;

  const found = s.packId ? featureById(s.packId) : null;
  const f = found ? (found.feature || found) : null;

  if (f) {
    register({
      ...fingerprint({
        id: s.packId, platform: s.platform, feature: f.name, title: f.title,
        hook: f.hook, benefit: f.benefit, payoff: f.payoff, tips: f.steps,
      }, { messageId: s.messageId, kind: s.kind }),
      sentAt: new Date(s.at).toISOString(),
    });
    added++;
  } else {
    // News items and source drafts are generated and no longer resolvable, so
    // record what is known rather than dropping them: an id and a date still
    // stop the same story going out twice.
    const t = topics.find((x) => x.id === s.packId);
    register({
      id: s.packId, platform: s.platform, feature: "", kind: s.kind,
      topic: t?.topic || s.packId || "", question: t?.hook || "",
      angle: "", hookConcept: t?.hook || "", keyPoints: [], claim: "",
      keywords: [], sources: [], messageId: s.messageId,
      sentAt: new Date(s.at).toISOString(),
    });
    partial++;
  }
}

console.log(`رجیستری ساخته شد: ${added} اثرانگشت کامل، ${partial} ناقص`);
console.log(`در پنجرهٔ ۳۰ روزه: ${history().length} رکورد`);
