# Sales Workflows

Phase 49 adds local multi-agent workflow orchestration for Sales.

Workflow records live in `codex-agent-threads/shared/sales-opportunities/sales-workflows.json`.

Each workflow stores workflow ID, type, source agent, target agent, opportunity ID, company, priority, status, owner, requested action, reason, required inputs, missing information, related source IDs, related intake IDs, related report IDs, related draft IDs, approval requirement, approval status, created/updated/due/completed dates, and audit trail.

Supported workflow statuses are `draft`, `queued`, `assigned`, `in_review`, `approved`, `rejected`, `blocked`, `completed`, and `archived`.

Every status transition records timestamp, previous status, new status, operator, reason, affected artifacts, confidence impact, and next action. Invalid transitions are blocked safely.

## Workflow Types

- Research request
- Verification request
- Duplicate review
- Missing info request
- Follow-up preparation
- Proposal prep handoff
- Executive approval
- Risky source review
- External action gate
- Proposal readiness review
- Stalled opportunity review
- Lost opportunity review

## Commands

- `npm run sales:workflows`
- `npm run sales:create-handoff`
- `npm run sales:update-workflow`
- `npm run sales:assign-workflow`
- `npm run sales:approve-handoff`
- `npm run sales:reject-handoff`
- `npm run sales:block-handoff`
- `npm run sales:complete-handoff`
- `npm run sales:archive-workflow`
- `npm run sales:workflow-report`
- `npm run sales:workflow-validate`

No workflow sends email, browses websites, syncs CRM, approves sources automatically, approves Executive gates automatically, or submits proposals.
