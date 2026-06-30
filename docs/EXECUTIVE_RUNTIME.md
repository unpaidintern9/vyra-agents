# Executive Runtime

The Executive Agent is a deterministic presentation layer over the shared Agent Runtime.

## Runtime Inputs

The dashboard builds one `AgentRuntimeSnapshot` from local state and workflow registries. The Executive Agent reads that snapshot and derives:

- Health rows.
- Overview cards.
- Priority signals.
- Timeline rows.
- Approval filters.
- Runtime summary facts.
- Report payloads.

## Priority Rules

Priority rules live in `dashboard/src/runtime/executiveRules.ts`.

The current rule set is deterministic:

- Pending approvals create a high-priority executive item.
- Active sync failures create a high-priority operations item.
- Critical runtime agents create high-priority items.
- Warning agents create medium-priority items.
- Pending sync records create a medium-priority item.
- Planned agents create low-priority readiness items.

The rule engine does not call AI and does not make changes to production systems.

## Health Aggregation

Executive health rows are derived from runtime agent health snapshots:

- Errors or health score below 50 -> high risk.
- Warnings or health score below 80 -> medium risk.
- Otherwise -> low risk.

Rows include pending tasks, workflow count, approval count, warnings, errors, sync status, and last activity.

## Boundaries

The Executive Runtime does not own write paths. It only summarizes existing runtime state and triggers local report downloads.
