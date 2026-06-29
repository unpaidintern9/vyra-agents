# Engineering Agent

The Engineering Agent is the first practical Vyra agent MVP. It is a read-only repository intelligence agent that helps Robert understand where code, routes, Supabase assets, dependencies, scripts, and docs live across the Vyra ecosystem.

## Current Scope

- Scan local repositories only.
- Build a static knowledge graph JSON file.
- Store metadata only, never file contents.
- Record environment variable names only, never values.
- Ignore `.env`, `.env.local`, production env files, binaries, build output, and dependency folders.
- Display graph summaries in the dashboard Engineering page.
- Export the graph JSON and a Markdown report.

## Explicit Boundaries

- No AI is implemented.
- No autonomous code-writing agent is implemented.
- No production business data is modified.
- No production app tables are written.
- No secrets are exposed or committed.
- Agent Memory sync, when enabled, uses only the approved Edge Function path and approved `agent_*` tables.

## How It Helps Future AI

The graph gives future AI features a safer map of the codebase before any reasoning or code generation is enabled. It can answer structural questions such as where routes, components, migrations, Supabase functions, and docs live without needing to read every file at runtime.
