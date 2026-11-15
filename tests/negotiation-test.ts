// Verhandlungstisch ohne UI:  npm run test:negotiation
// 1) Verein: Haltung des Verkäufers, Gegenpaket (wer es übernimmt, bekommt den Zuschlag), „nicht verhandelbar“,
//    Bedingung „keine Raten“, Ablösespiel und Europapokal-Nachschlag bis zur Buchung, Verlauf.
// 2) Spieler beim Transfer: Paketlogik mit Gegenangebot, Interesse verschiebt die Schwelle, Sperren.
// 3) Mitarbeiter: Forderung/Schwelle, Gegenvorschlag, Einstellung mit Vertragspunkten (Abfindung, Abwerbeschutz,
//    Erfolgsprämie, Fortbildung, Handgeld), Verlängerung, Abbruch mit Sperre.
// 4) Sponsor: Obergrenze über dem Erstangebot, Paketlogik (Klauseln/Prämien/Option/Laufzeit), Gegenvorschlag,
//    Abschluss über signSponsorOffer mit den verhandelten Werten, Rückzug nach Abbruch, Namensrechte mit Sperre.
import { createNewGame } from '../src/game/newGame';
import { clauseMet, clubCounter, sellerPrefs } from '../src/engine/clubNegotiation';
import { answer, buildDemand, packageValue as playerValue } from '../src/engine/contractNegotiation';
import { buildStaffDemand, staffAnswer, staffValue, StaffTerms } from '../src/engine/staffNegotiation';
import { buildSponsorDemand, openTerms, sponsorAnswer, sponsorCost, SponsorTerms } from '../src/engine/sponsorNegotiation';
import { currentNamingOffers } from '../src/game/clubBusiness';
import { cancelSponsorTalk, namingKey, openSponsorTalk, sponsorCtx, sponsorTalkView, submitSponsorDemand } from '../src/game/sponsorTalk';
import { staffSeasonTurnover } from '../src/engine/staffPeople';
import { ClubPackage, NEUTRAL_PREFS, packageValue } from '../src/engine/transferMarket';
import { transferCtx, transferViewOf } from '../src/game/contractView';
import { ensureStaff } from '../src/game/staffGame';
import { cancelStaffTalk, openStaffTalk, staffCtx, staffTalkView, submitStaffOffer } from '../src/game/staffTalk';
import { staffMarket } from '../src/game/staffWorld';
import { Game } from '../src/game/state';
import { severanceOf, willMove } from '../src/game/trainerTeam';
import { interestBoost, transferPlayerOffer } from '../src/game/transferPlayerTalk';
import { clubOffer, sellerLevers, sellerStance, startTalk, stanceFor, transferTalkDaily, TransferTalk } from '../src/game/transferTalks';

let seed = 23;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let fails = 0;
const ok = (c: boolean, msg: string) => { if (!c) fails++; console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); };
function fresh(date = '1975-07-10'): Game {
  const g = createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
  g.calendar.currentDate = date;
  const own = g.clubs[g.managedClubId];
  own.finances.transferBudget = 50_000_000;
  own.finances.wageBudget = 10_000_000;
  return g;
}
const pickTarget = (g: Game, n = 2) => {
  const own = g.clubs[g.managedClubId];
  return Object.values(g.players).filter((p) => p.clubId !== own.id && g.clubs[p.clubId] && !p.isYouth && p.age <= 28 && g.clubs[p.clubId].reputation < own.reputation - 5)
    .sort((a, b) => b.overall - a.overall)[n];
};

