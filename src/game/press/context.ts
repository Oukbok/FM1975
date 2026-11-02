// =============================================================================
// Presse: gemeinsamer Kontext beim Schreiben einer Ausgabe (Namen, Texte).
// =============================================================================
import { Speaker } from '../../data/ticker/grammar';
import { PRESS_GRAMMAR } from '../../data/press/grammar';
import { formatMoneyShort } from '../../engine/economy';
import { mulberry32, hashStr } from '../../engine/leagues';
import type { Game } from '../state';
import type { Match, Player } from '../../types';
import type { PressStory } from './types';

export interface PressCtx {
  g: Game;
  /** Erscheinungstag; berichtet wird über [from, date). */
  date: string;
  from: string;
  year: number;
  my: string;
  rng: () => number;
  say: (symbol: string, slots?: Record<string, string | number | undefined>, flags?: string[]) => string;
  name: (id: string | null | undefined) => string;
  city: (id: string) => string;
  player: (id: string | null | undefined) => Player | undefined;
  money: (nominal: number) => string;
  inWindow: (iso: string) => boolean;
  /** Fortlaufende Story-ID. */
  sid: (prefix: string) => string;
}

export function makeCtx(g: Game, date: string, from: string): PressCtx {
  const year = Number(date.slice(0, 4));
  const rng = mulberry32(hashStr(`press:${date}:${g.managedClubId}`));
  const sp = new Speaker({ ...PRESS_GRAMMAR }, rng);
  let n = 0;
  const name = (id: string | null | undefined) => !id ? '–' : g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? g.euroClubs?.[id]?.name ?? id;
  return {
    g, date, from, year, my: g.managedClubId, rng,
    say: (symbol, slots = {}, flags = []) => sp.say(symbol, { year, flags: new Set(flags), slots }),
    name,
    city: (id) => g.clubs[id]?.city ?? g.simClubs?.[id]?.city ?? name(id),
    player: (id) => (id ? g.players[id] ?? g.youthPlayers[id] : undefined),
    money: (nominal) => formatMoneyShort(nominal, year),
    inWindow: (iso) => iso >= from && iso < date,
    sid: (prefix) => `${prefix}-${date}-${++n}`,
  };
}

/** Sieger/Verlierer aus Sicht des Spiels (null bei Remis). */
export function winnerOf(m: { homeClubId: string; awayClubId: string; result: { homeGoals: number; awayGoals: number } | null }) {
  const r = m.result!;
  if (r.homeGoals === r.awayGoals) return null;
  return r.homeGoals > r.awayGoals ? { w: m.homeClubId, l: m.awayClubId } : { w: m.awayClubId, l: m.homeClubId };
}

export const scoreOf = (m: Match) => `${m.result!.homeGoals}:${m.result!.awayGoals}`;

/** Story-Grundgerüst mit Standardwerten. */
export function story(c: PressCtx, s: Omit<PressStory, 'id' | 'people' | 'clubs' | 'targets'> & Partial<Pick<PressStory, 'people' | 'clubs' | 'targets'>>): PressStory {
  return { id: c.sid(s.kind), people: [], clubs: [], targets: [], ...s, own: s.own ?? (s.clubs ?? []).includes(c.my) };
}

/** Position deutsch (Kurzform → Wort). */
export const POS_NAME: Record<string, string> = {
  TW: 'Torhüter', LIB: 'Libero', IV: 'Innenverteidiger', RV: 'Rechtsverteidiger', LV: 'Linksverteidiger',
  DM: 'Sechser', ZM: 'Mittelfeldspieler', RM: 'Mittelfeldspieler', LM: 'Mittelfeldspieler', OM: 'Spielmacher',
  RA: 'Flügelstürmer', LA: 'Flügelstürmer', HS: 'Stürmer', MS: 'Mittelstürmer',
};
export const posName = (p: Player) => POS_NAME[p.naturalPosition] ?? 'Spieler';

/** Tage → „drei Wochen“, „zwei Monate“ … */
export function durationText(days: number): string {
  const words = ['', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
  if (days < 14) return `${days} Tage`;
  if (days < 60) { const w = Math.round(days / 7); return `${words[w] ?? w} Wochen`; }
  const mo = Math.round(days / 30);
  return mo === 1 ? 'einen Monat' : `${words[mo] ?? mo} Monate`;
}

/** „1 Punkt“ / „3 Punkte“ / „kein Punkt“. */
export const plural = (n: number, one: string, many: string) => n === 1 ? `ein${one.endsWith('e') ? 'e' : ''} ${one}` : `${n === 0 ? `kein${one.endsWith('e') ? 'e' : ''}` : n} ${n === 0 ? one : many}`;
