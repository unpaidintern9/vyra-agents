# GitHub Planning Layer

Phase 37 adds local GitHub issue and PR planning while GitHub remains read-only.

Plans can include:

- issue plan or PR plan type
- branch name suggestion
- commit message suggestion
- release note suggestion
- linked shared task
- linked Engineering blocker
- linked Executive priority
- approval status

Plans are local JSON files under ignored storage:

```text
codex-agent-threads/shared/github-plans/
codex-agent-threads/shared/github-plans/archive/
```

## Commands

```bash
npm run github:plans
npm run github:create-plan
npm run github:review-plan
npm run github:archive-plan
npm run github:plan-report
npm run github:planning-validate
```

`github:create-plan` accepts optional local flags such as `--plan-type issue`, `--task-id <task-id>`, `--title`, `--summary`, and linked blocker/priority ids. If no task id is provided, the planner uses the first local shared task requiring review when available.

## Reports

`npm run github:plan-report` writes ignored local Markdown and JSON reports:

- GitHub Planning Queue
- GitHub Plan Review

## Safety

The planning layer does not create GitHub issues, create PRs, push commits, create branches, dispatch workflows, or call GitHub write endpoints. It only writes ignored local plan/report files.
