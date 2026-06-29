import { getLocalPersistenceStatus } from '../storage/localStorageStore';
import type { SyncQueueItem, SyncStatusSnapshot, SyncWriteMode } from './syncTypes';

export function buildSyncStatusSnapshot(
  queue: SyncQueueItem[],
  connectionState: SyncStatusSnapshot['connectionState'],
  lastSyncAt: string | null,
  syncEnabled: boolean,
  writeMode: SyncWriteMode = 'local_only',
): SyncStatusSnapshot {
  const failedItems = queue.filter((item) => item.status === 'failed');

  return {
    connectionState,
    connected: connectionState === 'connected',
    localStorageEnabled: getLocalPersistenceStatus() === 'available',
    syncEnabled,
    writeMode,
    lastSyncAt,
    recordsWaiting: queue.filter((item) => item.status === 'pending').length,
    syncedRecords: queue.filter((item) => item.status === 'synced').length,
    failedRecords: failedItems.length,
    syncErrors: Array.from(new Set(failedItems.map((item) => item.error).filter(Boolean) as string[])).slice(0, 5),
  };
}
