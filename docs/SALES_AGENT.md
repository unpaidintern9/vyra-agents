# Sales Agent

The Sales Agent is the first local business department agent in the Vyra Agents dashboard.

It helps Robert track leads, prospects, pipeline stage, follow-ups, proposal prep, and sales activity without contacting anyone or writing to production systems.

Phase 46A adds local Sales execution: the agent can run prospect searches, generate research dossiers, export execution reports, prepare shared local tasks, and create draft-only email records.

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
- Sales Agent Team roster with Head Sales and specialized local sub-agents.
- Local Prospect Research Command Center for MMA/BJJ, CrossFit, small gym, boutique fitness, and sports performance targets.
- Seed target-market slots for Louisville, Cincinnati, Los Angeles, and New York.
- Prospect Intake form for structured local gym prospect capture.
- Deterministic Research Dossier generator with fit explanation, missing-info checklist, and Markdown/JSON exports.
- Unified Sales Intelligence dashboard with organization profiles, relationship graph, organization timeline, connected records, and migration readiness.
- Cross-Agent Collaboration section linking Sales opportunities to Engineering blockers, Migration readiness, Executive priorities, requested features, and approval-needed items.
- Disabled future external action placeholders for email, Stripe, and CRM writes.
- Sales Agent Execution Dashboard with active prospects, research status, report status, dossiers, outreach plans, follow-up plans, missing info, and next recommended action.
- Active recommended prospect searches that populate filters, run local search, and show loading/result/error status.
- Execution report exports for pipeline, prospect research, company dossier, outreach prep, follow-up, ICP fit, proposal prep, executive summary, lead scoring, follow-up queue, and weighted pipeline.
- CLI execution commands for local Sales status, research, reports, outreach drafts, shared tasks, and validation.

## Local Storage

Sales records persist in browser localStorage:

- `vyra-agents:sales-leads`
- `vyra-agents:sales-activities`
- `vyra-agents:sales-proposals`
- `vyra-agents:sales-prospect-research`
- `vyra-agents:sales-prospect-intakes`
- `vyra-agents:sales-prospect-dossiers`

These are local browser records, not CRM records.

CLI reports are written to `reports/agents/sales`. CLI shared tasks and draft emails are written under `codex-agent-threads/shared`.

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
- No external customer emails are sent automatically.
- No Stripe invoices created.
- No CRM production writes.
- No production business table writes.
- No private, restricted, login-gated, paywalled, or rate-limit-bypassed scraping.
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

## Sales Agent Team

The Sales page now models a Head Sales Agent plus specialized sub-agents for prospect discovery, public research planning, data organization, ICP fit scoring, outreach prep, meeting prep, proposal building, migration planning, CRM design, follow-up, sales intelligence, and safety approval.

These are Vyra dashboard modules, not Codex background threads. They do not send messages, scrape websites, create invoices, or write CRM records.

See `docs/SALES_PROSPECT_RESEARCH.md`.

## Prospect Intake And Research Dossiers

The Sales page can save structured prospect intake records and generate deterministic research dossiers from those local fields. Dossiers include business overview, ICP fit, likely pain points, recommended Vyra product, migration opportunity, outreach angle, proposal angle, missing info, risks, and next steps.

See `docs/SALES_PROSPECT_INTAKE.md` and `docs/SALES_RESEARCH_DOSSIERS.md`.

## Sales Intelligence Graph

The Sales Intelligence layer links local prospects, organizations, coaches, proposals, follow-ups, migration plans, research dossiers, and activities. It powers organization profiles, relationship depth, timeline events, proposal coverage, migration readiness, and Executive completeness signals.

See `docs/SALES_INTELLIGENCE_GRAPH.md` and `docs/SALES_ORGANIZATION_GRAPH.md`.

## Cross-Agent Collaboration

Sales now contributes local opportunity, proposal, follow-up, requested-feature, and approval-needed signals to the Cross-Agent Collaboration graph. Executive reads those signals alongside Engineering and Migration status to identify blocked opportunities, migration-linked opportunities, proposals needing approval, and organizations needing review.

Exports include Cross-Agent Collaboration Report Markdown, Cross-Agent Graph JSON, and Executive Priority Queue Markdown.

See `docs/CROSS_AGENT_COLLABORATION.md` and `docs/VYRA_KNOWLEDGE_GRAPH.md`.

## Integration Readiness

The Sales integration adapter reports whether the Sales Agent is in local mock mode or live read-only mode. Live mode is readiness-only and does not create a write path.

## Future Integrations

Future CRM, email, Stripe, or external-send workflows must be approval-gated and must preserve the current local preview-first behavior.

## Phase 46A Execution

Use these local commands:

- `npm run sales:status`
- `npm run sales:research`
- `npm run sales:reports`
- `npm run sales:outreach`
- `npm run sales:tasks`
- `npm run sales:validate`

See `docs/SALES_AGENT_EXECUTION.md`, `docs/SALES_RESEARCH_WORKFLOW.md`, `docs/SALES_REPORTS.md`, and `docs/SALES_SAFE_WEB_RESEARCH.md`.
