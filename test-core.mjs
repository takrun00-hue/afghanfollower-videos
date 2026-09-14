import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { config, modelFor } from './core/config.ts';
import { executionPlan, videoPlan } from './core/orchestrator.ts';
import { buildSmartPrompt } from './core/visual-engine.ts';
const registry = JSON.parse(readFileSync(new URL('./core/registry.json', import.meta.url)));
assert.equal(registry.deprecated.length, 18);
assert.equal(new Set(registry.deprecated).size, 18);
assert.match(buildSmartPrompt('Bäckerei'), /authentic German bakery/);
assert.doesNotMatch(buildSmartPrompt('unknown topic'), /undefined/);
assert.doesNotMatch(buildSmartPrompt('__proto__'), /\[object Object\]/);
assert.throws(() => buildSmartPrompt(' '));
assert.equal(executionPlan('tutorial').migrationComplete, false);
const original = config.legacyEntryPoints.tutorial;
try {
  config.legacyEntryPoints.tutorial = registry.deprecated[0];
  assert.throws(() => executionPlan('tutorial'), /Deprecated/);
} finally { config.legacyEntryPoints.tutorial = original; }
assert.equal(modelFor('image', {}).id, config.models.image.id);
assert.deepEqual(videoPlan('scheduled-tutorial', {slot:'instagram'}).args, ['--only', 'instagram']);
assert.deepEqual(videoPlan('build-instagram').args, ['--only', 'instagram']);
assert.deepEqual(videoPlan('rerender-feature', {payload:'ig-insights-retention'}).args, ['--feature', 'ig-insights-retention', '--rerender']);
assert.throws(() => videoPlan('scheduled-tutorial', {slot:'../escape'}));
assert.throws(() => videoPlan('not-real'));
console.log('Core registry, cultural prompt, dry-run plan and deprecated-entry guard passed');