// ---------------------------------------------------------------- 1) Verein
{
  // Neutrale Vorlieben = alte Rechnung.
  const old: ClubPackage = { fee: 400_000, installments: true, rates: 2, sellOn: 0.2, bonus: 50_000 };
  ok(Math.abs(packageValue(old) - (400_000 * 0.93 + 400_000 * 0.2 * 0.5 + 50_000 * 0.45)) < 1 && packageValue(old, NEUTRAL_PREFS) === packageValue(old), 'Neutrale Vorlieben ergeben die alte Paketrechnung');

  const g = fresh();
  const own = g.clubs[g.managedClubId];
  const target = pickTarget(g);
  target.contract.expiryDate = '1978-06-30';
  const t = startTalk(g, target.id) as TransferTalk;
  const st = sellerStance(g, t)!;
  ok(!!st && st.friendlyValue > 0 && st.weights.fee === 3, `Haltung ${g.clubs[t.sellerId].name}: Geldbedarf ${st.cash.toFixed(2)}, Weiterverkauf ${st.sellOn.toFixed(2)}, Ablösespiel ${st.friendlyValue}`);
  ok(sellerLevers(g, t).length >= 2, `Hebel: ${sellerLevers(g, t).map((l) => `${l.side > 0 ? '+' : '−'}${l.text}`).join(' | ')}`);
  ok(!!t.walkEst && t.walkEst[0] < t.walkEst[1], 'Schätzung der Schmerzgrenze vorhanden');

  // Runde 1: zu wenig → Gegenpaket, das genau seine Forderung wert ist.
  const low: ClubPackage = { fee: Math.round(t.asking * 0.7 / 5000) * 5000, installments: true, rates: 2, sellOn: 0, bonus: 0 };
  clubOffer(g, t.id, low);
  ok(t.phase === 'club' && !!t.counter && t.hist!.length === 1, 'Zu niedriges Angebot: Gegenpaket und Verlauf');
  const cv = packageValue(t.counter!, st);
  ok(cv >= t.currentAsk * 0.985 && cv <= t.currentAsk * 1.03, `Gegenpaket ist seine Forderung wert (${Math.round(cv)} bei Forderung ${t.currentAsk})`);
  ok(t.counter!.installments === !st.noRates, 'Gegenpaket übernimmt deine Zahlungsweise (außer bei Bedingung „sofort“)');
  ok(!clauseMet('fee', low, t.counter!) && clauseMet('bonus', low, t.counter!), 'Punktvergleich: Ablöse offen, Nachschlag erfüllt');

  // „Ablöse nicht verhandelbar“: Er holt sich den Wert über andere Punkte.
  const locked = clubCounter({ ...low, fee: Math.round(t.currentAsk * 0.9 / 5000) * 5000 }, t.currentAsk, st, new Set(['fee'] as const));
  ok(locked.pkg.fee === Math.round(t.currentAsk * 0.9 / 5000) * 5000 && (locked.pkg.sellOn > 0 || locked.pkg.bonus > 0 || !!locked.pkg.friendly), `Ablöse gesperrt → er verlangt ${locked.asks.join(', ')}`);
  ok(packageValue(locked.pkg, st) >= t.currentAsk * 0.985 || locked.short > 0, 'Gesperrtes Paket erreicht die Forderung oder meldet den Rest');

  // Gegenpaket übernehmen → Zuschlag.
  const pat = t.patience;
  clubOffer(g, t.id, t.counter!);
  ok((t.phase as string) === 'player' && !!t.pkg && t.patience === pat, 'Gegenpaket übernommen → Einigung mit dem Verein');

  // Bedingung „keine Raten“ (Verein in Geldnot).
  const g2 = fresh();
  const tg2 = pickTarget(g2, 3);
  g2.clubs[tg2.clubId].finances.balance = -500_000;
  let t2: TransferTalk | null = null, st2 = null as ReturnType<typeof sellerStance>;
  for (const p of Object.values(g2.players).filter((x) => x.clubId === tg2.clubId && !x.isYouth)) {
    const x = startTalk(g2, p.id);
    if (typeof x === 'string') continue;
    const s = sellerStance(g2, x);
    if (s?.noRates) { t2 = x; st2 = s; break; }
  }
  ok(!!t2 && !!st2 && st2.cash >= 0.85 && st2.weights.rates === 3, 'Verein in Geldnot: „Zahlung sofort“ ist Bedingung');
  if (t2) {
    const before = t2.currentAsk;
    const txt = clubOffer(g2, t2.id, { fee: t2.asking * 2, installments: true, rates: 2, sellOn: 0, bonus: 0 });
    ok(t2.phase === 'club' && t2.currentAsk === before && /Raten/.test(txt) && t2.counter?.installments === false, 'Raten trotz hoher Ablöse abgelehnt, Gegenpaket ohne Raten');
  }

  // Ablösespiel + Europapokal-Nachschlag bis zur Buchung.
  const g3 = fresh();
  const tg3 = pickTarget(g3, 4);
  tg3.contract.expiryDate = '1978-06-30';
  const t3 = startTalk(g3, tg3.id) as TransferTalk;
  const st3 = sellerStance(g3, t3)!;
  const plain = packageValue({ fee: 300_000, installments: false, sellOn: 0, bonus: 0 }, st3);
  const rich = packageValue({ fee: 300_000, installments: false, sellOn: 0, bonus: 0, friendly: true, euroBonus: 60_000 }, st3);
  ok(rich > plain + st3.friendlyValue, 'Ablösespiel und Europapokal-Nachschlag erhöhen den Paketwert');
  clubOffer(g3, t3.id, { fee: Math.ceil(t3.asking / 5000) * 5000, installments: false, sellOn: 0, bonus: 0, friendly: true, euroBonus: 50_000 });
  ok((t3.phase as string) === 'player', 'Volles Angebot mit Ablösespiel angenommen');
  const v3 = transferViewOf(g3, t3.id)!;
  ok(v3.status === 'open' && !!v3.worth && v3.askWorth > 0.99 && !!v3.zone && v3.zone[0] < v3.zone[1] && v3.zone[1] <= v3.askWorth + 1e-9, `Spielergespräch: Positionsanzeige (Zone ${v3.zone!.map((x) => x.toFixed(2)).join('–')})`);
  const r3 = transferPlayerOffer(g3, t3.id, v3.ask!);
  ok(r3.ok && (t3.phase as string) === 'done' && tg3.clubId === g3.managedClubId, 'Forderung des Spielers übernommen → Transfer perfekt');
  const due = g3.transferInstallments ?? [];
  const fr = due.find((d) => d.kind === 'friendly'), eu = due.find((d) => d.kind === 'euro');
  ok(!!fr && !!eu && new Date(fr.due + 'T00:00:00Z').getUTCDay() === 2 && fr.due > g3.calendar.currentDate, `Ablösespiel angesetzt (${fr?.due}), Europapokal-Nachschlag vorgemerkt`);
  if (fr) {
    const seller = g3.clubs[t3.sellerId];
    const bal = seller.finances.balance, msgs = g3.messages.length;
    const fresh0 = g3.clubs[g3.managedClubId].playerIds.map((id) => g3.players[id].frische ?? 100).reduce((a, b) => a + b, 0);
    transferTalkDaily(g3, fr.due);
    const fresh1 = g3.clubs[g3.managedClubId].playerIds.map((id) => g3.players[id].frische ?? 100).reduce((a, b) => a + b, 0);
    ok(seller.finances.balance > bal && g3.messages.length === msgs + 1 && fresh1 < fresh0 && !(g3.transferInstallments ?? []).some((d) => d.kind === 'friendly'), 'Ablösespiel gespielt: Einnahmen beim Verkäufer, Nachricht, etwas Frische weg');
  }
  void own;
}

