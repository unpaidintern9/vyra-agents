# Vyra Knowledge Graph

The Vyra Knowledge Graph is the shared local model that lets department agents refer to the same organizations, prospects, proposals, migrations, feature needs, blockers, follow-ups, and Executive priorities.

Phase 27 starts the graph with a local Cross-Agent Collaboration layer. It is not a production data model and it does not create records outside the browser.

## Purpose

The graph helps answer local planning questions such as:

- Which active opportunities are blocked by Engineering readiness?
- Which migrations are connected to Sales opportunities?
- Which proposal drafts need Executive review?
- Which prospect pain points imply future product or feature requests?
- Which organizations need Executive attention before follow-up?

## Data Sources

The graph is derived from local/mock dashboard state:

- Sales leads, proposals, proposal drafts, follow-ups, prospect dossiers, and Sales intelligence.
- Migration summaries and readiness signals.
- Engineering runtime health.
- Executive review rules.

It does not ingest external websites, email, Stripe, CRM, or production tables.

## Entity And Relationship Model

Entities represent local planning objects. Relationships explain why one object matters to another.

Examples:

- A Sales opportunity can be `blocked_by` an Engineering blocker.
- An organization can be `related_to_migration` through migration readiness.
- A prospect can `requested_feature` based on dossier pain points.
- A proposal can `needs_approval` before future external use.

## Runtime Boundary

The Knowledge Graph is read-only and deterministic:

- It is rebuilt from local state.
- It does not call external APIs.
- It does not mutate CRM records.
- It does not send messages.
- It does not create invoices.
- It does not write production business data.

Future live integrations should keep this graph preview-first and approval-gated.

## Shared Task Nodes

Phase 34 publishes local `shared_task` nodes into the Knowledge Graph. Task edges connect to assigned agents, source agents, organizations, linked entities, and related graph node ids.

Supported task relationships include:

- `assigned_to`
- `created_by`
- `related_to`
- `linked_entity`
- `related_graph_node`

Task graph links are local planning metadata. They do not create Supabase records, CRM records, Stripe records, emails, SMS, or production business writes.
