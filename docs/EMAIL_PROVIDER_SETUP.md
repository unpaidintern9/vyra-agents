# Email Provider Setup

Phase 32 includes email provider templates only. Do not place real values in the repo.

## Gmail

Example environment variable names:

```text
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REDIRECT_URI
GMAIL_ALLOWED_SENDER
```

## Google Workspace SMTP

Example environment variable names:

```text
GOOGLE_WORKSPACE_SMTP_HOST
GOOGLE_WORKSPACE_SMTP_PORT
GOOGLE_WORKSPACE_SMTP_USERNAME
GOOGLE_WORKSPACE_SMTP_PASSWORD
GOOGLE_WORKSPACE_ALLOWED_SENDER
```

## SendGrid

Example environment variable names:

```text
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
SENDGRID_TEMPLATE_ID
```

## Resend

Example environment variable names:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_AUDIENCE_ID
```

## Current Boundary

The app does not connect to any email provider. It only reports readiness, missing config names, and safety gates.

Production sending will require a future explicit phase with provider setup, audited approval gates, rate limits, test mode, and human confirmation.
