// =============================================================================
// TRAINERKARUSSELL — Trainer der KI-Vereine, Vorstandsdruck, Entlassungen
// -----------------------------------------------------------------------------
// • Jeder KI-Verein der Spielerliga hat einen Trainer (Stil → Taktik/Formation,
//   Philosophie → Kaderplanung in game/aiClubs.ts).
// • Montags (September–April) steigt oder sinkt der Druck vom Vorstand je nach
//   Tabellenplatz, Erwartung und Form. Hoher Druck kann die Entlassung bringen –
//   wenige pro Saison, mit Nachricht.
// • Zum Saisonende: Ruhestand, Entlassung nach verfehltem Ziel, Vertragsende,
//   Abwerbung erfolgreicher Trainer durch größere Vereine.
// • Arbeitslose Trainer bleiben im Pool (game.coachPool) und werden später
//   wieder eingestellt.
// Der eigene Verein ist nie betroffen.
// =============================================================================
import { Club, ClubCoach, CoachHistoryEntry } from '../types';
import { coachTactics, COACH_PHILOSOPHY_LABEL, COACH_STYLE_LABEL, expectedRanks, makeCoach, pressureTarget, squadLevel11 } from '../engine/aiManager';
import { isLeagueClub } from '../engine/clubEconomy';
import { CalendarEngine } from '../engine/calendar';
import { makeMessage, pushMessage } from '../engine/messages';
import { Game, bumpMorale } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const POOL_MAX = 40;
const HISTORY_MAX = 30;
/** Weiche Obergrenze der Entlassungen während einer Saison (ganze Liga). */
const SEASON_SACK_SOFTCAP = 6;

const yearOfDate = (d: string) => Number(d.slice(0, 4));
const days = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

/** KI-Vereine, die einen Trainer haben (Spielerliga, nicht der eigene Verein). */
export function coachClubs(g: Game): Club[] {
  return Object.values(g.clubs).filter((c) => isLeagueClub(c) && c.id !== g.managedClubId);
}

function coachLabel(c: ClubCoach): string {
  return `${c.name}${c.nationality && c.nationality !== 'GER' ? ` (${c.nationality})` : ''}`;
}

/** Kurzbeschreibung für Nachrichten. */
export function coachProfileText(c: ClubCoach): string {
  return `${coachLabel(c)}, ${c.age} Jahre, Stil ${COACH_STYLE_LABEL[c.style]}, ${COACH_PHILOSOPHY_LABEL[c.philosophy]}, Ansehen ${Math.round(c.reputation)}`;
}

/** Trainer an den Verein binden: Taktik nach seinem Stil, kleiner Trainereffekt. */
function install(g: Game, club: Club, coach: ClubCoach, date: string, bounce: boolean): void {
  coach.since = date;
  coach.pressure = 25;
  club.coach = coach;
  club.tactics = coachTactics(club, g.players, coach, yearOfDate(date));
  if (bounce) {
    for (const id of club.playerIds) { const p = g.players[id]; if (p) p.morale = bumpMorale(p.morale, 1); }
  }
}

/** Trainer verlässt den Verein (Historie; außer im Ruhestand zurück in den Pool). */
function depart(g: Game, club: Club, date: string, reason: CoachHistoryEntry['reason']): ClubCoach | null {
  const c = club.coach;
  if (!c) return null;
  (club.coachHistory ??= []).push({ name: c.name, from: c.since, to: date, reason });
  if (club.coachHistory.length > HISTORY_MAX) club.coachHistory.splice(0, club.coachHistory.length - HISTORY_MAX);
  club.coach = undefined;
  if (reason !== 'ruhestand' && reason !== 'abgeworben') {
    const pool = (g.coachPool ??= []);
    pool.push({ ...c, pressure: 0, reputation: clamp(c.reputation - (reason === 'entlassen' ? 4 : 0), 10, 99) });
    if (pool.length > POOL_MAX) { pool.sort((a, b) => b.reputation - a.reputation); pool.length = POOL_MAX; }
  }
  return c;
}

