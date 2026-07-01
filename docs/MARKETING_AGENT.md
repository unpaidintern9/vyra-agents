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
