# Multi-Project Repository Intelligence

Phase 42 extends Repository Intelligence from a single agent repo view to a multi-project view.

Repository Intelligence now reads project targets from the Project Registry. Each configured local project can be scanned safely and summarized with project-level metadata.

## Integrated Signals

Per-project scans include:

- project id and name
- repository owner and name
- local path availability
- branch and dirty state
- project type
- owning agent
- validation command list
- repository health score
- release readiness state

## Linked Systems

Multi-project repository intelligence links projects to:

- Shared Task Queue records
- local GitHub plans
- Executive automation rules
- Engineering task candidates
- Operator Dashboard runtime summaries

## Missing Paths

Missing paths fail safely. A missing or non-Git path becomes project health data and does not stop the registry from reporting other projects.

## Safety

Scans are read-only filesystem metadata scans. They do not modify repositories, run project validation commands automatically, write GitHub records, call external write APIs, or commit generated project data.
