// Real-time Telegram gateway. Hosting is free on Cloudflare Workers; secrets
// are entered with `wrangler secret put`, never placed in this repository.

const TG = "https://api.telegram.org";
const MAX_HISTORY = 8;

const HELP = `🤖 <b>منوی GapMedia — اول جستجو، بعد ساخت</b>

🎬 <b>ویدیوی آموزشی</b>
<b>۱</b> جستجوی زندهٔ موضوع‌های روز
<b>۲</b> جستجوی دقیق با عبارت خودت
<b>۳</b> تحلیل موضوع یا متن آمادهٔ من
<b>۴</b> نمایش پیش‌نویس فعلی
<b>۵</b> ادیت قلاب
<b>۶</b> ادیت اسلایدها
<b>۷</b> تأیید و ساخت با صدا
<b>۸</b> رادار ترندهای بررسی‌شده
<b>۹</b> تقاضای واقعی مردم برای یک موضوع
<b>۱۰</b> فهرست صداها

<i>روش کار: ۱ یا ۲ ← انتخاب شمارهٔ موضوع ← پیش‌نویس ← ۵ یا ۶ برای ادیت ← ۷ برای ساخت.</i>

📰 <b>German Insider</b>
<b>۱۱</b> جستجوی خبر تازه
<b>۱۲</b> خبرهای آلمان
<b>۱۳</b> خبرهای اروپا
<b>۱۴</b> جستجوی دقیق خبر
<b>۱۵</b> خبر از متن شما
<b>۱۶</b> ادیت تیتر خبر
<b>۱۷</b> ادیت متن خبر
<b>۱۸</b> تأیید و ساخت خبر با صدا
<b>۲۲</b> خبرهای امل برلین
<b>۲۳</b> خبرهای امل هامبورگ
<b>۲۴</b> خبرهای امل فرانکفورت
<b>۲۵</b> خبرهای امل فارسی

🔎 <b>رادار روزانه</b>
<b>۲۷</b> رادار محتوا (GapMedia)
<b>۲۸</b> رادار خبر (German Insider)

⚙️ <b>مدیریت</b>
<b>۱۹</b> وضعیت
<b>۲۰</b> حذف ۳ ویدیوی آموزشی آخر
<b>۲۱</b> حذف آخرین ویدیوی خبری
<b>۰</b> نمایش دوبارهٔ این منو

فقط شماره را بفرستید. در گزینه‌های ۲، ۳، ۵، ۶، ۹، ۱۴، ۱۵، ۱۶ و ۱۷، بات در پیام بعد متن لازم را می‌پرسد.`;

