// =============================================================================
// FOOTBALL MANAGER 1980 — Speichern & Laden (localStorage)
// =============================================================================
// Speicherstände werden als JSON im Browser (localStorage) abgelegt. Der zentrale
// Game-Zustand ist ein reines Datenobjekt (Records + Arrays) und damit direkt
// serialisierbar. Zu jedem Slot wird Metadaten (Verein, Manager, Datum) geführt,
// damit der Lade-Screen eine Vorschau anzeigen kann.
// =============================================================================

import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

/** Format-Version des Speicherstands (für spätere Migrationen). */
// v5: Ligareform-System (game.appliedReforms). Ältere Stände werden in doLoad
//     nachgerüstet und bleiben ladbar.
// v6: DDR-Ligasystem (DDR-Oberliga/DDR-Liga bis 1991/92, Wiedervereinigungs-
//     Reform). v5-Stände vor der Wende erhalten die DDR-Pyramide in doLoad
//     nachgerüstet; Stände ab 1991/92 gelten als bereits integriert.
// v7: Neues Spieler-Attribut "Frische" (0–100, unabhängig von der Fitness).
//     Ältere Stände ohne `frische` erhalten in doLoad den Wert 100 (bzw. die
//     aktuelle Fitness als sinnvollen Startwert) nachgerüstet.
// v8: Kosmetische Vereins-Anpassung — optionale Felder `Club.customCrest`
//     (Data-URL-Wappen) und `Club.kits` (Heim-/Auswärtstrikot). Beide sind
//     OPTIONAL: Altstände ohne diese Felder bleiben voll ladbar; das Wappen
//     fällt auf das generierte SVG zurück und die Trikots werden aus
//     `Club.colors` abgeleitet (siehe data/kits.ts, ClubCrest.tsx). Es ist
//     daher keine aktive Migration in doLoad nötig.
//     HINWEIS: Die im Vereins-Editor gesetzten Anpassungen werden zusätzlich
//     SPIELWEIT und save-unabhängig in einem EIGENEN localStorage-Schlüssel
//     abgelegt (`fm1975_club_overrides`, keyed nach club.id — siehe
//     data/clubOverrides.ts). Dieser Store liegt AUSSERHALB des Save-Schemas,
//     gilt über alle Spielstände hinweg und erfordert KEINE SAVE_VERSION-
//     Erhöhung. Das Save-Objekt wird lediglich abwärtskompatibel mitgepflegt.
export const SAVE_VERSION = 9;

/** Metadaten eines Speicherstands (für die Slot-Übersicht). */
export interface SaveMeta {
  /** Slot-Schlüssel (z.B. "slot-1" oder "auto"). */
  slot: string;
  /** Anzeigename des Spielstands. */
  name: string;
  managerName: string;
  clubName: string;
  clubId: string;
  season: string;
  /** Aktuelles In-Game-Datum (ISO). */
  gameDate: string;
  /** Realer Zeitstempel des Speicherns (ISO). */
  savedAt: string;
  version: number;
}

/** Ein vollständiger Speicherstand: Metadaten + serialisierter Spielzustand. */
export interface SaveSlot<T = unknown> {
  meta: SaveMeta;
  game: T;
}

const KEY_PREFIX = 'fm1980_save_';
const INDEX_KEY = 'fm1980_saves_index';
const SETTINGS_KEY = 'fm1980_settings';

// Marker-Präfix für komprimierte Speicherstände. Ein Spielstand kann sehr groß
// werden (mehrere MB als JSON) und localStorage ist je Origin auf ~5 MB gedeckelt.
// Wir komprimieren den JSON daher mit lz-string (compressToUTF16, für die
// 2-Byte-Zeichen von localStorage optimiert) und legen ihn mit diesem Marker ab.
// Werte OHNE Marker sind unkomprimierte Altstände und bleiben abwärtskompatibel
// ladbar (siehe readSlot).
const LZ_MARKER = 'LZ1:';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Schreibt ein Save-Payload komprimiert in einen Slot.
 * Der JSON wird mit lz-string komprimiert und mit LZ_MARKER versehen.
 * Wirft bei Quota-Überschreitung (vom Aufrufer abgefangen).
 */
function writeSlot<T>(slot: string, payload: SaveSlot<T>): void {
  const json = JSON.stringify(payload);
  const compressed = LZ_MARKER + compressToUTF16(json);
  localStorage.setItem(KEY_PREFIX + slot, compressed);
}

/**
 * Liest ein Save-Payload aus einem Slot. Erkennt automatisch komprimierte
 * (LZ_MARKER) und unkomprimierte Altstände und liefert das geparste Objekt
 * bzw. null, falls der Slot leer/defekt ist.
 */
