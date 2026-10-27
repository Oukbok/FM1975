// =============================================================================
// ZENTRALE WAHRHEIT = SERVER (api/overrides). IndexedDB ist ab jetzt nur noch
// Offline-Cache/Spiegel. Beim App-Start ist der Server maßgeblich; lokale Daten
// (IndexedDB/Legacy-localStorage) werden einmalig nach oben migriert, wenn der
// Server erreichbar aber leer ist. Ein späterer Spiel-Export kann direkt aus dem
// Server schöpfen. Ist der Server nicht erreichbar, greift der lokale Fallback.
// =============================================================================
// Vereins-Overrides — SPIELWEITE, save-unabhängige kosmetische Anpassungen
// =============================================================================
// Anders als Club.customCrest / Club.kits (die im jeweiligen Speicherstand
// liegen) werden hier die im Vereins-Editor gesetzten Wappen/Trikots in einem
// EIGENEN, save-unabhängigen Store abgelegt, keyed nach club.id (und stabiler
// Stadt-Kennung). Dadurch gelten die Anpassungen:
//   • über ALLE Speicherstände hinweg,
//   • auch für neu gestartete Spiele,
//   • und überleben Save-Wechsel / Neustart / Reload.
// PERSISTENZ = IndexedDB (nicht localStorage): Ein großer Speicherstand füllt
// localStorage (~5MB) schnell, wodurch das Schreiben eines Wappens mit
// QuotaExceededError scheitert. IndexedDB hat ein deutlich größeres Kontingent
// und konkurriert nicht mit dem Save. Ein synchroner In-Memory-Cache bedient
// die (im Render aufgerufenen) synchronen Getter; Schreibvorgänge aktualisieren
// den Cache sofort und persistieren asynchron nach IndexedDB.
// <ClubCrest> und die Trikot-Renderstellen lesen ZUERST diesen Store und fallen
// erst danach auf die Save-Felder bzw. das generierte Standard-Design zurück.
// Rein kosmetisch — kein Einfluss auf die Simulation.
// =============================================================================
import { Club, Kit } from '../types';
import { defaultCrestFor } from './defaultCrests';

/** Ein einzelnes Trikot-Override: entweder ein Design (Farben+Muster) ODER ein
 *  hochgeladenes Bild (Data-URL). Ist `image` gesetzt, hat es Vorrang. */
export interface KitOverride {
  /** Hochgeladenes Trikotbild als Data-URL (Vorrang vor `design`). */
  image?: string;
  /** Trikot-Design (Grundfarbe + Zweitfarbe + Muster). */
  design?: Kit;
}

/** Alle spielweiten Overrides eines Vereins. */
export interface ClubOverride {
  /** Wappen als Data-URL. */
  crest?: string;
  /** Heimtrikot-Override. */
  home?: KitOverride;
  /** Auswärtstrikot-Override. */
  away?: KitOverride;
}

/** Alter localStorage-Schlüssel (nur noch für die einmalige Migration relevant). */
const LEGACY_LS_KEY = 'fm1975_club_overrides';

/** IndexedDB-Koordinaten des spielweiten Override-Stores. */
const IDB_NAME = 'fm1975';
const IDB_STORE = 'overrides';
/** Fixer Datensatz-Key: die komplette Map liegt als ein Wert vorn. */
const IDB_RECORD = 'all';

/**
 * Synchroner In-Memory-Cache der kompletten Override-Map. ALLE synchronen Getter
 * lesen ausschließlich hieraus (nötig, weil sie im Render aufgerufen werden).
 * Wird beim App-Start via hydrateClubOverrides() aus IndexedDB befüllt.
 */
let cache: Record<string, ClubOverride> = {};
let hydrated = false;

/**
 * Stabile, roster-unabhängige Kennung aus der Stadt. Neu generierte Spiele nutzen
 * andere club.id-Werte, aber dieselbe Stadt — daher wird ein Override zusätzlich
 * unter diesem Schlüssel abgelegt, damit er auch dort greift.
 * Beispiel: "Mönchengladbach" → "city:moenchengladbach".
 */
