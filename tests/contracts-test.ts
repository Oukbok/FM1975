// Vertrags-Test ohne UI: Forderung, Angebot, Vertragsende vor/nach Bosman, Vorvertrag.
//   node scripts/run-ts.mjs tests/contracts-test.ts
import { createNewGame } from '../src/game/newGame';
import { demandFor, offerContract, handleContractExpiry, contractReminders } from '../src/game/contracts';
import { Game } from '../src/game/state';

let seed = 7;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

function fresh(): Game {
  return createNewGame({
    managedClubId: 'mgl',
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  });
}
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }

// 1) Verhandlung
const g = fresh();
const club = g.clubs[g.managedClubId];
g.calendar.currentDate = '1976-02-01';
const squad = club.playerIds.map((id) => g.players[id]);
const p = squad.find((x) => x.contract.expiryDate === '1976-06-30') ?? squad[0];
p.contract.expiryDate = '1976-06-30';
p.contract.satisfaction = 80;
p.morale = 'good';
const dem = demandFor(g, p);
console.log(`Forderung ${p.fullName}: ${dem.wage} (bisher ${p.contract.weeklyWage}), ${dem.minYears}-${dem.maxYears} J., ${dem.mood}`);
if (!dem.open) fail('Gespräch sollte offen sein: ' + dem.blockedText);
const low = offerContract(g, p.id, Math.round(dem.wage * 0.6), dem.minYears);
if (low.ok) fail('Zu niedriges Angebot angenommen');
const ok = offerContract(g, p.id, Math.round(dem.wage * 1.1), dem.minYears);
if (!ok.ok && !ok.text.includes('Vorstand')) fail('Gutes Angebot abgelehnt: ' + ok.text);
console.log('Angebot:', ok.text, '→', p.contract.expiryDate);

// 2) Vertragsende vor Bosman: Spieler gehen gegen Ablöse
const g2 = fresh();
const c2 = g2.clubs[g2.managedClubId];
const exp = c2.playerIds.map((id) => g2.players[id]).filter((x) => x.contract.expiryDate === '1976-06-30' && x.age < 34);
const bal0 = c2.finances.balance;
g2.calendar.currentDate = '1976-07-01';
handleContractExpiry(g2, '1976-07-01');
const gone = exp.filter((x) => x.clubId !== c2.id);
console.log(`1976: ${exp.length} auslaufend, ${gone.length} gewechselt, Ablöse +${c2.finances.balance - bal0}`);
if (exp.length && !gone.length) fail('Kein Spieler gewechselt');
if (gone.length && c2.finances.balance <= bal0) fail('Keine Ablöse vor Bosman');

// 3) Nach Bosman: ablösefrei, Vorverträge im Januar
const g3 = fresh();
const c3 = g3.clubs[g3.managedClubId];
for (const id of c3.playerIds) g3.players[id].contract.expiryDate = '1998-06-30';
g3.calendar.currentDate = '1998-01-15';
contractReminders(g3, '1998-01-15');
const pre = c3.playerIds.filter((id) => g3.players[id].contract.preContractClubId).length;
const bal3 = c3.finances.balance;
handleContractExpiry(g3, '1998-07-01');
console.log(`1998: Vorverträge ${pre}, Kader danach ${c3.playerIds.length}, Kontoänderung ${c3.finances.balance - bal3}`);
if (c3.finances.balance !== bal3) fail('Bosman: es darf keine Ablöse fließen');
const stillExpired = Object.values(g3.players).filter((x) => x.contract.expiryDate <= '1998-06-30' && !x.isYouth).length;
if (stillExpired) fail(`${stillExpired} Spieler mit abgelaufenem Vertrag übrig`);
// 4) KI-Angebote und Kabinenfrieden
import('../src/game/aiOffers').then(async ({ rollAiOffers, monthlySquadHarmony }) => {
  const { chooseEventOption } = await import('../src/game/eventsGame');
  const g4 = fresh();
  const c4 = g4.clubs[g4.managedClubId];
  let offers = 0;
  for (let y = 1976; y < 1990 && offers < 3; y++) {
    for (const md of ['07-08', '07-22', '08-05', '08-19', '01-06', '01-20']) {
      g4.calendar.currentDate = `${y}-${md}`;
      rollAiOffers(g4, g4.calendar.currentDate);
    }
    offers = g4.messages.filter((m) => m.eventRef?.type === 'ai_offer').length;
  }
  const m = g4.messages.find((x) => x.eventRef?.type === 'ai_offer');
  console.log(`KI-Angebote: ${offers}${m ? ' – ' + m.subject : ''}`);
  if (!m) fail('Kein KI-Angebot in 14 Jahren');
  const pid = m.eventRef!.playerId!;
  const n0 = c4.playerIds.length;
  console.log(chooseEventOption(g4, m, 'annehmen'));
  if (g4.players[pid].clubId === c4.id || c4.playerIds.length !== n0 - 1) fail('Verkauf nicht vollzogen');
  for (const id of c4.playerIds) g4.players[id].development.recentMinutes = 0;
  for (let i = 0; i < 6; i++) monthlySquadHarmony(g4, `1990-1${i % 3}-01`);
  const sat = c4.playerIds.map((id) => g4.players[id].contract.satisfaction);
  console.log('Zufriedenheit ohne Spielzeit: min', Math.min(...sat).toFixed(0), 'max', Math.max(...sat).toFixed(0));
  console.log('Vertrags-Test bestanden.');
});
