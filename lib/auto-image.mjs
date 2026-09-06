// Finds one real, relevant image for a topic that arrived as plain text with
// no attached photo/video and no hand-mapped preset (custom-content.mjs's
// `visualPreset`). Rule 15 removed the "wait for approval" step that used to
// let a human eyeball fetch-screens.mjs's candidates before one was wired in
// — this does the same search-and-verify job without a human in the loop, so
// a bare "این متن را ویدیو کن" doesn't have to be rejected just because no
// picture was attached to the same message.
//
// Two independent checks gate a candidate before it is trusted:
//   1. mechanical — a real image file (media-guard.mjs), 1080px/700k-pixel
//      floor, same bar every other real asset in this project already meets.
//   2. relevance — an LLM reads the topic against the candidate's own page
//      title/URL/snippet and says whether it plausibly documents the same
//      thing. This is the check fetch-screens.mjs used to leave to a human,
//      because a real, officially-published image can still be completely
//      unrelated (its own comment: an "Edits sound separation" search once
//      resolved to an Android promo photo of someone's face).
// A candidate must pass both before it is used; the first one that does
// wins. Nothing here invents or draws an image — only ever a real download.
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { imageType, imageSize } from "./media-guard.mjs";

const EXA_KEY = process.env.EXA_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

async function exaSearch(query) {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": EXA_KEY },
    body: JSON.stringify({
      query, numResults: 8, type: "auto",
      contents: { text: { maxCharacters: 300 } },
    }),
  });
  if (!res.ok) throw new Error(`Exa ${res.status}`);
  const seen = new Set();
  return ((await res.json()).results || [])
    .filter((r) => r.image && !seen.has(r.image) && seen.add(r.image));
}

function relevancePrompt(topic, points, candidate) {
  return `موضوع ویدیو: «${topic}»
نکته‌های ویدیو: ${points.slice(0, 4).map((p) => `«${p}»`).join("، ") || "(بدون نکتهٔ اضافه)"}
یک صفحهٔ وب با این مشخصات پیدا شده:
عنوان صفحه: «${candidate.title}»
آدرس: ${candidate.url}
خلاصهٔ صفحه: «${candidate.snippet}»
آیا محتمل است تصویر همین صفحه واقعاً همان موضوع/اپ/قابلیت را نشان بدهد — نه یک عکس عمومی، آیکن تنها، یا موضوعی کاملاً نامرتبط؟ فقط یک JSON با همین دو کلید بده، بدون هیچ متن دیگر: {"relevant": true یا false, "reason": "دلیل خیلی کوتاه فارسی"}`;
}

function parseVerdict(raw) {
  try {
    const match = String(raw || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    const value = JSON.parse(match[0]);
    return typeof value?.relevant === "boolean" ? value : null;
  } catch { return null; }
}

async function askGemini(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const body = await res.json();
  return body?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join("") || "";
}

async function askGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You judge image-page relevance for a Persian video project. Respond with a single JSON object: {\"relevant\": true|false, \"reason\": \"...\"}. No other text." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const body = await res.json();
  return body?.choices?.[0]?.message?.content || "";
}

async function isRelevant(topic, points, candidate) {
  const prompt = relevancePrompt(topic, points, candidate);
  if (GEMINI_KEY) {
    try {
      const verdict = parseVerdict(await askGemini(prompt));
      if (verdict) return verdict.relevant;
    } catch { /* fall through to Groq */ }
  }
  if (GROQ_KEY) {
    try {
      const verdict = parseVerdict(await askGroq(prompt));
      if (verdict) return verdict.relevant;
    } catch { /* no provider answered */ }
  }
  // Neither model gave a usable verdict — a real image with no relevance
  // confirmation is exactly the failure mode this file exists to prevent,
  // so treat "couldn't judge" the same as "not relevant".
  return false;
}

/**
 * @param {string} topic
 * @param {string[]} points
 * @returns {Promise<{photo:string, sourceUrl:string, sourceType:string, alt:string}|null>}
 */
export async function findRealImage(topic, points = []) {
  if (!EXA_KEY || (!GEMINI_KEY && !GROQ_KEY)) return null;
  let hits = [];
  try {
    hits = await exaSearch(`${topic} official screenshot OR interface OR product page OR press photo`);
  } catch {
    return null;
  }
  mkdirSync("public/user-media", { recursive: true });
  for (const hit of hits.slice(0, 6)) {
    let bytes;
    try {
      const res = await fetch(hit.image);
      if (!res.ok) continue;
      bytes = Buffer.from(await res.arrayBuffer());
    } catch { continue; }

    const id = createHash("sha256").update(hit.image).digest("hex").slice(0, 12);
    const rawFile = `public/user-media/auto-${id}.img`;
    writeFileSync(rawFile, bytes);
    const type = imageType(rawFile);
    if (!type) continue;
    const named = rawFile.replace(/\.img$/, `.${type === "jpeg" ? "jpg" : type}`);
    writeFileSync(named, bytes);

    const size = imageSize(named);
    if (!size || Math.max(size.width, size.height) < 1080 || size.width * size.height < 700000) continue;

    const candidate = { title: String(hit.title || "").slice(0, 160), url: hit.url, snippet: String(hit.text || "").slice(0, 260) };
    let relevant = false;
    try { relevant = await isRelevant(topic, points, candidate); } catch { relevant = false; }
    if (!relevant) continue;

    return { photo: named, sourceUrl: hit.url, sourceType: "labelled-explainer", alt: candidate.title || topic };
  }
  return null;
}
