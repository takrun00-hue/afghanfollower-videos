// The only registry allowed to choose executable project actions.
// Secret values remain in environment/secret stores; only their names live here.
export const config = Object.freeze({
  version: 1,
  schedule: Object.freeze({ timezone: "Europe/Berlin", slots: ["08:30", "17:00"] }),
  models: Object.freeze({
    text: { provider: "gemini", id: "gemini-flash-lite-latest" },
    textFallback: { provider: "groq", id: "openai/gpt-oss-120b" },
    image: { provider: "gemini", id: "gemini-2.5-flash-image" },
    narration: { provider: "edge", voice: "fa-IR-FaridNeural" },
  }),
  designSystem: Object.freeze({ realMediaFirst: true, minLongEdge: 1080, minPixels: 700000, styles: { tiktok: "dynamic cutout", instagram: "editorial photo-led", tools: "product proof", news: "clear factual" } }),
  secrets: Object.freeze({ telegram: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"], search: ["EXA_API_KEY"], ai: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY"], media: ["PEXELS_API_KEY"], narration: ["MINIMAX_API_KEY", "MINIMAX_VOICE_ID"] }),
  // Workflows can pass an action and data only; never an arbitrary script.
  actions: Object.freeze({
    "build-tiktok": ["daily-render.mjs", "--only", "tiktok"], "build-instagram": ["daily-render.mjs", "--only", "instagram"], "build-tools": ["daily-render.mjs", "--only", "ai-tiktok"], "build-all": ["daily-render.mjs"], "resend": ["daily-render.mjs"],
    "rerender-feature": ["daily-render.mjs", "--feature", "$payload", "--rerender"], "approved-feature": ["approve-feature.mjs", "$payload"], "content-approve": ["content-draft.mjs", "--build"], "custom-content": ["custom-content.mjs", "$payload"], "custom-content-media": ["custom-content.mjs", "$payload"], "build-app-pair": ["build-current-app-pair.mjs"], "build-tomorrow": ["daily-render.mjs", "$tomorrow"], "autopilot": ["daily-render.mjs"],
    "plan-today": ["topic-plan.mjs", "--today"], "plan-tomorrow": ["topic-plan.mjs", "--tomorrow"], "plan-week": ["topic-plan.mjs", "--week"], "plan-tiktok": ["topic-plan.mjs", "--tomorrow", "--category=tiktok"], "plan-instagram": ["topic-plan.mjs", "--tomorrow", "--category=instagram"], "plan-tools": ["topic-plan.mjs", "--tomorrow", "--category=tools"], "topic-pick": ["topic-plan.mjs", "--preview", "$pick"],
    "content-preview": ["content-draft.mjs", "--preview"], "content-edit-hook": ["content-draft.mjs", "--edit-hook", "$payload"], "content-edit-steps": ["content-draft.mjs", "--edit-steps", "$payload"], "content-search": ["content-search.mjs"], "content-search-live": ["content-search.mjs", "--query", "$payload"], "search-topic-pick": ["content-search.mjs", "--pick", "$pick"], "content-topic-preview": ["custom-draft.mjs", "$payload"], "content-source-pick": ["source-draft.mjs", "$pick"], "approved-screen": ["approve-screen.mjs", "$payload"], "user-photo": ["save-user-photo.mjs", "$payload", "$photoFileId"],
    "research": ["research.mjs"], "content-radar": ["content-radar.mjs"], "demand-research": ["demand.mjs", "$payload"], "topic-reject": ["reject-topic.mjs", "$payload"], "topic-unreject": ["reject-topic.mjs", "--undo", "$payload"], "topic-rejected-list": ["reject-topic.mjs", "--list"], "undo": ["undo-send.mjs", "3", "--daily"], "voice-list": ["music/minimax-voices.mjs", "--telegram"], "voice-list-language": ["music/minimax-voices.mjs", "--telegram", "--lang", "$payload"],
    "news-scan": ["news-build.mjs", "--scan"], "news-germany": ["news-build.mjs", "--germany"], "news-europe": ["news-build.mjs", "--europe"], "news-approve-draft": ["news-build.mjs", "--approve"], "news-custom": ["news-build.mjs", "--text", "$payload"], "scheduled-daily": ["daily-render.mjs", "--only", "$payload"], "scheduled-german": ["german-lesson-build.mjs"], "scheduled-german-unit": ["german-lesson-build.mjs", "--unit", "$payload"], "lesson-recovery": ["lib/recovery-chain.mjs"],
  }),
  // Operational branches are labels only; they never bypass the action registry.
  branches: Object.freeze({
    production: ["build-tiktok", "build-instagram", "build-tools", "build-all", "resend", "rerender-feature", "approved-feature", "content-approve", "custom-content", "custom-content-media", "build-app-pair", "build-tomorrow", "autopilot", "scheduled-daily"],
    editorial: ["plan-today", "plan-tomorrow", "plan-week", "plan-tiktok", "plan-instagram", "plan-tools", "topic-pick", "content-preview", "content-edit-hook", "content-edit-steps", "content-search", "content-search-live", "search-topic-pick", "content-topic-preview", "content-source-pick", "topic-reject", "topic-unreject", "topic-rejected-list", "undo"],
    research: ["research", "content-radar", "demand-research", "voice-list", "voice-list-language"],
    visual: ["approved-screen", "user-photo"],
    germanLesson: ["scheduled-german", "scheduled-german-unit", "lesson-recovery"],
    news: ["news-scan", "news-germany", "news-europe", "news-approve-draft", "news-custom"],
  }),
});

export function modelFor(role, env = process.env) {
  const configured = config.models[role];
  if (!configured) throw new Error(`Unknown model role: ${role}`);
  const override = role === "text" ? env.GEMINI_MODEL : role === "textFallback" ? env.GROQ_MODEL : role === "image" ? env.GEMINI_IMAGE_MODEL : "";
  return { ...configured, id: override || configured.id };
}

export function branchForAction(action) {
  return Object.entries(config.branches).find(([, actions]) => actions.includes(action))?.[0] || "unclassified";
}
