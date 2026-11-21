// =============================================================================
// SPIELSTÄNDE: SPEICHERORTE (Browser = IndexedDB, Desktop = Dateien)
// -----------------------------------------------------------------------------
// Ein Speicherort (`SaveBackend`) kennt nur: Liste der Metadaten, Stand schreiben,
// lesen, löschen – der Stand ist immer der JSON-Text { meta, game }.
//  • Browser: IndexedDB „fm1975-saves“ – Store `meta` (Slot → SaveMeta, für die
//    schnelle Liste) und Store `data` (Slot → JSON-Text, unkomprimiert).
//  • Desktop (Electron, desktop/): Dateien <userData>/saves/<slot>.fm1975save,
//    gzip-komprimiert und atomar geschrieben im Hauptprozess (desktop/saves.cjs),
//    erreichbar über `window.fm1975Desktop` (desktop/preload.cjs). Steam-Cloud
//    schließt später an diesen Ordner an.
// engine/save.ts wählt den Speicherort mit `pickSaveBackend`, hält die Metadaten
// zusätzlich im Speicher und zieht ältere Stände (localStorage, in der Desktop-
// Fassung auch IndexedDB) beim Start um.
// =============================================================================

/** Ein Speicherort für Spielstände. */
export interface SaveBackend {
  kind: 'indexeddb' | 'desktop';
  metas<M>(): Promise<M[]>;
  put(slot: string, meta: unknown, json: string): Promise<void>;
  get(slot: string): Promise<string | null>;
  remove(slot: string): Promise<void>;
}

/** Schnittstelle der Desktop-Hülle (desktop/preload.cjs). */
export interface DesktopApi {
  info(): Promise<{ version: string; platform: string; savesDir: string; electron?: string }>;
  saves: {
    list(): Promise<unknown[]>;
    read(slot: string): Promise<string | null>;
    write(slot: string, meta: unknown, json: string): Promise<void>;
    remove(slot: string): Promise<void>;
    openFolder(): Promise<unknown>;
  };
  setFullscreen(on: boolean): Promise<void>;
  setInGame(on: boolean): Promise<void>;
  quit(): Promise<void>;
}

/** Die Desktop-Hülle, falls das Spiel in Electron läuft (sonst null). */
export function desktopApi(): DesktopApi | null {
  try {
    const d = (globalThis as { fm1975Desktop?: DesktopApi }).fm1975Desktop;
    return d && typeof d.saves?.write === 'function' ? d : null;
  } catch { return null; }
}

function desktopBackend(d: DesktopApi): SaveBackend {
  return {
    kind: 'desktop',
    metas: async <M>() => (await d.saves.list()) as M[],
    put: (slot, meta, json) => d.saves.write(slot, meta, json),
    get: (slot) => d.saves.read(slot),
    remove: (slot) => d.saves.remove(slot),
  };
}

/** IndexedDB (Browser-Fassung; in der Desktop-Fassung nur noch Quelle für den einmaligen Umzug). */
export const idbBackend: SaveBackend = { kind: 'indexeddb', metas: idbMetas, put: idbPut, get: idbGet, remove: idbDelete };

/** Speicherort dieser Umgebung: Desktop-Dateien, sonst IndexedDB, sonst null (Rückfall localStorage in save.ts). */
export function pickSaveBackend(): SaveBackend | null {
  const d = desktopApi();
  if (d) return desktopBackend(d);
  return idbAvailable() ? idbBackend : null;
}

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

async function idbPut(slot: string, meta: unknown, json: string): Promise<void> {
  const db = await open();
  const t = db.transaction([META, DATA], 'readwrite');
  t.objectStore(DATA).put(json, slot);
  t.objectStore(META).put(meta, slot);
  await done(t);
}

async function idbGet(slot: string): Promise<string | null> {
  const db = await open();
  const t = db.transaction(DATA, 'readonly');
  const req = t.objectStore(DATA).get(slot);
  return new Promise((res, rej) => { req.onsuccess = () => res(typeof req.result === 'string' ? req.result : null); req.onerror = () => rej(req.error); });
}

async function idbMetas<M>(): Promise<M[]> {
  const db = await open();
  const t = db.transaction(META, 'readonly');
  const req = t.objectStore(META).getAll();
  return new Promise((res, rej) => { req.onsuccess = () => res((req.result ?? []) as M[]); req.onerror = () => rej(req.error); });
}

async function idbDelete(slot: string): Promise<void> {
  const db = await open();
  const t = db.transaction([META, DATA], 'readwrite');
  t.objectStore(DATA).delete(slot);
  t.objectStore(META).delete(slot);
  await done(t);
}
