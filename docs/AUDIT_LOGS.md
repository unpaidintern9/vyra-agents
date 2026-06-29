# Audit Logs

Phase 5 adds a local/mock Audit Logs page.

Audit rows include:

- timestamp
- actor
- agent
- action
- target
- result
- risk level
- approval required

Examples include integration status refreshes, migration dry-run completion, mock approval actions, warning review, and table readiness checks.

This phase does not write audit logs to Supabase. Future production audit logging should write to the agent memory tables with immutable records and approval references.

## Phase 6 Local Persistence And Export

Audit logs are persisted in browser localStorage under a Vyra Agents namespace. The Audit Logs page includes:

- JSON and Markdown report export
- clear local audit logs control
- filters for risk level, agent, and result

Exports are created locally in the browser and include the safety note that no production writes were made.
