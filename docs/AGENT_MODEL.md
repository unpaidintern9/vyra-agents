# Agent Model

Agents are operational roles with a defined purpose, scope, permissions, and workflow surface.

## Shared Runtime

As of Phase 18, agents inherit from the shared Agent Runtime in `dashboard/src/runtime/`.

New agents should be added through the runtime registry instead of creating separate implementations for permissions, health, memory, workflows, approvals, audit, activity, or sync.

The shared runtime model is:

```text
Agent Runtime
  -> Agent Registry
  -> Agent Lifecycle
  -> Permissions
  -> Health
  -> Workflows
  -> Activity
  -> Audit
  -> Memory
  -> Approvals
  -> Sync
```

As of Phase 27, agents can also contribute to a local Cross-Agent Collaboration graph. The graph links shared planning entities such as organizations, prospects, proposals, migration plans, feature requests, engineering blockers, follow-ups, activities, and Executive priorities.

The collaboration graph is read-only and derived from local/mock dashboard state. It is a planning layer, not a production write path.

As of Phase 28, AI coding assistants can operate the ecosystem through a shared Operator command interface. The interface is tool-agnostic and supports Codex, Claude, and future approved assistants through operator metadata rather than assistant-specific workflows.

As of Phase 34, agents can coordinate work through a Shared Task System. The task system supports local create, assign, claim, reassign, escalate, complete, and archive actions for Executive, Engineering, Sales, Migration, Support, Operations, Customer Success, Research, and future agents.

As of Phase 35, agents can inspect local Connector Readiness models for GitHub, Gmail, Google Calendar, Stripe, Supabase, Twilio/SMS, and Google Drive. Connector models map future actions to approval types, but all connector write actions remain disabled placeholders.

## Immediate Agents

- Executive Agent: Aggregates shared runtime status into a deterministic operations dashboard for Robert.
- Engineering Agent: Tracks technical health across Vyra repositories.
- Migration Agent: Owns gym onboarding and member migration workflows.
- Sales Agent: Tracks local/mock leads, prospects, follow-ups, proposal prep, and pipeline summaries.
- Products Agent: Tracks product areas across mobile, desktop, website, and gym software.
- Operations Agent: Tracks workflows, approvals, integrations, and system operations.

## Executive Agent

As of Phase 19, the Executive Agent owns the Overview screen. It consumes the shared runtime and renders overview cards, deterministic priorities, timeline activity, department health, aggregated approvals, runtime summary, and local reports.

The Executive Agent does not replace Engineering or Migration. It orchestrates their runtime signals and links back into those dedicated pages.

## Sales Agent

As of Phase 20, the Sales Agent is a local/mock department agent. It owns lead queue review, gym and coach prospect tracking, quote/proposal preparation, follow-up planning, activity timeline, and local report exports.

The Sales Agent does not send emails, create Stripe invoices, update CRM records, or write production business data. Future external actions must be approval-gated.

As of Phase 27, Sales can publish local opportunity, proposal, follow-up, and requested-feature signals into the Cross-Agent Collaboration graph for Executive review.

## Cross-Agent Collaboration

The Cross-Agent Collaboration layer connects department signals without enabling external action.

- Sales publishes opportunity and proposal review signals.
- Migration publishes readiness signals.
- Engineering publishes blocker signals.
- Executive reads combined priorities.

Supported relationship types include `requested_feature`, `blocked_by`, `related_to_migration`, `sales_opportunity_for`, `executive_priority_for`, `requires_follow_up`, `needs_approval`, and `ready_for_review`.

See `docs/CROSS_AGENT_COLLABORATION.md` and `docs/VYRA_KNOWLEDGE_GRAPH.md`.

## AI Operator Interface

The shared operator interface exposes root npm commands for status, run, Executive summary, reports, safety checks, graph export, and validation.

Reports include operator name, operator tool, optional version, timestamp, git branch, git commit, integration mode, and safety mode.

See `docs/AI_OPERATOR_GUIDE.md`, `docs/AI_OPERATOR_RUNTIME.md`, and `docs/MULTI_OPERATOR_WORKFLOW.md`.

## Shared Work Queue

The shared work queue is the primary local coordination mechanism for cross-agent work. It records task status, priority, category, ownership, due dates, linked entities, related graph nodes, and activity logs.

Tasks are local planning records only. They can point to proposals, migrations, follow-ups, engineering blockers, research dossiers, organizations, or Executive priorities, but they do not perform external actions.

See `docs/SHARED_TASK_SYSTEM.md`, `docs/AGENT_WORK_QUEUE.md`, and `docs/TASK_LIFECYCLE.md`.

## Connector Readiness

Connector readiness is a local planning layer for future tool access. It records required config names, allowed read actions, blocked write actions, approval requirements, and safety mode.

The readiness layer does not create provider clients, call APIs, expose secrets, or write production data.

See `docs/CONNECTOR_READINESS.md`, `docs/CONNECTOR_APPROVAL_MAPPING.md`, and `docs/CONNECTOR_SAFETY.md`.

## Planned Agents

- Support Agent
- Sales Agent
- Marketing Agent
- Finance Agent
- Analytics Agent

## Default Behavior

Agents begin as read-only observers. They may report status, flag risks, create draft tasks, and prepare recommendations. They must not deploy, delete, bill, email customers, change permissions, or alter production data without a future approval system.

Phase 18 does not add AI and does not enable production writes. Production writes and external sends remain disabled by default in the shared permission model.
