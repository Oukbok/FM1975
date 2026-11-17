// =============================================================================
// Datensätze speichern (IndexedDB, eigene Datenbank – unabhängig von Spielständen).
// Bibliothek = alle gespeicherten Datensätze (Editor › Datensätze, Hauptmenü ›
// Datensätze). „Im Spiel aktiv“ = Vorauswahl für neue Spiele (localStorage, gilt
// für Spiel und Editor – gleiche Herkunft, auch unter app:// in Electron).
// Datei-Format beim Export: `<id>.fm1975` = eine JSON-Datei mit allen Daten inkl.
// Bildern als Data-URL; Import liest auch `.json` und gzip-gepackte Dateien.
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
    updated: d.meta.updated ?? d.meta.created, savedAt: d.meta.savedAt, clubs: (d.clubs?.tier1?.length ?? 0) + (d.clubs?.secondNord?.length ?? 0) + (d.clubs?.secondSued?.length ?? 0),
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
  if (!/^[a-z0-9_-]+$/.test(d.meta.id)) return [`Die ID „${d.meta.id}“ ist ungültig – nur Kleinbuchstaben, Ziffern, - und _.`];
  const now = new Date().toISOString();
  d.meta.updated = now.slice(0, 10);
  d.meta.savedAt = now;
  await tx('readwrite', (s) => s.put(d, d.meta.id));
  return [];
}

export async function deleteDataset(id: string): Promise<void> {
  if (id === BUILTIN_ID) return;
  await tx('readwrite', (s) => s.delete(id));
}

/** Alle gespeicherten Datensätze vollständig (ohne den eingebauten). */
export async function loadAllDatasets(): Promise<Dataset[]> {
  try { return await tx<Dataset[]>('readonly', (s) => s.getAll()); } catch { return []; }
}

// -----------------------------------------------------------------------------
// Datei: Export/Import
// -----------------------------------------------------------------------------
export const DATASET_EXT = '.fm1975';
/** Dateiendungen, die der Import annimmt (für `accept`). */
export const DATASET_ACCEPT = '.fm1975,.json,.gz,application/json,application/gzip';
/** Obergrenze einer Import-Datei (Bilder stecken als Data-URL darin). */
export const DATASET_MAX_BYTES = 400 * 1024 * 1024;

export const datasetFileName = (d: Dataset) => `${d.meta.id}${DATASET_EXT}`;

/** Datensatz als Datei-Inhalt (kompaktes JSON – Bilder als Data-URL, ein Stück). */
export function datasetBlob(d: Dataset): Blob {
  return new Blob([JSON.stringify(d)], { type: 'application/json' });
}

/** Datei als Download anbieten (Browser und Electron). */
export function downloadDataset(d: Dataset): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(datasetBlob(d));
  a.download = datasetFileName(d);
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

async function fileText(file: Blob): Promise<string> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (head[0] === 0x1f && head[1] === 0x8b) {
    // gzip-gepackt (z. B. von Hand komprimiert): im Browser entpacken.
    if (typeof DecompressionStream === 'undefined') throw new Error('Gepackte Dateien kann dieser Browser nicht lesen – bitte entpackt importieren.');
    return await new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }
  return await file.text();
}

/**
 * Datensatz-Datei einlesen und prüfen. Liefert den Datensatz oder verständliche
 * Fehlermeldungen (leer, zu groß, kein JSON, Spielstand statt Datensatz, Format/Version).
 */
