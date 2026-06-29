# Agent Lifecycle

Every runtime agent inherits the same lifecycle:

1. Initialize
2. Load Memory
3. Register Workflows
4. Load Health
5. Load Activity
6. Ready
7. Run Workflow
8. Log Activity
9. Sync
10. Complete

The lifecycle is descriptive in Phase 18. It standardizes how the dashboard represents agent state without adding autonomous execution or AI.

Future workflow execution should emit runtime activity, audit records, approval records, and sync records through the shared runtime path.
