# AI Operator Runtime

The AI Operator Runtime is the shared local command layer in `scripts/agent-operator-runtime.mjs`.

It is intentionally independent of any single assistant. Tools provide operator identity as metadata, then execute the same deterministic command functions.

## Runtime Responsibilities

- Resolve operator metadata.
- Read current git branch and commit.
- Build local runtime, safety, graph, and Executive summary payloads.
- Generate Markdown and JSON reports.
- Check local safety rails.
- Keep generated files out of Git by writing into ignored report paths.

## Command Entrypoint

`scripts/agent-operator.mjs` dispatches:

- `status`
- `run`
- `executive-summary`
- `report`
- `safety-check`
- `graph`
- `validate`

The root `package.json` maps those dispatch commands to `npm run agents:*` scripts.

## Executive Run Summary

`agents:run` and `agents:executive-summary` produce an Executive Run Summary that includes:

- Executive priorities
- Engineering blockers
- Sales pipeline highlights
- Migration readiness
- Follow-ups due
- Organizations requiring review
- Safety warnings
- Cross-agent health
- Validation status

## Dashboard Surface

The dashboard includes an Operator page that displays:

- active operator
- last local dashboard run/report/validation metadata
- safety mode
- integration mode
- shared command list
- blocked external actions
- agent runtime health

Dashboard operator metadata is local-only and does not call the CLI or external services from the browser.

## Safety Model

The runtime is local/mock/read-only. It may read committed dashboard metadata and write local reports. It must not create external side effects.
