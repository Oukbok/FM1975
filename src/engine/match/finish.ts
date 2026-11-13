// =============================================================================
// Spielende: Noten, Ergebnis, Statistik, gespeicherte Ereignisse und das
// Verbuchen bei den Spielern (Saison/Karriere, Spielliste, Verletzungen).
// =============================================================================
import { SEAT_SALES } from '../seating';
import type { Injury, InjurySeverity, InjuryType, MatchEventType, Player } from '../../types';
import { POSITION_GROUPS } from '../../types';
import { logMatch, recordInjury } from '../history';
import { addCompStats, compCodeOf } from '../compStats';
import type { MatchSim } from './sim';
import type { TeamState } from './state';
import { rating } from './team';
import { addPositionMinutes } from '../positionSkill';
import { addExperience } from '../experience';
import type { LineupEntry, MatchEventExt, MatchOutcome, MatchReport, MatchResultExt, MPlayer, SimEvent, TeamStats } from './types';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export interface FinishOptions {
  date?: string;
  competition?: 'Liga' | 'Pokal' | 'Europapokal';
  logClubIds?: string[];
  applyInjuries?: boolean;
  attendance?: number;
  watched?: boolean;
}

/** Note (1.0 sehr gut … 6.0 ungenügend, halbe Schritte). */
export function grade(sim: MatchSim, m: MPlayer): number {
  const t = sim.team(m.side);
  const o = sim.team(m.side === 'home' ? 'away' : 'home');
  const diff = t.goals - o.goals;
  const mins = minutesOf(sim, m);
  let g = 3.6 - m.impact * 0.85 - (rating(m) - 66) / 30;
  g += diff > 0 ? -0.25 : diff < 0 ? 0.25 : 0;
  if (o.goals === 0 && (m.group === 'GK' || m.group === 'DEF')) g -= m.group === 'GK' ? 0.45 : 0.3;
  if (m.group === 'GK') g += Math.max(0, o.goals - 1) * 0.2;
  // Zweikampf/Pass-Anteil
  g -= (m.tackles * 0.03);
  // Kurzeinsätze ziehen Richtung 3.5
  const w = clamp(mins / 60, 0.25, 1);
  g = 3.5 + (g - 3.5) * w;
  // Rauschen (deterministisch aus dem Spielverlauf)
  g += (hash01(m.id + sim.events.length) - 0.5) * 0.6;
  return clamp(Math.round(g * 2) / 2, 1, 6);
}

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export function minutesOf(sim: MatchSim, m: MPlayer): number {
  const end = sim.period >= 3 ? 120 : 90;
  if (!m.started && m.minuteIn === 0 && !m.onPitch && m.minuteOut === null) return 0;
  const out = m.minuteOut ?? end;
  return Math.max(1, Math.min(end, out) - m.minuteIn);
}

const played = (sim: MatchSim, m: MPlayer) => m.started || m.minuteIn > 0 || m.onPitch;

// -----------------------------------------------------------------------------
// Gespeicherte Ereignisse (knapp)
// -----------------------------------------------------------------------------

const name = (sim: MatchSim, id?: string) => (id ? sim.players[id]?.lastName ?? '?' : '?');

function storedType(ev: SimEvent): MatchEventType | null {
  switch (ev.kind) {
    case 'kickoff': return 'kickoff';
    case 'halftime': return 'half_time';
    case 'fulltime': return ev.detail === 'et' ? null : 'full_time';
    case 'et_start': return 'extra_time_start';
    case 'et_half': return 'extra_time_half';
    case 'et_end': return 'extra_time_end';
    case 'shootout_start': return 'shootout_start';
    case 'shootout_kick': return ev.shootout?.scored ? 'shootout_goal' : 'shootout_miss';
    case 'shootout_end': return 'shootout_end';
    case 'sub': return 'substitution';
    case 'injury': return 'injury';
    case 'card': return ev.card === 'red' ? 'red_card' : ev.card === 'yellowRed' ? 'yellow_red_card' : 'yellow_card';
    case 'chance': {
      const c = ev.chance!;
      if (c.type === 'penalty') return c.outcome === 'goal' ? 'penalty_goal' : c.outcome === 'saved' ? 'penalty_saved' : 'penalty_missed';
      if (c.outcome === 'goal' && !c.disallowed) return c.ownGoal ? 'own_goal' : 'goal';
      return c.big ? 'chance' : null;
    }
    default: return null;
  }
}

