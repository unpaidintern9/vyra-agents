# Project Registry

Phase 42 adds a local registry for real Vyra repositories and projects.

The registry lets Vyra Agents track more than the agent runtime repo:

- Vyra Agents
- Vyra mobile app / backend
- Vyra desktop software
- Vyra website
- Valor Solutions website
- Future projects

## Model

Each project records:

- project id
- project name
- local path
- repo owner
- repo name
- branch
- project type
- owning agent
- status
- validation commands
- notes

## Local Config

Templates live in:

```text
codex-agent-threads/shared/projects/
```

Only examples and templates should be committed. Real local project paths and generated local config files are ignored.

## Commands

```bash
npm run projects:status
npm run projects:list
npm run projects:scan
npm run projects:health
npm run projects:report
npm run projects:validate
```

## Outputs

- Project Registry Report Markdown
- Project Registry JSON
- Multi-Project Health Report Markdown
- Release Readiness Report Markdown

## Release Command Center Link

Phase 43 uses registered projects as the source list for release readiness. Branch, latest commit, validation commands, project status, and notes feed the release checklist for each project.

## Safety

The registry performs local scans only. It does not modify project files, run destructive commands, commit project-local generated data, write GitHub records, write production data, or print secrets.
