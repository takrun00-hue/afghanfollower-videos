// Word-level release gate for the exact TTS clips that the video will use.
// A level meter can prove that audio exists; it cannot prove that «صِفر» or a
// bound suffix was pronounced correctly.  Whisper is imperfect, so comparison
// is deliberately phonetic (lib/hear.mjs), but an added syllable, missing word
// or changed word blocks the release.
//
// Usage: node music/voice-qc.mjs --manifest path/to/voice-qc.json
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { faults } from "../lib/hear.mjs";

// The cloud keeps diagnostics intentionally small: a fixed category and a
// line number are enough to repair a TTS failure without committing spoken
// copy, ASR output, paths, or credentials.
const diagnosticFile = process.env.RENDER_DIAGNOSTIC_FILE || "";
function diagnostic(reason, line = null, fault = null) {
  if (!diagnosticFile) return;
  try {
    writeFileSync(diagnosticFile, JSON.stringify({
      stage: "narration-planning", reason, line,
      // A type and ordinal identify the defective word without committing
      // written copy or ASR output to the repository.
      faultKind: fault?.kind || null,
      wordIndex: Number.isInteger(fault?.wantIndex) ? fault.wantIndex + 1 : null,
      at: new Date().toISOString(),
    }, null, 2));
  } catch {}
}

const at = process.argv.indexOf("--manifest");
const manifestFile = at >= 0 ? process.argv[at + 1] : "";
if (!manifestFile || !existsSync(manifestFile)) {
  diagnostic("voice-qc-manifest");
  console.error("voice QC needs --manifest <existing-json-file>");
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
if (!entries.length || entries.some((e) => !e?.spoken || !e?.file || !existsSync(e.file))) {
  diagnostic("voice-qc-input");
  console.error("voice QC manifest has no complete spoken/file entries");
  process.exit(2);
}

const model = process.env.ASR_MODEL || "medium";
let results;
try {
  const raw = execFileSync("python", ["lib/asr.py"], {
    input: JSON.stringify({ model, files: entries.map((e) => e.file) }),
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
  });
  results = JSON.parse(raw.toString()).results || [];
} catch (err) {
  diagnostic("voice-asr-unavailable");
  console.error(`Narration ASR QC could not run: ${String(err.message).split("\n")[0]}`);
  process.exit(2);
}

const report = entries.map((entry, index) => {
  const heard = results[index] || { text: "", words: [] };
  const found = faults({ expected: entry.spoken, heard: heard.text, words: heard.words });
  // A one-letter standalone ASR insertion is frequently punctuation/noise;
  // every changed or missing word, and every longer insertion, remains fatal.
  const blocking = found.filter((f) => f.kind !== "extra" || String(f.got || "").length > 1);
  return { line: index + 1, written: entry.written, spoken: entry.spoken, heard: heard.text, faults: blocking };
});

const out = { checkedAt: new Date().toISOString(), model, report };
writeFileSync(resolve(dirname(manifestFile), "voice-qc-report.json"), JSON.stringify(out, null, 2));
const errors = report.flatMap((line) => line.faults.map((fault) => ({ line: line.line, ...fault })));
if (errors.length) {
  diagnostic("voice-asr-mismatch", errors[0].line, errors[0]);
  for (const fault of errors) console.error(`Narration QC line ${fault.line}: ${fault.kind} «${fault.want || "—"}» → «${fault.got || "—"}»`);
  process.exit(1);
}
console.log(`Narration ASR QC passed: ${entries.length} exact render clips (${model}).`);
