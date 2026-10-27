// =============================================================================
// FOOTBALL MANAGER 1980 — Liga-Engine
// Spielplan-Generierung (34 Spieltage) & Tabellenberechnung.
// =============================================================================

import {
  Club, Match, MatchResult, PointSystem, LeagueTable, LeagueTableRow,
} from '../types';

// -----------------------------------------------------------------------------
// Spielplan: Round-Robin (Kreis-Algorithmus / "Berger-Tabellen")
// 18 Vereine -> 17 Spieltage Hinrunde, 17 Rückrunde = 34 Spieltage.
// -----------------------------------------------------------------------------
export function generateFixtures(clubs: Club[], seasonStart = '1975-08-15'): Match[] {
  const ids = clubs.map((c) => c.id);
  const n = ids.length;
  if (n % 2 !== 0) throw new Error('Anzahl Vereine muss gerade sein');

  const rounds = n - 1;         // 17
  const half = n / 2;           // 9
  const arr = [...ids];
  const firstLeg: { home: string; away: string }[][] = [];

  for (let r = 0; r < rounds; r++) {
    const dayMatches: { home: string; away: string }[] = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      // Heimrecht abwechselnd, damit es sich verteilt
      if ((r + i) % 2 === 0) dayMatches.push({ home: a, away: b });
      else dayMatches.push({ home: b, away: a });
    }
    firstLeg.push(dayMatches);
    // Rotation (erster Eintrag fix)
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(0, arr.length, fixed, ...rest);
  }

  const matches: Match[] = [];
  // Alle Datumsberechnungen laufen in UTC, damit die Spieltermine exakt zu den
  // (ebenfalls UTC-basierten) Kalenderschritten in calendar.ts passen. Sonst
  // entsteht in Zeitzonen mit Offset (z. B. Europe/Berlin) ein Off-by-one-Tag.
  const startDate = new Date(seasonStart + 'T00:00:00Z');
  let mdCounter = 0;

  // Hinrunde
  firstLeg.forEach((day, idx) => {
    mdCounter = idx + 1;
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + idx * 7);
    day.forEach((m, j) => {
      matches.push(makeMatch(mdCounter, isoDate(d), m.home, m.away, j));
    });
  });

  // Rückrunde (Heimrecht getauscht), 1 Woche Winterpause nach Hinrunde
  firstLeg.forEach((day, idx) => {
    mdCounter = rounds + idx + 1;
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + (rounds + idx) * 7 + 21); // +3 Wochen Winterpause
    day.forEach((m, j) => {
      matches.push(makeMatch(mdCounter, isoDate(d), m.away, m.home, j));
    });
  });

  return matches;
}

function makeMatch(matchday: number, date: string, home: string, away: string, idx: number): Match {
  return {
    id: `m_${matchday}_${idx}`,
    matchday, date, homeClubId: home, awayClubId: away,
    status: 'scheduled', result: null, events: [], involvesPlayerClub: false,
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// -----------------------------------------------------------------------------
// Tabellenberechnung
// -----------------------------------------------------------------------------
export function calculateTable(
  clubs: Club[],
  matches: Match[],
  pointSystem: PointSystem,
  season = '1975/76',
  previous?: LeagueTable,
): LeagueTable {
  const winPoints = pointSystem === '3-point' ? 3 : 2;
  const rowMap: Record<string, LeagueTableRow> = {};

  for (const club of clubs) {
    rowMap[club.id] = {
      clubId: club.id, position: 0, previousPosition: prevPos(previous, club.id),
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [],
    };
  }

  for (const match of matches) {
    if (match.status !== 'finished' || !match.result) continue;
    const r = match.result;
    const home = rowMap[match.homeClubId];
    const away = rowMap[match.awayClubId];
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goalsFor += r.homeGoals; home.goalsAgainst += r.awayGoals;
    away.goalsFor += r.awayGoals; away.goalsAgainst += r.homeGoals;

    if (r.homeGoals > r.awayGoals) {
      home.won++; away.lost++; home.points += winPoints;
      home.form.push('W'); away.form.push('L');
    } else if (r.homeGoals < r.awayGoals) {
      away.won++; home.lost++; away.points += winPoints;
      away.form.push('W'); home.form.push('L');
    } else {
      home.drawn++; away.drawn++; home.points += 1; away.points += 1;
      home.form.push('D'); away.form.push('D');
    }
  }

  const rows = Object.values(rowMap);
  for (const row of rows) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.form = row.form.slice(-5);
  }

  rows.sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.clubId.localeCompare(b.clubId),
  );
  rows.forEach((row, i) => { row.position = i + 1; });

  return {
    season, pointSystem, rows, lastUpdated: new Date().toISOString(),
  };
}

function prevPos(previous: LeagueTable | undefined, clubId: string): number {
  if (!previous) return 0;
  const row = previous.rows.find((r) => r.clubId === clubId);
  return row ? row.position : 0;
}
