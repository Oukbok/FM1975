import { seasonStartYear } from '../data/timeline';
import { EURO_COMP_NAMES } from '../data/europe';
import { isLeagueClub, lastRevenue } from '../engine/clubEconomy';
import { divisionLabel, simDisplayName } from '../engine/leagues';
import { estimateRange } from '../engine/transferMarket';
import { Club, LeagueTable, Match, Player, POSITION_GROUPS } from '../types';
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

/** Hat der Verein ein Profil (voller oder simulierter deutscher Verein)? */
export function hasClubProfile(g: Game, id: string | null | undefined): boolean {
  return !!id && (!!g.clubs[id] || !!g.simClubs[id]);
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

// =============================================================================
// VEREINSPROFIL (Anzeigedaten für components/ClubModal.tsx)
// =============================================================================
/** Ein Spiel dieses Vereins (Ergebnis oder kommende Begegnung), aus Vereinssicht. */
export interface ClubMatchLine {
  date: string;
  oppId: string;
  opponent: string;
  homeAway: 'H' | 'A';
  /** Wettbewerb kurz: „Liga“, „Pokal“ oder Europapokal-Name. */
  comp: string;
  /** Ergebnis aus Vereinssicht (z. B. „2:1“), null wenn noch nicht gespielt. */
  score: string | null;
  result?: 'W' | 'D' | 'L';
  upcoming: boolean;
}

export type UnitKey = 'GK' | 'DEF' | 'MID' | 'ATT';
export const UNIT_DE: Record<UnitKey, string> = { GK: 'Torwart', DEF: 'Abwehr', MID: 'Mittelfeld', ATT: 'Angriff' };
/** Stammkräfte je Mannschaftsteil für die Kurzbewertung (Ø der besten n). */
const UNIT_N: Record<UnitKey, number> = { GK: 1, DEF: 4, MID: 4, ATT: 2 };

export interface ClubProfileData {
  clubId: string;
  name: string;
  shortName: string;
  colors: { primary: string; secondary: string };
  /** Objekt für <ClubCrest> (voller Verein oder Sim-Sicht). */
  crestClub: Club;
  city: string;
  founded?: number;
  reputation?: number;
  /** Ø Mannschaftsstärke (Ø Spielerstärke bzw. Sim-Stärke). */
  strength: number;
  divisionLabel?: string;
  tier?: number;
  tablePosition?: number;
  tableSize?: number;
  points?: number;
  /** Gespielte Ligaspiele der laufenden Saison. */
  played?: number;
  goals?: string;
  form?: ('W' | 'D' | 'L')[];
  isPlayerClub: boolean;
  /** Voller Vereinsdatensatz (nur bei Nicht-Sim-Vereinen). */
  fullClub?: Club;
  /** Kader, absteigend nach Stärke (leer bei reinen Sim-Vereinen). */
  squad: Player[];
  lastMatches: ClubMatchLine[];
  nextMatches: ClubMatchLine[];
  /** Nächstes bzw. letztes Spiel gegen deinen Verein (aus Sicht DIESES Vereins). */
  vsOwnNext?: ClubMatchLine;
  vsOwnLast?: ClubMatchLine;
  /** Stärke je Mannschaftsteil: dieser Verein vs. dein Verein (leer bei Sim-Vereinen). */
  units: { key: UnitKey; label: string; theirs: number; ours: number; n: number }[];
  /** Außensicht der Finanzen (nur volle Vereine). */
  finance?: {
    /** Umsatzklasse in der eigenen Liga (1 = umsatzstärkstes Viertel … 4). */
    revenueClass: 1 | 2 | 3 | 4;
    revenueRank: number;
    revenueOf: number;
    /** Umsatz der Vorsaison (nominal, gerundet – „Zahlen aus der Presse“). */
    revenue: number;
    /** Geschätztes Transferbudget (1975-Basis, Spanne). */
    budget: [number, number];
    /** Kaderwert / Gehälter pro Woche (1975-Basis). */
    squadValue: number;
    wages: number;
  };
}

function findRow(g: Game, clubId: string) {
  const pd = g.leagues.playerDivision;
  const rowIn = (t: LeagueTable) => t.rows.find((r) => r.clubId === clubId);
  const own = rowIn(g.table);
  if (own) return { row: own, label: divisionLabel(pd.tier, pd.group), tier: pd.tier, size: g.table.rows.length };
  for (const d of g.leagues.otherDivisions) {
    const r = rowIn(d.table);
    if (r) return { row: r, label: d.id.startsWith('ddr-') ? d.name : divisionLabel(d.tier, d.group), tier: d.tier, size: d.table.rows.length };
  }
  return null;
}

/** Ø der besten n Spieler je Mannschaftsteil. */
export function unitStrength(squad: Player[], key: UnitKey): number {
  const xs = squad.filter((p) => POSITION_GROUPS[p.naturalPosition] === key).map((p) => p.overall).sort((a, b) => b - a).slice(0, UNIT_N[key]);
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;
}

const squadOfClub = (g: Game, c?: Club): Player[] =>
  c ? c.playerIds.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall) : [];

