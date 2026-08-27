// Lists the voices available to this MiniMax account. The command deliberately
// prints IDs and descriptions only; it never prints or persists the API key.
const apiKey = process.env.MINIMAX_API_KEY || "";
if (!apiKey) {
  console.error("MINIMAX_API_KEY is not set.");
  process.exit(1);
}
const response = await fetch("https://api.minimax.io/v1/get_voice", {
  method: "POST",
  headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
  body: JSON.stringify({ voice_type: "all" }),
});
const data = await response.json().catch(() => ({}));
if (!response.ok || data?.base_resp?.status_code !== 0) {
  console.error(`MiniMax voice list failed: ${data?.base_resp?.status_msg || response.status}`);
  process.exit(1);
}
const all = ["system_voice", "voice_cloning", "voice_generation"]
  .flatMap((kind) => (data[kind] || []).map((voice) => ({ kind, ...voice })));
const persian = all.filter((voice) => /persian|farsi|dari|iran|afghan/i.test(
  `${voice.voice_id || ""} ${voice.voice_name || ""} ${(voice.description || []).join(" ")}`
));
console.log(JSON.stringify({ voices: persian.length ? persian : all }, null, 2));
