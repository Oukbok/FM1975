// Funktionstest Stadion-Blöcke: Einführung (einnahmen-neutral), Planung,
// Epochen-Sperren, Umbau bar/Kredit, Fertigstellung, Stimmung, Europapokal-Sitzplätze.
//   node scripts/run-ts.mjs tests/stadium-test.ts
import { createNewGame } from '../src/game/newGame';
import { blockPlanFor, ensureStadiumBlocks, groupPlanFor, rebuildPlanFor, sideTargets, stadiumDaily, startBlockBuild, startRebuild } from '../src/game/stadiumGame';
import { fanExpectation, lookOf, loungeLimit, planRebuild, stadiumComfort, standardCap } from '../src/engine/stadiumStandard';
import { ensureEnvironment } from '../src/game/environmentGame';
import {
  blockCapacity, blocksCapacity, convertLegacyBlocks, euroCapacity, migrateBlocks, planBlock, priceMix, roofAttendanceFactor, seatedCapacity, ticketFactor, vipAreaBoxes,
} from '../src/engine/stadiumBlocks';
import { blockCaps, vipAreaSeats } from '../src/engine/seating';
/** Hospitality-Kapazität (Business-Plätze + Logengäste) – ersetzt die alte Logen-Pauschale. */
const vipIncome = (c: { stadium: { blocks?: StadiumBlock[] } }, _s: number, _y: number) => { const k = blockCaps(c.stadium.blocks!).caps; return (k.business ?? 0) + (k.loge ?? 0) * 11; };
import { MatchSim } from '../src/engine/match/sim';
import { applyPlan, planList, putInPlan, summarize } from '../src/views/club/stadium/planModel';
import { buildBlocker } from '../src/game/stadiumGame';
import { StadiumBlock } from '../src/types';
import { extrasOf, planExtras, type BoardSpot } from '../src/engine/stadiumExtras';
import { buildPlanFor, startStadiumBuild } from '../src/game/stadiumBuild';
import { bandenFactor } from '../src/engine/sponsorship';
import { capsFor, ensureSeating, rawStandCaps, refPrice, standCaps } from '../src/engine/seating';
import { fanStandMood } from '../src/engine/fanStands';
import { addMonths } from '../src/engine/stadiumBlocks';

let fails = 0;
const ok = (cond: unknown, label: string) => { console.log(`${cond ? 'OK  ' : 'FEHL'} ${label}`); if (!cond) fails++; };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const me = g.clubs[g.managedClubId];
// Saisonbudget (game/budgetPlan.ts) hier ausblenden – geprüft wird die Bau-Logik, die Budgetgrenze prüft test:budget.
delete (g as any).budget;
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
ok(vipIncome(me, 1, 1996) > vip0 && vipAreaBoxes(me) > 0, `VIP-Plätze steigen (${vip0} → ${vipIncome(me, 1, 1996)})`);
ok(blockCapacity(me.stadium.blocks!.find((b) => b.id === 'main_m')!) > 0, 'Haupttribüne in Ordnung');

// --- Kapazität von außen verändert (Autopilot): Blöcke folgen, Ticketfaktor bleibt ---
const tf0 = ticketFactor(me), vipBefore = vipIncome(me, 1, 1996);
me.stadium.capacity = Math.round(me.stadium.capacity * 1.25);
stadiumDaily(g, '1997-01-01');
ok(Math.abs(blocksCapacity(me.stadium.blocks!) - me.stadium.capacity) / me.stadium.capacity < 0.03 && Math.abs(ticketFactor(me) - tf0) < 0.01,
  `Blöcke neu abgeleitet (${me.stadium.capacity}), Ticketfaktor ${tf0.toFixed(3)} → ${ticketFactor(me).toFixed(3)}`);
ok(vipIncome(me, 1, 1996) === vipBefore, `VIP-Plätze bleiben (${vipBefore} → ${vipIncome(me, 1, 1996)})`);

