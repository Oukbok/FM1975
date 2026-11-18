// Regionalliga-Staffeln ab 2008 (Nord/West/Süd) und ab 2012 (Nord/Nordost/West/Südwest/Bayern):
// Reformen, Aufstiegsrunde, Absteiger nach Region und Umbau alter Spielstände (Nord/Nordost/Süd).
// Ohne UI, direkt auf data/reformTransition.ts – aufgerufen aus tests/leagues-test.ts.
import { computeSeasonTransition, CurrentDivision, TransitionResult } from '../src/data/reformTransition';
import { LEAGUE_REFORMS, structureForSeason } from '../src/data/reforms';
import type { LeagueGroup } from '../src/engine/leagues';

type Check = (cond: unknown, msg: string) => void;

// Städte je Region (bekannte Landesverbände aus data/youthCompetitions.ts bzw. data/regionGeo.ts).
const CITIES: Record<string, string[]> = {
  nord: ['Kiel', 'Lübeck', 'Hamburg', 'Bremen', 'Hannover', 'Osnabrück', 'Oldenburg', 'Wolfsburg', 'Göttingen', 'Celle'],
  nordost: ['Rostock', 'Berlin', 'Magdeburg', 'Halle', 'Leipzig', 'Dresden', 'Jena', 'Erfurt', 'Cottbus', 'Zwickau'],
  west: ['Dortmund', 'Essen', 'Köln', 'Aachen', 'Münster', 'Bielefeld', 'Wuppertal', 'Krefeld', 'Bochum', 'Siegen'],
  suedwest: ['Saarbrücken', 'Kaiserslautern', 'Mainz', 'Koblenz', 'Trier', 'Pirmasens', 'Homburg', 'Worms'],
  sued: ['Frankfurt', 'Offenbach', 'Darmstadt', 'Kassel', 'Stuttgart', 'Karlsruhe', 'Mannheim', 'Freiburg', 'Ulm', 'Reutlingen'],
  bayern: ['München', 'Nürnberg', 'Augsburg', 'Fürth', 'Regensburg', 'Würzburg', 'Ingolstadt', 'Bayreuth', 'Hof', 'Passau'],
};
const city: Record<string, string> = {};
const strength: Record<string, number> = {};
let n = 0;
function club(region: string, s = 50): string {
  const id = `c${++n}`;
  const list = CITIES[region];
  city[id] = list[n % list.length];
  strength[id] = s;
  return id;
}
function div(id: string, tier: number, group: LeagueGroup, ids: string[]): CurrentDivision {
  return { id, tier, group, name: id, orderedIds: ids };
}
const top = () => [
  div('tier1', 1, null, Array.from({ length: 18 }, () => club('west', 70))),
  div('tier2', 2, null, Array.from({ length: 20 }, () => club('nord', 62))),
  div('tier3', 3, null, Array.from({ length: 20 }, (_, i) => club(['bayern', 'nordost', 'suedwest', 'west'][i % 4], 55))),
];
const mix = (regions: string[], count: number) => Array.from({ length: count }, (_, i) => club(regions[i % regions.length], 40 + (i % 7)));

function run(newSeason: string, current: CurrentDivision[], applied: string[], protectedId?: string): TransitionResult {
  return computeSeasonTransition({
    newSeason, current, strengthOf: (id) => strength[id] ?? 45, cityOf: (id) => city[id] ?? '',
    appliedReforms: applied, protectedId,
  });
}
const appliedBefore = (season: string) => LEAGUE_REFORMS.filter((r) => r.effectiveSeason < season).map((r) => r.reformId);

