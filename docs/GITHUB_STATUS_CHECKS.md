# GitHub Status Checks

GitHub live checks use REST API GET requests only.

## Environment

```bash
VITE_GITHUB_OWNER=unpaidintern9
VITE_GITHUB_REPOS=vyra-agents,Vyra-Part-1,Vyra-Software,vyra-website
VITE_GITHUB_TOKEN=
```

Add repositories by editing `VITE_GITHUB_REPOS` as a comma-separated list.

## Token

`VITE_GITHUB_TOKEN` is optional for public repos and useful for private repos or higher rate limits. Tokens are never displayed in the dashboard.

## Failure Handling

If a repo is private, missing, rate-limited, or unreachable, the dashboard returns a warning status for that repo instead of crashing.

## No Writes

This phase does not create issues, update PRs, write commits, dispatch workflows, or change repo settings.

