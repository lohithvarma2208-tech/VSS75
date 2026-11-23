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

export async function storeUploadedFile(id: string, fileOrBlobOrDataUrl: Blob | File | string): Promise<void> {
  memoryCache.set(id, fileOrBlobOrDataUrl);
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fileOrBlobOrDataUrl, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[VSS Storage] Could not persist to IndexedDB, preserved in memory cache', err);
  }
}

export async function getUploadedFile(id: string): Promise<Blob | string | null> {
  if (memoryCache.has(id)) {
    return memoryCache.get(id) || null;
  }
  try {
    const db = await getDB();
    return await new Promise<Blob | string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result;
        if (result) memoryCache.set(id, result);
        resolve(result || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