function shortText(sim: MatchSim, ev: SimEvent): string {
  const club = ev.side ? sim.team(ev.side).club.name : '';
  const [h, a] = ev.score;
  switch (ev.kind) {
    case 'kickoff': return `Anpfiff: ${sim.home.club.name} – ${sim.away.club.name}.`;
    case 'halftime': return `Halbzeit, ${h}:${a}.`;
    case 'fulltime': return `Abpfiff, ${h}:${a}.`;
    case 'et_start': return 'Verlängerung.';
    case 'et_half': return `Halbzeit der Verlängerung, ${h}:${a}.`;
    case 'et_end': return `Ende der Verlängerung, ${h}:${a}.`;
    case 'shootout_start': return 'Elfmeterschießen.';
    case 'shootout_kick': return `${name(sim, ev.player)} ${ev.shootout?.scored ? 'trifft' : ev.shootout?.saved ? 'scheitert am Torwart' : 'vergibt'} (${ev.shootout?.home}:${ev.shootout?.away}).`;
    case 'shootout_end': return `${club} gewinnt das Elfmeterschießen ${ev.shootout?.home}:${ev.shootout?.away}.`;
    case 'sub': return `Wechsel bei ${club}: ${name(sim, ev.player)} für ${name(sim, ev.other)}.`;
    case 'injury': return `${name(sim, ev.player)} (${club}) verletzt sich.`;
    case 'card': return `${ev.card === 'red' ? 'Rot' : ev.card === 'yellowRed' ? 'Gelb-Rot' : 'Gelb'} für ${name(sim, ev.player)} (${club}).`;
    case 'chance': {
      const c = ev.chance!;
      if (c.type === 'penalty') return c.outcome === 'goal' ? `${name(sim, ev.player)} verwandelt den Elfmeter, ${h}:${a}.` : `${name(sim, ev.player)} vergibt einen Elfmeter.`;
      if (c.outcome === 'goal' && !c.disallowed) return c.ownGoal ? `Eigentor ${name(sim, ev.player)}, ${h}:${a}.` : `Tor für ${club} durch ${name(sim, ev.player)}${ev.assist ? ` (Vorlage ${name(sim, ev.assist)})` : ''}, ${h}:${a}.`;
      if (c.disallowed) return `Treffer von ${name(sim, ev.player)} zählt nicht.`;
      return `Großchance für ${club}: ${name(sim, ev.player)} ${c.outcome === 'saved' ? 'scheitert am Torwart' : c.outcome === 'post' ? (ev.seq % 2 ? 'trifft nur den Pfosten' : 'trifft nur die Latte') : c.outcome === 'blocked' ? 'wird im letzten Moment geblockt' : 'vergibt'}.`;
    }
    default: return '';
  }
}

