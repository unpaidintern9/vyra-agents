import type { PostgrestError } from '@supabase/supabase-js';
import { createReadOnlySupabaseClient } from './supabaseClient';
import { expectedMigrationTables } from './supabaseMockData';
import type { SupabaseStatusResult, SupabaseTableCheck, SupabaseTableStatus } from './supabaseTypes';

export async function getLiveSupabaseStatus(): Promise<SupabaseStatusResult> {
  const warnings: string[] = [];
  const client = createReadOnlySupabaseClient();
  const projectName = import.meta.env.VITE_SUPABASE_PROJECT_NAME || 'Vyra Production';
  const environment = import.meta.env.VITE_SUPABASE_ENVIRONMENT || 'production';
  const lastChecked = new Date().toISOString();

  if (!client) {
    warnings.push('Supabase URL or anon key missing; using mock fallback.');
    throw new Error('Missing Supabase URL or anon key.');
  }

  const tableChecks = await Promise.all(expectedMigrationTables.map((tableName) => checkTable(tableName, client)));
  const latestAgentStatusRows = await countReadableRows('agent_status', client).catch(() => 0);
  const latestWorkflowRows = await countReadableRows('agent_workflows', client).catch(() => 0);
  const databaseReachable = tableChecks.some((table) => table.status !== 'unknown');
  const protectedCount = tableChecks.filter((table) => table.status === 'protected').length;
  const missingCount = tableChecks.filter((table) => table.status === 'missing').length;

  if (protectedCount > 0) {
    warnings.push(`${protectedCount} Supabase table checks are protected by RLS or API permissions.`);
  }

  if (missingCount > 0) {
    warnings.push(`${missingCount} expected Supabase tables appear missing or not exposed.`);
  }

  return {
    projectName,
    environment,
    migrationCount: expectedMigrationTables.length,
    latestMigration: '20260629000200_gym_migration_foundation.sql',
    databaseStatus: databaseReachable ? 'healthy' : 'warning',
    databaseReachable,
    authStatus: 'prepared',
    storageStatus: 'prepared',
    edgeFunctionsStatus: 'prepared',
    lastChecked,
    healthStatus: missingCount > 0 ? 'warning' : 'healthy',
    tableChecks,
    latestAgentStatusRows,
    latestWorkflowRows,
    warnings,
    usedFallback: false,
  };
}

async function checkTable(tableName: string, client: ReturnType<typeof createReadOnlySupabaseClient>): Promise<SupabaseTableCheck> {
  if (!client) {
    return {
      tableName,
      status: 'unknown',
      detail: 'Supabase client unavailable.',
    };
  }

  const { error } = await client.from(tableName).select('*', { count: 'exact', head: true });

  if (!error) {
    return {
      tableName,
      status: 'reachable',
      detail: 'Anon read check completed.',
    };
  }

  const status = classifySupabaseError(error);

  return {
    tableName,
    status,
    detail: scrubError(error.message),
  };
}

async function countReadableRows(tableName: string, client: ReturnType<typeof createReadOnlySupabaseClient>): Promise<number> {
  if (!client) {
    return 0;
  }

  const { count, error } = await client.from(tableName).select('*', { count: 'exact', head: true });

  if (error) {
    return 0;
  }

  return count ?? 0;
}

function classifySupabaseError(error: PostgrestError): SupabaseTableStatus {
  const message = error.message.toLowerCase();

  if (error.code === '42P01' || error.code === 'PGRST205' || message.includes('does not exist')) {
    return 'missing';
  }

  if (error.code === '42501' || message.includes('permission denied') || message.includes('rls')) {
    return 'protected';
  }

  return 'unknown';
}

function scrubError(message: string): string {
  return message.replace(/https?:\/\/[^\s]+/g, '[url]');
}
