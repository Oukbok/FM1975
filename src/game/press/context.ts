// =============================================================================
// Presse: gemeinsamer Kontext beim Schreiben einer Ausgabe (Namen, Texte).
// =============================================================================
import { Speaker } from '../../data/ticker/grammar';
import { PRESS_GRAMMAR } from '../../data/press/grammar';
import { formatMoneyShort } from '../../engine/economy';
import { mulberry32, hashStr } from '../../engine/leagues';
import { playerLevel, type Game } from '../state';
import { divisionTitle } from '../../engine/leagues';
import type { Match, Player } from '../../types';
import type { PressStory } from './types';

export interface PressCtx {
  g: Game;
  /** Erscheinungstag; berichtet wird über [from, date). */
  date: string;
  from: string;
  year: number;
  my: string;
  /** Name der eigenen Liga (Rubrik, nie fest „Bundesliga“). */
  league: string;
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
  // Flags für alle Texte der Ausgabe: Drei-Punkte-Regel, höchste Spielklasse, deutsche Meisterschale.
  const top = playerLevel(g) === 1;
  const base = [g.pointSystem === '3-point' ? 'p3' : '', top ? 'oberhaus' : '', top && !g.homeCountry && !g.ddrHome ? 'schale' : ''].filter(Boolean);
  const div = g.leagues?.playerDivision;
  return {
    g, date, from, year, my: g.managedClubId, rng,
    league: div ? divisionTitle(div) : '1. Liga',
    say: (symbol, slots = {}, flags = []) => sp.say(symbol, { year, flags: new Set([...base, ...flags]), slots }),
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
/** Positionswort; „Sechser“ ist erst ab Mitte der 90er gebräuchlich. */
export const posName = (p: Player, year = 2000) => (p.naturalPosition === 'DM' && year < 1995 ? 'Mittelfeldspieler' : POS_NAME[p.naturalPosition] ?? 'Spieler');

/** Tage → „drei Wochen“, „zwei Monate“ … (Akkusativ; `dat` = Dativ: „mit zwölf Tagen“, „mit einem Monat“). */
export function durationText(days: number, dat = false): string {
  const words = ['', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
  if (days < 14) return days === 1 ? (dat ? 'einem Tag' : 'einen Tag') : `${days} Tage${dat ? 'n' : ''}`;
  if (days < 60) { const w = Math.round(days / 7); return `${words[w] ?? w} Wochen`; }
  const mo = Math.round(days / 30);
  return mo === 1 ? (dat ? 'einem Monat' : 'einen Monat') : `${words[mo] ?? mo} Monate${dat ? 'n' : ''}`;
}

/**
 * Zahl + Nomen mit richtigem Kasus: count(1, 'acc', ['Einsatz', 'Einsätze']) = „einen Einsatz“,
 * count(0, 'acc', …) = „keinen Einsatz“, count(3, 'dat', ['Spiel', 'Spielen']) = „3 Spielen“.
 * `forms` = [Singular, Plural im gewünschten Kasus], `g` = Genus des Nomens.
 */
export function count(n: number, kasus: 'nom' | 'acc' | 'dat', forms: [string, string], g: 'm' | 'f' | 'n' = 'm'): string {
  const ART: Record<string, Record<string, string>> = {
    nom: { m: 'ein', f: 'eine', n: 'ein' }, acc: { m: 'einen', f: 'eine', n: 'ein' }, dat: { m: 'einem', f: 'einer', n: 'einem' },
  };
  if (n === 1) return `${ART[kasus][g]} ${forms[0]}`;
  if (n === 0 && kasus !== 'dat') return `k${ART[kasus][g]} ${forms[0]}`;
  return `${n} ${forms[1]}`;
}

/** „1 Punkt“ / „3 Punkte“ / „kein Punkt“. */
export const plural = (n: number, one: string, many: string) => n === 1 ? `ein${one.endsWith('e') ? 'e' : ''} ${one}` : `${n === 0 ? `kein${one.endsWith('e') ? 'e' : ''}` : n} ${n === 0 ? one : many}`;
