// =============================================================================
// SPIELSTÄNDE IN INDEXEDDB (Wunsch Pascal: lange Spielstände + alle Ligen Spiel
// für Spiel sprengen das ~5-MB-Limit von localStorage)
// -----------------------------------------------------------------------------
// Datenbank „fm1975-saves“: Store `meta` (Slot → SaveMeta, für die schnelle
// Liste) und Store `data` (Slot → Spielstand als JSON-Text). IndexedDB hat je
// nach Browser Hunderte MB bis GB Platz; komprimiert wird nicht mehr (schneller).
// engine/save.ts hält die Metadaten zusätzlich im Speicher, damit Liste und
// freie Slots synchron bleiben, und zieht alte localStorage-Stände beim Start um.
// =============================================================================

const DB = 'fm1975-saves';
const META = 'meta';
const DATA = 'data';

let dbp: Promise<IDBDatabase> | null = null;

export function idbAvailable(): boolean {
  try { return typeof indexedDB !== 'undefined' && indexedDB !== null; } catch { return false; }
}

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      if (!db.objectStoreNames.contains(DATA)) db.createObjectStore(DATA);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbp = null; reject(req.error); };
    req.onblocked = () => { dbp = null; reject(new Error('IndexedDB blockiert')); };
  });
  return dbp;
}

function done(t: IDBTransaction): Promise<void> {
  return new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error ?? new Error('abgebrochen')); });
}

export async function idbPut(slot: string, meta: unknown, json: string): Promise<void> {
  const db = await open();
  const t = db.transaction([META, DATA], 'readwrite');
  t.objectStore(DATA).put(json, slot);
  t.objectStore(META).put(meta, slot);
  await done(t);
}

export async function idbGet(slot: string): Promise<string | null> {
  const db = await open();
  const t = db.transaction(DATA, 'readonly');
  const req = t.objectStore(DATA).get(slot);
  return new Promise((res, rej) => { req.onsuccess = () => res(typeof req.result === 'string' ? req.result : null); req.onerror = () => rej(req.error); });
}

export async function idbMetas<M>(): Promise<M[]> {
  const db = await open();
  const t = db.transaction(META, 'readonly');
  const req = t.objectStore(META).getAll();
  return new Promise((res, rej) => { req.onsuccess = () => res((req.result ?? []) as M[]); req.onerror = () => rej(req.error); });
}

export async function idbDelete(slot: string): Promise<void> {
  const db = await open();
  const t = db.transaction([META, DATA], 'readwrite');
  t.objectStore(DATA).delete(slot);
  t.objectStore(META).delete(slot);
  await done(t);
}
