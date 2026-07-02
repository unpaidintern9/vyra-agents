# Engineering Agent

The Engineering Agent is the first practical Vyra agent MVP. It is a read-only repository intelligence agent that helps Robert understand where code, routes, Supabase assets, dependencies, scripts, and docs live across the Vyra ecosystem.

## Current Scope

- Scan local repositories only.
- Build a static knowledge graph JSON file.
- Store metadata only, never file contents.
- Record environment variable names only, never values.
- Ignore `.env`, `.env.local`, production env files, binaries, build output, and dependency folders.
- Display graph summaries, search, selected-node details, relationships, and impact analysis in the dashboard Engineering page.
- Export graph, node detail, node impact, table impact, route/screen impact, migration history, and full impact reports.
- Map owners, feature areas, repo health scores, orphan candidates, missing docs, and relationship warnings.
- Generate a local planning-only Engineering Fix Queue from graph findings.
- Generate local/export-only GitHub issue drafts from fix queue groups.

## Explicit Boundaries

- No AI is implemented.
- No autonomous code-writing agent is implemented.
- No production business data is modified.
- No production app tables are written.
- No secrets are exposed or committed.
- Agent Memory sync, when enabled, uses only the approved Edge Function path and approved `agent_*` tables.

## How It Helps Future AI

The graph gives future AI features a safer map of the codebase before any reasoning or code generation is enabled. It can answer structural questions such as where routes, components, migrations, Supabase functions, and docs live without needing to read every file at runtime.

## Phase 10 Drill-Down

The Engineering page can now help answer:

- What depends on this?
- What does this depend on?
- Which routes/screens touch this table?
- Which migrations created or changed this table?
- Which Edge Functions reference this table?
- Which repo owns this file/component/function?
- Which dependency is used where?
- What could break if this node changes?

## Phase 11 Ownership + Health

The Engineering Agent can now help answer:

- Who owns this?
- What product area does this belong to?
- What screens touch this table?
- What functions touch this table?
- What routes use this component?
- What repo has the most risk?
- What files or nodes are orphan candidates?
- What important things appear to be missing docs?
- Which relationships look broken?

All findings are local metadata heuristics. Orphan, missing-doc, risk, and broken-relationship results are advisory only and do not trigger code changes, schema changes, or production writes.

## Phase 12 Fix Queue

The Engineering page now turns graph findings into a local backlog Robert can review:

- missing documentation tasks
- orphan review tasks
- broken relationship investigation tasks
- repo health improvement tasks
- high-risk node planning tasks

Task actions are local only: reviewed, dismissed, planned, done, and reset. No GitHub issues are created, no app repos are modified, and no code changes are made from this queue.

## Phase 13 GitHub Issue Drafts

The Engineering page can group fix queue items into local GitHub issue drafts with priorities, labels, Markdown bodies, and approval-required status. Drafts can be copied or exported, but the dashboard does not create GitHub issues or write to GitHub.

## Phase 61 Product Operations

The Engineering Agent now includes the Engineering & Product Operations Agent for Vyra Performance.

It manages local product records, feature records, roadmap records, issue records, release planning records, product feedback, deterministic health evaluations, and report generation under:

```text
codex-agent-threads/shared/engineering/
```

Commands:

- `npm run engineering:products`
- `npm run engineering:features`
- `npm run engineering:roadmaps`
- `npm run engineering:issues`
- `npm run engineering:releases`
- `npm run engineering:feedback`
- `npm run engineering:health`
- `npm run engineering:roadmap-report`
- `npm run engineering:release-report`
- `npm run engineering:validate`

The dashboard Engineering page includes Product Portfolio, Feature Board, Roadmaps, Bug Tracker, Release Planning, Product Feedback, and Engineering Health sections.

Safety remains strict: local only, no GitHub mutations, no deployments, no CI/CD mutations, no App Store publishing, no autonomous code generation, no automatic releases, and no autonomous merges.

## Phase 62 Engineering Analytics

The Engineering dashboard includes Engineering Velocity, Release Readiness Trends, and Bug/Issue Risk Signals from the local Analytics & Insights Agent.

Analytics remain advisory. They do not write GitHub records, deploy code, mutate CI/CD, publish releases, generate code autonomously, merge changes, or execute engineering actions.
