# Resumable recovery model

The runner treats each day and phase as an idempotent state transition. `progress.json` records `active_day`, product, current phase, completed phases, attempts, resources, last error, and timestamps. Writes use a temporary sibling followed by atomic rename.

On startup it validates the state, chooses the earliest unfinished day, and checks recorded repositories, price IDs, deployments, and URLs before creating anything. Completed phases are skipped. Failures retry at `min(30s × 2^(attempt-1), 15m)` with small jitter, up to three attempts in a single invocation. The next permitted time is persisted, so process restarts do not reset pressure on an external service. Authentication or missing-credential errors block immediately with a consolidated report. Operators fix the dependency and rerun; no manual state deletion is needed.

After report completion the day becomes complete and `current_day` advances. At day 30, the project is marked `retired` and future invocations exit successfully.
