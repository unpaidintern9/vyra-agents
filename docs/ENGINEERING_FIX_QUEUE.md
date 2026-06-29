# Engineering Fix Queue

Phase 12 adds a planning-only Engineering Fix Queue to the Vyra Agents dashboard.

## Purpose

The queue turns existing Engineering Graph findings into a local backlog Robert can review before any implementation work is proposed.

Sources include:

- missing docs candidates
- orphan review candidates
- broken relationship warnings
- repo health scores
- high-risk graph nodes

## Backlog Items

Each item records title, description, category, severity, effort, owner, feature area, repo, optional node ID, recommended action, approval flag, status, and creation time.

Categories include missing docs, orphan review, broken relationship, high-risk node, repo health, dependency, migration, table, function, and route.

## Scoring

Severity is heuristic:

- Critical: auth, billing, health, RLS, membership, or security-related missing docs or broken/risky relationships.
- High: high-risk nodes, repo health below 50, tables/functions/migrations with important impact.
- Medium: missing docs in important areas or active orphan review candidates.
- Low: isolated documentation gaps or low-risk review items.

Effort is heuristic:

- Small: documentation, review, or metadata planning.
- Medium: relationship investigation or function usage review.
- Large: repo-wide health improvement or table/function ownership cleanup.
- Unknown: insufficient signal.

## Local Actions

The dashboard supports local-only task status changes:

- Mark Reviewed
- Dismiss
- Plan
- Mark Done
- Reset Status

Statuses persist in browser localStorage under:

```text
vyra-agents:engineering-backlog-status
```

## Safety

- Advisory only.
- No AI is implemented.
- No autonomous code-writing agents are implemented.
- No code changes are made by the queue.
- No GitHub issues are created.
- No production business data is modified.
- No production app tables are written.
- Orphan candidates are review-only and must not imply deletion.
- Broken relationship warnings require investigation before any fix is planned.

## GitHub Issue Drafts

Phase 13 converts groups of fix queue items into local GitHub issue drafts. Drafts are export-only and do not write to GitHub. Robert must approve any future phase that creates real GitHub issues.
