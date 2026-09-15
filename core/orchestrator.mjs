import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync, openSync, closeSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config, modelFor, branchForAction } from "./config.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stateFile = resolve(root, "core", "state.json");
const lockFile = resolve(root, "core", "orchestrator.lock");
const admissionFile = resolve(root, "core", ".gateway-admission.json");
const option = (args, name) => { const i = args.indexOf(name); return i < 0 ? "" : args[i + 1] || ""; };
const safe = (value, name, max = 4000) => { const text = String(value ?? "").replace(/[\u0000\r\n]/g, " ").trim(); if (text.length > max) throw new Error(`${name} is too long`); return text; };
const berlinTomorrow = () => { const p = new Intl.DateTimeFormat("en-CA", { timeZone: config.schedule.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const g = (t) => p.find((x) => x.type === t)?.value; return new Date(Date.UTC(Number(g("year")), Number(g("month")) - 1, Number(g("day")) + 1)).toISOString().slice(0, 10); };
const readState = () => JSON.parse(readFileSync(stateFile, "utf8"));
const writeState = (state) => { state.lastUpdatedAt = new Date().toISOString(); const tmp = `${stateFile}.tmp`; writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`); renameSync(tmp, stateFile); };
const consumeGatewayAdmission = (action) => {
  if (!existsSync(admissionFile)) throw new Error(`Gateway admission is required before ${action} can execute.`);
  let admission;
  try { admission = JSON.parse(readFileSync(admissionFile, "utf8")); } catch { throw new Error("Gateway admission is invalid."); }
  unlinkSync(admissionFile);
  const age = Date.now() - Date.parse(admission.admittedAt || "");
  if (admission.action !== action || !Number.isFinite(age) || age < 0 || age > 120000) throw new Error("Gateway admission is missing, mismatched or expired.");
};
export function plan(action, data = {}) {
  const template = config.actions[action];
  if (!template) throw new Error(`Unregistered action: ${action}`);
  const variables = { "$payload": safe(data.payload, "payload"), "$optionalPayload": safe(data.payload, "payload"), "$photoFileId": safe(data.photoFileId, "photo file id", 300), "$pick": safe(data.pick, "pick", 20), "$tomorrow": berlinTomorrow() };
  const resolved = template.map((part) => variables[part] ?? part).filter(Boolean);
  if (template.includes("$payload") && !variables.$payload) throw new Error(`${action} requires payload`);
  if (template.includes("$pick") && !variables.$pick) throw new Error(`${action} requires pick`);
  return { action, script: resolved[0], args: resolved.slice(1) };
}
export function execute(action, data = {}) {
  const job = plan(action, data); consumeGatewayAdmission(action); const jobId = safe(data.jobId || `${action}-${Date.now()}`, "job id", 100).replace(/[^a-zA-Z0-9_.-]/g, "-");
  mkdirSync(resolve(root, "core"), { recursive: true }); if (existsSync(lockFile)) throw new Error("Another orchestrated job is active; refusing parallel production.");
  const fd = openSync(lockFile, "wx");
  try {
    const state = readState(); if (state.jobs[jobId]) throw new Error(`Job ${jobId} already exists; refusing duplicate execution.`);
    state.jobs[jobId] = { action, branch: branchForAction(action), status: "running", startedAt: new Date().toISOString(), plan: job }; writeState(state);
    const env = { ...process.env, GEMINI_MODEL: modelFor("text").id, GROQ_MODEL: modelFor("textFallback").id, GEMINI_IMAGE_MODEL: modelFor("image").id };
    const result = spawnSync(process.execPath, [resolve(root, job.script), ...job.args], { cwd: root, env, stdio: "inherit" });
    state.jobs[jobId] = { ...state.jobs[jobId], status: result.status === 0 ? "completed" : "failed", exitCode: result.status, finishedAt: new Date().toISOString() }; writeState(state);
    if (result.status !== 0) throw new Error(`${action} failed with exit ${result.status}`); return state.jobs[jobId];
  } finally { closeSync(fd); if (existsSync(lockFile)) unlinkSync(lockFile); }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2); const action = option(args, "--action"); const data = { payload: option(args, "--payload"), pick: option(args, "--pick"), photoFileId: option(args, "--photo-file-id"), jobId: option(args, "--job-id") };
  // A dry run must not leave a usable admission behind for a later command.
  if (args.includes("--dry-run") && existsSync(admissionFile)) unlinkSync(admissionFile);
  console.log(JSON.stringify(args.includes("--dry-run") ? plan(action, data) : execute(action, data), null, 2));
}
