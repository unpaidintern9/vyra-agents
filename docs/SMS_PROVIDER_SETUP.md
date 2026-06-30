# SMS Provider Setup

Phase 32 includes a Twilio SMS provider template only. Do not place real values in the repo.

## Twilio SMS

Example environment variable names:

```text
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
TWILIO_MESSAGING_SERVICE_SID
```

## Current Boundary

The app does not connect to Twilio and does not send SMS.

SMS send readiness remains blocked by:

- sending disabled by default
- provider calls blocked
- missing approval
- missing provider config
- production send mode unavailable

Production SMS support will require a future explicit phase with provider setup, audited approval gates, consent tracking, opt-out handling, rate limits, and human confirmation.
