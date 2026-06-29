export const writableAgentTables = [
  'agent_runs',
  'agent_events',
  'agent_tasks',
  'agent_status',
  'agent_memory',
  'agent_logs',
  'agent_approvals',
  'agent_workflows',
  'agent_integrations',
] as const;

export type WritableAgentTable = (typeof writableAgentTables)[number];
export type SyncRecordStatus = 'pending' | 'synced' | 'failed' | 'local_only';
export type SyncConnectionState = 'connected' | 'offline' | 'disabled';
export type SyncWriteMode = 'local_only' | 'edge_function' | 'missing_token' | 'missing_supabase_env';

export interface SyncQueueItem {
  id: string;
  table: WritableAgentTable;
  sourceId: string;
  sourceType: string;
  payload: Record<string, unknown>;
  status: SyncRecordStatus;
  retryCount: number;
  queuedAt: string;
  lastAttemptAt?: string;
  syncedAt?: string;
  error?: string;
}

export interface SyncStatusSnapshot {
  connectionState: SyncConnectionState;
  connected: boolean;
  localStorageEnabled: boolean;
  syncEnabled: boolean;
  writeMode: SyncWriteMode;
  lastSyncAt: string | null;
  recordsWaiting: number;
  syncedRecords: number;
  failedRecords: number;
  syncErrors: string[];
}

export interface SyncableRecord {
  table: WritableAgentTable;
  sourceId: string;
  sourceType: string;
  payload: Record<string, unknown>;
}