/**
 * Nachfolger suchen: arbeitslose Trainer im Rahmen des Vereins (keiner, den der
 * Verein gerade selbst entlassen hat) oder ein neuer Name.
 */
function pickSuccessor(g: Game, club: Club, date: string, rng: () => number): ClubCoach {
  const rep = club.reputation ?? 60;
  const recent = new Set((club.coachHistory ?? []).slice(-4).map((h) => h.name));
  const pool = g.coachPool ?? [];
  const fresh = [makeCoach(yearOfDate(date), rep, date, rng), makeCoach(yearOfDate(date), rep, date, rng)];
  const cands = [...pool.filter((c) => !recent.has(c.name) && c.age < 68 && c.reputation <= rep + 10 && c.reputation >= rep - 30), ...fresh];
  const score = (c: ClubCoach) => c.reputation - Math.abs(c.reputation - rep) * 0.4 + rng() * 12;
  const best = cands.sort((a, b) => score(b) - score(a))[0];
  const i = pool.indexOf(best);
  if (i >= 0) pool.splice(i, 1);
  return best;
}

/** Fehlende Trainer nachrüsten (neues Spiel, Aufsteiger, alte Spielstände). Still, ohne Nachricht. */
export function ensureCoaches(g: Game, date: string, rng: () => number = Math.random): number {
  let n = 0;
  for (const club of coachClubs(g)) {
    if (club.coach) continue;
    // Aufsteiger behalten oft ihren (unbekannten) Trainer: neuer Name im Rahmen des Vereins.
    install(g, club, rng() < 0.4 && g.coachPool?.length ? pickSuccessor(g, club, date, rng) : makeCoach(yearOfDate(date), club.reputation ?? 60, date, rng), date, false);
    n++;
  }
  const mine = g.clubs[g.managedClubId];
  if (mine?.coach) mine.coach = undefined; // der eigene Verein hat keinen KI-Trainer
  return n;
}

/** Erwartete Plätze der Spielerliga (Kaderstärke + Ruf). */
function expectations(g: Game): Record<string, number> {
  const rows = g.table.rows.map((r) => g.clubs[r.clubId]).filter((c): c is Club => !!c);
  return expectedRanks(rows.map((c) => ({
    id: c.id, reputation: c.reputation ?? 60,
    strength: squadLevel11(c.playerIds.map((id) => g.players[id]).filter(Boolean)),
  })));
}

/** Montags: Druck aktualisieren, ggf. Entlassung. */
export function weeklyCoachPressure(g: Game, today: string, sackedThisSeason: () => number, onSack: () => void, rng: () => number = Math.random): void {
  if (new Date(today + 'T00:00:00Z').getUTCDay() !== 1) return;
  const m = Number(today.slice(5, 7));
  const inSeason = m >= 9 || m <= 4;
  const rows = g.table.rows;
  if (!rows.length) return;
  const exp = expectations(g);
  for (const row of rows) {
    const club = g.clubs[row.clubId];
    const c = club?.coach;
    if (!club || !c || club.id === g.managedClubId || row.played < 4) continue;
    const target = pressureTarget(row, rows.length, exp[club.id] ?? rows.length / 2, c.reputation);
    c.pressure = Math.round(clamp(c.pressure + (target - c.pressure) * 0.35 + (rng() - 0.5) * 4, 0, 100));
    if (!inSeason || c.pressure < 72 || days(c.since, today) < 70) continue;
    const done = sackedThisSeason();
    const k = done < SEASON_SACK_SOFTCAP ? 1 : 0.25;
    if (rng() >= (c.pressure - 66) / 100 * k * 1.3) continue;
    const old = depart(g, club, today, 'entlassen')!;
    const succ = pickSuccessor(g, club, today, rng);
    install(g, club, succ, today, true);
    onSack();
    pushMessage(g.messages, makeMessage({
      date: today, category: 'media', from: 'Sportredaktion',
      subject: `${club.name} entlässt Trainer ${old.name}`,
      shortText: `Nachfolger: ${succ.name}. ${club.shortName} steht auf Platz ${row.position}.`,
      bodyText: `${club.name} hat sich nach dem ${row.played}. Spieltag von Trainer ${coachLabel(old)} getrennt. `
        + `Die Mannschaft steht auf Platz ${row.position} (Erwartung vor der Saison: etwa Platz ${exp[club.id]}), `
        + `aus den letzten Spielen holte sie ${row.form.map((f) => (f === 'W' ? 'S' : f === 'D' ? 'U' : 'N')).join('-') || '–'}.\n\n`
        + `${old.name} war seit ${CalendarEngine.formatDate(old.since)} im Amt.\n\n`
        + `Neuer Trainer: ${coachProfileText(succ)}.`,
    }));
  }
}

