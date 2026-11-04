// =============================================================================
// Sim-Bericht der Ausnahmetalente (LEGENDS=1 node scripts/sim.mjs 50):
// wie viele erreichen ≥ 85 / ≥ 90, mit welchem Alter, in welchem Jahr, bei welchen Vereinen.
// LEG=0 schaltet die Legenden im Lauf ab (Vergleich der Balance).
// =============================================================================
import type { Game } from '../src/game/state';
import { LEGENDS } from '../src/data/legends';

interface Track { peak: number; peakAge: number; peakYear: number; first85?: number; first90?: number; age85?: number; clubs: string[]; last?: string; lost?: number; youthClub?: string }
const T = new Map<string, Track>();

export function legTrack(g: Game): void {
  const done = g.legends2?.done ?? {};
  const year = Number(g.season.slice(0, 4)) + 1;
  for (const def of LEGENDS) {
    const pid = done[def.id];
    if (!pid || pid === '-') continue;
    const t = T.get(def.id) ?? { peak: 0, peakAge: 0, peakYear: 0, clubs: [] };
    T.set(def.id, t);
    const p = g.players[pid] ?? g.youthPlayers[pid];
    if (!p) { if (t.lost == null) t.lost = year; continue; }
    const club = g.clubs[p.clubId]?.shortName ?? p.clubId;
    if (p.isYouth && !t.youthClub) t.youthClub = club;
    if (!p.isYouth && t.clubs[t.clubs.length - 1] !== club) t.clubs.push(club);
    if (p.overall > t.peak) { t.peak = p.overall; t.peakAge = p.age; t.peakYear = year; }
    if (p.overall >= 85 && t.first85 == null) { t.first85 = year; t.age85 = p.age; }
    if (p.overall >= 90 && t.first90 == null) t.first90 = year;
  }
}

export function legSummary(g: Game): void {
  const list = LEGENDS.map((d) => ({ d, t: T.get(d.id) })).filter((x) => x.t);
  const n = list.length, n85 = list.filter((x) => x.t!.peak >= 85).length, n90 = list.filter((x) => x.t!.peak >= 90).length;
  const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '-');
  console.log(`LEGENDEN erschienen ${n}/${LEGENDS.length} | Höchstwert ≥85: ${n85} (${Math.round(n85 / Math.max(1, n) * 100)} %), ≥90: ${n90} | Ø erstes ≥85 mit ${avg(list.filter((x) => x.t!.age85).map((x) => x.t!.age85!))} J. | Ø Höchstwert ${avg(list.map((x) => x.t!.peak))} (Ø Potenzial ${avg(list.map((x) => x.d.potential))}) | verloren (Ausland/Karriereende vor Höhepunkt) ${list.filter((x) => x.t!.lost && x.t!.peak < 85).length}`);
  for (const { d, t } of list.sort((a, b) => b.t!.peak - a.t!.peak)) {
    console.log(`  ${(d.firstName + ' ' + d.lastName).padEnd(28)} ${d.country} ${d.birth.slice(0, 4)} Pot ${d.potential} → max ${t!.peak} mit ${t!.peakAge} (${t!.peakYear})${t!.first85 ? ` | ≥85 ab ${t!.first85}` : ''}${t!.first90 ? ` ≥90 ab ${t!.first90}` : ''} | ${t!.youthClub ? `Jugend ${t!.youthClub} → ` : ''}${t!.clubs.join(' → ')}${t!.lost ? ` | weg ${t!.lost}` : ''}`);
  }
  const wait = LEGENDS.filter((d) => !g.legends2?.done[d.id]).map((d) => d.lastName);
  if (wait.length) console.log(`  noch nicht erschienen: ${wait.join(', ')}`);
}
