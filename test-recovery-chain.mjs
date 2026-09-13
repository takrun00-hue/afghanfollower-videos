import assert from "node:assert/strict";
import { decide, MAX_CHAIN_RETRIES } from "./lib/recovery-chain.mjs";

// Owner directive 2026-09-13: FAILED_ATTEMPT != FAILED_JOB. A GitHub Actions
// job that already exited cannot resume mid-flight, so news-scan.yml's
// "Chain an automatic Recovery Loop retry" step (if: failure()) is the only
// way a Recovery Loop keeps trying past one run's local budget. This tests
// the pure decision logic that step's script (lib/recovery-chain.mjs) runs —
// without touching git or the filesystem.

// No marker at all (a failure unrelated to the Recovery Engine) must never
// be chained — that failure belongs to a human or another self-heal routine.
assert.deepEqual(decide(null), { chain: false, reason: "no-marker" });

// Fresh exhaustion (this run's first RecoveryExhausted for this unit) must
// chain — this is exactly the case that used to require a human/agent to
// notice run #223's failure and manually push run #224.
assert.deepEqual(decide({ unit: "a1-18-shopping", attempts: 1 }), { chain: true, attempts: 1 });
assert.deepEqual(decide({ unit: "a1-18-shopping", attempts: MAX_CHAIN_RETRIES - 1 }), { chain: true, attempts: MAX_CHAIN_RETRIES - 1 });

// Budget exhausted must stop chaining for real — never an infinite loop of
// auto-retries masking a genuinely unrecoverable case from a human.
assert.deepEqual(decide({ unit: "a1-18-shopping", attempts: MAX_CHAIN_RETRIES }), { chain: false, reason: "budget-spent", attempts: MAX_CHAIN_RETRIES });
assert.deepEqual(decide({ unit: "a1-18-shopping", attempts: MAX_CHAIN_RETRIES + 5 }), { chain: false, reason: "budget-spent", attempts: MAX_CHAIN_RETRIES + 5 });

// A marker missing "attempts" (should never happen, but must fail safe as
// attempt 1 rather than throw or silently loop forever).
assert.deepEqual(decide({ unit: "a1-18-shopping" }), { chain: true, attempts: 1 });

console.log("ok   Recovery Loop cross-run chain decision: chains a bounded number of times, never infinitely, never for an unrelated failure");
