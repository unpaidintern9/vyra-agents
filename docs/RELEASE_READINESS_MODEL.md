# Release Readiness Model

Phase 42 adds release readiness as a local project-level health signal.

## States

- `ready`: project path exists, Git metadata is available, and no blocking local scan issue is present.
- `watch`: project is indexed but has medium risk or warnings that should be reviewed.
- `blocked`: project path is missing, Git metadata is missing, the working tree is dirty, or high-risk repository signals are present.
- `planned`: project is a future placeholder and is not expected to scan yet.

## Inputs

Release readiness is derived from local-only data:

- configured project path
- Git repository presence
- current branch
- working tree state
- repository intelligence health
- validation command configuration
- project notes and status

## Dashboard Use

The Operator Dashboard shows registered projects, project health, missing paths/config, last scan, validation status, and safety status.

The Executive Dashboard shows project risk summary, blocked projects, release readiness, and high-priority project issues.

The Engineering Dashboard shows the project registry, per-project repo intelligence, validation commands, and project-specific Engineering task candidates.

## Safety

Release readiness never performs deploys, GitHub writes, CRM writes, Stripe writes, Supabase production writes, or project file modifications.
