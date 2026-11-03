// =============================================================================
// Saisonbudget ohne UI (game/budgetPlan.ts, game/budgetForecast.ts):
//  1) Plan zu Spielbeginn, Vorschlag des Beraters, Texte
//  2) Wirkung: Transferbudget, Gehaltsgrenze (Vertrag), Infrastruktur/Jugend-Rahmen
//  3) Migration alter Spielstände (idempotent)
//  4) Prognosegüte je Epoche 1975/1990/2005/2020 gegen die tatsächlichen Einnahmen
//     aller Erstligisten im Sim (Abweichung je Bereich).
//   npm run test:budget          (UNTIL_YEAR=1990 für einen kurzen Lauf)
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason, leagueClubs } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { economyScale, yearOf } from '../src/engine/economy';
import { Game } from '../src/game/state';
import {
  applyBudget, budgetRoom, checkBudget, confirmBudget, migrateBudget, planFor, plannedReserve, reactionsFor, wageLimitFactor,
} from '../src/game/budgetPlan';
import { forecastSeason, IncomeArea, INCOME_AREAS, sumIncome } from '../src/game/budgetForecast';
import { advisorFor, advisorOf, seasonGoals } from '../src/game/budgetView';
import { offerContract } from '../src/game/contracts';
import { startUpgrade, quoteUpgrade } from '../src/game/youthInvest';
import { YOUTH_BLOCKS } from '../src/engine/youthAcademy';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };
const M = (v: number) => `${(v / 1e6).toFixed(2)} Mio.`;
const med = (xs: number[]) => { const t = [...xs].sort((a, b) => a - b); return t[t.length >> 1] ?? 0; };

const g: Game = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const me = g.clubs[g.managedClubId];
const scale = economyScale(1975);

// --- 1) Plan zu Spielbeginn -------------------------------------------------------------
const p = planFor(g)!;
ok(!!p && g.budget?.pending === g.season, `Plan ${p?.season} angelegt und zum Anzeigen vorgemerkt`);
const rev = sumIncome(p.income);
ok(rev > 2_500_000 && rev < 9_000_000, `Erwartete Einnahmen 1975/76 ${M(rev)} (Recherche Erstligist 2,5–9 Mio.)`);
ok(p.income.tickets / rev > 0.45, `Spieltag ${Math.round(p.income.tickets / rev * 100)} % der Einnahmen (1975 Hauptsäule)`);
ok(p.advice.wages > 0.5 * rev && p.advice.wages < 0.8 * rev, `Gehaltsvorschlag ${M(p.advice.wages)} ≈ 60 % + Mitarbeiter`);
ok(plannedReserve(p, p.advice) >= p.reserveMin - 1, `Vorschlag hält die Reserve (${M(plannedReserve(p, p.advice))} ≥ ${M(p.reserveMin)})`);
ok(Math.abs(me.finances.transferBudget * scale - p.advice.transfers) < 2000, `Transferbudget = Vorschlag (${M(p.advice.transfers)})`);
const adv = advisorFor(g, p, p.chosen);
ok(adv.lines.length >= 3 && adv.lines.length <= 7 && adv.era.includes('1973'), `Berater: ${adv.lines.length} Sätze + Epoche („${adv.era.slice(0, 60)}…“)`);
ok(!!advisorOf(g).name && seasonGoals(g).length >= 1, `Berater ${advisorOf(g).name} (${advisorOf(g).role}), Ziele: ${seasonGoals(g).map((s) => `${s.title}: ${s.goal}`).join(', ')}`);
ok(wageLimitFactor(g) === 1, 'Mit Plan gilt das Gehaltsbudget als harte Grenze');

// --- 2) Wirkung ---------------------------------------------------------------------------
const tb0 = me.finances.transferBudget, conf0 = me.boardConfidence ?? 60;
confirmBudget(g, { ...p.chosen, transfers: p.chosen.transfers + 500_000 });
ok(Math.abs(me.finances.transferBudget - (tb0 + 500_000 / scale)) < 1001, `Mehr Transferbudget wirkt (${Math.round(tb0)} → ${Math.round(me.finances.transferBudget)})`);
const r = reactionsFor(g, p, p.chosen);
console.log(`     Reaktionen: Vorstand ${r.board}, Fans ${r.fans}, Sponsoren ${r.sponsors}; Vertrauen ${conf0} → ${me.boardConfidence}`);
confirmBudget(g, { ...p.chosen, transfers: p.advice.transfers });
ok(Math.abs(me.finances.transferBudget - tb0) < 1001 && me.boardConfidence === conf0, 'Zurück auf den Vorschlag: Budget und Vertrauen wie vorher (kein Stapeln)');

// Gehaltsgrenze: Budget = laufende Kosten → keine Erhöhung.
confirmBudget(g, { ...p.chosen, wages: p.fixed.personnel * 0.98 });
const star = me.playerIds.map((id) => g.players[id]).sort((a, b) => b.overall - a.overall)[0];
const res = offerContract(g, star.id, star.contract.weeklyWage * 1.5, 3);
ok(!res.ok && /Gehaltsbudget/.test(res.text), `Vertragsverlängerung über dem Gehaltsbudget gesperrt („${res.text.slice(0, 70)}…“)`);
confirmBudget(g, { ...p.chosen, wages: p.advice.wages });

