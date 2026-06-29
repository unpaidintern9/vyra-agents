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
