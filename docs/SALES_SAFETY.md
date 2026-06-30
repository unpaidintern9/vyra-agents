# Sales Safety

The Sales Agent is safe by default.

## Current Guarantees

- No AI.
- No emails sent.
- No Stripe invoices created.
- No production CRM writes.
- No production business table writes.
- No direct browser writes to protected production tables.
- Local lead import validates before saving.
- Future external action buttons are disabled.

## Live Read-Only Mode

Live mode is readiness-only in Phase 21. It can label the dashboard as `LIVE READ-ONLY`, but it still blocks:

- Email sending.
- Stripe invoice creation.
- CRM record writes.

Any future write action must require explicit approval and must write through an approved backend path, not direct browser writes.

## Import Safety

JSON imports are rejected when:

- The payload is not an array or `{ "leads": [...] }`.
- A row is not an object.
- Required names are missing.
- Email format is invalid.
- Estimated value is negative.
- Imported IDs duplicate existing local lead IDs.

Rejected imports do not persist.

## Export Safety

Reports download locally. CSV cells that begin with spreadsheet-formula characters are prefixed before export.
