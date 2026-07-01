# Release Ship Plan Workflow

Phase 44 turns release readiness results into local ship plans, approval records, release tasks, QA notes, rollback notes, and reports.

The workflow answers:

- which projects have a ship plan
- which plans need Executive review
- which plans are blocked
- which plans are approved to prepare locally
- why the deterministic recommendation is ship, prepare-only, or no-ship

## Commands

```bash
npm run release:ship-plans
npm run release:create-ship-plan
npm run release:review-ship-plan
npm run release:approve-ship-plan
npm run release:reject-ship-plan
npm run release:ship-plan-report
npm run release:ship-plan-validate
```

## Statuses

- `draft`
- `needs_review`
- `approved_to_prepare`
- `blocked`
- `rejected`
- `archived`

## Model

Each ship plan tracks project id/name, branch, target release type, readiness score, blockers, required approvals, release checklist, rollback notes, QA notes, risk level, recommended ship/no-ship decision, linked tasks, linked GitHub plans, created timestamp, and status.

## Integrations

Ship plans read release readiness, shared task queue, GitHub planning, Executive automation, and internal email report types. Local records are written under `codex-agent-threads/shared/release-ship-plans/`; generated records stay ignored by Git.

## Reports

- Ship Plan Markdown
- Ship Plan JSON
- Executive Ship Decision Summary Markdown
- Blocked Ship Plan Report Markdown

## Boundary

Approval means local permission to prepare. It never deploys, tags releases, creates GitHub releases, pushes commits, modifies project files, writes production data, or commits secrets.
