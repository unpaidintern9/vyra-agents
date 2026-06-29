export type SupabaseServiceStatus = 'healthy' | 'warning' | 'critical' | 'prepared';

export interface SupabaseProjectStatus {
  projectName: string;
  environment: string;
  migrationCount: number;
  latestMigration: string;
  databaseStatus: SupabaseServiceStatus;
  authStatus: SupabaseServiceStatus;
  storageStatus: SupabaseServiceStatus;
  edgeFunctionsStatus: SupabaseServiceStatus;
  lastChecked: string;
  healthStatus: SupabaseServiceStatus;
}

