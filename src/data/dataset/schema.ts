// =============================================================================
// DATENSATZ-FORMAT („fm1975-dataset“) — alles, was Modder ändern können
// -----------------------------------------------------------------------------
// Ein Datensatz ist eine einzelne JSON-Datei. Er wird im externen Editor
// (/editor/) erstellt, im Spiel unter „Datensätze“ importiert und beim Start
// eines neuen Spiels gewählt. Der eingebaute Datensatz („builtin“) entspricht den
// Werten im Code; ein eigener Datensatz ersetzt ihn vollständig.
//
// Versionierung: `version` steigt bei inkompatiblen Änderungen. Fehlende Felder
// fallen beim Anwenden auf den eingebauten Datensatz zurück (abwärtskompatibel).
// =============================================================================
import type { ClubSeed, SecondLigaSeed } from '../generate';
import type { SimClub } from '../../engine/leagues';
import type { EuroClub } from '../europe';
import type { CountrySeed, CountrySplit } from '../worldSeed';
import type { TimelineEvent } from '../timeline';
import type { LeagueReform, DivisionTarget } from '../reforms';
import type { StaffRole } from '../staff';
import type { MarketingArea } from '../marketing';
import type { LegendSeed } from '../legends';
import type { Kit, FacilityKey } from '../../types';
import type { HistoryConfig } from '../history';

export const DATASET_FORMAT = 'fm1975-dataset';
export const DATASET_VERSION = 1;

export interface DatasetMeta {
  id: string;
  name: string;
  author?: string;
  description?: string;
  created: string;
  updated?: string;
}

/** Nur die serialisierbaren Felder einer Einrichtung (Effekte bleiben im Code). */
export interface FacilityData {
  key: FacilityKey;
  name: string;
  desc: string;
  baseCost: number;
  unlockYear?: number;
  obsoleteYear?: number;
}

export interface OriginData {
  id: string;
  nationality: string;
  face: string;
  first: string[];
  last: string[];
}

export interface Dataset {
  format: typeof DATASET_FORMAT;
  version: number;
  meta: DatasetMeta;
  clubs: {
    /** 1. Liga zum Start 1975/76 (18 Vereine). */
    tier1: ClubSeed[];
    secondNord: SecondLigaSeed[];
    secondSued: SecondLigaSeed[];
    ddrOberliga: SimClub[];
    ddrLiga: SimClub[];
  };
  /** Wappen je Vereins-ID (Data-URL, PNG/SVG). */
  crests?: Record<string, string>;
  /** Trikots je Vereins-ID. */
  kits?: Record<string, { home?: Kit; away?: Kit }>;
  europe: {
    countries: CountrySeed[];
    trends: Record<string, [number, number][]>;
    splits: CountrySplit[];
    exclusions: { country: string; from: number; to: number }[];
    /** Europapokal-Starter der ersten Saison (comp = Wettbewerb). */
    clubs: EuroClub[];
    /** Deutsche Starter der ersten Saison (Vereins-IDs). */
    firstSeasonGerman: { ec: string[]; cwc: string[]; uefa: string[] };
  };
  timeline: TimelineEvent[];
  leagues: {
    base: DivisionTarget[];
    reforms: LeagueReform[];
  };
  facilities: FacilityData[];
  staff: StaffRole[];
  marketing: MarketingArea[];
  names: {
    origins: OriginData[];
    /** Herkunfts-Mischung je Stützjahr. */
    mix: [number, Record<string, number>][];
    /** Gesperrte Namenskombinationen („Vorname Nachname“). */
    blocked: string[];
  };
  legends: LegendSeed[];
  economy: {
    /** Erlös-Basis der 1. Liga in EUR je Stützjahr. */
    anchors: { year: number; value: number }[];
    revenueMix: { year: number; matchday: number; tv: number; commercial: number }[];
    /** Rekordkurve der Ablösen (Spitzenablöse je Jahr in EUR, Welt und Deutschland). Optional. */
    transferRecords?: { year: number; world: number; germany: number }[];
  };
  history: HistoryConfig;
}

export interface DatasetSummary {
  id: string;
  name: string;
  author?: string;
  description?: string;
  updated?: string;
  clubs: number;
  builtin: boolean;
}

/** Kurzprüfung beim Import: Format, Version, Pflichtteile. Liefert Fehlermeldungen. */
export function validateDataset(d: unknown): string[] {
  const errs: string[] = [];
  const x = d as Partial<Dataset>;
  if (!x || typeof x !== 'object') return ['Keine gültige JSON-Struktur.'];
  if (x.format !== DATASET_FORMAT) errs.push('Unbekanntes Format (erwartet „fm1975-dataset“).');
  if (typeof x.version !== 'number' || x.version > DATASET_VERSION) errs.push(`Nicht unterstützte Version (${x.version}).`);
  if (!x.meta?.id || !x.meta?.name) errs.push('Meta-Angaben (id, name) fehlen.');
  const t1 = x.clubs?.tier1;
  if (!Array.isArray(t1) || t1.length < 6) errs.push('Die 1. Liga braucht mindestens 6 Vereine.');
  else {
    if (t1.length % 2 !== 0) errs.push('Die 1. Liga braucht eine gerade Zahl an Vereinen.');
    const ids = new Set<string>();
    for (const c of t1) {
      if (!c.id || !c.name) errs.push('Ein Verein der 1. Liga hat keine ID oder keinen Namen.');
      if (ids.has(c.id)) errs.push(`Doppelte Vereins-ID: ${c.id}`);
      ids.add(c.id);
    }
  }
  for (const k of ['secondNord', 'secondSued'] as const) {
    const l = x.clubs?.[k];
    if (l && l.length % 2 !== 0) errs.push(`${k === 'secondNord' ? '2. Liga Nord' : '2. Liga Süd'} braucht eine gerade Zahl an Vereinen.`);
  }
  return errs;
}
