// =============================================================================
// ZWEITE MANNSCHAFTEN IM AUSLAND (Regeln mit Quellen: data/reserveRules.ts
// `FOREIGN_RESERVE_RULES`). Die Weltdaten führen B-Teams als eigene Vereine mit der
// Kennung `<Stammverein>-ii` (z. B. Spanien, Portugal). Die Hintergrund-Welt simuliert
// je Land 1./2. Liga + Unterbau; hier greifen die Regeln des Landes:
//  • nie in der höchsten erlaubten Ebene darüber (Spanien/Portugal: höchstens 2. Liga),
//    nie in derselben oder einer höheren Liga als die erste Mannschaft – ein gesperrter
//    Aufsteiger macht dem Nächsten Platz, steigt die erste Mannschaft ab, muss die zweite
//    in den Unterbau (Zwangsabstieg);
//  • Landespokal nur, wenn die Regel es erlaubt (Spanien bis 1989/90, Portugal nie).
// Länder ohne B-Teams in den Daten (England, Italien, Frankreich …) bleiben unverändert:
// deren zweite Mannschaften spielen unterhalb der simulierten Ebenen bzw. in eigenen
// Reserveligen (England) und tauchen in der Hintergrund-Welt nicht auf.
// =============================================================================
import { foreignReserveRule } from '../data/reserveRules';
import { COUNTRY_BY_KEY } from '../data/world/countries';
import type { WorldCountry } from './worldTypes';

/** Stammverein eines B-Teams (`…-ii`) bzw. null. */
export const bParentOf = (id: string): string | null => (id.endsWith('-ii') ? id.slice(0, -3) : null);

const ruleOf = (countryKey: string, year: number) => {
  const cc = COUNTRY_BY_KEY[countryKey]?.cc;
  return cc ? foreignReserveRule(cc, year) : null;
};

/** Darf ein B-Team im Jahr am Landespokal teilnehmen? (ohne Regel: ja) */
export function bTeamInCup(countryKey: string, year: number): boolean {
  return ruleOf(countryKey, year)?.cup ?? true;
}
/** Landespokal-Feld ohne gesperrte B-Teams. */
export function cupField(countryKey: string, year: number, ids: string[]): string[] {
  return bTeamInCup(countryKey, year) ? ids : ids.filter((id) => !bParentOf(id));
}

/**
 * Nach dem Auf-/Abstieg eines Landes (engine/world.ts): B-Teams nach den Regeln einordnen.
 * `tiers[0]` = 1. Liga, `tiers[1]` = 2. Liga, `pool` = Unterbau. Reihenfolge der 2. Liga = Tabelle.
 */
export function enforceWorldReserves(c: WorldCountry, year: number, str: (id: string) => number = () => 0): void {
  const rule = ruleOf(c.name, year);
  const b = (id: string) => !!bParentOf(id);
  if (!c.tiers.flat().some(b)) return;
  const top = rule ? (rule.inPyramid ? (rule.topTier ?? 2) - 1 : 99) : 1; // Index der höchsten erlaubten Ebene
  const tierOf = (id: string) => (c.tiers[0].includes(id) ? 0 : c.tiers[1]?.includes(id) ? 1 : 9);
  const allowed = (id: string, t: number) => t >= top && t > tierOf(bParentOf(id)!);
  // 1) 1. Liga: gesperrte B-Teams tauschen mit dem besten zulässigen der 2. Liga.
  for (const id of [...c.tiers[0]].filter(b)) {
    if (allowed(id, 0)) continue;
    const up = (c.tiers[1] ?? []).find((x) => !b(x));
    if (!up) continue;
    c.tiers[0][c.tiers[0].indexOf(id)] = up;
    c.tiers[1][c.tiers[1].indexOf(up)] = id;
  }
  // 2) 2. Liga: Zwangsabstieg in den Unterbau (bester Amateurverein rückt nach).
  if (!c.tiers[1]) return;
  for (const id of [...c.tiers[1]].filter(b)) {
    if (allowed(id, 1)) continue;
    const pool = c.pool ?? [];
    const repl = pool.filter((x) => !b(x)).sort((x, y) => str(y) - str(x))[0];
    if (!repl) continue;
    c.tiers[1][c.tiers[1].indexOf(id)] = repl;
    c.pool = [...pool.filter((x) => x !== repl), id];
  }
}
