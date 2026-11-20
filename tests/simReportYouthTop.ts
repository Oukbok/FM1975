// Sim-Berichte YOUTH=1 (Akademie-Bilanz) und TOP=1 (Breite der Spitze) für tests/sim.ts.
import { Game } from '../src/game/state';
import { Player } from '../src/types';
import { leagueClubs } from '../src/game/season';
import { originOfPlayer, trackCareers } from './simCareers';
import { poolRows } from '../src/game/playerPool';
import { worldClubs } from '../src/game/worldPool';

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// -----------------------------------------------------------------------------
// YOUTH=1: Akademie-Bilanz. Akademiespieler = ID mit „_y_“,
// Herkunftsverein = ID-Präfix. Investition je Verein = Ausbildungsqualität aus
// game/youthInvest (falls vorhanden), sonst alte Akademie-Stufe × 20.
// -----------------------------------------------------------------------------
const yt = { peak: new Map<string, number>(), first80: new Map<string, number>(), first85: new Map<string, number>(), inv: new Map<string, number[]>(), shares: [] as number[] };
const isAcad = (p: Player) => p.id.includes('_y_');
const originOf = (id: string) => id.split('_y_')[0];
function investScore(c: any): number {
  const yi = c.youthInvest;
  if (yi && typeof yi.quality === 'number') return yi.quality;
  return (c.infrastructure?.youthAcademy ?? 1) * 20;
}
export function youthReport(game: Game, ps: Player[]) {
  const y0 = Number(game.season.slice(0, 4));
  const acad = ps.filter(isAcad);
  const share = acad.length / Math.max(1, ps.length);
  yt.shares.push(share);
  for (const p of Object.values(game.players)) {
    if (!isAcad(p)) continue;
    const prev = yt.peak.get(p.id) ?? 0;
    yt.peak.set(p.id, Math.max(prev, p.overall));
    if (p.overall >= 80 && !yt.first80.has(p.id)) yt.first80.set(p.id, y0);
    if (p.overall >= 85 && !yt.first85.has(p.id)) yt.first85.set(p.id, y0);
  }
  for (const c of leagueClubs(game)) {
    const a = yt.inv.get(c.id) ?? []; a.push(investScore(c)); yt.inv.set(c.id, a);
  }
  const best = acad.reduce((b, p) => (p.overall > (b?.overall ?? 0) ? p : b), null as Player | null);
  const u23 = acad.filter((p) => p.age <= 23);
  const invs = leagueClubs(game).map((c) => (c as any).youthInvest).filter(Boolean);
  if (invs.length) {
    const q = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return `${Math.round(s[0])}/${Math.round(s[s.length >> 1])}/${Math.round(s[s.length - 1])}`; };
    const cost = invs.map((v: any) => v.history?.[v.history.length - 1]?.spend ?? 0);
    const race = game.youthRace;
    console.log(`   YOUTH Invest Qualität ${q(invs.map((v: any) => v.quality))} Ruf ${q(invs.map((v: any) => v.reputation))} Perspektive ${q(invs.map((v: any) => v.perspective))} Kosten(Basis,k) ${q(cost.map((x: number) => x / 1000))}${race ? ` | Talentwettbewerb ${race.entries.filter((e) => e.to).length}/${race.entries.length} an Ligavereine` : ''}`);
  }
  const camps = (game as any).youthCamps?.ai as [number, number][] | undefined;
  const campNow = camps?.find((x) => x[0] === Number(game.calendar.currentDate.slice(0, 4)) || x[0] === Number(game.season.slice(0, 4)));
  if (campNow) console.log(`   YOUTH KI-Jugendcamps/Abos: ${campNow[1]} zusätzliche Auslandstalente (${campNow[0]})`);
  console.log(`   YOUTH Akademie in Liga 1:${acad.length}/${ps.length} (${(share * 100).toFixed(1)} %) | bester ${best ? `${best.overall} (${best.age} J., ${game.clubs[best.clubId]?.shortName ?? '?'})` : '-'} | ≥80 ${acad.filter((p) => p.overall >= 80).length} ≥85 ${acad.filter((p) => p.overall >= 85).length} | U23 ${u23.length} Ø ${avg(u23.map((p) => p.overall)).toFixed(1)}`);
}
export function youthSummary(game: Game) {
  console.log(`YOUTH Anteil Akademiespieler Liga 1: Ø ${(avg(yt.shares) * 100).toFixed(1)} % (erste 10 J. ${(avg(yt.shares.slice(0, 10)) * 100).toFixed(1)} %, letzte 10 J. ${(avg(yt.shares.slice(-10)) * 100).toFixed(1)} %) | bester Akademiespieler je erreicht ${Math.max(0, ...yt.peak.values())}`);
  for (const [a, b] of [[1975, 1985], [1985, 1995], [1995, 2005], [2005, 2015], [2015, 2030]]) {
    const n80 = [...yt.first80.values()].filter((y) => y >= a && y < b).length;
    const n85 = [...yt.first85.values()].filter((y) => y >= a && y < b).length;
    console.log(`YOUTH ${a}–${b - 1}: neue Akademie-Spieler ≥80 ${n80}, ≥85 ${n85}`);
  }
  // Investitionsvergleich: Vereine mit ≥ 10 Saisons in Liga 1 nach Ø Investition gedrittelt.
  const rows = [...yt.inv.entries()].filter(([, v]) => v.length >= 10).map(([id, v]) => ({ id, inv: avg(v) })).sort((a, b) => b.inv - a.inv);
  const third = Math.max(1, Math.floor(rows.length / 3));
  const stat = (grp: typeof rows) => {
    const ids = new Set(grp.map((r) => r.id));
    const prods = [...yt.peak.entries()].filter(([id]) => ids.has(originOf(id)));
    const n = Math.max(1, grp.length);
    return `${grp.length} Vereine, Ø Inv. ${avg(grp.map((r) => r.inv)).toFixed(0)} | je Verein: Profis aus eigener Akademie ${(prods.length / n).toFixed(1)}, ≥75 ${(prods.filter(([, v]) => v >= 75).length / n).toFixed(1)}, ≥80 ${(prods.filter(([, v]) => v >= 80).length / n).toFixed(2)}, ≥85 ${(prods.filter(([, v]) => v >= 85).length / n).toFixed(2)}`;
  };
  const top = [...yt.peak.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, v]) => `${v} ${game.players[id]?.fullName ?? id} (${originOf(id)}${id.includes('_y_race_') ? ', Talentwettbewerb' : ''}, Inv. ${avg(yt.inv.get(originOf(id)) ?? [0]).toFixed(0)})`);
  console.log(`YOUTH beste Akademiespieler: ${top.join(' | ')}`);
  console.log(`YOUTH viel Investition:  ${stat(rows.slice(0, third))}`);
  console.log(`YOUTH wenig Investition: ${stat(rows.slice(-third))}`);
  void game;
}
// TOP=1: Breite der Spitze (Liga 1): Spieler ≥85/≥80 nach Herkunft, Top-10,
// Abstand Spitze/Keller, Meister. Zusammenfassung je Jahrzehnt am Ende.
// -----------------------------------------------------------------------------
const topStat = { startIds: null as Set<string> | null, rows: [] as { y: number; n90: number; n85: number; n80: number; u80: number; u85: number; avg: number; top10: number; gap: number; champ: string }[], champs: new Map<string, number>(), peak: new Map<string, number>() };
export function topReport(game: Game, ps: Player[]) {
  if (!topStat.startIds) topStat.startIds = new Set(Object.keys(game.players));
  const y0 = Number(game.season.slice(0, 4));
  const isL1 = (game.leagues?.playerDivision?.tier ?? 1) === 1;
  trackCareers(game, topStat.startIds, isL1 ? new Set(leagueClubs(game).map((c) => c.id)) : null);
  if (!isL1) { console.log('   TOP (nicht Liga 1)'); return; }
  const origin = (p: Player) => originOfPlayer(p, topStat.startIds!);
  const ovr = ps.map((p) => p.overall).sort((a, b) => b - a);
  const by = (min: number) => { const o: Record<string, number> = {}; for (const p of ps) if (p.overall >= min) o[origin(p)] = (o[origin(p)] ?? 0) + 1; return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '); };
  const lc = leagueClubs(game);
  const t11 = lc.map((c) => { const o = c.playerIds.map((id) => game.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 11); return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); }).sort((a, b) => b - a);
  const gap = avg(t11.slice(0, 3)) - avg(t11.slice(-3));
  const clubT11 = lc.map((c) => ({ c, v: (() => { const o = c.playerIds.map((id) => game.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 11); return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); })() })).sort((a, b) => b.v - a.v);
  const top3 = new Set(clubT11.slice(0, 3).map((x) => x.c.id));
  const starsTop3 = ps.filter((p) => p.overall >= 85 && top3.has(p.clubId)).length;
  const played = game.fixtures.filter((m) => m.result).length;
  const champ = played > 100 ? game.table.rows?.[0]?.clubId ?? '' : '';
  if (champ) topStat.champs.set(champ, (topStat.champs.get(champ) ?? 0) + 1);
  for (const p of ps) if (p.overall >= 85) topStat.peak.set(origin(p), Math.max(topStat.peak.get(origin(p)) ?? 0, p.overall));
  const u21 = ps.filter((p) => p.age <= 21);
  const row = { y: y0, n90: ovr.filter((o) => o >= 90).length, n85: ovr.filter((o) => o >= 85).length, n80: ovr.filter((o) => o >= 80).length, u80: u21.filter((p) => p.overall >= 80).length, u85: u21.filter((p) => p.overall >= 85).length, avg: avg(ovr), top10: avg(ovr.slice(0, 10)), gap, champ };
  const lbh = game.leagueBalance?.history?.[game.leagueBalance.history.length - 1] as { elite?: number } | undefined;
  topStat.rows.push(row);
  const pot = ps.filter((p) => p.age <= 23).map((p) => p.development.basePotential ?? p.overall);
  // Welt (volle Spieler + Weltspieler, Maßstab EA-FC-Top-10): Spitze, Breite, Jugend
  {
    const all = poolRows(game).rows.filter((r) => r.kind !== 'youth').map((r) => ({ ov: r.ov, age: r.age })).sort((a, b) => b.ov - a.ov);
    const cnt = (t: number) => all.filter((x) => x.ov >= t).length;
    const best = (a: number) => all.filter((x) => x.age <= a).slice(0, 3).map((x) => x.ov).join('/');
    const wc = [...worldClubs(game).values()].map((c) => c.strength).sort((a, b) => b - a);
    const w = { y: y0, top: all.slice(0, 10).map((x) => x.ov), n90: cnt(90), n85: cnt(85), u19: all.filter((x) => x.age <= 19)[0]?.ov ?? 0, u21: all.filter((x) => x.age <= 21)[0]?.ov ?? 0, club: wc[0] ?? 0 };
    worldRows.push(w);
    console.log(`   WELT Top10 ${w.top.join(' ')} | ≥90 ${w.n90} ≥88 ${cnt(88)} ≥85 ${w.n85} ≥80 ${cnt(80)} | beste ≤19 ${best(19)} ≤21 ${best(21)} | Vereinsstärke max ${wc.slice(0, 3).join('/')}`);
  }
  console.log(`   TOP ≥90 ${row.n90} ≥85 ${row.n85} [${by(85)}] | ≥80 ${row.n80} [${by(80)}] | max ${ovr[0]} | Top11 Spitze-Keller ${gap.toFixed(1)} (oben ${avg(t11.slice(0, 3)).toFixed(1)} unten ${avg(t11.slice(-3)).toFixed(1)}, ≥85 bei Top-3 ${starsTop3}) | U21 ≥80 ${row.u80} ≥85 ${row.u85} [${u21.filter((p) => p.overall >= 80).map((p) => `${p.age}J ${p.overall}`).join(', ')}] | U23 Basis-Pot ≥85: ${pot.filter((x) => x >= 85).length} | Bremse ${lbh?.elite ?? '-'}`);
}
const worldRows: { y: number; top: number[]; n90: number; n85: number; u19: number; u21: number; club: number }[] = [];
export function topSummary(g: Game) {
  for (const [a, b] of [[1975, 1985], [1985, 1995], [1995, 2005], [2005, 2015], [2015, 2030], [2030, 2100]]) {
    const r = worldRows.filter((x) => x.y >= a && x.y < b);
    if (!r.length) continue;
    console.log(`WELT ${a}–${b - 1}: Nr.1 ${avg(r.map((x) => x.top[0])).toFixed(1)} Nr.10 ${avg(r.map((x) => x.top[9] ?? 0)).toFixed(1)} ≥90 ${avg(r.map((x) => x.n90)).toFixed(1)} ≥85 ${avg(r.map((x) => x.n85)).toFixed(1)} | bester ≤19 ${avg(r.map((x) => x.u19)).toFixed(1)} (max ${Math.max(...r.map((x) => x.u19))}) ≤21 ${avg(r.map((x) => x.u21)).toFixed(1)} | Verein max ${avg(r.map((x) => x.club)).toFixed(1)}`);
  }
  const name = (id: string) => g.clubs[id]?.shortName ?? g.simClubs?.[id]?.shortName ?? id;
  for (const [a, b] of [[1975, 1985], [1985, 1995], [1995, 2005], [2005, 2015], [2015, 2030]]) {
    const r = topStat.rows.filter((x) => x.y >= a && x.y < b);
    if (!r.length) continue;
    const ch = new Set(r.map((x) => x.champ).filter(Boolean));
    console.log(`TOP ${a}–${b - 1}: ≥90 ${avg(r.map((x) => x.n90)).toFixed(1)} ≥85 ${avg(r.map((x) => x.n85)).toFixed(1)} (min ${Math.min(...r.map((x) => x.n85))} max ${Math.max(...r.map((x) => x.n85))}) U21≥80 ${avg(r.map((x) => x.u80)).toFixed(1)} U21≥85 ${avg(r.map((x) => x.u85)).toFixed(1)} ≥80 ${avg(r.map((x) => x.n80)).toFixed(1)} Ø ${avg(r.map((x) => x.avg)).toFixed(1)} Top10 ${avg(r.map((x) => x.top10)).toFixed(1)} Spitze-Keller ${avg(r.map((x) => x.gap)).toFixed(1)} | Meister ${ch.size} verschiedene`);
  }
  const t = [...topStat.champs.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`TOP Meister: ${t.length} verschiedene: ${t.map(([id, n]) => name(id) + ' ' + n).join(', ')} | Höchstwert je Herkunft: ${[...topStat.peak.entries()].map(([k, v]) => k + ' ' + v).join(', ')}`);
}
