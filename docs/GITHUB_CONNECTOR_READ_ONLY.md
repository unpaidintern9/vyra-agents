# GitHub Connector Read-Only MVP

Phase 36 adds the first real connector adapter: GitHub read-only.

The connector can inspect one configured repository with GitHub REST API `GET` requests only. It does not create issues, pull requests, commits, branches, workflow runs, comments, labels, or repository settings changes.

## Safe Local Config

Use ignored local environment only:

```env
VYRA_GITHUB_OWNER=example-owner
VYRA_GITHUB_REPO=example-repo
VYRA_GITHUB_TOKEN=example-token
```

Do not commit real values. The CLI checks whether the token exists, but never prints the token.

## Commands

- `npm run github:status` reads repo, branch, commit, issue, and PR summaries when config is present.
- `npm run github:repo` writes GitHub repo status and Engineering readiness reports.
- `npm run github:branches` reads branch names and protection flags.
- `npm run github:commits` reads recent commit metadata.
- `npm run github:issues` reads open issues.
- `npm run github:prs` reads open pull requests.
- `npm run github:safety-check` verifies write actions remain blocked.
- `npm run github:validate` validates command readiness and fail-closed missing-config behavior.

## Reports

`npm run github:repo` writes ignored local reports under `reports/agents/runtime/`:

- GitHub Repo Status Markdown
- GitHub Repo Status JSON
- GitHub Engineering Readiness Markdown/JSON

## Missing Config

If `VYRA_GITHUB_OWNER`, `VYRA_GITHUB_REPO`, or `VYRA_GITHUB_TOKEN` is missing, commands return `missing_config` and do not call GitHub.

## Safety

The connector uses only `GET` requests. It does not expose token values, does not write production data, and does not call non-GitHub services.

## Planning Layer

Phase 37 adds local GitHub planning commands for issue and PR plans. These commands create local planning records only and do not change GitHub. The read-only connector remains read-only.

Planning commands:

- `npm run github:plans`
- `npm run github:create-plan`
- `npm run github:review-plan`
- `npm run github:archive-plan`
- `npm run github:plan-report`
- `npm run github:planning-validate`
