"""Transcribe narration audio so a build can be checked against what was said.

Level meters cannot tell whether «نمونه‌کارت» came out as «کارت». Transcribing
the audio and reading it back against the expected line can, so this is the
listening step the pipeline actually has: not a human ear, but the words that
are acoustically there rather than the ones that were sent.

Reads a job on stdin, writes results on stdout, both JSON:

    {"model": "medium", "files": ["a.mp3", "b.mp3"]}
    {"results": [{"file": ..., "text": ..., "words": [{"w","start","end"}]}]}

Word timestamps are relative to each file. The caller adds the offset of the
line inside the stitched track, so a report can name the second the listener
would name.
"""
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

import whisper  # noqa: E402  (after the encoding fix, so its prints survive)


def main() -> None:
    job = json.load(sys.stdin)
    model = whisper.load_model(job.get("model", "medium"))

    results = []
    for path in job["files"]:
        # condition_on_previous_text off: each line is generated on its own, so
        # carrying context across them invents continuity that is not there.
        out = model.transcribe(
            path,
            language="fa",
            word_timestamps=True,
            condition_on_previous_text=False,
            fp16=False,
            temperature=0,
        )
        words = [
            {"w": w["word"].strip(), "start": round(w["start"], 2), "end": round(w["end"], 2)}
            for seg in out.get("segments", [])
            for w in seg.get("words", [])
            if w["word"].strip()
        ]
        results.append({"file": path, "text": out["text"].strip(), "words": words})

    json.dump({"results": results}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
