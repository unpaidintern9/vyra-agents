# Memory Conflict Review

Phase 52 detects shared memory conflicts deterministically and keeps them in a review queue.

## Conflict Types

The local engine detects:

- Conflicting company names
- Duplicate organizations
- Duplicate contacts
- Conflicting emails
- Conflicting phone numbers
- Outdated facts
- Low-confidence facts
- Unsupported facts
- Contradictory source claims

## Review Rules

Conflicts are never auto-resolved. Duplicate candidates are never merged automatically. Fact changes preserve the prior fact as superseded.

Operator and Sales dashboards show review queues. Executive receives risky fact and conflict visibility before decisions.

## CLI

Use:

```text
npm run memory:conflicts
npm run memory:review-conflict
npm run memory:validate
```