/** Alle Spiele eines Vereins der laufenden Saison (Liga + Landespokal + Europapokal). */
function matchLines(g: Game, clubId: string, year: number): ClubMatchLine[] {
  const lines: ClubMatchLine[] = [];
  const seen = new Set<string>();
  const nameOf = (id: string) => clubView(g, id, year).name !== id ? clubView(g, id, year).name : (g.euroClubs?.[id]?.name ?? id);
  const push = (date: string, homeId: string, awayId: string, hg: number | null, ag: number | null, comp: string) => {
    const home = homeId === clubId;
    const oppId = home ? awayId : homeId;
    const played = hg != null && ag != null;
    const gf = home ? hg : ag; const ga = home ? ag : hg;
    lines.push({
      date, oppId, opponent: nameOf(oppId), homeAway: home ? 'H' : 'A', comp,
      score: played ? `${gf}:${ga}` : null,
      result: played ? (gf! > ga! ? 'W' : gf! < ga! ? 'L' : 'D') : undefined,
      upcoming: !played,
    });
  };
  const league: Match[] = [...g.fixtures];
  for (const d of g.leagues.otherDivisions) league.push(...d.fixtures);
  for (const m of league) {
    if ((m.homeClubId !== clubId && m.awayClubId !== clubId) || seen.has(m.id)) continue;
    seen.add(m.id);
    const done = m.status === 'finished' && !!m.result;
    push(m.date, m.homeClubId, m.awayClubId, done ? m.result!.homeGoals : null, done ? m.result!.awayGoals : null, 'Liga');
  }
  const cups: [string, typeof g.cup | null | undefined][] = [
    ['Pokal', g.cup], [EURO_COMP_NAMES.ec, g.euroCups?.ec], [EURO_COMP_NAMES.cwc, g.euroCups?.cwc], [EURO_COMP_NAMES.uefa, g.euroCups?.uefa],
  ];
  for (const [comp, cup] of cups) {
    for (const rd of cup?.rounds ?? []) {
      if (!rd.drawn) continue;
      for (const t of rd.ties) {
        if (t.homeClubId !== clubId && t.awayClubId !== clubId) continue;
        push(t.date, t.homeClubId, t.awayClubId, t.played ? t.homeGoals : null, t.played ? t.awayGoals : null, comp);
      }
    }
  }
  return lines;
}

// Baut die vollständigen Anzeigedaten eines Vereins für das Vereinsprofil.
// Funktioniert für volle Vereine (mit Kader/Stadion) und reine Sim-Vereine.
export function buildClubProfile(g: Game, clubId: string): ClubProfileData {
  const year = seasonStartYear(g.season);
  const view = clubView(g, clubId, year);
  const full = g.clubs[clubId];
  const sim = g.simClubs[clubId];
  const found = findRow(g, clubId);
  const row = found?.row;
  const squad = squadOfClub(g, full);
  const mine = squadOfClub(g, g.clubs[g.managedClubId]);

  const lines = matchLines(g, clubId, year);
  const finished = lines.filter((m) => !m.upcoming).sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = lines.filter((m) => m.upcoming).sort((a, b) => a.date.localeCompare(b.date));
  const vsOwn = (m: ClubMatchLine) => m.oppId === g.managedClubId;

  const units = full ? (['GK', 'DEF', 'MID', 'ATT'] as UnitKey[]).map((key) => ({
    key, label: UNIT_DE[key], theirs: unitStrength(squad, key), ours: unitStrength(mine, key),
    n: squad.filter((p) => POSITION_GROUPS[p.naturalPosition] === key).length,
  })) : [];

  let finance: ClubProfileData['finance'];
  if (full) {
    // Umsatzrang innerhalb der eigenen Liga (nur volle Vereine haben Finanzen).
    const inLeague = g.table.rows.some((r) => r.clubId === clubId);
    const peers = inLeague ? g.table.rows.map((r) => g.clubs[r.clubId]).filter((c) => c && isLeagueClub(c)) : [full];
    const revs = peers.map((c) => ({ id: c.id, rev: lastRevenue(c, year) })).sort((a, b) => b.rev - a.rev);
    const rank = Math.max(1, revs.findIndex((r) => r.id === clubId) + 1);
    const q = revs.length ? rank / revs.length : 0.5;
    const rev = lastRevenue(full, year);
    const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, rev))) - 1));
    finance = {
      revenueClass: q <= 0.25 ? 1 : q <= 0.5 ? 2 : q <= 0.75 ? 3 : 4,
      revenueRank: rank, revenueOf: revs.length,
      revenue: Math.round(rev / mag) * mag,
      budget: estimateRange(Math.max(0, full.finances.transferBudget), 0.25, `${clubId}:${g.season}`),
      squadValue: squad.reduce((s, p) => s + p.contract.transferValue, 0),
      wages: squad.reduce((s, p) => s + p.contract.weeklyWage, 0),
    };
  }

  return {
    clubId,
    name: view.name,
    shortName: view.shortName,
    colors: view.colors,
    crestClub: (full ?? view) as Club,
    city: full?.city ?? sim?.city ?? '',
    founded: full?.founded,
    reputation: full?.reputation,
    strength: clubStrengthFor(g, clubId),
    divisionLabel: found?.label,
    tier: found?.tier ?? sim?.tier,
    tablePosition: row?.position,
    tableSize: found?.size,
    points: row?.points,
    played: row?.played,
    goals: row ? `${row.goalsFor}:${row.goalsAgainst}` : undefined,
    form: row?.form,
    isPlayerClub: clubId === g.managedClubId,
    fullClub: full,
    squad,
    lastMatches: finished.slice(0, 8),
    nextMatches: upcoming.slice(0, 8),
    vsOwnNext: upcoming.find(vsOwn),
    vsOwnLast: finished.find(vsOwn),
    units,
    finance,
  };
}
