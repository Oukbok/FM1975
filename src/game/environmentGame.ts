// =============================================================================
// Vereinsumfeld im Spielablauf (monatlich + Saisonwechsel). Siehe engine/environment.ts.
// =============================================================================
import { Game } from './state';
import { Club, Match } from '../types';
import {
  ClubEnvironment, attendanceNudge, expectedPosition, fanEra, identityScore, initEnvironment, monthlyEnvironment,
  seasonExpectation,
} from '../engine/environment';
import { lastRevenue, isLeagueClub } from '../engine/clubEconomy';
import { book } from '../engine/finances';
import { yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import { expectationShift } from './clubBusiness';

export function ensureEnvironment(g: Game): ClubEnvironment {
  const club = g.clubs[g.managedClubId];
  if (!g.environment) g.environment = initEnvironment(club, Object.values(g.clubs).filter(isLeagueClub));
  if (club) club.members = g.environment.members;
  return g.environment;
}

function ownMatches(g: Game, clubId: string): Match[] {
  return g.fixtures.filter((m) => m.status === 'finished' && m.result && (m.homeClubId === clubId || m.awayClubId === clubId))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function pointsFor(m: Match, id: string): number {
  const r = m.result!;
  const my = m.homeClubId === id ? r.homeGoals : r.awayGoals;
  const ot = m.homeClubId === id ? r.awayGoals : r.homeGoals;
  return my > ot ? 3 : my === ot ? 1 : 0;
}

export function monthlyEnvironmentUpdate(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const env = ensureEnvironment(g);
  const month = today.slice(0, 7);
  if (env.lastMonth === month) return;
  const prevMonthStart = env.lastMonth ? `${env.lastMonth}-01` : today;
  env.lastMonth = month;
  const year = yearOf(today);

  const matches = ownMatches(g, club.id);
  const last5 = matches.slice(-5);
  const ppg = last5.length ? last5.reduce((a, m) => a + pointsFor(m, club.id), 0) / last5.length : 1.5;
  const rivals = new Set(env.rivals);
  const derbies = matches.filter((m) => m.date >= prevMonthStart && m.date < today
    && rivals.has(m.homeClubId === club.id ? m.awayClubId : m.homeClubId))
    .map((m) => pointsFor(m, club.id) === 3 ? 1 : pointsFor(m, club.id) === 1 ? 0 : -1);
  const rows = g.table.rows;
  const pos = Math.max(1, rows.findIndex((r) => r.clubId === club.id) + 1);
  const size = rows.length || 18;
  const fair = 8 + club.reputation * 0.12;
  const hist = club.finances.balanceHistory ?? [];
  const rev = Math.max(1, lastRevenue(club, year));
  const balanceTrend = hist.length >= 3 ? Math.max(-1, Math.min(1, (hist[hist.length - 1].balance - hist[hist.length - 3].balance) / (rev * 0.15))) : 0;

  env.identity = Math.round(env.identity * 0.6 + identityScore(env.philosophy, club, g.players, g.fixtures, pos, size, balanceTrend) * 0.4);
  const boardBefore = club.boardConfidence ?? 60;
  const res = monthlyEnvironment(env, club, {
    year, ppg, games: last5.length, derbies, priceRatio: club.stadium.ticketPrice / fair,
    tablePos: pos, tableSize: size, expectedPos: expectedPosition(club.boardExpectation, size),
    identity: env.identity, balanceTrend,
  });
  club.members = env.members;
  club.stadium.averageAttendanceRate = Math.max(0.3, Math.min(0.98, club.stadium.averageAttendanceRate + attendanceNudge(env.fanMood, year)));

  // Sicherheitskosten der Epoche (ab den Krawall-Jahren).
  const era = fanEra(year);
  if (era.securityShare > 0) {
    book(club.finances, today, -Math.round((rev * era.securityShare) / 12), 'other', 'Ordnungsdienst & Sicherheit (Monat)', true);
  }

  const conf = club.boardConfidence ?? 60;
  if (boardBefore >= 30 && conf < 30) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Vorstand',
      subject: 'Der Vorstand ist besorgt',
      shortText: `Vertrauen gesunken auf ${conf}.`,
      bodyText: `Die Entwicklung gefällt uns nicht. Ziel ist „${club.boardExpectation}“, aktuell stehen wir auf Platz ${pos}. `
        + 'Bei weiter sinkendem Vertrauen wird der Vorstand die Mittel für Transfers kürzen.',
    }));
  } else if (boardBefore >= 15 && conf < 15) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Vorstand',
      subject: 'Krisensitzung des Vorstands',
      shortText: 'Das Vertrauen ist fast aufgebraucht.',
      bodyText: 'Der Vorstand hat getagt. Wir halten an dir fest, aber die Zügel werden angezogen: Das Transferbudget der nächsten Saison fällt deutlich kleiner aus, wenn sich nichts ändert.',
    }));
  }
  if (Math.abs(res.moodDelta) >= 8 || res.notes.length) {
    const up = res.moodDelta >= 0;
    pushMessage(g.messages, makeMessage({
      date: today, category: 'media', from: 'Fanbeauftragter',
      subject: up ? 'Die Fans sind im Aufwind' : 'Unruhe in der Kurve',
      shortText: `Fan-Stimmung ${Math.round(env.fanMood)} (${up ? '+' : ''}${Math.round(res.moodDelta)}).`,
      bodyText: [...res.notes, `Fan-Stimmung jetzt ${Math.round(env.fanMood)} von 100, Mitglieder ${env.members.toLocaleString('de-DE')}.`].join('\n'),
    }));
  }
}

/** Saisonwechsel: Bilanz des Umfelds, neues Saisonziel des Vorstands. */
export function environmentSeasonChange(g: Game, oldSeason: string, date: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const env = ensureEnvironment(g);
  (env.history ??= []).push({ season: oldSeason, fanMood: Math.round(env.fanMood), members: env.members, board: club.boardConfidence ?? 60 });
  if (env.history.length > 60) env.history.shift();
  const rows = g.table.rows;
  if (rows[0]?.clubId === club.id) env.tradition = Math.min(100, env.tradition + 3);
  env.rivals = env.rivals.length ? env.rivals : [];
  env.identity = 50;
}

/** Nach dem Aufbau der neuen Saison: Saisonziel aus der Kaderstärke setzen. */
export function setSeasonGoal(g: Game, date: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const league = Object.values(g.clubs).filter(isLeagueClub);
  const strength = (c: Club) => {
    const o = c.playerIds.map((id) => g.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
    return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length);
  };
  const ranked = [...league].sort((a, b) => strength(b) - strength(a));
  // Geldgeber (Ausgliederung/Investor) erwarten mehr: Ziel wie ein stärkerer Kader.
  const rank = ranked.findIndex((c) => c.id === club.id) + 1;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  club.boardExpectation = seasonExpectation(Math.max(1, rank - expectationShift(club)), ranked.length, tier);
  pushMessage(g.messages, makeMessage({
    date, category: 'board', from: 'Vorstand',
    subject: `Saisonziel: ${club.boardExpectation}`,
    shortText: `Unser Kader ist der ${rank}.-stärkste der Liga.`,
    bodyText: `Der Vorstand hat die Saisonziele festgelegt: ${club.boardExpectation}. Grundlage ist die Stärke unseres Kaders (Rang ${rank} von ${ranked.length}). `
      + `Das Vertrauen des Vorstands liegt bei ${club.boardConfidence ?? 60} von 100.`,
  }));
}
