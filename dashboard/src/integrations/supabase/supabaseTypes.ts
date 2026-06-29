export type SupabaseServiceStatus = 'healthy' | 'warning' | 'critical' | 'prepared' | 'unknown';
export type SupabaseTableStatus = 'prepared' | 'reachable' | 'protected' | 'missing' | 'unknown';

export interface SupabaseProjectStatus {
  projectName: string;
  environment: string;
  migrationCount: number;
  latestMigration: string;
  databaseStatus: SupabaseServiceStatus;
  databaseReachable: boolean;
  authStatus: SupabaseServiceStatus;
  storageStatus: SupabaseServiceStatus;
  edgeFunctionsStatus: SupabaseServiceStatus;
  lastChecked: string;
  healthStatus: SupabaseServiceStatus;
  tableChecks: SupabaseTableCheck[];
  latestAgentStatusRows: number;
  latestWorkflowRows: number;
  warnings: string[];
  usedFallback: boolean;
}

export interface SupabaseTableCheck {
  tableName: string;
  status: SupabaseTableStatus;
  detail: string;
}

export type SupabaseStatusResult = SupabaseProjectStatus;
