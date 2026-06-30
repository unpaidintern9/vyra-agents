# Sales Prospect Intake

The Prospect Intake panel captures gym prospect details locally before Vyra connects a real CRM, email, Google Workspace, or public research automation.

## Intake Fields

The local form captures:

- Gym name.
- City and state.
- Business type.
- Website.
- Instagram or social link.
- Owner or contact name.
- Contact email and phone.
- Current software.
- Pain points.
- Estimated members.
- Estimated coaches.
- Migration complexity.
- Notes.

## Local Persistence

Saved intake records persist only in browser localStorage:

```text
vyra-agents:sales-prospect-intakes
```

The dashboard also generates a deterministic research dossier and stores it locally:

```text
vyra-agents:sales-prospect-dossiers
```

## Validation

The intake panel shows a missing-info checklist before saving. Missing fields do not block local saving, but they lower dossier confidence and appear in Executive signals.

## Safety Boundaries

- No external browsing.
- No emails sent.
- No Stripe invoices created.
- No CRM records written.
- No production business data written.
- No automated scraping jobs.
- LocalStorage only.
