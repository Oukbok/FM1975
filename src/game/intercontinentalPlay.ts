// =============================================================================
// INTERKONTINENTALE WETTBEWERBE – Spiele ausführen (Teil von game/intercontinental.ts).
// -----------------------------------------------------------------------------
// • Paarungen späterer Runden aus Quellen „W:n“ (Sieger von Spiel n), „L:n“
//   (Verlierer, Spiel um Platz 3) und „G:A:1“ (Gruppe A, Platz 1).
// • Spiel mit deinem Verein: beide Seiten als volle Vereine über die Match-Engine
//   (Vorschau/Textmodus/Spielbericht wie im Supercup; Gegner aus Europa wie im
//   Europapokal, von anderen Kontinenten mit einem Kader nach Herkunft des Landes –
//   `ensureIcClub`). Alle übrigen Spiele schlank nach Stärke (neutraler Platz ohne
//   Heimvorteil, game/continents.ts `ctGoals`).
// =============================================================================
import type { Match } from '../types';
import type { Game } from './state';
import { hashSeed } from './state';
import { MatchEngine, type KoRule } from '../engine/match';
import { buildEuroClubFull } from '../data/generate';
import { bookCupHomeMatch } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { economyScale, yearOf } from '../engine/economy';
import { mulberry32 } from '../engine/leagues';
import { ctClub } from '../data/world/continents';
import { ctGoals, ctStrengthAt } from './continents';
import { clubStrength } from './cupDraw';

export type IcStage = 'G1' | 'G2' | 'G3' | 'R1' | 'AP' | 'DA' | 'CH' | 'PO' | 'R16' | 'QF' | 'SF' | 'P3' | 'F' | 'L1' | 'L2';
export const IC_STAGE_DE: Record<IcStage, string> = {
  G1: 'Gruppe, 1. Spieltag', G2: 'Gruppe, 2. Spieltag', G3: 'Gruppe, 3. Spieltag', R1: 'Erste Runde', AP: 'Afrika-Asien-Pazifik-Pokal',
  DA: 'Derby der Amerikas', CH: 'Herausforderer-Spiel', PO: 'Play-off', R16: 'Achtelfinale', QF: 'Viertelfinale', SF: 'Halbfinale',
  P3: 'Spiel um Platz 3', F: 'Finale', L1: 'Hinspiel', L2: 'Rückspiel',
};

export interface IcMatch {
  id: string; date: string; st: IcStage; grp?: string;
  home: string; away: string;
  /** Paarung aus früheren Spielen/Gruppen („W:3“, „L:3“, „G:A:1“). */
  from?: [string, string];
  /** Neutraler Platz (Tokio, Turnier): Schnellsimulation ohne Heimvorteil. */
  neutral?: boolean;
  played?: boolean; hg?: number; ag?: number; pens?: [number, number]; aet?: boolean; winner?: string;
  match?: Match;
}
export interface IcGroup { name: string; ids: string[] }
export interface IcRow { id: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }

const isGroup = (m: IcMatch) => m.st === 'G1' || m.st === 'G2' || m.st === 'G3';