export async function readDatasetFile(file: File | Blob): Promise<{ data?: Dataset; errors: string[] }> {
  const name = (file as File).name ?? 'Datei';
  if (!file.size) return { errors: [`„${name}“ ist leer.`] };
  if (file.size > DATASET_MAX_BYTES) return { errors: [`„${name}“ ist zu groß (${Math.round(file.size / 1048576)} MB, höchstens ${DATASET_MAX_BYTES / 1048576} MB).`] };
  let text: string;
  try { text = await fileText(file); } catch (e) { return { errors: [(e as Error).message || `„${name}“ konnte nicht gelesen werden.`] }; }
  let parsed: unknown;
  try { parsed = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (e) {
    const t = text.trimStart();
    const why = t.startsWith('PK') ? 'Das ist ein ZIP-Archiv (z. B. ein Grafikpaket) – Grafikpakete importierst du im Editor unter „Grafikpakete“.'
      : t.startsWith('LZ1:') ? 'Das ist ein Spielstand, kein Datensatz.'
      : `Kein gültiges JSON (${(e as Error).message}).`;
    return { errors: [`„${name}“ ist keine Datensatz-Datei. ${why}`] };
  }
  const x = parsed as Record<string, unknown> | null;
  if (x && typeof x === 'object' && !('format' in x) && ('calendar' in x || 'managedClubId' in x)) return { errors: [`„${name}“ ist ein Spielstand, kein Datensatz.`] };
  const errors = validateDataset(parsed);
  if (errors.length) return { errors: [`„${name}“ ist kein gültiger Datensatz:`, ...errors] };
  return { data: parsed as Dataset, errors: [] };
}

/** ID aus einem Namen („Meine Liga 1975“ → „meine-liga-1975“). */
export function slugId(name: string): string {
  const s = name.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return s && s !== BUILTIN_ID ? s : 'datensatz';
}

/** Freie ID: `base`, sonst `base-2`, `base-3` … */
export function freeDatasetId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  used.add(BUILTIN_ID);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// -----------------------------------------------------------------------------
// Aktiver Datensatz („Im Spiel verwenden“) + Benachrichtigung zwischen Editor und
// Spiel (BroadcastChannel; andere Fenster derselben Herkunft laden neu).
// -----------------------------------------------------------------------------
const ACTIVE_KEY = 'fm1975_active_dataset';
const CHANNEL = 'fm1975-datasets';

/** Datensatz, mit dem neue Spiele starten (Vorauswahl im Assistenten). Fehlt = Standard. */
export function activeDatasetChoice(): string {
  try { return localStorage.getItem(ACTIVE_KEY) || BUILTIN_ID; } catch { return BUILTIN_ID; }
}

export function setActiveDatasetChoice(id: string): void {
  try { if (id === BUILTIN_ID) localStorage.removeItem(ACTIVE_KEY); else localStorage.setItem(ACTIVE_KEY, id); } catch { /* ohne Speicher */ }
  notifyDatasetsChanged();
}

export function notifyDatasetsChanged(): void {
  try { const c = new BroadcastChannel(CHANNEL); c.postMessage('changed'); c.close(); } catch { /* ältere Umgebung */ }
}

/** Rückruf, wenn ein anderes Fenster Datensätze gespeichert/gelöscht oder den aktiven gewechselt hat. */
export function onDatasetsChanged(cb: () => void): () => void {
  try {
    const c = new BroadcastChannel(CHANNEL);
    c.onmessage = () => cb();
    return () => c.close();
  } catch { return () => undefined; }
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

/** Aktiver Datensatz, falls hier installiert – sonst der Standard. */
export function activeDatasetIdCached(): string {
  const id = activeDatasetChoice();
  return id === BUILTIN_ID || cache.has(id) ? id : BUILTIN_ID;
}

/** Speichern und Zwischenspeicher aktualisieren (andere Fenster werden benachrichtigt). */
export async function storeDataset(d: Dataset): Promise<string[]> {
  const errs = await saveDataset(d);
  if (!errs.length) { cache.set(d.meta.id, d); notifyDatasetsChanged(); }
  return errs;
}

/** Löschen; war er im Spiel aktiv, gilt danach wieder der Standard. */
export async function removeDataset(id: string): Promise<void> {
  await deleteDataset(id);
  cache.delete(id);
  if (activeDatasetChoice() === id) setActiveDatasetChoice(BUILTIN_ID);
  else notifyDatasetsChanged();
}
