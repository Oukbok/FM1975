// Werbung 2.0 ohne UI:  npm run test:marketing   (SAVE=… für spätere Epochen)
// Zielwirkung je Epoche, Anlauf/Verfall, Markenaufbau, Wirkung in der Engine, Kosten gegen geschätzten Ertrag.
import { readFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import { GOAL_CAP, MARKETING_AREAS, marketingAvailable, marketingMonthlyBase, marketingTargets } from '../src/data/marketing';
import { commercialMultiplier, ensureBrand as ensureBrandT } from '../src/engine/clubEconomy';
import { yearOf } from '../src/engine/economy';
import { computeMonthly } from '../src/engine/finances';
import { honourFx } from '../src/engine/honourEffects';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { bindMarketing, marketingFxOf, marketingMonthly, marketingPull, marketingView } from '../src/game/marketingGame';
import type { Game } from '../src/game/state';

let fails = 0;
const ok = (c: boolean, msg: string) => { if (!c) fails++; console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); };
function load(path: string): Game {
  const txt = readFileSync(path, 'utf8');
  const g = (JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game }).game;
  prepareLoadedGame(g);
  return g;
}
const mio = (v: number) => `${(v / 1e6).toFixed(2)} Mio.`;
const levels = (year: number, f: (max: number) => number) => Object.fromEntries(MARKETING_AREAS.filter((a) => marketingAvailable(a, year)).map((a) => [a.id, f(a.maxUnits)]));

// ---------------------------------------------------------------- Zielwirkung je Epoche
for (const y of [1975, 1990, 2005, 2025]) {
  const full = marketingTargets(levels(y, (m) => m), y), low = marketingTargets(levels(y, () => 1), y);
  const reach = (['att', 'members', 'merch', 'reg', 'nat', 'intl'] as const).filter((k) => full[k] > 0);
  ok(reach.every((k) => Math.abs(full[k] - GOAL_CAP[k]) < 1e-9) && reach.every((k) => low[k] > full[k] * 0.2 && low[k] < full[k] * 0.6),
    `${y}: volle Kanäle = Obergrenze (${reach.join(', ')}), Stufe 1 bringt schon ${Math.round((low.att / full.att) * 100)} % der Zuschauerwirkung`);
}
ok(marketingTargets({}, 1975).att === 0 && marketingTargets(levels(1975, (m) => m), 1975).intl === 0 && marketingTargets(levels(1975, (m) => m), 1975).nat === 0,
  '1975: ohne Werbung keine Wirkung; national/international noch ohne Kanal');