/** Tabelle einer Gruppe aus den gespielten Spielen. */
export function groupTable(matches: IcMatch[], gr: IcGroup): IcRow[] {
  const rows = new Map(gr.ids.map((id) => [id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
  for (const m of matches) {
    if (m.grp !== gr.name || !m.played) continue;
    const h = rows.get(m.home), a = rows.get(m.away);
    if (!h || !a) continue;
    h.p++; a.p++; h.gf += m.hg!; h.ga += m.ag!; a.gf += m.ag!; a.ga += m.hg!;
    if (m.hg! > m.ag!) { h.w++; a.l++; h.pts += 3; } else if (m.hg! < m.ag!) { a.w++; h.l++; a.pts += 3; } else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  return [...rows.values()].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.id.localeCompare(y.id));
}

/** Paarung einer späteren Runde auflösen (leer, solange die Quelle offen ist). */
export function resolveIc(matches: IcMatch[], groups: IcGroup[] | undefined, m: IcMatch): void {
  if (!m.from) return;
  const side = (src: string): string => {
    if (!src.includes(':')) return src; // fester Teilnehmer (steigt später ein)
    const [k, a, b] = src.split(':');
    if (k === 'G') {
      const gr = groups?.find((x) => x.name === a);
      if (!gr || matches.some((x) => x.grp === a && !x.played)) return '';
      return groupTable(matches, gr)[Number(b) - 1]?.id ?? '';
    }
    const src2 = matches[Number(a)];
    if (!src2?.played || !src2.winner) return '';
    return k === 'W' ? src2.winner : src2.winner === src2.home ? src2.away : src2.home;
  };
  m.home = side(m.from[0]); m.away = side(m.from[1]);
}

/** K.-o.-Regel der Engine je Spiel (Gruppenspiele: Remis möglich). */
export function icKoRule(matches: IcMatch[], m: IcMatch): KoRule | undefined {
  if (isGroup(m) || m.st === 'L1') return undefined;
  if (m.st === 'L2') {
    const l1 = matches.find((x) => x.st === 'L1');
    return { prev: [l1?.ag ?? 0, l1?.hg ?? 0], awayGoals: true, extraTime: true, shootout: true };
  }
  return { extraTime: true, shootout: true };
}

/** Gegner als vollen Verein anlegen (Europa: Europapokal-Kader; andere Kontinente: Kader nach Herkunft). */
export function ensureIcClub(g: Game, id: string): boolean {
  if (g.clubs[id]) return true;
  const eu = g.euroClubs?.[id];
  const start = g.calendar?.seasonStartDate ?? '';
  if (eu) { g.clubs[id] = buildEuroClubFull(eu, start, g.players); return true; }
  const ct = ctClub(id);
  if (!ct) return false;
  const year = yearOf(g.calendar.currentDate);
  const c = buildEuroClubFull({
    id, name: ct.club.name, shortName: ct.club.short, city: ct.club.city, country: ct.country.key,
    strength: ctStrengthAt(id, year), colors: { primary: ct.club.colors[0], secondary: ct.club.colors[1] }, comp: 'ec',
  }, start, g.players);
  c.stadium.name = `Stadion ${ct.club.city}`;
  g.clubs[id] = c;
  return true;
}

const strengthOf = (g: Game, id: string) => clubStrength(g, id);

/** Ein Spiel ausführen. `mid` = eigener Verein (Engine), sonst Schnellsimulation. */
export function playIc(g: Game, matches: IcMatch[], groups: IcGroup[] | undefined, m: IcMatch, salt: string): void {
  if (m.played) return;
  resolveIc(matches, groups, m);
  if (!m.home || !m.away) return;
  const mid = g.managedClubId;
  const ko = icKoRule(matches, m);
  const mine = m.home === mid || m.away === mid;
  if (mine) { ensureIcClub(g, m.home); ensureIcClub(g, m.away); }
  const full = mine && !!g.clubs[m.home] && !!g.clubs[m.away];
  if (full) {
    const engine = new MatchEngine(g.clubs[m.home], g.clubs[m.away], g.players, g.pointSystem, {
      seed: hashSeed(`ic:${m.id}`), date: m.date, competition: 'Pokal', logClubIds: [mid], applyInjuries: g.injuriesEnabled, ko,
    });
    const o = ko ? engine.simulateCup() : { ...engine.simulate(), decision: 'regular' as const, penalties: null };
    m.hg = o.result.homeGoals; m.ag = o.result.awayGoals;
    m.pens = o.penalties ? [o.penalties.home, o.penalties.away] : undefined;
    m.aet = o.decision === 'aet';
    m.match = { id: m.id, matchday: 0, date: m.date, homeClubId: m.home, awayClubId: m.away, status: 'finished', result: o.result, events: o.events, involvesPlayerClub: true };
    if (!m.neutral) bookCupHomeMatch(g.clubs[m.home], o.result, m.date, m.home === mid, economyScale(yearOf(m.date)));
  } else {
    const r = mulberry32(hashSeed(`ic:${salt}:${m.id}`));
    const a = strengthOf(g, m.home), b = strengthOf(g, m.away);
    [m.hg, m.ag] = ctGoals(a, b, r, !!m.neutral, 0.7);
    if (ko) {
      const l1 = m.st === 'L2' ? matches.find((x) => x.st === 'L1') : undefined;
      const th = m.hg + (l1?.ag ?? 0), ta = m.ag + (l1?.hg ?? 0);
      const level = th === ta && (!l1 || (l1.ag ?? 0) === m.ag);
      if (level) {
        const pa = 0.5 + (a - b) / 60;
        if (r() < 0.3) { m.aet = true; if (r() < pa) m.hg++; else m.ag++; } else m.pens = r() < pa ? [5, 4] : [4, 5];
      }
    }
  }
  m.played = true;
  if (isGroup(m) || m.st === 'L1') {
    m.winner = undefined;
    if (full) {
      const res = m.hg! > m.ag! ? 'W' : m.hg! < m.ag! ? 'L' : 'D';
      applyMatchEffects(g.clubs[m.home], g.players, res);
      applyMatchEffects(g.clubs[m.away], g.players, res === 'W' ? 'L' : res === 'L' ? 'W' : 'D');
    }
    return;
  }
  if (m.st === 'L2') {
    const l1 = matches.find((x) => x.st === 'L1')!;
    const th = (m.hg ?? 0) + (l1.ag ?? 0), ta = (m.ag ?? 0) + (l1.hg ?? 0);
    m.winner = m.pens ? (m.pens[0] > m.pens[1] ? m.home : m.away) : th !== ta ? (th > ta ? m.home : m.away) : ((l1.ag ?? 0) > (m.ag ?? 0) ? m.home : m.away);
  } else m.winner = m.pens ? (m.pens[0] > m.pens[1] ? m.home : m.away) : (m.hg ?? 0) >= (m.ag ?? 0) ? m.home : m.away;
  if (full) {
    const hw = m.winner === m.home;
    applyMatchEffects(g.clubs[m.home], g.players, hw ? 'W' : 'L');
    applyMatchEffects(g.clubs[m.away], g.players, hw ? 'L' : 'W');
  }
}

/** Ergebnis-Text eines Spiels (Anzeige, Archiv). */
export function icScore(m: Pick<IcMatch, 'hg' | 'ag' | 'pens' | 'aet'>): string {
  return `${m.hg}:${m.ag}${m.pens ? ` (${m.pens[0]}:${m.pens[1]} i.E.)` : m.aet ? ' n.V.' : ''}`;
}
