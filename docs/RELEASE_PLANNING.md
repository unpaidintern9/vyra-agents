# Release Planning

Release records store version, planned date, included features, bug fixes, risks, QA status, release notes draft, readiness score, and executive approval status.

Commands:

- `npm run engineering:releases`
- `npm run engineering:release-report`

Release planning is intentionally not release automation. The system does not deploy, publish app builds, mutate CI/CD, merge code, create release tags, submit to app stores, or approve releases automatically.

Readiness scores are deterministic local evaluations for review and prioritization.
