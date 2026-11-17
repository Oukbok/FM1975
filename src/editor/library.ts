// =============================================================================
// BIBLIOTHEK DER DATENSÄTZE (Editor › Datensätze, Wunsch Pascal): Kennzahlen je
// gespeichertem Datensatz für die Übersicht – Größe der Datei, Zahl der
// Änderungen gegenüber dem Standard, Zahl der Bilder.
// =============================================================================
import type { Dataset } from '../data/dataset/schema';
import { diffDataset } from './diff';

export interface DatasetStats { bytes: number; changes: number; moreChanges: boolean; images: number; portraits: number }

/** Bilder im Datensatz: Wappen, spätere Wappen, Spielerfotos, Spielerbilder. */
export function countImages(d: Dataset): { images: number; portraits: number } {
  const crests = Object.keys(d.crests ?? {}).length;
  const eras = Object.values(d.crestEras ?? {}).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
  const sets = Array.isArray(d.playerPhotos) ? d.playerPhotos : [];
  const photos = sets.reduce((n, e) => n + (e.photos?.length ?? 0), 0);
  const portraits = sets.filter((e) => !!e.portrait).length;
  return { images: crests + eras + photos + portraits, portraits };
}

export function datasetStats(d: Dataset, std: Dataset): DatasetStats {
  const bytes = new Blob([JSON.stringify(d)]).size;
  // Meta (Name, Datum …) zählt nicht als Änderung am Inhalt.
  const { changes, more } = diffDataset(std, { ...d, meta: std.meta }, 999);
  return { bytes, changes: changes.length, moreChanges: more, ...countImages(d) };
}

export function fmtBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1048576).toFixed(n < 10 * 1048576 ? 1 : 0).replace('.', ',')} MB`;
}

/** „17.11.2026, 14:05“ bzw. nur Datum, wenn keine Uhrzeit gespeichert ist. */
export function fmtStand(d: Pick<Dataset['meta'], 'savedAt' | 'updated' | 'created'>): string {
  if (d.savedAt) {
    const t = new Date(d.savedAt);
    if (!Number.isNaN(t.getTime())) return t.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  const day = d.updated ?? d.created;
  return day ? day.split('-').reverse().join('.') : '–';
}