const NUMBERED_ACTIONS = {
  "1": { action: "content-search" },
  "2": { pending: "content-search-live", ask: "🔎 عبارت جستجوی محتوا را بفرستید؛ مثلاً: راه‌های درآمد از اینستاگرام" },
  "3": { pending: "content-topic-preview", ask: "📝 موضوع یا متن آماده را بفرستید. بات فقط پیش‌نویسِ قابل ادیت می‌سازد؛ تا تأیید شما ویدیویی ساخته نمی‌شود." },
  "4": { action: "content-preview" },
  "5": { pending: "content-edit-hook", ask: "✏️ قلاب تازه را بفرستید. نام اپ یا جوابِ اصلی را در قلاب نیاورید." },
  "6": { pending: "content-edit-steps", ask: "✏️ متن اسلایدها را با | جدا کنید: اسلاید ۱ | اسلاید ۲ | اسلاید ۳" },
  "7": { action: "content-approve", voiceMode: "on" },
  "8": { action: "content-radar" },
  "9": { pending: "demand-research", ask: "🔎 موضوع را بفرستید تا تقاضای واقعی و سؤال‌های مردم درباره‌اش بررسی شود." },
  "10": { action: "voice-list" },
  "11": { action: "news-scan" }, "12": { action: "news-germany" }, "13": { action: "news-europe" },
  "14": { pending: "news-search-live", ask: "🔎 عبارت جستجوی خبر را بفرستید؛ مثلاً: قوانین اقامت آلمان" },
  "15": { pending: "news-text-preview", ask: "📝 متن خبر را بفرستید — همان‌طور که هست، با پاراگراف. بات خودش تیتر و جمله‌ها را جدا می‌کند.\nاگر خواستید خودتان جدا کنید: تیتر | جمله ۱ | جمله ۲" },
  "16": { pending: "news-edit-hook", ask: "✏️ تیتر تازهٔ خبر را بفرستید." },
  "17": { pending: "news-edit-text", ask: "✏️ متن تازهٔ خبر را با | جدا کنید." },
  "18": { action: "news-approve-draft", voiceMode: "on" }, "19": { action: "status" },
  "20": { action: "undo" }, "21": { action: "undo-news" },
  "22": { action: "amal-berlin" }, "23": { action: "amal-hamburg" },
  "24": { action: "amal-frankfurt" }, "25": { action: "amal-farsi" },
  "27": { action: "content-radar" }, "28": { action: "news-radar" },
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
  if (/^(?:محتوا|ویدیو|ساخت محتوا|custom content|موضوع)\s*[:：]/i.test(c)) {
    const payload = cleanContent(text);
    // A supplied tutorial is an editorial draft, not permission to publish.
    // Sending it straight to custom-content.mjs built a video before the
    // creator could check its hook, facts, voice and slides — contrary to the
    // approval-first workflow used by every other tutorial command.
    return payload.trim().length >= 25
      ? { action: "content-topic-preview", payload, ...audio }
      : { action: "custom-help" };
  }
  if (/^(?:تقاضا|سرچ مردم|دیماند)\s*[:：]/i.test(c)) {
    const payload = String(text).replace(/^\s*(?:تقاضا|سرچ مردم|دیماند)\s*[:：]\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 120);
    return payload ? { action: "demand-research", payload } : null;
  }
  if (/^(?:موضوع آماده|ایده آماده|ایده)\s*[:：]/i.test(c)) {
    const payload = stripLinks(String(text).replace(/^\s*(?:موضوع آماده|ایده آماده|ایده)\s*[:：]\s*/i, "")).replace(/[\r\n]+/g, " ").trim().slice(0, 5000);
    return payload ? { action: "content-topic-preview", payload, ...audio } : null;
  }
  // Refusing a topic, before the rule that selects one — «رد موضوع ۲» would
  // otherwise be read as «موضوع ۲» and build the thing the operator rejected.
  if (/^(?:رد|حذف|نمی‌خواهم|نمیخواهم)\s*(?:موضوع)?\s*[۰-۹0-9]+\s*$/i.test(c)) return { action: "topic-reject", pick: digits(c) };
  if (/^(?:رد|حذف)\s*(?:موضوع)?\s+[a-z0-9-]+$/i.test(c)) return { action: "topic-reject", payload: c.replace(/^(?:رد|حذف)\s*(?:موضوع)?\s+/i, "").trim() };
  if (/^(?:برگردان|بازگردان)\s+[a-z0-9-]+$/i.test(c)) return { action: "topic-unreject", payload: c.replace(/^(?:برگردان|بازگردان)\s+/i, "").trim() };
  if (/^(?:رد‌شده|رد شده|فهرست رد|موضوع.?های رد)/i.test(c)) return { action: "topic-rejected-list" };
  if (/^(?:انتخاب|موضوع|تأیید موضوع|تاييد موضوع)\s*[۰-۹0-9]+(?:\s|$)/i.test(c)) return { action: "topic-pick", pick: digits(c), ...audio };
  // "تأیید تصویر <id> <شماره>" — approves one real screenshot fetch-screens.mjs
  // sent as a candidate. Must come before the bare approved-feature pattern
  // below: it wouldn't match anyway (that one is a single a-z0-9- token, this
  // one has a Persian word and a space in it), but specific-before-generic is
  // the rule this whole function follows.
  if (/^(تایید|تأیید|approve)\s+تصویر\s+[a-z0-9-]+\s+[۰-۹0-9]+$/i.test(c)) return { action: "approved-screen", payload: c };
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
  // The scored daily shortlist — a distinct question from "research" (what
  // shipped) and from "content-search" (search on a topic I already typed):
  // "of what's out there, which candidate actually clears the bar". "رادار"
  // is a new word specifically so it never collides with either of those.
  if (any("رادار محتوا", "رادار موضوع", "content radar")) return { action: "content-radar" };
  if (any("رادار خبر", "news radar")) return { action: "news-radar" };
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
  // «بساز» starts today's editorial proposal. It used to return tomorrow's
  // list, which made a same-day request appear to be ignored.
  if (/^(بساز|ساخت همه|هر سه|make|build)(?:\s|$)/.test(c)) return { action: "plan-today" };
  return null;
}