// ---------------------------------------------------------------- 2) Spieler beim Transfer
{
  ok(interestBoost(50) > 0.06 && interestBoost(80) < 0 && interestBoost(20) > 0.2, 'Interesse verschiebt die Schwelle (50 → +7 %, 80 → darunter, 20 → deutlicher Aufschlag)');
  const g = fresh();
  const target = pickTarget(g, 5);
  target.contract.expiryDate = '1978-06-30';
  const t = startTalk(g, target.id) as TransferTalk;
  clubOffer(g, t.id, { fee: Math.ceil(t.asking / 5000) * 5000, installments: false, sellOn: 0, bonus: 0 });
  ok((t.phase as string) === 'player', 'Verein einig');
  const ctx = transferCtx(g, t, target);
  const d = buildDemand(target, ctx);
  const st = stanceFor(g, t);
  const lowball = { ...d.fair, wage: Math.round(d.fair.wage * 0.7), signing: 0, promises: [] };
  const r1 = transferPlayerOffer(g, t.id, lowball);
  ok(!r1.ok && !r1.done && t.pRound === 1 && t.pPatience < 100 && !!t.pAsk && t.pHist!.length === 1, `Zu wenig: Gegenangebot, Geduld ${t.pPatience}`);
  // Sein Gegenangebot reicht ihm selbst.
  const a2 = answer(t.pAsk!, d, ctx, t.pAsk!, 2, interestBoost(st.interest));
  ok(a2.accepted, 'Sein Gegenangebot würde er selbst unterschreiben');
  // Gehalt nicht verhandelbar → Ausgleich über das Handgeld.
  const lockedOffer = { ...t.pAsk!, wage: Math.round(d.fair.wage * 0.95 / 10) * 10 };
  const a3 = answer(lockedOffer, d, ctx, t.pAsk!, 2, interestBoost(st.interest) + 0.2, ['wage']);
  ok(!a3.accepted && !!a3.counter && (a3.counter.wage === lockedOffer.wage ? a3.counter.signing > lockedOffer.signing : a3.counter.wage > lockedOffer.wage), `Gehalt gesperrt: Gegenangebot holt den Wert woanders (Handgeld ${lockedOffer.signing} → ${a3.counter?.signing})`);
  ok(playerValue(a3.counter!, d, ctx) >= d.reservation * (1 + interestBoost(st.interest) + 0.2) * 1.0, 'Gesperrtes Gegenangebot erreicht seine Schwelle');
  const r2 = transferPlayerOffer(g, t.id, t.pAsk!);
  ok(r2.ok && (t.phase as string) === 'done' && target.clubId === g.managedClubId && Math.abs(target.contract.weeklyWage - t.terms!.wage) < 0.01, 'Gegenangebot übernommen → Wechsel vollzogen, Gehalt wie vereinbart');
  // Abbruch nach beleidigenden Angeboten.
  const gb = fresh();
  const tb = pickTarget(gb, 6);
  tb.contract.expiryDate = '1978-06-30';
  const talk = startTalk(gb, tb.id) as TransferTalk;
  clubOffer(gb, talk.id, { fee: Math.ceil(talk.asking / 5000) * 5000, installments: false, sellOn: 0, bonus: 0 });
  const db = buildDemand(tb, transferCtx(gb, talk, tb));
  let n = 0;
  while ((talk.phase as string) === 'player' && n++ < 10) transferPlayerOffer(gb, talk.id, { ...db.fair, wage: Math.round(db.fair.wage * 0.5), signing: 0, promises: [] });
  ok((talk.phase as string) === 'failed' && !!talk.endNote && n <= 4, `Dreiste Angebote: Abbruch nach ${n} Runden („${talk.endNote}“)`);
}

