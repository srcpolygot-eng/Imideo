/** IndexedDB asset library — shared across Products / Image / Video (Part 1) */

import type { LibraryAsset, AssetKind } from './types';
import { newAssetId } from './types';

const DB_NAME = 'imideo_assets_v1';
const STORE = 'assets';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('kind', 'kind', { unique: false });
        os.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open assets DB'));
  });
}

export async function listAssets(kind?: AssetKind): Promise<LibraryAsset[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = kind ? store.index('kind').getAll(kind) : store.getAll();
    req.onsuccess = () => {
      const list = ((req.result as LibraryAsset[]) || []).sort(
        (a, b) => b.createdAt - a.createdAt
      );
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAsset(id: string): Promise<LibraryAsset | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as LibraryAsset) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function putAsset(asset: LibraryAsset): Promise<LibraryAsset> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(asset);
    tx.oncomplete = () => resolve(asset);
    tx.onerror = () => reject(tx.error);
  });
}

export async function addAssetFromDataUrl(opts: {
  name: string;
  kind: AssetKind;
  src: string;
  mimeType?: string;
  source?: LibraryAsset['source'];
  tags?: string[];
  width?: number;
  height?: number;
  duration?: number;
}): Promise<LibraryAsset> {
  const asset: LibraryAsset = {
    id: newAssetId(),
    name: opts.name,
    kind: opts.kind,
    src: opts.src,
    mimeType: opts.mimeType,
    source: opts.source || 'upload',
    tags: opts.tags || [],
    width: opts.width,
    height: opts.height,
    duration: opts.duration,
    createdAt: Date.now(),
    sizeBytes: Math.round((opts.src.length * 3) / 4),
  };
  return putAsset(asset);
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllAssets(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
