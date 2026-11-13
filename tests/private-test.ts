// Privatleben & Junger Manager ohne UI (Wunsch Pascal #47): Start mit Geschichte,
// Wochenplan/Monatsabschluss, Partner, Hochzeit, Kinder, Kind in der Jugend,
// Generationswechsel. Läuft nur den Privat-Tageslauf über Jahrzehnte (schnell).
//   node scripts/run-ts.mjs tests/private-test.ts
import { createNewGame } from '../src/game/newGame';
import { CalendarEngine } from '../src/engine/calendar';
import { chooseEventOption } from '../src/game/eventsGame';
import { privateDaily, propose, canPropose, setWish, heirsOf, monthlyCosts, joinYouth } from '../src/game/private/privateGame';
import { ensurePrivate, kidsOf, ageOf, privateTalkBonus, privateTrainingFactor } from '../src/game/private/privateState';
import { handOver } from '../src/game/private/succession';

let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };

const g = createNewGame({
  managedClubId: 'muc', difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  manager: { name: 'Jan Albers', firstName: 'Jan', lastName: 'Albers', nationality: 'GER', birthYear: 1955, birthDate: '1955-03-10', style: 'balanced', background: 'rookie', avatarSeed: 'x', startMode: 'young', story: 'erbe' } as any,
} as any);
const st = ensurePrivate(g);
const self0 = st.persons[st.selfId];
ok(st.story === 'erbe' && ageOf(g, self0) === 20, `Junger Manager: ${self0.first} ${self0.last}, ${ageOf(g, self0)} Jahre, Geschichte ${st.story}`);
ok(g.messages.some((m) => m.subject.startsWith('Deine Geschichte')), 'Brief mit der Hintergrundgeschichte');
ok(Object.values(st.persons).some((p) => p.role === 'eltern'), 'Mutter lebt (Erbe-Geschichte)');
ok(st.money > 0 && Number.isFinite(st.money), `Startvermögen ${Math.round(st.money)}`);

// Privat-Tageslauf über Jahrzehnte; Entscheidungen automatisch.
const prefer: Record<string, string> = { privat_treffen: 'ja', privat_schule: 'verein', privat_weg: 'manager', privat_krise: 'reden' };
let married = '', firstKid = '', youthAt = '', d = g.calendar.currentDate;
const end = '2003-07-01';
st.plan = { erholung: 3, partner: 4, familie: 4, hobby: 2, netzwerk: 1, bildung: 2 };
const startMoney = st.money;
while (d < end) {
  d = CalendarEngine.addDays(d, 1);
  g.calendar.currentDate = d;
  privateDaily(g, d);
  for (const m of g.messages) if (m.eventRef && !m.eventRef.resolved && m.eventRef.type.startsWith('privat_')) {
    const want = prefer[m.eventRef.type];
    chooseEventOption(g, m, m.choices?.some((c) => c.id === want) ? want : m.eventRef.defaultChoice ?? m.choices![0].id);
  }
  if (st.partnerId && !st.wish) setWish(g, true);
  if (canPropose(st) && !married) { propose(g); if (st.married) married = d; }
  const kids = kidsOf(st);
  if (kids.length && !firstKid) firstKid = d;
  for (const k of kids) if (k.sex === 'm' && !k.playerId && ageOf(g, k) >= 7 && ageOf(g, k) < 12) joinYouth(g, st, k);
  if (!youthAt && kids.some((k) => k.playerId && g.youthPlayers[k.playerId])) youthAt = d;
}
ok(Number.isFinite(st.money) && Number.isFinite(st.energy) && st.energy >= 0 && st.energy <= 100, `Werte stabil: Konto ${Math.round(st.money)} (Start ${Math.round(startMoney)}), Energie ${Math.round(st.energy)}, Laune ${Math.round(st.mood)}, Gesundheit ${Math.round(st.health)}`);
ok(st.partnerId, `Partner: ${st.partnerId ? st.persons[st.partnerId].first : '-'}, Beziehung ${Math.round(st.rel)}`);
ok(married, `Hochzeit am ${married}`);
ok(firstKid, `erstes Kind am ${firstKid}; Kinder: ${kidsOf(st).map((k) => `${k.first} (${ageOf(g, k)}, ${k.sex}, Weg ${k.path}, Führung ${Math.round(k.fuehrung ?? 0)})`).join(', ')}`);
ok(Object.values(st.skills).some((v) => v >= 4), `Weiterbildung: ${JSON.stringify(st.skills)}`);
const c = monthlyCosts(g, st);
ok(c.income > 0 && c.living > 0, `Monatsrechnung: Gehalt ${c.income}, Leben ${c.living}, Kinder ${c.kids}`);
ok(privateTrainingFactor(g) > 0.9 && privateTrainingFactor(g) < 1.1 && Math.abs(privateTalkBonus(g)) < 0.15, `Wirkung: Training ×${privateTrainingFactor(g).toFixed(3)}, Gespräche ${privateTalkBonus(g).toFixed(3)}`);
const kidPlayer = kidsOf(st).find((k) => k.playerId);
ok(!kidsOf(st).some((k) => k.sex === 'm') || youthAt, `Sohn in der eigenen Jugend ab ${youthAt || '-'}${kidPlayer ? ` (${g.youthPlayers[kidPlayer.playerId!]?.fullName ?? g.players[kidPlayer.playerId!]?.fullName})` : ''}`);

// Bis das älteste Kind volljährig ist, dann übergeben.
while (!heirsOf(g, st).length && d < '2030-01-01') { d = CalendarEngine.addDays(d, 1); g.calendar.currentDate = d; privateDaily(g, d); for (const m of g.messages) if (m.eventRef && !m.eventRef.resolved && m.eventRef.type.startsWith('privat_')) chooseEventOption(g, m, prefer[m.eventRef.type] && m.choices?.some((x) => x.id === prefer[m.eventRef!.type]) ? prefer[m.eventRef.type] : m.eventRef.defaultChoice!); }
const heirs = heirsOf(g, st);
ok(heirs.length, `Erben am ${d}: ${heirs.map((h) => h.first).join(', ')}`);
if (heirs.length) {
  const oldName = g.manager.name;
  const txt = handOver(g, heirs[0].id);
  ok(g.manager.name !== oldName && st.selfId === heirs[0].id && st.gen === 2, `Generationswechsel: ${oldName} → ${g.manager.name} (${txt})`);
  ok(st.persons[Object.keys(st.persons).find((id) => st.persons[id].first === oldName.split(' ')[0] && st.persons[id].role === 'alt')!] , 'alter Manager bleibt in der Familie (Rolle alt)');
}
console.log(fails ? `\n${fails} Fehler.` : '\nPrivatleben: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
