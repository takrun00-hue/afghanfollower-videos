// Real-time Telegram gateway. Hosting is free on Cloudflare Workers; secrets
// are entered with `wrangler secret put`, never placed in this repository.

const TG = "https://api.telegram.org";
const MAX_HISTORY = 8;

const HELP = `🤖 <b>منوی شماره‌دار GapMedia و German Insider</b>

🎬 <b>آموزشی</b>
<b>۱</b> موضوع تیک‌تاک
<b>۲</b> موضوع اینستاگرام
<b>۳</b> موضوع اپ‌ها و هوش مصنوعی
<b>۴</b> موضوع‌های امروز
<b>۵</b> جستجوی زندهٔ محتوا
<b>۶</b> تحلیل موضوع آماده و پیش‌نویس ویدیو
<b>۷</b> ادیت قلاب آموزشی
<b>۸</b> ادیت اسلایدهای آموزشی
<b>۲۶</b> تقاضای واقعی مردم برای یک موضوع
<b>۹</b> فهرست صداها
<b>۱۰</b> ساخت محتوای تأییدشده با صدا

📰 <b>German Insider</b>
<b>۱۱</b> جستجوی خبر تازه
<b>۱۲</b> خبرهای آلمان
<b>۱۳</b> خبرهای اروپا
<b>۱۴</b> جستجوی زندهٔ خبر
<b>۱۵</b> خبر از متن شما
<b>۱۶</b> ادیت قلاب خبر
<b>۱۷</b> ادیت متن خبر
<b>۱۸</b> ساخت خبر تأییدشده با صدا
<b>۲۲</b> خبرهای امل برلین
<b>۲۳</b> خبرهای امل هامبورگ
<b>۲۴</b> خبرهای امل فرانکفورت
<b>۲۵</b> خبرهای امل فارسی

⚙️ <b>مدیریت</b>
<b>۱۹</b> وضعیت
<b>۲۰</b> حذف ۳ ویدیوی آموزشی آخر
<b>۲۱</b> حذف آخرین ویدیوی خبری
<b>۰</b> نمایش دوبارهٔ این منو

فقط شماره را بفرستید. در گزینه‌های متن و ادیت، بات در پیام بعد متن موردنیاز را از شما می‌خواهد.`;

const NUMBERED_ACTIONS = {
  "1": { action: "plan-tiktok" }, "2": { action: "plan-instagram" }, "3": { action: "plan-tools" },
  "4": { action: "plan-today" }, "5": { pending: "content-search-live", ask: "🔎 عبارت جستجوی محتوا را بفرستید؛ مثلاً: درآمد از تیک‌تاک" },
  "6": { pending: "content-topic-preview", ask: "📝 موضوع آماده را بفرستید؛ بات قلاب و گام‌ها را تحلیل می‌کند و پیش‌نویس می‌فرستد." },
  "7": { pending: "content-edit-hook", ask: "✏️ متن تازهٔ قلاب آموزشی را بفرستید." },
  "8": { pending: "content-edit-steps", ask: "✏️ اسلایدهای تازه را با | جدا کنید: گام ۱ | گام ۲ | گام ۳" },
  "26": { pending: "demand-research", ask: "🔎 موضوع را بفرستید تا ببینم مردم واقعاً چه چیزی درباره‌اش سرچ می‌کنند." },
  "9": { action: "voice-list" }, "10": { action: "content-approve", voiceMode: "on" },
  "11": { action: "news-scan" }, "12": { action: "news-germany" }, "13": { action: "news-europe" },
  "14": { pending: "news-search-live", ask: "🔎 عبارت جستجوی خبر را بفرستید؛ مثلاً: قوانین اقامت آلمان" },
  "15": { pending: "news-text-preview", ask: "📝 متن خبر را بفرستید: تیتر | جمله ۱ | جمله ۲ | جمله ۳" },
  "16": { pending: "news-edit-hook", ask: "✏️ تیتر تازهٔ خبر را بفرستید." },
  "17": { pending: "news-edit-text", ask: "✏️ متن تازهٔ خبر را با | جدا کنید." },
  "18": { action: "news-approve-draft", voiceMode: "on" }, "19": { action: "status" },
  "20": { action: "undo" }, "21": { action: "undo-news" },
  "22": { action: "amal-berlin" }, "23": { action: "amal-hamburg" },
  "24": { action: "amal-frankfurt" }, "25": { action: "amal-farsi" },
};

