# Finance Agent Hardening

- Treat billing, revenue, commission, subscription, and payout records as highly sensitive.
- Do not expose payment identifiers, raw Stripe payloads, bank details, or payout details in exports.
- Never write to Stripe, change payouts, issue refunds, alter prices, or modify subscriptions from this phase.
- Mark forecasts and commission calculations as draft until reviewed by a human.
- Escalate discrepancies, missing source data, and approval gaps instead of attempting correction writes.
