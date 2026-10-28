// Funktionstest Stadion-Blöcke: Einführung (einnahmen-neutral), Planung,
// Epochen-Sperren, Umbau bar/Kredit, Fertigstellung, Stimmung, Europapokal-Sitzplätze.
//   node scripts/run-ts.mjs tests/stadium-test.ts
import { createNewGame } from '../src/game/newGame';
import { blockPlanFor, ensureStadiumBlocks, groupPlanFor, sideTargets, stadiumDaily, startBlockBuild } from '../src/game/stadiumGame';
import { ensureEnvironment } from '../src/game/environmentGame';
import {
  blockCapacity, blocksCapacity, convertLegacyBlocks, euroCapacity, migrateBlocks, planBlock, priceMix, roofAttendanceFactor, seatedCapacity, ticketFactor, vipAreaBoxes,
} from '../src/engine/stadiumBlocks';
import { vipIncome } from '../src/engine/clubBusiness';
import { MatchSim } from '../src/engine/match/sim';
import { StadiumBlock } from '../src/types';

let fails = 0;
const ok = (cond: unknown, label: string) => { console.log(`${cond ? 'OK  ' : 'FEHL'} ${label}`); if (!cond) fails++; };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const me = g.clubs[g.managedClubId];
const other = Object.values(g.clubs).find((c) => c.id !== me.id && c.leagueId === me.leagueId)!;

// --- Einführung ---
ok(me.stadium.blocks?.length === 14, `14 Blöcke angelegt (${me.stadium.blocks?.map((b) => b.id).join(', ')})`);
ok(!other.stadium.blocks, 'KI-Vereine bleiben ohne Blöcke');
ok(Math.abs(ticketFactor(me) - 1) < 1e-9, 'Ticketfaktor bei Einführung = 1 (einnahmen-neutral)');
ok(me.stadium.capacity === blocksCapacity(me.stadium.blocks!), `Kapazität = Summe der Blöcke (${me.stadium.capacity})`);
ensureStadiumBlocks(g);
ok(me.stadium.blocks!.length === 14, 'Einführung ist idempotent');
for (const cap of [3000, 8000, 30000, 60000]) {
  const c = clone(me); c.stadium.capacity = cap; c.infrastructure.stadium = cap > 40000 ? 4 : 2;
  const b = migrateBlocks(c, 1990);
  ok(Math.abs(blocksCapacity(b) - cap) / cap < (cap < 5000 ? 0.2 : 0.12), `Migration ${cap} → ${blocksCapacity(b)}${cap < 5000 ? ' (Mindestreihen)' : ''}`);
}

// --- Alte Spielstände: vier Blöcke → 14 ---
{
  const c = clone(me);
  c.stadium.blocks = [
    { id: 'main', tiers: [{ seat: 'bank', rows: 20 }, { seat: 'bank', rows: 14 }], roof: 'partial', vip: true, lounges: 4 },
    { id: 'opposite', tiers: [{ seat: 'steh', rows: 30 }], roof: 'none', vip: false, lounges: 2 },
    { id: 'north', tiers: [{ seat: 'steh', rows: 28 }], roof: 'none', vip: false, lounges: 0, scoreboard: true },
    { id: 'south', tiers: [{ seat: 'steh', rows: 26 }], roof: 'partial', vip: false, lounges: 0 },
  ] as any;
  const legacyCap = 37000;
  c.stadium.capacity = legacyCap; c.stadium.priceBase = 0.9;
  ok(convertLegacyBlocks(c), 'alter Spielstand erkannt');
  const nb = c.stadium.blocks!;
  ok(nb.length === 14 && new Set(nb.map((b) => b.id)).size === 14, `14 Blöcke nach Umwandlung`);
  ok(nb.filter((b) => b.vip).length === 1 && nb.find((b) => b.id === 'main_m')!.vip, 'VIP bleibt auf der Haupttribüne Mitte');
  ok(nb.reduce((s, b) => s + b.lounges, 0) === 6, 'Logen bleiben erhalten');
  ok(nb.filter((b) => b.scoreboard).length === 1, 'Anzeigetafel bleibt');
  ok(!convertLegacyBlocks(c), 'Umwandlung nur einmal');
}

