// Vertragsverhandlung 2.0 ohne UI (engine/contractNegotiation.ts, game/contractTalk.ts,
// game/contractClausesGame.ts):
//   1) Forderungen je Epoche und Persönlichkeit (Bausteine freigeschaltet, Laufzeit-Wünsche)
//   2) Paketlogik: Handgeld statt Gehalt bei Geldgierigen lohnt, bei anderen weniger
//   3) Geduld/Abbruch: Beleidigung kostet viel, Abbruch sperrt und senkt die Moral
//   4) Abschluss: Vertrag, Bausteine, Buchung Handgeld/Provision (nominal), Zusagen, Budgetgrenze
//   5) Prämien im Spielablauf (Einsatz/Tor, Titel, Abstiegsklausel, Staffelung), Optionen, festgeschriebene Ablöse
//   6) Migration (idempotent) und Determinismus
//   node scripts/run-ts.mjs tests/contracts2-test.ts
import { createNewGame } from '../src/game/newGame';
import { Game } from '../src/game/state';
import { buildDemand, ContractTerms, packageCost, packageValue } from '../src/engine/contractNegotiation';
import { openRenewal, renewCtx, submitRenewal, NegState } from '../src/game/contractTalk';
import { contractBonusesDaily, contractSeasonStart, contractSeasonEndDaily, exerciseClubOption, migrateContracts2, termsOfContract, applyContractExtras } from '../src/game/contractClausesGame';
import { handleContractExpiry } from '../src/game/contracts';
import { personaOf } from '../src/engine/persona';
import { economyScale } from '../src/engine/economy';
import { Player } from '../src/types';

let seed = 11;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

function fresh(): Game {
  const g = createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  (g as any).briefing = undefined;
  return g;
}
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const ok = (c: unknown, msg: string) => { if (!c) fail(msg); };
const squadOf = (g: Game) => g.clubs[g.managedClubId].playerIds.map((id) => g.players[id]).filter(Boolean);

/** Spieler mit offenem Gespräch vorbereiten (Vertrag endet zum Saisonende, zufrieden). */
function prep(g: Game, p: Player, date: string): void {
  g.calendar.currentDate = date;
  const end = Number(date.slice(5, 7)) >= 7 ? Number(date.slice(0, 4)) + 1 : Number(date.slice(0, 4));
  p.contract.expiryDate = `${end}-06-30`;
  p.contract.satisfaction = 70;
  p.contract.talks = undefined;
  p.morale = 'good';
  g.clubs[g.managedClubId].finances.transferBudget = 5_000_000;
  g.clubs[g.managedClubId].finances.wageBudget = 1e9;
}

// ---------------------------------------------------------------- 1) Forderungen je Epoche
const g = fresh();
const sq = squadOf(g).sort((a, b) => b.overall - a.overall);
console.log('1) Forderungen je Epoche/Persönlichkeit');
for (const year of [1976, 1987, 1994, 1998, 2004, 2020]) {
  for (const p of [sq[0], sq.find((x) => x.age <= 22) ?? sq[5], sq.find((x) => x.age >= 31) ?? sq[3]]) {
    prep(g, p, `${year}-02-01`);
    const { ctx, legacy } = renewCtx(g, p);
    const d = buildDemand(p, ctx);
    const pe = personaOf(p);
    console.log(`  ${year} ${p.lastName.padEnd(12)} ${p.age} J. ehr ${pe.ehrgeiz} geld ${pe.geld} | ${legacy.mood.padEnd(9)} fair ${ctx.fairWage} ask ${d.ask.wage} | Lz ${d.range.join('-')} ideal ${d.ideal} | Punkte ${d.keys.length} | Berater ${ctx.agent ? 'ja' : 'nein'}`);
    ok(d.keys.includes('fixedFee') === (year <= 1995), `festgeschriebene Ablöse nur bis 1995 (${year})`);
    ok(d.keys.includes('release') === (year >= 1996), `Ausstiegsklausel erst ab 1996 (${year})`);
    ok(d.keys.includes('option') === (year >= 1990), `Option erst ab 1990 (${year})`);
    ok(d.keys.includes('raise') === (year >= 1985), `Staffelung erst ab 1985 (${year})`);
    ok(d.reservation > 0 && Number.isFinite(d.reservation), 'Schwelle gültig');
    ok(packageValue(d.ask, d, ctx) >= d.reservation * 0.999, 'Eröffnungsforderung erfüllt seine Schwelle');
    if (p.age >= 33) ok(d.range[1] <= 3, 'Routinier will keine fünf Jahre');
  }
}