function normalize(value = "") {
  return String(value).trim().replace(/^\//, "").replace(/‌/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function audioFor(text) {
  const raw = String(text || "");
  if (/بدون\s*صدا|بی\s*صدا|mute/i.test(raw)) return { voiceMode: "off", voiceId: "" };
  const named = raw.match(/(?:با\s*صدا|صدا)\s*[:：]\s*([A-Za-z0-9_.-]+)/i);
  if (named) return { voiceMode: "on", voiceId: named[1] };
  // The verified Persian voice currently configured for this project.
  if (/صدای?\s*زن|زنانه|female/i.test(raw)) return { voiceMode: "on", voiceId: "Persian_female_1_v1" };
  return { voiceMode: "on", voiceId: "" };
}

function videoAction(text) {
  const c = normalize(text);
  const any = (...words) => words.some((word) => c.includes(word));
  const audio = audioFor(text);
  const withAudio = (action) => ({ action, ...audio });
  if (any("راهنما", "دستورها", "دستورات", "کمک", "help", "start")) return { action: "help" };
  if (/^(وضعیت|status)$/.test(c)) return { action: "status" };
  if (any("پاک کن", "حذف کن", "پاکش کن", "delete", "undo")) return { action: any("خبر", "اخبار", "news") ? "undo-news" : "undo" };
  if (any("صداها", "صدا minimax", "minimax voice", "voice list")) return { action: "voice-list" };
  if (/^(?:ادیت|ویرایش)\s*قلاب\s*خبر\s*[:：]/i.test(c)) return { action: "news-edit-hook", payload: cleanEdit(text, "قلاب\\s*خبر") };
  if (/^(?:ادیت|ویرایش)\s*(?:متن|محتوا)\s*خبر\s*[:：]/i.test(c)) return { action: "news-edit-text", payload: cleanEdit(text, "(?:متن|محتوا)\\s*خبر") };
  // Accept the exact approval command both on its own and with an explicit
  // audio phrase.  It must never fall through to the conversational AI.
  if (/^(?:تأیید|تایید)\s*خبر(?:\s*(?:با\s*صدا|بدون\s*صدا|بی\s*صدا))?$/i.test(c)) return withAudio("news-approve-draft");
  if (/^(?:ادیت|ویرایش)\s*قلاب\s*[:：]/i.test(c)) return { action: "content-edit-hook", payload: cleanEdit(text, "قلاب") };
  if (/^(?:ادیت|ویرایش)\s*(?:متن|محتوا|اسلاید)\s*[:：]/i.test(c)) return { action: "content-edit-steps", payload: cleanEdit(text, "(?:متن|محتوا|اسلاید)") };
  if (/^(?:تأیید|تایید)\s*(?:محتوا|ویدیو|پیش\s*نویس)$/i.test(c)) return withAudio("content-approve");
  if (/^(?:پیش\s*نویس|نمایش محتوا|دیدن محتوا)$/i.test(c)) return { action: "content-preview" };
  if (/^(?:محتوا|ویدیو|ساخت محتوا|custom content)\s*[:：]/i.test(c)) {
    const payload = cleanContent(text);
    return payload.split("|").filter(Boolean).length >= 2
      ? { action: "custom-content", payload, ...audio }
      : { action: "custom-help" };
  }
  if (/^(?:تقاضا|سرچ مردم|دیماند)\s*[:：]/i.test(c)) {
    const payload = String(text).replace(/^\s*(?:تقاضا|سرچ مردم|دیماند)\s*[:：]\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 120);
    return payload ? { action: "demand-research", payload } : null;
  }
  if (/^(?:موضوع آماده|ایده آماده|ایده)\s*[:：]/i.test(c)) {
    const payload = String(text).replace(/^\s*(?:موضوع آماده|ایده آماده|ایده)\s*[:：]\s*/i, "").replace(/[\r\n]+/g, " ").trim().slice(0, 900);
    return payload ? { action: "content-topic-preview", payload, ...audio } : null;
  }
  // Refusing a topic, before the rule that selects one — «رد موضوع ۲» would
  // otherwise be read as «موضوع ۲» and build the thing the operator rejected.
  if (/^(?:رد|حذف|نمی‌خواهم|نمیخواهم)\s*(?:موضوع)?\s*[۰-۹0-9]+\s*$/i.test(c)) return { action: "topic-reject", pick: digits(c) };
  if (/^(?:رد|حذف)\s*(?:موضوع)?\s+[a-z0-9-]+$/i.test(c)) return { action: "topic-reject", payload: c.replace(/^(?:رد|حذف)\s*(?:موضوع)?\s+/i, "").trim() };
  if (/^(?:برگردان|بازگردان)\s+[a-z0-9-]+$/i.test(c)) return { action: "topic-unreject", payload: c.replace(/^(?:برگردان|بازگردان)\s+/i, "").trim() };
  if (/^(?:رد‌شده|رد شده|فهرست رد|موضوع.?های رد)/i.test(c)) return { action: "topic-rejected-list" };
  if (/^(?:انتخاب|موضوع|تأیید موضوع|تاييد موضوع)\s*[۰-۹0-9]+(?:\s|$)/i.test(c)) return { action: "topic-pick", pick: digits(c), ...audio };
  if (/^(تایید|تأیید|approve)\s+(?=[a-z0-9-]*[a-z])[a-z0-9-]+$/i.test(c)) return { action: "approved-feature", payload: c };
  if (/^(بساز|تایید|تأیید|ok|build)\s*[۰-۹0-9]+$/.test(c)) return { action: "news-approve", pick: digits(c) };
  if (any("تغییر موضوع امروز", "موضوع امروز تغییر", "ایده تازه امروز")) return { action: "plan-today" };
  if (any("تغییر موضوع فردا", "موضوع فردا تغییر", "ایده تازه فردا")) return { action: "plan-tomorrow" };
  if (any("برنامه هفته", "موضوعات هفته")) return { action: "plan-week" };
  if (any("موضوع فردا", "برنامه فردا")) return { action: "plan-tomorrow" };
  if (/^(?:جستجوی جدید خبر|جستجو جدید خبر|جستجوی خبر|جستجو خبر)(?:\s*[:：]\s*|\s+).+/i.test(c)) {
    const payload = String(text).replace(/^\s*(?:جستجوی جدید خبر|جستجو جدید خبر|جستجوی خبر|جستجو خبر)(?:\s*[:：]\s*|\s+)/i, "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);
    return payload ? { action: "news-search-live", payload } : { action: "news-scan" };
  }
  if (/^(?:جستجوی جدید|جستجو جدید|جستجوی محتوا|جستجو محتوا|جستجو)\s*[:：]\s*.+/i.test(c)) {
    const payload = String(text).replace(/^\s*(?:جستجوی جدید|جستجو جدید|جستجوی محتوا|جستجو محتوا|جستجو)\s*[:：]\s*/i, "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);
    return payload ? { action: "content-search-live", payload } : { action: "content-search" };
  }
  if (any("جستجوی محتوا", "جستجو محتوا", "ایده محتوا", "ترند محتوا", "موضوع بیشتر")) return { action: "content-search" };
  if (any("تحقیق", "اپدیت", "آپدیت", "قابلیت تازه", "research")) return { action: "research" };
  if (any("امل برلین", "امال برلین", "amal berlin")) return { action: "amal-berlin" };
  if (any("امل هامبورگ", "امال هامبورگ", "amal hamburg")) return { action: "amal-hamburg" };
  if (any("امل فرانکفورت", "امال فرانکفورت", "amal frankfurt")) return { action: "amal-frankfurt" };
  if (any("امل فارسی", "امال فارسی", "amal farsi")) return { action: "amal-farsi" };
  if (/^(خبر|اخبار|جستجو(?:ی)?\s+(?:خبر|اخبار)|scan news)$/.test(c)) return { action: "news-scan" };
  if (/^(خبر|news)\s*[:：]/.test(c)) return { action: "news-text-preview", payload: cleanNews(text) };
  if (/^(خبر|news)\s*[۰-۹0-9]+$/.test(c)) return { action: "news-pick-preview", pick: digits(c) };
  if (/^(اروپا|europe)\s*[۰-۹0-9]+$/.test(c)) return { action: "europe-pick-preview", pick: digits(c) };
  if (any("خبر اروپا", "اروپا", "europe")) return { action: "news-europe" };
  if (any("خبر روز", "خبر امروز", "اخبار روز", "news today")) return { action: "news-today" };
  if (any("خبر آلمان", "آلمان", "germany")) return { action: "news-germany" };
  if (any("خبر فوری", "فوری", "breaking")) return { action: "news-breaking-preview" };

  if (any("تیک تاک", "تیکتاک", "tiktok", "tik tok") && !any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "plan-tiktok" };
  if (any("انستا", "اینستا", "instagram", "insta") && !any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "plan-instagram" };
  if (any("ابزار", "هوش مصنوعی", " ai", "tool") && !any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "plan-tools" };
  // «بساز» is now an editorial request, not an immediate publish. The bot
  // first sends hook and slide copy so the creator can edit or approve it.
  if (any("تیک تاک", "تیکتاک", "tiktok", "tik tok") && any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "plan-tiktok" };
  if (any("انستا", "اینستا", "instagram", "insta") && any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "plan-instagram" };
  if (any("ابزار", "هوش مصنوعی", " ai", "tool") && any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "plan-tools" };
  if (/^(فردا|برای فردا|فردا بساز)$/.test(c)) return { action: "build-tomorrow" };
  if (/^(بفرست|ارسال کن|send)$/.test(c)) return { action: "resend" };
  if (/^(بساز|ساخت همه|هر سه|make|build)(?:\s|$)/.test(c)) return { action: "plan-tomorrow" };
  return null;
}

function digits(text) {
  const value = String(text).replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  return String(Math.max(1, Math.min(9, Number(value) || 1)));
}

function cleanNews(text) {
  return String(text).replace(/^\s*(?:خبر|news)\s*[:：]\s*/i, "").replace(/[\r\n]+/g, " ").trim().slice(0, 900);
}

function cleanContent(text) {
  return String(text)
    .replace(/^\s*(?:محتوا|ویدیو|ساخت محتوا|custom content)\s*[:：]\s*/i, "")
    .replace(/[\r\n]+/g, " ").trim().slice(0, 900);
}

function cleanEdit(text, label) {
  const re = new RegExp(`^\\s*(?:ادیت|ویرایش)\\s*${label}\\s*[:：]\\s*`, "i");
  return String(text).replace(re, "").replace(/[\r\n]+/g, " ").trim().slice(0, 760);
}

async function telegram(env, method, body) {
  const response = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Telegram ${method} failed: ${response.status}`);
  return response.json();
}

async function reply(env, chatId, text) {
  return telegram(env, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true });
}

async function dispatchWorkflow(env, command) {
  if (!env.GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN");
  const owner = env.GITHUB_OWNER || "takrun00-hue";
  const repo = env.GITHUB_REPO || "afghanfollower-videos";
  const workflow = env.GITHUB_WORKFLOW || "telegram.yml";
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "GapMedia-Telegram-Worker",
      "content-type": "application/json",
    },
    body: JSON.stringify({ ref: "main", inputs: { action: command.action, pick: command.pick || "1", payload: command.payload || "", voice_id: command.voiceId || "", voice_mode: command.voiceMode || "on" } }),
  });
  if (!response.ok) throw new Error(`GitHub dispatch failed: ${response.status}`);
}

async function history(env, chatId) {
  if (!env.CHAT_HISTORY) return [];
  const stored = await env.CHAT_HISTORY.get(`chat:${chatId}`, "json");
  return Array.isArray(stored) ? stored.slice(-MAX_HISTORY) : [];
}

async function saveHistory(env, chatId, messages) {
  if (env.CHAT_HISTORY) await env.CHAT_HISTORY.put(`chat:${chatId}`, JSON.stringify(messages.slice(-MAX_HISTORY)), { expirationTtl: 7 * 24 * 60 * 60 });
}

function menuCode(text) {
  const code = String(text || "").trim().replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  return code === "0" || Object.hasOwn(NUMBERED_ACTIONS, code) ? code : null;
}

async function pendingFor(env, chatId) {
  if (!env.BOT_STATE) return null;
  return env.BOT_STATE.get(`pending:${chatId}`, "json");
}

async function setPending(env, chatId, action) {
  if (env.BOT_STATE) await env.BOT_STATE.put(`pending:${chatId}`, JSON.stringify({ action }), { expirationTtl: 15 * 60 });
}

async function clearPending(env, chatId) {
  if (env.BOT_STATE) await env.BOT_STATE.delete(`pending:${chatId}`);
}

// A numbered «منبع ۲» must refer to the last search the creator ran, not to a
// vague global command. The queue itself lives in Actions cache; this tiny KV
// marker only tells the worker whether to open the content or news queue.
async function selectionFor(env, chatId) {
  if (!env.BOT_STATE) return null;
  return env.BOT_STATE.get(`selection:${chatId}`, "json");
}

async function setSelection(env, chatId, kind) {
  if (env.BOT_STATE) await env.BOT_STATE.put(`selection:${chatId}`, JSON.stringify({ kind }), { expirationTtl: 20 * 60 });
}

function commandFromPending(pending, text) {
  const payload = String(text || "").replace(/[\r\n]+/g, " ").trim().slice(0, 900);
  if (!payload) return null;
  if ((pending.action === "custom-content" || pending.action === "news-text-preview") && payload.split("|").filter(Boolean).length < 2) {
    return { error: "متن را با این قالب بفرستید: تیتر یا موضوع | جمله یا گام ۱ | جمله یا گام ۲ | جمله یا گام ۳" };
  }
  return { action: pending.action, payload, voiceMode: "on" };
}

// Safe local preparation: normalize Persian characters and turn a supplied
// topic or news item into an editable structure. It deliberately does not
// invent facts or send the creator's text to any third-party AI service.
function cleanPersian(value, max = 180) {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/\s+/g, " ").replace(/\s*([،؛؟.!])\s*/g, "$1 ").trim().slice(0, max);
}

function prepareNewsLocally(raw) {
  const parts = String(raw || "").split("|").map((x) => cleanPersian(x)).filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 5).join(" | ");
  const sentences = cleanPersian(raw, 850).split(/(?<=[.!؟])\s+/).map((x) => cleanPersian(x)).filter(Boolean);
  return [sentences.shift() || cleanPersian(raw, 110), ...sentences.slice(0, 4)].join(" | ");
}

function prepareTopicLocally(raw) {
  const topic = cleanPersian(raw, 180);
  return [
    topic,
    "فکر می‌کنید این نکته می‌تواند نتیجهٔ ویدیوی شما را بهتر کند؟",
    "اول هدف و مخاطب اصلی را روشن کنید",
    "یک نمونهٔ واقعی و قابل‌فهم نشان دهید",
    "نکتهٔ اصلی را کوتاه و مرحله‌به‌مرحله توضیح دهید",
    "نتیجه را با یک سؤال مرتبط جمع‌بندی کنید",
  ].join(" | ");
}

const SYSTEM = `تو دستیار فارسی/دری برند GapMedia هستی. کوتاه، صمیمی و دقیق جواب بده. درباره ویدیوهای آموزشی تیک‌تاک، اینستاگرام و اپ‌های هوش مصنوعی، و کانال خبری German Insider کمک کن. هیچ وعدهٔ درآمد، ویو یا وایرال‌شدن نده و چیزی را که واقعاً اجرا نشده «انجام شد» نگو. برای ساخت ویدیو از فرمان‌های روشن استفاده می‌شود؛ اگر کاربر دستور مبهم ویدیویی داد، بگو نمونه: «تیک‌تاک بساز»، «انستا بساز»، «ابزار بساز»، «خبر فوری»، یا «بساز». هرگز کلید، توکن یا اطلاعات محرمانه را درخواست یا نمایش نده. پاسخ نهایی را مستقیم، در حداکثر چهار خط، در فیلد پاسخ بنویس و از توضیحِ فرایند فکرکردن خودداری کن.`;

function textFromWorkersAI(data) {
  // Workers AI models have used both native `response` and OpenAI-compatible
  // response shapes. Accept either so an upstream format change never turns
  // a successful model call into an empty Telegram reply.
  if (typeof data === "string") return data.trim();
  const value = data?.response
    ?? data?.result?.response
    ?? data?.message?.content
    ?? data?.result?.message?.content
    ?? data?.choices?.[0]?.message?.content
    ?? data?.result?.choices?.[0]?.message?.content
    ?? data?.output_text
    ?? data?.result?.output_text
    ?? data?.text
    ?? data?.result?.text
    ?? data?.output?.text
    ?? data?.result?.output?.text
    ?? data?.output?.[0]?.text
    ?? data?.result?.output?.[0]?.text
    ?? data?.output?.[0]?.content?.[0]?.text;
  return typeof value === "string" ? value.trim() : "";
}

async function chat(env, chatId, userText) {
  if (!env.AI) throw new Error("Workers AI binding is unavailable");
  const prior = await history(env, chatId);
  const messages = [{ role: "system", content: SYSTEM }, ...prior, { role: "user", content: userText.slice(0, 2000) }];
  // Llama 4 Scout returns direct `response` text (unlike reasoning-first
  // models), which keeps short Telegram replies reliable on the Free plan.
  // MiniMax remains reserved for the video narration pipeline in GitHub Actions.
  const data = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
    messages,
    max_tokens: 420,
    temperature: 0.65,
  });
  const answer = textFromWorkersAI(data) || "فعلاً پاسخ آماده نشد؛ دوباره بنویسید.";
  await saveHistory(env, chatId, [...prior, { role: "user", content: userText.slice(0, 2000) }, { role: "assistant", content: answer }]);
  return answer;
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("GapMedia + German Insider Telegram worker", { status: 200 });
    if (env.TELEGRAM_WEBHOOK_SECRET && request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) return new Response("Unauthorized", { status: 401 });
    const update = await request.json().catch(() => null);
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) return new Response("ok");
    const chatId = String(message.chat.id);
    if (env.ALLOWED_CHAT_ID && chatId !== String(env.ALLOWED_CHAT_ID)) return new Response("ok");
    try {
      // A standalone number always belongs to the numbered menu.  For options
      // that need copy, KV keeps the selected operation for 15 minutes and the
      // next message becomes its payload instead of a vague AI chat reply.
      const code = menuCode(message.text);
      if (code === "0") {
        await clearPending(env, chatId);
        await reply(env, chatId, HELP);
        return new Response("ok");
      }
      const chosen = code ? NUMBERED_ACTIONS[code] : null;
      if (chosen?.pending) {
        await setPending(env, chatId, chosen.pending);
        await reply(env, chatId, chosen.ask);
        return new Response("ok");
      }
      let command = chosen ? { action: chosen.action, voiceMode: chosen.voiceMode || "on" } : null;
      if (!command) {
        const pending = await pendingFor(env, chatId);
        if (pending) {
          const next = commandFromPending(pending, message.text);
          if (next?.error) {
            await reply(env, chatId, `⚠️ ${next.error}`);
            return new Response("ok");
          }
          if (next) {
            await clearPending(env, chatId);
            command = next;
          }
        }
      }
      // A search result is always picked by its visible source number.  This
      // makes the flow identical for tutorial research and German Insider.
      if (!command) {
        const sourceMatch = normalize(message.text).match(/^(?:منبع|source)\s*([۰-۹0-9]+)$/i);
        if (sourceMatch) {
          const selected = await selectionFor(env, chatId);
          const pick = digits(sourceMatch[1]);
          if (selected?.kind === "content") command = { action: "content-source-pick", pick, voiceMode: "on" };
          else if (selected?.kind === "news") command = { action: "news-source-pick", pick, voiceMode: "on" };
          else {
            await reply(env, chatId, "ابتدا یک جستجو انجام دهید، سپس مثلاً <code>منبع ۲</code> را بفرستید.");
            return new Response("ok");
          }
        }
      }
      if (!command) command = videoAction(message.text);
      if (command) {
        if (command.action === "help") {
          await reply(env, chatId, HELP);
        } else if (command.action === "status") {
          await reply(env, chatId, "✅ بات آنلاین است. چت فوری و فرمان ساخت ویدیو فعال‌اند.");
        } else if (command.action === "custom-help") {
          await reply(env, chatId, "برای ساخت از متن خودت این‌طور بنویس:\n\n<code>محتوا: موضوع | نکتهٔ ۱ | نکتهٔ ۲ | نکتهٔ ۳ | نکتهٔ ۴</code>\n\nمثال: <code>محتوا: راه پیدا کردن موضوع ترند در TikTok | Search را باز کن | Creator Search Insights را بنویس | Content gap را بزن | از موضوعِ پرجستجو ویدیو بساز</code>");
        } else {
          if (command.action === "news-text-preview") command.payload = prepareNewsLocally(command.payload);
          if (command.action === "content-topic-preview") command.payload = prepareTopicLocally(command.payload);
          if (command.action === "content-search-live") await setSelection(env, chatId, "content");
          if (["news-scan", "news-search-live", "amal-berlin", "amal-hamburg", "amal-frankfurt", "amal-farsi"].includes(command.action)) {
            await setSelection(env, chatId, "news");
          }
          await dispatchWorkflow(env, command);
          const confirmedNews = command.action === "news-approve-draft";
          await reply(env, chatId, confirmedNews
            ? "✅ خبر تأیید شد. ویدیوی کوتاه با صدا در فضای ابری ساخته می‌شود و همین‌جا فرستاده خواهد شد."
            : "✅ دستور دریافت شد. ساخت یا بررسی در فضای ابری شروع شد؛ نتیجه را همین‌جا می‌فرستم.");
        }
      } else {
        await reply(env, chatId, await chat(env, chatId, message.text));
      }
    } catch (error) {
      console.error(error);
      await reply(env, chatId, "⚠️ درخواست اجرا نشد. لطفاً کمی بعد دوباره بفرستید.");
    }
    return new Response("ok");
  },
};

// Kept outside the HTTP handler solely for deterministic local command tests.
export { NUMBERED_ACTIONS, menuCode, commandFromPending, videoAction };

