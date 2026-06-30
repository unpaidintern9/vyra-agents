# GitHub Connector Safety

The Phase 36 GitHub connector is read-only and fail-closed.

## Blocked Actions

The connector cannot:

- create or update GitHub issues
- create or update pull requests
- create commits
- change branches
- dispatch workflows
- comment on issues or pull requests
- change labels
- change repository settings

## Token Handling

`VYRA_GITHUB_TOKEN` may be checked for presence, but the value is never printed in CLI output, dashboard UI, reports, or logs.

The dashboard shows only safe config names and readiness labels. It does not read `VYRA_GITHUB_TOKEN` because browser code must not receive GitHub secrets.

## Network Scope

When fully configured, the connector calls only GitHub REST API endpoints with `GET`. If config is missing, it performs no network call and returns `missing_config`.

No Gmail, Calendar, Stripe, Supabase, Twilio, Google Drive, CRM, email, SMS, billing, or production business writes are performed.

## Approval Boundary

Future GitHub write actions must remain separate approval-gated workflows. Phase 36 does not add any write endpoint, mutation command, or write-capable adapter method.