// A bare "۱".."۵" is ambiguous on its own: NUMBERED_ACTIONS reads it as the
// fixed menu (plan-tiktok etc.), but rule 12 also wants it to mean "pick one
// of the five topics content-search.mjs just offered". The KV selection
// state (set right after content-search/content-search-live dispatch, see
// setSelection below) is what tells them apart — a menu digit and a topic
// pick would otherwise be textually identical. Checked BEFORE menuCode() in
// fetch() so an active topic list always wins over the fixed menu.
function bareTopicPick(text, selectionKind) {
  const digits = String(text || "").trim().replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  if (selectionKind !== "search" || !/^[1-5]$/.test(digits)) return null;
  return { action: "search-topic-pick", pick: digits, ...audioFor(text) };
}

function digits(text) {
  const value = String(text).replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  return String(Math.max(1, Math.min(9, Number(value) || 1)));
}

function cleanNews(text) {
  return stripLinks(String(text).replace(/^\s*(?:خبر|news)\s*[:：]\s*/i, "")).replace(/[\r\n]+/g, " ").trim().slice(0, 5000);
}

function cleanContent(text) {
  return stripLinks(String(text).replace(/^\s*(?:محتوا|ویدیو|ساخت محتوا|custom content|موضوع)\s*[:：]\s*/i, ""))
    .replace(/[\r\n]+/g, " ").trim().slice(0, 5000);
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

// Telegram must tell the creator exactly what has started. A proposal is not a
// render, and describing it as one was the main reason commands looked like
// they were merely saved or silently ignored.
function acknowledgementFor(command) {
  const action = command?.action || "";
  if (["plan-today", "plan-tomorrow", "plan-week", "plan-tiktok", "plan-instagram", "plan-tools", "content-search", "content-search-live", "content-topic-preview", "content-source-pick", "search-topic-pick"].includes(action)) {
    return "✅ جستجو و پیش‌نویس شروع شد؛ ویدیویی هنوز ساخته نمی‌شود. پس از دیدن قلاب و اسلایدها، «تأیید محتوا» یا «تأیید شناسه» را بفرستید.";
  }
  if (["news-scan", "news-search-live", "amal-berlin", "amal-hamburg", "amal-frankfurt", "amal-farsi", "news-germany", "news-europe", "news-today", "news-breaking-preview", "news-pick-preview", "europe-pick-preview", "news-text-preview"].includes(action)) {
    return "✅ خبرها یا پیش‌نویس خبر در حال آماده‌شدن است؛ تا تأیید شما، هیچ ویدیویی ساخته نمی‌شود.";
  }
  if (["content-approve", "approved-feature", "custom-content", "build-tiktok", "build-instagram", "build-tools", "build-all", "build-tomorrow", "resend", "news-approve", "news-approve-draft", "news-text", "news-pick", "europe-pick"].includes(action)) {
    return "✅ ساخت واقعی با صدا در فضای ابری شروع شد؛ ویدیوی نهایی پس از موفق‌شدن رندر همین‌جا فرستاده می‌شود.";
  }
  return "✅ دستور دریافت شد و در فضای ابری اجرا می‌شود؛ نتیجه همین‌جا ارسال خواهد شد.";
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
  // Newlines collapse because the payload travels as one workflow input. The
  // splitters downstream read sentence punctuation, not layout, so nothing is
  // lost by it. The cap is 5000 rather than 900 because a pasted article runs
  // past 2000 characters routinely, and the old cap cut one in half without
  // saying so — the preview simply came back short.
  const payload = stripLinks(String(text || "")).replace(/[\r\n]+/g, " ").trim().slice(0, 5000);
  if (!payload) return null;
  // Both of these were once held to «تیتر | جمله | جمله», so a pasted article
  // or a pasted how-to was refused at the door — even though the splitters for
  // exactly that text already existed further down and could never be reached.
  // Now only a message with too little in it to make a card or a step from is
  // turned away, and it is told which one it is.
  if (pending.action === "news-text-preview" && payload.replace(/\|/g, " ").trim().length < 40) {
    return { error: "متن خبر خیلی کوتاه است. یک تیتر و دست‌کم یک جمله بفرستید." };
  }
  if (pending.action === "custom-content" && payload.replace(/\|/g, " ").trim().length < 25) {
    return { error: "متن آموزشی خیلی کوتاه است. موضوع و دست‌کم یک گام بفرستید." };
  }
  return { action: pending.action, payload, voiceMode: "on" };
}

// Safe local preparation: normalize Persian characters and turn a supplied
// topic or news item into an editable structure. It deliberately does not
// invent facts or send the creator's text to any third-party AI service.
// A pasted article carries its own source link inline — abendblatt.de's URLs
// run 90+ characters and read aloud terribly on a caption. Stripped once, here,
// so every text-cleaning path shares the same rule instead of three near-copies
// of it drifting apart.
const stripLinks = (s) => String(s || "").replace(/https?:\/\/\S+|www\.\S+|abendblatt\.de\S*/gi, " ");

function cleanPersian(value, max = 180) {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/\s+/g, " ").replace(/\s*([،؛؟.!])\s*/g, "$1 ").trim().slice(0, max);
}

