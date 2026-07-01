# Proposal Prep Queue

Phase 49 adds a local proposal prep queue derived from Sales workflow handoffs.

Each queue item shows opportunity, company, readiness percent, missing info, source confidence, verification status, Executive approval status, proposal status, and next action.

The queue is preparation-only. It does not submit proposals, send emails, create invoices, write CRM records, or publish customer-facing material.

Use:

- `npm run sales:proposal-queue`
- `npm run sales:workflow-report`
- `npm run sales:workflow-validate`

Proposal prep handoffs should not move to completion until required inputs are present, research verification is reviewed, and any Executive approval dependency has been handled manually.
