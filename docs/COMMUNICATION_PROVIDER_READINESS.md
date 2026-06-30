# Communication Provider Readiness

Phase 32 prepares provider readiness checks for future email and SMS integrations.

This phase does not send messages, create provider clients, or store credentials. It only checks local provider templates and reports whether configuration names are present in the environment.

## Supported Providers

Readiness templates cover:

- Gmail
- Google Workspace SMTP
- SendGrid
- Resend
- Twilio SMS
- Manual copy/paste mode

Templates live in:

```text
codex-agent-threads/shared/providers/
```

Only `*.example.json` provider templates should be committed. They contain example environment variable names only, never values.

## CLI

Run from the repo root:

```bash
npm run comms:providers
npm run comms:provider-check
npm run comms:send-readiness
npm run comms:safety-check
```

The checks are local-only:

- no Gmail calls
- no SMTP connections
- no SendGrid calls
- no Resend calls
- no Twilio calls
- no CRM writes
- no Stripe writes
- no Supabase production writes

## Send Gates

Sending remains impossible in Phase 32 because:

- sending is disabled by default
- provider calls are blocked
- missing approval blocks send
- missing provider config blocks send
- production send mode is unavailable

Manual copy/paste mode is readiness-only. It means the system can prepare text for a human operator to copy outside the app later; the app still sends nothing.