// ---------------------------------------------------------------- 2) Paketlogik
console.log('2) Paketlogik');
{
  const g2 = fresh();
  const list = squadOf(g2);
  const greedy = [...list].sort((a, b) => personaOf(b).geld - personaOf(a).geld + (b.age - a.age) * 2)[0];
  const modest = [...list].sort((a, b) => personaOf(a).geld - personaOf(b).geld)[0];
  for (const [label, p] of [['Geldgierig', greedy], ['Bescheiden', modest]] as const) {
    prep(g2, p, '1980-02-01');
    const { ctx } = renewCtx(g2, p);
    const d = buildDemand(p, ctx);
    const base: ContractTerms = { ...d.fair };
    const shift = Math.round(d.fair.wage * 0.08);
    const pkg: ContractTerms = { ...base, wage: base.wage - shift, signing: base.signing + shift * 52 * base.years };
    const dv = packageValue(pkg, d, ctx) - packageValue(base, d, ctx);
    const dc = packageCost(pkg, ctx).total - packageCost(base, ctx).total;
    console.log(`  ${label.padEnd(10)} ${p.lastName} geld ${personaOf(p).geld} alter ${p.age}: Handgeld statt Gehalt Wert ${dv.toFixed(1)} / Kosten ${dc.toFixed(0)}`);
    if (label === 'Geldgierig') ok(dv > 0, 'Geldgieriger bewertet Handgeld höher als Gehalt');
  }
}

// ---------------------------------------------------------------- 3) Geduld, Beleidigung, Abbruch
console.log('3) Geduld und Abbruch');
{
  const g3 = fresh();
  const p = squadOf(g3).sort((a, b) => b.overall - a.overall)[2];
  prep(g3, p, '1983-01-10');
  const st = openRenewal(g3, p.id);
  ok(typeof st !== 'string', 'Gespräch offen: ' + st);
  const s = st as NegState;
  const start = s.patience;
  const moraleBefore = p.moraleScore ?? 60;
  const low = { ...termsOfContract(p, 3), wage: Math.round(p.contract.weeklyWage * 0.5) };
  const r1 = submitRenewal(g3, p.id, low);
  ok(!r1.ok, 'Beleidigendes Angebot abgelehnt');
  ok(s.patience <= start - 40, `Beleidigung kostet viel Geduld (${start} → ${s.patience})`);
  ok(s.ask.wage > 0, 'Gegenangebot vorhanden');
  let rounds = 1;
  while (s.status === 'open' && rounds < 10) { submitRenewal(g3, p.id, low); rounds++; }
  ok(s.status === 'failed', 'Nach zu vielen schlechten Angeboten bricht er ab');
  ok(!!p.contract.talks?.blockedUntil && p.contract.talks.blockedUntil > g3.calendar.currentDate, 'Sperre gesetzt');
  ok((p.moraleScore ?? 60) < moraleBefore, 'Moral sinkt nach Abbruch');
  ok(typeof openRenewal(g3, p.id) === 'string' || (openRenewal(g3, p.id) as NegState).status === 'failed', 'Während der Sperre kein neues Gespräch');
  console.log(`  ${p.lastName}: ${rounds} Runden, Geduld ${start} → ${s.patience}, gesperrt bis ${p.contract.talks?.blockedUntil}`);
  console.log('  Verlauf:', s.log.slice(0, 6).map((l) => `${l.who}: ${l.text}`).join(' | '));
}

