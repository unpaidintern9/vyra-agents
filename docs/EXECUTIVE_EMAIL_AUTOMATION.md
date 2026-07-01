# Executive Email Automation

Executive email automation is a narrow internal reporting workflow for the Executive Agent.

## Flow

1. Build the Executive Operations Center snapshot.
2. Render the daily briefing email model.
3. Resolve internal recipients from the Gmail connector model.
4. Preview the email body and reports locally.
5. On explicit send command, create Gmail draft records.
6. Delegate send attempts to `scripts/gmail-email-runtime.mjs`.
7. Record Gmail audit entries for sent, skipped, or failed attempts.

## Schedule Support

The schedule template lives at:

```text
codex-agent-threads/shared/schedules/executive-daily-email-briefing.schedule.example.json
```

It is a manual scheduled-thread-run template. It does not start a background job.

## Recipient Rules

- Robert: enabled by default.
- Matthew: skipped until `VYRA_EMAIL_MATTHEW` is configured.
- External customers: unsupported.
- Bulk lists: unsupported.

## Safety Gates

Executive email automation inherits Gmail safety:

- approved senders only
- internal recipients only
- valid subject and body
- Gmail connector config required
- Gmail audit required
- missing recipient config skips safely

It also preserves global Executive boundaries:

- no marketing emails
- no CRM writes
- no Stripe writes
- no Supabase production writes
- no GitHub writes
- no deployments or releases
- no secrets committed or printed
