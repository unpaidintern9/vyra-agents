# Customer Success Agent

Phase 58 adds the local Customer Success & Onboarding Agent for Vyra Performance.

Storage lives under:

```text
codex-agent-threads/shared/customer-success/
```

The agent manages local customer records, onboarding plans, onboarding templates, milestones, health evaluations, support records, renewal queues, expansion opportunities, journey transitions, and reports.

Commands:

- `npm run success:customers`
- `npm run success:create-customer`
- `npm run success:onboarding`
- `npm run success:templates`
- `npm run success:milestones`
- `npm run success:health`
- `npm run success:support`
- `npm run success:renewals`
- `npm run success:expansion`
- `npm run success:report`
- `npm run success:validate`

Safety:

- Local only.
- No automatic customer emails.
- No automatic customer messaging.
- No automatic account updates.
- No external CRM synchronization.
- No automatic renewals.
- No autonomous support responses.
- No billing changes.

## Phase 59 Revenue Context

Customer Success now includes Renewal Readiness, Revenue Health, Expansion Opportunities, and Churn Exposure from the local Finance Agent.

These records help prioritize retention and expansion planning, but they do not renew subscriptions, change billing, send invoices, collect payments, update Stripe, or sync accounting.
