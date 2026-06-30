# Engineering Health Model

Repository health is derived from local Engineering graph metadata.

Signals include:

- repository health score
- repository risk level
- documentation coverage
- dependency health
- technical debt markers
- engineering warnings
- validation trend

The model does not run production builds or mutate source repositories. Build, lint, and validation statuses are reported as local intelligence signals unless explicitly run by validation commands.

## Executive Signals

Executive summaries display:

- engineering health score
- repository risk
- documentation completeness
- dependency health
- validation trend

These are review signals only. They do not approve or trigger GitHub writes.
