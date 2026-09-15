// The sole external-command gateway. It validates origin and intent before an
// action can be handed to the orchestrator. It never executes a worker itself.
import { timingSafeEqual } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config, branchForAction } from "./config.mjs";

const option = (args, name) => { const i = args.indexOf(name); return i < 0 ? "" : args[i + 1] || ""; };
const safe = (value, name, max = 4000) => { const text = String(value ?? "").replace(/[\u0000\r\n]/g, " ").trim(); if (text.length > max) throw new Error(`${name} is too long`); return text; };
const equal = (a, b) => { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); };

export function authorize({ action, source, approvalProof = "" }, env = process.env) {
  const cleanAction = safe(action, "action", 100);
  const cleanSource = safe(source, "source", 100);
  if (!config.actions[cleanAction]) throw new Error(`Gateway rejected unknown action: ${cleanAction || "(empty)"}`);
  if (!config.ingress.permittedSources.includes(cleanSource)) throw new Error(`Gateway rejected source: ${cleanSource || "(empty)"}`);
  if (cleanSource === "schedule" && !config.ingress.scheduledActions.includes(cleanAction)) throw new Error(`Gateway rejected non-scheduled action from schedule: ${cleanAction}`);
  if (config.ingress.approvalRequired.includes(cleanAction)) {
    const expected = String(env.GATEWAY_APPROVAL_CODE_HASH || "").trim();
    const given = safe(approvalProof, "approval proof", 200);
    if (!expected) throw new Error(`Gateway approval is not configured for sensitive action: ${cleanAction}`);
    if (!given || !equal(expected, given)) throw new Error(`Gateway approval required for sensitive action: ${cleanAction}`);
  }
  return { accepted: true, action: cleanAction, source: cleanSource, branch: branchForAction(cleanAction), approvalRequired: config.ingress.approvalRequired.includes(cleanAction) };
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const admissionFile = resolve(root, "core", ".gateway-admission.json");
export function admit(decision) {
  mkdirSync(resolve(root, "core"), { recursive: true });
  const tmp = `${admissionFile}.tmp`;
  // This is a single-use, short-lived local handoff—not durable state and not
  // a credential. Orchestrator deletes it before it starts the worker.
  writeFileSync(tmp, `${JSON.stringify({ action: decision.action, source: decision.source, admittedAt: new Date().toISOString() })}\n`);
  renameSync(tmp, admissionFile);
  return decision;
}

if (process.argv[1]?.endsWith("core/gateway.mjs")) {
  const args = process.argv.slice(2);
  console.log(JSON.stringify(admit(authorize({ action: option(args, "--action"), source: option(args, "--source"), approvalProof: option(args, "--approval-proof") })), null, 2));
}
