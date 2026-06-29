# Organization Membership Rules

Organization Membership is the source of truth for whether a person belongs to a gym.

Each imported member must receive an Organization Membership record tied to the gym organization.

Example fields:

- User ID or Pending Profile ID
- Organization ID
- Role: Athlete or Member
- Membership Status
- Source: Migrated
- External Member ID
- Date Joined
- Created Date
- Last Updated

Every time the member logs in, the app should reference this Organization Membership record.

## Phase 2 Foundation

The Migration page marks whether organization membership is ready for each mock imported member. The SQL stubs prepare fields for `organization_id`, `migration_batch_id`, staged members, pending profiles, offline members, and review items.

The stubs are not applied to production.
