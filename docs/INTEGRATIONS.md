# Integrations

Phase 4 adds safe live read-only status checks to the integration foundation.

## Current Status

- GitHub: mock by default, live GET-only checks when enabled.
- Supabase: mock by default, live anon-key read checks when enabled.
- Stripe: planned.
- Apple App Store: planned.
- Google Play: planned.
- SendGrid: planned.
- Slack: planned.
- Discord: planned.
- Sentry: planned.
- Apple Health: planned.
- WHOOP: planned.
- Oura: planned.

The dashboard does not write production data, deploy, apply migrations, or use AI.

## Modes

Mock mode:

```bash
VITE_VYRA_INTEGRATION_MODE=mock npm run dev
```

Live read-only mode:

```bash
VITE_VYRA_INTEGRATION_MODE=live npm run dev
```

If live credentials are missing or a check fails, the dashboard shows a warning and falls back where possible.

## GitHub

The GitHub integration models repository name, remote URL, default branch, latest commit SHA, commit message, commit date, PR count, issue count, workflow status, last checked, and health status.

Live mode uses GitHub REST API GET requests only. Add repos with:

```bash
VITE_GITHUB_REPOS=unpaidintern9/vyra-agents,Matthewalbin1/Vyra-Part-1,unpaidintern9/Vyra-Software,unpaidintern9/vyra-website
```

Repo entries can be `repo-name` or `owner/repo-name`. Owner-qualified entries override `VITE_GITHUB_OWNER`.

`VITE_GITHUB_TOKEN` is optional for public repos and useful for private repos or higher rate limits. The token is never displayed in the UI.

## Supabase

The Supabase integration models project status, environment, database reachability, expected table checks, auth/storage/edge placeholders, latest readable agent status rows, latest readable workflow rows, and health status.

Live mode uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The frontend must never use a service role key. Protected table status means the table exists behind RLS or API permissions and cannot be read by the anon key; that is a valid status signal, not a dashboard failure.
