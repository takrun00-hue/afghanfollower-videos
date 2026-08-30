# What the followed channels actually do

Taken from five videos the user sent on 2026-08-30 as examples of content people
follow. All five are Persian/Dari creators speaking to an Afghan and Iranian
audience. They are transcribed and measured, not summarised from memory, and the
patterns below are the ones that hold across all five — not one clever thing one
of them did.

Where this channel already differs, it says so. Differing is not automatically
wrong; not knowing you differ is.

---

## The format

Every one of the five is the same shape:

**Split screen.** B-roll on top — a screen recording, a stock clip, a company
logo, a product shot. The presenter's face fills the bottom. Neither half is
decoration: the top shows the thing being talked about, the bottom is a person
talking about it.

**One caption phrase at a time**, burned in at the seam between the two halves.
Short — three to six words. It changes with the sentence, not with a timer.

**Vertical, and visibly re-encoded.** 352×640 and 464×848. Nobody is watching
these for the picture quality.

> This channel has no face and no B-roll. It is motion graphics with narration.
> That is the single largest structural difference, and it is not something the
> pipeline can close on its own.

## Length

| | length |
|---|---|
| pure list, no explanation | 19s |
| two audience types | 37s |
| news — jobs AI will take | 41s |
| one app explained properly | 58s |
| one model explained properly | 72s |

Average 45 seconds. Only the video that explains nothing is short.

> This channel builds 15-second videos. The reference videos spend 40 to 70
> seconds on one idea and explain it fully.

## The hook is a statement, never a question

Not one of the five opens with a question. Each opens with a claim the viewer
has a stake in:

- **«تو تنبل نیستی — فقط نمی‌دانی چطور درس بخوانی.»** Takes the blame off the
  viewer and puts it on a method. The relief is the hook.
- **«مایکروسافت افشا کرد کدام شغل‌ها را AI می‌گیرد — شاید شغل شما باشد.»** A
  threat, made personal in the same breath.
- **«چین مدلی معرفی کرد که GPT-5.6 و Claude را در برنامه‌نویسی شکست داد.»** A
  fight between names the viewer knows.
- **«افراد دو دسته‌اند…»** Sorts the audience so every viewer waits to hear
  which one they are.

The pattern underneath all four: **the first sentence is about the viewer, and
it is not neutral.** It accuses, relieves, threatens, or sorts.

## The call to action is a word in the comments

Every video ends the same way:

> «در کامنت کلمهٔ [نوت‌بوک / کیتری] را بنویس تا لینکش را برایت بفرستم.»

This is the engine. It is not "like and follow" — it trades something the viewer
wants for a comment, and comments are what push a video. The two videos that do
not gate a link ask for an opinion instead: «نظرتان را حتماً بگویید».

> This channel asks for nothing. That is the cheapest gap on this page to close.

## What they talk about

Three subjects, over and over:

1. **A free tool that does something hard** — NotebookLM turning a PDF into a
   podcast, seven free design apps.
2. **AI news with a name in it** — Kimi K2 beating GPT, a Microsoft report.
3. **A threat to the viewer's work or study** — which jobs go by 2035.

No lifestyle, no motivation, no opinion pieces. Every video hands over something
usable or something the viewer needs to know about.

## The delivery

Heavy colloquial Dari throughout — «می‌تانه», «بخانی», «کنین», «بگویم». Nothing
is read in written formality. Measured pitch range 12.8 to 19.1 semitones: these
are lively readings, and that measurement is what `lib/prosody.py` tunes the
narration against. See `VOICE-LOG.md`.

---

## What this channel could change without changing what it is

Ordered by how cheap they are.

1. **Ask for something at the end.** A word in the comments, in exchange for the
   link or the list. Costs one line of narration.
2. **Open with a claim, not a question.** The hook rule here already forbids the
   hook answering itself; this goes further — no question at all.
3. **Let a video run as long as the idea needs.** 40 to 60 seconds for one tool
   explained properly, rather than 15 seconds of headlines.
4. **Real footage on top.** The real-imagery ladder already exists in this
   pipeline. The reference videos show it carrying half the screen, not sitting
   in a corner.

A presenter's face is the one thing on this page the pipeline cannot produce.
Everything else is reachable.
