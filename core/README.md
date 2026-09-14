# Core migration — partial, not yet production cutover

## Implemented

- `config.ts`: actual shared defaults/secret lookup for `lib/translate-fa.mjs` and `lib/auto-image.mjs`. Environment overrides remain for deployment compatibility. No secret values are stored here.
- `orchestrator.ts`: the single execution gateway for scheduled and Telegram video builds. Workflows provide an approved action or a native slot; the allow-list in `config.ts` resolves the exact legacy entrypoint and arguments. Default `npm run autopilot` prints a plan without API calls or publication. Explicit `--execute --job-id <stable-id>` runs the selected legacy entrypoint. Local lock and atomic state writes prevent overlapping core invocations. Reusing a job ID is rejected pending inspection.
- `state.json`: core execution records only. Existing delivery/history files are untouched and have NOT been migrated. This is intentionally marked in its schema.

## Not implemented / not claimed

This is NOT yet the sole controller of research, Telegram conversation state or four agents. Video production now enters through the orchestrator, while research and conversation routes remain inputs. Existing delivery/history files are retained until they are safely migrated. A process exit is not labelled a verified delivery receipt.

Prompts, TTS policies, renderer styles and Worker model configuration elsewhere have not all been moved. The design values in config are reserved metadata, not an installed Montserrat font or an activated 3D renderer. Agent boundaries and full prompt centralization require further migration and end-to-end tests.

The repository currently uses Gemini and **Groq** in the migrated modules, not xAI **Grok**. Flux/Midjourney/Veo adapters are not implemented. Changing provider to an unsupported one throws before execution; changing a compatible model ID in config changes both migrated consumers. Text, image and video capabilities cannot be interchanged by renaming a model.

Native `.ts` loading requires a Node release that supports type stripping (the project's 22.23.2 runtime or the locally tested 24.18.0). This is runtime validation, not a full TypeScript compiler check.

## Verification on 2026-09-13

- `npm run autopilot`: dry-run passed; no content created/sent.
- role/provider/channel assertions passed.
- `test-content-search.mjs` and `test-screens-manifest.mjs` passed.
- migrated source syntax checks passed.

Do not retire old workflows/state until all callers are migrated and a real controlled delivery is verified. Never put API key values in config, state, logs or commits.
