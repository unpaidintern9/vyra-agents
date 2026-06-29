# Member Matching Rules

Existing Vyra users must be linked instead of duplicated.

Matching can occur using:

- Email address
- Phone number
- Verified identifiers
- Other approved matching methods

If a match is found:

- Do not create another account.
- Link the existing Vyra account to the new gym.
- Preserve the member's existing profile and history.

## Phase 2 Matching Logic

The local dashboard service simulates:

- Match by email.
- Match by phone.
- Existing Vyra user match.
- Pending profile required.
- Offline member required.

This logic uses mock data only and does not query production users.
