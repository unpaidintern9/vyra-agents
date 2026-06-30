# Sales Agent

The Sales Agent is the first local business department agent in the Vyra Agents dashboard.

It helps Robert track leads, prospects, pipeline stage, follow-ups, proposal prep, and sales activity without contacting anyone or writing to production systems.

## Current Scope

The Sales Agent MVP includes:

- Sales summary cards.
- Local lead queue.
- Gym prospect tracker.
- Coach prospect tracker.
- Quote and proposal prep.
- Proposal Builder for deterministic local proposal drafts.
- Follow-up planner.
- Deterministic lead scoring and priority labels.
- Follow-up queue for overdue, due today, proposal-needed, stalled, and missing-info reminders.
- Local sales activity timeline.
- JSON and Markdown report exports.
- Shared runtime workflows for Sales activity.
- Integration readiness panel for mock and live read-only modes.
- JSON lead import with validation before local persistence.
- CSV pipeline export.
- Lead scoring Markdown export.
- Follow-up queue Markdown export.
- Weighted pipeline JSON export.
- Proposal draft Markdown and JSON exports.
- Disabled future external action placeholders for email, Stripe, and CRM writes.

## Local Storage

Sales records persist in browser localStorage:

- `vyra-agents:sales-leads`
- `vyra-agents:sales-activities`
- `vyra-agents:sales-proposals`

These are local browser records, not CRM records.

## Pipeline Stages

Supported stages are:

- `new`
- `contacted`
- `qualified`
- `demo_scheduled`
- `proposal_needed`
- `proposal_sent`
- `negotiating`
- `won`
- `lost`
- `paused`

## Safety Boundaries

- No AI.
- No emails sent.
- No Stripe invoices created.
- No CRM production writes.
- No production business table writes.
- No changes to `Vyra-Part-1`.
- Proposal and quote prep are local planning records only.
- Live mode remains read-only.
- Future external actions are blocked until explicit approval gates exist.

## Runtime Integration

Sales local actions append normal Agent Runtime activity, audit logs, and workflow dry-check records. Those records can sync through the approved agent-memory Edge Function path when configured, or fall back to localStorage.

Sales lead and proposal records themselves are not written to production.

## Lead Scoring

Lead scoring is deterministic and explainable. Each lead receives a local score, priority label, prospect segment, weighted pipeline value, and factor-by-factor rationale.

See `docs/SALES_LEAD_SCORING.md`.

## Follow-Up Engine

The follow-up queue converts local lead state into reminders for Robert. It never sends emails, creates CRM tasks, or triggers invoices.

See `docs/SALES_FOLLOW_UP_ENGINE.md`.

## Proposal Builder

The Proposal Builder generates local draft proposals for gym, coach, white-label, app-for-gyms, and migration/import prospects. Drafts are deterministic, exportable, and clearly labeled draft only, not sent, not invoiced, and local only.

See `docs/SALES_PROPOSAL_BUILDER.md`.

## Integration Readiness

The Sales integration adapter reports whether the Sales Agent is in local mock mode or live read-only mode. Live mode is readiness-only and does not create a write path.

## Future Integrations

Future CRM, email, Stripe, or external-send workflows must be approval-gated and must preserve the current local preview-first behavior.