/** Alle Staffeln der Soll-Struktur vorhanden, Größen stimmen, keiner doppelt, keiner verloren. */
function sane(check: Check, label: string, season: string, before: CurrentDivision[], res: TransitionResult): void {
  const want = structureForSeason(season);
  for (const t of want) {
    const d = res.divisions.find((x) => x.meta.id === t.id);
    check(!!d, `${label}: ${t.name} fehlt`);
    if (d) check(d.ids.length === t.teamCount, `${label}: ${t.name} hat ${d.ids.length} statt ${t.teamCount}`);
    if (d) check(d.meta.group === t.group, `${label}: ${t.name} Staffel ${d.meta.group}`);
  }
  check(res.divisions.length === want.length, `${label}: ${res.divisions.length} Divisionen statt ${want.length}`);
  const all = res.divisions.flatMap((d) => d.ids);
  check(new Set(all).size === all.length, `${label}: Verein doppelt`);
  const after = new Set([...all, ...res.dropped]);
  for (const id of before.flatMap((d) => d.orderedIds)) check(after.has(id), `${label}: ${id} verloren`);
  for (const id of res.dropped) check(!all.includes(id), `${label}: ${id} abgestiegen und doch in einer Staffel`);
}
const regionOfId = (id: string) => Object.keys(CITIES).find((r) => CITIES[r].includes(city[id]));
function share(res: TransitionResult, divId: string, regions: string[]): number {
  const ids = res.divisions.find((d) => d.meta.id === divId)?.ids.filter((x) => !x.startsWith('ph-')) ?? [];
  return ids.length ? ids.filter((x) => regions.includes(regionOfId(x) ?? '')).length / ids.length : 1;
}

