# GitHub Issue Creation

Phase 14 adds approval-gated GitHub issue creation for Engineering Agent issue drafts.

## Default Mode

Creation is disabled by default:

```bash
VITE_GITHUB_ISSUE_CREATION_ENABLED=false
VITE_GITHUB_ISSUE_CREATION_DRY_RUN=true
```

Dry-run actions validate the selected ready drafts, append local Agent Memory, audit, and workflow records, and do not call GitHub write endpoints.

## Live Creation Gates

A live GitHub issue can be created only when all gates pass:

- draft is marked ready
- Robert explicitly clicks Create or confirms a bulk create panel
- `VITE_GITHUB_ISSUE_CREATION_ENABLED=true`
- `VITE_GITHUB_ISSUE_CREATION_DRY_RUN=false`
- a GitHub token resolves for the draft repo
- `VITE_GITHUB_OWNER` and draft repo are known
- duplicate check finds no issue with the same title or draft marker

The dashboard does not create issues automatically.

## Token Resolution

`VITE_GITHUB_TOKEN` is the default token for issue creation and duplicate checks.

`Matthewalbin1/Vyra-Part-1` may use `VITE_GITHUB_TOKEN_VYRA_PART_1` because it is owned by Matthew's personal GitHub account. If the repo-specific token is missing, issue creation falls back to `VITE_GITHUB_TOKEN`. If neither token is configured or the selected token lacks access, creation is blocked for that repo only.

Matthew's token should be scoped only to `Matthewalbin1/Vyra-Part-1`.

## Duplicate Markers

Created issue bodies include:

```text
<!-- vyra-agent-draft-id: DRAFT_ID -->
<!-- vyra-agent-source: engineering-agent -->
```

Before creating a live issue, the dashboard checks open issues for the same title or draft marker. Duplicate matches are recorded locally as `duplicate_skipped`.

## Local Tracking

Creation and dry-run records are stored under:

```text
vyra-agents:engineering-created-github-issues
```

Records include draft id, repo, title, status, created time, and issue URL or duplicate URL when available.

## Security

The browser only receives GitHub tokens when Robert places them in ignored local env files for this explicit operator workflow. Tokens are never displayed in the UI, logged, committed, or stored in localStorage by this feature.
