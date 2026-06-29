import type { SyncStatusSnapshot } from '../sync/syncTypes';
import type { RuntimeSyncSnapshot } from './runtimeTypes';

export function buildRuntimeSync(syncStatus: SyncStatusSnapshot): RuntimeSyncSnapshot {
  return {
    failedRecords: syncStatus.failedRecords,
    lastSyncAt: syncStatus.lastSyncAt,
    mode: syncStatus.writeMode,
    recordsWaiting: syncStatus.recordsWaiting,
    status: syncStatus.connectionState,
    syncedRecords: syncStatus.syncedRecords,
  };
}
