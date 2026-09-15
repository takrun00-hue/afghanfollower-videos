# Unified leadership

`core/orchestrator.mjs` is the only executable control boundary. GitHub Actions and Telegram may provide an action name and data; neither can choose a script path. `core/config.mjs` contains the model, secret-name, design and action registries. `core/state.json` persists job state atomically and the lock rejects parallel duplicate production.

Actions are grouped into six governed branches: `production`, `editorial`, `research`, `visual`, `germanLesson`, and `news`. The orchestrator records the branch in each job record, so an execution can be traced to one approved path. `cloud-listen.mjs` is deliberately an ingress adapter only: it reads a Telegram update and emits an action name; it cannot render, search, publish or select an executable.

`core/gateway.mjs` is the only external-command gate. Telegram, a scheduled event, a repository trigger and manual workflow dispatch must validate a registered action there before the orchestrator starts. `undo`, owner-image acceptance, screenshot approval and custom news require the creator's hash-verified approval code. Set only `GATEWAY_APPROVAL_CODE_HASH` as a GitHub secret; never place the actual code in the repository or a message history.

Legacy scripts remain workers during migration and are only reachable through registered actions.