// A pasted article, turned into the cards a news video is built from.
//
// The split runs BEFORE any length cap. Capping first — cleanPersian(raw, 850)
// — cut the article mid-sentence and dropped everything after it, so a long
// paste quietly became a short one and the later paragraphs never appeared.
function prepareNewsLocally(raw) {
  const parts = String(raw || "").split("|").map((x) => cleanPersian(x)).filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 5).join(" | ");
  // A link in the body is the source, not a sentence. Left in place it is read
  // aloud and printed across a card, and it breaks the sentence it sits in.
  const flat = String(raw || "").replace(/[(（]?\s*https?:\/\/\S+\s*[)）]?/g, " ");
  const sentences = flat.split(/(?<=[.!؟])\s+/).map((x) => cleanPersian(x)).filter(Boolean);
  if (!sentences.length) return cleanPersian(raw, 110);
  const headline = sentences.shift();
  // Fragments left by an abbreviation or a stray full stop would render as an
  // empty card, so only real sentences become body lines.
  return [headline, ...sentences.filter((x) => x.length > 12).slice(0, 4)].join(" | ");
}

// The scaffold is what to ask when a bare topic arrives and there is genuinely
// nothing of the creator's to build steps from. It is a prompt, not content.
const TOPIC_SCAFFOLD = [
  "فکر می‌کنید این نکته می‌تواند نتیجهٔ ویدیوی شما را بهتر کند؟",
  "اول هدف و مخاطب اصلی را روشن کنید",
  "یک نمونهٔ واقعی و قابل‌فهم نشان دهید",
  "نکتهٔ اصلی را کوتاه و مرحله‌به‌مرحله توضیح دهید",
  "نتیجه را با یک سؤال مرتبط جمع‌بندی کنید",
];

