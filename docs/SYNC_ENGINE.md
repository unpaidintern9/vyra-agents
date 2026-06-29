# Sync Engine

Phase 7 adds a browser-side sync engine for agent operational memory.

## Flow

1. Dashboard actions update local React state.
2. Local state is saved to browser localStorage.
3. Syncable records are queued with a deterministic source key.
4. If Supabase is connected, pending queue items are inserted into approved agent tables.
5. If Supabase is unavailable, records stay pending or failed and can be retried.

## Queue States

- pending
- synced
- failed
- local_only

The queue tracks table, source type, source ID, retry count, queued time, last attempt time, sync time, and sanitized error messages.

## Conflict Handling

The queue avoids duplicate uploads by source type and source ID. Existing queued or synced records are not re-added on every render. Future production conflict resolution should add server-side idempotency or unique source metadata once table policies are finalized.

## Writable Boundary

Only these tables are writable:

- agent_runs
- agent_events
- agent_tasks
- agent_status
- agent_memory
- agent_logs
- agent_approvals
- agent_workflows
- agent_integrations

No production business data is modified.
