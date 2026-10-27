// =============================================================================
// Datensätze speichern (IndexedDB, eigene Datenbank – unabhängig von Spielständen).
// =============================================================================
import { Dataset, DatasetSummary, validateDataset } from './schema';
import { BUILTIN_ID, builtinDataset } from './builtin';

const DB = 'fm1975-datasets';
const STORE = 'datasets';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB nicht verfügbar')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then((db) => new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  }));
}

export function summarize(d: Dataset, builtin = false): DatasetSummary {
  return {
    id: d.meta.id, name: d.meta.name, author: d.meta.author, description: d.meta.description,
    updated: d.meta.updated ?? d.meta.created, clubs: (d.clubs?.tier1?.length ?? 0) + (d.clubs?.secondNord?.length ?? 0) + (d.clubs?.secondSued?.length ?? 0),
    builtin,
  };
}

export async function listDatasets(): Promise<DatasetSummary[]> {
  const out: DatasetSummary[] = [summarize(builtinDataset(), true)];
  try {
    const all = await tx<Dataset[]>('readonly', (s) => s.getAll());
    for (const d of all) out.push(summarize(d));
  } catch { /* ohne IndexedDB nur der eingebaute */ }
  return out;
}

export async function loadDataset(id: string): Promise<Dataset | null> {
  if (id === BUILTIN_ID) return builtinDataset();
  try { return (await tx<Dataset | undefined>('readonly', (s) => s.get(id))) ?? null; } catch { return null; }
}

/** Speichert einen (geprüften) Datensatz. Liefert Fehlermeldungen oder []. */
export async function saveDataset(d: Dataset): Promise<string[]> {
  const errs = validateDataset(d);
  if (errs.length) return errs;
  if (d.meta.id === BUILTIN_ID) return ['Die ID „builtin“ ist für den eingebauten Datensatz reserviert.'];
  d.meta.updated = new Date().toISOString().slice(0, 10);
  await tx('readwrite', (s) => s.put(d, d.meta.id));
  return [];
}

export async function deleteDataset(id: string): Promise<void> {
  if (id === BUILTIN_ID) return;
  await tx('readwrite', (s) => s.delete(id));
}

/** Datei als Download anbieten (Browser). */
export function downloadDataset(d: Dataset): void {
  const blob = new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${d.meta.id}.fm1975.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** JSON-Datei einlesen und prüfen. */
export async function readDatasetFile(file: File): Promise<{ data?: Dataset; errors: string[] }> {
  try {
    const parsed = JSON.parse(await file.text());
    const errors = validateDataset(parsed);
    return errors.length ? { errors } : { data: parsed as Dataset, errors: [] };
  } catch {
    return { errors: ['Die Datei ist kein gültiges JSON.'] };
  }
}

// -----------------------------------------------------------------------------
// Synchroner Zwischenspeicher (beim App-Start befüllt), damit Laden/Neues Spiel
// den Datensatz ohne Warten anwenden können.
// -----------------------------------------------------------------------------
const cache = new Map<string, Dataset>();

export async function hydrateDatasets(): Promise<void> {
  try {
    const all = await tx<Dataset[]>('readonly', (s) => s.getAll());
    cache.clear();
    for (const d of all) cache.set(d.meta.id, d);
  } catch { /* ohne IndexedDB nur der eingebaute */ }
}

export function cachedDataset(id: string | undefined): Dataset | null {
  if (!id || id === BUILTIN_ID) return null;
  return cache.get(id) ?? null;
}

export function cachedSummaries(): DatasetSummary[] {
  return [summarize(builtinDataset(), true), ...[...cache.values()].map((d) => summarize(d))];
}

/** Speichern und Zwischenspeicher aktualisieren. */
export async function storeDataset(d: Dataset): Promise<string[]> {
  const errs = await saveDataset(d);
  if (!errs.length) cache.set(d.meta.id, d);
  return errs;
}

export async function removeDataset(id: string): Promise<void> {
  await deleteDataset(id);
  cache.delete(id);
}
