// =============================================================================
// LIGANAMEN ALTER SPIELSTÄNDE (Wunsch Pascal: Ligen anderer Länder in deren Sprache,
// data/leagueNames.ts). Heimatland ≠ Deutschland: laufende Divisionen, Liga-Archiv und die
// Liga-Bezeichnungen der Vereins-Historie bekommen beim Laden die Namen nach dem Schema
// („1. League“, „2. Ligue Nord“ …). IDs, Ebenen und Staffeln bleiben unverändert; idempotent.
// Auslandsligen tragen keinen gespeicherten Namen – sie werden ohnehin beim Anzeigen benannt.
// =============================================================================
import { groupWordOfKey, homeDivisionName, leagueName } from '../data/leagueNames';
import type { LeagueGroup } from '../engine/leagues';
import { recordBook } from './clubRecords';
import { leagueArchive } from './leagueArchive';
import type { Game } from './state';

interface Named { id: string; name: string; tier: number; group: LeagueGroup }

/** Benennt eine Saison voller Divisionen des Heimatlandes (Ebene < 100) nach dem Schema. */
export function renameHomeDivisions(cc: string, list: Named[]): void {
  const own = list.filter((d) => d.tier < 100 && !d.id.startsWith('x-'));
  for (const d of own) {
    const same = own.filter((x) => x.tier === d.tier);
    d.name = homeDivisionName(cc, d.tier, d.group, same.length, same.indexOf(d));
  }
}

const GERMAN_GROUP: Record<string, string> = { Nord: 'nord', 'Süd': 'sued', Mitte: 'west', West: 'west' };

/** Alte Bezeichnung der Vereins-Historie („England 1. Liga“, „2. Liga Nord“, „Regionalliga Süd“) → Schema. */
function relabel(cc: string, label: string, tier: number | undefined, country: string): string {
  if (/^.+ 1\. Liga$/.test(label)) return `${country} ${leagueName(cc, 1)}`;
  const m = /^(\d+)\. Liga(?: (\S+))?$/.exec(label) ?? (tier ? /^Regionalliga()(?: (\S+))?$/.exec(label) : null);
  if (!m) return label;
  const t = m[1] ? Number(m[1]) : tier!;
  const w = m[2] ? groupWordOfKey(cc, GERMAN_GROUP[m[2]] as LeagueGroup) : '';
  return `${leagueName(cc, t)}${w ? ` ${w}` : ''}`;
}

export function migrateLeagueNames(g: Game, country: string): void {
  const cc = g.homeCountry;
  if (!cc || cc === 'ger' || g.ddrHome) return;
  renameHomeDivisions(cc, [g.leagues.playerDivision, ...g.leagues.otherDivisions]);
  for (const s of leagueArchive(g)?.seasons ?? []) renameHomeDivisions(cc, s.divisions);
  const book = recordBook(g);
  if (!book) return;
  // Ebene je Bezeichnung aus den Saisoneinträgen (für „Regionalliga …“ ohne Nummer).
  const tierOf = new Map<number, number>();
  for (const list of Object.values(book.seasons)) for (const s of list) if (!tierOf.has(s[4])) tierOf.set(s[4], s[1]);
  book.divs = book.divs.map((l, i) => relabel(cc, l, tierOf.get(i), country));
}