function readSlot<T>(slot: string): SaveSlot<T> | null {
  const raw = localStorage.getItem(KEY_PREFIX + slot);
  if (!raw) return null;
  if (raw.startsWith(LZ_MARKER)) {
    const json = decompressFromUTF16(raw.slice(LZ_MARKER.length));
    return safeParse<SaveSlot<T>>(json);
  }
  // Legacy: unkomprimierter Altstand
  return safeParse<SaveSlot<T>>(raw);
}

/** Ob localStorage in der aktuellen Umgebung verfügbar ist. */
export function storageAvailable(): boolean {
  try {
    const k = '__fm1980_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** Liest den Slot-Index (Liste aller Slot-Schlüssel). */
function readIndex(): string[] {
  return safeParse<string[]>(localStorage.getItem(INDEX_KEY)) ?? [];
}

function writeIndex(slots: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(Array.from(new Set(slots))));
}

/**
 * Speichert einen Spielstand unter dem angegebenen Slot.
 * @returns true bei Erfolg.
 */
export function saveGame<T>(slot: string, meta: Omit<SaveMeta, 'slot' | 'savedAt' | 'version'>, game: T): boolean {
  if (!storageAvailable()) return false;
  const fullMeta: SaveMeta = {
    ...meta,
    slot,
    savedAt: new Date().toISOString(),
    version: SAVE_VERSION,
  };
  const payload: SaveSlot<T> = { meta: fullMeta, game };
  try {
    writeSlot(slot, payload);
    const idx = readIndex();
    if (!idx.includes(slot)) writeIndex([...idx, slot]);
    return true;
  } catch {
    return false; // z.B. Quota überschritten
  }
}

/** Lädt einen kompletten Speicherstand (Meta + Spielzustand). */
export function loadGame<T>(slot: string): SaveSlot<T> | null {
  if (!storageAvailable()) return null;
  return readSlot<T>(slot);
}

/** Listet alle vorhandenen Speicherstände (Metadaten), neueste zuerst. */
export function listSaves(): SaveMeta[] {
  if (!storageAvailable()) return [];
  const metas: SaveMeta[] = [];
  for (const slot of readIndex()) {
    const s = readSlot(slot);
    if (s?.meta) metas.push(s.meta);
  }
  metas.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  return metas;
}

/** Löscht einen Speicherstand. */
export function deleteSave(slot: string): void {
  if (!storageAvailable()) return;
  localStorage.removeItem(KEY_PREFIX + slot);
  writeIndex(readIndex().filter((s) => s !== slot));
}

/** Ob mindestens ein Speicherstand existiert. */
export function hasSaves(): boolean {
  return listSaves().length > 0;
}

/** Erzeugt einen freien nummerierten Slot-Schlüssel (slot-1, slot-2, ...). */
export function nextFreeSlot(): string {
  const used = new Set(readIndex());
  for (let i = 1; i <= 99; i++) {
    const key = `slot-${i}`;
    if (!used.has(key)) return key;
  }
  return `slot-${Date.now()}`;
}

// -----------------------------------------------------------------------------
// Persistente App-Einstellungen (unabhängig vom Speicherstand)
// -----------------------------------------------------------------------------

/** Anzeige-Modus des Spiels (unabhängig von der gewählten Auflösung). */
export type DisplayMode = 'window' | 'borderless' | 'fullscreen';

/**
 * Gewählte Auflösung. `'auto'` = native Desktop-Auflösung (Spiel füllt den
 * Viewport responsiv). Andernfalls ein Wert der Form `"1920x1080"`, der das
 * Spiel in einem zentrierten Rahmen mit passendem Seitenverhältnis darstellt
 * (Letterboxing/Pillarboxing). Für spätere Steam-Version vorbereitet.
 */
export type ResolutionSetting = 'auto' | string;

/** Global persistierte Einstellungen (Startbildschirm → Einstellungen). */
export interface AppSettings {
  /** Auto-Advance-Geschwindigkeit in ms/Tag. */
  speedMs: number;
  /** Automatisch speichern (z.B. am Saisonende / bei Spieltagen). */
  autosave: boolean;
  /** Ton-/Effekt-Platzhalter für spätere Blöcke. */
  soundEnabled: boolean;
  /** Auflösung: 'auto' oder "BREITExHÖHE" (z.B. "1920x1080"). */
  resolution: ResolutionSetting;
  /** Anzeige-Modus: Fenster / Randlos / Vollbild. */
  displayMode: DisplayMode;
  /** UI-Skalierung in Prozent (80–150), Default 100. */
  uiScale: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  speedMs: 900,
  autosave: true,
  soundEnabled: false,
  resolution: 'auto',
  displayMode: 'window',
  uiScale: 100,
};

export function loadSettings(): AppSettings {
  if (!storageAvailable()) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...(safeParse<Partial<AppSettings>>(localStorage.getItem(SETTINGS_KEY)) ?? {}) };
}

export function saveSettings(s: AppSettings): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
