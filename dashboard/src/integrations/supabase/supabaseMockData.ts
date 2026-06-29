import type { SupabaseProjectStatus } from './supabaseTypes';

export const expectedMigrationTables = [
  'agent_runs',
  'agent_events',
  'agent_tasks',
  'agent_status',
  'agent_memory',
  'agent_logs',
  'agent_approvals',
  'agent_workflows',
  'agent_integrations',
  'gym_migration_batches',
  'gym_migration_staging_members',
  'gym_migration_validation_issues',
  'gym_migration_member_matches',
  'gym_pending_member_profiles',
  'gym_offline_members',
  'gym_migration_review_items',
  'gym_migration_invitations',
] as const;

export const supabaseProjectStatus: SupabaseProjectStatus = {
  projectName: 'Vyra-Part-1 Supabase',
  environment: 'Production linked project',
  migrationCount: 318,
  latestMigration: '20260629000200_gym_migration_foundation.sql',
  databaseStatus: 'prepared',
  authStatus: 'prepared',
  storageStatus: 'prepared',
  edgeFunctionsStatus: 'prepared',
  lastChecked: 'Mock readiness only',
  healthStatus: 'prepared',
};

