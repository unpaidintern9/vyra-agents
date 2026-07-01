# Executive Daily Briefing

The Executive Daily Briefing is a deterministic local briefing generated from current runtime data.

## Sections

- Today's priorities
- Overnight changes
- Blocked work
- Critical Engineering issues
- Critical Sales opportunities
- Release readiness summary
- Pending approvals
- Scheduled communications
- Recommended next actions

## Inputs

The briefing reads the Operator snapshot, Shared Task Queue, Repository Intelligence, Engineering Task Generator, Project Registry, Release Readiness, Release Ship Plans, GitHub Planning, Gmail reporting, Connector Readiness, and Executive Automation.

## Output

`npm run executive:briefing` prints the briefing JSON and writes an ignored Executive Daily Briefing Markdown report under `reports/agents/executive/`.

## Boundary

The briefing does not send communications, create tasks, create GitHub records, deploy releases, or write production data.
