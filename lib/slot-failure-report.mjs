// What the owner is told when a slot gives up after all 6 topics.
//
// The bug this replaces, measured 2026-09-13: the alert named only the LAST
// attempt's reason and picked its advice line from that one error's `kind`.
// Reproduced offline against the real registry and the real Visual Truth Gate
// for that day's tiktok lane — six candidates, and they did NOT fail for one
// reason:
//
//   retention-graph       dedupe UNIQUE (19)   → Visual QC
//   pin-comment           dedupe DUPLICATE     → (also Visual QC)
//   view-jail             dedupe DUPLICATE
//   tiktok-pay            dedupe DUPLICATE
//   green-screen          dedupe UNIQUE (29)   → Visual QC
//   tt-story-highlights   dedupe UNIQUE (22)   → Visual QC
//
// Half the lane was UNIQUE subject matter blocked only by a missing real
// screenshot. Because the final attempt happened to be a duplicate, the owner
// was told «این موضوع اخیراً یک‌بار ساخته شده» — advice about content
// repetition — while the actually actionable request (send a screenshot for
// these specific topics) was suppressed. They cannot act on what they are not
// shown, and the two causes need opposite responses: a duplicate needs a new
// subject, a Visual QC miss needs one photo.
//
// This changes the MESSAGE only. Nothing here decides whether a pack ships:
// assertVisualProof() and the duplicate check reject exactly what they
// rejected before, and a missing photo still stops the video.

// Counts and slide numbers are Persian prose, so they take Persian digits —
// fa_lint.py flags Latin ones, and the pipeline's other owner-facing strings
// already read this way. Pack ids stay Latin on purpose: the owner has to type
// one back verbatim as a photo caption for save-user-photo.mjs to match it.
const fa = (n) => String(n).replace(/[0-9]/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[Number(d)]);

/**
 * @param {Array<{id: string, kind?: string, missingSlides?: Array<{n: number, text: string}>}>} failures
 *   One entry per attempt, in the order they were tried.
 * @returns {string} the advice block appended under "آخرین علت".
 */
export function summariseSlotFailure(failures) {
  const list = Array.isArray(failures) ? failures.filter(Boolean) : [];
  if (!list.length) return "خطای فنی در ساخت یا ارسال.";

  const visual = list.filter((f) => f.kind === "visualQc");
  const duplicate = list.filter((f) => f.kind === "duplicate");
  const shortage = list.filter((f) => f.kind === "providerShortage");
  const other = list.filter((f) => !["visualQc", "duplicate", "providerShortage"].includes(f.kind));

  const parts = [];

  // First, and on its own line: a paid provider out of credit or over quota
  // stops every topic and every slot equally, and no screenshot or new subject
  // clears it. Measured 2026-09-13 — MiniMax TTS reported "insufficient
  // credit" and took 4 of that run's 12 attempts across both platforms, while
  // the alert called them generic technical errors and the owner was left
  // looking at content.
  if (shortage.length) {
    const reason = shortage.find((f) => f.providerShortage)?.providerShortage;
    parts.push(`⛔ سرویس بیرونی اعتبار یا سهمیه ندارد؛ تا شارژ نشود هیچ موضوعی ساخته نمی‌شود${reason ? `:\n${reason}` : "."}`);
  }

  // Lead with the breakdown so a mixed run can never read as one cause.
  if (list.length > 1) {
    const counts = [
      visual.length ? `${fa(visual.length)} مورد عکس واقعی نداشت` : null,
      duplicate.length ? `${fa(duplicate.length)} مورد تکراری بود` : null,
      shortage.length ? `${fa(shortage.length)} مورد به سقف اعتبار سرویس خورد` : null,
      other.length ? `${fa(other.length)} مورد خطای فنی داد` : null,
    ].filter(Boolean);
    parts.push(`از ${fa(list.length)} موضوع امتحان‌شده: ${counts.join("، ")}.`);
  }

  // The screenshot request is the only line the owner can act on immediately,
  // so it is never dropped just because a later attempt failed differently.
  if (visual.length) {
    parts.push("این موضوع‌ها فقط عکس واقعیِ همان قابلیت را کم دارند:");
    for (const f of visual) {
      const slides = (f.missingSlides || []).map((s) => `  مرحلهٔ ${fa(s.n)}: ${s.text}`).join("\n");
      parts.push(`• «${f.id}»${slides ? `\n${slides}` : ""}`);
    }
    parts.push(
      "برای هرکدام یک اسکرین‌شات واقعی از همان صفحه در اپ بگیر و همینجا به‌صورت عکس (نه فایل) بفرست؛ "
      + "کپشن عکس را دقیقاً همان شناسه بگذار. رندر بعدی خودکار از آن استفاده می‌کند.",
    );
  }

  if (duplicate.length && !visual.length) parts.push("این موضوع‌ها اخیراً ساخته شده‌اند.");
  else if (duplicate.length) parts.push(`${fa(duplicate.length)} موضوع دیگر اخیراً ساخته شده بود و به موضوع تازه نیاز دارد.`);

  if (other.length && !visual.length && !duplicate.length && !shortage.length) parts.push("خطای فنی در ساخت یا ارسال.");

  return parts.join("\n");
}
