# Voice correction log

Every narration setting and pronunciation fix that a listening test decided,
with what was rejected and why. Kept so a later pass does not re-propose a
reading that was already tried and turned down, and does not quietly drift back
to values that were listened to and rejected.

**LOCKED** means approved by ear. Do not change without a new listening test,
and record the test here when you do.

The approved settings live in `lib/voice-settings.mjs`; the spoken-copy rules
live in `lib/pronounce.mjs`. This file is the reasoning behind both.

---

## Settings

| | Value | Status |
|---|---|---|
| voice | `Arabic_CalmWoman` | **LOCKED** |
| emotion | `surprised` | **LOCKED** |
| speed | `0.95` | **LOCKED** |
| pitch | `2` | **LOCKED** |
| model | `speech-2.8-hd` | LOCKED |
| language_boost | `Persian` | forced — MiniMax has no Persian voice |

MiniMax carries no Persian or Dari voice among its 332 system voices, so the
timbre is Arabic and `language_boost` carries the words. Cloning is the only
route to a genuinely Persian timbre; one clone was auditioned on 2026-08-28 and
was not preferred.

### Rejected settings — do not retry

| Setting | Heard as | Verdict |
|---|---|---|
| Turkish female voice | robotic | REJECTED |
| `emotion=happy` | robotic, flat | REJECTED |
| `emotion=happy`, louder | more robotic | REJECTED |
| `speed=1.1` | phrases run together — «تند تند پشت هم» | REJECTED |
| `speed=1.1` (as the shipped default) | see the settings-drift entry below | REJECTED |

`emotion=surprised` was once suspected of breaking the reading at 23s. That was
wrong: the degradation came from generating the whole narration in **one**
request, which loses level as it runs (−24 dB → −36 dB). Generated per line the
level stays flat at about −26 dB and `surprised` is clean. The suspicion is
recorded so it is not raised a third time.

---

## Generation

**One request per line.** Always. A single long request degrades, so an
audition built that way makes the listener judge a fault the finished video does
not have. `music/make-voice.mjs` and `verify-voice.mjs` both do this.

---

## Corrections

### Settings drift — the approved reading was never shipped
**Found:** 2026-08-30, by reading the code rather than by ear.
`music/minimax-tts.mjs` carried its own defaults — `emotion=happy`, `pitch=1`,
`speed=1.1` — and nothing in `.env`, the workflows, or `make-voice.mjs` set the
approved values. Every rendered video used the reading that had been auditioned
and rejected as robotic; the approved values existed only in throwaway audition
scripts.
**Action:** moved to `lib/voice-settings.mjs` as the single source, imported by
the TTS adapter, with a warning printed when a run differs from it.
**Status: FIXED.**

### Possessive «ـت» fusing into the preceding word
The engine swallows an unmarked possessive and produces a different word.
Marking its vowel fixes it. **Splitting it off with a space does not** — that
produces the separated delivery the fix was meant to cure.

| Written | Spoken | Was heard as |
|---|---|---|
| ویوهایت | ویوهایَت | — |
| ویدیویت | ویدیویَت | — |
| نمونه‌کارت | نمونه کارَت | «کارت» — a card, a different word |
| تیک‌تاکت | تیک تاکَت | «تیک تاک کَت» |
| اینستاگرامت، پیجت، حسابت، مخاطبت | ‑َت marked | — |

**Status: LOCKED.**

**Rejected for «تیک‌تاکت»:** the two-word rewrite «تیک‌تاکِ تو», and the
closed-up spellings «تیکتاکَت» / «تیکتاکت». Four spellings were auditioned
together on 2026-08-30 and the marked possessive was chosen. Do not re-propose
the rewrite.

### Ezafe appearing where the grammar has none
«برای درآمد واجد شرایط» came out as «برای درآمدهِ واجد» — an added ه or ی is a
different word, and it is the one narration fault that changes the claim.
**Action:** a breath before the predicate. `BREAK_BEFORE` in `lib/pronounce.mjs`
places it in front of the sentence adverb and the predicate, not on a word
count. **Status: LOCKED.**

### «واجدشرایط» glued
Read English-like, and bled an ezafe backwards. Written with a space:
«واجِدِ شَرایِط». **Status: LOCKED.**

### Numbers
«۲۰۰» was read as «دو هزار». `persianNumberWords()` converts rather than looking
up — a lookup table produced «چهل و هشت۹۳» for «۴۸۹۳». **Status: LOCKED.**

### Breath placement
A breath every one or two phrases, never mid-phrase. `breathe()` refuses to
break a compound verb, a number phrase or a bound pair; NBSP marks a multi-word
unit as unsplittable. **Status: LOCKED.**

### Colloquial over literal
Standing instruction: what is written on screen is not what has to be spoken.
The spoken copy carries the meaning in the form people say it — but not at the
cost of a word being heard wrong, which is what retired «تیک‌تاکِ تو».
**Status: LOCKED.**

---

## Verification

