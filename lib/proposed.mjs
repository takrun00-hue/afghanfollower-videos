// What has already been offered to the user, and when.
//
// The duplicate check in lib/dedupe.mjs only knows about topics that were
// SENT. A topic that was proposed and not approved left no trace, so the next
// day's search produced the same ranked list in the same order and offered the
// same topic again — which is what "هر روز موضوع تکرار" was describing. Being
// offered is itself a fact about a topic, and it has to be written down.
//
// Separate from the 30-day sent registry on purpose: these have different
// lifetimes. A sent topic is off the table for a month because the audience saw
// it. A merely-proposed topic is off the table for a shorter while, because the
// user passed on it today and should see something else tomorrow — not because
// it is spent.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FILE = ".topic-proposals.json";
const DAYS = Number(process.env.PROPOSAL_COOLDOWN_DAYS || 14);

const read = () => {
  try {
    return existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];
  } catch {
    return [];
  }
};

const fresh = (rows) => {
  const cutoff = Date.now() - DAYS * 86400000;
  return rows.filter((r) => Date.parse(r.at || "") > cutoff);
};

/** Ids offered within the cooldown window. */
export function recentlyProposed() {
  return new Set(fresh(read()).map((r) => String(r.id).toLowerCase()));
}

/** Record every id in a proposal list, so tomorrow's list can avoid them. */
export function recordProposed(ids) {
  const rows = fresh(read());
  const at = new Date().toISOString();
  const have = new Set(rows.map((r) => String(r.id).toLowerCase()));
  for (const id of ids) {
    const key = String(id).toLowerCase();
    if (!id || have.has(key)) continue;
    rows.push({ id, at });
    have.add(key);
  }
  writeFileSync(FILE, JSON.stringify(rows, null, 2) + "\n");
  return rows.length;
}

/** How many distinct ids are currently on cooldown, for honest reporting. */
export function proposedCount() {
  return recentlyProposed().size;
}

export const COOLDOWN_DAYS = DAYS;
