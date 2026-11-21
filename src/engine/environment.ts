// =============================================================================
// VEREINSUMFELD — Fans, Mitglieder, Medien, Vorstand, Identität im Wandel
// -----------------------------------------------------------------------------
// Die Stimmung rund um den Verein ist ein gespeicherter Zustand, der sich jeden
// Monat aus Ergebnissen, Derbys, Eintrittspreisen und der Treue zur Vereins-
// identität (Leitbild) bewegt. Wie heftig sie schwankt, hängt von der Epoche ab:
// 1975 berichtet die Lokalpresse, ab den 1990ern das Fernsehen, ab 2015 reagieren
// die sozialen Medien in Stunden.
// Wirkung: Zuschauerauslastung, Mitglieder (→ Beiträge), Vorstandsvertrauen
// (→ Transferbudget). Kein Entlassen – der Manager bleibt, aber der Vorstand
// redet mit, wenn das Vertrauen fehlt.
// =============================================================================
import { Club, Match, Player } from '../types';

export type ClubPhilosophy = 'jugend' | 'offensiv' | 'bodenstaendig' | 'glamour' | 'kampf';

export const PHILOSOPHY_LABEL: Record<ClubPhilosophy, string> = {
  jugend: 'Ausbildungsverein', offensiv: 'Offensivfußball', bodenstaendig: 'Bodenständig & solide',
  glamour: 'Titel und Stars', kampf: 'Arbeiter und Kämpfer',
};
export const PHILOSOPHY_INFO: Record<ClubPhilosophy, string> = {
  jugend: 'Die Fans wollen eigene und junge Spieler auf dem Platz sehen.',
  offensiv: 'Tore und mutiger Fußball – ein 0:0 zu Hause ist eine Enttäuschung.',
  bodenstaendig: 'Solide wirtschaften, keine Abenteuer, Spieler aus der Region.',
  glamour: 'Titel, Stars, große Abende – Mittelmaß wird nicht verziehen.',
  kampf: 'Einsatz und Leidenschaft zählen mehr als Schönspielerei.',
};

export interface ClubEnvironment {
  fanMood: number;
  members: number;
  mediaPressure: number;
  philosophy: ClubPhilosophy;
  tradition: number;
  rivals: string[];
  /** Erfüllung des Leitbilds in der laufenden Saison (0–100). */
  identity: number;
  /** Gleitender Mitgliedertrend (pro Monat, Anteil). */
  memberTrend: number;
  lastMonth?: string;
  history?: { season: string; fanMood: number; members: number; board: number }[];
}

export interface FanEra { name: string; volatility: number; ticketTolerance: number; memberGrowth: number; securityShare: number; text: string }

