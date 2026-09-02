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

### English UI labels and bound spoken words — pending listening approval
**Changed:** 2026-09-02. `Creator Search Insights`, `Content gap`, and `Search analytics` are UI labels, not Persian loanwords. Their spoken copy now remains Latin and is protected from an internal breath; TikTok remains a Persian-spoken brand name. Colloquial forms such as «می‌خواین» and «می‌تونین» are now one spoken word rather than being separated by a space.

**Status: NEEDS LISTENING TEST.** This changes only the private TTS copy, not on-screen text or the locked voice settings. The next narrated render must be listened to before this reading is marked LOCKED.

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

---

## The 2026-08-31 batch — five real bugs in one report

The user's complaint bundled several things together; each was checked
independently rather than assumed. Two turned out to be real structural bugs
with fixes at the class level; one turned out not to be a bug at all (the ear
was reacting to something else); two were tested and found not reproducible.

### «تیک‌تاک» split into «تیک، تاک» — CONFIRMED, FIXED (class-level)
Root cause: `normalise()` converts every leftover ZWNJ to a plain space,
including inside a brand name that has no possessive suffix — the protection
that exists for «تیک‌تاکت» never covered the bare name. That plain space then
sat exposed to `breathe()` exactly like the 31 pronunciation values did before
they were protected.
**Fixed at the class, not the instance:** a scan of every ZWNJ compound in the
whole feature catalogue found the same exposure in `بک‌گراند`, `به‌خاطر`,
`ری‌اکشن`, `اسکرین‌شات`, `پلی‌لیست`, `تله‌پرامپتر`, `ثبت‌نام`, `زمان‌بندی`,
`کلین‌آپ` — none ever reported broken, all carrying the identical risk. All
protected the same way. **Status: LOCKED.**

**Investigated and reverted:** `JOIN_AFTER`'s `` never matches Persian
letters (`` is defined over `\w`, which excludes them), so the "glue plural/
comparative suffixes" step has been a silent no-op the whole time. Fixing the
regex made it fire — and glued «بیننده‌های» into «بینندههای», a double-ه that
was never heard by anyone. Reverted unheard rather than shipped; the no-op is
the state every video so far was built and approved against.

### «رایگان» opening the hook — CONFIRMED, FIXED (7 of 7 instances)
A LOCKED content rule — stated repeatedly — says free/name/logo never opens a
tool video. `hook.ask` is shown on screen AND spoken, so this was a double
violation. Every tools-bank feature was scanned: **all seven** that mention
رایگان put it as the literal first word. All seven reworded to lead with the
result and mention رایگان after a natural pause instead.

### Mid-sentence em-dash and semicolon — CONFIRMED, FIXED
A dash used as a written pause (`... شو — رایگان`) was never converted to
anything the engine reads as a pause; it sat as a raw character, occupying a
slot in `breathe()`'s word array and corrupting its count. Now converted to a
comma before tokenising. Semicolons the same way.

### The breath counter never reset on an existing comma — CONFIRMED, FIXED
Once a comma already sits in the text — hand-written, or just produced by the
dash conversion above — `breathe()`'s `since` counter kept climbing through it
and inserted more, stacking three commas where one was intended
(«به‌خاطر، موزیک، حذف نشود،»). Now any comma already in the token resets the
counter, whether it came from the source text or from `breathe()` itself.

### «نه لای الگوریتم» — CONFIRMED via 4/4 independent takes, FIXED by rewording
This is very likely what the user actually heard and called «لای» — not the
word itself (a correct, ordinary Persian word meaning "amid/within"), but
whatever came apart right next to it. Isolated and tested: «الگوریتم» alone
reads fine; «نه لای الگوریتم» together breaks on **every one of four
independent generations** («نلویه آلگوریتام», «نه، لویه آلگوریتم» ×2, similar
on the fourth). Reworded to «نه توی الگوریتم گم می‌شود» — tested clean or
near-clean in 3 of 3. **Status: reworded, not a pronunciation-layer fix**; this
specific three-word sequence may simply be hard for this engine, the same class
of problem as «سوار … شو» below.

### «قبل از همه سوار ترند شو» — a discontinuous light verb, REWORDED
«سوار … شو» (get on/board) brackets its object; no positional breath rule can
safely place a pause inside it without more context than `breathe()` has.
Reworded to «به ترند سوار شو» so the two verb halves sit adjacent. Same fix
class as the «نه لای» rewording above: when a specific grammatical construction
is what breaks, the construction is changed rather than teaching the breath
placer one more special case.

