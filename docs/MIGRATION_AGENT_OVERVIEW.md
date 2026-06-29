# Migration Agent Overview

The Migration Agent owns gym onboarding and member migration workflows.

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