export function cityKey(city: string): string {
  const norm = (city || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
  return 'city:' + norm;
}

// ---------------------------------------------------------------------------
// IndexedDB-Kapselung (kleine Promise-Helfer; Fehler crashen die App NIE)
// ---------------------------------------------------------------------------

/** Öffnet (bzw. erstellt) die IndexedDB. Rejectet bei Nichtverfügbarkeit. */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB nicht verfügbar')); return; }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB-Open fehlgeschlagen'));
    } catch (e) {
      reject(e);
    }
  });
}

/** Liest die komplette Map aus IndexedDB (oder {} wenn nichts vorhanden). */
async function idbGetAll(): Promise<Record<string, ClubOverride>> {
  const db = await openDB();
  try {
    return await new Promise<Record<string, ClubOverride>>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_RECORD);
      req.onsuccess = () => {
        const v = req.result;
        resolve(v && typeof v === 'object' ? (v as Record<string, ClubOverride>) : {});
      };
      req.onerror = () => reject(req.error ?? new Error('IndexedDB-Get fehlgeschlagen'));
    });
  } finally {
    db.close();
  }
}

/** Persistiert die komplette Map nach IndexedDB. */
async function idbPutAll(map: Record<string, ClubOverride>): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(map, IDB_RECORD);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB-Put fehlgeschlagen'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB-Put abgebrochen'));
    });
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Server-Kapselung (relative URLs mit Prefix "api"; der Server ist die zentrale
// Wahrheit). Alle Helfer sind so gebaut, dass Aufrufer ihre Fehler abfangen.
// ---------------------------------------------------------------------------

/** Basis-Pfad der Override-API (relativ, hinter demselben Origin). */
const API_BASE = 'api/overrides';

/** GET api/overrides → komplette Map. Timeout via AbortController (~8s). */
async function serverGetAll(): Promise<Record<string, ClubOverride>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(API_BASE, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Server-GET fehlgeschlagen: ' + res.status);
    const data = await res.json();
    return data && typeof data === 'object' ? (data as Record<string, ClubOverride>) : {};
  } finally {
    clearTimeout(timer);
  }
}

/** PUT api/overrides mit der kompletten Map (einmalige Hochwärts-Migration). */
async function serverPutAll(map: Record<string, ClubOverride>): Promise<void> {
  const res = await fetch(API_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(map),
  });
  if (!res.ok) throw new Error('Server-PUT (all) fehlgeschlagen: ' + res.status);
}

/** PUT api/overrides/:key — schreibt EIN Override auf den Server. */
async function serverPutKey(key: string, ov: ClubOverride): Promise<void> {
  const res = await fetch(API_BASE + '/' + encodeURIComponent(key), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ov),
  });
  if (!res.ok) throw new Error('Server-PUT (key) fehlgeschlagen: ' + res.status);
}

/** DELETE api/overrides/:key — entfernt EIN Override auf dem Server. */
async function serverDeleteKey(key: string): Promise<void> {
  const res = await fetch(API_BASE + '/' + encodeURIComponent(key), { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('Server-DELETE fehlgeschlagen: ' + res.status);
}

/**
 * Liest die lokalen Daten (IndexedDB, danach Legacy-localStorage). Führt die
 * Legacy-Migration NICHT selbst durch, sondern liefert nur die gefundene Map —
 * so kann der Aufrufer entscheiden, ob nach IndexedDB und/oder Server gespiegelt
 * wird. Wirft NIE (leere Map als Fallback).
 */
async function readLocal(): Promise<Record<string, ClubOverride>> {
  try {
    const fromIdb = await idbGetAll();
    if (fromIdb && Object.keys(fromIdb).length > 0) return fromIdb;
  } catch { /* IndexedDB nicht verfügbar — weiter mit localStorage */ }
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, ClubOverride>;
    }
  } catch { /* localStorage nicht lesbar — ignorieren */ }
  return {};
}

/**
 * Lokaler Fallback-Pfad (Server nicht erreichbar): bisheriges Verhalten —
 * IndexedDB zuerst, danach einmalige Migration aus dem alten localStorage-
 * Schlüssel. Setzt den Cache. Wirft NIE.
 */
