# Runtime Memory

Runtime memory summarizes the existing local agent-memory sources:

- agent runs
- agent events
- agent tasks
- agent notes
- approvals
- audit logs
- workflow dry checks

Phase 18 does not introduce a new storage backend. It reads the same browser localStorage-backed state already used by the dashboard and presents it through the shared runtime snapshot.

If Agent Memory sync is enabled, records continue to use the existing approved Edge Function path and local fallback. The runtime does not write directly to production business tables.
