# Engineering Task Prioritization

Engineering task candidates use deterministic rules so the same local inputs produce the same local recommendations.

## Categories

- bug fix
- refactor
- documentation
- test coverage
- dependency cleanup
- migration support
- sales blocker
- release readiness
- security/safety review

## Priority Rules

- Critical: high repository risk, critical shared blocker, or Executive-facing release risk.
- High: GitHub plans needing review, very low documentation coverage, Sales/Migration blockers, or dependency warnings with circular risk.
- Medium: documentation gaps, orphan review, dependency cleanup, and non-critical local review work.
- Low: reserved for future low-impact hygiene candidates.

## Linking

Candidates can link to:

- Repository Intelligence graph nodes and repository risk summaries.
- GitHub issue or PR plans.
- Shared Task Queue records.
- Executive priority ids.
- Sales or Migration blocker ids.

## Approval Model

Candidate generation never creates work automatically. A human must review a candidate before creating a Shared Task Queue item or any future GitHub plan/action.
