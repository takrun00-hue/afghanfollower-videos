// Persian translation for live-search results, shared by every script that
// sends an English source to Telegram (topic-plan.mjs's «جستجوی جدید»,
// content-search.mjs's daily discovery). One implementation, so a fix to the
// prompt or the failure behaviour reaches both instead of drifting apart.
//
// Deliberately narrow: it translates, it does not draft, add claims or invent
// numbers — the prompt says so explicitly, and a caller that needs copywriting
// (a hook, steps) is a different job with its own grounding, not this one.
const defaultGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

function needsPersian(text) {
  const letters = String(text || "").match(/[\p{L}]/gu) || [];
  if (!letters.length) return false;
  const persian = letters.filter((ch) => /[؀-ۿ]/.test(ch)).length;
  return persian / letters.length < 0.55;
}

const clean = (value, max) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

// items: [{title, text}]  ->  same shape, translated in place, plus
// originalTitle/originalExcerpt so the real source wording stays checkable.
//
// Throws when translation was needed and could not be done — rule 7 requires
// Persian text before anything reaches Telegram, so shipping the untranslated
// English silently is not an acceptable fallback; the caller decides what to
// tell the operator (topic-plan.mjs and content-search.mjs both already have
// their own "ترجمه آماده نشد" message for this).
export async function translateToPersian(items, {
  geminiKey = defaultGeminiKey,
  // gemini-2.5-flash is retired for new users — confirmed live, 2026-09-03:
  // the API's own 404 names gemini-3.6-flash as the replacement.
  geminiModel = process.env.GEMINI_MODEL || "gemini-3.6-flash",
} = {}) {
  const targets = items.map((item, index) => ({
    index,
    title: String(item.title || "").slice(0, 180),
    excerpt: String(item.text || "").replace(/\s+/g, " ").slice(0, 520),
  })).filter((item) => needsPersian(`${item.title} ${item.excerpt}`));
  if (!targets.length) return items;
  if (!geminiKey) throw new Error("کلید GEMINI_API_KEY برای برگردان فارسی تنظیم نشده است.");

  const prompt = [
    "Translate live research results for a Persian-language creator workflow.",
    "Return ONLY a JSON array. Each item must be {index,title,excerpt}.",
    "Translate faithfully into natural Persian (Farsi). Do not add claims, facts, prices, or advice.",
    "Keep product, company, app, feature, and website names in their established English spelling.",
    "Keep the title concise and the excerpt factual. Do not include markdown or URLs.",
    "Results:", JSON.stringify(targets),
  ].join("\n");
  try {
    const call = () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": geminiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1400, responseMimeType: "application/json" },
      }),
    });
    // gemini-3.6-flash returns a plain 503 "high demand" on a real fraction of
    // calls (confirmed live, 2026-09-03) — transient, worth one retry before
    // giving up and telling the operator translation genuinely failed.
    let response = await call();
    for (let i = 0; !response.ok && (response.status === 503 || response.status === 429) && i < 2; i++) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      response = await call();
    }
    if (!response.ok) throw new Error(`Gemini ${response.status}`);
    const body = await response.json();
    const raw = body?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") || "";
    const json = raw.match(/\[[\s\S]*\]/)?.[0] || raw;
    const translated = JSON.parse(json);
    const byIndex = new Map(translated.map((item) => [Number(item.index), item]));
    return items.map((item, index) => {
      const fa = byIndex.get(index);
      if (!fa) return item;
      return {
        ...item,
        originalTitle: String(item.title || ""),
        originalExcerpt: String(item.text || ""),
        title: clean(fa.title, 180) || item.title,
        text: clean(fa.excerpt, 520) || item.text,
      };
    });
  } catch {
    throw new Error("ترجمهٔ فارسیِ منبع انجام نشد؛ نتیجهٔ غیر فارسی ارسال نشد.");
  }
}

export { needsPersian };