// ---------------------------------------------------------------- 3) Mitarbeiter
{
  const g = fresh('1975-08-01');
  const staff = ensureStaff(g);
  ok(typeof openStaffTalk(g, staffMarket(g, { role: 'cotrainer', onlyFree: true })[0].m.id, 'torwarttrainer') === 'string', '1975 gibt es noch keinen Torwarttrainer – kein Gespräch');
  const row = staffMarket(g, { role: 'cotrainer', onlyFree: true }).filter((r) => willMove(g, r.m))[1];
  const role = 'cotrainer';
  const v = staffTalkView(g, row.m.id, role)!;
  ok(v.status === 'open' && !!v.ask && !!v.d && v.askWorth > 0.99 && v.levers.length > 0, `Gespräch mit ${row.m.name} (${role}): Forderung Faktor ${v.ask!.factor}, Schwelle ${v.d!.reservation.toFixed(2)}`);
  const ctx = staffCtx(g, row.m, role, false);
  const d = buildStaffDemand(ctx);
  ok(staffValue(d.ask, d, ctx) >= d.reservation && d.reservation < d.ask.factor && d.reservation > d.ask.factor * 0.7, 'Eröffnungsforderung liegt über der Schwelle (Verhandlungsspielraum)');
  // Paketlogik: Handgeld und volle Abfindung sind etwas wert, Abwerbeschutz und begrenzte Abfindung kosten.
  const base: StaffTerms = { factor: d.ask.factor, years: d.ideal, signing: 0, bonus: 0, severance: 'standard', protect: false, course: false };
  ok(staffValue({ ...base, signing: 3 }, d, ctx) > staffValue(base, d, ctx) && staffValue({ ...base, severance: 'full' }, d, ctx) > staffValue(base, d, ctx)
    && staffValue({ ...base, protect: true }, d, ctx) < staffValue(base, d, ctx) && staffValue({ ...base, severance: 'cap' }, d, ctx) < staffValue(base, d, ctx), 'Paketlogik der Vertragspunkte');
  // Zu wenig → Gegenvorschlag, der ihm reicht.
  const low: StaffTerms = { ...base, factor: Math.round(d.reservation * 0.88 * 100) / 100 };
  const r1 = submitStaffOffer(g, row.m.id, low);
  const st = g.staffTalks![row.m.id];
  ok(!r1.ok && !r1.done && st.round === 1 && st.patience < st.start && st.hist.length === 1, `Zu wenig: Geduld ${st.patience}/${st.start}, Gegenvorschlag Faktor ${st.ask.factor}`);
  ok(staffAnswer(st.ask, d, ctx, st.ask, 2).accepted, 'Sein Gegenvorschlag reicht ihm selbst');
  // Einigung mit Vertragspunkten: Abfindung begrenzt + Abwerbeschutz gegen mehr Gehalt, Fortbildung, Handgeld.
  const deal: StaffTerms = { factor: Math.round(st.ask.factor * 1.2 * 100) / 100, years: 3, signing: 1, bonus: 2, severance: 'cap', protect: true, course: true };
  const bal = g.clubs[g.managedClubId].finances.balance;
  const r2 = submitStaffOffer(g, row.m.id, deal);
  const hired = staff.find((m) => m.name === row.m.name && m.roleId === role);
  ok(r2.ok && st.status === 'agreed' && !!hired && hired.salaryFactor === deal.factor && hired.contractEnd!.startsWith('1978'), `Einigung: ${r2.text}`);
  ok(!!hired && hired.deal?.sev === 'cap' && hired.deal.protect === true && hired.deal.bonus === 2 && hired.course === 1975 && g.clubs[g.managedClubId].finances.balance < bal, 'Vertragspunkte am Mitarbeiter, Handgeld und Fortbildung gebucht');
  if (hired) {
    const capped = severanceOf(g, hired);
    hired.deal = { ...hired.deal, sev: 'full' };
    const full = severanceOf(g, hired);
    hired.deal = { ...hired.deal, sev: undefined };
    const std = severanceOf(g, hired);
    ok(capped < std && std < full, `Abfindung: begrenzt ${capped} < Standard ${std} < volle Restlaufzeit ${full}`);
    // Abwerbeschutz: bei laufendem Vertrag wirbt ihn niemand ab.
    hired.quality = 19; hired.loyalty = 0; hired.traits = [];
    hired.deal = { protect: true };
    let poached = 0;
    for (let i = 0; i < 300; i++) { const copy = [{ ...hired }]; if (staffSeasonTurnover(copy, 60, 1976, Math.random, () => 'X').left.length) poached++; }
    hired.deal = undefined;
    let poached2 = 0;
    for (let i = 0; i < 300; i++) { const copy = [{ ...hired }]; if (staffSeasonTurnover(copy, 60, 1976, Math.random, () => 'X').left.length) poached2++; }
    ok(poached === 0 && poached2 > 20, `Abwerbeschutz wirkt (mit ${poached}, ohne ${poached2} von 300)`);
  }
  // Abbruch mit Sperre.
  const other = staffMarket(g, { role: 'masseur', onlyFree: true }).filter((r) => willMove(g, r.m))[0];
  const vo = staffTalkView(g, other.m.id, 'masseur')!;
  let n = 0;
  while (g.staffTalks![other.m.id].status === 'open' && n++ < 8) submitStaffOffer(g, other.m.id, { ...vo.ask!, factor: Math.round(vo.ask!.factor * 0.5 * 100) / 100 });
  const so = g.staffTalks![other.m.id];
  ok(so.status === 'failed' && !!so.blockedUntil && n <= 3 && typeof openStaffTalk(g, other.m.id, 'masseur') === 'string', `Dreiste Angebote: Abbruch nach ${n} Runden, Sperre bis ${so.blockedUntil}`);
  ok(staffTalkView(g, other.m.id, 'masseur')!.status === 'blocked', 'Gesperrtes Gespräch wird als gesperrt angezeigt');
  // Verlängerung eines eigenen Mitarbeiters im letzten Vertragsjahr.
  const mine = staff.find((m) => m.roleId === 'cheftrainer') ?? staff[0];
  mine.contractEnd = '1976-06-30';
  const ve = staffTalkView(g, mine.id)!;
  ok(ve.own && ve.status === 'open' && ve.st!.mode === 'extend', `Verlängerung ${mine.name}: Gespräch offen`);
  const re = submitStaffOffer(g, mine.id, ve.ask!);
  ok(re.ok && mine.contractEnd! > '1976-06-30' && mine.salaryFactor === ve.ask!.factor, `Forderung übernommen → ${re.text}`);
  // Abbrechen von dir aus.
  const third = staffMarket(g, { role: 'zeugwart', onlyFree: true }).filter((r) => willMove(g, r.m))[0];
  if (third) { staffTalkView(g, third.m.id, 'zeugwart'); cancelStaffTalk(g, third.m.id); ok(g.staffTalks![third.m.id].status === 'failed', 'Gespräch von dir beendet'); }
}

