// Nationalmannschaften ohne UI (Wunsch Pascal #36): Turnierformate 4/8/16/24/32/48,
// Länderspielfenster ohne eigenes Pflichtspiel, Abstellung + Rückkehr, Länderspiele
// an Player.intl, EM 1976 im Spielablauf, Marktwert-Schub.
//   node scripts/run-ts.mjs tests/national-test.ts [bis-datum]
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { nationalState } from '../src/game/national/nationalGame';
import { allStrengths } from '../src/game/national/pool';
import { buildTournament } from '../src/game/national/tournament';
import { intlValueFactor } from '../src/engine/clubEconomy';
import { ownFixtures } from '../src/game/trainingWeek';
import { TOURNAMENTS } from '../src/data/nationalTeams';

let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
const until = process.argv[2] || '1976-06-28'; // der 30.6. braucht den Saisonwechsel (startNextSeason)
const ui: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
const g = createNewGame({ managedClubId: 'muc', manager: { name: 'T', nationality: 'GER', birthYear: 1945, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300 });
(g as any).simAutoManage = true;

// Formate unabhängig vom Spielablauf
const str = allStrengths(g, g.calendar.currentDate);
ok(str.size >= 50 && (str.get('GER') ?? 0) > 70, `Stärken für ${str.size} Nationen, GER ${str.get('GER')}, BRA ${str.get('BRA')}`);
for (const teams of [4, 8, 16, 24, 32, 48]) {
  const def = TOURNAMENTS.find((t) => t.teams === teams)!;
  const t = buildTournament(def, str, def.year, def.place);
  const final = t.matches.filter((m) => m.stage === 'F');
  const n = new Set(t.teams).size;
  ok(n === teams && final.length === 1 && t.winner && t.result[t.winner] && t.matches.every((m) => m.date >= def.start && m.date <= def.end),
    `${def.kind} ${def.year}: ${n} Teams, ${t.matches.length} Spiele, Sieger ${t.winner}, Finale ${final[0]?.a}–${final[0]?.b} am ${final[0]?.date}`);
}

let awaySeen = 0, clash = 0;
const tick = () => {
  const went = processDay(g, ui);
  if (!went) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } }
};
const t0 = Date.now();
while (g.calendar.currentDate < until) {
  tick();
  if (g.calendar.currentDate.endsWith('-01')) console.log(`  … ${g.calendar.currentDate} (${Math.round((Date.now() - t0) / 1000)} s)`);
  const me = g.clubs[g.managedClubId];
  const away = me.playerIds.filter((id) => g.players[id]?.availability === 'international');
  if (away.length) {
    awaySeen++;
    if (ownFixtures(g, g.calendar.currentDate, g.calendar.currentDate).size && g.calendar.currentDate.slice(5, 7) !== '06') { clash++; console.log('  Kollision', g.calendar.currentDate, [...ownFixtures(g, g.calendar.currentDate, g.calendar.currentDate).values()].map((f) => f.comp).join()); }
  }
}
const st = nationalState(g);
ok(st.windows.length >= 4, `Länderspielfenster 1975/76: ${st.windows.map((w) => w.dates.join('+')).join(', ')}`);
ok(st.windows.every((w) => w.matches.length > 20), 'in jedem Fenster spielen alle Nationen');
ok(awaySeen > 0, `Spieler des eigenen Vereins abgestellt (${awaySeen} Tage)`);
ok(clash === 0, `keine Abstellung an eigenen Spieltagen außerhalb der Turniere (${clash})`);
const capped = Object.values(g.players).filter((p) => p.intl?.caps);
ok(capped.length > 30, `${capped.length} Spieler mit Länderspielen`);
const ger = capped.filter((p) => p.nationality === 'GER').sort((a, b) => (b.intl!.caps) - (a.intl!.caps));
ok(ger.length >= 18, `GER-Nationalspieler: ${ger.slice(0, 5).map((p) => `${p.fullName} ${p.intl!.caps}/${p.intl!.goals}`).join(', ')}`);
if (until >= '1976-06-21') {
  const em = st.archive.find((a) => a.kind === 'EM' && a.year === 1976);
  ok(em, `EM 1976: ${em ? `${em.winner} vor ${em.runnerUp}, GER ${em.home}` : 'fehlt'}`);
  const tp = capped.find((p) => p.intl?.tourn?.length);
  ok(tp && intlValueFactor(tp, 1976) > 1, `Turnierteilnehmer mit Marktwert-Faktor ${tp ? intlValueFactor(tp, 1976).toFixed(2) : '-'}`);
  ok(!Object.values(g.players).some((p) => p.availability === 'international' && !st.away[p.id]), 'alle Abgestellten zurück');
}
console.log(fails ? `\n${fails} Fehler.` : '\nNationalmannschaften: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
