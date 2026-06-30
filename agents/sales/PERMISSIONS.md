# Sales Agent Permissions

## Current Permissions

- Read local/mock sales records.
- Write browser localStorage records.
- Append local Agent Runtime activity.
- Append local audit logs.
- Export local JSON and Markdown reports.

## Explicitly Disabled

- Email sends.
- SMS sends.
- Stripe invoice creation.
- CRM production updates.
- Production business table writes.
- Direct browser writes to protected Supabase business tables.

## Future Permissions

Any future external send, CRM write, billing action, or production write must be approval-gated and auditable.