// ---------------------------------------------------------------- Ablauf an einem Spielstand
function run(path: string, label: string): void {
  const g = load(path);
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  console.log(`\n--- ${label}: ${club.name}, ${g.calendar.currentDate}, Ruf ${Math.round(club.reputation)} ---`);
  g.marketing = {}; g.marketingFx = undefined; g.marketingBrand = undefined;
  bindMarketing(g);
  const brand0 = { ...ensureBrandT(club) };
  const base = computeMonthly(club, g.players, g.table, 1, year).membership;
  const cm0 = commercialMultiplier(club, year);
  for (const [name, f] of [['Stufe 1 überall', () => 1], ['halbe Stufen', (m: number) => Math.ceil(m / 2)], ['alles am Anschlag', (m: number) => m]] as [string, (m: number) => number][]) {
    const v = marketingView(g, levels(year, f));
    console.log(`  ${name.padEnd(18)} Kosten ${mio(v.costYear).padStart(11)}  Ertrag ${mio(v.gainYear).padStart(11)}  (Marke ${mio(v.brandYear)})  Saldo ${mio(v.gainYear - v.costYear)}`);
  }
  // Andere Vereinsgrößen derselben Liga (nur die Schätzung): Werbung muss sich auf unteren Stufen für alle lohnen.
  const league = Object.values(g.clubs).filter((c) => c.finances.seasonHistory?.length && (c.finances.leagueTier ?? 1) === 1).sort((a, b) => b.reputation - a.reputation);
  const me = g.managedClubId;
  for (const c of [league[0], league[Math.floor(league.length / 2)], league[league.length - 1]].filter((x) => x && x.id !== me)) {
    g.managedClubId = c.id;
    const row = ([['1', () => 1], ['halb', (m: number) => Math.ceil(m / 2)], ['voll', (m: number) => m]] as [string, (m: number) => number][]).map(([n, f]) => { const v = marketingView(g, levels(year, f)); return `${n}: ${mio(v.costYear)} → ${mio(v.gainYear)} (×${(v.gainYear / Math.max(1, v.costYear)).toFixed(2)})`; });
    console.log(`  ${c.name.padEnd(20)} Ruf ${Math.round(c.reputation)}  ${row.join('   ')}`);
    const vs = [() => 1, (m: number) => Math.ceil(m / 2), (m: number) => m].map((f) => marketingView(g, levels(year, f)));
    const nets = vs.map((v) => v.gainYear - v.costYear);
    ok(vs.every((v) => v.gainYear > v.costYear * 0.9) && (vs[0].pull.factor > 1.05 || nets[1] > nets[2]), `${label}: ${c.name} – Werbung trägt sich auf jeder Stufe (Zugkraft ×${vs[0].pull.factor}), am meisten bleibt in der Mitte`);
  }
  g.managedClubId = me;
  const lo = marketingView(g, levels(year, () => 1)), hi = marketingView(g, levels(year, (m) => m));
  ok(lo.gainYear / Math.max(1, lo.costYear) > hi.gainYear / Math.max(1, hi.costYear), `${label}: erste Stufen rechnen sich besser als der Anschlag`);
  // Anlauf über die Monate
  g.marketing = levels(year, (m) => Math.ceil(m / 2));
  const bal0 = club.finances.balance;
  const d = g.calendar.currentDate.slice(0, 8) + '01';
  marketingMonthly(g, d);
  const one = marketingFxOf(g).att, target = marketingTargets(g.marketing, year, marketingPull(g).factor);
  ok(club.finances.balance < bal0 && Math.abs(bal0 - club.finances.balance - marketingView(g).costMonth) < 2, `${label}: Monatskosten gebucht (${mio(bal0 - club.finances.balance)})`);
  for (let i = 0; i < 7; i++) marketingMonthly(g, d);
  const fx = marketingFxOf(g);
  ok(one > 0 && one < target.att * 0.4 && fx.att > target.att * 0.9 && fx.att <= target.att + 1e-9, `${label}: Wirkung läuft an (1. Monat ${(one * 100).toFixed(2)} %, nach 8 Monaten ${(fx.att * 100).toFixed(2)} % von ${(target.att * 100).toFixed(2)} %)`);
  ok(Math.abs(honourFx(club.id, 'demand') - fx.att) < 1e-9 && honourFx('nicht-mein-verein', 'demand') === 0, `${label}: Zuschauerwirkung kommt in der Engine an, nur beim eigenen Verein`);
  const m1 = computeMonthly(club, g.players, g.table, 1, year).membership;
  ok(m1 > base && Math.abs(m1 / base - (1 + fx.members)) < 0.01, `${label}: Mitgliedsbeiträge +${((m1 / base - 1) * 100).toFixed(1)} %`);
  const cm1 = commercialMultiplier(club, year);
  ok(cm1 >= cm0 && cm1 < cm0 * 1.2, `${label}: Marke hebt Sponsoring/Fanartikel um ${((cm1 / cm0 - 1) * 100).toFixed(1)} %`);
  // Werbung streichen: Wirkung klingt ab, Marke bleibt vorerst
  const brand = { ...club.brand! };
  g.marketing = {};
  for (let i = 0; i < 3; i++) marketingMonthly(g, d);
  const after = marketingFxOf(g);
  ok(after.att < fx.att && after.att > fx.att * 0.4 && club.brand!.national > brand.national - 2 && club.brand!.national > brand.national - (g.marketingBrand?.nat ?? 0) - 1e-9, `${label}: nach dem Stopp klingt die Wirkung langsam ab (${(after.att * 100).toFixed(2)} %), die Marke bleibt`);
  for (let i = 0; i < 40; i++) marketingMonthly(g, d);
  ok(marketingFxOf(g).att === 0 && honourFx(club.id, 'demand') === 0, `${label}: ohne Werbung irgendwann keine Wirkung mehr`);
  for (let i = 0; i < 120; i++) marketingMonthly(g, d);
  ok(Math.abs(club.brand!.national - brand0.national) < 0.01 && Math.abs(club.brand!.international - brand0.international) < 0.01 && !(g.marketingBrand?.nat),
    `${label}: nach langer Pause ist die Marke wieder dort, wo sie ohne Werbung stünde (${club.brand!.national.toFixed(1)})`);
  // Zugkraft: Erfolg verstärkt die Werbung und verschiebt den einträglichsten Einsatz
  const row = g.table.rows.find((r) => r.clubId === club.id);
  if (row && g.table.rows.length > 6 && row.played >= 3) {
    const keep = { rows: g.table.rows.map((r) => ({ ...r, form: [...r.form] })) };
    const place = (pos: number, form: ('W' | 'D' | 'L')[]) => { const rest = g.table.rows.filter((r) => r.clubId !== club.id); rest.splice(pos - 1, 0, row); g.table.rows = rest; row.form = form; };
    place(1, ['W', 'W', 'W', 'W', 'W']);
    const hot = marketingPull(g), vHot = marketingView(g, levels(year, (m) => Math.ceil(m / 2)));
    place(g.table.rows.length, ['L', 'L', 'L', 'L', 'L']);
    const cold = marketingPull(g), vCold = marketingView(g, levels(year, (m) => Math.ceil(m / 2)));
    g.table.rows = keep.rows;
    ok(hot.factor > 1.1 && cold.factor < 0.9 && hot.factor <= 1.4 && cold.factor >= 0.7 && vHot.gainYear > vCold.gainYear * 1.2,
      `${label}: Zugkraft Tabellenführer ×${hot.factor} (${hot.word}), Schlusslicht ×${cold.factor} (${cold.word}) – Ertrag ${mio(vHot.gainYear)} gegen ${mio(vCold.gainYear)}`);
    const upHot = (vHot.netUp ?? -1e18) - (vHot.gainYear - vHot.costYear), upCold = (vCold.netUp ?? -1e18) - (vCold.gainYear - vCold.costYear);
    ok(upHot > upCold, `${label}: mit Zugkraft lohnt die nächste Stufe eher (${mio(upHot)} gegen ${mio(upCold)})`);
  }
  ok(marketingMonthlyBase({}) === 0, `${label}: keine Regler, keine Kosten`);
}
run('public/saves/test-3-jahre.txt', 'Vorlage 1978');
if (process.env.SAVE) for (const p of process.env.SAVE.split(',')) run(p, p.split('/').pop()!);

console.log(fails ? `\n${fails} FEHLER` : '\nAlle Werbe-Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
