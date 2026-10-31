// =============================================================================
// Saison-Simulation ohne Browser: spielt N Saisons durch und misst die Balance.
//   npm run sim -- 10        (10 Saisons)
// Ausgabe je Saison: Liga-Durchschnitt, Top-Spieler, Altersstruktur, Meister,
// Kontostand des eigenen Vereins, Verletzte. Bricht bei Fehlern/NaN ab.
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { LEGENDS } from '../src/data/legends';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason, leagueClubs } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { Game } from '../src/game/state';
import { Player } from '../src/types';
import { recordFeeEUR } from '../src/data/transferRecords';
import { economyScale as econScale } from '../src/engine/economy';

const seasons = Number(process.argv[2] ?? 3);

// Deterministischer Zufall, damit Läufe vergleichbar sind.
let seed = Number(process.env.SEED ?? 1975);
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const g: Game = createNewGame({
  managedClubId: process.env.CLUB ?? 'mgl',
  manager: { name: 'Sim', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  legendMode: (process.env.LEGENDS as any) ?? 'fictional',
});

(g as any).simAutoManage = true; // eigener Verein wird wie ein KI-Verein gepflegt

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
function leaguePlayers(game: Game): Player[] {
  return leagueClubs(game).flatMap((c) => c.playerIds.map((id) => game.players[id]).filter(Boolean));
}

function report(game: Game) {
  const ps = leaguePlayers(game);
  const ovr = ps.map((p) => p.overall).sort((a, b) => b - a);
  const bad = ps.filter((p) => !Number.isFinite(p.overall) || Object.values(p.attributes).some((v) => !Number.isFinite(v)));
  if (bad.length) throw new Error(`NaN bei ${bad.length} Spielern, z. B. ${bad[0].fullName}`);
  const top = game.leagues?.playerDivision?.tier === 1 ? null : game.leagues?.otherDivisions.find((d) => d.tier === 1);
  const champ = top ? top.table.rows?.[0] : game.table.rows?.[0];
  const my = game.clubs[game.managedClubId];
  console.log([
    game.season.padEnd(8),
    `Liga ${game.leagues?.playerDivision?.tier ?? '?'} Platz ${(game.table.rows.findIndex((r) => r.clubId === game.managedClubId) + 1)}`,
    `Ø ${avg(ovr).toFixed(1)}`,
    `Top10 ${avg(ovr.slice(0, 10)).toFixed(1)}`,
    `≥85: ${ovr.filter((o) => o >= 85).length}`,
    `≤60: ${ovr.filter((o) => o <= 60).length}`,
    `Alter ${avg(ps.map((p) => p.age)).toFixed(1)}`,
    `Spieler ${ps.length}`,
    `Jgd ${(game.leagueBalance?.shift ?? 0).toFixed(1)}`,
    `Meister ${champ ? game.clubs[champ.clubId]?.shortName ?? game.simClubs?.[champ.clubId]?.shortName ?? '?' : '?'}${champ && (champ.clubId.startsWith('eu_') || champ.clubId.startsWith('w_')) ? '(AUSLAND!)' : ''}`,
    `Konto ${Math.round(my.finances.balance / 1000)}k`,
    `Kader ${my.playerIds.length}`,
    `verletzt ${ps.filter((p) => p.injury).length}`,
    `EC ${game.euroCups?.ec?.winnerClubId ? (game.euroClubs?.[game.euroCups.ec.winnerClubId]?.shortName ?? game.clubs[game.euroCups.ec.winnerClubId]?.shortName ?? game.simClubs?.[game.euroCups.ec.winnerClubId]?.shortName) : '-'}`,
  ].join(' | '));
  if (process.env.TRANSFERS) {
    // Spitzenablösen der Saison (alle Wechsel deutscher Vereine) gegen die Rekordkurve.
    const y0 = Number(game.season.slice(0, 4));
    const from = `${y0}-07-01`, to = `${y0 + 1}-06-30`;
    const fees: number[] = [];
    const seen = new Set<string>();
    for (const p of Object.values(game.players)) for (const t of p.history?.transfers ?? []) {
      if (t.date >= from && t.date <= to && t.fee > 0 && !seen.has(p.id + t.date)) { seen.add(p.id + t.date); fees.push(t.fee); }
    }
    fees.sort((a, b) => b - a);
    const curve = recordFeeEUR(y0, 'germany') * 1.95583;
    const top = fees[0] ?? 0;
    (globalThis as any).__tr = (globalThis as any).__tr ?? [];
    (globalThis as any).__tr.push(top / curve);
    console.log(`   TRANSFERS ${fees.length} Wechsel mit Ablöse, Spitze ${(top / 1e6).toFixed(2)} Mio. (Kurve ${(curve / 1e6).toFixed(2)}) = ${(top / curve * 100).toFixed(0)} %, Top3 ${fees.slice(0, 3).map((f) => (f / curve * 100).toFixed(0) + '%').join('/')}`);
  }
  if (process.env.FIN) {
    // Werte = laufende Saison bis zum Saisonende (vor dem Abschluss).
    const f = my.finances;
    const k = (o: Record<string, number>) => Object.entries(o).filter(([, v]) => v).map(([a, v]) => `${a} ${Math.round(v / 1000)}k`).join(', ');
    console.log('   EIN', k(f.income as any));
    console.log('   AUS', k(f.expenses as any));
    const lc = leagueClubs(game).filter((c) => !c.id.startsWith('am'));
    const revs = lc.map((c) => c.finances.seasonHistory?.[c.finances.seasonHistory.length - 1]?.revenue ?? 0).sort((a, b) => a - b);
    const wr = lc.map((c) => c.finances.seasonHistory?.[c.finances.seasonHistory.length - 1]?.wageRatio ?? 0);
    console.log(`   Liga-Umsatz Vorsaison: min ${Math.round(revs[0] / 1e6)}M median ${Math.round(revs[revs.length >> 1] / 1e6)}M max ${Math.round(revs[revs.length - 1] / 1e6)}M | Ø Gehaltsquote ${(wr.reduce((a, b) => a + b, 0) / wr.length).toFixed(2)} | Top-Marktwert ${Math.round(Math.max(...Object.values(game.players).map((p) => p.contract.transferValue)) / 1000)}k (Basis)`);
    const others = lc.filter((c) => c.id !== my.id).map((c) => c.finances.balance).sort((a, b) => a - b);
    const ded = lc.filter((c) => c.pointDeduction && c.pointDeduction.season === game.season).map((c) => `${c.shortName} −${c.pointDeduction!.points}${c.finances.ffp?.forcedRelegation === game.season ? ' Zwangsabstieg' : ''}`);
    if (ded.length) console.log(`   Punktabzug: ${ded.join(', ')}`);
    if (process.env.DEBT) {
      const worst = [...lc].sort((a, b) => a.finances.balance - b.finances.balance).slice(0, 3);
      for (const c of worst) {
        const h = c.finances.seasonHistory?.[c.finances.seasonHistory.length - 1];
        console.log(`   DEBT ${c.shortName} rep ${c.reputation} Konto ${Math.round(c.finances.balance / 1000)}k Umsatz ${Math.round((h?.revenue ?? 0) / 1000)}k Ergebnis ${Math.round((h?.result ?? 0) / 1000)}k Quote ${h?.wageRatio?.toFixed(2)} | AUS ${h ? Object.entries(h.expenses).map(([k, v]) => `${k} ${Math.round((v as number) / 1000)}k`).join(' ') : ''} | EIN ${h ? Object.entries(h.income).filter(([, v]) => v).map(([k, v]) => `${k} ${Math.round((v as number) / 1000)}k`).join(' ') : ''}`);
      }
    }
    console.log(`   KI-Konten min ${Math.round(others[0] / 1000)}k median ${Math.round(others[others.length >> 1] / 1000)}k max ${Math.round(others[others.length - 1] / 1000)}k`);
  }
  if (process.env.MINE) {
    const sq = my.playerIds.map((id) => game.players[id]).filter(Boolean);
    const ovr = sq.map((p) => p.overall).sort((a, b) => b - a);
    const others = leagueClubs(game).filter((c) => c.id !== my.id).map((c) => c.playerIds.map((id) => game.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 11).reduce((a, b) => a + b, 0) / 11).sort((a, b) => b - a);
    const row = game.table.rows.find((r) => r.clubId === my.id);
    const pc: Record<string, number> = {}; for (const p of sq) pc[p.naturalPosition] = (pc[p.naturalPosition] ?? 0) + 1;
    console.log(`   MINE Positionen ${Object.entries(pc).map(([k, v]) => k + ':' + v).join(' ')} | TW-OVR ${sq.filter((p) => p.naturalPosition === 'TW').map((p) => p.overall).join('/')}`);
    console.log(`   MINE top11 ${(ovr.slice(0, 11).reduce((a, b) => a + b, 0) / 11).toFixed(1)} | Liga top11 max ${others[0]?.toFixed(1)} med ${others[others.length >> 1]?.toFixed(1)} | Frische ${(sq.reduce((a, p) => a + (p.frische ?? 100), 0) / sq.length).toFixed(0)} Form ${(sq.reduce((a, p) => a + p.form, 0) / sq.length).toFixed(0)} | Tore ${row?.goalsFor}:${row?.goalsAgainst}`);
  }
  if (process.env.SQUADS) {
    const lc = leagueClubs(game);
    const sz = lc.map((c) => c.playerIds.length).sort((a, b) => a - b);
    const divs = [game.leagues.playerDivision, ...game.leagues.otherDivisions].map((d: any) => `${d.id}:${d.tier}:${d.table?.rows?.length ?? d.clubIds?.length ?? '?'}`).join(' ');
    console.log(`   Divs ${divs}`);
    console.log(`   Vereine ${lc.length} Kader min ${sz[0]} med ${sz[sz.length >> 1]} max ${sz[sz.length - 1]} | Tabelle ${game.table.rows.length}`);
  }
  if (process.env.BAL) balanceReport(game, ps);
  const w = game.world;
  if (w && w.history.length) {
    const h = w.history[w.history.length - 1];
    const n = (id: string) => game.euroClubs?.[id]?.name ?? id;
    const rank = Object.values(w.countries).filter((c) => c.active)
      .sort((a, b) => b.coef.reduce((x, y) => x + y, 0) - a.coef.reduce((x, y) => x + y, 0)).slice(0, 5)
      .map((c) => `${c.name.slice(0, 3)} ${c.coef.reduce((x, y) => x + y, 0).toFixed(1)}`).join(', ');
    console.log(`   Welt ${h.season}: ENG ${n(h.champions.England)}, ITA ${n(h.champions.Italien)}, ESP ${n(h.champions.Spanien)} | Koeff: ${rank} | DE ${w.germanCoef.reduce((x, y) => x + y, 0).toFixed(1)}`);
  }
}


// -----------------------------------------------------------------------------
// BAL=1: Kennzahlen für die Langzeit-Balance (eigene Liga = voll simulierte Liga).
// -----------------------------------------------------------------------------
const bal = { prevClubs: new Set<string>(), newRanks: [] as number[], injSnap: [] as number[], prevIds: new Map<string, number>(), titles: new Map<string, number>(), rows: [] as Record<string, number>[] };
function balanceReport(game: Game, ps: Player[]) {
  const y0 = Number(game.season.slice(0, 4));
  const from = `${y0}-07-01`, to = `${y0 + 1}-06-30`;
  const played = game.fixtures.filter((m) => m.result);
  const goals = played.reduce((a, m) => a + m.result!.homeGoals + m.result!.awayGoals, 0);
  const hw = played.filter((m) => m.result!.homeGoals > m.result!.awayGoals).length;
  const dr = played.filter((m) => m.result!.homeGoals === m.result!.awayGoals).length;
  const inj = ps.reduce((a, p) => a + (p.history?.injuries ?? []).filter((i) => i.date >= from && i.date <= to).length, 0);
  const injDays = ps.reduce((a, p) => a + (p.history?.injuries ?? []).filter((i) => i.date >= from && i.date <= to).reduce((x, i) => x + (i.days ?? 0), 0), 0);
  const lc = leagueClubs(game);
  const tw = lc.map((c) => c.playerIds.filter((id) => game.players[id]?.naturalPosition === 'TW').length);
  const ages = ps.map((p) => p.age);
  const pct = (f: (a: number) => boolean) => Math.round(ages.filter(f).length / Math.max(1, ages.length) * 100);
  const now = new Map(ps.map((p) => [p.id, p.age] as [string, number]));
  let gone = 0, goneOld = 0;
  for (const [id, age] of bal.prevIds) if (!now.has(id) && !game.players[id]) { gone++; if (age >= 31) goneOld++; }
  bal.prevIds = now;
  const youthOrigin = ps.filter((p) => p.id.includes('_y_') || p.id.includes('youth')).length;
  const youngStars = ps.filter((p) => p.age <= 21 && p.overall >= 75).length;
  const sc = econScale(y0);
  const wages = ps.map((p) => p.contract.weeklyWage * 52 * sc).sort((a, b) => b - a);
  const fees = ps.map((p) => p.contract.transferValue * sc).sort((a, b) => b - a);
  const champ = game.table.rows?.[0]?.clubId;
  if (played.length > 100 && champ && (game.leagues?.playerDivision?.tier ?? 1) === 1) bal.titles.set(champ, (bal.titles.get(champ) ?? 0) + 1);
  const ratio = lc.map((c) => { const h = c.finances.seasonHistory?.[c.finances.seasonHistory.length - 1]; return h && h.revenue > 0 ? c.finances.balance / h.revenue : NaN; }).filter(Number.isFinite).sort((a, b) => a - b);
  const my = game.clubs[game.managedClubId];
  const myH = my.finances.seasonHistory?.[my.finances.seasonHistory.length - 1];
  const neg = lc.filter((c) => c.finances.balance < 0).length;
  const row = { y: y0, tore: played.length ? goals / played.length : 0, heim: played.length ? hw / played.length : 0, remis: played.length ? dr / played.length : 0, inj, tw0: tw.filter((n) => n === 0).length };
  bal.rows.push(row);
  const snap = bal.injSnap.splice(0);
  // Aufsteiger (neu in der Spielerliga) und ihr Abschneiden.
  const rows = game.table.rows ?? [];
  const newcomers = rows.map((r, i) => ({ id: r.clubId, rank: i + 1 })).filter((r) => bal.prevClubs.size && !bal.prevClubs.has(r.id));
  bal.prevClubs = new Set(rows.map((r) => r.clubId));
  if ((game.leagues?.playerDivision?.tier ?? 1) === 1) bal.newRanks.push(...newcomers.map((n) => n.rank));
  const top11 = (c: { playerIds: string[] }) => { const o = c.playerIds.map((id) => game.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 11); return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length); };
  const nm = (id: string) => game.clubs[id]?.shortName ?? id;
  console.log(`   BAL Neu in der Liga: ${newcomers.map((n) => `${nm(n.id)} Platz ${n.rank} (Top11 ${top11(game.clubs[n.id]).toFixed(1)})`).join(', ') || '-'} | Liga-Top11 Median ${(() => { const t = lc.map(top11).sort((a, b) => a - b); return t[t.length >> 1]?.toFixed(1); })()}`);
  console.log(`   BAL Tore/Sp ${row.tore.toFixed(2)} Heim ${(row.heim * 100).toFixed(0)}% Remis ${(row.remis * 100).toFixed(0)}% | Verl. ${inj} verletzt Nov/Mär ${snap.join('/')} (${Math.round(injDays / Math.max(1, ps.length))} T/Sp.) | TW je Verein 0:${tw.filter((n) => n === 0).length} 1:${tw.filter((n) => n === 1).length} 2+:${tw.filter((n) => n >= 2).length}`
    + ` | Alter ≤21 ${pct((a) => a <= 21)}% 22–25 ${pct((a) => a >= 22 && a <= 25)}% 26–29 ${pct((a) => a >= 26 && a <= 29)}% 30–33 ${pct((a) => a >= 30 && a <= 33)}% ≥34 ${pct((a) => a >= 34)}%`
    + ` | weg ${gone} (≥31: ${goneOld}) | Jugend-Eigengew. ${youthOrigin} U21≥75 ${youngStars}`);
  const origin = (p: Player) => p.development.legendId ? 'Legende' : p.id.includes('_y_') ? 'Jugend' : /_r\d{4}_/.test(p.id) ? 'Nachrücker' : /_t\d{4}_/.test(p.id) ? 'Ausland' : /_p\d+$/.test(p.id) ? 'Start' : 'sonst';
  const stars = ps.filter((p) => p.overall >= 85);
  const byO: Record<string, number> = {}; for (const p of stars) byO[origin(p)] = (byO[origin(p)] ?? 0) + 1;
  console.log(`   BAL ≥85 nach Herkunft ${Object.entries(byO).map(([k, v]) => k + ' ' + v).join(', ')} | Ø Alter ${avg(stars.map((p) => p.age)).toFixed(1)}`);
  console.log(`   BAL Gehalt/Jahr top ${(wages[0] / 1e6).toFixed(2)}M p90 ${((wages[Math.floor(wages.length * 0.1)] ?? 0) / 1e6).toFixed(2)}M med ${((wages[wages.length >> 1] ?? 0) / 1e3).toFixed(0)}k | MW top ${(fees[0] / 1e6).toFixed(2)}M | Konto/Umsatz KI min ${ratio[0]?.toFixed(2)} med ${ratio[ratio.length >> 1]?.toFixed(2)} max ${ratio[ratio.length - 1]?.toFixed(2)} | eigen ${myH ? (my.finances.balance / myH.revenue).toFixed(2) : '-'} | im Minus ${neg}`);
}

