# Sales Integration Runtime

The Sales integration runtime prepares the Sales Agent for future CRM, email, Stripe, and proposal systems while keeping current behavior safe.

## Modes

The adapter supports:

- `mock`: local browser state only.
- `live_read_only`: future live CRM readiness checks, with writes blocked.

Live mode is read-only in Phase 21. It does not send emails, create Stripe invoices, update CRM records, or write production business tables.

## Adapter Boundary

The adapter exposes:

- Integration mode.
- CRM readiness status.
- Read-only state.
- External action enabled or blocked state.
- Blocked external action count.
- Safety label.

This lets the Sales page and Executive Dashboard show readiness without creating a production write path.

## Import And Export

Sales imports support JSON only for local lead records. Imported rows are validated before persistence.

Sales exports support:

- Pipeline JSON.
- Pipeline Markdown.
- Pipeline CSV.
- Follow-up Markdown.
- Proposal prep Markdown.

CSV export escapes spreadsheet-formula-like values before download.

## Future Integrations

Future CRM, Stripe, email, and proposal actions must be added behind explicit approval gates with dry-run previews and audit logs.
