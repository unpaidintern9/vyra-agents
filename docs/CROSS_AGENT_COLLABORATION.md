# Cross-Agent Collaboration

Phase 27 adds a local cross-agent collaboration foundation for Sales, Executive, Engineering, Migration, and future Support/Success agents.

The collaboration layer is deterministic, local/mock/read-only, and derived from existing dashboard state. It does not browse externally, send email, create Stripe invoices, write CRM records, or write production business data.

## Shared Entities

The shared model supports:

- `organization`
- `prospect`
- `coach`
- `gym`
- `proposal`
- `migration_plan`
- `feature_request`
- `engineering_blocker`
- `follow_up`
- `activity`
- `executive_priority`

Each entity is marked `localOnly: true` and carries only review metadata.

## Relationship Types

Supported cross-agent relationships are:

- `requested_feature`
- `blocked_by`
- `related_to_migration`
- `sales_opportunity_for`
- `executive_priority_for`
- `requires_follow_up`
- `needs_approval`
- `ready_for_review`

Relationships explain why two local records are connected so Robert can review the chain without hidden automation.

## Current Publishers

- Sales publishes active opportunity, proposal, follow-up, and requested-feature signals.
- Migration publishes local readiness signals derived from migration summaries and Sales intelligence.
- Engineering publishes local blocker signals derived from runtime health.
- Executive reads the combined graph and turns it into priority metrics and review prompts.

No publisher performs external actions.

## Sales Page

The Sales page includes a Cross-Agent Collaboration section showing:

- linked engineering blockers
- linked migration readiness
- linked executive priorities
- requested feature signals
- approval-needed items

Exports are local downloads only:

- Cross-Agent Collaboration Report Markdown
- Cross-Agent Graph JSON
- Executive Priority Queue Markdown

## Executive Dashboard

Executive receives combined signals for:

- high-value opportunities blocked by Engineering
- migrations tied to active Sales opportunities
- proposals needing approval
- feature requests tied to prospects
- organizations needing Executive review

These signals are for review and planning only.

## Shared Work Queue

As of Phase 34, cross-agent signals can become local shared tasks. Tasks link Sales opportunities, Engineering blockers, Migration readiness, Executive priorities, follow-ups, proposals, onboarding work, and research dossiers through the Shared Task System.

The task queue adds assign, claim, reassign, escalate, complete, and archive actions. These actions only change ignored local task records and never execute the external work described by the task.

## Safety Boundary

- No external browsing.
- No email sends.
- No Stripe invoice creation.
- No CRM writes.
- No production business writes.
- No direct database writes are introduced.
- Future external actions must be separately gated and approved.
