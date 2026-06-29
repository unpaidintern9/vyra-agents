# Migration Agent Full Charter

The Migration Agent owns the complete Vyra gym migration process.

## Phase 2 Boundary

This repo currently contains a local/mock Migration Agent MVP. It does not connect to production Supabase, does not apply migrations, does not send invitations, and does not implement AI.

The dashboard logic is allowed to validate mock imports, simulate member matching, show offline member handling, and update local UI approval state only.

## Core Principle

Members must be attached to the gym before they ever download or log into Vyra. Organization Membership is the source of truth.

The member should not have to manually search for the gym, enter an invitation code, or need staff to manually connect them.

## Gym Migration Flow

1. Create the gym organization record.
2. Import member data from supported sources.
3. Stage imported records first.
4. Validate and clean imported data.
5. Create Pending Member Profiles.
6. Automatically link Existing Vyra Users.
7. Create Organization Membership records.
8. Present Gym Review before finalization.
9. Send invitations after approval.
10. Match account creation or login to pending profiles.
11. Show the member their gym immediately.
12. Let staff manage all imported members immediately.

## Supported Sources

- CSV export
- Excel spreadsheet
- Export from another gym management platform
- API connection
- Manual spreadsheet
- Database export
- Other supported migration formats

## Critical UI Rules

- Members belong to the gym before app login.
- Organization Membership is the source of truth.
- Existing Vyra users should be linked, not duplicated.
- Pending profiles reserve a member's gym relationship before activation.
- Offline/non-app members are valid members.
- Gym operations must continue even if zero members download the app on day one.
- The app is optional for the member, not required for gym operations.
- Staff can manage all migrated members from the gym dashboard.

## Typical Member Fields

- First name
- Last name
- Email address
- Phone number
- Date of birth
- Membership status
- Membership type
- Membership level
- Membership start date
- Renewal date
- Billing status
- Emergency contact
- Coach assignment
- Class enrollments
- Attendance history
- Old system member ID
- Notes
