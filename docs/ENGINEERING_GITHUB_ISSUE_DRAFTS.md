# Engineering GitHub Issue Drafts

Phase 13 adds local GitHub issue draft planning for Engineering Agent backlog items.

## Scope

Issue drafts are generated from Engineering Fix Queue items. They are local and export-only.

The dashboard does not:

- write to GitHub
- create GitHub issues
- modify app, website, desktop, or backend code
- call AI
- modify production data

Any future GitHub issue creation must be approval-gated.

## Grouping Rules

Drafts are grouped by:

- repo
- issue category
- owner
- feature area
- severity
- node type where practical

This avoids creating one GitHub issue per backlog item.

## Priority Rules

Backlog severity maps to priority:

- critical: P0
- high: P1
- medium: P2
- low: P3

Sensitive-domain overrides can raise priority to P0/P1 for auth, billing, health data, RLS, organization membership, migration integrity, payment/subscription, service role, or secrets-related drafts.

## Draft Template

Each draft includes:

- summary
- why it matters
- affected area
- source backlog items
- recommended action
- validation checklist
- safety notes

## Local Status Actions

Draft statuses are local only:

- Mark Ready
- Mark Draft
- Dismiss
- Mark Exported

Statuses persist in browser localStorage under:

```text
vyra-agents:engineering-issue-draft-status
```

## Exports

The dashboard can export:

- selected issue draft Markdown
- all issue drafts Markdown
- all issue drafts JSON
- ready-for-GitHub drafts Markdown
- P0/P1 drafts Markdown

## Safety

Drafts are not GitHub issues. They are planning artifacts for Robert to review before any future approval-gated GitHub creation workflow.
