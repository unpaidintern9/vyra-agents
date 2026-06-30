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

## Planned Agents

- Support Agent
- Sales Agent
- Marketing Agent
- Finance Agent
- Analytics Agent

## Default Behavior

Agents begin as read-only observers. They may report status, flag risks, create draft tasks, and prepare recommendations. They must not deploy, delete, bill, email customers, change permissions, or alter production data without a future approval system.

Phase 18 does not add AI and does not enable production writes. Production writes and external sends remain disabled by default in the shared permission model.