const t0 = Date.now();
report(g);
for (let s = 0; s < seasons; s++) {
  let guard = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    // Simulation: eigener Verein stellt wie die KI auf (keine eingefrorene Startelf).
    const t = g.clubs[g.managedClubId]?.tactics;
    if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
    processDay(g, HEADLESS_UI);
    if (process.env.BAL && /-(11|03)-15$/.test(g.calendar.currentDate)) bal.injSnap.push(leaguePlayers(g).filter((p) => p.injury).length);
    if (++guard > 1000) throw new Error('Saison endet nicht');
  }
  report(g);
  startNextSeason(g);
}
if (process.env.SAVESIZE) { const j = JSON.stringify(g); console.log(`Spielstand ${(j.length / 1024 / 1024).toFixed(2)} MB (unkomprimiert)`); for (const [k, v] of Object.entries(g)) { const n = JSON.stringify(v ?? null).length; if (n > 50000) console.log('  ', k, (n / 1024).toFixed(0), 'KB'); } const pl = Object.values(g.players); const hist = pl.reduce((a, p) => a + JSON.stringify(p.history ?? {}).length, 0); console.log('   davon Spieler-Historie', (hist / 1024).toFixed(0), 'KB bei', pl.length, 'Spielern'); }
if (process.env.DUMP) {
  // Spielstand im Speicherformat ablegen (für tests/ui-smoke.mjs mit SAVE=…).
  const { compressToUTF16 } = await import('lz-string');
  const { writeFileSync } = await import('node:fs');
  const my = g.clubs[g.managedClubId];
  const meta = { slot: 'sim', name: 'Simulation', managerName: 'Sim', clubName: my.name, clubId: my.id, season: g.season, gameDate: g.calendar.currentDate, savedAt: new Date().toISOString(), version: 9 };
  writeFileSync(process.env.DUMP, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: g })));
  console.log('Spielstand geschrieben:', process.env.DUMP);
}
if (process.env.BAL) {
  const t = [...bal.titles.entries()].sort((a, b) => b[1] - a[1]);
  const name = (id: string) => g.clubs[id]?.shortName ?? g.simClubs?.[id]?.shortName ?? id;
  console.log(`BAL Aufsteiger: ${bal.newRanks.length}, Ø Platz ${avg(bal.newRanks).toFixed(1)}, in den Top 3: ${bal.newRanks.filter((r) => r <= 3).length}, Meister: ${bal.newRanks.filter((r) => r === 1).length}`);
  console.log(`BAL Meister (1. Liga, eigene Liga): ${t.length} verschiedene in ${t.reduce((a, x) => a + x[1], 0)} Saisons: ${t.map(([id, n]) => name(id) + ' ' + n).join(', ')}`);
  for (const [a, b] of [[1975, 1985], [1985, 1995], [1995, 2005], [2005, 2015], [2015, 2030]]) {
    const r = bal.rows.filter((x) => x.y >= a && x.y < b && x.tore > 0);
    if (r.length) console.log(`BAL ${a}–${b - 1}: Tore/Sp ${avg(r.map((x) => x.tore)).toFixed(2)} Heimsieg ${(avg(r.map((x) => x.heim)) * 100).toFixed(1)}% Remis ${(avg(r.map((x) => x.remis)) * 100).toFixed(1)}% Verletzungen/Saison ${avg(r.map((x) => x.inj)).toFixed(0)} Vereine ohne TW ${avg(r.map((x) => x.tw0)).toFixed(1)}`);
  }
}
console.log(`fertig in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const legends = [...Object.values(g.players), ...Object.values(g.youthPlayers)].filter((p) => p.development.legendId);
if (process.env.LEGENDLIST) for (const p of legends) console.log('Legende', p.fullName.padEnd(24), p.naturalPosition, 'Alter', p.age, 'OVR', p.overall, 'Verein', g.clubs[p.clubId]?.shortName ?? p.clubId, p.isYouth ? '(Jugend)' : '', 'Hist', p.development.abilityHistory.map((h) => h.ability).join(','));

// Legenden-Bilanz: Höchstwert der Karriere je Seltenheit (nur ab 24 Jahren).
{
  const seeds = new Map(LEGENDS.map((l) => [l.id, l]));
  const rows: Record<string, number[]> = {};
  for (const p of legends) {
    if (p.age < 24) continue;
    const s = seeds.get(p.development.legendId!);
    const r = s?.rarity ?? 'alt';
    const best = Math.max(p.overall, ...p.development.abilityHistory.map((h) => h.ability));
    (rows[r] ??= []).push(best);
  }
  for (const [r, xs] of Object.entries(rows)) {
    const star = xs.filter((x) => x >= 85).length, good = xs.filter((x) => x >= 78 && x < 85).length;
    console.log(`Legenden ${r.padEnd(10)} n=${xs.length}  Star(≥85) ${star}  gut(78–84) ${good}  darunter ${xs.length - star - good}  Ø Höchstwert ${(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)).toFixed(1)}`);
  }
  if (process.env.LEGENDLIST) {
    const byId = new Map(legends.map((p) => [p.development.legendId!, p]));
    for (const id of g.spawnedLegends ?? []) {
      const s = seeds.get(id); if (!s || s.rarity !== 'weltklasse') continue;
      const p = byId.get(id);
      console.log('  W', id, s.firstName, s.lastName, s.position, p ? `${p.age} J. OVR ${p.overall} Pot ${p.development.potentialAbility}/${p.development.basePotential}+${p.development.unfold} ★${p.potentialStars} ${g.clubs[p.clubId]?.shortName ?? p.clubId} Hist ${p.development.abilityHistory.map((h) => h.ability).join(',')} | hoch: ${Object.entries(p.attributes).filter(([, v]) => (v as number) >= 93).map(([k, v]) => k + '=' + v).join(' ')} | sig ${JSON.stringify(p.development.legendSignature)}` : 'nicht mehr im Spiel');
    }
  }
  console.log(`Legenden aktiv: ${legends.length}, Interessenten (Geheimtipp/Ausland): ${(g.legendProspects ?? []).length}`);
}
// Diagnose: Wer ist ≥ 85?
{
  const top = leaguePlayers(g).filter((p) => p.overall >= 85).slice(0, 12);
  for (const p of top) console.log(p.fullName.padEnd(22), p.naturalPosition, 'Alter', p.age, 'OVR', p.overall, 'Basis', p.development.basePotential, 'Entf', p.development.unfold, 'Jugend', p.id.includes('_y_') ? 'ja' : 'nein', 'Hist', p.development.abilityHistory.map((h) => h.ability).join(','));
}