/**
 * Saisonbilanz der Trainer (vor dem Saisonwechsel, Endtabelle liegt noch vor):
 * Ansehen, Alter, Ruhestand, Entlassung, Vertragsende, Abwerbung.
 * Gibt die Wechsel als Zeilen für eine Sammelnachricht zurück.
 */
export function coachSeasonReview(g: Game, date: string, rng: () => number = Math.random): string[] {
  const rows = g.table.rows;
  if (!rows.length) return [];
  const exp = expectations(g);
  const lines: string[] = [];
  const vacant: Club[] = [];
  const overachievers: { club: Club; gain: number }[] = [];
  for (const row of rows) {
    const club = g.clubs[row.clubId];
    const c = club?.coach;
    if (!club || !c || club.id === g.managedClubId) continue;
    const e = exp[club.id] ?? rows.length / 2;
    const gain = e - row.position; // positiv = besser als erwartet
    c.reputation = Math.round(clamp(c.reputation + clamp(gain * 1.2, -8, 8) + (row.position === 1 ? 6 : 0), 10, 99));
    c.age += 1;
    const years = days(c.since, date) / 365;
    let reason: CoachHistoryEntry['reason'] | null = null;
    if (c.age >= 70 || (c.age >= 65 && rng() < 0.4)) reason = 'ruhestand';
    else if ((c.pressure >= 65 || gain <= -5) && years >= 0.5 && rng() < 0.6) reason = 'entlassen';
    else if (years >= 3 && rng() < (years >= 5 ? 0.18 : 0.1)) reason = 'vertragsende';
    if (reason) {
      depart(g, club, date, reason);
      vacant.push(club);
      lines.push(`${club.name}: ${c.name} ${reason === 'ruhestand' ? 'geht in den Ruhestand' : reason === 'entlassen' ? 'muss gehen' : 'verlängert nicht'}`);
    } else {
      c.pressure = Math.round(c.pressure * 0.4 + 10);
      if (gain >= 3) overachievers.push({ club, gain });
    }
  }
  // Pool altert, Älteste hören auf.
  if (g.coachPool) {
    for (const c of g.coachPool) c.age += 1;
    g.coachPool = g.coachPool.filter((c) => c.age < 70);
  }
  // Große Vereine zuerst: evtl. erfolgreichen Trainer eines kleineren Vereins abwerben.
  vacant.sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
  for (let i = 0; i < vacant.length; i++) {
    const club = vacant[i];
    const target = overachievers.find((o) => (o.club.reputation ?? 0) < (club.reputation ?? 0) - 3 && o.club.coach);
    if (target && rng() < 0.35) {
      overachievers.splice(overachievers.indexOf(target), 1);
      const c = depart(g, target.club, date, 'abgeworben')!;
      install(g, club, c, date, false);
      lines.push(`${club.name} wirbt ${c.name} von ${target.club.name} ab`);
      vacant.push(target.club);
      continue;
    }
    const succ = pickSuccessor(g, club, date, rng);
    install(g, club, succ, date, false);
    lines.push(`${club.name}: neuer Trainer ${succ.name}`);
  }
  if (lines.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'media', from: 'Sportredaktion',
      subject: `Trainerkarussell: ${vacant.length} Wechsel zum Saisonende`,
      shortText: lines[0],
      bodyText: `Zum Saisonende dreht sich das Trainerkarussell:\n\n${lines.map((l) => `• ${l}`).join('\n')}`,
    }));
  }
  return lines;
}