// A pasted how-to, cut into the steps a tutorial video is built from.
//
// Newlines are gone by the time this runs, so the list markers a person types —
// «۱.» «۲)» «-» «•» — are the only boundary left. They are tried first because a
// step written as a list item is rarely one clean sentence, and falling back to
// sentence punctuation would split it in the middle.
function splitSteps(raw) {
  const flat = String(raw || "").replace(/[(（]?\s*https?:\/\/\S+\s*[)）]?/g, " ");
  const marked = flat
    .split(/\s*(?:[۰-۹0-9]{1,2}\s*[.)–-]|[-•*])\s+/)
    .map((x) => cleanPersian(x))
    .filter((x) => x.length > 8);
  // Three parts is the point where a numbered list is a list rather than a
  // sentence that happens to contain a figure and a full stop.
  if (marked.length >= 3) return marked;
  return flat.split(/(?<=[.!؟])\s+/).map((x) => cleanPersian(x)).filter(Boolean);
}

// This used to keep the first 180 characters as the topic and append the five
// scaffold lines, whatever had been sent. A creator who pasted real steps got
// boilerplate back and their own words were dropped without a word — worse than
// the news command's refusal, because a refusal at least shows itself.
//
// Now what was written is what is used, and the scaffold is reached only by a
// bare topic that contains no steps to find.
function prepareTopicLocally(raw) {
  const parts = String(raw || "").split("|").map((x) => cleanPersian(x)).filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 6).join(" | ");
  const found = splitSteps(raw);
  const topic = found.shift() || cleanPersian(raw, 180);
  const steps = found.filter((x) => x.length > 12).slice(0, 5);
  return [topic, ...(steps.length ? steps : TOPIC_SCAFFOLD)].join(" | ");
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
      // A standalone number picks a just-offered content-search topic when
      // one is active (rule 12); otherwise it belongs to the fixed numbered
      // menu below. For menu options that need copy, KV keeps the selected
      // operation for 15 minutes and the next message becomes its payload
      // instead of a vague AI chat reply.
      const selection = await selectionFor(env, chatId);
      const topicPick = bareTopicPick(message.text, selection?.kind);
      if (topicPick) {
        await dispatchWorkflow(env, topicPick);
        await reply(env, chatId, acknowledgementFor(topicPick));
        return new Response("ok");
      }
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
          await reply(env, chatId, "متن آموزشی را بعد از «محتوا:» بفرستید — همان‌طور که هست، با گام‌های شماره‌دار یا خط‌به‌خط:\n\n<code>محتوا: راه پیدا کردن موضوع ترند در TikTok\n۱. Search را باز کن\n۲. Creator Search Insights را بنویس\n۳. Content gap را بزن\n۴. از موضوعِ پرجستجو ویدیو بساز</code>\n\nقالب <code>|</code> هم اگر خواستید کار می‌کند.");
        } else {
          if (command.action === "news-text-preview") command.payload = prepareNewsLocally(command.payload);
          // custom-content.mjs and content-draft.mjs both read «|» separated
          // steps, so the separating happens here for every route that can send
          // a tutorial — typed as «محتوا:», or pasted after menu 6.
          if (command.action === "content-topic-preview" || command.action === "custom-content") {
            command.payload = prepareTopicLocally(command.payload);
          }
          // content-search.mjs offers its five topics by plain number
          // («۱».."۵", rule 12) rather than the older «منبع N» phrasing, so a
          // bare digit after either action must resolve to picking one of
          // ITS topics, not the fixed menu — see bareTopicPick() below.
          if (["content-search", "content-search-live"].includes(command.action)) await setSelection(env, chatId, "search");
          if (["news-scan", "news-search-live", "amal-berlin", "amal-hamburg", "amal-frankfurt", "amal-farsi"].includes(command.action)) {
            await setSelection(env, chatId, "news");
          }
          await dispatchWorkflow(env, command);
          await reply(env, chatId, acknowledgementFor(command));
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
export { NUMBERED_ACTIONS, menuCode, commandFromPending, videoAction, prepareNewsLocally, prepareTopicLocally, acknowledgementFor, bareTopicPick };