async function hydrateFromLocal(): Promise<void> {
  try {
    const fromIdb = await idbGetAll();
    if (fromIdb && Object.keys(fromIdb).length > 0) {
      cache = fromIdb;
      return;
    }
    // MIGRATION: IndexedDB leer → ggf. alten localStorage-Store übernehmen.
    let migrated: Record<string, ClubOverride> | null = null;
    try {
      const raw = localStorage.getItem(LEGACY_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') migrated = parsed as Record<string, ClubOverride>;
      }
    } catch { /* localStorage nicht lesbar — ignorieren */ }
    if (migrated && Object.keys(migrated).length > 0) {
      cache = migrated;
      try { await idbPutAll(cache); } catch { /* Persistenz best effort */ }
      // Alten Schlüssel entfernen, um knappen localStorage-Platz freizugeben.
      try { localStorage.removeItem(LEGACY_LS_KEY); } catch { /* ignorieren */ }
    } else {
      cache = {};
    }
  } catch {
    // IndexedDB nicht verfügbar (z.B. Privatmodus) → Cache bleibt session-basiert.
    cache = cache && Object.keys(cache).length > 0 ? cache : {};
  }
}

/**
 * Befüllt den synchronen Cache beim App-Start. Der SERVER ist die zentrale
 * Wahrheit:
 *   (a) Server erreichbar & liefert Daten → Cache = Server-Map, Spiegelung nach
 *       IndexedDB als Offline-Cache.
 *   (b) Server erreichbar aber LEER, während lokal Daten existieren → einmalige
 *       Migration nach oben (PUT api/overrides mit den lokalen Daten),
 *       Cache = lokale Daten.
 *   (c) Server NICHT erreichbar (Fehler/Timeout) → Fallback auf das bisherige
 *       lokale Verhalten (IndexedDB, dann Legacy-localStorage-Migration).
 * MUSS beim App-Start aufgerufen werden (App.tsx), danach ein rerender().
 * Signatur unverändert; wirft NIE und setzt am Ende hydrated = true.
 */
export async function hydrateClubOverrides(): Promise<void> {
  try {
    let serverMap: Record<string, ClubOverride> | null = null;
    try {
      serverMap = await serverGetAll();
    } catch {
      serverMap = null; // Server nicht erreichbar → (c)
    }

    if (serverMap !== null) {
      if (Object.keys(serverMap).length > 0) {
        // (a) Server hat Daten → zentrale Wahrheit übernehmen und spiegeln.
        cache = serverMap;
        try { await idbPutAll(cache); } catch { /* Offline-Spiegel best effort */ }
      } else {
        // (b) Server erreichbar aber leer → lokale Daten ggf. nach oben migrieren.
        const local = await readLocal();
        if (Object.keys(local).length > 0) {
          cache = local;
          try { await serverPutAll(local); } catch { /* Hochwärts-Migration best effort */ }
          try { await idbPutAll(cache); } catch { /* Offline-Spiegel best effort */ }
          try { localStorage.removeItem(LEGACY_LS_KEY); } catch { /* ignorieren */ }
        } else {
          cache = {};
        }
      }
    } else {
      // (c) Server nicht erreichbar → lokaler Fallback (bisheriges Verhalten).
      await hydrateFromLocal();
    }
  } catch {
    // Sicherheitsnetz: nichts darf nach oben durchschlagen.
    cache = cache && Object.keys(cache).length > 0 ? cache : {};
  } finally {
    hydrated = true;
  }
}

/** Ob der Cache bereits hydratisiert wurde (informativ). */
export function overridesHydrated(): boolean {
  return hydrated;
}

/** Persistiert den aktuellen Cache asynchron nach IndexedDB (fire-and-forget). */
function persist(): void {
  idbPutAll(cache).catch(() => {
    // eslint-disable-next-line no-console
    console.warn('Vereins-Override konnte nicht dauerhaft gespeichert werden – bleibt für diese Sitzung aktiv.');
  });
}

/**
 * Schreibt EIN Override fire-and-forget auf den Server. Blockiert den Editor
 * NICHT und wirft NIE — Fehler werden nur geloggt (IndexedDB bleibt Offline-
 * Cache; die nächste Hydration gleicht ab).
 */