// --- Planung 1975: Epochen-Sperren ---
const main = me.stadium.blocks!.find((b) => b.id === 'main_m')!;
const t1: StadiumBlock = { ...clone(main), lounges: 2 };
ok(!planBlock(main, t1, 1975, me.stadium.capacity, 50).ok, 'Logen 1975 gesperrt');
const t2: StadiumBlock = { ...clone(main), tiers: [{ seat: 'business', rows: 20 }] };
ok(!planBlock(main, t2, 1975, me.stadium.capacity, 50).ok, 'Business-Seats 1975 gesperrt');

// --- Umbau bar: Gegengerade überdachen + zweiter Rang ---
const opp = me.stadium.blocks!.find((b) => b.id === 'opp_m')!;
const target: StadiumBlock = { ...clone(opp), roof: 'full', tiers: [...clone(opp.tiers), { seat: 'steh', rows: 14 }] };
const { plan, cost } = blockPlanFor(g, target);
ok(plan.ok && plan.addCapacity > 0 && cost > 0, `Plan: +${plan.addCapacity} Plätze, ${cost} DM, ${plan.months} Monate, Stimmung ${plan.mood}`);
const bal0 = me.finances.balance, cap0 = me.stadium.capacity;
const r = startBlockBuild(g, target, 'cash', 0);
ok(r.ok && !!me.stadium.blockProject, `Baubeginn: ${r.text}`);
ok(me.finances.balance === bal0 - cost, 'Kosten bar gebucht');
ok(me.stadium.capacity < cap0, `Plätze gesperrt (${cap0} → ${me.stadium.capacity})`);
ok(!startBlockBuild(g, target, 'cash', 0).ok, 'zweiter Umbau gleichzeitig abgelehnt');
const mood0 = ensureEnvironment(g).fanMood;
stadiumDaily(g, me.stadium.blockProject!.finishDate);
ok(!me.stadium.blockProject, 'Umbau fertiggestellt');
ok(me.stadium.capacity === cap0 + plan.addCapacity, `Kapazität ${me.stadium.capacity} (= ${cap0} + ${plan.addCapacity})`);
ok(ensureEnvironment(g).fanMood >= mood0, `Dach hebt die Stimmung (${mood0} → ${ensureEnvironment(g).fanMood})`);
ok(roofAttendanceFactor(me, 'regen', 10) > roofAttendanceFactor(me, 'sonnig', 10), 'Dach bringt bei Regen mehr Zuschauer');

// --- Ganze Seite gemeinsam umbauen ---
{
  const blocks = me.stadium.blocks!;
  const d: StadiumBlock = { ...clone(blocks.find((b) => b.id === 'south_w')!), roof: 'full' };
  const single = blockPlanFor(g, d), whole = groupPlanFor(g, sideTargets(blocks, d, true));
  ok(whole.targets.length === 2 && whole.plan.costBase > single.plan.costBase && whole.plan.costBase < single.plan.costBase * 2,
    `Südtribüne komplett: ${whole.targets.length} Blöcke, ${whole.plan.costBase} statt 2 × ${single.plan.costBase}`);
  const curves = groupPlanFor(g, sideTargets(blocks, { ...clone(blocks.find((b) => b.id === 'curve_nw')!), roof: 'full' }, true));
  ok(curves.targets.length === 4, 'alle vier Kurven gemeinsam planbar');
  ok(!planBlock(blocks.find((b) => b.id === 'curve_nw')!, { ...clone(blocks.find((b) => b.id === 'curve_nw')!), vip: true }, 1990, me.stadium.capacity, 50).ok, 'kein VIP-Bereich in der Kurve');
  const r3 = startBlockBuild(g, whole.targets, 'cash', 0);
  ok(r3.ok && me.stadium.blockProject?.more?.length === 1, `Gruppenumbau gestartet: ${r3.text}`);
  stadiumDaily(g, me.stadium.blockProject!.finishDate);
  ok(me.stadium.blocks!.filter((b) => b.id.startsWith('south')).every((b) => b.roof === 'full'), 'beide Südblöcke überdacht');
}

