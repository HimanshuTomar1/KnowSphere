/**
 * offlineStorage.js
 * IndexedDB + localStorage hybrid client persistence engine for KnowSphere
 * Ensures all user selections, telemetry, download states, and auth tokens
 * persist across browser sessions and offline environments.
 */

const DB_NAME = 'KnowSphereOfflineDB';
const DB_VERSION = 1;
const STORES = ['downloads', 'telemetry', 'preferences', 'cachedContent'];

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

/**
 * Generic save to IndexedDB with localStorage fallback
 */
export async function saveRecord(storeName, id, data) {
  const record = { id, data, updatedAt: Date.now() };

  try {
    const db = await openIndexedDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // LocalStorage fallback
    try {
      localStorage.setItem(`knowsphere_${storeName}_${id}`, JSON.stringify(record));
    } catch (e) {
      console.warn('Storage quota exceeded or unavailable:', e);
    }
  }
}

/**
 * Generic get from IndexedDB with localStorage fallback
 */
export async function getRecord(storeName, id) {
  try {
    const db = await openIndexedDB();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (result) return result.data;
  } catch {
    // LocalStorage fallback
  }

  try {
    const saved = localStorage.getItem(`knowsphere_${storeName}_${id}`);
    return saved ? JSON.parse(saved).data : null;
  } catch {
    return null;
  }
}

/**
 * Persist active downloads list
 */
export async function persistDownloads(downloadsList) {
  return saveRecord('downloads', 'active_downloads', downloadsList);
}

/**
 * Retrieve saved downloads list
 */
export async function loadPersistedDownloads() {
  return getRecord('downloads', 'active_downloads');
}

/**
 * Persist telemetry and TTFR stats
 */
export async function persistTelemetry(telemetryData) {
  return saveRecord('telemetry', 'session_telemetry', telemetryData);
}

/**
 * Retrieve saved telemetry
 */
export async function loadPersistedTelemetry() {
  return getRecord('telemetry', 'session_telemetry');
}

/**
 * Persist user onboarding preferences
 */
export async function persistPreferences(prefs) {
  return saveRecord('preferences', 'onboarding_prefs', prefs);
}

/**
 * Retrieve user onboarding preferences
 */
export async function loadPersistedPreferences() {
  return getRecord('preferences', 'onboarding_prefs');
}

export default {
  saveRecord,
  getRecord,
  persistDownloads,
  loadPersistedDownloads,
  persistTelemetry,
  loadPersistedTelemetry,
  persistPreferences,
  loadPersistedPreferences
};
