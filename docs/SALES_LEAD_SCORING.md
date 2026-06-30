# Sales Lead Scoring

Phase 22 adds deterministic local scoring for Sales Agent leads.

The scoring engine is implemented in `dashboard/src/agents/sales/salesScoring.ts`.

## Safety Model

- No AI is used.
- No emails are sent.
- No Stripe invoices are created.
- No CRM records are written.
- No production business data is modified.
- Scores are local planning signals only.

## Prospect Segments

Each lead is classified into one segment:

- `gym_prospect`
- `independent_coach`
- `gym_affiliated_coach`
- `white_label_prospect`
- `migration_prospect`

Segment detection uses existing local lead fields, proposal metadata, product fit notes, and migration indicators.

## Score Factors

Scores are transparent and capped from 0 to 100.

Factors include:

- Prospect type.
- Estimated monthly value.
- Urgency.
- Follow-up due date.
- Proposal needed.
- Stalled stage.
- Missing contact info.
- Last activity age.
- Fit for Vyra products.

The Sales page shows a "Why This Score?" panel with every factor, point value, and detail.

## Priority Labels

The engine assigns one of:

- Hot
- Warm
- Nurture
- Needs Info
- At Risk

Missing contact fields force `Needs Info`. Paused, lost, stale, or very low-score leads can become `At Risk`.

## Weighted Pipeline

Weighted pipeline value is:

```text
lead estimated value * score / 100
```

This produces an explainable local estimate for the Executive Dashboard and weighted pipeline JSON export.

## Exports

Available exports:

- Lead Scoring Report Markdown.
- Weighted Pipeline JSON.

Both exports are generated in the browser and do not write to CRM or production systems.
