# Internal Agent Email Reports

Vyra agents can prepare email-ready summaries for internal recipients.

Supported report types:

- Executive daily summary
- Sales summary
- Engineering summary
- Task queue summary
- Connector readiness summary
- Cross-agent review summary

Reports are internal only and may be manually triggered or auto-scheduled. Matthew remains `missing_email` until `VYRA_EMAIL_MATTHEW` is configured.

## Boundaries

- No external marketing emails.
- No bulk outbound campaigns.
- No customer emails.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No secrets in drafts, reports, or audit logs.
