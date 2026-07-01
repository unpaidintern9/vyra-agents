# Proposal Intelligence & Assembly Engine

Phase 55 adds a local-only Proposal Intelligence & Assembly Engine.

The engine turns Sales opportunities into structured proposal workspaces for planning, readiness, compliance, evidence, review, and audit management. It does not generate final proposals automatically and never submits proposals.

Storage lives under `codex-agent-threads/shared/proposals/`:

- `proposals.json`
- `sections.json`
- `compliance-matrix.json`
- `evidence.json`
- `reviews.json`
- `timelines.json`
- `readiness.json`
- `reports/`

CLI commands:

- `npm run proposal:list`
- `npm run proposal:create`
- `npm run proposal:update`
- `npm run proposal:sections`
- `npm run proposal:compliance`
- `npm run proposal:evidence`
- `npm run proposal:review`
- `npm run proposal:timeline`
- `npm run proposal:readiness`
- `npm run proposal:health`
- `npm run proposal:report`
- `npm run proposal:validate`

Reports include proposal health, readiness, compliance summary, missing evidence, review status, timeline, Executive proposal summary, portfolio, section completion, and proposal risk.

Safety guarantees:

- No autonomous browsing.
- No emailing.
- No CRM synchronization.
- No proposal submission.
- No automatic compliance approval.
- No automatic Executive approval.
- No customer communication.

