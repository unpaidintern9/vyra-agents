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