// ---------------------------------------------------------------- 4) Abschluss + Buchungen
console.log('4) Abschluss');
{
  const g4 = fresh();
  const p = squadOf(g4).filter((x) => ['MS', 'HS', 'RA', 'LA', 'OM'].includes(x.naturalPosition)).sort((a, b) => b.overall - a.overall)[0];
  prep(g4, p, '1979-10-01');
  const st = openRenewal(g4, p.id) as NegState;
  const fin = g4.clubs[g4.managedClubId].finances;
  const bal = fin.balance, tb = fin.transferBudget;
  const deal: ContractTerms = { ...st.ask, signing: Math.max(st.ask.signing, 5000), appearance: 300, goal: 500, title: 2000, promises: [...st.ask.promises] };
  const r = submitRenewal(g4, p.id, deal);
  ok(r.ok, 'Forderung + Extras angenommen: ' + r.text);
  ok(p.contract.weeklyWage === deal.wage, 'Gehalt übernommen');
  ok(p.contract.appearanceBonus === 300 && p.contract.goalBonus === 500 && p.contract.titleBonus === 2000, 'Prämien im Vertrag');
  const scale = economyScale(1979);
  ok(Math.abs((bal - fin.balance) - Math.round(deal.signing * scale) - Math.round(deal.agent * scale)) <= 2, 'Handgeld/Provision nominal gebucht');
  ok(Math.abs(tb - fin.transferBudget - deal.signing - deal.agent) < 1, 'Transferbudget belastet (1975-Basis)');
  ok(p.contract.expiryDate >= '1983-06-30', 'Laufzeit ab nächster Saison: ' + p.contract.expiryDate);
  ok(!p.contract.talks || p.contract.talks.neg?.status === 'agreed', 'Gesprächsstand abgeschlossen');
  console.log(`  ${r.text} (${p.contract.expiryDate})`);
  // Prämien nach Spielen
  const b2 = fin.balance;
  p.seasonStats.appearances += 3; p.seasonStats.goals += 2;
  contractBonusesDaily(g4, g4.calendar.currentDate);
  ok(Math.abs((b2 - fin.balance) - Math.round((3 * 300 + 2 * 500) * scale)) <= 2, 'Einsatz-/Torprämien gebucht');
  contractBonusesDaily(g4, g4.calendar.currentDate);
  ok(Math.abs((b2 - fin.balance) - Math.round((3 * 300 + 2 * 500) * scale)) <= 2, 'Prämien nicht doppelt');
  // Gehaltsbudget hart
  const q = squadOf(g4).sort((a, b) => b.overall - a.overall)[4];
  prep(g4, q, '1979-10-02');
  g4.clubs[g4.managedClubId].finances.wageBudget = squadOf(g4).reduce((s, x) => s + x.contract.weeklyWage, 0);
  g4.budget = { ...(g4.budget ?? {} as any), plan: undefined } as any;
  const before = q.contract.weeklyWage;
  const rr = submitRenewal(g4, q.id, { ...termsOfContract(q, 3), wage: before * 3 });
  ok(rr.refused && q.contract.weeklyWage === before, 'Gehaltsbudget-Grenze greift: ' + rr.text);
}

