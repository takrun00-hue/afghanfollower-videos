"""Measure the pitch movement in a narration.

"Robotic" and "flat" are the same complaint: a voice that holds one note.
Persian listeners hear it immediately, and it is the one thing about a delivery
that can be put on a number — not to replace listening, but to give tuning a
target instead of a guess. The target here is a real human speaker: the
reference videos the channel is being compared against.

What it reports, per file:

    median      centre of the voice, in Hz
    range       5th to 95th percentile of pitch, in semitones — how far the
                voice travels. A monotone reading sits near 2; lively speech
                runs past 8.
    movement    median absolute pitch change between neighbouring frames, in
                semitones per frame. Range says how far it goes, movement says
                how often it moves; a voice can have a wide range and still
                crawl between the extremes.
    rate        voiced frames per second of speech, a rough speaking speed
    pause       share of the file with no voice in it

Pitch is tracked by autocorrelation over 40 ms frames, which is enough to tell
a flat reading from a lively one. It is not a phonetics-grade tracker and is
not used as one.
"""
import json
import sys
import wave

import numpy as np

FMIN, FMAX = 70.0, 400.0     # a speaking voice, male or female
FRAME, HOP = 0.040, 0.010


def read_wav(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
        width = w.getsampwidth()
        chans = w.getnchannels()
    dtype = {1: np.uint8, 2: np.int16, 4: np.int32}[width]
    x = np.frombuffer(raw, dtype=dtype).astype(np.float64)
    if width == 1:
        x -= 128.0
    if chans > 1:
        x = x.reshape(-1, chans).mean(axis=1)
    peak = np.max(np.abs(x)) or 1.0
    return x / peak, sr


def f0_track(x, sr):
    """One pitch estimate per hop, or nan where the frame is not voiced."""
    n = int(FRAME * sr)
    hop = int(HOP * sr)
    lo, hi = int(sr / FMAX), int(sr / FMIN)
    out = []
    for start in range(0, max(0, len(x) - n), hop):
        frame = x[start:start + n]
        frame = frame - frame.mean()
        power = np.sqrt(np.mean(frame ** 2))
        # Silence and unvoiced consonants carry no pitch; guessing one there
        # would invent movement that nobody hears.
        if power < 0.015:
            out.append(np.nan)
            continue
        ac = np.correlate(frame, frame, mode="full")[len(frame) - 1:]
        if ac[0] <= 0:
            out.append(np.nan)
            continue
        ac = ac / ac[0]
        window = ac[lo:hi]
        if len(window) == 0:
            out.append(np.nan)
            continue
        k = int(np.argmax(window)) + lo
        # A weak peak means the frame has no clear period — noise, not a note.
        out.append(sr / k if ac[k] > 0.32 else np.nan)
    return np.array(out, dtype=np.float64)


def semitones(a, b):
    return 12.0 * np.log2(a / b)


def describe(path):
    x, sr = read_wav(path)
    f0 = f0_track(x, sr)
    voiced = f0[~np.isnan(f0)]
    seconds = len(x) / sr
    if len(voiced) < 20:
        return {"file": path, "seconds": round(seconds, 2), "voiced": len(voiced)}

    median = float(np.median(voiced))
    lo, hi = np.percentile(voiced, [5, 95])
    # Step-to-step change, measured only across frames that are both voiced, so
    # a silence does not read as a leap.
    pairs = np.array([
        abs(semitones(f0[i + 1], f0[i]))
        for i in range(len(f0) - 1)
        if not np.isnan(f0[i]) and not np.isnan(f0[i + 1])
    ])

    return {
        "file": path,
        "seconds": round(seconds, 2),
        "median_hz": round(median, 1),
        "range_st": round(float(semitones(hi, lo)), 2),
        "movement_st": round(float(np.median(pairs)) if len(pairs) else 0.0, 3),
        "rate_per_s": round(len(voiced) / seconds, 1),
        "pause_share": round(float(np.mean(np.isnan(f0))), 2),
    }


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps([describe(p) for p in sys.argv[1:]], ensure_ascii=False, indent=2))
