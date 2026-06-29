# Settings And Environment

Phase 5 adds a Settings page for configuration guidance.

## Setup

```bash
cd dashboard
cp .env.example .env
npm run dev
```

Optional live read-only checks:

- Add `VITE_GITHUB_TOKEN` if private repos or higher GitHub rate limits are needed.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Supabase read-only status checks.

## Safety

The dashboard must never display full tokens, keys, or secrets.

Use only anon or publishable keys in frontend code. Service role keys are forbidden in the browser because they bypass Row Level Security.

Phase 5 actions are local/mock only and do not write to Supabase, GitHub, billing, email, or production systems.
