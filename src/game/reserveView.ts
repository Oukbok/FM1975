// =============================================================================
// ZWEITE MANNSCHAFT – Anzeigedaten für Jugend › 2. Mannschaft: Liga (echte Staffel
// oder Amateurliga), Tabelle mit Zonen, Spiele, Hinweis „Aufstieg gesperrt“.
// =============================================================================
import type { Game } from './state';
import { ownReserveDivision, reserveState, sortedTable, OWN_ID, type ReserveResult } from './reserveTeam';
import { ownReserveId, reserveTierOk } from './reserveIds';
import { reserveCupOpen, reserveEra } from '../data/reserveRules';
import { seasonStartYear } from '../data/timeline';
import { simDisplayName } from '../engine/leagues';

export interface ReserveViewRow { id: string; linkId?: string; name: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; me: boolean }
export interface ReserveView {
  league: string;
  /** Ebene der Staffel (3 = dritte Ebene …) bzw. null = Amateurliga unterhalb der simulierten Ligen. */
  tier: number | null;
  rows: ReserveViewRow[];
  pos: number;
  played: number;
  total: number;
  results: ReserveResult[];
  up: number;
  down: number;
  /** Warum ein Aufstieg nicht möglich ist (oder null). */
  blocked: string | null;
  rule: string;
  cup: string;
  note?: string;
}

function lowestWest(g: Game): { tier: number; n: number } {
  const west = (g.leagues?.otherDivisions ?? []).filter((d) => d.tier < 100);
  const tiers = [g.leagues?.playerDivision.tier ?? 1, ...west.map((d) => d.tier)];
  const t = Math.max(...tiers);
  return { tier: t, n: west.filter((d) => d.tier === t).length || 1 };
}

/** Zahl der Auf-/Absteiger einer Staffel wie im Saisonwechsel (data/reforms.ts, game/clubPool.ts). */
function zones(g: Game, tier: number): { up: number; down: number } {
  const n = (t: number) => (g.leagues?.otherDivisions ?? []).filter((d) => d.tier === t && d.tier < 100).length + (g.leagues?.playerDivision.tier === t ? 1 : 0);
  const per = (groups: number) => (groups >= 3 ? 1 : groups === 2 ? 2 : 3);
  const low = lowestWest(g);
  const up = per(n(tier));
  const down = tier === low.tier ? (low.n >= 3 ? 2 : low.n === 2 ? 4 : 3) : Math.max(1, Math.round(n(tier + 1) * per(n(tier + 1)) / Math.max(1, n(tier))));
  return { up, down };
}

export function reserveView(g: Game): ReserveView | null {
  const st = reserveState(g);
  if (!st) return null;
  const year = seasonStartYear(g.season);
  const parentTier = g.leagues?.playerDivision.tier ?? 1;
  const parentName = g.leagues?.playerDivision.name ?? '1. Liga';
  const era = reserveEra(year);
  const cup = reserveCupOpen(year)
    ? 'DFB-Pokal: Amateure können sich über den Verbandspokal qualifizieren (im Spiel: Platz 1–3 der höchsten Amateurliga bzw. Staffel).'
    : year >= 2008 ? 'DFB-Pokal: seit 2008/09 sind zweite Mannschaften ausgeschlossen.' : 'DFB-Pokal: noch nicht offen für Amateurmannschaften.';
  const div = ownReserveDivision(g);
  const blockText = (tier: number) => (tier <= 2
    ? 'Aufstieg gesperrt: Die 2. Liga ist für zweite Mannschaften gesperrt – der Platz geht an den Nächsten.'
    : `Aufstieg gesperrt: Die erste Mannschaft spielt in der ${parentName}.`);
  if (div) {
    const id = ownReserveId(g);
    const rows = [...div.table.rows].sort((a, b) => a.position - b.position).map((r) => {
      const s = g.simClubs[r.clubId] ?? g.clubs[r.clubId];
      const name = s ? ('tier' in s ? simDisplayName(s, year) : s.name) : r.clubId;
      return { id: r.clubId, linkId: r.clubId, name, p: r.played, w: r.won, d: r.drawn, l: r.lost, gf: r.goalsFor, ga: r.goalsAgainst, pts: r.points, me: r.clubId === id };
    });
    const results: ReserveResult[] = div.fixtures.filter((m) => m.status === 'finished' && (m.homeClubId === id || m.awayClubId === id))
      .sort((a, b) => b.date.localeCompare(a.date)).map((m) => {
        const home = m.homeClubId === id;
        const opp = home ? m.awayClubId : m.homeClubId;
        return { date: m.date, opp: g.simClubs[opp]?.name ?? opp, oppId: opp, home, gf: (home ? m.result?.homeGoals : m.result?.awayGoals) ?? 0, ga: (home ? m.result?.awayGoals : m.result?.homeGoals) ?? 0 };
      });
    const z = zones(g, div.tier);
    const blocked = reserveTierOk(div.tier - 1, parentTier) ? null : blockText(div.tier - 1);
    return {
      league: div.name, tier: div.tier, rows, pos: rows.findIndex((r) => r.me) + 1, played: div.nextMatchday - 1, total: (div.clubIds.length - 1) * 2,
      results, up: blocked ? 0 : z.up, down: z.down, blocked, rule: era.text, cup, note: st.note,
    };
  }
  const win = g.pointSystem === '3-point' ? 3 : 2;
  const t = sortedTable(st, win);
  const rows = t.map((r) => ({ id: r.id, linkId: r.id === OWN_ID ? ownReserveId(g) : r.id.startsWith('t:') ? undefined : r.id, name: r.name, p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.w * win + r.d, me: r.id === OWN_ID }));
  const depth = st.depth ?? 0;
  const low = lowestWest(g);
  const blocked = depth > 0 ? null : !reserveTierOk(low.tier, parentTier) ? blockText(low.tier) : null;
  return {
    league: st.leagueName ?? 'Amateurliga', tier: null, rows, pos: rows.findIndex((r) => r.me) + 1, played: st.md, total: (t.length - 1) * 2,
    results: st.results, up: blocked ? 0 : 1, down: depth >= 2 ? 0 : 3, blocked, rule: era.text, cup, note: st.note,
  };
}
