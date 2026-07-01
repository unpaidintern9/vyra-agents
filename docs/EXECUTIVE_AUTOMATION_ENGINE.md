# Executive Automation Engine

Phase 41 makes the Executive Agent the proactive local orchestration layer for Vyra Agents.

The engine reads existing runtime data and decides which local workflows need attention. It can create local shared tasks, local GitHub plans, internal Gmail drafts, Executive review items, and ignored Markdown/JSON reports. It does not perform CRM, Stripe, Supabase production, GitHub, or external marketing writes.

## Commands

Run from the repo root:

```bash
npm run executive:automation-status
npm run executive:automation-run
npm run executive:automation-rules
npm run executive:automation-report
npm run executive:automation-validate
npm run executive:automation-safety-check
```

## Inputs

The engine integrates these existing layers:

- Shared Agent Runtime and Operator snapshot.
- Shared Task Queue.
- Gmail Email Connector workflow and audit trail.
- Repository Intelligence.
- Project Registry and release readiness.
- Release Readiness Command Center.
- GitHub Planning Queue.
- Connector Readiness.
- Cross-Agent Collaboration graph.
- Engineering Task Generator.

## Outputs

Automation runs can generate:

- Shared tasks under the ignored shared task queue.
- GitHub issue/PR plans under the ignored local planning queue.
- Gmail internal email drafts under the ignored Gmail draft queue.
- Executive Automation Report Markdown and JSON.
- Triggered Rules Report Markdown.
- Skipped/Blocked Actions Report Markdown.

## Manual Run

`npm run executive:automation-run` evaluates deterministic local signals and writes safe local artifacts. Automatic internal email sending is skipped by default; drafts are created instead. A configured send may only be attempted when `VYRA_EXECUTIVE_AUTOMATION_SEND_ENABLED=true` or `-- --send-configured-internal-email true` is supplied, and the existing Gmail safety gates still decide whether the send is sent or skipped.

## Dashboard

The Operator Dashboard shows automation status, latest run, triggered rules, generated tasks, generated reports, generated emails, skipped/blocked actions, and safety status.

The Executive Dashboard shows automation health, top triggered rules, unresolved automation items, emails sent/skipped, tasks created, agent workflows run, and the next recommended action.

## Project Registry Link

Phase 42 adds multi-project readiness to Executive automation. Blocked projects and non-ready release readiness can trigger Engineering health and cross-agent review signals. Generated tasks, plans, emails, and reports remain local and must pass the same safety gates as other automation output.

## Release Command Center Link

Phase 43 adds blocked releases and critical release risks to Executive automation context. Release health can trigger Engineering health warnings and cross-agent review needs, but automation still cannot deploy, tag, create releases, push commits, or write production data.
