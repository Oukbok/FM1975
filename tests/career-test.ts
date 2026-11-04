// Managerkarriere-Test ohne UI (game/careerGame.ts, headCoaches.ts, boardPressure.ts, managerLog.ts) + KI-Leihen/Verträge:
//   npm run test:career
// 1) Keine Jobangebote/Wechsel mehr – auch bei hohem Ansehen eine ganze Saison lang
// 2) Migration: offene Angebote/Entlassungs-Wahl/zugesagter Wechsel alter Spielstände verfallen, „Weiter“ frei
// 3) Cheftrainer-Historie + Vorstandsdruck gegen den Trainer (Rückendeckung, Entlassung), nie Entlassung des Managers
// 4) Managerbilanz über den Saisonwechsel, Speichern/Laden, Rekonstruktion alter Spielstände
// 5) KI-Leihen (Hin und Rückkehr), KI-Verträge (frühe Verlängerung, Bosman-Verkauf, Vorvertrag)
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { pendingDecisions } from '../src/engine/messages';
import { chooseEventOption } from '../src/game/eventsGame';
import { migrateCareer } from '../src/game/careerGame';
import { ensureCareer } from '../src/game/careerState';
import { boardPressureDaily, ownStanding, PRESSURE_TYPE } from '../src/game/boardPressure';
import { headCoachNow, headCoachRows, openCoachEntry } from '../src/game/headCoaches';
import { candidatesFor, hireStaff } from '../src/game/staffGame';
import { ensureMgr } from '../src/game/managerLog';
import { careerData, games } from '../src/game/managerView';
import { aiLoanRound, aiLoansSeasonEnd, optionWanted } from '../src/game/aiLoans';
import { aiBosmanSales, aiEarlyRenewals, aiPreContracts } from '../src/game/aiContracts';
import { Game } from '../src/game/state';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
function fresh(club = 'boc', mode: 'manager' | 'career' = 'manager'): Game {
  return createNewGame({
    managedClubId: club,
    manager: { name: 'Test Manager', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'ex_pro', startMode: mode } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}
function run(g: Game, until: string, max = 1200): void {
  let guard = 0;
  while (g.calendar.currentDate < until && !CalendarEngine.isSeasonOver(g.calendar) && guard++ < max) processDay(g, HEADLESS_UI);
}
const roundtrip = (g: Game): Game => JSON.parse(JSON.stringify(g)) as Game;
const careerMsgs = (g: Game) => g.messages.filter((m) => m.eventRef?.type === 'career_offer' || m.eventRef?.type === 'career_sacked');

// -----------------------------------------------------------------------------
// 1) Keine Jobangebote, kein Wechsel – eine ganze Saison im Karriere-Modus mit Ansehen 90
// -----------------------------------------------------------------------------
const g = fresh('boc', 'career');
const c = ensureCareer(g);
if (c.rep < 20 || c.rep > 95) fail(`Ansehen unplausibel ${c.rep}`);
c.rep = 90;
g.clubs.boc.boardConfidence = 5; // früher: Ultimatum + Entlassung
hireStaff(g, candidatesFor(g, 'cheftrainer')[0]);
const firstCoach = headCoachNow(g);
if (!firstCoach || openCoachEntry(g)?.id !== firstCoach.id) fail('Cheftrainer nicht in der Historie');
run(g, '1976-07-01');
if (!CalendarEngine.isSeasonOver(g.calendar)) fail('Saison nicht zu Ende');
if (g.managedClubId !== 'boc') fail('Vereinswechsel trotz Abschaltung');
if (c.offers.length || c.offerCount || c.sacked || c.pendingMove || careerMsgs(g).length) fail('Jobangebot/Entlassung ausgelöst');
const pressMsgs = g.messages.filter((m) => m.eventRef?.type === PRESSURE_TYPE);
console.log(`Saison 1975/76 mit Ansehen 90 und Vertrauen ab 5: keine Angebote, kein Wechsel; Druck-Nachrichten gegen den Trainer: ${pressMsgs.length}, Trainer: ${headCoachRows(g).map((e) => `${e.name} (${e.live ? 'im Amt' : e.end})`).join(', ')}`);

// -----------------------------------------------------------------------------
// 4) Saisonwechsel: Managerbilanz, Trainerbilanz, Laden, Rekonstruktion
// -----------------------------------------------------------------------------
const row = g.table.rows.find((r) => r.clubId === 'boc')!;
const coachBefore = openCoachEntry(g);
startNextSeason(g);
const mlog = ensureMgr(g)!;
const s0 = mlog.seasons['1975/76'];
if (!s0 || mlog.last !== '1975/76') fail('Saison 1975/76 nicht in der Managerbilanz');
if (s0.L[0] !== row.won || s0.L[1] !== row.drawn || s0.L[2] !== row.lost) fail(`Ligabilanz ${s0.L} ≠ Tabelle ${row.won}-${row.drawn}-${row.lost}`);
if (mlog.n !== games(s0.L) + games(s0.P) + games(s0.E)) fail('Spielzahl der Managerbilanz falsch');
if (!mlog.miles.some(([n]) => n === 1) || (mlog.n >= 50 && !mlog.miles.some(([n]) => n === 50))) fail('Meilensteine fehlen');
if (!Object.keys(mlog.players).length) fail('keine Spieler in der Managerbilanz');
if (s0.rep == null) fail('Ansehen der Saison fehlt');
if (coachBefore && !coachBefore.to && !(coachBefore.rec && coachBefore.rec.upTo)) fail('Trainerbilanz nicht fortgeschrieben');
const again = JSON.stringify(mlog);
ensureMgr(g); migrateCareer(g); // erneutes Anlegen/Bereinigen darf nichts ändern
if (JSON.stringify(ensureMgr(g)) !== again) fail('Managerbilanz nicht idempotent');
console.log(`Managerbilanz 1975/76: Liga ${s0.L.join('/')} · Pokal ${s0.P.join('/')} · ${mlog.n} Pflichtspiele, Spieler ${Object.keys(mlog.players).length}, Rekordsieg ${mlog.big[0]?.slice(4, 6).join(':') ?? '–'}`);
const g2 = roundtrip(g);
run(g2, '1976-10-15');
const d2 = careerData(g2)!;
if (!d2 || d2.tally.n <= mlog.n) fail('laufende Saison fehlt in der Anzeige');
if (d2.seasons.length !== 2 || !d2.seasons[0].live) fail('Saisons-Tabelle falsch');
// Rekonstruktion (alter Spielstand ohne Managerbilanz): Liga aus dem Archiv wie gespeichert.
const g3 = roundtrip(g);
delete (g3.career as any).mgr;
const rebuilt = ensureMgr(g3)!;
if (JSON.stringify(rebuilt.seasons['1975/76']?.L) !== JSON.stringify(s0.L)) fail(`Rekonstruktion Liga ${rebuilt.seasons['1975/76']?.L} ≠ ${s0.L}`);
if (rebuilt.n !== mlog.n) fail(`Rekonstruktion Spielzahl ${rebuilt.n} ≠ ${mlog.n}`);
console.log(`Rekonstruktion alter Spielstand: ${rebuilt.n} Spiele, Liga ${rebuilt.seasons['1975/76'].L.join('/')}`);

// -----------------------------------------------------------------------------
// 2) Migration alter Spielstände
// -----------------------------------------------------------------------------
const gm = fresh('han');
const cm = ensureCareer(gm);
const fake = (id: string, type: string) => ({ id, date: gm.calendar.currentDate, category: 'board', from: 't', subject: 's', shortText: '', bodyText: '', read: false,
  actionRequired: true, choices: [{ id: 'ja', label: 'Annehmen' }], eventRef: { type, deadline: '1975-12-31', defaultChoice: 'nein', data: { offer: 'jo_x' } } }) as any;
gm.messages.push(fake('a', 'career_offer'), fake('b', 'career_sacked'));
cm.offers.push({ id: 'jo_x', clubId: 'mgl', clubName: 'Mönchengladbach', tier: 1, level: 80, when: 'saisonende', wage: 1, goal: 'x', budget: 1, date: '1975-08-01', deadline: '1975-12-31' } as any);
cm.pendingMove = { ...cm.offers[0], fromId: 'han', reason: 'wechsel' } as any;
cm.lastChance = gm.season;
if (pendingDecisions(gm.messages).length < 2) fail('Testaufbau: Entscheidungen fehlen');
migrateCareer(gm); migrateCareer(gm);
if (pendingDecisions(gm.messages).some((m) => m.eventRef?.type.startsWith('career_'))) fail('Karriere-Entscheidung sperrt „Weiter“ weiter');
if (cm.offers.length || cm.pendingMove || cm.lastChance || cm.mode !== 2) fail('Migration unvollständig');
cm.pendingMove = { ...(fake('c', 'x') as any), clubId: 'mgl', fromId: 'han', reason: 'wechsel' }; // Altlast ohne Laden
run(gm, '1976-07-01');
startNextSeason(gm);
if (gm.managedClubId !== 'han') fail('Wechsel aus Altlast vollzogen');
console.log('Migration: Angebote/Entlassungs-Wahl verfallen, zugesagter Wechsel entfällt');

// -----------------------------------------------------------------------------
// 3) Vorstandsdruck gegen den Trainer
// -----------------------------------------------------------------------------
const gp = fresh('mgl', 'career');
hireStaff(gp, candidatesFor(gp, 'cheftrainer')[0]);
const coach = headCoachNow(gp)!;
openCoachEntry(gp)!.from = '1975-07-01';
run(gp, '1975-10-31');
const club = gp.clubs.mgl;
const at = (d: string, conf: number) => { gp.calendar.currentDate = d; club.boardConfidence = conf; boardPressureDaily(gp, d); };
at('1975-11-01', 10);
const ask = pendingDecisions(gp.messages).find((m) => m.eventRef?.type === PRESSURE_TYPE);
if (!ask || ask.eventRef?.data?.coach !== coach.id) fail('keine Druck-Nachricht gegen den Trainer');
if (!ask.choices?.some((x) => x.id === 'entlassen') || !ask.choices.some((x) => x.id === 'stuetzen')) fail('Wahl fehlt');
chooseEventOption(gp, ask, 'stuetzen');
const st = ensureCareer(gp).press!;
if (!st.backed || club.boardConfidence !== 8 || openCoachEntry(gp)?.backed !== 1) fail('Rückendeckung nicht gemerkt');
at('1975-11-15', 8); // zu früh für die Nachprüfung
if (!st.backed) fail('Nachprüfung zu früh');
st.backed.gap = 50; // damals weit hinter dem Ziel → jetzt deutlich besser
at('1975-12-02', 8);
if (st.backed || club.boardConfidence !== 12) fail(`Nachprüfung (Wende) falsch: Vertrauen ${club.boardConfidence}`);
// Zweite Runde: Abstand zum Ziel unverändert → −10 (außer das Ziel ist ohnehin erreicht → +4).
const gapNow = (() => { const o = ownStanding(gp); return o.pos - o.exp; })();
st.backed = { coachId: coach.id, date: '1975-11-01', gap: gapNow, conf: 30 };
at('1975-12-03', 30);
const confAfter = club.boardConfidence;
if (st.backed || confAfter !== (gapNow <= 0 ? 34 : 20)) fail(`Nachprüfung ohne Wende: ${confAfter} (Abstand ${gapNow})`);
st.n = 0; st.last = undefined;
at('1976-01-01', 15);
const ask2 = pendingDecisions(gp.messages).find((m) => m.eventRef?.type === PRESSURE_TYPE);
if (!ask2) fail('zweite Druck-Nachricht fehlt');
chooseEventOption(gp, ask2, 'entlassen');
if (headCoachNow(gp)) fail('Trainer nicht entlassen');
const ended = headCoachRows(gp)[0];
if (ended.live || ended.end !== 'entlassen' || !ended.pressured) fail('Entlassung nicht in „Deine Trainer“');
if (club.coachHistory?.slice(-1)[0]?.name !== coach.name) fail('Entlassung nicht in der Vereins-Trainerhistorie');
if (club.boardConfidence !== 21) fail(`Vertrauen nach Entlassung ${club.boardConfidence}`);
// Ohne Trainer: einmalige Mahnung, keine Entscheidung.
st.n = 0; st.last = undefined;
at('1976-02-01', 5); at('1976-03-01', 5);
if (gp.messages.filter((m) => m.subject === 'Vorstand vermisst einen Cheftrainer').length !== 1) fail('Mahnung ohne Trainer nicht genau einmal');
if (gp.managedClubId !== 'mgl' || careerMsgs(gp).length) fail('Manager entlassen');
console.log(`Vorstandsdruck: Rückendeckung (+4 bei Wende, ${confAfter === 20 ? '−10 ohne' : '+4 Ziel erreicht'}), Entlassung auf Druck → ${ended.name} ${ended.r.w}-${ended.r.d}-${ended.r.l}, Mahnung ohne Trainer`);

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
  // Kasse sicher gefüllt – geprüft wird die Leistungsregel; „ohne Geld“ unten setzt sie auf 0.
  holder.finances.balance = Math.max(holder.finances.balance, 50_000_000);
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
aiBosmanSales(g7, '1997-01-25', Math.random);
const after = g7.aiSquadLog![g7.aiSquadLog!.length - 1];
console.log(`Bosman-Verkäufe ${after.bosmanSales}, Vorverträge ${after.pre} (Kandidaten ${refusers.length})`);
if (refusers.length >= 3 && after.bosmanSales + after.pre === 0) fail('weder Bosman-Verkauf noch Vorvertrag');
// Vor Bosman: kein Verkauf im letzten Jahr, keine Vorverträge
const g8 = fresh('mgl');
for (const p of Object.values(g8.players)) { p.contract.refused = '1976'; p.contract.expiryDate = '1977-06-30'; }
aiBosmanSales(g8, '1977-01-25'); aiPreContracts(g8, '1977-01-15');
if ((g8.aiSquadLog ?? []).some((e) => e.bosmanSales || e.pre)) fail('Bosman-Planung vor 1995');
console.log('OK – Managerkarriere, Vorstandsdruck, Managerbilanz, KI-Leihen und KI-Verträge');
