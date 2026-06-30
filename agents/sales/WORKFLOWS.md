# Sales Agent Workflows

Registered workflows:

- `sales-lead-review`
- `gym-prospect-review`
- `coach-prospect-review`
- `quote-prep`
- `follow-up-planning`
- `pipeline-summary`

All workflows are local/mock in the current phase.

## Workflow Rules

- Lead and proposal state stays local.
- Follow-up actions update local state only.
- Quote prep does not create invoices.
- Proposal prep does not send messages.
- Reports download locally.
- Runtime activity and audit logs may sync only through approved agent-memory sync.
