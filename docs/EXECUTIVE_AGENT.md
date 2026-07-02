# Executive Agent

The Executive Agent is Robert's cross-platform operations view for the Vyra Agents dashboard.

It does not add AI, autonomous execution, production writes, invitations, deployments, or direct database writes. It reads the shared Agent Runtime and presents a deterministic command-center view across departments.

## Scope

The Executive Dashboard replaces the previous Overview page as the first screen.

It shows:

- Overall platform health.
- Registered, healthy, warning, and critical agent counts.
- Pending approvals.
- Workflow activity.
- Sync queue state.
- Engineering and Migration operating signals.
- Recent runtime events.
- Deterministic executive priorities.
- Cross-agent timeline.
- Department health table.
- Aggregated approval queue.
- Runtime summary.
- Local report exports.

## Runtime Source

The Executive Agent consumes the Phase 18 runtime from `dashboard/src/runtime/`.

It uses:

- Agent Registry.
- Agent Runtime.
- Workflow Registry.
- Runtime Health.
- Agent Memory.
- Audit activity.
- Sync Queue state.
- Approval Queue state.

The Executive Agent does not duplicate Engineering or Migration logic. Those agents remain the source for their own workflows and pages.

Phase 47 adds read-only Local CRM visibility. Executive summaries include Sales pipeline health, local CRM opportunity health, high-priority opportunities, stalled/follow-up opportunities, executive approvals, and proposal queue signals without writing to `vyraapp.fit` or any external CRM.

Phase 48 adds read-only Research Intelligence visibility. Executive summaries include pending source/intake reviews, approved/rejected source counts, backlog, verification queue, duplicate alerts, confidence trend, and enrichment progress.

Phase 49 adds read-only Sales Approval Queue visibility for high-fit opportunities, risky source reviews, proposal readiness reviews, external action gates, blocked workflows, and workflow health. Executive approvals remain manual and local.

## Navigation

Department health rows and priority actions deep-link into existing dashboard pages:

- Engineering -> Engineering.
- Migration -> Migration.
- Product -> Products.
- Operations, Sales, Support, Finance, and Marketing -> Runtime until dedicated department pages exist.

## Safety Boundaries

- No production writes.
- No production business data changes.
- No Supabase service role key in the browser.
- No direct browser inserts.
- No invitations sent.
- No GitHub writes from Executive Dashboard exports.
- No AI or LLM calls.
# Phase 50 Sales Intelligence Visibility

The Executive dashboard includes an Executive Sales Intelligence Summary with total opportunities, Hot/Warm/Cold counts, Not Ready count, estimated pipeline value, proposal-ready count, Executive-review count, blocked count, and average confidence.

This view is read-only. It does not approve handoffs, browse, email, sync CRM data, approve sources, merge duplicates, or submit proposals.

## Phase 51 Organization Relationship Visibility

The Executive dashboard includes a read-only Executive Relationship Summary with high-value organizations, decision maker coverage, relationship health, buying committee completeness, executive relationship risks, and largest opportunity value.

This summary helps identify where major opportunities need relationship work before proposal or external-action gates. It does not approve proposals, approve Executive gates, browse, send email, sync CRM records, or merge duplicate organizations or contacts.

## Phase 52 Cross-Agent Knowledge Visibility

The Executive dashboard includes a Cross-Agent Knowledge Summary with strategic entities, relationships, risky facts, memory conflicts, duplicate entity queue, and decision-history facts.

This view is read-only and advisory. It does not approve decisions, sync CRM data, browse, email, submit proposals, or merge entities.

## Phase 53 Universal Work Queue

The Executive dashboard includes an Executive Work Queue with Approval Tasks, Strategic Tasks, Blocked Decisions, and Overdue Executive Items.

Executive queue records are local task records from the Universal Task Engine. They can represent manual approval needs, strategic decisions, external-action gates, and blocked cross-agent work, but the dashboard does not approve or execute those actions.

Use `npm run tasks:queue -- --queue "Executive Queue"` and `npm run tasks:dependencies` for local inspection.

## Phase 54 Executive Planning

The Executive dashboard includes Strategic Goals, KPI Scorecard, Initiative Tracker, Executive Decision Log, Blocked Goals, At-Risk Priorities, Goal Progress Timeline, and Agent Contribution Summary.

Planning records live under `codex-agent-threads/shared/executive-planning/` and remain local, deterministic, auditable, and advisory.

See `docs/EXECUTIVE_PLANNING.md`, `docs/GOAL_MANAGEMENT.md`, `docs/KPI_SCORECARD.md`, and `docs/DECISION_LOG.md`.

## Phase 55 Marketing Overview

The Executive dashboard includes Marketing Overview, Brand Health, Campaign Pipeline, Content Progress, and Upcoming Launches.

Marketing records live under `codex-agent-threads/shared/marketing/` and remain local planning records for Vyra Performance. Executive can review brand gaps, pending approvals, and launch readiness, but the dashboard does not publish, post, email, buy ads, sync CRM records, or approve marketing automatically.

## Phase 56 Marketing Draft Pipeline

The Executive dashboard includes Marketing Draft Pipeline, Brand Risk Queue, Campaign Readiness, and Launch Content Status.

Content Studio records live under `codex-agent-threads/shared/marketing/content-studio/`. Executive visibility is read-only and approval-aware; approved drafts remain local drafts and do not publish, email, post, buy ads, sync CRM records, or trigger external actions.

## Phase 57 Asset & Knowledge Visibility

The Executive dashboard includes Executive Knowledge Base, Strategic Documents, Roadmaps, and Policy Library sections from the shared Asset & Knowledge Library.

Asset records live under `codex-agent-threads/shared/assets/`. Executive visibility is read-only and does not approve assets, publish documents, sync files, replace resources, or distribute anything externally.

## Phase 58 Customer Success Visibility

The Executive dashboard includes Customer Health Summary, Renewal Forecast, Expansion Pipeline, Churn Risks, Onboarding Progress, and Adoption KPIs.

Customer Success records live under `codex-agent-threads/shared/customer-success/`. Executive visibility is advisory and does not message customers, update accounts, sync CRM records, renew subscriptions, or answer support requests automatically.

## Phase 59 Finance Visibility

The Executive dashboard includes Executive Revenue Summary, Revenue Forecast, Growth Trends, Expansion Pipeline, Renewal Health, and Revenue Risks.

Finance records live under `codex-agent-threads/shared/finance/`. Executive visibility is advisory and local. It does not mutate Stripe, send invoices, collect payments, sync accounting, change billing, or approve financial actions automatically.

## Phase 61 Engineering Product Visibility

The Executive dashboard and Engineering page can use Product Portfolio Summary, Roadmap Progress, Release Readiness, Engineering Risks, and Product Health from the local Engineering & Product Operations Agent.

Engineering product records live under `codex-agent-threads/shared/engineering/`. Executive visibility is advisory and does not approve releases, merge code, write GitHub records, deploy software, mutate CI/CD, publish to app stores, or trigger autonomous code generation.