// --- Europapokal ab 1998: nur Sitzplätze ---
const seated = euroCapacity(me.stadium.blocks!, me.stadium.capacity);
ok(seated > seatedCapacity(me.stadium.blocks!) && seated < me.stadium.capacity, `Europapokal-Kapazität ${seated} (Sitze ${seatedCapacity(me.stadium.blocks!)} + halbe Stehränge)`);
me.stadium.averageAttendanceRate = 1;
me.stadium.built = 1990; // Komfort passend zum Jahr 1999 (sonst drückt das alte Baujahr die Nachfrage)
let maxEuro = 0, maxLiga = 0;
for (let s = 1; s <= 20; s++) {
  maxEuro = Math.max(maxEuro, new MatchSim(me, other, g.players, { year: 1999, date: '1999-09-15', seed: s, competition: 'Europapokal' }).attendance);
  maxLiga = Math.max(maxLiga, new MatchSim(me, other, g.players, { year: 1999, date: '1999-09-15', seed: s, competition: 'Liga' }).attendance);
}
const hosp = me.stadium.blocks!.reduce((a, b) => a + (b.vip ? vipAreaSeats(b) : 0) + b.lounges * 11, 0); // VIP-Bereiche/Logen kommen dazu
ok(maxEuro <= seated + hosp && maxLiga > seated, `Europapokal max. ${maxEuro} ≤ ${seated} Plätze + ${hosp} VIP, Liga bis ${maxLiga}`);

