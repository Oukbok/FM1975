// =============================================================================
// Sim-Bericht „Entwicklung der Ligen“ (LEAGUEREP=frei|historisch node scripts/sim.mjs 50)
// Nach jedem Saisonwechsel: Ligaruf je Land gegen die historische Zielkurve
// (data/leagueReputation.ts) und die Fünfjahreswertung mit echtem Europapokal.
// Am Ende Top 5 je Jahrzehnt und mittlere Abweichung der acht stärksten Ligen.
// =============================================================================
import type { Game } from '../src/game/state';
import { coefSum } from '../src/engine/world';
import { repTargetAt } from '../src/data/leagueReputation';
import { startLeagueRep, type LeagueRepMode } from '../src/game/leagueRepGame';
import { seasonStartYear } from '../src/data/timeline';

export function leagueRepModeFromEnv(v: string | undefined): LeagueRepMode | null {
  if (!v) return null;
  const k = v.toLowerCase();
  return k.startsWith('f') ? 'free' : 'historic';
}

/** Direkt nach createNewGame: Option setzen und Ligaruf anlegen. */
export function leagueRepInit(g: Game, mode: LeagueRepMode | null): void {
  if (!mode) return;
  g.leagueRepMode = mode;
  startLeagueRep(g, seasonStartYear(g.season));
}

interface Row { y: number; rep: [string, number][]; hist: [string, number][]; coef: [string, number][]; dev: number }
const rows: Row[] = [];

/** Nach startNextSeason aufrufen. */
export function leagueRepTrack(g: Game): void {
  const w = g.world;
  if (!w || !g.leagueRepMode) return;
  const y = seasonStartYear(g.season);
  const act = Object.values(w.countries).filter((c) => c.active && c.rep != null);
  const rep = act.map((c) => [c.name, c.rep!] as [string, number]).sort((a, b) => b[1] - a[1]);
  const hist = act.map((c) => [c.name, repTargetAt(c.name, y)] as [string, number]).sort((a, b) => b[1] - a[1]);
  const coef = [...act.map((c) => [c.name, coefSum(c.coef)] as [string, number]), ['Heimat*', coefSum(w.germanCoef)] as [string, number]].sort((a, b) => b[1] - a[1]);
  const top8 = hist.slice(0, 8);
  const dev = top8.reduce((a, [k, v]) => a + Math.abs((w.countries[k].rep ?? v) - v), 0) / Math.max(1, top8.length);
  rows.push({ y, rep, hist, coef, dev });
  console.log(`LIGARUF ${y}: ${rep.slice(0, 6).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(' · ')} | Ø Abw. Top 8 ${dev.toFixed(1)}`);
}

export function leagueRepSummary(mode: LeagueRepMode): void {
  if (!rows.length) return;
  console.log(`\n=== LIGARUF ${mode === 'free' ? 'FREI' : 'HISTORISCH'} – Top 5 je Jahrzehnt ===`);
  const f = (xs: [string, number][], d = 0) => xs.slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(d)}`).join(' · ');
  for (const r of rows.filter((x) => x.y % 10 === 5)) {
    console.log(`${r.y}  Ruf:  ${f(r.rep)}`);
    console.log(`      Soll: ${f(r.hist)}`);
    console.log(`      5J:   ${f(r.coef, 1)}`);
  }
  console.log(`Ø Abweichung Top 8 über alle Saisons: ${(rows.reduce((a, r) => a + r.dev, 0) / rows.length).toFixed(1)} Ruf-Punkte`);
}
