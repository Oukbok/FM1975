// Trainerkarriere-Test ohne UI (game/careerGame.ts, game/careerSwitch.ts) + KI-Leihen/Verträge:
//   npm run test:career
// 1) Ansehen/Angebote, Nachricht mit Entscheidung (Weiter-Sperre)
// 2) Sofortwechsel in der eigenen Liga: Spielstand konsistent, alter Verein KI, Speichern/Laden
// 3) Wechsel zum Saisonende in die 2. Liga (Sim-Verein wird Spielerliga)
// 4) Entlassung im Karriere-Modus (Ultimatum → Entlassung → Pflichtwahl)
// 5) KI-Leihen (Hin und Rückkehr), KI-Verträge (frühe Verlängerung, Bosman-Verkauf, Vorvertrag)
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { pendingDecisions } from '../src/engine/messages';
import { chooseEventOption } from '../src/game/eventsGame';
import { careerDaily, makeOffer, offerCandidates, rollJobOffers } from '../src/game/careerGame';
import { currentStint, ensureCareer, jobLevel } from '../src/game/careerState';
import { aiLoanRound, aiLoansSeasonEnd, optionWanted } from '../src/game/aiLoans';
import { aiBosmanSales, aiEarlyRenewals, aiPreContracts } from '../src/game/aiContracts';
import { coachRecordOf } from '../src/game/coachRecord';
import { Game } from '../src/game/state';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
function fresh(club = 'boc', mode: 'manager' | 'career' = 'manager'): Game {
  return createNewGame({
    managedClubId: club,
    manager: { name: 'Test Trainer', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'ex_pro', startMode: mode } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}
function run(g: Game, until: string, max = 400): void {
  let guard = 0;
  while (g.calendar.currentDate < until && !CalendarEngine.isSeasonOver(g.calendar) && guard++ < max) {
    // Entscheidungen der Karriere sofort beantworten lassen (sonst Frist).
    processDay(g, HEADLESS_UI);
  }
}
/** Spielstand-Konsistenz: Kaderlisten, Trainer, Markierungen. */
function consistent(g: Game, label: string): void {
  const own = g.clubs[g.managedClubId];
  if (!own) fail(`${label}: eigener Verein fehlt`);
  if (own.coach) fail(`${label}: eigener Verein hat einen KI-Trainer`);
  if (!own.isPlayerControlled) fail(`${label}: eigener Verein nicht als Spielerverein markiert`);
  if (!g.table.rows.some((r) => r.clubId === own.id)) fail(`${label}: eigener Verein nicht in der Tabelle der Spielerliga`);
  for (const c of Object.values(g.clubs)) {
    if (c.id !== own.id && c.isPlayerControlled) fail(`${label}: ${c.name} noch als Spielerverein markiert`);
    for (const id of c.playerIds) if (g.players[id]?.clubId !== c.id) fail(`${label}: ${id} in Kaderliste von ${c.name}, gehört aber ${g.players[id]?.clubId}`);
  }
  for (const m of g.fixtures) if (m.involvesPlayerClub !== (m.homeClubId === own.id || m.awayClubId === own.id)) fail(`${label}: involvesPlayerClub falsch`);
  for (const r of g.table.rows) {
    const c = g.clubs[r.clubId];
    if (c && c.id !== own.id && !c.coach) fail(`${label}: ${c.name} ohne Trainer`);
  }
  const st = currentStint(g);
  if (st.clubId !== own.id || st.to) fail(`${label}: laufende Station passt nicht`);
}
function roundtrip(g: Game): Game {
  const s = JSON.stringify(g);
  return JSON.parse(s) as Game;
}

// -----------------------------------------------------------------------------
// 1) Ansehen und Angebote
// -----------------------------------------------------------------------------
const g = fresh('boc');
const c = ensureCareer(g);
if (c.rep < 20 || c.rep > 95) fail(`Ansehen unplausibel ${c.rep}`);
if (c.stints.length !== 1 || c.stints[0].clubId !== 'boc') fail('Startstation fehlt');
console.log(`Start: Bochum, Größe ${jobLevel(g, 'boc')}, Ansehen ${c.rep}`);
c.rep = 85; // sehr gefragt
const cands = offerCandidates(g);
if (!cands.length) fail('keine Kandidaten für Angebote');
if (cands.some((x) => x.id === 'boc')) fail('eigener Verein als Kandidat');
let offer = null;
for (let i = 0; i < 40 && !offer; i++) offer = rollJobOffers(g, '1976-04-10');
if (!offer) fail('kein Angebot trotz hohem Ansehen');
if (offer.when !== 'saisonende' || offer.wage <= 0 || !offer.goal) fail('Angebot unvollständig');
const pend = pendingDecisions(g.messages);
if (!pend.some((m) => m.eventRef?.data?.offer === offer!.id)) fail('Angebot sperrt „Weiter“ nicht');
console.log(`Angebot: ${offer.clubName} (${offer.tier}. Liga), Gehalt ${offer.wage}, Ziel ${offer.goal}, Budget ${offer.budget}`);
// Ablehnen räumt auf.
const msg = g.messages.find((m) => m.eventRef?.data?.offer === offer!.id)!;
chooseEventOption(g, msg, 'nein');
if (c.offers.length) fail('abgelehntes Angebot bleibt offen');
if (c.declined[offer.clubId] !== g.season) fail('Ablehnung nicht gemerkt');

// -----------------------------------------------------------------------------
// 2) Sofortwechsel in der eigenen Liga
// -----------------------------------------------------------------------------
run(g, '1975-10-01');
const oldId = g.managedClubId;
const old = g.clubs[oldId];
const ownStaff = (g.staff ?? []).length;
const target = g.table.rows.map((r) => g.clubs[r.clubId]).find((x) => x && x.id !== oldId && x.coach)!;
const targetCoach = target.coach!.name;
const targetStaff = (g.staffWorld?.people ?? []).filter((m) => m.clubId === target.id).length;
const sofort = makeOffer(g, target.id, 'sofort', 'Test.', g.calendar.currentDate);
ensureCareer(g).offers.push(sofort);
const sm = { id: 'x', date: g.calendar.currentDate, category: 'board', from: 't', subject: 's', shortText: '', bodyText: '', read: false,
  choices: [{ id: 'ja', label: 'Annehmen' }], eventRef: { type: 'career_offer', deadline: '1975-10-05', defaultChoice: 'nein', data: { offer: sofort.id } } } as any;
g.messages.push(sm);
// Eine offene Entscheidung des alten Vereins verfällt mit dem Wechsel.
g.messages.push({ ...sm, id: 'y', eventRef: { type: 'ai_offer', deadline: '1975-10-05', data: {} } });
chooseEventOption(g, sm, 'ja');
if (g.managedClubId !== target.id) fail('Sofortwechsel nicht vollzogen');
consistent(g, 'Sofortwechsel');
if (!old.coach) fail('alter Verein ohne Nachfolger');
if (old.merchShop) fail('alter Verein behält den Fanartikel-Laden');
const oh = old.coachHistory?.[old.coachHistory.length - 1];
if (!oh?.human || oh.reason !== 'abgeworben') fail('Trainerhistorie des alten Vereins ohne dich');
const th = target.coachHistory?.[target.coachHistory.length - 1];
if (th?.name !== targetCoach || th.reason !== 'entlassen' || !th.rec) fail('Vorgänger beim neuen Verein fehlt/ohne Bilanz');
if ((g.staff ?? []).length !== targetStaff) fail(`Trainerteam nicht übernommen (${g.staff?.length} statt ${targetStaff})`);
if ((g.staffWorld?.people ?? []).filter((m) => m.clubId === oldId).length < ownStaff) fail('dein altes Team ist nicht beim alten Verein geblieben');
if (g.messages.find((m) => m.id === 'y')?.eventRef?.resolved !== 'verfallen') fail('Entscheidung des alten Vereins nicht verfallen');
if (ensureCareer(g).stints.length !== 2 || ensureCareer(g).stints[0].to == null) fail('Stationen nach Wechsel falsch');
if (!target.tactics.startingXI?.length) fail('neue Mannschaft ohne Aufstellung');
console.log(`Sofortwechsel: ${old.name} → ${target.name}; Nachfolger ${old.coach!.name}; Team ${g.staff?.length}; ${target.name} Vorgänger ${th.name} (${th.rec.w}-${th.rec.d}-${th.rec.l})`);
// Speichern/Laden und weiterspielen.
const g2 = roundtrip(g);
run(g2, '1975-11-15');
consistent(g2, 'nach Laden');
const rec = coachRecordOf(g2, g2.clubs[oldId]);
if (!rec) fail('Bilanz des Nachfolgers fehlt');
console.log(`Weitergespielt bis ${g2.calendar.currentDate}: Nachfolger bei ${g2.clubs[oldId].name} ${rec.w}-${rec.d}-${rec.l}`);

// -----------------------------------------------------------------------------
// 3) Wechsel zum Saisonende in die 2. Liga
// -----------------------------------------------------------------------------
const g3 = fresh('han');
const sims = Object.values(g3.simClubs).filter((s) => s.tier === 2 && !s.ddr);
const dest = sims.sort((a, b) => b.strength - a.strength)[0];
const so = makeOffer(g3, dest.id, 'saisonende', 'Test.', '1976-05-10');
const cs = ensureCareer(g3);
cs.pendingMove = { ...so, fromId: 'han', reason: 'wechsel' };
run(g3, '1976-07-01', 1200);
if (!CalendarEngine.isSeasonOver(g3.calendar)) fail('Saison nicht zu Ende');
startNextSeason(g3);
if (g3.managedClubId !== dest.id) fail('Wechsel zum Saisonende nicht vollzogen');
processDay(g3, HEADLESS_UI); // Aufsteiger bekommen ihre Trainer am ersten Tag (ensureCoaches)
processDay(g3, HEADLESS_UI);
consistent(g3, 'Saisonwechsel');
if (!g3.clubs[dest.id] || g3.simClubs[dest.id]) fail('neuer Verein nicht als voller Verein aufgebaut');
console.log(`Saisonwechsel: Hannover → ${g3.clubs[dest.id].name} (Spielerliga ${g3.leagues.playerDivision.name}), Ansehen ${ensureCareer(g3).rep}`);
if (cs.stints[0].seasons.length !== 1) fail('Saisonbilanz der alten Station fehlt');
const g3b = roundtrip(g3);
run(g3b, '1976-09-15');
consistent(g3b, 'neue Saison nach Laden');

// -----------------------------------------------------------------------------
// 4) Entlassung im Karriere-Modus
// -----------------------------------------------------------------------------
const g4 = fresh('mgl', 'career');
run(g4, '1975-10-31');
const c4 = ensureCareer(g4);
g4.clubs[g4.managedClubId].boardConfidence = 5;
g4.calendar.currentDate = '1975-11-01';
careerDaily(g4, '1975-11-01');
if (c4.lastChance !== g4.season) fail('kein Ultimatum');
g4.clubs[g4.managedClubId].boardConfidence = 8;
careerDaily(g4, '1975-12-01');
const sackMsg = pendingDecisions(g4.messages).find((m) => m.eventRef?.type === 'career_sacked');
if (!sackMsg || c4.sacked !== 1) fail('keine Entlassung nach Ultimatum');
if (!sackMsg.choices?.length || sackMsg.choices.some((x) => x.id === 'nein')) fail('Entlassung ohne Pflichtwahl');
const before = g4.managedClubId;
chooseEventOption(g4, sackMsg, sackMsg.choices[0].id);
if (g4.managedClubId === before) fail('nach Entlassung kein neuer Verein');
consistent(g4, 'nach Entlassung');
if (g4.clubs[before].coachHistory?.slice(-1)[0]?.reason !== 'entlassen') fail('Entlassung nicht in der Trainerhistorie');
console.log(`Entlassung: ${g4.clubs[before].name} → ${g4.clubs[g4.managedClubId].name}, Ansehen ${c4.rep}`);
// Teammanager-Modus: nie entlassen
const g5 = fresh('mgl');
g5.clubs['mgl'].boardConfidence = 2;
run(g5, '1975-10-31');
g5.clubs['mgl'].boardConfidence = 2;
careerDaily(g5, '1975-11-01'); careerDaily(g5, '1975-12-01');
if (ensureCareer(g5).sacked || g5.managedClubId !== 'mgl') fail('Teammanager wurde entlassen');

// -----------------------------------------------------------------------------
// 5) KI-Leihen und KI-Verträge
// -----------------------------------------------------------------------------
const g6 = fresh('mgl');
run(g6, '1975-09-01');
for (const p of Object.values(g6.players)) p.contract.expiryDate = '1995-06-30';
let loans = Object.values(g6.players).filter((p) => p.loan).length; // Leihen aus dem Sommer 1975
for (const d of ['1990-07-27', '1990-08-17', '1991-01-19', '1991-07-27']) loans += aiLoanRound(g6, d);
const loaned = Object.values(g6.players).filter((p) => p.loan);
if (!loans || loaned.length !== loans) fail(`Leihen: ${loans} gemeldet, ${loaned.length} markiert`);
for (const p of loaned) {
  const from = g6.clubs[p.loan!.fromClubId], to = g6.clubs[p.clubId];
  if (!to.playerIds.includes(p.id) || from.playerIds.includes(p.id)) fail('Leihspieler doppelt/falsch zugeordnet');
  if ((to.reputation ?? 0) > (from.reputation ?? 0) - 4) fail('Leihe an einen größeren Verein');
  if (p.age > 22) fail('Leihspieler zu alt');
}
// Kaufoption: Stammspieler mit guten Noten meist ja, Bankdrücker fast nie, leere Kasse nie.
{
  const p = loaned[0], holder = g6.clubs[p.clubId];
  p.loan!.optionFee = 50000;
  const st = p.seasonStats;
  const trial = () => { let n = 0; for (let i = 0; i < 400; i++) if (optionWanted(g6, p, holder, '1992-06-30', Math.random)) n++; return n / 400; };
  Object.assign(st, { starts: 28, appearances: 30, ratedMatches: 30, averageRating: 2.6 });
  const good = trial();
  Object.assign(st, { starts: 2, appearances: 6, ratedMatches: 6, averageRating: 3.8 });
  const bench = trial();
  Object.assign(st, { starts: 28, appearances: 30, ratedMatches: 30, averageRating: 2.6 });
  const bal = holder.finances.balance; holder.finances.balance = 0;
  const broke = trial();
  holder.finances.balance = bal;
  console.log(`Kaufoption: Stammspieler ${(good * 100).toFixed(0)} %, Bank ${(bench * 100).toFixed(0)} %, ohne Geld ${(broke * 100).toFixed(0)} %`);
  if (good < 0.5 || bench > 0.1 || broke > 0) fail('Kaufoption-Entscheidung unplausibel');
  p.loan!.optionFee = 0; p.loan!.noOption = true;
}
const back = aiLoansSeasonEnd(g6, '1992-06-30');
if (back !== loans || Object.values(g6.players).some((p) => p.loan)) fail('Leihen enden nicht');
console.log(`Leihen: ${loans} (z. B. ${loaned[0].fullName} ${g6.clubs[loaned[0].loan?.fromClubId ?? loaned[0].clubId]?.shortName ?? ''}), alle zurück`);

const g7 = fresh('mgl');
const ai = Object.values(g7.clubs).filter((x) => x.id !== 'mgl' && x.coach);
for (const club of ai) for (const id of club.playerIds) g7.players[id].contract.expiryDate = '1997-06-30';
aiEarlyRenewals(g7, '1996-10-01');
aiEarlyRenewals(g7, '1997-02-01');
const log = g7.aiSquadLog?.[g7.aiSquadLog.length - 1];
if (!log || log.early < 10) fail(`zu wenige frühe Verlängerungen (${log?.early})`);
if (log.letGo < 1) fail('keine auslaufenden Altstars');
const refusers = Object.values(g7.players).filter((p) => p.contract.refused);
console.log(`KI-Verträge: früh verlängert ${log.early}, abgelehnt ${log.refused}, Altstars ${log.letGo}`);
aiPreContracts(g7, '1997-01-15');
aiBosmanSales(g7, '1997-01-12', Math.random);
const after = g7.aiSquadLog![g7.aiSquadLog!.length - 1];
console.log(`Bosman-Verkäufe ${after.bosmanSales}, Vorverträge ${after.pre} (Kandidaten ${refusers.length})`);
if (refusers.length >= 3 && after.bosmanSales + after.pre === 0) fail('weder Bosman-Verkauf noch Vorvertrag');
// Vor Bosman: kein Verkauf im letzten Jahr, keine Vorverträge
const g8 = fresh('mgl');
for (const p of Object.values(g8.players)) { p.contract.refused = '1976'; p.contract.expiryDate = '1977-06-30'; }
aiBosmanSales(g8, '1977-01-12'); aiPreContracts(g8, '1977-01-15');
if ((g8.aiSquadLog ?? []).some((e) => e.bosmanSales || e.pre)) fail('Bosman-Planung vor 1995');
console.log('OK – Trainerkarriere, KI-Leihen und KI-Verträge');