// --- Baujahr, Komfort, Anspruch, Bauweise, Neubau (engine/stadiumStandard.ts) ---
{
  const g2 = createNewGame({
    managedClubId: 'mgl', manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  delete (g2 as any).budget;
  const c = g2.clubs[g2.managedClubId];
  const k0 = stadiumComfort(c, 1975)!;
  ok(c.stadium.built != null && Math.abs(k0.factor - 1) < 0.04, `Baujahr ${c.stadium.built} gesetzt, Start fast neutral (Faktor ${k0.factor.toFixed(3)})`);
  ok(fanExpectation(2000) > fanExpectation(1980) && fanExpectation(2060) > fanExpectation(2030) && standardCap(2060) > standardCap(2030), 'Anspruch und Obergrenze steigen, auch nach 2030');
  ok(stadiumComfort(c, 2005)!.factor < k0.factor && stadiumComfort(c, 2040)!.factor >= 0.85, 'altes Stadion verliert mit den Jahren Zuschauer (höchstens 15 %)');
  ok(lookOf(1975) === 0 && lookOf(1995) === 1 && lookOf(2010) === 2 && lookOf(2030) === 3, 'vier Bauweisen nach Jahr');
  // Block im neuen Look: kostet, gilt als Änderung, Komfort-Obergrenze bleibt
  g2.calendar.currentDate = '1995-07-10';
  const cur = c.stadium.blocks!.find((b) => b.id === 'opp_m')!;
  const lookPlan = groupPlanFor(g2, [{ ...clone(cur), look: 1995 }]);
  ok(lookPlan.plan.changed && lookPlan.plan.ok && lookPlan.plan.costBase > 0, `neue Bauweise allein: ${lookPlan.plan.costBase} DM, ${lookPlan.plan.months} Monate`);
  ok(!groupPlanFor(g2, [{ ...clone(cur), look: 1970 }]).plan.costBase, 'gleiche Bauweise (anderes Jahr) kostet nichts');
  // Neubau
  c.finances.balance = 9e8;
  const spec = { capacity: 52000, standing: 1 as const, roof: 'full' as const, lounges: 12, vip: true };
  const rp = rebuildPlanFor(g2, spec);
  ok(!rp.plan.errors.length && Math.abs(rp.plan.capacity - 52000) / 52000 < 0.06 && rp.plan.months >= 18 && rp.plan.months <= 36, `Neubau geplant: ${rp.plan.capacity} Plätze, ${rp.plan.months} Monate, ${rp.cost}`);
  const capBefore = c.stadium.capacity, capOld = standardCap(c.stadium.built!);
  const r = startRebuild(g2, spec, 'cash', 0);
  ok(r.ok && c.stadium.capacity < capBefore && c.stadium.blockProject?.rebuild, `Neubau läuft, solange ${c.stadium.capacity} statt ${capBefore} Plätze`);
  ok(!startRebuild(g2, spec, 'cash', 0).ok, 'kein zweites Bauprojekt gleichzeitig');
  const fin = c.stadium.blockProject!.finishDate;
  g2.calendar.currentDate = fin;
  stadiumDaily(g2, fin);
  const k1 = stadiumComfort(c, Number(fin.slice(0, 4)))!;
  ok(!c.stadium.blockProject && c.stadium.built === Number(fin.slice(0, 4)) && k1.cap > capOld && k1.factor > 1, `eröffnet ${fin}: Baujahr ${c.stadium.built}, Obergrenze ${capOld} → ${k1.cap}, Faktor ${k1.factor.toFixed(3)}`);
  ok(c.stadium.blocks!.length === 14 && c.stadium.blocks!.every((b) => lookOf(b.look ?? 0) === lookOf(1995)) && c.stadium.capacity === blocksCapacity(c.stadium.blocks!), 'alle 14 Blöcke neu in der aktuellen Bauweise');
  ok(c.stadium.vipBoxes === 12 && loungeLimit('main_m', 2016) > loungeLimit('main_m', 2000) && loungeLimit('main_m', 2000) > loungeLimit('main_m', 1964), `Logen ${c.stadium.vipBoxes}, moderne Substanz fasst mehr`);
  ok(planRebuild(c, spec, Number(fin.slice(0, 4)) + 3).errors.length > 0, 'Neubau frühestens nach zehn Jahren');
}

// --- Planungsmodus „Stadion ausbauen“: Entwurf über mehrere Seiten, ein Bauprojekt ---
{
  const g3 = createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  const c = g3.clubs[g3.managedClubId];
  const bl = c.stadium.blocks!;
  const before = JSON.stringify(c.stadium), bal = c.finances.balance;
  const mm = clone(bl.find((b) => b.id === 'main_m')!); mm.tiers.push({ seat: 'bank', rows: 12 });
  const nw = clone(bl.find((b) => b.id === 'north_w')!); nw.roof = 'partial';
  let plan = putInPlan(bl, {}, [mm]);
  plan = putInPlan(bl, plan, sideTargets(applyPlan(bl, plan), nw, true));
  plan = putInPlan(bl, plan, [clone(bl.find((b) => b.id === 'curve_se')!)]); // unverändert → kein Eintrag
  const list = planList(bl, plan);
  ok(list.length === 3 && list.map((t) => t.id).join() === 'main_m,north_w,north_e', `Entwurf: ${list.map((t) => t.id).join(', ')}`);
  const sum = summarize(g3, bl, plan, 20, null, 'parallel'); // bisheriger Ablauf: alles gleichzeitig
  ok(JSON.stringify(c.stadium) === before && c.finances.balance === bal, 'Planen verändert weder Stadion noch Kontostand');
  const grp = groupPlanFor(g3, list);
  ok(sum.cost === grp.cost && sum.months === grp.plan.months && sum.capAfter === blocksCapacity(applyPlan(bl, plan)), `Summe = Engine: ${sum.cost}, ${sum.months} Mon., ${sum.capBefore} → ${sum.capAfter}`);
  ok(sum.months === Math.min(24, Math.max(...list.map((t) => groupPlanFor(g3, [t]).plan.months)) + 2), 'Bauzeit: längster Block + 1 Monat je weiterem');
  ok((sum.capsAfter.dach ?? 0) > (sum.capsBefore.dach ?? 0), `überdachte Sitze ${sum.capsBefore.dach} → ${sum.capsAfter.dach}`);
  const r = startBlockBuild(g3, sum.targets, 'loan', 20);
  ok(r.ok === !sum.blocker, `Bauen wie geprüft: ${r.text}`);
  if (r.ok) {
    const bp = c.stadium.blockProject!;
    ok(bp && 1 + (bp.more?.length ?? 0) === 3 && bp.capacityLoss === sum.loss, `ein Bauprojekt für 3 Blöcke, ${bp.capacityLoss} Plätze gesperrt`);
    ok(buildBlocker(g3, 1, 'cash', 0) === 'Es läuft bereits ein Umbau im Stadion.', 'Prüfung meldet den laufenden Umbau');
    g3.calendar.currentDate = bp.finishDate; stadiumDaily(g3, bp.finishDate);
    ok(!c.stadium.blockProject && c.stadium.capacity === sum.capAfter, `fertig: ${c.stadium.capacity} Plätze wie geplant`);
    ok(planList(c.stadium.blocks!, plan).length === 0, 'nach Fertigstellung ist der Entwurf erfüllt');
  }
}

// --- Ausstattung, Fan-Tribünen, Bauablauf (Wunsch Pascal) ---
{
  const mk = () => {
    const gx = createNewGame({
      managedClubId: 'mgl',
      manager: { name: 'Test', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'newcomer' } as any,
      difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
    });
    delete (gx as any).budget;
    gx.clubs[gx.managedClubId].finances.balance = 5e8;
    return gx;
  };
  const year = 1975;
  // Ausstattung: abgeleitet ohne Änderung, Bau nur Ausstattung, Wirkung auf Komfort und Banden
  {
    const gx = mk(); const c = gx.clubs[gx.managedClubId];
    const comfort0 = stadiumComfort(c, year)!;
    ok(Math.abs(comfort0.inside + comfort0.outside - comfort0.comfort) < 0.2 && comfort0.insideMax > comfort0.inside, `Komfort geteilt: Stadion ${comfort0.inside} + Umfeld ${comfort0.outside} = ${comfort0.comfort}`);
    const x0 = extrasOf(c, year);
    const banden0 = bandenFactor(c, year);
    const x1 = { ...x0, board: 'elektro' as const, spots: ['north', 'south'] as BoardSpot[], track: !x0.track };
    const r = startStadiumBuild(gx, [], x1, 'parallel', 'cash', 0);
    ok(r.ok, `nur Ausstattung bauen: ${r.text}`);
    const bp = c.stadium.blockProject!;
    gx.calendar.currentDate = bp.finishDate; stadiumDaily(gx, bp.finishDate);
    ok(!c.stadium.blockProject && c.stadium.extras?.board === 'elektro' && c.stadium.extras.spots.length === 2, 'Ausstattung nach Fertigstellung gespeichert');
    c.stadium.extras = { ...c.stadium.extras!, ads: 'led' };
    ok(bandenFactor(c, year) > banden0 * 1.15, `LED-Banden: Bandenwert ${banden0.toFixed(3)} → ${bandenFactor(c, year).toFixed(3)}`);
    c.stadium.extras = { ...c.stadium.extras!, ads: x0.ads };
    const c2 = stadiumComfort(c, year)!;
    ok(c2.parts.find((p) => p.key === 'board')!.value >= comfort0.parts.find((p) => p.key === 'board')!.value, 'zwei elektronische Tafeln: Komfortteil Anzeigetafel nicht kleiner');
    ok(planExtras(x1, { ...x1, board: 'cube', spots: ['center'] }, 2010, c.stadium.blocks!).errors.length > 0, 'Videowürfel ohne volles Dach über den Geraden wird abgelehnt');
    ok(planExtras(x1, { ...x1, board: 'video' }, 1980, c.stadium.blocks!).errors.length > 0, 'Videowand 1980 noch nicht erhältlich');
  }
  // Gästeblock auf der Haupttribüne nimmt dort Plätze, Fankurve mit günstigen Stehplätzen hebt die Stimmung
  {
    const gx = mk(); const c = gx.clubs[gx.managedClubId];
    const capsA = capsFor(c, 1990).caps; // eigener Gästeblock ab 1984
    c.stadium.fans = { away: 'haupt' };
    const capsB = capsFor(c, 1990).caps;
    ok((capsB.gast ?? 0) === (capsA.gast ?? 0) && (capsB.steh ?? 0) >= (capsA.steh ?? 0), `Gästeblock Haupttribüne: Steh ${capsA.steh} → ${capsB.steh}, Gäste ${capsB.gast}`);
    const sc = standCaps(c, capsB)!; const raw = rawStandCaps(c)!;
    const rawHaupt = raw.haupt.steh + raw.haupt.sitz + raw.haupt.dach + raw.haupt.premium;
    const scHaupt = (sc.haupt.steh ?? 0) + (sc.haupt.sitz ?? 0) + (sc.haupt.dach ?? 0) + (sc.haupt.premium ?? 0);
    ok(scHaupt < rawHaupt, `Tribünenkontingent Haupttribüne ${rawHaupt} → ${scHaupt}`);
    const stand = (['tor1', 'tor2', 'ecke1', 'ecke2', 'ecke3', 'ecke4'] as const).find((s) => raw[s].steh > 0.5 * (raw[s].steh + raw[s].sitz + raw[s].dach))!;
    c.stadium.fans = { away: 'haupt', home: stand };
    const cheap = fanStandMood(c, year, 'ger')!;
    const s = ensureSeating(c, year); s.tickets = { ...(s.tickets ?? {} as any), stand: { [stand]: { steh: refPrice(c, 'steh', year) * 1.6 } } } as any;
    const dear = fanStandMood(c, year, 'ger')!;
    ok(cheap.mood > 0 && dear.mood < cheap.mood, `Fankurve: Richtpreis ${cheap.mood} · teuer ${dear.mood}`);
    const eng = fanStandMood(c, 2000, 'eng')!;
    ok(!eng.standing && Math.abs(eng.mood) <= 3, `England 2000: kein Stehen, halbe Wirkung (${eng.mood})`);
  }
  // Bauablauf: Etappen (immer ein Teil offen) und Ausweichstadion
  {
    const gx = mk(); const c = gx.clubs[gx.managedClubId]; const bl = c.stadium.blocks!;
    const t = bl.filter((b) => b.id === 'north_w' || b.id === 'south_w' || b.id === 'main_m').map((b) => ({ ...clone(b), roof: 'full' as const }));
    const par = buildPlanFor(gx, t, null, 'parallel'), stg = buildPlanFor(gx, t, null, 'stages'), awy = buildPlanFor(gx, t, null, 'away');
    ok(stg.months > par.months && stg.cost > par.cost && stg.stages.length === 3, `Etappen: ${stg.stages.length} Etappen, ${stg.months} statt ${par.months} Mon.`);
    ok(awy.months <= par.months && awy.cost < par.cost && !!awy.away, `Ausweichstadion: ${awy.away?.name}, ${awy.away?.capacity} Plätze, ${awy.months} Mon.`);
    const cap0 = c.stadium.capacity;
    const r = startStadiumBuild(gx, t, null, 'stages', 'cash', 0);
    ok(r.ok, `Etappenbau starten: ${r.text}`);
    const bp = c.stadium.blockProject!;
    ok(c.stadium.capacity >= cap0 * 0.5 && bp.stages?.length === 3, `während Etappe 1 offen: ${c.stadium.capacity} von ${cap0}`);
    let d = gx.calendar.currentDate;
    while (d < bp.stages![0].finish) d = addMonths(d, 1);
    stadiumDaily(gx, bp.stages![0].finish);
    ok(bp.stages![0].done && c.stadium.blocks!.find((b) => b.id === stg.stages[0].ids[0])!.roof === 'full', 'Etappe 1 fertig: Block umgebaut, nächste Etappe gesperrt');
    stadiumDaily(gx, bp.finishDate);
    ok(!c.stadium.blockProject && c.stadium.blocks!.filter((b) => t.some((x) => x.id === b.id)).every((b) => b.roof === 'full'), 'alle Etappen fertig');
  }
}

console.log(fails ? `\n${fails} Fehler` : '\nAlle Stadion-Tests bestanden.');
process.exit(fails ? 1 : 0);
