# Engineering Task Generator

Phase 39 adds a local Engineering Task Generator that turns repository intelligence and planning signals into deterministic task candidates.

## Inputs

- Repository Intelligence health, risks, dependency warnings, orphaned modules, documentation coverage, and validation state.
- Local GitHub issue and PR plans.
- Executive priority signals derived from local dashboards and runtime summaries.
- Shared Task Queue blockers, especially Sales and Migration blockers.

## Commands

```bash
npm run engineering:tasks
npm run engineering:generate-tasks
npm run engineering:task-report
npm run engineering:validate
```

## Candidate Behavior

Generated candidates are local-only planning records. They are not automatically written into the Shared Task Queue, GitHub, Supabase, CRM, or production systems.

Each candidate includes:

- deterministic category
- recommended priority
- source explanation
- linked repository risk
- linked GitHub plan
- linked Executive priority
- linked Sales or Migration blocker
- approval-required marker

## Safety

- No code is modified.
- No GitHub issues or PRs are created.
- No Shared Task Queue records are created automatically.
- No production data is written.
- Reports are written only to ignored local report folders.
