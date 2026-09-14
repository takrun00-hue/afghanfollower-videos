// Safe migration entry point: real legacy execution, NOT a claimed four-agent rewrite.
import { readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { config, modelFor } from './config.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const statePath = resolve(root, 'core/state.json');

export function executionPlan(channel) {
  if (!Object.hasOwn(config.legacyEntryPoints, channel)) throw new Error('Channel must be tutorial or german');
  const registry = JSON.parse(readFileSync(resolve(root, 'core/registry.json'), 'utf8'));
  if (registry.deprecated.includes(config.legacyEntryPoints[channel])) throw new Error('Deprecated entry point is forbidden in autopilot');
  const laws = readFileSync(resolve(root, 'PROJECT_LAWS.md'), 'utf8');
  if (!/^## GOALS\s*$/m.test(laws)) throw new Error('PROJECT_LAWS.md lacks GOALS');
  return { channel, entry: config.legacyEntryPoints[channel], models: {
    text: modelFor('text'), image: modelFor('image'), textFallback: modelFor('textFallback'),
  }, mode: 'legacy-adapter', migrationComplete: false };
}

const safeValue = (value, label) => {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(value || '')) throw new Error(`Invalid ${label}`);
  return value;
};

function tomorrowBerlin() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: config.schedule.timeZone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
  const get = type => parts.find(part => part.type === type)?.value;
  const utc = Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day'))) + 86400000;
  return new Date(utc).toISOString().slice(0, 10);
}

// One controlled route for every video-producing command. The caller chooses
// an action from config.videoActions, never a shell command or script path.
export function videoPlan(action, { payload = '', slot = '', unit = '' } = {}) {
  if (action === 'scheduled-tutorial') {
    return { action, entry: config.legacyEntryPoints.tutorial, args: ['--only', safeValue(slot, 'slot')] };
  }
  if (action === 'scheduled-german') {
    const args = unit ? ['--unit', safeValue(unit, 'unit')] : [];
    return { action, entry: config.legacyEntryPoints.german, args };
  }
  const requested = config.videoActions[action];
  if (!requested) throw new Error(`Video action is not allowed: ${action}`);
  const args = [...(requested.args || [])];
  if (requested.payload === 'append') {
    if (!payload) throw new Error(`Video action ${action} requires payload`);
    args.push(payload);
  }
  if (requested.payload === 'feature') {
    args.push('--feature', safeValue(payload, 'feature id'));
  }
  if (requested.tomorrow) args.push(tomorrowBerlin());
  args.push(...(requested.after || []));
  return { action, entry: requested.script, args };
}

export function runVideo(action, options = {}) {
  const plan = videoPlan(action, options);
  const child = spawnSync(process.execPath, [resolve(root, plan.entry), ...plan.args], { cwd: root, stdio: 'inherit', env: process.env });
  if (child.status !== 0) throw new Error(`Video action ${action} failed; inspect its diagnostics before retry`);
  return { ...plan, status: 'process-completed-receipt-unverified' };
}

export function run(channel, { execute = false, jobId = '' } = {}) {
  const plan = executionPlan(channel);
  if (!execute) return plan;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(jobId)) throw new Error('Explicit stable --job-id required');
  // Exclusive local lock. Never remove a stale lock automatically: inspect the owner first.
  const lockPath = resolve(root, 'core/orchestrator.lock');
  const fd = openSync(lockPath, 'wx');
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    if (state.schemaVersion !== 1 || !state.jobs || typeof state.jobs !== 'object' || Array.isArray(state.jobs)) throw new Error('Invalid core state');
    if (state.jobs[jobId]) throw new Error('Job already recorded; inspect before retry to avoid duplicate delivery');
    const save = () => { writeFileSync(`${statePath}.tmp`, JSON.stringify(state, null, 2)+'\n'); renameSync(`${statePath}.tmp`, statePath); };
    state.jobs[jobId] = { channel, status: 'running', startedAt: new Date().toISOString() };
    save();
    const child = spawnSync(process.execPath, [resolve(root, plan.entry)], {
      cwd: root, stdio: 'inherit', env: { ...process.env,
        GEMINI_MODEL: plan.models.text.id, GROQ_MODEL: plan.models.textFallback.id,
        GEMINI_IMAGE_MODEL: plan.models.image.id },
    });
    // Exit 0 is NOT a Telegram delivery receipt. Preserve that distinction.
    state.jobs[jobId].status = child.status === 0 ? 'process-completed-receipt-unverified' : 'needs-attention';
    state.jobs[jobId].exitCode = child.status;
    state.jobs[jobId].finishedAt = new Date().toISOString();
    save();
    if (child.status !== 0) throw new Error('Legacy pipeline failed; inspect its diagnostics before retry');
    return state.jobs[jobId];
  } finally { closeSync(fd); unlinkSync(lockPath); }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.includes('--dry-run') || process.env.npm_config_dry_run === 'true') {
    const {renderPreview} = await import('../video-engine/renderer.ts');
    console.log(JSON.stringify(await renderPreview()));
  } else if (args.includes('--video-action')) {
    const value = flag => args[args.indexOf(flag)+1] || '';
    const action = value('--video-action');
    console.log(JSON.stringify(runVideo(action, { payload:value('--payload'), slot:value('--slot'), unit:value('--unit') }), null, 2));
  } else {
  const value = flag => args[args.indexOf(flag)+1];
  console.log(JSON.stringify(run(args.includes('--channel') ? value('--channel') : 'tutorial', {
    execute: args.includes('--execute') && !args.includes('--dry-run'), jobId: args.includes('--job-id') ? value('--job-id') : '',
  }), null, 2));
  }
}
