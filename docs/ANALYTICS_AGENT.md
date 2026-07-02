# Analytics Agent

Phase 62 adds the local Analytics & Insights Agent for Vyra Performance.

Storage lives under:

```text
codex-agent-threads/shared/analytics/
```

Commands:

- `npm run analytics:overview`
- `npm run analytics:company-health`
- `npm run analytics:scorecards`
- `npm run analytics:insights`
- `npm run analytics:risks`
- `npm run analytics:bottlenecks`
- `npm run analytics:trends`
- `npm run analytics:report`
- `npm run analytics:validate`

The agent derives deterministic metrics, scorecards, insights, risks, bottlenecks, trends, and recommendations from existing local records. It references Shared Memory, Universal Task Engine, Executive Planning, Sales, Marketing, Asset Library, Customer Success, Finance, Engineering, and Operator queues without duplicating entities.

Safety: local only, no external analytics sync, no tracking scripts, no autonomous customer data collection, no autonomous emails, no publishing, no billing actions, no deployment actions, and no autonomous external actions.
