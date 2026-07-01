# Relationship Graph

Phase 51 adds a local relationship graph for Sales.

## Nodes

The graph links:

- Organizations
- Contacts
- Opportunities
- Research intake
- Reports
- Proposal prep records
- Workflows
- Executive reviews

## Edges

Each edge records source ID, target ID, relationship type, confidence, reason, and related artifact IDs.

Relationship graph data is used by the Sales dashboard, Executive relationship summary, Operator contact queue, CLI reports, and local validation.

## Timelines

Organization and contact timelines record local changes and important linked activity. Timeline events are deterministic and auditable.

## Safety

The graph never performs autonomous relationship changes. It does not browse, send messages, sync CRM data, submit proposals, approve sources, approve Executive gates, or merge duplicates automatically.

## Cross-Agent Expansion

Phase 52 expands the relationship graph beyond Sales organization intelligence into shared cross-agent memory. The graph now supports organizations, contacts, opportunities, workflows, proposals, sources, research intake, reports, tasks, Executive reviews, contract opportunities, and future marketing assets.
