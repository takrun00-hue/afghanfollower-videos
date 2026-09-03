# Visual Truth Gate — GapMedia

This gate is mandatory for every tutorial, app, update, and news video. It
exists to prevent generic AI illustrations, unrelated icons, and repeated card
layouts from reaching a render.

## 1. Evidence before design

Every slide must have one `visualEvidence` record before HTML is written:

```json
{
  "slide": 2,
  "claim": "Creator Search Insights shows topics people search for",
  "mainVisual": "public/official-ui/tiktok-search-single.png",
  "sourceUrl": "https://newsroom.tiktok.com/creator-search-insights?lang=en",
  "sourceType": "official-ui",
  "whatItProves": "The actual Creator Search Insights interface",
  "motionAction": "search field receives the query, then the result locks"
}
```

No evidence record means no render. A generic microphone, glowing AI orb,
cartoon mascot, random hand, generic chart, or platform-coloured decoration is
**not** evidence. The main visual must occupy at least 34% of the vertical
frame, have a usable source resolution (long edge at least 1080px and at least
700,000 pixels), and remain readable on a phone without zooming.

## 2. Source hierarchy

Use the highest available item in this order:

1. Official product UI, official help centre, official newsroom, or official
   press asset that shows the exact feature.
2. A supplied real screen-recording or screenshot from the channel owner.
3. A clearly labelled original diagram made only to explain a verified claim.

Never use a logo-only image, generic creators banner, unrelated real UI,
duplicate image, search-result thumbnail, or an invented mobile interface as
proof of a feature. If the exact screen cannot be verified, remove the
instructional step or hold the video for research; do not invent the visual.

## 3. Slide-to-meaning contract

Each slide has exactly one action, one main visual, and one visual verb.

| Copy says | Main visual must show | Forbidden substitute |
| --- | --- | --- |
| Search | real search surface and entered query | magnifying-glass decoration |
| Save | recognisable bookmark control | circle, star, heart, or folder |
| Upload | selected media / upload state | camera unrelated to the action |
| Analytics | actual retention/insights evidence or labelled explanatory chart | decorative rising line |
| Security restriction | access boundary / verified notice / labelled diagram | microphone, lock without context, AI orb |
| Income | verified eligibility, dashboard, or honest creator workflow | money rain, unsupported earnings figure |

The image must still explain the sentence if all on-screen text is hidden.

## 4. Hook rule

The hook gets a custom visual from the hook's promise, not the app name or a
recycled feature card. It must show a believable situation, tension, result,
or consequence without revealing the answer. The app/product name, logo and
exact UI appear only after the curiosity gap.

## 5. Platform distinction

TikTok and Instagram can never be the same storyboard with a recoloured
background. For the same researched subject they require different:

- audience promise;
- hook image;
- visual metaphor;
- scene order;
- transition family; and
- music rhythm.

## 6. Motion acceptance

Every slide documents one primary action, one secondary reaction, and one
subtle ambient layer. The primary action must be the action in the sentence:
search types, a bookmark saves, a graph drops, an access boundary closes.
Card-only entrances, opacity-only fades, random whip cuts, and continuous
floating without narrative meaning fail this gate.

## 7. Pre-send review

Before Telegram delivery, inspect early, middle and late frames and answer
every line with YES:

1. Does every slide have a real or explicitly labelled explanatory visual?
2. Does that visual prove the exact sentence on the slide?
3. Is any visual reused in another slide without a new meaning?
4. Is there only one readable app screen per slide?
5. Does the hook image match the hook rather than merely the category?
6. Are TikTok and Instagram visually different beyond colour?
7. Does movement demonstrate the action rather than decorate it?

Any NO blocks delivery. Record the failed slide and replace its evidence; never
hide the failure by recolouring or adding another icon.

## 8. Release score and automatic publishing

Score every proposed video before rendering: audience demand and practical
benefit 25, source accuracy 20, hook 15, real visual evidence 15, readable
motion 10, narration 10, and novelty 5. Minimum score is 90/100. A failed
source, visual-evidence, narration, or duplicate check is an automatic fail
regardless of score. A pass renders and sends automatically; a fail reports the
specific missing evidence or weak criterion instead of asking for approval.

## 9. Performance learning loop

Once per day, review each public TikTok/Instagram URL that can be read without
login: views, likes, comments, shares/saves only when publicly visible, hook
clarity, cover, and comments. Record observed facts, date and URL; never infer
income from views. Revenue, retention, saves, shares and reach require official
Insights/Analytics supplied by the owner or authorised API access. Use the
comparison only to choose the next hypothesis; do not copy a previous layout.