// --- Sitzplätze statt Stehplätze: mehr pro Kopf, Traditionsverein murrt ---
g.calendar.currentDate = '1996-08-01';
const north = me.stadium.blocks!.find((b) => b.id === 'north_w')!;
const seatT: StadiumBlock = { ...clone(north), tiers: north.tiers.map((t) => ({ ...t, seat: 'schale' as const })) };
const pTrad = planBlock(north, seatT, 1996, me.stadium.capacity, 85);
const pNew = planBlock(north, seatT, 1996, me.stadium.capacity, 30);
ok(pTrad.mood < pNew.mood && pNew.mood < 0, `Umwandlung kostet Stimmung (Tradition ${pTrad.mood}, sonst ${pNew.mood})`);
ok(pTrad.addCapacity < 0, `Sitze brauchen mehr Platz (${pTrad.addCapacity})`);
const after = me.stadium.blocks!.map((b) => (b.id === 'north_w' ? seatT : b));
ok(priceMix(after) > priceMix(me.stadium.blocks!), 'Sitzplätze heben den Preismix');

// --- Kredit + VIP/Logen 1996 ---
me.finances.seasonHistory = [{ season: '1995/96', income: me.finances.income, expenses: me.finances.expenses, revenue: 40_000_000, result: 1_000_000, balanceEnd: 5_000_000, wageRatio: 0.5 } as any];
const m2 = me.stadium.blocks!.find((b) => b.id === 'main_m')!;
const vipT: StadiumBlock = { ...clone(m2), vip: true, lounges: 6, roof: 'full', tiers: m2.tiers.length < 2 ? [...clone(m2.tiers), { seat: 'schale', rows: 16 }] : clone(m2.tiers) };
const vip0 = vipIncome(me, 1, 1996);
const loans0 = (me.loans ?? []).length;
const r2 = startBlockBuild(g, vipT, 'loan', 15);
ok(r2.ok && (me.loans ?? []).length === loans0 + 1, `Kredit für Haupttribüne: ${r2.text}`);
stadiumDaily(g, me.stadium.blockProject!.finishDate);
ok(vipIncome(me, 1, 1996) > vip0 && vipAreaBoxes(me) > 0, `VIP-Erlös steigt (${vip0} → ${vipIncome(me, 1, 1996)})`);
ok(blockCapacity(me.stadium.blocks!.find((b) => b.id === 'main_m')!) > 0, 'Haupttribüne in Ordnung');

// --- Kapazität von außen verändert (Autopilot): Blöcke folgen, Ticketfaktor bleibt ---
const tf0 = ticketFactor(me), vipBefore = vipIncome(me, 1, 1996);
me.stadium.capacity = Math.round(me.stadium.capacity * 1.25);
stadiumDaily(g, '1997-01-01');
ok(Math.abs(blocksCapacity(me.stadium.blocks!) - me.stadium.capacity) / me.stadium.capacity < 0.03 && Math.abs(ticketFactor(me) - tf0) < 0.01,
  `Blöcke neu abgeleitet (${me.stadium.capacity}), Ticketfaktor ${tf0.toFixed(3)} → ${ticketFactor(me).toFixed(3)}`);
ok(vipIncome(me, 1, 1996) === vipBefore, `VIP-Erlös bleibt (${vipBefore} → ${vipIncome(me, 1, 1996)})`);

// --- Europapokal ab 1998: nur Sitzplätze ---
const seated = euroCapacity(me.stadium.blocks!, me.stadium.capacity);
ok(seated > seatedCapacity(me.stadium.blocks!) && seated < me.stadium.capacity, `Europapokal-Kapazität ${seated} (Sitze ${seatedCapacity(me.stadium.blocks!)} + halbe Stehränge)`);
me.stadium.averageAttendanceRate = 1;
let maxEuro = 0, maxLiga = 0;
for (let s = 1; s <= 20; s++) {
  maxEuro = Math.max(maxEuro, new MatchSim(me, other, g.players, { year: 1999, date: '1999-09-15', seed: s, competition: 'Europapokal' }).attendance);
  maxLiga = Math.max(maxLiga, new MatchSim(me, other, g.players, { year: 1999, date: '1999-09-15', seed: s, competition: 'Liga' }).attendance);
}
ok(maxEuro <= seated && maxLiga > seated, `Europapokal max. ${maxEuro} ≤ ${seated} Plätze, Liga bis ${maxLiga}`);

console.log(fails ? `\n${fails} Fehler` : '\nAlle Stadion-Tests bestanden.');
process.exit(fails ? 1 : 0);