function serverSyncPut(key: string, ov: ClubOverride): void {
  serverPutKey(key, ov).catch(() => {
    // eslint-disable-next-line no-console
    console.warn('Vereins-Override konnte nicht zum Server synchronisiert werden – lokal gespeichert.');
  });
}

/** Löscht EIN Override fire-and-forget auf dem Server. Wirft NIE. */
function serverSyncDelete(key: string): void {
  serverDeleteKey(key).catch(() => {
    // eslint-disable-next-line no-console
    console.warn('Vereins-Override-Löschung konnte nicht zum Server synchronisiert werden.');
  });
}

/** Liest die komplette Override-Map (aus dem synchronen Cache). */
export function loadClubOverrides(): Record<string, ClubOverride> {
  return cache;
}

/** Liefert das Override zu einer Kennung (reiner id-Lookup, rückwärtskompatibel). */
export function getClubOverride(clubId: string): ClubOverride | undefined {
  return cache[clubId];
}

/**
 * Liefert das Override eines Vereins. club.id hat Vorrang; als Fallback wird die
 * stabile Stadt-Kennung genutzt, damit hochgeladene Wappen/Trikots auch in neu
 * generierten Spielen (anderer Roster, andere club.id) greifen.
 */
export function getClubOverrideForClub(club: Club): ClubOverride | undefined {
  const all = loadClubOverrides();
  return all[club.id] ?? (club.city ? all[cityKey(club.city)] : undefined);
}

/** Ob ein Kit-Override tatsächlich Inhalt trägt (Bild oder Design). */
function kitHasContent(k?: KitOverride): boolean {
  return !!k && (!!k.image || !!k.design);
}

/**
 * Setzt das komplette Override eines Vereins. Leere Teile werden entfernt;
 * ist danach nichts mehr gesetzt, wird der Vereins-Eintrag komplett gelöscht
 * (entspricht „vollständig zurückgesetzt").
 */
export function setClubOverride(club: Club, ov: ClubOverride): void {
  const clean: ClubOverride = {};
  if (ov.crest) clean.crest = ov.crest;
  if (kitHasContent(ov.home)) clean.home = ov.home;
  if (kitHasContent(ov.away)) clean.away = ov.away;
  const cKey = club.city ? cityKey(club.city) : null;
  if (!clean.crest && !clean.home && !clean.away) {
    delete cache[club.id];
    if (cKey) delete cache[cKey];
    // Server (zentrale Wahrheit) informieren: betroffene Keys löschen.
    serverSyncDelete(club.id);
    if (cKey) serverSyncDelete(cKey);
  } else {
    cache[club.id] = clean;
    // Zusätzlich unter der stabilen Stadt-Kennung ablegen, damit der Override
    // auch in neu generierten Spielen (andere club.id, gleiche Stadt) greift.
    if (cKey) cache[cKey] = clean;
    // Server (zentrale Wahrheit) informieren: betroffene Keys schreiben.
    serverSyncPut(club.id, clean);
    if (cKey) serverSyncPut(cKey, clean);
  }
  persist();
}

/** Entfernt das komplette Override eines Vereins (id- UND Stadt-Kennung). */
export function clearClubOverride(club: Club): void {
  let changed = false;
  if (cache[club.id]) { delete cache[club.id]; changed = true; }
  const cKey = club.city ? cityKey(club.city) : null;
  if (cKey && cache[cKey]) { delete cache[cKey]; changed = true; }
  if (changed) persist();
  // Server (zentrale Wahrheit) immer informieren — auch wenn lokal nichts stand.
  serverSyncDelete(club.id);
  if (cKey) serverSyncDelete(cKey);
}

/**
 * Effektives Wappen-Bild eines Vereins: spielweiter Override zuerst, danach das
 * (save-gebundene) Club.customCrest, danach das mitgelieferte Standard-Wappen
 * (public/assets/crests). `undefined` → generiertes SVG-Wappen.
 * Vom Nutzer hochgeladene Wappen haben also immer Vorrang vor den Defaults.
 */
export function resolveCrestImage(club: Club): string | undefined {
  return getClubOverrideForClub(club)?.crest ?? club.customCrest ?? defaultCrestFor(club.id);
}
