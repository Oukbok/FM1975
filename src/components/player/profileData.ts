// Abgeleitete Anzeigedaten fürs Spielerprofil: Landesnamen, Disziplin/Führung in Worten,
// Attribut-Trend aus den Momentaufnahmen, Trainingsschwerpunkt der laufenden Woche.
// Reine Anzeige – nichts davon wird gespeichert.
import type { Player, Position } from '../../types';
import type { Game } from '../../game/state';
import { currentWeekEffect } from '../../game/trainingWeek';
import { EFFECT_GROUPS } from '../../engine/trainingPlan';
import { positionSuitability } from '../../engine/positions';
import { rankedPositions } from '../../engine/positionSkill';
import type { AttrKey } from './shared';

const NATION_DE: Record<string, string> = {
  GER: 'Deutschland', Deutschland: 'Deutschland', DDR: 'DDR', GDR: 'DDR', AUT: 'Österreich', SUI: 'Schweiz',
  ENG: 'England', SCO: 'Schottland', WAL: 'Wales', NIR: 'Nordirland', IRL: 'Irland', USA: 'USA',
  NED: 'Niederlande', BEL: 'Belgien', LUX: 'Luxemburg', FRA: 'Frankreich', ESP: 'Spanien', POR: 'Portugal', ITA: 'Italien',
  DEN: 'Dänemark', SWE: 'Schweden', NOR: 'Norwegen', FIN: 'Finnland', ISL: 'Island',
  YUG: 'Jugoslawien', SRB: 'Serbien', CRO: 'Kroatien', BIH: 'Bosnien-Herzegowina', SVN: 'Slowenien', MKD: 'Nordmazedonien',
  POL: 'Polen', TCH: 'Tschechoslowakei', CZE: 'Tschechien', SVK: 'Slowakei', HUN: 'Ungarn', ROU: 'Rumänien', BUL: 'Bulgarien',
  GRE: 'Griechenland', TUR: 'Türkei', RUS: 'Russland', URS: 'Sowjetunion', UKR: 'Ukraine',
  BRA: 'Brasilien', ARG: 'Argentinien', URU: 'Uruguay', CHI: 'Chile', COL: 'Kolumbien', PAR: 'Paraguay', PER: 'Peru', MEX: 'Mexiko',
  GHA: 'Ghana', NGA: 'Nigeria', CMR: 'Kamerun', CIV: 'Elfenbeinküste', SEN: 'Senegal', MAR: 'Marokko', TUN: 'Tunesien', ALG: 'Algerien',
  JPN: 'Japan', KOR: 'Südkorea', AUS: 'Australien', IRN: 'Iran', CHN: 'China',
};
export const nationName = (code: string) => NATION_DE[code] ?? code;

/** Disziplin aus den Karten der Karriere (beobachtbar, kein verdeckter Wert). */
export function disciplineText(p: Player): string {
  const c = p.careerStats;
  const apps = c?.appearances ?? 0;
  if (apps < 8) return 'Noch zu wenige Spiele für ein Urteil.';
  const rate = (c.yellowCards + 3 * (c.redCards + c.yellowRedCards)) / apps;
  if (rate < 0.07) return 'Ist praktisch nie unangenehm aufgefallen.';
  if (rate < 0.16) return 'Sieht selten eine Karte.';
  if (rate < 0.3) return 'Holt sich regelmäßig Verwarnungen ab.';
  return 'Fällt häufig durch Karten und Sperren auf.';
}

/** Führungsqualitäten (sichtbares Attribut) in Worten. */
export function leadershipText(v: number): string {
  if (v >= 80) return 'Geborener Anführer';
  if (v >= 68) return 'Übernimmt Verantwortung';
  if (v >= 52) return 'Ordnet sich ein';
  return 'Lässt sich lieber führen';
}

/** Die sechs Positionen mit der besten Eignung. */
export function bestPositions(p: Player): { pos: Position; value: number }[] {
  return rankedPositions(p, positionSuitability).slice(0, 6).map((r) => ({ pos: r.pos, value: r.value }));
}

/**
 * Veränderung je Attribut gegenüber einer Momentaufnahme (`history.attributeSnapshots`):
 * `recent` = seit der vorletzten Aufnahme (Trendpfeil), `since` = seit der ältesten (Fortschritt).
 */
export function attrChanges(p: Player): { recent: Partial<Record<AttrKey, number>>; since: Partial<Record<AttrKey, number>>; sinceLabel: string | null } {
  const snaps = p.history?.attributeSnapshots ?? [];
  const recent: Partial<Record<AttrKey, number>> = {}, since: Partial<Record<AttrKey, number>> = {};
  if (!snaps.length) return { recent, since, sinceLabel: null };
  const ref = snaps.length >= 2 ? snaps[snaps.length - 2] : snaps[0];
  const first = snaps[0];
  for (const k of Object.keys(p.attributes) as AttrKey[]) {
    const cur = Math.round(p.attributes[k]);
    const r = ref.attributes[k], f = first.attributes[k];
    if (typeof r === 'number' && cur !== r) recent[k] = cur - r;
    if (typeof f === 'number' && cur !== f) since[k] = cur - f;
  }
  return { recent, since, sinceLabel: first.label };
}

/**
 * Trainingsschwerpunkt der laufenden Woche (nur eigener Kader): Attribute der Bereiche,
 * die der Wochenplan am stärksten fördert (höchstens zwei Bereiche, mind. 85 % des stärksten).
 */
export function trainingTargets(g: Game | undefined, p: Player): Set<AttrKey> {
  const out = new Set<AttrKey>();
  if (!g || p.clubId !== g.managedClubId || p.isYouth) return out;
  let eff;
  try { eff = currentWeekEffect(g); } catch { return out; }
  const max = Math.max(0, ...(Object.values(eff.groups) as number[]));
  if (max <= 0) return out;
  const top = EFFECT_GROUPS
    .filter((grp) => (eff.groups[grp.key] ?? 0) >= max * 0.85 && (grp.key !== 'torwart' || p.naturalPosition === 'TW'))
    .sort((a, b) => (eff.groups[b.key] ?? 0) - (eff.groups[a.key] ?? 0))
    .slice(0, 2);
  for (const grp of top) for (const a of grp.attrs) if (a !== 'fitness') out.add(a as AttrKey);
  return out;
}