export function storedEvents(sim: MatchSim): MatchEventExt[] {
  const out: MatchEventExt[] = [];
  let n = 0;
  for (const ev of sim.events) {
    const type = storedType(ev);
    if (!type) continue;
    const clubId = ev.side ? sim.team(ev.side).club.id : sim.home.club.id;
    const e: MatchEventExt = {
      id: `${sim.home.club.id}-${sim.away.club.id}-ev${++n}`,
      minute: ev.minute, type, clubId, playerId: ev.player,
      secondaryPlayerId: ev.kind === 'sub' ? ev.other : ev.assist,
      commentary: shortText(sim, ev),
      scoreAfter: ev.kind === 'shootout_kick' || ev.kind === 'shootout_end'
        ? { home: ev.shootout!.home, away: ev.shootout!.away } : { home: ev.score[0], away: ev.score[1] },
    };
    if (ev.stoppage) e.stoppage = ev.stoppage;
    if (ev.chance) { e.xg = ev.chance.xg; if (ev.chance.big) e.big = true; }
    out.push(e);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Ergebnis & Verbuchen
// -----------------------------------------------------------------------------

function roundStats(s: TeamStats, possShare: number): TeamStats {
  return {
    ...s, xg: Math.round(s.xg * 100) / 100, possession: Math.round(possShare * 100),
    passes: Math.round(s.passes), passesOk: Math.round(s.passesOk), duels: Math.round(s.duels),
    duelsWon: Math.round(s.duelsWon), distance: Math.round(s.distance * 10) / 10,
  };
}

/**
 * Laufleistung & Pässe je Spieler. Pässe aus Angriffen und Kontern sind schon einzeln gezählt;
 * die übrigen (Spielaufbau) werden nach Einsatzzeit und Rolle verteilt, die Quote je Spieler
 * folgt seinem Passspiel. Zweikämpfe werden in der Engine vollständig einzeln entschieden.
 */
function distribute(sim: MatchSim, t: TeamState): void {
  const kmPerMin = sim.year < 1985 ? 0.088 : sim.year < 2000 ? 0.1 : sim.year < 2012 ? 0.112 : 0.118;
  const ps = t.players.filter((m) => played(sim, m));
  let passW = 0, realP = 0, realOk = 0;
  const pw = (m: MPlayer) => (m.group === 'MID' ? 1.4 : m.group === 'DEF' ? 1.1 : m.group === 'GK' ? 0.45 : 0.75) * minutesOf(sim, m);
  for (const m of ps) { passW += pw(m); realP += m.passes; realOk += m.passesOk; }
  const bgPasses = Math.max(0, t.stats.passes - realP), bgOk = Math.max(0, t.stats.passesOk - realOk);
  const teamAcc = bgPasses > 0 ? bgOk / bgPasses : 0.75;
  let km = 0;
  for (const m of ps) {
    const mins = minutesOf(sim, m);
    const a = m.p.attributes;
    const work = m.group === 'GK' ? 0.5 : 0.82 + (a.workRate / 100) * 0.22 + (a.stamina / 100) * 0.1;
    m.distance = Math.round(mins * kmPerMin * work * 10) / 10;
    km += m.distance;
    const n = Math.round(bgPasses * pw(m) / Math.max(1, passW));
    const acc = clamp(teamAcc + (a.passing * 0.7 + a.vision * 0.15 + a.firstTouch * 0.15 - 62) / 100 * 0.4 + (m.group === 'DEF' ? 0.04 : m.group === 'ATT' ? -0.07 : 0), 0.4, 0.97);
    m.passes += n;
    m.passesOk += Math.round(n * acc);
    m.impact += (m.duelsWon - m.duels / 2) * 0.03;
  }
  t.stats.distance = km;
}

export function finishMatch(sim: MatchSim, opts: FinishOptions): MatchOutcome {
  const H = sim.home, A = sim.away;
  distribute(sim, H); distribute(sim, A);
  const possTotal = H.stats.possession + A.stats.possession || 1;
  const hs = roundStats(H.stats, H.stats.possession / possTotal);
  const as = roundStats(A.stats, A.stats.possession / possTotal);

  const grades = new Map<string, number>();
  for (const t of [H, A]) for (const m of t.players) if (played(sim, m)) grades.set(m.id, grade(sim, m));
  let motm: string | undefined; let best = 99;
  for (const [id, g] of grades) {
    const m = (H.players.find((x) => x.id === id) ?? A.players.find((x) => x.id === id))!;
    const score = g - m.impact * 0.05;
    if (score < best) { best = score; motm = id; }
  }

  const result: MatchResultExt = {
    homeGoals: H.goals, awayGoals: A.goals,
    homePossession: hs.possession,
    homeShots: hs.shots, awayShots: as.shots,
    homeShotsOnTarget: hs.shotsOnTarget, awayShotsOnTarget: as.shotsOnTarget,
    homeCorners: hs.corners, awayCorners: as.corners,
    homeFouls: hs.fouls, awayFouls: as.fouls,
    homeYellowCards: hs.yellow, awayYellowCards: as.yellow,
    homeRedCards: hs.red, awayRedCards: as.red,
    attendance: opts.attendance ?? sim.attendance,
    manOfTheMatchId: motm,
  };
  if (opts.attendance == null) SEAT_SALES.set(result, sim.seatSale); // Verkauf je Platzkategorie für die Buchung

  const logged = opts.logClubIds ?? [];
  if (logged.includes(H.club.id) || logged.includes(A.club.id)) {
    const lineup = (t: TeamState): LineupEntry[] => t.players.filter((m) => played(sim, m)).map((m) => ({
      id: m.id, pos: m.pos, in: m.minuteIn, out: m.minuteOut, started: m.started, grade: grades.get(m.id) ?? 3.5,
      goals: m.goals, assists: m.assists,
      card: m.red ? 'Rot' : m.yellowRed ? 'Gelb-Rot' : m.yellow ? 'Gelb' : undefined,
      st: [m.shots, m.shotsOnTarget, m.passes, m.passesOk, m.duels, m.duelsWon, m.crosses ?? 0, m.crossesOk ?? 0,
        m.dribbles ?? 0, m.dribblesOk ?? 0, m.aerials ?? 0, m.aerialsWon ?? 0, m.tackles, m.keyPasses, m.saves],
    }));
    const report: MatchReport = {
      year: sim.year, home: hs, away: as, lineups: { home: lineup(H), away: lineup(A) },
      momentum: sim.momentum.map((v) => v ?? 0), weather: sim.weather, halftime: sim.halftimeScore,
      watched: opts.watched || undefined,
    };
    result.report = report;
  }

  commit(sim, grades, opts);

  const pen = sim.shoot.kicksH > 0 ? { home: sim.shoot.home, away: sim.shoot.away } : null;
  const decision: MatchOutcome['decision'] = pen ? 'penalties' : sim.period >= 3 ? 'aet' : 'regular';
  const homeWins = pen ? pen.home > pen.away : H.goals > A.goals;
  return { result, events: storedEvents(sim), decision, penalties: pen, homeWins };
}

function commit(sim: MatchSim, grades: Map<string, number>, opts: FinishOptions): void {
  const H = sim.home, A = sim.away;
  const { date, competition = 'Liga', logClubIds, applyInjuries } = opts;
  // Sperren absitzen: Wer gesperrt war, hat dieses Spiel verpasst → ein Spiel weniger.
  // (Vor dem Verbuchen neuer Karten, damit eine frische Sperre nicht sofort verfällt.)
  for (const t of [H, A]) {
    for (const id of t.club.playerIds) {
      const p = sim.players[id];
      if (p && p.suspensionMatches > 0) p.suspensionMatches--;
    }
  }
  for (const t of [H, A]) {
    const o = t === H ? A : H;
    const clean = o.goals === 0;
    for (const m of t.players) {
      if (!played(sim, m)) continue;
      const player = m.p;
      const g = grades.get(m.id) ?? 3.5;
      const mins = minutesOf(sim, m);
      for (const stats of [player.seasonStats, player.careerStats]) {
        stats.appearances++;
        if (m.started) stats.starts++; else stats.substituteAppearances++;
        stats.minutesPlayed += mins;
        stats.goals += m.goals;
        stats.assists += m.assists;
        stats.yellowCards += m.yellow;
        stats.yellowRedCards += m.yellowRed;
        stats.redCards += m.red;
        if (clean && (m.group === 'GK' || POSITION_GROUPS[player.naturalPosition] === 'DEF')) stats.cleanSheets++;
        const d = (stats.detail ??= [0, 0, 0, 0, 0, 0]);
        d[0] += m.shots; d[1] += m.shotsOnTarget; d[2] += m.passes; d[3] += m.passesOk; d[4] += m.duels; d[5] += m.duelsWon;
        stats.ratingSum += g;
        stats.ratedMatches++;
        stats.averageRating = stats.ratedMatches > 0 ? stats.ratingSum / stats.ratedMatches : 0;
      }
      // Positionsvertrautheit wächst mit Einsatzminuten auf der gespielten Position.
      if (date) addPositionMinutes(player, m.pos, mins, date);
      // Erfahrung wächst mit Pflichtspielen (engine/experience.ts).
      addExperience(player, mins, competition);
      // Bestenlisten je Wettbewerb (Weiße Weste: nur Torhüter).
      // Liga zusätzlich mit Note/Zu-null für die Auszeichnungen der Saison (engine/seasonAwards.ts).
      addCompStats(player, compCodeOf(competition), m, clean && m.group === 'GK', competition === 'Liga' ? { grade: g, clean } : undefined);
      player.yellowCardCount += m.yellow;
      if (m.red > 0 || m.yellowRed > 0) player.suspensionMatches = Math.max(player.suspensionMatches, m.red > 0 ? 2 : 1);
      // Gelbsperre (ab 1979/80): jede fünfte Gelbe Karte einer Saison (nur Liga) kostet ein Spiel.
      else if (m.yellow > 0 && competition === 'Liga' && sim.era.yellowBan && player.seasonStats.yellowCards > 0 && player.seasonStats.yellowCards % 5 === 0) {
        player.suspensionMatches = Math.max(player.suspensionMatches, 1);
      }
      if (date && logClubIds?.includes(player.clubId)) {
        const isHome = t === H;
        logMatch(player, {
          date, competition, home: isHome, opponent: o.club.name,
          score: isHome ? `${H.goals}:${A.goals}` : `${A.goals}:${H.goals}`,
          minutes: mins, goals: m.goals, assists: m.assists, rating: g,
          card: m.red ? 'Rot' : m.yellowRed ? 'Gelb-Rot' : m.yellow ? 'Gelb' : undefined,
          pos: m.pos,
        });
      }
    }
  }
  if (date && applyInjuries) {
    for (const [id, severity] of sim.injuries) {
      const p: Player | undefined = sim.players[id];
      if (!p || p.injury) continue;
      const inj = createMatchInjury(severity, date);
      p.injury = inj;
      p.availability = 'injured';
      recordInjury(p, inj);
    }
  }
}

/** Erzeugt aus einer Spielverletzung ein vollständiges Injury-Objekt. */
export function createMatchInjury(severity: InjurySeverity, startDate: string): Injury {
  const typeBySeverity: Record<InjurySeverity, InjuryType[]> = {
    minor: ['bruise', 'bruise', 'muscle'],
    moderate: ['muscle', 'muscle', 'ligament', 'concussion'],
    severe: ['ligament', 'bone'],
    critical: ['bone'],
  };
  const daysBySeverity: Record<InjurySeverity, [number, number]> = {
    minor: [3, 9], moderate: [12, 28], severe: [40, 90], critical: [100, 200],
  };
  const r = Math.random();
  const types = typeBySeverity[severity];
  const type = types[Math.floor(r * types.length)];
  const [lo, hi] = daysBySeverity[severity];
  const totalDays = Math.round(lo + Math.random() * (hi - lo));
  const start = new Date(startDate);
  const ret = new Date(start.getTime() + totalDays * 86_400_000);
  const descByType: Record<InjuryType, string> = {
    muscle: 'Muskelverletzung im Oberschenkel', ligament: 'Bänderriss', bone: 'Knochenbruch',
    bruise: 'Prellung', concussion: 'Gehirnerschütterung', fatigue: 'Überlastung', illness: 'Krankheit',
  };
  return {
    id: `inj-${startDate}-${Math.floor(Math.random() * 1e6)}`,
    type, severity, description: descByType[type], startDate,
    expectedReturnDate: ret.toISOString().slice(0, 10),
    daysRemaining: totalDays, totalDays, fromTraining: false,
  };
}
