import { expectedMigrationTables, supabaseProjectStatus } from './supabaseMockData';
import type { SupabaseProjectStatus } from './supabaseTypes';

export function getSupabaseProjectStatus(): SupabaseProjectStatus {
  return supabaseProjectStatus;
}

export function getExpectedMigrationTables(): Array<{ tableName: string; status: 'Prepared' }> {
  return expectedMigrationTables.map((tableName) => ({
    tableName,
    status: 'Prepared',
  }));
}

