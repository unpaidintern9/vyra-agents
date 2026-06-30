import { localStorageKeys } from '../storage/localStorageKeys';
import { clearLocalState, loadLocalState, saveLocalState } from '../storage/localStorageStore';
import type { SyncQueueItem, SyncableRecord } from './syncTypes';

export function loadSyncQueue(): SyncQueueItem[] {
  return loadLocalState<SyncQueueItem[]>(localStorageKeys.syncQueue, () => []);
}

export function saveSyncQueue(queue: SyncQueueItem[]): void {
  saveLocalState(localStorageKeys.syncQueue, queue);
}

export function clearSyncQueueStorage(): void {
  clearLocalState(localStorageKeys.syncQueue);
}

export function isLegacyRlsFailure(item: SyncQueueItem): boolean {
  return item.status === 'failed' && Boolean(item.error?.includes('42501') && item.error.toLowerCase().includes('row-level security'));
}

export function enqueueSyncRecords(queue: SyncQueueItem[], records: SyncableRecord[]): SyncQueueItem[] {
  const existingKeys = new Set(queue.map((item) => queueKey(item.table, item.sourceId, item.sourceType)));
  const now = new Date().toISOString();
  const additions = records
    .filter((record) => !existingKeys.has(queueKey(record.table, record.sourceId, record.sourceType)))
    .map<SyncQueueItem>((record) => ({
      id: `${record.table}:${record.sourceType}:${record.sourceId}`,
      table: record.table,
      sourceId: record.sourceId,
      sourceType: record.sourceType,
      payload: record.payload,
      status: 'pending',
      retryCount: 0,
      queuedAt: now,
    }));

  return additions.length ? [...additions, ...queue] : queue;
}

export function resetFailedQueueItems(queue: SyncQueueItem[]): SyncQueueItem[] {
  return queue.map((item) =>
    item.status === 'failed' && !isLegacyRlsFailure(item)
      ? {
          ...item,
          status: 'pending',
          error: undefined,
        }
      : item,
  );
}

export function clearLegacyRlsFailures(queue: SyncQueueItem[]): SyncQueueItem[] {
  return queue.filter((item) => !isLegacyRlsFailure(item));
}

export function requeueLegacyRlsFailures(queue: SyncQueueItem[]): SyncQueueItem[] {
  return queue.map((item) =>
    isLegacyRlsFailure(item)
      ? {
          ...item,
          status: 'pending',
          error: undefined,
        }
      : item,
  );
}

function queueKey(table: string, sourceId: string, sourceType: string): string {
  return `${table}:${sourceType}:${sourceId}`;
}
