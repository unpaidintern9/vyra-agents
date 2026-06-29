# GitHub Status Checks

GitHub live checks use REST API GET requests only.

## Environment

```bash
VITE_GITHUB_OWNER=unpaidintern9
VITE_GITHUB_REPOS=unpaidintern9/vyra-agents,Matthewalbin1/Vyra-Part-1,unpaidintern9/Vyra-Software,unpaidintern9/vyra-website
VITE_GITHUB_TOKEN=
VITE_GITHUB_TOKEN_VYRA_PART_1=
```

Add repositories by editing `VITE_GITHUB_REPOS` as a comma-separated list.

Repo entries can be `repo-name` or `owner/repo-name`. When an owner is omitted, the dashboard uses `VITE_GITHUB_OWNER`.

## Token

`VITE_GITHUB_TOKEN` is the default token for GitHub status checks. It is optional for public repos and useful for private repos or higher rate limits.

`Matthewalbin1/Vyra-Part-1` may use `VITE_GITHUB_TOKEN_VYRA_PART_1` because that repo is owned by Matthew's personal GitHub account. If that repo-specific token is missing, the dashboard falls back to `VITE_GITHUB_TOKEN`. If both tokens fail or are missing, only `Matthewalbin1/Vyra-Part-1` shows a clean warning.

Tokens are never displayed in the dashboard, logged, committed, stored in localStorage, or sent to Supabase. Matthew's token should be scoped only to `Matthewalbin1/Vyra-Part-1`.

## Failure Handling

If a repo is private, missing, rate-limited, or unreachable, the dashboard returns a warning status for that repo instead of crashing.

## No Writes

This phase does not create issues, update PRs, write commits, dispatch workflows, or change repo settings.
