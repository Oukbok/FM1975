// =============================================================================
// Arbeitskopie des Editors: automatisch im Browser sichern (IndexedDB, mit
// localStorage als Rückfall). Getrennt von den Datensätzen des Spiels.
// =============================================================================
import { Dataset } from '../data/dataset/schema';

const DB = 'fm1975-editor';
const STORE = 'work';
const KEY = 'current';
const LS_KEY = 'fm1975_editor_work';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('kein IndexedDB')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveWork(d: Dataset): Promise<boolean> {
  try {
    const db = await open();
    await new Promise<void>((res, rej) => {
      const t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(JSON.parse(JSON.stringify(d)), KEY);
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
    });
    return true;
  } catch {
    try { localStorage.setItem(LS_KEY, JSON.stringify(d)); return true; } catch { return false; }
  }
}

export async function loadWork(): Promise<Dataset | null> {
  try {
    const db = await open();
    const v = await new Promise<Dataset | undefined>((res, rej) => {
      const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      r.onsuccess = () => res(r.result as Dataset | undefined);
      r.onerror = () => rej(r.error);
    });
    if (v) return v;
  } catch { /* Rückfall */ }
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) as Dataset : null; } catch { return null; }
}

/** Bild verkleinern (max. 256 px Kantenlänge) und als Data-URL liefern. */
export function imageToDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const src = String(reader.result);
      if (file.type === 'image/svg+xml') { resolve(src); return; }
      const img = new Image();
      img.onload = () => {
        const f = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * f));
        c.height = Math.max(1, Math.round(img.height * f));
        const ctx = c.getContext('2d');
        if (!ctx) { resolve(src); return; }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'));
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
