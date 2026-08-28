// Real-time Telegram gateway. Hosting is free on Cloudflare Workers; secrets
// are entered with `wrangler secret put`, never placed in this repository.

const TG = "https://api.telegram.org";
const MAX_HISTORY = 8;

function normalize(value = "") {
  return String(value).trim().replace(/^\//, "").replace(/‌/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function videoAction(text) {
  const c = normalize(text);
  const any = (...words) => words.some((word) => c.includes(word));
  if (/^(تایید|تأیید|approve)\s+[a-z0-9-]+$/i.test(c)) return { action: "approved-feature", payload: c };
  if (/^(بساز|تایید|تأیید|ok|build)\s*[۰-۹0-9]+$/.test(c)) return { action: "news-approve", pick: digits(c) };
  if (/^(خبر|news)\s*[:：]/.test(c)) return { action: "news-text", payload: cleanNews(text) };
  if (/^(خبر|news)\s*[۰-۹0-9]+$/.test(c)) return { action: "news-pick", pick: digits(c) };
  if (/^(اروپا|europe)\s*[۰-۹0-9]+$/.test(c)) return { action: "europe-pick", pick: digits(c) };
  if (any("خبر فوری", "فوری", "breaking")) return { action: "news-breaking" };
  if (any("تیک تاک", "تیکتاک", "tiktok", "tik tok") && any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "build-tiktok" };
  if (any("انستا", "اینستا", "instagram", "insta") && any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "build-instagram" };
  if (any("ابزار", "هوش مصنوعی", " ai", "tool") && any("بساز", "ساخت", "ویدیو", "make", "build")) return { action: "build-tools" };
  if (/^(فردا|برای فردا|فردا بساز)$/.test(c)) return { action: "build-tomorrow" };
  if (/^(بساز|ساخت همه|هر سه|make|build)$/.test(c)) return { action: "build-all" };
  return null;
}

function digits(text) {
  const value = String(text).replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  return String(Math.max(1, Math.min(9, Number(value) || 1)));
}

function cleanNews(text) {
  return String(text).replace(/^\s*(?:خبر|news)\s*[:：]\s*/i, "").replace(/[\r\n]+/g, " ").trim().slice(0, 900);
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
      "user-agent": "AfghanFollowers-Telegram-Worker",
      "content-type": "application/json",
    },
    body: JSON.stringify({ ref: "main", inputs: { action: command.action, pick: command.pick || "1", payload: command.payload || "" } }),
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

const SYSTEM = `تو دستیار فارسی/دری برند AfghanFollowers هستی. کوتاه، صمیمی و دقیق جواب بده. درباره ویدیوهای آموزشی تیک‌تاک، اینستاگرام و اپ‌های هوش مصنوعی، و کانال خبری German Insider کمک کن. هیچ وعدهٔ درآمد، ویو یا وایرال‌شدن نده و چیزی را که واقعاً اجرا نشده «انجام شد» نگو. برای ساخت ویدیو از فرمان‌های روشن استفاده می‌شود؛ اگر کاربر دستور مبهم ویدیویی داد، بگو نمونه: «تیک‌تاک بساز»، «انستا بساز»، «ابزار بساز»، «خبر فوری»، یا «بساز». هرگز کلید، توکن یا اطلاعات محرمانه را درخواست یا نمایش نده.`;

function textFromWorkersAI(data) {
  // Workers AI models have used both native `response` and OpenAI-compatible
  // response shapes. Accept either so an upstream format change never turns
  // a successful model call into an empty Telegram reply.
  const value = data?.response
    ?? data?.result?.response
    ?? data?.choices?.[0]?.message?.content
    ?? data?.result?.choices?.[0]?.message?.content
    ?? data?.output_text
    ?? data?.result?.output_text
    ?? data?.output?.[0]?.content?.[0]?.text;
  return typeof value === "string" ? value.trim() : "";
}

async function chat(env, chatId, userText) {
  if (!env.AI) throw new Error("Workers AI binding is unavailable");
  const prior = await history(env, chatId);
  const messages = [{ role: "system", content: SYSTEM }, ...prior, { role: "user", content: userText.slice(0, 2000) }];
  // Cloudflare's multilingual GLM model is available on the Free plan. It
  // keeps Telegram chat independent from MiniMax API billing; MiniMax remains
  // reserved for the video narration pipeline in GitHub Actions.
  const data = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
    messages,
    max_tokens: 420,
    temperature: 0.65,
  });
  // Log only response field names and value types while diagnosing an upstream
  // response-format mismatch; generated text and user messages stay private.
  console.log("WORKERS_AI_RESPONSE_SHAPE", Object.fromEntries(
    Object.entries(data || {}).map(([key, value]) => [key, Array.isArray(value) ? "array" : typeof value]),
  ));
  const answer = textFromWorkersAI(data) || "فعلاً پاسخ آماده نشد؛ دوباره بنویسید.";
  await saveHistory(env, chatId, [...prior, { role: "user", content: userText.slice(0, 2000) }, { role: "assistant", content: answer }]);
  return answer;
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("German Insider Telegram worker", { status: 200 });
    if (env.TELEGRAM_WEBHOOK_SECRET && request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) return new Response("Unauthorized", { status: 401 });
    const update = await request.json().catch(() => null);
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) return new Response("ok");
    const chatId = String(message.chat.id);
    if (env.ALLOWED_CHAT_ID && chatId !== String(env.ALLOWED_CHAT_ID)) return new Response("ok");
    try {
      const command = videoAction(message.text);
      if (command) {
        await dispatchWorkflow(env, command);
        await reply(env, chatId, "✅ دستور دریافت شد. ساخت در فضای ابری شروع شد؛ نتیجه را همین‌جا می‌فرستم.");
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
