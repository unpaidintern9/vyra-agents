# Release Blocker Workflow

Release blockers are explainable local records created by release readiness analysis.

## Blocker Sources

- missing local project path
- missing Git metadata
- dirty working tree
- missing build, lint, or test validation
- documentation gaps
- tracked secret-like file risk
- high Repository Intelligence risk
- Shared Task Queue items in blocked or review states
- GitHub plans that need review

## Workflow

1. Run `npm run release:scan`.
2. Review `npm run release:blockers`.
3. Open the Engineering Dashboard Release Readiness Command Center.
4. Use generated Engineering task candidates to assign local follow-up.
5. Review Executive Dashboard critical release risks before approving release planning.

## Safety

Blocker workflow creates no GitHub releases, tags, commits, deployments, project file edits, production writes, or external service writes.
