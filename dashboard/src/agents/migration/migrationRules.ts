export const migrationRules = [
  'Members belong to the gym before app login.',
  'Organization Membership is the source of truth.',
  'Existing Vyra users should be linked, not duplicated.',
  'Pending profiles reserve a member’s gym relationship before activation.',
  'Offline/non-app members are valid members.',
  'Gym operations must continue even if zero members download the app on day one.',
  'The app is optional for the member, not required for gym operations.',
  'Staff can manage all migrated members from the gym dashboard.',
];
