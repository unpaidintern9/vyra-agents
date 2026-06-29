import type { LocalStorageKey } from './localStorageKeys';

export type LocalPersistenceStatus = 'available' | 'unavailable';

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export function getLocalPersistenceStatus(): LocalPersistenceStatus {
  try {
    const storage = browserStorage();
    if (!storage) {
      return 'unavailable';
    }
    const testKey = 'vyra-agents:local-storage-test';
    storage.setItem(testKey, 'ok');
    storage.removeItem(testKey);
    return 'available';
  } catch {
    return 'unavailable';
  }
}

export function loadLocalState<T>(key: LocalStorageKey, fallback: () => T): T {
  try {
    const storage = browserStorage();
    if (!storage) {
      return fallback();
    }
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return fallback();
    }
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback();
  }
}

export function saveLocalState<T>(key: LocalStorageKey, value: T): void {
  try {
    const storage = browserStorage();
    if (!storage) {
      return;
    }
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage can fail in private windows or quota limits. The dashboard stays usable in memory.
  }
}

export function clearLocalState(key: LocalStorageKey): void {
  try {
    browserStorage()?.removeItem(key);
  } catch {
    // Clear actions are local-only best effort.
  }
}
