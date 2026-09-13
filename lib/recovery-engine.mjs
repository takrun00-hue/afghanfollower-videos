// Owner directive 2026-09-13 ("Recovery Loop"): exhausting a fixed number of
// identical retries must not be the end of a job. It is a signal that the
// CURRENT strategy does not work, which hands control to a recovery step
// that looks at the actual failure history, proposes a genuinely different
// strategy, and tries again — not a fourth blind repeat of the same thing,
// and not a silent "failed" returned to a human to debug by hand.
//
// This module is the reusable orchestrator only. It knows nothing about
// narration, images, or any specific pipeline — it takes an `attempt`
// function (try the current strategy once) and a `recover` function (given
// the full failure history, propose a new strategy or admit none exists)
// and runs the local-retry / escalate-to-recovery / new-strategy loop.
//
// The one thing this module refuses to make easy: pretending recovery is
// unlimited. `recover` returning null (no valid new strategy) and
// `maxRecoveryCycles` being reached are both real, honest stopping points —
// PROJECT_RULES' content-integrity gates (Visual Truth Gate, Narration QC)
// define a finite space of SANCTIONED strategies for a reason, and this
// engine's job is to exhaust that real space intelligently, not to invent a
// strategy outside it just to avoid reporting a genuine dead end.

export class RecoveryExhausted extends Error {
  constructor(message, { history, lastReason }) {
    super(message);
    this.name = "RecoveryExhausted";
    this.history = history;
    this.lastReason = lastReason;
  }
}

/**
 * @param {object} opts
 * @param {(context: any, meta: {cycle:number, localAttempt:number}) => Promise<{ok:true,value:any}|{ok:false,reason:any}>} opts.attempt
 *   Try the current strategy once. Must not throw for an ordinary failure —
 *   return {ok:false, reason} instead; reason is passed to `recover` and
 *   into the thrown RecoveryExhausted so a caller can log what actually
 *   went wrong, not just that it did.
 * @param {(history: Array<{cycle:number,localAttempt:number,ok:boolean,reason?:any}>, context: any) => Promise<{context:any}|null>} opts.recover
 *   Called only once local retries for the current cycle are exhausted.
 *   Inspect `history` (every attempt so far, across every cycle) and either
 *   return a new context embodying a genuinely different strategy, or null
 *   if no valid strategy remains — that is the honest end of recovery, not
 *   a failure of this engine.
 * @param {number} [opts.maxLocalRetries] Attempts per cycle before escalating.
 * @param {number} [opts.maxRecoveryCycles] How many times `recover` may propose
 *   a new strategy before this engine gives up for real.
 * @param {any} [opts.initialContext]
 * @returns {Promise<{value:any, history:Array}>}
 */
export async function runWithRecovery({
  attempt,
  recover,
  maxLocalRetries = 3,
  maxRecoveryCycles = 2,
  initialContext = {},
}) {
  let context = initialContext;
  const history = [];
  for (let cycle = 0; cycle <= maxRecoveryCycles; cycle++) {
    for (let localAttempt = 1; localAttempt <= maxLocalRetries; localAttempt++) {
      const result = await attempt(context, { cycle, localAttempt });
      if (result.ok) {
        history.push({ cycle, localAttempt, ok: true });
        return { value: result.value, history };
      }
      history.push({ cycle, localAttempt, ok: false, reason: result.reason });
    }
    if (cycle === maxRecoveryCycles) break; // recovery budget spent — real stop, see class comment
    const outcome = await recover(history, context);
    if (!outcome) break; // recover() found no valid new strategy — real stop, not this engine giving up early
    context = outcome.context;
  }
  const lastReason = history.length ? history[history.length - 1].reason : undefined;
  throw new RecoveryExhausted(
    "recovery exhausted: local retries and every proposed new strategy failed, or no new strategy was available",
    { history, lastReason },
  );
}