export function regioChecks(check: Check): void {
  // Struktur-Daten
  const s08 = structureForSeason('2010/11').filter((t) => t.tier === 4).map((t) => t.group).join(',');
  check(s08 === 'nord,west,sued', `2008–2012: Regionalliga Nord/West/Süd (ist ${s08})`);
  const s12 = structureForSeason('2015/16').filter((t) => t.tier === 4).map((t) => t.group).join(',');
  check(s12 === 'nord,nordost,west,suedwest,bayern', `ab 2012: fünf Staffeln (ist ${s12})`);
  check(structureForSeason('2015/16').every((t) => t.teamCount % 2 === 0), 'ab 2012: gerade Staffelgrößen');

  // A) Reform 2008/09 aus vier Regionalliga-Staffeln
  const rl = (g: string, regions: string[]) => div(`tier3-${g}`, 3, g as LeagueGroup, mix(regions, 18));
  const cur08 = [top()[0], top()[1], rl('nord', ['nord']), rl('nordost', ['nordost']), rl('west', ['west', 'suedwest']), rl('sued', ['sued', 'bayern'])];
  const r08 = run('2008/09', cur08, appliedBefore('2008/09'));
  check(r08.reform?.reformId === 'reform-2008-third-league', '2008: Reform angewandt');
  sane(check, '2008', '2008/09', cur08, r08);
  check(share(r08, 'tier4-nord', ['nord', 'nordost']) === 1, '2008: Nord = Norden + Nordosten');
  check(share(r08, 'tier4-west', ['west', 'suedwest']) === 1, '2008: West = NRW + Rheinland-Pfalz/Saar');
  check(share(r08, 'tier4-sued', ['sued', 'bayern']) === 1, '2008: Süd = Hessen/BW + Bayern');

  // B) Normaler Wechsel 2009/10 (drei Meister steigen auf, drei Absteiger nach Region)
  const cur09 = [...top(), div('tier4-nord', 4, 'nord', mix(['nord', 'nordost'], 18)), div('tier4-west', 4, 'west', mix(['west', 'suedwest'], 18)), div('tier4-sued', 4, 'sued', mix(['sued', 'bayern'], 18))];
  const r09 = run('2009/10', cur09, appliedBefore('2009/10'));
  sane(check, '2009', '2009/10', cur09, r09);
  const up09 = r09.divisions.find((d) => d.meta.id === 'tier3')!.ids.filter((id) => cur09.slice(3).some((d) => d.orderedIds[0] === id));
  check(up09.length === 3, `2009: drei Meister steigen auf (${up09.length})`);
  const rel09 = cur09[2].orderedIds.slice(-3);
  for (const id of rel09) {
    const d = r09.divisions.find((x) => x.ids.includes(id))!;
    const reg = regionOfId(id)!;
    const ok = { nord: 'nord', nordost: 'nord', west: 'west', suedwest: 'west', sued: 'sued', bayern: 'sued' }[reg];
    check(d.meta.group === ok, `2009: Absteiger aus ${city[id]} in ${d.meta.id}`);
  }

  // C) Alter Spielstand 2010/11 mit Nord/Nordost/Süd → Nord/West/Süd
  const legacy = [...top(), div('tier4-nord', 4, 'nord', mix(['nord', 'west'], 18)), div('tier4-nordost', 4, 'nordost', mix(['nordost'], 18)), div('tier4-sued', 4, 'sued', mix(['sued', 'bayern', 'suedwest'], 18))];
  const own = legacy[4].orderedIds[17];
  const rLeg = run('2010/11', legacy, appliedBefore('2010/11'), own);
  sane(check, 'Altstand 2010', '2010/11', legacy, rLeg);
  check(rLeg.divisions.some((d) => d.meta.tier === 4 && d.ids.includes(own)), 'Altstand 2010: eigener Verein (Nordost, Letzter) bleibt in der Regionalliga');
  check(share(rLeg, 'tier4-nord', ['nord', 'nordost']) === 1, 'Altstand 2010: Nord nur aus Norden + Nordosten');
  check(!rLeg.divisions.some((d) => d.meta.id === 'tier4-nordost'), 'Altstand 2010: Staffel Nordost aufgelöst');

  // D) Reform 2012/13 aus Nord/West/Süd
  const cur11 = [...top(), div('tier4-nord', 4, 'nord', mix(['nord', 'nordost'], 18)), div('tier4-west', 4, 'west', mix(['west', 'suedwest'], 18)), div('tier4-sued', 4, 'sued', mix(['sued', 'bayern'], 18))];
  const r12 = run('2012/13', cur11, appliedBefore('2012/13'));
  check(r12.reform?.reformId === 'reform-2012-regionalliga', '2012: Reform angewandt');
  sane(check, '2012', '2012/13', cur11, r12);
  check(share(r12, 'tier4-nordost', ['nordost']) === 1 && share(r12, 'tier4-bayern', ['bayern']) === 1, '2012: Nordost/Bayern sauber getrennt');
  check(share(r12, 'tier4-suedwest', ['sued', 'suedwest']) === 1, '2012: Südwest = Rheinland-Pfalz/Saar + Hessen/BW');
  check(r12.divisions.find((d) => d.meta.id === 'tier3')!.ids.length === 20, '2012: 3. Liga 20');

  // E) Normaler Wechsel 2013/14: Aufstiegsrunde (fünf Meister + Vize Südwest → drei Aufsteiger)
  const five = (): CurrentDivision[] => [
    div('tier4-nord', 4, 'nord', mix(['nord'], 18)), div('tier4-nordost', 4, 'nordost', mix(['nordost'], 16)),
    div('tier4-west', 4, 'west', mix(['west'], 20)), div('tier4-suedwest', 4, 'suedwest', mix(['suedwest', 'sued'], 18)),
    div('tier4-bayern', 4, 'bayern', mix(['bayern'], 20))];
  const cur13 = [...top(), ...five()];
  const r13 = run('2013/14', cur13, appliedBefore('2013/14'));
  sane(check, '2013', '2013/14', cur13, r13);
  const cands = new Set([...cur13.slice(3).map((d) => d.orderedIds[0]), cur13[6].orderedIds[1]]);
  const t3 = r13.divisions.find((d) => d.meta.id === 'tier3')!.ids;
  const ups = t3.filter((id) => cands.has(id));
  check(ups.length === 3, `2013: drei Aufsteiger aus der Aufstiegsrunde (${ups.length})`);
  check(t3.filter((id) => !cur13[2].orderedIds.includes(id) && !cur13[1].orderedIds.includes(id)).length === 3, '2013: genau drei Aufsteiger aus der Regionalliga');
  for (const id of cur13[2].orderedIds.slice(-3)) {
    const d = r13.divisions.find((x) => x.ids.includes(id));
    const reg = regionOfId(id)!;
    check(d?.meta.group === (reg === 'sued' ? 'suedwest' : reg), `2013: Absteiger aus ${city[id]} in ${d?.meta.id}`);
  }

  // F) Alter Spielstand nach 2012 ohne die Reform (Nord/Nordost/Süd) → fünf Staffeln beim nächsten Wechsel
  const legacy14 = [...top(), div('tier4-nord', 4, 'nord', mix(['nord', 'west'], 18)), div('tier4-nordost', 4, 'nordost', mix(['nordost'], 18)), div('tier4-sued', 4, 'sued', mix(['sued', 'bayern', 'suedwest'], 18))];
  const r14 = run('2014/15', legacy14, LEAGUE_REFORMS.filter((r) => r.effectiveSeason < '2012/13').map((r) => r.reformId));
  sane(check, 'Altstand 2014', '2014/15', legacy14, r14);
  check(share(r14, 'tier4-bayern', ['bayern']) === 1, 'Altstand 2014: Bayern nur Bayern');
}
