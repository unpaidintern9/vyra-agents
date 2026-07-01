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

As of Phase 28, the Executive Runtime is also summarized by the shared AI Operator command interface. `npm run agents:run` and `npm run agents:executive-summary` write timestamped Markdown and JSON Executive Run Summary reports with operator metadata.

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

As of Phase 34, Executive also reads Shared Task System health:

- open tasks
- blocked tasks
- overdue tasks
- tasks requiring Executive review
- tasks by agent
- tasks by priority
- workload by agent

Blocked, overdue, and approval-required tasks can create deterministic Executive priority signals. Reviewing those signals does not execute any external action.

## Health Aggregation

Executive health rows are derived from runtime agent health snapshots:

- Errors or health score below 50 -> high risk.
- Warnings or health score below 80 -> medium risk.
- Otherwise -> low risk.

Rows include pending tasks, workflow count, approval count, warnings, errors, sync status, and last activity.

## Boundaries

The Executive Runtime does not own write paths. It only summarizes existing runtime state and triggers local report downloads.

The AI Operator command interface follows the same boundary. It writes local reports only and does not send email, create Stripe invoices, write CRM records, or write production business data.

## Executive Operations Center

Phase 45 adds the Executive Operations Center as the daily operating view for the Executive Agent. It aggregates runtime, Engineering, Sales, projects, releases, ship plans, shared tasks, Gmail reporting, connector readiness, GitHub planning, and Executive automation into a daily briefing, KPI snapshot, health model, and Operations report.

Commands:

```bash
npm run executive:briefing
npm run executive:kpis
npm run executive:operations
npm run executive:health
npm run executive:report
npm run executive:validate
```

These commands are local analysis and reporting only.

## Repository Intelligence Signals

Phase 38 adds Repository Intelligence to Executive summaries:

- engineering health score
- repository risk
- documentation completeness
- dependency health
- validation trend

These signals come from local Engineering graph metadata and local repository intelligence reports. They do not trigger GitHub writes, repository modifications, or external service writes.

## Executive Automation

Phase 41 adds the Executive Automation Engine. The engine reads local runtime, task, Gmail, GitHub planning, connector readiness, repository intelligence, Engineering task, and cross-agent signals to decide what needs attention.

Automation can create ignored local shared tasks, GitHub plans, Gmail drafts, Executive review items, and reports. It cannot perform GitHub writes, CRM writes, Stripe writes, Supabase production writes, external marketing email, bulk sending, or secret output.

See `docs/EXECUTIVE_AUTOMATION_ENGINE.md`, `docs/EXECUTIVE_AUTOMATION_RULES.md`, and `docs/AUTOMATION_SAFETY.md`.
