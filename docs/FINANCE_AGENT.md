# Finance Agent

Phase 59 adds the local Finance & Revenue Intelligence Agent for Vyra Performance.

Storage lives under:

```text
codex-agent-threads/shared/finance/
```

The Finance Agent creates local revenue records, pricing references, subscription references, renewal forecasts, expansion forecasts, revenue health records, deterministic reports, and audit history.

Commands:

- `npm run finance:overview`
- `npm run finance:revenue`
- `npm run finance:mrr`
- `npm run finance:arr`
- `npm run finance:forecast`
- `npm run finance:pricing`
- `npm run finance:subscriptions`
- `npm run finance:renewals`
- `npm run finance:expansion`
- `npm run finance:report`
- `npm run finance:validate`

Safety:

- Local only.
- No Stripe mutations.
- No billing updates.
- No payment collection.
- No invoice sending.
- No payout processing.
- No accounting synchronization.
- No autonomous financial actions.

## Phase 62 Finance Analytics

The Finance dashboard includes Revenue Trend Insights, Forecast Confidence, and Renewal/Expansion Signals from the local Analytics & Insights Agent.

Analytics are advisory and local. They do not mutate Stripe, change billing, collect payments, send invoices, sync accounting, install tracking, or execute financial actions.
