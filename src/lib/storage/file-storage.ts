'use client';

const DB_NAME = 'vss_files_db_v1';
const STORE_NAME = 'uploaded_files';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory cache for instant synchronous lookups
const memoryCache = new Map<string, Blob | string>();

export async function storeUploadedFile(key: string, fileOrBlobOrDataUrl: Blob | File | string): Promise<void> {
  if (!key) return;
  memoryCache.set(key, fileOrBlobOrDataUrl);
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fileOrBlobOrDataUrl, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[VSS Storage] Could not persist to IndexedDB, preserved in memory cache', err);
  }
}

export async function getUploadedFile(key: string): Promise<Blob | string | null> {
  if (!key) return null;
  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }
  try {
    const db = await getDB();
    const result = await new Promise<Blob | string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const res = req.result;
        if (res) memoryCache.set(key, res);
        resolve(res || null);
      };
      req.onerror = () => resolve(null);
    });
    if (result) return result;

    // Check with _data_url suffix if not already present
    if (!key.endsWith('_data_url')) {
      const dataUrlKey = `${key}_data_url`;
      if (memoryCache.has(dataUrlKey)) return memoryCache.get(dataUrlKey) || null;
      return await new Promise<Blob | string | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(dataUrlKey);
        req.onsuccess = () => {
          const res = req.result;
          if (res) memoryCache.set(dataUrlKey, res);
          resolve(res || null);
        };
        req.onerror = () => resolve(null);
      });
    }
    return null;
  } catch {
    return null;
  }
}
