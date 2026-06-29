# Migration Agent Overview

The Migration Agent owns gym onboarding and member migration workflows.

## Phase 2 Status

Phase 2 is a local/mock MVP. It adds dashboard-side TypeScript validation and matching logic, mock imported members, and SQL foundation stubs for future Supabase tables.

No production data is connected. No migrations are applied. No AI is implemented. The SQL files are foundation stubs for later review.

## Phase 3 Promotion

The gym migration foundation migration is promoted to the real Vyra-Part-1 Supabase migration folder as:

- `20260629000200_gym_migration_foundation.sql`

The dashboard still uses mock data and does not query or write production Supabase. Future read-only checks can confirm whether the expected tables exist.

## Phase 5 Dry Run

The Migration page includes `Run Migration Agent Dry Run`.

The dry run:

- validates mock imported members,
- calculates the migration summary,
- appends a local/mock agent run,
- appends a local/mock audit log,
- shows the last dry-run timestamp.

It does not write to Supabase, call AI, send invitations, or create real organization memberships.

## Phase 6 Dry-Run History And Reports

Migration dry-run summaries now persist in browser localStorage. The Migration page includes dry-run history, JSON and Markdown export of the latest migration dry-run report, and a clear local migration dry-run history control.

Migration Dry Run reports include these operating rules:

1. Members belong to the gym before app login.
2. Organization Membership is the source of truth.
3. Existing Vyra users should be linked, not duplicated.
4. Pending profiles reserve a member's gym relationship before activation.
5. Offline/non-app members are valid members.
6. Gym operations must continue even if zero members download the app on day one.
7. The app is optional for the member, not required for gym operations.
8. Staff can manage all migrated members from the gym dashboard.

Reports are generated locally in the browser and do not write to Supabase, call AI, send invitations, or apply migrations.

## Phase 16A Operations Refactor

The dashboard Migration Agent Operations UI has been modularized under `dashboard/src/agents/migration/`. `App.tsx` now keeps the local state and workflow wiring, while `MigrationPage.tsx` and the dedicated operation components render the queue, batch detail, member review, offline member tracking, validation resolution, invitation preview, approval gate, reports, and dry-run history.

This refactor is presentation-only. The Migration Agent remains local/mock only: no production data writes, no direct business table writes, no invitation sending, and no AI behavior are introduced.

## Phase 16B Import Wizard

The Migration page now starts with an Import Wizard for browser-local migration file review. It supports CSV, XLSX, and XLS files, detects common gym export columns, lets staff map fields, validates imported rows with existing Migration Agent validation rules, and exports validation reports as JSON, Markdown, or CSV.

CSV is recommended and parsed natively. Excel files are parsed locally in the browser behind an optional parser boundary with visible warnings, file limits, row/column limits, cell sanitization, and formula-injection-safe exports.

The wizard persists file metadata, sanitized parsed rows, field mappings, wizard progress, parser warnings/errors, and validation results in browser localStorage. It does not upload files to Supabase, write production data, create pending profiles, create organization memberships, send invitations, store raw file binaries, or call AI.

## Core Principle

Members must be attached to the gym before they ever download or log into Vyra. Organization Membership is the source of truth.

Members should not have to manually search for a gym, enter an invitation code, or wait for staff to manually connect them.

## Migration Flow

1. Create the gym organization record.
2. Import member data from CSV, Excel, platform exports, APIs, manual spreadsheets, database exports, or other supported formats.
3. Stage imported records before creating live accounts.
4. Validate and clean data.
5. Create pending member profiles for members without Vyra accounts.
6. Link existing Vyra users automatically.
7. Create organization membership records.
8. Present review data to the gym.
9. Send invitations only after approval.
10. Match new app logins to pending profiles.
11. Show the member their gym immediately.
12. Let staff manage imported members from the gym dashboard.

## Offline Member Rule

Migration must preserve gym operations even if zero members download the app on day one. Attendance, class enrollment, check-ins, staff management, billing status tracking, notes, membership status, and coach assignment must not be blocked because a member has not activated the app.

## Supported Member States

- active_app_user
- pending_app_user
- offline_non_app_member

Offline/non-app members do not require `user_id`. They must remain visible and manageable from the gym dashboard.

## Phase 2 Table Stubs

`20260629000200_gym_migration_foundation.sql` prepares:

- gym_migration_batches
- gym_migration_staging_members
- gym_migration_validation_issues
- gym_migration_member_matches
- gym_pending_member_profiles
- gym_offline_members
- gym_migration_review_items
- gym_migration_invitations
