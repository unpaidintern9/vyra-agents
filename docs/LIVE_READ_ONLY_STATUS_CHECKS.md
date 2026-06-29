# Live Read-Only Status Checks

Phase 4 adds optional live checks for GitHub and Supabase while preserving mock fallback mode.

## Mock Mode

```bash
cd dashboard
VITE_VYRA_INTEGRATION_MODE=mock npm run dev
```

Mock mode uses local TypeScript data and does not call external APIs.

## Live Mode

```bash
cd dashboard
VITE_VYRA_INTEGRATION_MODE=live npm run dev
```

Live mode attempts read-only checks. If credentials are missing or a check fails, the dashboard shows warnings and falls back where possible.

## Environment

Use `dashboard/.env.example` as the template. Never commit `.env`.

Required for Supabase live checks:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional for GitHub live checks:

- `VITE_GITHUB_TOKEN`

GitHub public repo reads can work without a token, but private repos and higher rate limits need one.

## No Writes

This phase performs no inserts, updates, deletes, deploys, migrations, GitHub writes, Supabase writes, customer messaging, or AI calls.