/** Fankultur je Epoche. */
export function fanEra(year: number): FanEra {
  if (year < 1985) return { name: 'Kuttenzeit', volatility: 0.6, ticketTolerance: 1.0, memberGrowth: 0.01, securityShare: 0, text: 'Kutten, Schals und Stehplätze. Die Lokalpresse berichtet, die Stimmung ändert sich langsam.' };
  if (year < 1993) return { name: 'Krawall-Jahre', volatility: 0.8, ticketTolerance: 1.0, memberGrowth: 0.005, securityShare: 0.004, text: 'Gewalt rund um die Stadien schreckt Familien ab. Sicherheit kostet Geld, schwache Spielzeiten leeren die Kurven.' };
  if (year < 2005) return { name: 'Eventisierung', volatility: 1.0, ticketTolerance: 1.15, memberGrowth: 0.02, securityShare: 0.003, text: 'Fußball wird Ereignis: Logen, Familienblöcke, Fernsehen überall. Höhere Preise werden eher akzeptiert.' };
  if (year < 2015) return { name: 'Ultra-Kultur', volatility: 1.2, ticketTolerance: 1.05, memberGrowth: 0.03, securityShare: 0.003, text: 'Choreos und Gesänge – aber auch Proteste gegen Kommerz und teure Tickets.' };
  return { name: 'Soziale Medien', volatility: 1.5, ticketTolerance: 1.05, memberGrowth: 0.02, securityShare: 0.003, text: 'Jede Niederlage wird in Stunden zur Krise, jeder Sieg zum Hype. Mitglieder sind so viele wie nie.' };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Regionen für Derbys (Städte, wie sie in den Vereinsdaten vorkommen).
const REGIONS: string[][] = [
  ['Dortmund', 'Gelsenkirchen', 'Bochum', 'Duisburg', 'Essen', 'Oberhausen', 'Wattenscheid'],
  ['Köln', 'Mönchengladbach', 'Düsseldorf', 'Leverkusen', 'Uerdingen', 'Krefeld', 'Aachen', 'Wuppertal', 'Solingen'],
  ['Hamburg', 'Bremen', 'Hannover', 'Braunschweig', 'Kiel', 'Lübeck', 'Osnabrück', 'Oldenburg', 'Wolfsburg'],
  ['München', 'Nürnberg', 'Fürth', 'Augsburg', 'Regensburg', 'Ingolstadt', 'Würzburg'],
  ['Stuttgart', 'Karlsruhe', 'Mannheim', 'Freiburg', 'Ulm', 'Sinsheim', 'Heidenheim'],
  ['Frankfurt', 'Offenbach', 'Darmstadt', 'Kaiserslautern', 'Mainz', 'Saarbrücken', 'Homburg', 'Kassel'],
  ['Berlin', 'Potsdam', 'Cottbus', 'Magdeburg', 'Halle', 'Frankfurt (Oder)'],
  ['Dresden', 'Leipzig', 'Chemnitz', 'Karl-Marx-Stadt', 'Zwickau', 'Aue', 'Jena', 'Erfurt', 'Rostock'],
  ['Bielefeld', 'Paderborn', 'Münster', 'Gütersloh', 'Osnabrück'],
];

/** Lage der Derby-Städte (Breite, Länge): ein Derby nur bis {@link DERBY_MAX_KM} Luftlinie (Kiel–Braunschweig ist keins). */
const REGION_GEO: Record<string, [number, number]> = {
  Dortmund: [51.51, 7.47], Gelsenkirchen: [51.51, 7.10], Bochum: [51.48, 7.22], Duisburg: [51.43, 6.76], Essen: [51.46, 7.01],
  Oberhausen: [51.47, 6.85], Wattenscheid: [51.48, 7.13], Köln: [50.94, 6.96], Mönchengladbach: [51.19, 6.44], Düsseldorf: [51.23, 6.78],
  Leverkusen: [51.03, 6.98], Uerdingen: [51.35, 6.64], Krefeld: [51.33, 6.56], Aachen: [50.78, 6.08], Wuppertal: [51.26, 7.15],
  Solingen: [51.17, 7.08], Hamburg: [53.55, 9.99], Bremen: [53.08, 8.80], Hannover: [52.37, 9.73], Braunschweig: [52.27, 10.52],
  Kiel: [54.32, 10.13], Lübeck: [53.87, 10.69], Osnabrück: [52.28, 8.05], Oldenburg: [53.14, 8.21], Wolfsburg: [52.42, 10.79],
  München: [48.14, 11.58], Nürnberg: [49.45, 11.08], Fürth: [49.48, 10.99], Augsburg: [48.37, 10.90], Regensburg: [49.01, 12.10],
  Ingolstadt: [48.77, 11.43], Würzburg: [49.79, 9.95], Stuttgart: [48.78, 9.18], Karlsruhe: [49.01, 8.40], Mannheim: [49.49, 8.47],
  Freiburg: [47.99, 7.84], Ulm: [48.40, 9.99], Sinsheim: [49.25, 8.88], Heidenheim: [48.68, 10.15], Frankfurt: [50.11, 8.68],
  Offenbach: [50.10, 8.76], Darmstadt: [49.87, 8.65], Kaiserslautern: [49.44, 7.77], Mainz: [50.00, 8.27], Saarbrücken: [49.24, 6.99],
  Homburg: [49.33, 7.34], Kassel: [51.31, 9.48], Berlin: [52.52, 13.40], Potsdam: [52.40, 13.07], Cottbus: [51.76, 14.33],
  Magdeburg: [52.13, 11.63], Halle: [51.48, 11.97], 'Frankfurt (Oder)': [52.34, 14.55], Dresden: [51.05, 13.74], Leipzig: [51.34, 12.37],
  Chemnitz: [50.83, 12.92], 'Karl-Marx-Stadt': [50.83, 12.92], Zwickau: [50.72, 12.50], Aue: [50.59, 12.70], Jena: [50.93, 11.59],
  Erfurt: [50.98, 11.03], Rostock: [54.09, 12.10], Bielefeld: [52.02, 8.53], Paderborn: [51.72, 8.75], Münster: [51.96, 7.63],
  Gütersloh: [51.91, 8.38],
};
const DERBY_MAX_KM = 160;

/** Stadt passt zum Eintrag: gleich oder Stadtteil („Berlin (Ost)“, „Essen-Steele“), aber nicht „Frankfurt (Oder)“ zu „Frankfurt“. */
function cityIs(city: string, x: string): boolean {
  if (city === x) return true;
  if (!city.startsWith(x)) return false;
  const rest = city.slice(x.length);
  return !rest.startsWith(' (') || /^ \((Ost|West)\)/.test(rest);
}
const entryOf = (r: string[], city: string) => [...r].sort((a, b) => b.length - a.length).find((x) => cityIs(city, x));

function kmBetween(a: string, b: string): number {
  const p = REGION_GEO[a], q = REGION_GEO[b];
  if (!p || !q) return 0;
  const rad = Math.PI / 180, dLat = (q[0] - p[0]) * rad, dLon = (q[1] - p[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p[0] * rad) * Math.cos(q[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** Anzeigenamen der Regionen (Reihenfolge wie REGIONS). */
export const REGION_NAMES = ['Ruhrgebiet', 'Rheinland', 'Norden', 'Bayern', 'Baden-Württemberg', 'Südwest & Hessen', 'Berlin & Brandenburg', 'Sachsen & Thüringen', 'Westfalen'];

/** Region einer Stadt (Name) oder „Sonstige“. */
export function regionOf(city: string): string {
  const i = REGIONS.findIndex((r) => !!entryOf(r, city ?? ''));
  return i >= 0 ? REGION_NAMES[i] ?? 'Sonstige' : 'Sonstige';
}

export function sameRegion(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return REGIONS.some((r) => {
    const x = entryOf(r, a), y = entryOf(r, b);
    return !!x && !!y && kmBetween(x, y) <= DERBY_MAX_KM;
  });
}

export function findRivals(club: Club, clubs: Club[]): string[] {
  return clubs
    .filter((c) => c.id !== club.id && sameRegion(c.city ?? '', club.city ?? ''))
    .sort((a, b) => (a.city === club.city ? -10 : 0) - (b.city === club.city ? -10 : 0) || b.reputation - a.reputation)
    .slice(0, 3).map((c) => c.id);
}

export function defaultPhilosophy(club: Club): ClubPhilosophy {
  if (club.reputation >= 86) return 'glamour';
  if ((club.infrastructure?.youthAcademy ?? 1) >= 3) return 'jugend';
  const h = [...club.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 3;
  return (['offensiv', 'kampf', 'bodenstaendig'] as ClubPhilosophy[])[h];
}

/** Startzahl der Mitglieder (wie die Schätzung der KI-Vereine in engine/finances.ts: 30.000 + Ruf × 1.000 DM Beiträge). */
export function baseMembers(reputation: number): number {
  return Math.round((30000 + reputation * 1000) / 40);
}

/** Wie viele Vielfache der Startzahl ein Verein in einer Epoche höchstens erreicht (danach Sättigung). */
const MEMBER_CAP_ERA: [number, number][] = [[1975, 3], [1995, 4], [2005, 5], [2015, 7], [2025, 8]];

/**
 * Obergrenze der Mitglieder: Startzahl × Epochen-Vielfaches (1975 × 3 … ab 2025 × 8). Damit bleiben die
 * Beiträge auch nach Jahrzehnten Erfolg im Rahmen (Spitzenverein ≈ 3–5 % des Umsatzes, KI-Schätzung ≈ 2 %).
 */
export function memberCap(reputation: number, year: number): number {
  const A = MEMBER_CAP_ERA;
  let f = A[A.length - 1][1];
  if (year <= A[0][0]) f = A[0][1];
  else for (let i = 1; i < A.length; i++) if (year <= A[i][0]) { const [y0, f0] = A[i - 1], [y1, f1] = A[i]; f = f0 + (f1 - f0) * (year - y0) / (y1 - y0); break; }
  return Math.round(baseMembers(reputation) * f);
}

export function initEnvironment(club: Club, clubs: Club[]): ClubEnvironment {
  return {
    fanMood: 55, members: baseMembers(club.reputation),
    mediaPressure: 30, philosophy: defaultPhilosophy(club),
    tradition: clamp(club.reputation - 10, 20, 95), rivals: findRivals(club, clubs),
    identity: 50, memberTrend: 0,
  };
}

// -----------------------------------------------------------------------------
// Leitbild-Erfüllung
// -----------------------------------------------------------------------------
export function identityScore(
  phil: ClubPhilosophy, club: Club, players: Record<string, Player>, matches: Match[], tablePos: number, tableSize: number, balanceTrend: number,
): number {
  const own = matches.filter((m) => m.status === 'finished' && m.result && (m.homeClubId === club.id || m.awayClubId === club.id));
  const squad = club.playerIds.map((id) => players[id]).filter(Boolean);
  const top14 = [...squad].sort((a, b) => (b.seasonStats?.minutesPlayed ?? 0) - (a.seasonStats?.minutesPlayed ?? 0)).slice(0, 14);
  const perf = tableSize > 1 ? 1 - (tablePos - 1) / (tableSize - 1) : 0.5;
  switch (phil) {
    case 'jugend': {
      const young = top14.filter((p) => p.age <= 23 || p.id.includes('_y_')).length;
      return clamp(20 + young * 14, 0, 100);
    }
    case 'offensiv': {
      const goals = own.reduce((a, m) => a + (m.homeClubId === club.id ? m.result!.homeGoals : m.result!.awayGoals), 0);
      const gpg = own.length ? goals / own.length : 1.5;
      return clamp((gpg - 0.8) * 60, 0, 100);
    }
    case 'bodenstaendig':
      return clamp(50 + balanceTrend * 50 + (perf - 0.5) * 30, 0, 100);
    case 'glamour': {
      const stars = squad.filter((p) => p.overall >= 84).length;
      return clamp(perf * 70 + stars * 8, 0, 100);
    }
    case 'kampf': {
      const draws = own.filter((m) => m.result!.homeGoals === m.result!.awayGoals).length;
      const lossesBig = own.filter((m) => {
        const my = m.homeClubId === club.id ? m.result!.homeGoals : m.result!.awayGoals;
        const ot = m.homeClubId === club.id ? m.result!.awayGoals : m.result!.homeGoals;
        return ot - my >= 3;
      }).length;
      return clamp(55 + draws * 2 - lossesBig * 12 + (perf - 0.5) * 30, 0, 100);
    }
  }
}

// -----------------------------------------------------------------------------
// Monatliche Fortschreibung
// -----------------------------------------------------------------------------
export interface MonthInput {
  year: number;
  /** Punkte pro Spiel der letzten Ligaspiele (0..3) und Anzahl. */
  ppg: number; games: number;
  /** Derby-Ergebnisse im Monat: +1 Sieg, 0 Remis, −1 Niederlage. */
  derbies: number[];
  /** Tatsächlicher Ticketpreis / fairer Preis. */
  priceRatio: number;
  tablePos: number; tableSize: number;
  /** Erwarteter Platz laut Vorstand. */
  expectedPos: number;
  identity: number;
  /** Kontostand-Tendenz −1..+1. */
  balanceTrend: number;
  /** Beitrag des Stadionumfelds zur Zielstimmung (engine/grounds.ts groundsMoodBonus, −8..+8). */
  groundsMood?: number;
}

export interface MonthResult { moodDelta: number; boardDelta: number; notes: string[] }

export function monthlyEnvironment(env: ClubEnvironment, club: Club, inp: MonthInput): MonthResult {
  const era = fanEra(inp.year);
  const notes: string[] = [];
  // 1) Fan-Stimmung
  const resultMood = inp.games ? (inp.ppg / 3) * 100 : env.fanMood;
  let target = 0.55 * resultMood + 0.25 * env.identity + 0.2 * 55;
  const derbySum = inp.derbies.reduce((a, b) => a + b, 0);
  target += derbySum * 8;
  target += inp.groundsMood ?? 0; // Stadionumfeld (Fanprojekt, Fanräume, Chaos, Ausschreitungen …)
  if (derbySum > 0) notes.push('Der Derbysieg hat die Fans begeistert.');
  if (derbySum < 0) notes.push('Die Derbyniederlage schmerzt die Fans.');
  const fair = era.ticketTolerance;
  if (inp.priceRatio > fair * 1.2) {
    target -= (inp.priceRatio - fair * 1.2) * 60;
    notes.push(inp.year >= 2005 ? 'In der Kurve hängen Banner gegen die Ticketpreise.' : 'Die Eintrittspreise sorgen für Unmut.');
  }
  const before = env.fanMood;
  env.fanMood = clamp(env.fanMood + (target - env.fanMood) * 0.25 * era.volatility, 0, 100);
  // 2) Mitglieder – wachsen mit Epoche, Stimmung und Erfolg, aber nur bis zur Obergrenze `memberCap`
  //    (vorher ungebremst: ein Spitzenverein wuchs ≈ 8 % im Jahr, 2070 waren die Beiträge 30–50 % des Umsatzes).
  let growth = era.memberGrowth / 12 + (env.fanMood - 50) / 50 * 0.003 + (inp.tablePos <= 3 ? 0.002 : 0);
  const cap = memberCap(club.reputation ?? 60, inp.year);
  if (growth > 0) growth *= clamp(1 - env.members / cap, 0, 1);
  if (env.members > cap) growth = Math.min(growth, -0.002); // über der Obergrenze langsam zurück
  env.memberTrend = growth;
  env.members = Math.max(500, Math.round(env.members * (1 + growth)));
  // 3) Medien
  const streak = inp.games ? (1.5 - inp.ppg) * 20 : 0;
  env.mediaPressure = clamp(20 + club.reputation * 0.35 + era.volatility * 15 + streak, 0, 100);
  // 4) Vorstand
  const posGap = inp.expectedPos - inp.tablePos; // positiv = besser als erwartet
  let board = posGap * 1.2 + (env.fanMood - 50) / 25 + inp.balanceTrend * 3 + (env.identity - 50) / 30;
  board *= 0.6 + env.mediaPressure / 125;
  const boardDelta = clamp(board, -8, 8);
  club.boardConfidence = Math.round(clamp((club.boardConfidence ?? 60) + boardDelta, 0, 100));
  return { moodDelta: env.fanMood - before, boardDelta, notes };
}

/** Erwarteter Tabellenplatz aus der Zielvorgabe des Vorstands. */
export function expectedPosition(expectation: string, size: number): number {
  if (/Meister/i.test(expectation)) return 1;
  if (/Europa|Pokal-Platz|Spitzen/i.test(expectation)) return Math.min(4, size);
  if (/Mittelfeld/i.test(expectation)) return Math.round(size / 2);
  if (/Aufstieg/i.test(expectation)) return 2;
  return Math.max(1, size - 3); // Klassenerhalt
}

/** Neues Saisonziel aus der Kaderstärke (Rang der Mannschaft in der Liga). */
export function seasonExpectation(strengthRank: number, size: number, tier: number): string {
  if (tier >= 2) return strengthRank <= 3 ? 'Aufstieg' : strengthRank <= size / 2 ? 'Obere Tabellenhälfte' : 'Klassenerhalt';
  if (strengthRank === 1) return 'Meisterschaft';
  if (strengthRank <= 4) return 'Europa-Pokal-Platz';
  if (strengthRank <= size / 2) return 'Gesicherter Mittelfeldplatz';
  return 'Klassenerhalt';
}

/** Anteil des Polsters, den der Vorstand für Transfers freigibt (Vertrauen 0–100). */
export function boardBudgetShare(confidence: number): number {
  return clamp(0.4 + confidence / 200, 0.4, 0.9);
}

/** Auswirkung der Stimmung auf die Basis-Auslastung des Stadions (monatlich). */
export function attendanceNudge(fanMood: number, year: number): number {
  const era = fanEra(year);
  const hooligan = era.name === 'Krawall-Jahre' && fanMood < 45 ? -0.004 : 0;
  return (fanMood - 50) / 2500 + hooligan;
}
