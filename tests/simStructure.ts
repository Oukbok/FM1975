// Prüfung der Ligapyramide gegen die Soll-Struktur (data/reforms.ts) – genutzt von tests/sim.ts
// (nach jedem Saisonwechsel) und tests/leagues-test.ts. Nur Heimatland Deutschland.
import type { Game } from '../src/game/state';
import { structureForSeason } from '../src/data/reforms';
import { homeCountryOf } from '../src/game/state';
import { groupForRegion, knownRegion } from '../src/data/regionGeo';

/** Fehlerliste: fehlende/überzählige Staffeln, falsche Größen, doppelte/unbekannte Vereine. */
export function structureProblems(g: Game): string[] {
  if (homeCountryOf(g) !== 'ger') return [];
  const out: string[] = [];
  const divs = [g.leagues.playerDivision, ...g.leagues.otherDivisions].filter((d) => d.tier < 100);
  const idsOf = (d: typeof divs[number]) => d.id === g.leagues.playerDivision.id ? g.table.rows.map((r) => r.clubId) : (d as { clubIds: string[] }).clubIds;
  const want = structureForSeason(g.season);
  for (const t of want) {
    const d = divs.find((x) => x.id === t.id);
    if (!d) { out.push(`${t.name} (${t.id}) fehlt`); continue; }
    if (d.group !== t.group || d.tier !== t.tier) out.push(`${t.id}: Ebene/Staffel ${d.tier}/${d.group} statt ${t.tier}/${t.group}`);
    const n = idsOf(d).length;
    if (n !== t.teamCount) out.push(`${t.name}: ${n} statt ${t.teamCount} Vereine`);
  }
  for (const d of divs) if (!want.some((t) => t.id === d.id)) out.push(`Staffel ${d.name} (${d.id}) gehört nicht zur Struktur ${g.season}`);
  const seen = new Map<string, string>();
  for (const d of divs) {
    for (const id of idsOf(d)) {
      if (seen.has(id)) out.push(`${id} doppelt (${seen.get(id)} und ${d.id})`);
      seen.set(id, d.id);
      if (!g.clubs[id] && !g.simClubs[id]) out.push(`${id} in ${d.id} unbekannt`);
      const s = g.simClubs[id];
      if (s && (s.tier !== d.tier || s.group !== d.group)) out.push(`${id}: Ebene/Staffel ${s.tier}/${s.group} statt ${d.tier}/${d.group}`);
    }
  }
  return out;
}

/** Kurzbericht der Staffeln ab Ebene 3 (Name: Vereine, davon Platzhalter). */
export function structureLine(g: Game): string {
  const divs = [g.leagues.playerDivision, ...g.leagues.otherDivisions].filter((d) => d.tier >= 3 && d.tier < 100);
  return divs.map((d) => {
    const ids = d.id === g.leagues.playerDivision.id ? g.table.rows.map((r) => r.clubId) : (d as { clubIds: string[] }).clubIds;
    const groups = divs.filter((x) => x.tier === d.tier).map((x) => x.group);
    const cityOf = (id: string) => g.clubs[id]?.city ?? g.simClubs[id]?.city ?? '';
    const known = ids.map((id) => knownRegion(cityOf(id))).filter((r) => r != null);
    const off = known.filter((r) => groups.length > 1 && groupForRegion(r!, groups) !== d.group).length;
    return `${d.name} ${ids.length}${ids.some((x) => x.startsWith('ph-')) ? ` (${ids.filter((x) => x.startsWith('ph-')).length} Platzh.)` : ''}${groups.length > 1 ? ` [Ort bekannt ${known.length}, fremd ${off}]` : ''}`;
  }).join(' | ');
}
