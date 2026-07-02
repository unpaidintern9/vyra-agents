# Marketing Agent

Phase 55 adds the Vyra Marketing Agent foundation for Vyra Performance.

The Marketing Agent is local-only and planning-focused. It manages brand intelligence, product intelligence, audience intelligence, content planning, campaign planning, marketing calendar records, approval queue records, readiness evaluations, and local reports.

Storage lives under:

```text
codex-agent-threads/shared/marketing/
```

Commands:

- `npm run marketing:brand`
- `npm run marketing:products`
- `npm run marketing:audiences`
- `npm run marketing:content`
- `npm run marketing:campaigns`
- `npm run marketing:calendar`
- `npm run marketing:brand-report`
- `npm run marketing:campaign-report`
- `npm run marketing:content-report`
- `npm run marketing:validate`

Safety:

- No autonomous publishing.
- No autonomous social posting.
- No autonomous email sending.
- No paid ad execution.
- No external CRM sync.
- No automatic approval.
- No invented brand assets.

## Phase 56 Content Studio

The Marketing Agent now includes a Content Studio for draft-only campaign briefs, landing page drafts, email drafts, newsletters, social post sets, blog outlines, launch announcements, release notes, product messaging, ad copy, video/podcast briefs, case study outlines, and FAQ drafts.

Use `npm run marketing:drafts`, `npm run marketing:create-draft`, `npm run marketing:brand-check`, `npm run marketing:submit-draft`, `npm run marketing:approve-draft`, `npm run marketing:reject-draft`, `npm run marketing:archive-draft`, `npm run marketing:content-studio-report`, and `npm run marketing:draft-report`.

Approval remains internal only and does not publish or create external actions.

## Phase 57 Asset Library Integration

Marketing uses the shared Asset & Knowledge Library for approved brand assets, marketing templates, and campaign resources.

Asset records live under `codex-agent-threads/shared/assets/` and reference local files instead of duplicating them. Marketing does not upload, publish, replace, approve, or distribute assets automatically.

## Phase 58 Customer Success Context

Marketing may use local Customer Success insights as advisory context for training content, onboarding guides, FAQs, and adoption-support material.

Customer Success context remains local. Marketing does not message customers, publish onboarding content, send emails, sync CRM data, or create autonomous support responses.

## Phase 59 Finance Context

Marketing may reference the local Pricing Library and revenue intelligence for positioning, campaign planning, and offer consistency.

Marketing does not change prices, update billing systems, mutate Stripe, send invoices, collect payments, buy ads, publish pricing pages, or sync accounting.

## Phase 61 Product Launch Context

Marketing may reference Engineering Product Operations records for upcoming releases, launch readiness, product messaging dependencies, feature status, and roadmap timing.

Marketing remains draft-only. Product context does not publish launch content, send email, post social content, buy ads, approve messaging automatically, or trigger release activity.
