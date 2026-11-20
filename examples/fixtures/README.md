# Production-shaped fixtures

These fixtures are for layout and state verification. They are deliberately marked as demo data and must never be treated as live API responses.

- `list-empty.json` checks empty-state copy and the next action.
- `list-long.json` checks long names, mixed languages, stale status, and large counts.
- `permission-limited.json` checks partial visibility and recovery guidance.
- `loading.json` checks an in-progress state.
- `error.json` checks a retryable failure.
- `offline.json` checks a stale or disconnected state.
- `recovery.json` checks restored content after a retry.
- `partial-failure.json` checks mixed success and retryable failure.
- `missing-fields.json` checks null optional fields.

An adapter should remove or transform `__source: "demo"` before a production component receives data. Production builds should reject demo payloads where runtime assertions are available.
