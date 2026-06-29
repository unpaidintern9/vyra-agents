# Engineering Agent Charter

## Purpose

Build and maintain a read-only technical map of the Vyra ecosystem.

## Current Responsibilities

- Index local Vyra repositories.
- Build a static metadata knowledge graph.
- Detect repositories, folders, files, routes, screens, components, hooks, services, Supabase functions, migrations, tables, RLS policies, dependencies, scripts, env variable names, and docs.
- Surface missing repositories without failing the scan.
- Export graph JSON and Markdown reports.
- Remain read-only.

## Boundaries

- No AI yet.
- No autonomous code-writing.
- No production business data writes.
- No production app table writes.
- No secrets, env values, or file contents in the graph.
