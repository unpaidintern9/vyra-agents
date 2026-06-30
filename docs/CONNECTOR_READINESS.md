# Connector Readiness

Phase 35 adds local readiness models for future connector integrations.

Modeled connectors:

- GitHub
- Gmail
- Google Calendar
- Stripe
- Supabase
- Twilio/SMS
- Google Drive

The readiness layer is local/mock/read-only. It does not authenticate, create provider clients, call external APIs, or write production data.

## Model

Each connector records:

- connector name
- status
- required config names
- allowed future read actions
- blocked write actions
- approval requirement
- safety mode
- last check timestamp

Required config values are names only. The system does not store or display real secrets.

## CLI

From the repo root:

```bash
npm run connectors:status
npm run connectors:readiness
npm run connectors:approval-map
npm run connectors:safety-check
npm run connectors:validate
```

`connectors:readiness` generates ignored local Markdown and JSON reports under `reports/agents/runtime/`.

## Dashboard

The Operator Dashboard shows connector readiness, required config names, allowed read actions, blocked write actions, and approval mappings.

The Executive Dashboard shows connector risk summary metrics.

The Sales Dashboard shows disabled connector action placeholders for future sales workflows.
