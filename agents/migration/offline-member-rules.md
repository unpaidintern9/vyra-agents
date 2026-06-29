# Offline Member Rules

Existing gym members must not be forced to download the Vyra app in order to continue attending the gym.

The migration system must support:

- Active App User
- Pending App User
- Offline / Non-App Member

Migration must preserve gym operations even if zero members download the app on day one.

Do not block these operations because a migrated member has not downloaded the app:

- Attendance
- Class enrollment
- Check-ins
- Staff management
- Billing status tracking
- Member notes
- Membership status
- Coach assignment

A migrated member should only need the app for member-facing features, not for the gym to keep operating.

## Phase 2 Implementation Note

The dashboard now models `offline_non_app_member` as a first-class local state. SQL stubs support offline members without requiring `user_id`.

This remains mock/local only. No production data is connected and no migrations are applied.
