# Repository Intelligence

Phase 38 adds a local Repository Intelligence Engine for the Engineering Agent.

It reads the generated Engineering graph and normalizes repository metadata into:

- repositories
- modules
- packages
- applications
- services
- libraries
- documentation
- migrations
- configuration
- scripts
- registered projects
- indexed projects
- blocked projects
- release readiness status

## Commands

```bash
npm run repo:scan
npm run repo:status
npm run repo:graph
npm run repo:health
npm run repo:owners
npm run repo:validate
```

`repo:scan` regenerates the local Engineering graph through `scripts/engineering-scan.mjs`. Reports are written under ignored local report folders.

## Outputs

- Repository Intelligence Report
- Repository Graph JSON/Markdown
- Engineering Health Report
- Dependency Report

## Safety

Repository Intelligence is local analysis only. It does not modify repositories, create commits, create branches, write GitHub records, call external write APIs, or print secrets.

## Engineering Task Generator Link

Phase 39 uses Repository Intelligence as a source for local Engineering task candidates. Repository risk, dependency health, orphaned modules, missing documentation, and validation state become explainable candidate tasks. The generator does not create Shared Task Queue records automatically and does not modify code.

## Multi-Project Registry Link

Phase 42 makes Repository Intelligence project-aware. The scanner reads configured local targets from the Project Registry and annotates each repository with project id, project type, owning agent, repo owner/name, and validation commands.

Missing project paths fail safely as registry health data. Repository Intelligence still performs local metadata scans only and does not run project validation commands automatically.

## Release Command Center Link

Phase 43 uses Repository Intelligence health, documentation coverage, dependency warnings, and repository risk as release readiness inputs. High repository risk can become a critical release blocker.
