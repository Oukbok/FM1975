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
// v10: Manager-KI — KI-Vereine haben Trainer (`Club.coach`, `Club.coachHistory`),
//     arbeitslose Trainer in `game.coachPool`, Kaderplanung in `game.aiMarket`.
//     Alle Felder optional; Altstände bekommen in doLoad (App.tsx →
//     migrateAiClubs, game/aiClubs.ts) Trainer zugewiesen.
// v11 (Sammel-Update): Hallenfußball (`game.indoor`: Turniere, Tour, Masters-Historie)
//     und Trainingslager (`game.camps`: Buchungen, KI-Lager, Verlauf). Beide optional,
//     Nachrüstung idempotent über migrateWinter (game/winterShared.ts) in doLoad.
//     Masters-Titel als TitleKind 'halle' in `clubRecords`.
// v11 (Sammel-Update): Stadionumfeld — optionales `Club.grounds` (Lage, Fläche,
//     Parkplätze, ÖPNV, Handel, Sicherheit, Hospitality, Medien, Bauvorhaben).
//     Altstände bekommen in doLoad (App.tsx → migrateGrounds, game/groundsGame.ts)
//     eine epochentypische Ausstattung; vorhandene Einrichtungen bleiben unverändert.
// v11 (Sammel-Update): Nachwuchs-Investitionen — `Club.youthInvest` (Bausteine,
//     Etat, Ausbildungsqualität, Ruf, Durchlässigkeit), `game.youthRace`,
//     `game.youthInvestTick`, `development.reserveMinutes`. Alle Felder optional;
//     Altstände werden in doLoad (App.tsx → migrateYouthInvest,
//     game/youthInvest.ts) idempotent aus der alten Akademie-Stufe abgeleitet.
// v11 (Sammel-Update): Finanzniveau realistisch (Erstligist 1975 ≈ 4,5 Mio. DM statt
//     ≈ 15 Mio.). Optionales Feld `Game.financeLevel` (fehlt = altes Niveau); doLoad
//     (App.tsx → migrateFinanceLevel, game/financeMigration.ts) rechnet Kontostände,
//     Bilanzen, Kredite, Gehälter, Budgets, Eintritt und Auslastung einmalig um.
export const SAVE_VERSION = 11;

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
  /** Textmodus: Lesetempo des Tickers. */
  matchTextSpeed?: 'langsam' | 'normal' | 'schnell' | 'rasant';
  /** Textmodus: Spannungsmoment bei Großchancen (Text löst sich erst spät auf). */
  matchSuspense?: boolean;
  /** Textmodus: zur Halbzeit anhalten (Wechsel-Bildschirm mit Halbzeitansprache). */
  matchHalftimeTalk?: boolean;
  /** Textmodus: Co-Trainer wechselt Verletzte/Erschöpfte selbst (engine/match/sideline.ts). */
  matchAutoSubs?: boolean;
  /** Textmodus: anhalten, wenn bei dir ein Wechsel ansteht (Verletzung, Platzverweis, Erschöpfung, Co-Trainer). */
  matchStopSubs?: boolean;
  /** Textmodus: zur Schlussphase (75.) anhalten. */
  matchStopLate?: boolean;
  /** Textmodus: anhalten, wenn deine Elf in Rückstand gerät. */
  matchStopBehind?: boolean;
  /** Häufigkeit der Zufalls- und Vereinsereignisse. */
  eventFrequency?: 'wenige' | 'normal' | 'viele';
  /** Saison-Briefing zu Spielbeginn und Saisonwechsel automatisch öffnen (Standard an). */
  briefingAuto?: boolean;
  /** Auftakt-Animation vor dem Saison-Briefing (views/zentrale/briefing/SeasonIntro.tsx). */
  briefingIntro?: boolean;
  /** Pokalauslosung als Show: immer, nur mit eigenem Verein (Standard) oder nur Nachricht. */
  drawShow?: 'immer' | 'eigener' | 'aus';
  /** Tempo der Ziehungs-Show. */
  drawSpeed?: 'langsam' | 'normal' | 'schnell';
  /** Bewertungsrunde als Show (screens/rating/) oder kompakte Liste. */
  ratingShow?: 'an' | 'aus';
  /** Tempo der Bewertungs-Show. */
  ratingSpeed?: 'langsam' | 'normal' | 'schnell';
  /** Gehälter pro Jahr (Standard) oder pro Woche anzeigen und eingeben (ui/format.ts `fmtWage`). */
  wagePeriod?: 'jahr' | 'woche';
}

export const DEFAULT_SETTINGS: AppSettings = {
  speedMs: 900,
  autosave: true,
  soundEnabled: false,
  resolution: 'auto',
  displayMode: 'window',
  uiScale: 100,
  matchTextSpeed: 'normal',
  matchSuspense: true,
  matchHalftimeTalk: true,
  matchAutoSubs: false,
  matchStopSubs: true,
  matchStopLate: false,
  matchStopBehind: false,
  eventFrequency: 'normal',
  briefingAuto: true,
  briefingIntro: true,
  drawShow: 'eigener',
  drawSpeed: 'normal',
  ratingShow: 'an',
  ratingSpeed: 'normal',
  wagePeriod: 'jahr',
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

// -----------------------------------------------------------------------------
// Vorlagen: mitgelieferte Spielstände (public/saves/index.json + Dateien im
// Speicherformat „LZ1:…“), für alle Spieler ladbar. Erzeugt mit
// `node scripts/make-test-save.mjs`. Beim Laden wird die Vorlage in einen
// eigenen Slot kopiert und dann wie ein normaler Spielstand geöffnet.
// -----------------------------------------------------------------------------
export interface BuiltinSave { file: string; name: string; clubName: string; season: string; gameDate: string; note?: string }

/** Liste der Vorlagen (leer, wenn nicht vorhanden oder offline). */
export async function fetchBuiltinSaves(): Promise<BuiltinSave[]> {
  try {
    const r = await fetch('saves/index.json', { cache: 'no-cache' });
    if (!r.ok) return [];
    const list = await r.json();
    return Array.isArray(list) ? list as BuiltinSave[] : [];
  } catch { return []; }
}

/** Kopiert eine Vorlage in einen Slot („vorlage-…“) und liefert den Slot-Schlüssel. */
export async function importBuiltinSave(b: BuiltinSave): Promise<string> {
  const r = await fetch(`saves/${b.file}`, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Vorlage ${b.file} nicht gefunden`);
  const raw = await r.text();
  const json = raw.startsWith(LZ_MARKER) ? decompressFromUTF16(raw.slice(LZ_MARKER.length)) : raw;
  const payload = safeParse<SaveSlot<unknown>>(json);
  if (!payload?.game) throw new Error('Vorlage ist beschädigt');
  const slot = `vorlage-${b.file.replace(/\.[a-z]+$/i, '')}`;
  payload.meta = { ...payload.meta, slot, name: b.name, clubName: b.clubName, season: b.season, gameDate: b.gameDate, savedAt: new Date().toISOString(), version: payload.meta?.version ?? SAVE_VERSION };
  writeSlot(slot, payload);
  const idx = readIndex();
  if (!idx.includes(slot)) writeIndex([...idx, slot]);
  return slot;
}
