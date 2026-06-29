# Migration Batch Builder

The Migration Batch Builder converts validated Import Wizard rows into a local review packet for gym approval.

It is a preview tool only. It does not write to Supabase, create pending profiles, create organization memberships, send invitations, modify production data, or call AI.

## Inputs

The builder reads the latest browser-local Import Wizard state from:

- `vyra-agents:migration-import-wizard`

The Import Wizard must have completed local validation before a batch preview can be built.

## Local Preview Output

The batch preview is persisted in browser localStorage at:

- `vyra-agents:migration-batch-preview`

The preview includes:

- staged member preview
- pending profile preview
- offline/non-app member preview
- existing user match preview
- organization membership preview
- review checklist
- approval packet
- batch summary
- safety notes

Raw uploaded file binaries are not stored.

## Member States

The builder assigns local preview states:

- `active_app_user` for validated rows matched to an existing Vyra user
- `pending_app_user` for validated rows that can become pending app users in a future approved migration
- `offline_non_app_member` for valid active gym members without app activation requirements
- `needs_review` for rows with blocking validation issues or unresolved state
- `skipped` for empty or excluded rows

These states are preview labels only.

## Exports

The approval packet can be exported locally as:

- JSON
- Markdown
- CSV staged members

Exports include the batch summary, safety notes, review checklist, warnings/errors, staged members, pending profile preview, offline member preview, existing user matches, and organization membership preview.

CSV and Markdown output use the same export sanitization protections as the Import Wizard.

## Audit And Agent Memory

Building a preview and exporting an approval packet appends local Migration Agent events and local audit log entries.

If Agent Memory sync is enabled, those existing local records use the approved sync mechanism. The Batch Builder itself does not bypass the sync queue and does not write directly to business tables.

## Safety Boundary

The Batch Builder is local-only:

- No production writes.
- No direct browser inserts.
- No service role key exposure.
- No pending profiles created.
- No organization memberships created.
- No invitations sent.
- No production business data modified.
- No AI behavior.