### دایرکت, and English words appearing in the transcript — INVESTIGATED, NOT A BUG
The user heard English inside the Persian narration. Eight independent
generations of the دایرکت line and four of «ترند … وایرال» never once produced
an actual English-pronunciation reading — Whisper's transcript occasionally
romanises a confidently-pronounced loanword («trend», «viral», «algoritm») even
though `language_boost` is Persian and the source text is pure Persian script.
**Do not "fix" a word on the strength of what a transcript says if the audio
itself, generated repeatedly, never shows the fault.** This is the same
principle as the earlier سرپرست note on transcript noise, applied to a new
failure mode: romanisation instead of a wrong letter.

### «برایت» and «صدایت» — TESTED, NOT ADDED
Both appear in the catalogue with the same unmarked-possessive shape as
«پیامت»/«تیک‌تاکت». Tested marked vs. plain, three takes each: **no
consistent difference** — both forms showed the same scatter of ASR noise.
Unlike «پیامت» (which the ear can be shown breaking on 4/4 plain takes and
recovering on marked ones), there is no reproducible defect here to fix.
Not added. A possessive shape being on the known-risk list is a reason to test
it, not a reason to mark it.

### «پیامت» — CONFIRMED, FIXED
Same class as `ویوهایت`/`تیک‌تاکت`: unmarked, it broke in 4 of 4 independent
generations of the line it actually appears in. Marked «پیامَت», clean or
near-clean across the same count. **Status: LOCKED.**

### `verify-voice.mjs` had a blind spot — FIXED
It reconstructed `hook + tips` by hand instead of calling `narrationFor()`,
the function the render actually uses. `narrationFor()` falls back to
`pack.payoff` as the outro line when a feature has no hand-written script —
and «نه لای الگوریتم» lived in exactly that line, never checked. Every
finding above involving the outro came from re-pointing the tool at the real
source, not from a lucky guess about where to look. **Any feature with no
hand-authored entry in `lib/narration.mjs` speaks its payoff as the last line
— check it.**


---

## Persian reading rules, written down

The general rules moved to the **persian-tts-reading** skill
(`~/.claude/skills/persian-tts-reading/`) — seven files covering unwritten
sounds, homophone letters, what must never be split, foreign words, colloquial
register, breath, and verification. Read it before changing pronounce.mjs.

What stays here is this channel's own verdicts: what was approved by ear, and
what was rejected.

Fixes were being added one reported word at a time. These are the rules behind
them, so the next word of the same shape is right before anyone has to report it.

### The possessive enclitic is /-et/, not /-at/
**FIXED 2026-08-31.** Spelled «ـَت» with a fatha, but modern spoken Persian says
**-et**: «کتابت» is ketâb-**et**, «حسابت» is hesâb-**et**, «ریلزت» is relz-**et**.

All twenty-two entries in the table marked it with a fatha, telling the engine to
say /-at/ — a vowel Persian does not use there. That is why the suffix kept
arriving as a separate, English-sounding syllable instead of joining the word:
the engine was being asked for a sound that does not belong to the word, so it
put it outside the word.

Marked with a kasra it joins. Verified by transcript: «حسابت» and «ویدیویت» now
come back as single words.

**Never write the enclitic as its own token.** «ویوت» was spelled «ویو اِت» —
two words on the page and therefore two words in the mouth. It is not a word; it
is a vowel and a consonant on the end of one.

### غ and ق are one sound
Both are /q/ in Persian. The engine reads غ as a hard g and said «گیر» for
«غیر» — a different word. Spelling the sound with ق gives the right
pronunciation with a letter the engine reads reliably: «قِیر». **FIXED.**

This is the same move as respelling a loanword, applied to a native word: what
is written and what must be said are allowed to differ, and here they must.

### «ریلزت» — LOCKED as «ریلزِت»
Three spellings were auditioned on 2026-08-31 and the kasra form was chosen by
ear. **Rejected:** «ریلسِت» (the ز respelled as س) and «ریلزَت» (the fatha, which
is the same wrong vowel the rule above is about). Do not re-try either.

### What a short line cannot be tested on
«ریلزت» could not be settled by transcript. Whisper needs surrounding words; on
a two-word line it returned «بریلستر», which is a failure of the transcriber and
not evidence about the audio. Short lines go to the ear, and a transcript of one
is not a result.
