// Central configuration boundary. Secret VALUES remain exclusively in env/secret stores.
// Existing pipelines are migrated incrementally; see core/README.md for coverage.
export const config = {
  version: 1,
  germanCulture: {
    'Bäckerei': 'authentic German bakery, bread counter, correctly labelled bread varieties',
    'Bahnhof': 'German railway station, realistic platform and wayfinding',
    'Supermarkt': 'German supermarket, shopping basket and grocery shelves',
  },
  emotionMap: { 'Bäckerei': 'warm and welcoming', 'Bahnhof': 'clear and reassuring', 'Supermarkt': 'practical and friendly' },
  visualPrompt: {
    defaultContext: 'real German everyday setting, Berlin',
    defaultEmotion: 'clear and welcoming',
    quality: 'cinematic 3D, ultra-detailed',
    negative: 'cartoon, blurry, low-resolution, fabricated app interfaces, fabricated logos',
  },
  designSystem: {
    palette: ['#3B82F6', '#EF4444', '#22C55E'],
    font: 'Montserrat ExtraBold',
    character: 'consistent German teacher',
    motion: 'typewriter + pop + parallax',
    status: 'requested-design-not-yet-renderer-integrated',
  },
  models: {
    text: { provider: 'gemini', id: 'gemini-flash-lite-latest' },
    textFallback: { provider: 'groq', id: 'openai/gpt-oss-120b' },
    image: { provider: 'gemini', id: 'gemini-2.5-flash-image' },
  },
  mediaRecovery: {
    // Order is deliberate: verified public evidence before any generated
    // substitute. A provider that reports quota/auth failure is circuit-broken
    // for the rest of that render and never retried in a long publish loop.
    realSearch: ['exa'],
    relevanceChecks: ['gemini', 'groq'],
    generatedFallbacks: ['gemini-image', 'local-contextual-svg'],
  },
  narration: {
    primary: { provider: 'minimax', voice: 'Arabic_CalmWoman', requiresSecret: 'minimax' },
    fallback: { provider: 'edge', voice: 'fa-IR-FaridNeural', rate: '+4%', pitch: '+0Hz', volume: '+0%' },
  },
  secrets: {
    gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], groq: ['GROQ_API_KEY'],
    minimax: ['MINIMAX_API_KEY'], exa: ['EXA_API_KEY'],
    telegram: ['TELEGRAM_BOT_TOKEN'], github: ['GITHUB_TOKEN'],
  },
  design: {
    germanFont: 'Montserrat', persianFont: 'Vazirmatn',
    articleColors: { der: '#3B82F6', die: '#EF4444', das: '#22C55E' },
    generatedFallbackStyle: 'cinematic-3d-labelled',
    realMediaFirst: true, characterEnabled: false,
    minLongEdge: 1080, minPixels: 700000, minCoverage: 0.34,
  },
  schedule: { timeZone: 'Europe/Berlin', slots: ['08:30', '17:00'] },
  legacyEntryPoints: { tutorial: 'daily-render.mjs', german: 'german-lesson-build.mjs' },
  // The only allow-list for commands that can render or send a video. Workflows
  // and Telegram may request an action, but cannot name an arbitrary script.
  videoActions: {
    'approved-feature': { script: 'approve-feature.mjs', payload: 'append' },
    'rerender-feature': { script: 'daily-render.mjs', payload: 'feature', after: ['--rerender'] },
    'content-approve': { script: 'content-draft.mjs', args: ['--build'] },
    'custom-content': { script: 'custom-content.mjs', payload: 'append' },
    'custom-content-media': { script: 'custom-content.mjs', payload: 'append' },
    'build-app-pair': { script: 'build-current-app-pair.mjs' },
    'build-tiktok': { script: 'daily-render.mjs', args: ['--only', 'tiktok'] },
    'build-instagram': { script: 'daily-render.mjs', args: ['--only', 'instagram'] },
    'build-tools': { script: 'daily-render.mjs', args: ['--only', 'ai-tiktok'] },
    'build-all': { script: 'daily-render.mjs' },
    'resend': { script: 'daily-render.mjs' },
    'build-tomorrow': { script: 'daily-render.mjs', tomorrow: true },
  },
};

export function modelFor(role, env = process.env) {
  const selected = config.models[role];
  if (!selected) throw new Error(`Unknown model role: ${role}`);
  const allowed = role === 'textFallback' ? ['groq'] : ['gemini'];
  if (!allowed.includes(selected.provider)) throw new Error(`No compatible ${role} adapter for ${selected.provider}; refusing silent provider substitution`);
  const override = role === 'image' ? env.GEMINI_IMAGE_MODEL : role === 'textFallback' ? env.GROQ_MODEL : env.GEMINI_MODEL;
  return { ...selected, id: override || selected.id };
}

export function secretFor(provider, env = process.env) {
  const names = config.secrets[provider];
  if (!names) throw new Error(`Unknown secret provider: ${provider}`);
  return names.map(name => env[name]).find(Boolean) || '';
}
