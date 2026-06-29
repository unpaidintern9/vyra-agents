# Migration Agent Workflows

## migration-import-review

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

Review source files, schema mapping, duplicate indicators, missing fields, and gym-specific membership states.

## migration-validation

Validate staged records before any live accounts or organization memberships are finalized.

