# Sales Agent Hardening

## Current Hardening

- Local-first records only.
- No CRM write client.
- No email send path.
- No Stripe invoice path.
- Reports include no production-write behavior.
- Audit entries state that external sends and production writes did not occur.

## Future Hardening Requirements

- Approval gates before CRM writes.
- Approval gates before external emails or SMS.
- Approval gates before Stripe actions.
- Secret redaction in all settings and reports.
- Dry-run previews before every external action.
- Audit log and Agent Runtime event for every approval decision.
