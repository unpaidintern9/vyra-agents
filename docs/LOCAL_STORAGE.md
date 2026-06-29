# Local Storage

The dashboard uses browser localStorage as the local cache and offline fallback for agent operational memory.

## Stored Data

- agent runs
- agent events
- agent tasks
- approvals
- approval history
- audit logs
- workflow dry-check results
- migration dry-run summaries
- sync queue state

## Behavior

Local state is saved immediately so the dashboard remains usable across refreshes and while offline. Supabase synchronization is layered on top of this cache; it does not replace the local fallback.

Clear/reset controls affect browser localStorage only. They do not delete Supabase rows or production business data.