`node verify-voice.mjs --feature <key>` generates the narration per line,
transcribes it with Whisper, and prints where the words that came back differ
from the words that were sent, with the second on the stitched track.

It compares by **sound, not spelling**: ت/ط, س/ص/ث, ز/ذ/ض/ظ, ق/غ and ه/ح are the
same sound in Persian, so a transcriber choosing a different letter is not a
fault and is folded away. What survives the folding is a changed syllable, a
missing word, an added vowel.

**What it cannot do:** hear. It has no opinion on rhythm, breath, energy, or
whether a line sounds like a person. A line can transcribe perfectly and still
be robotic. Those faults are found by listening, and a reported fault is not
closed because this check passed.

### A breath landing inside a word
**Found:** 2026-08-30, by transcribing the narration and reading it back.
`breathe()` was free to drop a comma into the space inside a replacement value.
Those spaces are pronunciation aids — «آپلود» spelled «آپ لُود», «تیک‌تاکت»
spelled «تیک تاکَت» — not phrase boundaries, and a comma in one of them is heard
as a gap inside a single word. Thirty-one values were exposed. The transcript
caught it on «نمونه، کارَت»; it is the same mechanism behind the short gap
reported inside «تیک تاکت».
**Action:** every space in every replacement value is now non-breaking, as a
rule rather than per word. `breathe()` reads the head and tail of a joined unit
so the sets still match its edges — matching the whole token had silently
stopped the ezafe breath from being placed before «واجِدِ شَرایِط».
**Status: FIXED**, and covered by `test-hear.mjs`.

### «تعریف» read without its ع
Came back as «تریف». Written «تَعریف`. **Status: FIXED.**

### What the transcript check cannot settle
MiniMax is not deterministic and Persian ASR spells short vowels by guesswork,
so the same line transcribes differently run to run. The comparison forgives a
letter left out and refuses a letter added, which is the right asymmetry — a
missing letter is a vowel the transcriber could not see written, an extra one is
a syllable that was said. It still cannot arbitrate a one-consonant difference
inside a brand name. That one stays with the ear.

---

## Pitch range — «کمی شاد و انسانی‌تر»

**Measured, 2026-08-30.** Five reference videos the user sent were analysed with
`lib/prosody.py` and the narration measured the same way. "Flat" and "robotic"
turned out to be one number:

| | reference speakers | narration, before | after |
|---|---|---|---|
| range (semitones) | 12.8 – 19.1 | **8.1** | **12.4** |
| step-to-step movement | 0.20 – 0.23 | 0.21 ✓ | 0.22 ✓ |
| voiced frames / second | 74 – 78 | **67.6** | **75.3** |
| share of track silent | 0.22 – 0.26 | **0.32** | **0.25** |

The voice was moving as often as a person — it simply was not travelling as far.
Half the distance, which is what a flat reading is.

**pitch 2 → 3.** Tested 1, 2, 3, 4, 5 at the approved speed. Range peaks at 3
(11.8) and falls again at 4 (7.8) and 5 (10.2), so 3 is a real optimum and not
"higher is better".

**Silence trimmed at generation.** MiniMax pads each clip and leaves long gaps at
commas. Trimming the ends and capping interior silence at 0.22s brings rate and
pause share inside the human band without removing the breaths. `trimDeadAir()`
in `lib/voice-settings.mjs`, run as each clip is written so plan-voice and the
render measure the same audio.

**Rejected again, with a number this time:** `emotion=happy` measures a range of
10.0 against `surprised` at 11.8, and `speed` above 0.95 *narrows* the range
(1.0 → 9.4, 1.05 → 9.0) because a faster reading has less room for a contour.
Both had already been rejected by ear; the measurement agrees.

### Open, and probably not real
«تعریف» transcribes as «تریف» and «تطبیق» as «تطویق» in most runs. Persian ASR
drops ع and softens ب routinely, and the voice is an Arabic timbre that should
carry ع well. Not changed — the user has not reported either by ear, and
respelling a word that is being said correctly would be a fix for a fault that
does not exist. Listen for them before acting.

### pitch 3 — REJECTED by ear, 2026-08-30
Heard as childish («کودکانه»). Reverted to 2 and locked there.

This is the entry to read before trusting `lib/prosody.py` again. Pitch 3
measured a range of 12.4 semitones against 8.1 at pitch 2, much closer to the
reference speakers, and it still sounded wrong. **A wider range is not the same
thing as sounding like an adult** — raising the pitch of a voice widens its
range and also makes it younger, and the measurement can only see the first.

The tool keeps its use: it found that the narration was travelling half the
distance a person travels, which was a real fault and a real explanation of
«شاد نیست». It cannot judge whether a reading is right. When a number and the
ear disagree, the ear decides, and the number gets written down here as wrong.

**Kept from that round:** the silence trimming. It removes dead air at the ends
of a clip and caps interior gaps at 0.22s; it cannot raise pitch and had nothing
to do with the childish reading. Speaking rate 75.3 and pause share 0.25, both
inside the human band, come from it.
