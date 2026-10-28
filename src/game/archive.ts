// =============================================================================
// SPIELER-ARCHIV: Nach dem Karriereende bleiben nur Eckdaten.
// -----------------------------------------------------------------------------
// Statt vollständiger Spieler (Attribute, Historie …) behält der Spielstand
// kompakte Einträge – für Ruhmeshalle, Rekorde und Chronik. Archiviert werden
// bemerkenswerte Karrieren (Spitzenstärke ≥ 78, Legenden, viele Einsätze)
// und alle Spieler, die zuletzt bei deinem Verein waren. Höchstens 4000 Einträge.
// =============================================================================
import { Player } from '../types';
import { Game } from './state';

export interface ArchivedPlayer {
  id: string;
  name: string;
  nationality: string;
  pos: string;
  born: number;
  retired: number;
  peak: number;
  apps: number;
  goals: number;
  /** Stationen in Reihenfolge (Vereinsnamen). */
  clubs: string[];
  lastClubId: string;
  legendId?: string;
}

const MAX = 4000;

export function archiveRetired(g: Game, p: Player, date: string): void {
  const peak = Math.max(p.overall, ...(p.development.abilityHistory ?? []).map((h) => h.ability));
  const apps = p.careerStats?.appearances ?? 0;
  const mine = p.clubId === g.managedClubId;
  if (!(peak >= 78 || apps >= 250 || p.development.legendId || mine)) return;
  const clubs: string[] = [];
  for (const t of p.history?.transfers ?? []) {
    if (t.fromClub && clubs[clubs.length - 1] !== t.fromClub && t.fromClub !== 'vereinslos') clubs.push(t.fromClub);
    if (t.toClub && clubs[clubs.length - 1] !== t.toClub) clubs.push(t.toClub);
  }
  const last = g.clubs[p.clubId]?.name;
  if (last && clubs[clubs.length - 1] !== last) clubs.push(last);
  const list = (g.archive ??= []);
  list.push({
    id: p.id, name: p.fullName, nationality: p.nationality, pos: p.naturalPosition,
    born: Number((p.dateOfBirth ?? '1950').slice(0, 4)), retired: Number(date.slice(0, 4)),
    peak, apps, goals: p.careerStats?.goals ?? 0, clubs: clubs.slice(-8), lastClubId: p.clubId,
    legendId: p.development.legendId,
  });
  if (list.length > MAX) {
    // Die unauffälligsten fremden Karrieren zuerst entfernen.
    list.sort((a, b) => Number(b.lastClubId === g.managedClubId) - Number(a.lastClubId === g.managedClubId) || b.peak - a.peak);
    list.length = MAX;
  }
}
