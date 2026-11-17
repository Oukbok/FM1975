// =============================================================================
// Leihen ohne UI (Wunsch Pascal): Regeln je Epoche, Ausleihen am Verhandlungstisch
// (Ablehnung von Stammspielern, Einsatzgarantie für Talente, Vollzug im Fenster bzw.
// zum nächsten Fenster), Verleihen (Leihliste → Angebot → Annehmen/Mehr fordern),
// Kaufoption, Kaufpflicht, Einsatzgarantie mit Strafzahlung, Rückruf, Gehaltsanteil,
// Halbjahresleihe, Grenzen je Epoche, kein Einsatz gegen den Stammverein, Speichern/Laden.
//   npm run test:loans
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { loanRulesFor } from '../src/data/loanRules';
import { expectedRole, loanStats, type LoanTerms } from '../src/engine/loanDeal';
import { resolveLineup } from '../src/engine/match/team';
import { loanCandidates } from '../src/game/aiLoans';
import { aiLoansDaily } from '../src/game/aiLoans';
import { contractClausesDaily } from '../src/game/playerWishesGame';
import { chooseEventOption } from '../src/game/eventsGame';
import { answerIncoming, incomingOffers } from '../src/game/incomingOffers';
import { loanLifeDaily, loanLimitBlocker, makeLoan, recallLoan } from '../src/game/loanLife';
import { loanMarketDaily, toggleLoanListed } from '../src/game/loanMarket';
import { draftTerms, loanOffer, loanTalksDaily, startLoanTalk, type LoanTalk } from '../src/game/loanTalks';
import { loadGameSync as loadGame, saveGameSync as saveGame } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import type { Game } from '../src/game/state';
import type { Player } from '../src/types';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
  clear: () => store.clear(),
};
let seed = 7;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };

function fresh(year = 1975): Game {
  const g = createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  g.season = `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
  g.calendar.currentDate = `${year}-07-10`;
  const own = g.clubs[g.managedClubId];
  own.finances.transferBudget = 50_000_000; own.finances.wageBudget = 20_000_000;
  // Spielstand von 1975 in eine andere Saison versetzt: Verträge mitziehen.
  if (year > 1975) for (const p of Object.values(g.players)) p.contract.expiryDate = `${year + 3}-06-30`;
  return g;
}
const squad = (g: Game, id: string) => g.clubs[id].playerIds.map((x) => g.players[x]).filter(Boolean) as Player[];
const otherClubs = (g: Game) => Object.values(g.clubs).filter((c) => c.id !== g.managedClubId && !c.id.startsWith('eu_') && c.playerIds.length >= 18);

// 1) Regeln je Epoche ---------------------------------------------------------
{
  const r75 = loanRulesFor(1975), r95 = loanRulesFor(1995), r22 = loanRulesFor(2022), r23 = loanRulesFor(2023), r24 = loanRulesFor(2024), r25 = loanRulesFor(2025);
  ok(r75.maxLoans == null && r75.frequency < 0.5 && r75.maxSeasons === 1 && !r75.clauses.option && !r75.clauses.recall, '1975: keine Grenze, selten, nur bis Saisonende, keine Kaufoption');
  ok(r95.maxSeasons === 2 && r95.clauses.recall && !r95.clauses.option, '1995: zwei Spielzeiten möglich, Rückruf ja, Kaufoption nein');
  ok(r22.maxLoans === 8 && r23.maxLoans === 7 && r24.maxLoans === 6 && r25.maxLoans === 6, 'FIFA 8/7/6, national 6');
  ok(r22.samePair === 3 && r22.exemptAge === 21 && r22.sublet === 'banned' && r22.maxSeasons === 1, 'ab 2022: 3 je Vereinspaar, U21 frei, kein Weiterverleih, höchstens ein Jahr');
  ok(loanRulesFor(2010).clauses.obligation && !loanRulesFor(2009).clauses.obligation, 'Kaufpflicht ab 2010');
  ok(loanRulesFor(2000, 'ger').parentPlay === 'clause' && loanRulesFor(2000, 'eng').parentPlay === 'banned' && loanRulesFor(1985, 'eng').parentPlay === 'clause', 'Einsatz gegen Stammverein: DE Absprache, EN Regel ab 1992');
}

// 2) Ausleihen ----------------------------------------------------------------
let gA: Game;
{
  const g = fresh(2005);
  gA = g;
  const own = g.clubs[g.managedClubId];
  const mine = squad(g, own.id);
  // Stammspieler/Leistungsträger: kein Verleih
  const star = squad(g, otherClubs(g)[0].id).sort((a, b) => b.overall - a.overall)[0];
  const r0 = startLoanTalk(g, star.id);
  ok(typeof r0 === 'string', `Leistungsträger wird nicht verliehen: ${typeof r0 === 'string' ? r0 : 'Gespräch gestartet'}`);
  // Junges Talent, das bei uns spielen würde
  let target: Player | undefined;
  for (const c of otherClubs(g)) {
    target = loanCandidates(g, c, g.calendar.currentDate).find((p) => expectedRole(p, mine) !== 'bench');
    if (target) break;
  }
  if (!target) {
    // Notfalls: schwächsten eigenen Spieler seiner Gruppe schwächer machen gibt es nicht – nimm einen Kandidaten und senke die eigene Konkurrenz.
    for (const c of otherClubs(g)) { target = loanCandidates(g, c, g.calendar.currentDate)[0]; if (target) break; }
    for (const p of mine) if (p.naturalPosition === target!.naturalPosition) p.overall = Math.min(p.overall, target!.overall - 3);
  }
  const tp = target!;
  const lenderId = tp.clubId;
  const t = startLoanTalk(g, tp.id) as LoanTalk;
  ok(typeof t !== 'string', `Leihgespräch gestartet: ${tp.fullName} (${tp.age}, ${tp.overall}) bei ${g.clubs[lenderId].name}`);
  // Zu knapp: 25 % Gehalt, nichts sonst
  const low: LoanTerms = { ...draftTerms(g, t), share: 0.25, fee: 0 };
  console.log('   →', loanOffer(g, t.id, low));
  ok(t.phase === 'club' && !!t.counter, 'Zu knappes Angebot → Gegenvorschlag');
  for (let i = 0; i < 10 && t.phase === 'club'; i++) console.log('   →', loanOffer(g, t.id, { ...t.counter!, fee: t.counter!.fee + 5000 }));
  ok(t.phase === 'done', `Leihe vollzogen im Fenster (Phase ${t.phase}${t.endNote ? `: ${t.endNote}` : ''})`);
  ok(tp.clubId === own.id && !!tp.loan?.deal && tp.loan.fromClubId === lenderId, 'Spieler beim Leihverein, Bedingungen gespeichert');
  // Gehaltsanteil am Monatsersten
  if (tp.loan?.deal && tp.loan.deal.share < 1) {
    const b0 = g.clubs[lenderId].finances.balance, o0 = own.finances.balance;
    loanLifeDaily(g, '2005-08-01');
    ok(g.clubs[lenderId].finances.balance < b0 && own.finances.balance > o0, `Gehaltsanteil ${Math.round((1 - tp.loan.deal.share) * 100)} % erstattet`);
  } else console.log('     (volles Gehalt vereinbart – keine Erstattung)');
  // Kein Einsatz gegen den Stammverein
  tp.loan!.deal!.noParent = true;
  const xiVs = resolveLineup(own, g.players, false, 7, { year: 2005, vs: lenderId });
  const xiAll = resolveLineup(own, g.players, false, 7, { year: 2005 });
  ok(![...xiVs.xi.map((x) => x.p.id), ...xiVs.bench.map((p) => p.id)].includes(tp.id), 'Leihspieler fehlt gegen den Stammverein');
  console.log(`     (gegen andere ${[...xiAll.xi.map((x) => x.p.id), ...xiAll.bench.map((p) => p.id)].includes(tp.id) ? 'im Kader' : 'nicht nominiert'})`);
  // Einsatzgarantie verfehlt → Strafzahlung; Kaufpflicht nach Einsätzen erfüllt → fester Wechsel
  tp.loan!.deal!.minApps = 15; tp.loan!.deal!.penalty = 50_000;
  tp.loan!.deal!.obligation = undefined;
  tp.seasonStats.appearances = tp.loan!.deal!.base[0] + 4;
  const p0 = own.finances.balance;
  g.calendar.currentDate = '2006-06-29';
  loanLifeDaily(g, '2006-06-29');
  ok(own.finances.balance < p0, `Einsatzgarantie verfehlt (${loanStats(tp).apps}/15) → Strafzahlung gebucht`);
  contractClausesDaily(g, '2006-06-29');
  ok(tp.clubId === lenderId && !tp.loan, 'Ohne Kaufoption: Rückkehr zum Stammverein am Saisonende');
}

// 3) Einigung außerhalb des Fensters → Vollzug im nächsten Fenster -------------
{
  const g = fresh(1995);
  g.calendar.currentDate = '1995-10-10';
  const own = g.clubs[g.managedClubId];
  const mine = squad(g, own.id);
  let tp: Player | undefined;
  for (const c of otherClubs(g)) { tp = loanCandidates(g, c, g.calendar.currentDate)[0]; if (tp) break; }
  // Platz im eigenen Kader schaffen: Konkurrenz auf seiner Position schwächer machen (er soll bei dir spielen).
  if (tp) for (const p of mine) if (p.naturalPosition === tp.naturalPosition) p.overall = Math.min(p.overall, tp.overall - 3);
  if (tp) {
    const t = startLoanTalk(g, tp.id) as LoanTalk;
    for (let i = 0; i < 12 && t.phase === 'club'; i++) loanOffer(g, t.id, t.counter ? { ...t.counter, fee: t.counter.fee + 10000 } : { ...draftTerms(g, t), share: 1, fee: 20000 });
    ok(t.phase === 'agreed', `1995 im Oktober: Einigung, Vollzug wartet (Phase ${t.phase}${t.endNote ? `: ${t.endNote}` : ''})`);
    g.calendar.currentDate = '1996-01-01';
    loanTalksDaily(g, '1996-01-01');
    ok(t.phase === 'done' && tp.clubId === own.id, 'Vollzug am 1. Januar');
  } else ok(true, '1995: kein passender Kandidat (übersprungen)');
}

// 4) Verleihen: Leihliste → Angebot → Annehmen ---------------------------------
{
  const g = fresh(2008);
  const own = g.clubs[g.managedClubId];
  const young = squad(g, own.id).filter((p) => p.age <= 23 && !p.isYouth).sort((a, b) => a.overall - b.overall).slice(0, 3);
  for (const p of young) toggleLoanListed(g, p.id);
  ok(young.every((p) => p.loanListed), `${young.length} Spieler auf der Leihliste`);
  let d = '2008-07-07'; // Montag
  for (let i = 0; i < 40 && !incomingOffers(g).some((o) => o.kind === 'loan'); i++) {
    g.calendar.currentDate = d; loanMarketDaily(g, d);
    d = new Date(Date.parse(d + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  }
  const offer = incomingOffers(g).find((o) => o.kind === 'loan');
  ok(!!offer && !!offer.terms, `Leihangebot eingegangen: ${offer ? `${offer.clubName} für ${offer.player?.fullName}, ${Math.round((offer.terms?.share ?? 0) * 100)} % Gehalt` : '–'}`);
  if (offer?.player) {
    const res = answerIncoming(g, offer.msg, 'leihen');
    console.log('   →', res);
    ok(offer.player.clubId !== own.id && offer.player.loan?.fromClubId === own.id, 'Annehmen: Spieler verliehen');
    // Rückruf: nur mit Klausel und im Januar
    const p = offer.player;
    p.loan!.deal!.recall = true;
    g.calendar.currentDate = '2008-11-10';
    ok(recallLoan(g, p.id).includes('Januar'), 'Rückruf außerhalb Januar abgelehnt');
    g.calendar.currentDate = '2009-01-10';
    console.log('   →', recallLoan(g, p.id));
    ok(p.clubId === own.id && !p.loan, 'Rückruf im Januar');
  }
}

// 5) Kaufoption (KI zieht) und Kaufpflicht ------------------------------------
{
  const g = fresh(2012);
  const own = g.clubs[g.managedClubId];
  const [a, b] = squad(g, own.id).filter((p) => p.age <= 22).slice(0, 2);
  const to = otherClubs(g)[3];
  makeLoan(g, a, own, to, '2012-07-10', { until: '2013-06-30', fee: 0, share: 1, obligation: { fee: 300_000, cond: 'apps', apps: 20 } });
  a.seasonStats.appearances = a.loan!.deal!.base[0] + 25;
  const o0 = own.finances.balance;
  g.calendar.currentDate = '2013-06-29';
  loanLifeDaily(g, '2013-06-29');
  ok(a.clubId === to.id && !a.loan && own.finances.balance > o0, 'Kaufpflicht nach 25 Einsätzen: fester Wechsel, Ablöse gebucht');
  // Kaufoption der KI: Stammspieler beim Leihverein → meist gezogen
  const g2 = fresh(2012);
  const own2 = g2.clubs[g2.managedClubId];
  const to2 = otherClubs(g2)[3];
  to2.finances.balance = 1e9;
  let drawn = 0;
  const cands = squad(g2, own2.id).filter((p) => p.age <= 24).slice(0, 6);
  for (const p of cands) {
    makeLoan(g2, p, own2, to2, '2012-07-10', { until: '2013-06-30', fee: 0, share: 1, optionFee: Math.round(p.contract.transferValue) });
    p.seasonStats.starts = 30; p.seasonStats.appearances = 32; p.seasonStats.ratedMatches = 30; p.seasonStats.averageRating = 2.4;
  }
  g2.calendar.currentDate = '2013-06-29';
  loanLifeDaily(g2, '2013-06-29');
  aiLoansDaily(g2, '2013-06-29');
  drawn = cands.filter((p) => p.clubId === to2.id && !p.loan).length;
  ok(drawn >= 1 && cands.every((p) => !p.loan), `Kaufoption: ${drawn} von ${cands.length} gezogen, Rest zurück`);
  // Deine Kaufoption: Nachricht
  const g3 = gA;
  const own3 = g3.clubs[g3.managedClubId];
  const lend = otherClubs(g3)[5];
  const p3 = squad(g3, lend.id).filter((p) => p.age <= 23).pop()!;
  g3.calendar.currentDate = '2006-07-10'; g3.season = '2006/07';
  makeLoan(g3, p3, lend, own3, '2006-07-10', { until: '2007-06-30', fee: 0, share: 1, optionFee: 200_000 });
  g3.calendar.currentDate = '2007-06-29';
  loanLifeDaily(g3, '2007-06-29');
  contractClausesDaily(g3, '2007-06-29');
  const om = g3.messages.find((m) => m.eventRef?.type === 'loan_option' && m.eventRef.playerId === p3.id);
  ok(!!om, 'Deine Kaufoption: Nachricht zum Saisonende');
  if (om) { chooseEventOption(g3, om, 'kaufen'); ok(p3.clubId === own3.id && !p3.loan, 'Kaufoption gezogen'); }
}

// 6) Halbjahresleihe ----------------------------------------------------------
{
  const g = fresh(1990);
  const own = g.clubs[g.managedClubId];
  const p = squad(g, own.id).filter((x) => x.age <= 22)[0];
  const to = otherClubs(g)[2];
  makeLoan(g, p, own, to, '1990-07-20', { until: '1990-12-31', fee: 0, share: 1, minApps: 10, penalty: 20_000 });
  const o0 = own.finances.balance;
  g.calendar.currentDate = '1991-01-01';
  loanLifeDaily(g, '1991-01-01');
  ok(p.clubId === own.id && !p.loan && own.finances.balance > o0, 'Halbjahresleihe: Rückkehr zum 1.1., Strafzahlung an dich');
}

// 7) Grenzen je Epoche --------------------------------------------------------
{
  const g = fresh(2024);
  const own = g.clubs[g.managedClubId];
  const older = squad(g, own.id).filter((p) => p.age > 21).slice(0, 8);
  const tos = otherClubs(g);
  let made = 0, blocked = '';
  for (let i = 0; i < older.length; i++) {
    const to = tos[i % tos.length];
    const why = loanLimitBlocker(g, older[i], own, to);
    if (why) { blocked = why; break; }
    makeLoan(g, older[i], own, to, '2024-07-10', { until: '2025-06-30', fee: 0, share: 1 });
    made++;
  }
  ok(made === 6 && /Höchstzahl/.test(blocked), `2024/25: ${made} Leihen, dann gesperrt (${blocked})`);
  const g2 = fresh(2024);
  const own2 = g2.clubs[g2.managedClubId];
  const to2 = otherClubs(g2)[0];
  const ys = squad(g2, own2.id).filter((p) => p.age > 21).slice(0, 4);
  for (const p of ys.slice(0, 3)) makeLoan(g2, p, own2, to2, '2024-07-10', { until: '2025-06-30', fee: 0, share: 1 });
  ok(/laufen schon 3/.test(loanLimitBlocker(g2, ys[3], own2, to2) ?? ''), 'Höchstens drei Leihen zwischen denselben Vereinen');
  const g3 = fresh(1980);
  const own3 = g3.clubs[g3.managedClubId];
  const os = squad(g3, own3.id).filter((p) => p.age > 21).slice(0, 8);
  for (const p of os) makeLoan(g3, p, own3, otherClubs(g3)[0], '1980-07-10', { until: '1981-06-30', fee: 0, share: 1 });
  ok(os.every((p) => p.loan), '1980: keine Höchstzahl');
}

// 8) Speichern/Laden ----------------------------------------------------------
{
  const g = fresh(2010);
  const own = g.clubs[g.managedClubId];
  const p = squad(g, own.id).filter((x) => x.age <= 22)[0];
  const to = otherClubs(g)[1];
  makeLoan(g, p, own, to, '2010-07-10', { until: '2011-06-30', fee: 25_000, share: 0.5, minApps: 15, penalty: 40_000, recall: true, noParent: true, noSublet: true, optionFee: 500_000 });
  const q = squad(g, own.id).filter((x) => !x.loan && x.age <= 24)[0];
  toggleLoanListed(g, q.id);
  let t: LoanTalk | string = 'x';
  for (const c of otherClubs(g)) { const cand = loanCandidates(g, c, g.calendar.currentDate)[0]; if (cand) { t = startLoanTalk(g, cand.id); if (typeof t !== 'string') break; } }
  const saved = saveGame('t', { name: 't', managerName: 't', clubName: 't', clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate }, g);
  const s = saved ? loadGame<Game>('t') : null;
  if (s) prepareLoadedGame(s.game);
  const lp = s?.game.players[p.id];
  ok(!!lp?.loan?.deal && lp.loan.deal.share === 0.5 && lp.loan.deal.minApps === 15 && lp.loan.deal.recall === true && lp.loan.optionFee === 500_000, 'Laden: Leihbedingungen erhalten');
  ok(!!s?.game.players[q.id]?.loanListed, 'Laden: Leihliste erhalten');
  ok(typeof t === 'string' || !!s?.game.loanTalks?.some((x) => x.id === (t as LoanTalk).id), 'Laden: Leihgespräch erhalten');
  // Alter Spielstand: Leihe ohne deal
  const old = squad(g, own.id).filter((x) => !x.loan)[1];
  makeLoan(g, old, own, to, '2010-07-10', { until: '2011-06-30', fee: 0, share: 1 });
  delete old.loan!.deal;
  g.calendar.currentDate = '2010-08-01';
  loanLifeDaily(g, '2010-08-01');
  ok(loanStats(old).apps >= 0, 'Alte Leihe ohne Bedingungen läuft weiter');
}

if (fails) { console.error(`\n${fails} Prüfung(en) fehlgeschlagen.`); process.exit(1); }
console.log('\nAlle Leih-Prüfungen bestanden.');
