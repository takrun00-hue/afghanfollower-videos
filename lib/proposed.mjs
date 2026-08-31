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

// ---- rejection -------------------------------------------------------------
// Refusing a topic is a different statement from passing over it. The cooldown
// above says "not today"; this says "not ever", and it has to be permanent or
// the same subject returns in a fortnight and has to be refused again.
//
// Kept in the same file as the proposals so one cache entry carries both.
const REJECTED = ".topic-rejected.json";

const readRejected = () => {
  try {
    return existsSync(REJECTED) ? JSON.parse(readFileSync(REJECTED, "utf8")) : [];
  } catch {
    return [];
  }
};

/** Ids the operator has refused outright. */
export function rejectedIds() {
  return new Set(readRejected().map((r) => String(r.id).toLowerCase()));
}

/** Refuse a topic permanently. Returns false if it was already refused. */
export function rejectTopic(id, note = "") {
  const key = String(id || "").toLowerCase();
  if (!key) return false;
  const rows = readRejected();
  if (rows.some((r) => String(r.id).toLowerCase() === key)) return false;
  rows.push({ id, note: String(note).slice(0, 200), at: new Date().toISOString() });
  writeFileSync(REJECTED, JSON.stringify(rows, null, 2) + "\n");
  return true;
}

/** Undo a refusal, for when one was sent by mistake. */
export function unrejectTopic(id) {
  const key = String(id || "").toLowerCase();
  const rows = readRejected();
  const kept = rows.filter((r) => String(r.id).toLowerCase() !== key);
  if (kept.length === rows.length) return false;
  writeFileSync(REJECTED, JSON.stringify(kept, null, 2) + "\n");
  return true;
}

export function rejectedList() {
  return readRejected();
}
