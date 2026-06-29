import { expectedMigrationTables, supabaseProjectStatus } from './supabaseMockData';
import { getLiveSupabaseStatus } from './supabaseLiveStatus';
import type { SupabaseProjectStatus, SupabaseTableCheck } from './supabaseTypes';

export function getSupabaseProjectStatus(): SupabaseProjectStatus {
  return supabaseProjectStatus;
}

export function getExpectedMigrationTables(): SupabaseTableCheck[] {
  return supabaseProjectStatus.tableChecks;
}

export function getMockSupabaseStatus(warnings: string[] = []): SupabaseProjectStatus {
  return {
    ...supabaseProjectStatus,
    warnings,
    usedFallback: warnings.length > 0,
  };
}

export async function getSupabaseStatus(mode: 'mock' | 'live'): Promise<SupabaseProjectStatus> {
  if (mode === 'mock') {
    return getMockSupabaseStatus();
  }

  try {
    return await getLiveSupabaseStatus();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase live check failed.';
    return getMockSupabaseStatus([`Supabase live check failed; using mock fallback. ${message}`]);
  }
}

export { expectedMigrationTables };
