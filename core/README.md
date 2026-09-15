# Unified leadership

`core/orchestrator.mjs` is the only executable control boundary. GitHub Actions and Telegram may provide an action name and data; neither can choose a script path. `core/config.mjs` contains the model, secret-name, design and action registries. `core/state.json` persists job state atomically and the lock rejects parallel duplicate production.

Legacy scripts remain workers during migration and are only reachable through registered actions.
