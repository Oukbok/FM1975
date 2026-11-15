// Sim-Bericht Goldener Ball über die Epochen: `AWARDS=1 node scripts/sim.mjs 40`
// Je Jahr: Sieger + Top 10 (Heimatland vs. Ausland, Land, Rang des Landes in der
// Fünfjahreswertung, Vereinsrang im Land, Nationalität, Stärke). Am Ende je Jahrzehnt:
// Anteile Heimat/Ausland bei Siegern und Top 10, Länderverteilung, Nicht-Europäer ab 1995,
// Top-10-Plätze aus Ligen außerhalb der besten 8, Stärke der Sieger.
import { EUROPEAN_NATS } from '../src/engine/goldenBall';
import { countryRanking, coefSum, germanRank } from '../src/engine/world';
import { goldenBallOf } from '../src/game/goldenBallGame';
import { goldenShoeOf, coachAwardOf } from '../src/game/extraAwardsGame';
import type { Game } from '../src/game/state';

interface Row { y: number; home: boolean; country: string; crank: number; clubRank: number; nat: string; ovr: number; place: number; est: boolean }
const rows: Row[] = [];
const shoes: { y: number; home: boolean; crank: number; goals: number; pts: number }[] = [];
const coaches: string[] = [];

/** Rang der Länder (1 = bestes) inkl. Heimatland nach Koeffizient. */
function countryRanks(g: Game, year: number): Map<string, number> {
  const w = g.world;
  const m = new Map<string, number>();
  if (!w) return m;
  const list = countryRanking(w, year).map((c) => ({ k: c.name, v: coefSum(c.coef) }));
  const hr = germanRank(w, year);
  list.sort((a, b) => b.v - a.v);
  list.forEach((x, i) => m.set(x.k, i + 1 + (i + 1 >= hr ? 1 : 0)));
  m.set('__home', hr);
  return m;
}

export function gbTrack(g: Game, year: number): void {
  const gb = goldenBallOf(g, year);
  const ranks = countryRanks(g, year);
  if (gb) {
    gb.top.forEach((e, i) => {
      const home = !!g.clubs[e.c] || !!g.simClubs?.[e.c];
      const ec = g.euroClubs?.[e.c];
      const country = home ? 'Heimat' : ec?.country ?? '?';
      const crank = home ? ranks.get('__home') ?? 0 : ranks.get(country) ?? 99;
      let clubRank = 0;
      if (!home && ec) {
        const t = g.world?.countries[country]?.tiers[0] ?? [];
        clubRank = 1 + t.filter((id) => (g.euroClubs?.[id]?.strength ?? 0) > ec.strength).length;
      } else clubRank = 1 + Object.values(g.clubs).filter((c) => c.reputation > (g.clubs[e.c]?.reputation ?? 0) && g.table.rows.some((r) => r.clubId === c.id)).length;
      rows.push({ y: year, home, country, crank, clubRank, nat: e.nat, ovr: e.ov, place: i + 1, est: !!e.est });
    });
    const w = gb.top[0];
    const r = rows.filter((x) => x.y === year);
    console.log(`   GB ${year}: ${w.n} (${w.cn}, ${r[0].country} R${r[0].crank}, Verein ${r[0].clubRank}., ${w.nat}, ${w.ov}, ${w.pts}) | Top10 Heimat ${r.filter((x) => x.home).length} | Länder ${[...new Set(r.map((x) => x.country))].join('/')}`);
  }
}

/** Nach startNextSeason: Goldener Schuh + Trainer des Jahres der abgelaufenen Saison. */
export function seasonAwardsTrack(g: Game, season: string): void {
  const year = Number(season.slice(0, 4)) + 1;
  const ranks = countryRanks(g, year);
  const sh = goldenShoeOf(g, season);
  if (sh?.top[0]) {
    const t = sh.top[0];
    const home = !!t.h;
    shoes.push({ y: year, home, crank: home ? ranks.get('__home') ?? 0 : ranks.get(t.k) ?? 99, goals: t.gl, pts: t.pts });
    console.log(`   SCHUH ${season}: ${t.n} (${t.cn}, ${home ? 'Heimat' : t.k}) ${t.gl} Tore × ${t.f} = ${t.pts}`);
  }

  const c = coachAwardOf(g, season);
  if (c?.top[0]) { coaches.push(c.top[0].c); console.log(`   TRAINER ${season}: ${c.top.map((t) => `${t.n} (${t.cn}, Platz ${t.rk}/Erw. ${t.ex}, ${t.pts})`).join(' | ')}`); }
}

const pct = (a: number, b: number) => `${b ? Math.round((a / b) * 100) : 0} %`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function gbSummary(): void {
  if (!rows.length) return;
  console.log('\nGOLDENER BALL je Jahrzehnt');
  const decs = [...new Set(rows.map((r) => Math.floor(r.y / 10) * 10))].sort();
  for (const d of decs) {
    const r = rows.filter((x) => Math.floor(x.y / 10) * 10 === d);
    const win = r.filter((x) => x.place === 1);
    const cnt = new Map<string, number>();
    for (const x of r) cnt.set(x.country, (cnt.get(x.country) ?? 0) + 1);
    const lands = [...cnt.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
    const nonEu = r.filter((x) => !EUROPEAN_NATS.has(x.nat.toUpperCase()));
    console.log(`${d}er (${win.length} J.): Sieger Heimat ${pct(win.filter((x) => x.home).length, win.length)} | Top10 Heimat ${pct(r.filter((x) => x.home).length, r.length)}`
      + ` | Sieger aus Top-4-Land ${pct(win.filter((x) => x.crank <= 4).length, win.length)}, Vereinsrang ≤ 3 ${pct(win.filter((x) => x.clubRank <= 3).length, win.length)}`
      + ` | Top10 aus Land > Rang 8: ${pct(r.filter((x) => x.crank > 8).length, r.length)}`
      + ` | Stärke Sieger Ø ${avg(win.map((x) => x.ovr)).toFixed(1)}, Top10 Ø ${avg(r.map((x) => x.ovr)).toFixed(1)}`
      + ` | Nicht-Europäer Top10 ${nonEu.length} (${[...new Set(nonEu.map((x) => x.nat))].join('/')})`);
    console.log(`      Länder Top10: ${lands}`);
  }
  if (shoes.length) {
    console.log(`SCHUH: Heimat ${pct(shoes.filter((s) => s.home).length, shoes.length)}, aus Top-4-Land ${pct(shoes.filter((s) => s.crank <= 4).length, shoes.length)}, Tore Ø ${avg(shoes.map((s) => s.goals)).toFixed(1)}`);
  }
  if (coaches.length) console.log(`TRAINER: ${coaches.length} Saisons, ${new Set(coaches).size} verschiedene Vereine`);
}
