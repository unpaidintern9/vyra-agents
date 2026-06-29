# Engineering Impact Analysis

Phase 10 adds drill-down and impact analysis on top of the static Engineering Knowledge Graph.

## Search

The Engineering page searches graph nodes by:

- label
- node type
- repo
- path
- safe metadata values

Search results show label, type, repo, path, connected edge count, status, and an Open action. Opening a result selects the node for detail and relationship exploration.

## Node Details

The selected-node detail panel shows:

- label
- type
- repo
- path
- status
- metadata
- incoming relationship count
- outgoing relationship count
- direct dependencies
- direct dependents

Actions include copying the node ID, exporting a node detail report, exporting an impact report, and clearing the selection.

## Relationship Explorer

Inbound relationships show nodes that point to the selected node. Outbound relationships show nodes the selected node points to.

Filters:

- relationship type
- node type
- repo

## Risk Heuristic

Risk is intentionally simple for the MVP:

- High risk: table, migration, Supabase function, shared service, auth-related file, payment/billing-related file, or health-data-related file.
- Medium risk: many direct dependents or relationships crossing repositories.
- Low risk: isolated or low-connectivity nodes.
- Unknown: not enough signal.

This is a planning aid only. It is not AI and does not make production decisions.

## Table Impact

For table nodes, the page shows detected migrations, RLS policies, Supabase functions, files/services, and possibly affected routes or screens.

## Route / Screen Impact

For route and screen nodes, the page shows owner files, components, hooks/services, referenced tables, and called Supabase functions where detected.

## Migration History

For table and migration nodes, the page shows detected migration files, created tables, altered tables, policies, and related files in chronological filename order where available.

## Safety

- Metadata only.
- No file contents displayed.
- Env variable names only, never values.
- No production writes.
- No AI or autonomous code-writing.
