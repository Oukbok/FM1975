import { ClubMatchLine, ClubProfileData } from '../components/ClubModal';
import { seasonStartYear } from '../data/timeline';
import { divisionLabel, simDisplayName } from '../engine/leagues';
import { LeagueTable, Match } from '../types';
import { clubStrengthFor } from './season';
import { Game } from './state';

// =============================================================================
// TABELLE
// =============================================================================
// Optik-/Namens-Sicht eines Vereins – funktioniert für volle Vereine (g.clubs)
// wie für aggregierte Sim-Vereine (g.simClubs). Für ClubCrest ausreichend.
export function clubView(g: Game, id: string, year?: number): { id: string; name: string; shortName: string; city: string; colors: { primary: string; secondary: string }; customCrest?: string } {
  const c = g.clubs[id];
  // id + city + customCrest mitgeben, damit <ClubCrest> das spielweite Wappen-
  // Override zuverlässig auflösen kann (sonst zeigt die Tabelle das Standardwappen).
  if (c) return { id: c.id, name: c.name, shortName: c.shortName, city: c.city, colors: c.colors, customCrest: c.customCrest };
  const s = g.simClubs[id];
  // Zeit-korrekter Name (z. B. „Karl-Marx-Stadt" vor 1990, sonst „Chemnitz").
  if (s) return { id: s.id, name: year != null ? simDisplayName(s, year) : s.name, shortName: s.shortName, city: s.city, colors: s.colors };
  return { id, name: id, shortName: id.slice(0, 3).toUpperCase(), city: '', colors: { primary: '#444', secondary: '#fff' } };
}

// Zonen-Markierung je Ebene: 1. Liga = Meister/Europa/Abstieg; 2. Liga =
// Direktaufstieg (Platz 1) + Playoff (Platz 2).
export function divisionZone(pos: number, tier: number, rowCount: number): string {
  if (tier === 1) {
    if (pos <= 1) return 'zone-cl';
    if (pos <= 4) return 'zone-eu';
    if (pos >= rowCount - 2) return 'zone-rel';
    return '';
  }
  if (tier === 2) {
    if (pos <= 1) return 'zone-cl';
    if (pos === 2) return 'zone-eu';
    return '';
  }
  return '';
}

// Baut die vollständigen Anzeigedaten eines Vereins für die ClubModal-Detailseite.
// Funktioniert für volle Vereine (mit Kader/Stadion) und reine Sim-Vereine.
export function buildClubProfile(g: Game, clubId: string): ClubProfileData {
  const year = seasonStartYear(g.season);
  const view = clubView(g, clubId, year);
  const full = g.clubs[clubId];
  const sim = g.simClubs[clubId];

  // Division + Tabellenzeile ermitteln (Spielerliga zuerst, dann Sim-Ligen).
  let divisionLabelStr: string | undefined;
  let tablePosition: number | undefined;
  let form: ('W' | 'D' | 'L')[] | undefined;
  const pd = g.leagues.playerDivision;
  const findRow = (table: LeagueTable) => table.rows.find((r) => r.clubId === clubId);
  let row = findRow(g.table);
  if (row) {
    divisionLabelStr = divisionLabel(pd.tier, pd.group);
  } else {
    for (const d of g.leagues.otherDivisions) {
      const r = findRow(d.table);
      if (r) { row = r; divisionLabelStr = d.id.startsWith('ddr-') ? d.name : divisionLabel(d.tier, d.group); break; }
    }
  }
  if (row) { tablePosition = row.position; form = row.form; }

  // Kader (nur bei vollen Vereinen), absteigend nach Stärke.
  const squad = full
    ? full.playerIds.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall)
    : [];

  // Spiele aus allen Liga-Spielplänen (Spielerliga + Sim-Ligen) einsammeln.
  const allFixtures: Match[] = [...g.fixtures];
  for (const d of g.leagues.otherDivisions) allFixtures.push(...d.fixtures);
  const seen = new Set<string>();
  const uniq = allFixtures.filter((m) => {
    if (m.homeClubId !== clubId && m.awayClubId !== clubId) return false;
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const toLine = (m: Match): ClubMatchLine => {
    const home = m.homeClubId === clubId;
    const oppId = home ? m.awayClubId : m.homeClubId;
    const opp = clubView(g, oppId, year).name;
    const finished = m.status === 'finished' && !!m.result;
    let score: string | null = null;
    let won: boolean | null | undefined = undefined;
    if (finished && m.result) {
      const gf = home ? m.result.homeGoals : m.result.awayGoals;
      const ga = home ? m.result.awayGoals : m.result.homeGoals;
      score = `${gf}:${ga}`;
      won = gf > ga ? true : gf < ga ? false : null;
    }
    return { date: m.date, opponent: opp, homeAway: home ? 'H' : 'A', score, won, upcoming: !finished };
  };

  const finishedM = uniq.filter((m) => m.status === 'finished' && m.result).sort((a, b) => b.date.localeCompare(a.date));
  const upcomingM = uniq.filter((m) => !(m.status === 'finished' && m.result)).sort((a, b) => a.date.localeCompare(b.date));

  return {
    clubId,
    name: view.name,
    shortName: view.shortName,
    colors: view.colors,
    city: full?.city ?? sim?.city ?? '',
    founded: full?.founded,
    reputation: full?.reputation,
    stadium: full ? { name: full.stadium.name, capacity: full.stadium.capacity } : undefined,
    strength: clubStrengthFor(g, clubId),
    divisionLabel: divisionLabelStr,
    tablePosition,
    form,
    isPlayerClub: clubId === g.managedClubId,
    fullClub: full,
    squad,
    lastMatches: finishedM.slice(0, 6).map(toLine),
    nextMatches: upcomingM.slice(0, 6).map(toLine),
  };
}
