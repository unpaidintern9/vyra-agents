# Sales Proposal Builder

Phase 23 adds a local Proposal Builder MVP to the Sales Agent.

The builder is implemented in `dashboard/src/agents/sales/salesProposalBuilder.ts`.

## Safety Model

- Draft only.
- Not sent.
- Not invoiced.
- Local only.
- No emails are sent.
- No Stripe invoices are created.
- No CRM records are written.
- No production business data is modified.

## Templates

Supported deterministic templates:

- Independent Coach.
- Gym OS.
- App for Gyms.
- White Label.
- Migration / Data Import.

The dashboard can infer a suggested template from the selected local lead and proposal prep data, but Robert can choose another template before generating a draft.

## Draft Inputs

Drafts are generated from local dashboard state:

- Prospect name.
- Prospect type.
- Pain points.
- Recommended Vyra package.
- Estimated value.
- Setup or migration fee.
- Monthly price.
- Next step.
- Follow-up date.

No connector or production system is queried while drafting.

## Proposal Status

Drafts can be summarized as:

- `ready_for_review`
- `needs_pricing`
- `risk_review`
- `draft_only`

Risk flags include missing future contact information, paused leads, missing pricing, and migration scope review.

## Exports

Each saved draft can be exported as:

- Markdown.
- JSON.

Exports are generated in the browser through the existing local report exporter. Exporting does not send the proposal, create an invoice, write CRM notes, or touch production data.

## Executive Signals

The Executive Dashboard shows:

- Proposal drafts created.
- Proposals missing pricing.
- Proposals ready for review.
- Proposal risk count.

Proposal risk can also appear in the Executive priority list as local review work.
