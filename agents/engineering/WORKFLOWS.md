# Engineering Agent Workflows

## engineering-knowledge-graph-scan

```text
Run local scanner
↓
Read repository metadata
↓
Detect safe graph nodes and relationships
↓
Write dashboard/public/engineering-graph.json
↓
Load graph in dashboard
↓
Append Agent Memory run/audit/workflow result
↓
Sync through approved agent-memory Edge Function if configured
```

Mode: local read-only.

Approval required: no.

Production writes: no.

## engineering-impact-analysis

```text
Select graph node
↓
Inspect node details and relationships
↓
Calculate local impact analysis
↓
Export selected report
↓
Append local Agent Memory event, audit log, and workflow result
↓
Sync through approved agent-memory Edge Function if configured
```

Mode: local read-only.

Approval required: no.

Production writes: no.

## engineering-ownership-health-scan

```text
Run local scanner or export ownership/health report
↓
Assign heuristic owners and feature areas
↓
Calculate repo health scores and risk signals
↓
Flag orphan, missing-doc, and broken-relationship candidates
↓
Render dashboard ownership and health sections
↓
Append local Agent Memory event, audit log, and workflow result
↓
Sync through approved agent-memory Edge Function if configured
```

Mode: local read-only.

Approval required: no.

Production writes: no.

Notes:

- Orphan detection is advisory only.
- Missing-doc detection is advisory only.
- Broken relationship warnings are advisory only.
- No AI or autonomous code-writing is implemented.

## engineering-fix-queue-planning

```text
Load Engineering Graph
↓
Convert missing docs, orphan candidates, warnings, high-risk nodes, and repo health scores into local backlog items
↓
Review, dismiss, plan, mark done, or reset local task status
↓
Export planning reports when needed
↓
Append local Agent Memory event, audit log, and workflow result
↓
Sync through approved agent-memory Edge Function if configured
```

Mode: local read-only planning.

Approval required: no.

Production writes: no.

Notes:

- No code changes are made.
- No GitHub issues are created.
- Orphan candidates are review-only.
- Broken relationship warnings require investigation.
- Status persists locally under `vyra-agents:engineering-backlog-status`.

## engineering-github-issue-draft-planning

```text
Load Engineering Fix Queue
↓
Group related backlog items into local GitHub issue drafts
↓
Review draft markdown, labels, priority, and source backlog items
↓
Mark draft, ready, dismissed, or exported locally
↓
Export selected or grouped draft reports
↓
Append local Agent Memory event, audit log, and workflow result
↓
Sync through approved agent-memory Edge Function if configured
```

Mode: local planning.

Approval required: yes, before any future GitHub issue creation.

Production writes: no.

GitHub writes: no.

Notes:

- No GitHub issues are created in this phase.
- Drafts are local/export-only.
- Issue creation requires a future approval-gated phase.
- Status persists locally under `vyra-agents:engineering-issue-draft-status`.

## repo-health-check

```text
Trigger
↓
Collect Data
↓
Rules Engine
↓
Action
↓
Log
↓
Approval if required
↓
Complete
```

Collect repository status, build status, dependency status, open TODOs, missing docs, and deployment metadata.
