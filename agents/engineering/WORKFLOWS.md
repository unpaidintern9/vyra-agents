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
