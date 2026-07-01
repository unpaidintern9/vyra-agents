# Release Readiness Command Center

Phase 43 adds a unified release readiness system across registered Vyra projects.

The command center answers:

- what is ready to ship
- what is blocked
- what needs Engineering review
- what needs Executive action

## Commands

```bash
npm run release:status
npm run release:scan
npm run release:readiness
npm run release:blockers
npm run release:report
npm run release:validate
npm run release:ship-plans
npm run release:create-ship-plan
npm run release:review-ship-plan
npm run release:approve-ship-plan
npm run release:reject-ship-plan
npm run release:ship-plan-report
npm run release:ship-plan-validate
```

## Model

Each project release record includes:

- project id and name
- branch
- latest commit
- build status
- lint status
- validation status
- test status
- docs status
- secrets status
- release blockers
- risk level
- readiness score
- recommended action
- last checked timestamp

## Integrations

Release readiness reads:

- Project Registry
- Repository Intelligence
- Engineering Task Generator
- Shared Task Queue
- Executive Automation
- GitHub Planning Queue

## Reports

- Release Readiness Markdown
- Release Readiness JSON
- Release Blockers Markdown
- Executive Release Summary Markdown
- Ship Plan Markdown
- Ship Plan JSON
- Executive Ship Decision Summary Markdown
- Blocked Ship Plan Report Markdown

## Ship Plan Link

Phase 44 adds local ship plans on top of readiness. Ship plans reuse readiness scores, blockers, checklists, task links, and GitHub planning links to produce local approval records, QA notes, rollback notes, and deterministic ship/no-ship recommendations.

## Safety

The command center is local analysis only. It does not deploy, tag releases, create GitHub releases, push commits, modify project files, write production data, or commit secrets.
