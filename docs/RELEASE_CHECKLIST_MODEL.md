# Release Checklist Model

The release checklist is computed per registered project.

## Checklist Fields

- Build: whether a build command is configured or documented.
- Lint: whether lint validation is configured or documented.
- Validation: whether configured registry validation commands are available.
- Tests: whether test validation is configured or intentionally absent.
- Docs: whether Repository Intelligence shows enough documentation coverage for release review.
- Secrets: whether local analysis detects tracked secret-like files without printing values.

## Readiness Score

Readiness starts at 100 and applies deterministic penalties for:

- missing project path or Git metadata
- dirty working tree
- missing build, lint, or test validation
- documentation gaps
- secret-file risk
- high repository risk
- critical or high blockers

## Risk Levels

- Low: ready or nearly ready.
- Medium: needs review.
- High: blocked by important release work.
- Critical: cannot be approved until critical blockers are cleared.

## Boundary

The checklist does not execute project build, lint, test, deploy, tag, or release commands.