// ---------------------------------------------------------------- 5) Klauseln im Spielablauf
console.log('5) Klauseln im Spielablauf');
{
  const g5 = fresh();
  const club = g5.clubs[g5.managedClubId];
  const [a, b, c] = squadOf(g5);
  g5.calendar.currentDate = '1988-08-01';
  migrateContracts2(g5);
  applyContractExtras(g5, a, { ...termsOfContract(a, 3), relegation: 0.2 }, '1988-08-01', true);
  applyContractExtras(g5, b, { ...termsOfContract(b, 3), raise: 0.05 }, '1988-08-01', true);
  applyContractExtras(g5, c, { ...termsOfContract(c, 3), stay: 1000, title: 3000 }, '1988-08-01', true);
  const wa = a.contract.weeklyWage, wb = b.contract.weeklyWage;
  g5.table.rows.sort((x, y) => (x.clubId === club.id ? -1 : y.clubId === club.id ? 1 : 0));
  const bal = club.finances.balance;
  contractSeasonEndDaily(g5, '1989-06-29');
  ok(club.finances.balance < bal, 'Titelprämie bei Platz 1 gebucht');
  ok((g5.contracts2?.stayPending?.length ?? 0) === 1, 'Klassenerhalt vorgemerkt');
  // Abstieg simulieren
  g5.contracts2!.lastTier = 1;
  (g5 as any).leagues = { ...(g5.leagues ?? {}), playerDivision: { ...(g5.leagues?.playerDivision ?? {}), tier: 2 } };
  g5.season = '1989/90';
  const bal2 = club.finances.balance;
  contractSeasonStart(g5);
  ok(Math.abs(a.contract.weeklyWage - wa * 0.8) < 0.01, 'Abstiegsklausel kürzt um 20 %');
  ok(Math.abs(b.contract.weeklyWage - wb * 1.05) < 0.01, 'Staffelung +5 %');
  ok(club.finances.balance === bal2, 'Kein Klassenerhalt nach Abstieg');
  contractSeasonStart(g5);
  ok(Math.abs(b.contract.weeklyWage - wb * 1.05) < 0.01, 'Staffelung nur einmal je Saison');
  // Vereinsoption
  const d = squadOf(g5)[5];
  d.contract.expiryDate = '1990-06-30'; d.contract.option = 'club';
  g5.calendar.currentDate = '1990-03-01';
  const txt = exerciseClubOption(g5, d.id);
  ok(d.contract.expiryDate === '1991-06-30', 'Vereinsoption verlängert um ein Jahr: ' + txt);
  // Spieleroption + festgeschriebene Ablöse am Vertragsende
  const e = squadOf(g5)[6], f = squadOf(g5)[7];
  e.contract.expiryDate = '1990-06-30'; e.contract.option = 'player'; e.contract.satisfaction = 90;
  f.contract.expiryDate = '1990-06-30'; f.contract.fixedFee = 12345; f.contract.satisfaction = 20;
  e.age = Math.min(e.age, 30); f.age = Math.min(f.age, 30);
  const fin = club.finances.balance;
  handleContractExpiry(g5, '1990-07-01');
  ok(e.clubId === club.id && e.contract.expiryDate === '1991-06-30', 'Zufriedener Spieler zieht seine Option');
  if (f.clubId !== club.id) {
    const got = club.finances.balance - fin;
    ok(Math.abs(got - Math.round(12345 * economyScale(1990))) <= 2, `Festgeschriebene Ablöse gezahlt (${got})`);
    ok(!f.contract.fixedFee && !f.contract.appearanceBonus, 'Bausteine nach Wechsel gelöscht');
  }
}

// ---------------------------------------------------------------- 6) Migration + Determinismus
console.log('6) Migration, Determinismus');
{
  const g6 = fresh();
  delete (g6 as any).contracts2;
  const p = squadOf(g6)[0];
  p.contract.talks = { season: '1975', attempts: 1, neg: { broken: true } as any };
  migrateContracts2(g6);
  const once = JSON.stringify(g6.contracts2) + JSON.stringify(p.contract);
  migrateContracts2(g6);
  ok(once === JSON.stringify(g6.contracts2) + JSON.stringify(p.contract), 'Migration idempotent');
  ok(!p.contract.talks?.neg, 'Kaputter Gesprächsstand verworfen');
  const run = () => {
    const gx = fresh();
    const q = squadOf(gx).sort((a, b) => b.overall - a.overall)[3];
    prep(gx, q, '1985-02-01');
    const st = openRenewal(gx, q.id) as NegState;
    const t = { ...termsOfContract(q, 3), wage: Math.round(st.ask.wage * 0.85) };
    submitRenewal(gx, q.id, t);
    submitRenewal(gx, q.id, { ...st.ask });
    return JSON.stringify({ log: st.log, ask: st.ask, w: q.contract.weeklyWage, s: st.status });
  };
  ok(run() === run(), 'Gleiche Eingaben → gleiche Verhandlung');
}
console.log('OK: Vertragsverhandlung 2.0');
process.exit(0);
