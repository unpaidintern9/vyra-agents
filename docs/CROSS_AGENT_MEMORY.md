# Cross-Agent Memory

Phase 52 adds a local shared memory layer for Vyra Agents.

## Purpose

Cross-agent memory lets Sales, Executive, Operator, Proposal Prep, Contract Intelligence, and future Marketing workflows reference the same trusted entities, facts, relationships, conflicts, and audit history.

## Storage

The file-backed store lives at:

```text
codex-agent-threads/shared/agent-memory/shared-memory.json
```

Reports are written locally under:

```text
reports/agents/memory
```

No external database, CRM, email system, proposal platform, or website is contacted.

## Entities

Supported entity types include organization, contact, opportunity, workflow, proposal, research source, research intake, report, task, approval, contract, market segment, brand asset, note, and artifact.

Every entity includes owner, related agents, aliases, source references, confidence, risk, status, tags, timestamps, and audit history.

## Facts

Facts are source-backed where possible. A fact update creates a replacement fact and marks the previous fact as superseded instead of silently overwriting it.

## Safety

Shared memory is advisory. It does not browse, send email, sync CRM records, submit proposals, approve sources, approve Executive gates, merge records, or hide fact history.

## Phase 53 Task Links

Universal tasks can link shared memory facts, entities, and reports through local IDs. Memory maintenance tasks appear in the Memory Queue and Operator queues when conflicts, stale facts, or missing verification require human review.

Task links do not resolve memory automatically. They preserve auditability and keep conflict resolution manual.

## Phase 54 Planning Confidence

Executive planning uses shared memory conflicts, risky facts, and confidence signals as advisory blockers. Low-confidence facts can increase attention scores, but the planning engine never overwrites memory or resolves conflicts automatically.

## Phase 55 Marketing References

Marketing uses shared memory brand asset and market segment records where useful, and it can reference Sales organizations, opportunities, Executive goals, and task IDs.

Marketing does not duplicate customer records unnecessarily. Marketing memory references are planning-only and do not publish, email, post, sync CRM data, or approve content automatically.

## Phase 57 Asset References

The Asset & Knowledge Library references shared memory entities, tasks, goals, campaigns, products, organizations, and reports through local IDs.

Assets remain metadata references under `codex-agent-threads/shared/assets/`; shared memory can point to assets, but it does not copy files, approve assets, replace files, sync externally, or publish resources.