// ---------------------------------------------------------------- 4) Sponsor
{
  const g = fresh();
  const own = g.clubs[g.managedClubId];
  const offers = own.commerce?.dealOffers ?? [];
  const o = offers.find((x) => x.slot === 'brust' && x.clauses.some((k) => k.kind !== 'image' && k.kind !== 'youth' && k.kind !== 'option')) ?? offers.find((x) => x.slot === 'brust')!;
  ok(!!o, `Brust-Angebot vorhanden: ${o?.partner} ${o?.annualValue} (Klauseln ${o?.clauses.map((k) => k.kind).join(',') || 'keine'})`);
  const v = sponsorTalkView(g, o.id)!;
  ok(v.status === 'open' && !!v.ask && !!v.d && !!v.base && v.levers.length > 0 && Math.abs(v.askWorth - 1) < 1e-9, `Gespräch offen, Hebel: ${v.levers.map((l) => `${l.side > 0 ? '+' : '−'}${l.text}`).join(' | ')}`);
  const b = v.base!, ctx = sponsorCtx(g, o.id), d = buildSponsorDemand(b, ctx);
  const open = openTerms(b);
  ok(d.limit > sponsorCost(open, b, ctx) && d.limit < sponsorCost(open, b, ctx) * 1.35, `Obergrenze ${Math.round(d.limit)} über dem Erstangebot ${Math.round(sponsorCost(open, b, ctx))} (Spielraum)`);
  ok(sponsorAnswer(open, b, ctx, open, 1).accepted, 'Erstangebot unverändert wird angenommen');
  // Paketlogik.
  const more = (x: Partial<SponsorTerms>) => sponsorCost({ ...open, ...x }, b, ctx) > sponsorCost(open, b, ctx);
  const dropIdx = b.clauses.findIndex((k) => k.kind !== 'image' && k.kind !== 'youth');
  ok(more({ value: open.value + 5000 }) && (dropIdx < 0 || more({ drop: [dropIdx] })) && (!b.optionOk || b.option || more({ option: true }))
    && sponsorCost({ ...open, years: open.years + 2 }, b, ctx) < sponsorCost(open, b, ctx)
    && (!(b.bonuses.title ?? 0) || more({ bonuses: { ...open.bonuses, title: (b.bonuses.title ?? 0) * 2 } })), 'Paketlogik: Betrag, gestrichene Klausel, Option und Prämien kosten ihn; längere Laufzeit ist ihm etwas wert');
  // Zu viel → Gegenvorschlag, den er selbst annimmt; nie schlechter als sein Erstangebot.
  const greedy: SponsorTerms = { ...open, value: Math.round(d.limit * 1.15 / 500) * 500 };
  const r1 = submitSponsorDemand(g, o.id, greedy);
  const st = g.sponsorTalks![o.id];
  ok(!r1.done && st.round === 1 && st.patience < st.start && st.ask.value >= open.value && st.ask.value <= greedy.value, `Zu viel: Gegenvorschlag ${st.ask.value} (Erstangebot ${open.value}, Forderung ${greedy.value}), Geduld ${st.patience}/${st.start}`);
  ok(sponsorAnswer(st.ask, b, ctx, st.ask, 2).accepted, 'Sein Gegenvorschlag reicht ihm selbst');
  ok(own.commerce!.dealOffers!.find((x) => x.id === o.id)!.annualValue === st.ask.value && own.commerce!.dealOffers!.find((x) => x.id === o.id)!.rounds === 1, 'Karteikarte zeigt den aktuellen Stand (Betrag, Runden)');
  // Einigung: seinen Vorschlag übernehmen → Vertrag mit genau diesen Werten über signSponsorOffer.
  const r2 = submitSponsorDemand(g, o.id, st.ask);
  const deal = own.commerce!.deals!.find((x) => x.partner === o.partner && x.slot === 'brust');
  ok(r2.ok && st.status === 'agreed' && !!deal && deal.annualValue === st.deal!.value && deal.yearsTotal === st.deal!.years && !own.commerce!.dealOffers!.some((x) => x.id === o.id), `Einigung: ${r2.text}`);
  ok(typeof openSponsorTalk(g, o.id) === 'string' && sponsorTalkView(g, o.id)!.status === 'agreed', 'Abgeschlossenes Gespräch bleibt abgeschlossen');
  // Dreiste Forderungen → Rückzug des Angebots.
  const o2 = own.commerce!.dealOffers!.find((x) => x.slot !== 'brust' && !x.renewal)!;
  const v2 = sponsorTalkView(g, o2.id)!;
  let n = 0;
  while (g.sponsorTalks![o2.id].status === 'open' && n++ < 6) submitSponsorDemand(g, o2.id, { ...v2.ask!, value: v2.ask!.value * 3 });
  const s2 = g.sponsorTalks![o2.id];
  ok(s2.status === 'failed' && n <= 3 && !own.commerce!.dealOffers!.some((x) => x.id === o2.id) && typeof openSponsorTalk(g, o2.id) === 'string', `Dreiste Forderungen: Abbruch nach ${n} Runden, Angebot zurückgezogen (${o2.partner})`);
  // Abbrechen von dir aus: Angebot bleibt.
  const o3 = own.commerce!.dealOffers!.find((x) => !x.renewal);
  if (o3) { sponsorTalkView(g, o3.id); cancelSponsorTalk(g, o3.id); ok(g.sponsorTalks![o3.id].status === 'failed' && own.commerce!.dealOffers!.some((x) => x.id === o3.id), 'Von dir beendet: Angebot bleibt bestehen'); }
  // Namensrechte (ab 2000): Einigung über acceptNaming, Abbruch sperrt die Firma.
  g.calendar.currentDate = '2003-08-01'; g.season = '2003/04';
  own.namingRights = undefined;
  const no = currentNamingOffers(g);
  ok(no.length >= 2, `Namensrechte: ${no.length} Angebote`);
  const k1 = namingKey(no[0].sponsor);
  const vn = sponsorTalkView(g, k1)!;
  ok(vn.status === 'open' && vn.base!.range[0] === 3 && vn.unit > 0, `Namensrechte-Gespräch mit ${no[0].sponsor}`);
  const rn = submitSponsorDemand(g, k1, { ...vn.ask!, years: 6 });
  ok(rn.ok && own.namingRights?.sponsor === no[0].sponsor && own.namingRights!.untilYear === no[0].fromYear + 6 && own.stadium.name === no[0].arenaName, `Namensrechte verkauft: ${rn.text}`);
  own.namingRights = undefined;
  const no2 = currentNamingOffers(g).filter((x) => x.sponsor !== no[0].sponsor);
  const k2 = namingKey(no2[0].sponsor);
  const vn2 = sponsorTalkView(g, k2)!;
  let m = 0;
  while (g.sponsorTalks![k2].status === 'open' && m++ < 6) submitSponsorDemand(g, k2, { ...vn2.ask!, value: vn2.ask!.value * 3 });
  ok(g.sponsorTalks![k2].status === 'failed' && !currentNamingOffers(g).some((x) => x.sponsor === no2[0].sponsor), `Namensrechte: nach dem Abbruch meldet sich ${no2[0].sponsor} vorerst nicht`);
}

console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nVerhandlungstisch: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
