# Sales Safe Web Research

The Sales Agent has a safe public-web research boundary. Live research is config-gated and disabled by default.

## Allowed

- Operator-provided public website URLs
- Operator-provided public social/profile URLs
- Public contact pages reviewed by the operator
- Manual notes pasted from public, unrestricted pages

## Not Allowed

- Private or restricted data
- Login-gated pages
- Paywalled pages
- Robots.txt or rate-limit bypass
- Automated scraping of sensitive personal data
- Secrets or private credentials
- CRM, Stripe, or Supabase production writes
- Automatic external customer email sends

## Adapter Readiness

Future adapters must expose a read-only public research interface, respect robots.txt and rate limits, avoid sensitive personal data collection, and return clear missing-info states when live research is unavailable.
