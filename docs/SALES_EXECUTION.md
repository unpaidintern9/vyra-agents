# Sales Execution

Phase 47 makes Sales execution local-first. The Sales Agent manages opportunities, timelines, scores, follow-ups, proposal readiness, and reports without integrating with the existing `vyraapp.fit` Sales CRM.

Phase 49 adds local workflow orchestration for Sales handoffs into Operator, Executive, and Proposal Prep.

All execution is deterministic and auditable. External email, external browsing, CRM synchronization, proposal sending, Stripe writes, and Supabase production writes remain blocked.

## Commands

- `npm run sales:opportunities`
- `npm run sales:create-opportunity`
- `npm run sales:update-opportunity`
- `npm run sales:move-stage`
- `npm run sales:timeline`
- `npm run sales:score`
- `npm run sales:followup`
- `npm run sales:proposal-status`
- `npm run sales:archive`
- `npm run sales:restore`
- `npm run sales:merge`
- `npm run sales:dashboard`
- `npm run sales:workflows`
- `npm run sales:create-handoff`
- `npm run sales:update-workflow`
- `npm run sales:assign-workflow`
- `npm run sales:approve-handoff`
- `npm run sales:reject-handoff`
- `npm run sales:block-handoff`
- `npm run sales:complete-handoff`
- `npm run sales:archive-workflow`
- `npm run sales:proposal-queue`
- `npm run sales:workflow-report`
- `npm run sales:workflow-validate`
- `npm run sales:validate`