// Infrastruktur/Jugend.
confirmBudget(g, { ...p.chosen, infra: 0, youth: p.fixed.youthRunning });
ok(!!checkBudget(g, 'infra', 100_000), 'Infrastruktur-Budget 0: Bauvorhaben gesperrt');
const yk = YOUTH_BLOCKS.find((b) => quoteUpgrade(me, b.key, 1975).ok && quoteUpgrade(me, b.key, 1975).build > 0);
if (yk) {
  const msg = startUpgrade(g, me, yk.key, g.calendar.currentDate);
  ok(/Jugendbudget/.test(msg), `Akademie-Ausbau ohne Jugendbudget gesperrt („${msg.slice(0, 60)}…“)`);
}
confirmBudget(g, { ...p.chosen, infra: 2_000_000, youth: p.fixed.youthRunning + 1_000_000 });
ok((budgetRoom(g, 'infra') ?? 0) >= 1_999_000 && !checkBudget(g, 'infra', 100_000), 'Mit Infrastruktur-Budget ist Bauen erlaubt');
if (yk) {
  const bal = me.finances.balance;
  const msg = startUpgrade(g, me, yk.key, g.calendar.currentDate);
  ok(!/Jugendbudget/.test(msg) && me.finances.balance < bal && p.spent.youth > 0, `Akademie-Ausbau gebucht und aufs Jugendbudget gezählt (${M(p.spent.youth)})`);
}
confirmBudget(g, { ...p.advice });

// --- 3) Migration ---------------------------------------------------------------------------
const old = JSON.parse(JSON.stringify(g)) as Game;
delete old.budget;
const wb = old.clubs[old.managedClubId].finances.wageBudget, tbo = old.clubs[old.managedClubId].finances.transferBudget;
migrateBudget(old);
const op = planFor(old);
ok(!!op && !old.budget?.pending, 'Alter Spielstand: Plan angelegt, kein Popup');
ok(old.clubs[old.managedClubId].finances.wageBudget === wb && old.clubs[old.managedClubId].finances.transferBudget === tbo, 'Migration ändert keine Budgets');
const snap = JSON.stringify(old.budget);
migrateBudget(old);
ok(JSON.stringify(old.budget) === snap, 'Zweiter Aufruf ändert nichts (idempotent)');
applyBudget(old, op!, op!.chosen);
ok(Math.abs(old.clubs[old.managedClubId].finances.transferBudget - tbo) <= 1000, 'Übernommener Plan reproduziert das Transferbudget');

// --- 4) Prognosegüte je Epoche --------------------------------------------------------------
(g as any).simAutoManage = true;
const until = Number(process.env.UNTIL_YEAR ?? 2020);
const CHECK = new Set([1975, 1990, 2005, 2020].filter((y) => y <= until));
type Snap = { id: string; f: Record<IncomeArea, number> };
let snapNow: Snap[] | null = null;
const takeSnap = () => leagueClubs(g).filter((c) => (c.finances.leagueTier ?? 1) === 1)
  .map((c) => ({ id: c.id, f: forecastSeason(g, c).income }));
snapNow = takeSnap();
let ownForecast = sumIncome(planFor(g)!.income);
let guard = 0;
for (;;) {
  const y = yearOf(g.calendar.currentDate);
  while (!CalendarEngine.isSeasonOver(g.calendar)) { processDay(g, HEADLESS_UI); if (++guard > 40000) throw new Error('Saison endet nicht'); }
  const season = g.season;
  startNextSeason(g);
  if (CHECK.has(y) && snapNow) {
    const devs: number[] = [];
    const area: Record<string, number[]> = {};
    for (const s of snapNow) {
      const h = g.clubs[s.id]?.finances.seasonHistory?.at(-1);
      if (!h || h.season !== season) continue;
      const fc = sumIncome(s.f);
      devs.push(fc / Math.max(1, h.revenue) - 1);
      const act: Record<IncomeArea, number> = {
        tv: h.income.tvMoney, sponsor: h.income.sponsorship + (h.income.advertising ?? 0) + (h.income.commercial ?? 0),
        tickets: h.income.ticketSales + (h.income.catering ?? 0) + (h.income.matchday ?? 0), merch: h.income.merchandise,
        members: h.income.membership ?? 0, prizes: h.income.prizeMoney, other: h.income.other,
      };
      for (const a of INCOME_AREAS) (area[a.key] ??= []).push(s.f[a.key] / Math.max(1, act[a.key]) - 1);
    }
    const mAbs = med(devs.map(Math.abs));
    const ownAct = g.clubs[g.managedClubId].finances.seasonHistory?.at(-1);
    const ownDev = ownAct ? ownForecast / Math.max(1, ownAct.revenue) - 1 : 0;
    console.log(`     ${season}: ${devs.length} Erstligisten, Abweichung Prognose ↔ Ist im Median ${Math.round(med(devs) * 100)} % (|…| ${Math.round(mAbs * 100)} %), eigener Verein ${Math.round(ownDev * 100)} %`);
    console.log(`       je Bereich (Median): ${INCOME_AREAS.map((a) => `${a.label} ${Math.round(med(area[a.key] ?? [0]) * 100)} %`).join(' · ')}`);
    ok(mAbs < 0.2, `${season}: Prognose im Median auf ±20 % genau (${Math.round(mAbs * 100)} %)`);
    const cp = planFor(g, season);
    ok(!!cp?.result, `${season}: Saisonbilanz des Plans geschrieben`);
  }
  if (y >= until) break;
  snapNow = CHECK.has(y + 1) ? takeSnap() : null;
  ownForecast = sumIncome(planFor(g)?.income ?? { tv: 0, sponsor: 0, tickets: 0, merch: 0, members: 0, prizes: 0, other: 0 });
}

if (fails) { console.log(`\n${fails} Prüfung(en) fehlgeschlagen.`); process.exit(1); }
console.log('\nBudget-Test bestanden.');
