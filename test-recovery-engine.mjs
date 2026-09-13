import assert from "node:assert/strict";
import { runWithRecovery, RecoveryExhausted } from "./lib/recovery-engine.mjs";

// Owner directive 2026-09-13: prove — with a simulated failure, not a claim —
// that exhausting local retries does NOT end the job. It must escalate to a
// recovery step, apply a genuinely new strategy, retry, and continue past
// the point where a blind retry loop would have stopped. This test is the
// "create a real or simulated failure and show the pipeline does not stop"
// demonstration.

// --- Scenario 1: local retries exhausted, recovery proposes a genuinely
// different strategy, and the NEXT cycle succeeds on its first attempt —
// exactly the "بد" incident: 3 identical attempts fail on the same word,
// recovery rewords the line once, the reworded line passes immediately. ---
{
  const calls = [];
  const result = await runWithRecovery({
    initialContext: { text: "این دو کلمه یعنی خوب و بد." },
    maxLocalRetries: 3,
    maxRecoveryCycles: 2,
    attempt: async (context, meta) => {
      calls.push({ ...meta, text: context.text });
      // The ORIGINAL text fails every single local attempt (a genuinely
      // persistent fault, not noise) — never passes no matter how many
      // times it's retried identically.
      if (context.text.includes("بد.")) return { ok: false, reason: { word: "بد" } };
      // Any REWORDED text (the recovery step's output) passes immediately.
      return { ok: true, value: context.text };
    },
    recover: async (history) => {
      // A real recovery step would call an LLM here; the orchestration
      // logic under test does not care how the new strategy is produced,
      // only that failure history reaches it and a new context comes back.
      assert.equal(history.length, 3, "recover() must only run after all 3 local attempts in the cycle are spent");
      assert.ok(history.every((h) => !h.ok && h.reason.word === "بد"), "recover() must see the real per-attempt failure reasons");
      return { context: { text: "این دو کلمه یعنی خوبی و بدیِ یک چیز را نشان می‌دهند." } };
    },
  });

  assert.equal(calls.length, 4, "must make exactly 3 local attempts + 1 attempt on the new strategy — never a 4th blind identical retry");
  assert.deepEqual(calls.slice(0, 3).map((c) => c.text), Array(3).fill("این دو کلمه یعنی خوب و بد."), "the 3 local attempts must be the ORIGINAL strategy, unchanged");
  assert.equal(calls[3].text, "این دو کلمه یعنی خوبی و بدیِ یک چیز را نشان می‌دهند.", "the 4th attempt must use the NEW strategy from recover(), not a repeat");
  assert.equal(calls[3].cycle, 1, "the successful attempt must be reported as recovery cycle 1, not cycle 0");
  assert.equal(result.value, "این دو کلمه یعنی خوبی و بدیِ یک چیز را نشان می‌دهند.");
  console.log("ok   local-retry exhaustion escalates to recovery, applies a new strategy, and continues past the point a blind retry loop would stop");
}

// --- Scenario 2: genuine exhaustion — every proposed strategy also fails,
// across the full recovery-cycle budget. Must throw RecoveryExhausted (an
// honest stop), never silently succeed and never loop forever. ---
{
  let recoverCalls = 0;
  let threw = null;
  try {
    await runWithRecovery({
      initialContext: { attemptNumber: 0 },
      maxLocalRetries: 2,
      maxRecoveryCycles: 2,
      attempt: async () => ({ ok: false, reason: "still fails" }),
      recover: async () => {
        recoverCalls++;
        return { context: { attemptNumber: recoverCalls } }; // a "new" strategy each time, but it still fails
      },
    });
  } catch (e) {
    threw = e;
  }
  assert.ok(threw instanceof RecoveryExhausted, "must throw RecoveryExhausted, not return a silent failure value, once every sanctioned strategy is spent");
  assert.equal(recoverCalls, 2, "recover() must be given exactly maxRecoveryCycles chances to propose a new strategy — no more, no fewer");
  assert.equal(threw.history.length, 2 * 3, "history must record every attempt across every cycle (2 local retries x 3 cycles: initial + 2 recovery)");
  console.log("ok   exhausting every recovery cycle throws a real, honest RecoveryExhausted — never an infinite loop, never a silent fake success");
}

// --- Scenario 3: recover() itself finds no valid new strategy (the real
// boundary case for something like the Visual Truth Gate, which has no
// third tier beyond real-search and ai-generated) — must stop immediately,
// not burn remaining recovery cycles pretending to try. ---
{
  let recoverCalls = 0;
  let threw = null;
  try {
    await runWithRecovery({
      maxLocalRetries: 1,
      maxRecoveryCycles: 3,
      attempt: async () => ({ ok: false, reason: "no real photo found" }),
      recover: async () => {
        recoverCalls++;
        return null; // no further sanctioned strategy exists — an honest admission, not a failure of this engine
      },
    });
  } catch (e) {
    threw = e;
  }
  assert.ok(threw instanceof RecoveryExhausted);
  assert.equal(recoverCalls, 1, "recover() returning null must stop immediately, not be called again for the remaining cycles");
  console.log("ok   recover() admitting no valid strategy remains stops immediately instead of pretending to keep trying");
}
