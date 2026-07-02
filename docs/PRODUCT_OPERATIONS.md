# Product Operations

Phase 61 adds a local product management workspace for Vyra Performance.

Storage:

```text
codex-agent-threads/shared/engineering/
```

Product records include product ID, name, description, status, owner, version, roadmap, linked goals, KPIs, campaigns, revenue, customers, engineering work, and audit history.

Core commands:

- `npm run engineering:products`
- `npm run engineering:features`
- `npm run engineering:health`
- `npm run engineering:validate`

The workspace integrates with Executive Planning, Marketing, Sales, Customer Success, Finance, Asset Library, Shared Memory, and the Universal Task Engine through local IDs and report references.

No product operation command writes to GitHub, deploys code, mutates CI/CD, publishes app releases, or generates code autonomously.
