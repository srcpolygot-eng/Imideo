/** IndexedDB persistence for Imideo projects (Part 0) */

import type { ImideoProject, ProjectMeta } from './types';

const DB_NAME = 'imideo_projects_v1';
const STORE = 'projects';
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
        const os = db.createObjectStore(STORE, { keyPath: 'meta.id' });
        os.createIndex('updatedAt', 'meta.updatedAt', { unique: false });
        os.createIndex('name', 'meta.name', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open DB'));
  });
}

export async function listProjects(): Promise<ProjectMeta[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const projects = (req.result as ImideoProject[]) || [];
      const metas = projects
        .map((p) => p.meta)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(metas);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadProject(id: string): Promise<ImideoProject | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as ImideoProject) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: ImideoProject): Promise<void> {
  const db = await openDb();
  const toSave: ImideoProject = {
    ...project,
    meta: { ...project.meta, updatedAt: Date.now() },
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(toSave);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function exportProjectJson(id: string): Promise<string | null> {
  const p = await loadProject(id);
  return p ? JSON.stringify(p, null, 2) : null;
}

export async function importProjectJson(json: string): Promise<ImideoProject> {
  const parsed = JSON.parse(json) as ImideoProject;
  if (!parsed?.meta?.id) throw new Error('Invalid project JSON');
  parsed.meta.updatedAt = Date.now();
  await saveProject(parsed);
  return parsed;
}
