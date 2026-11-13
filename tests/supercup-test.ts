// Supercups & Ligapokal ohne UI (Wunsch Pascal #46): Termine vor dem Ligastart,
// eigenes Spiel über findOwnMatchDue, Titel/Prämie/Archiv, Ligapokal mit 6 Teams,
// Hintergrund-Länder. Optional ein echter Saisonwechsel:
//   node scripts/run-ts.mjs tests/supercup-test.ts [voll]
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findMatch, findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { setupSuperCups, superCupState, superCupResultOf, type ScSeeds } from '../src/game/superCupGame';
import { titlesOf } from '../src/game/clubRecords';
import { startNextSeason } from '../src/game/season';
import { trophiesOf } from '../src/game/trophyCabinet';

let fails = 0;
const ok = (c: unknown, l: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${l}`); if (!c) fails++; };
let ownSc = 0;
const ui: DayUi = { onOwnMatchDue: (d) => { if (/Supercup|Ligapokal/.test(d.label)) ownSc++; }, onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };

function make(year: number) {
  const g = createNewGame({ managedClubId: 'muc', manager: { name: 'T', nationality: 'GER', birthYear: year - 35, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year } as any);
  (g as any).simAutoManage = true;
  return g;
}
function seeds(g: ReturnType<typeof make>): ScSeeds {
  const rows = g.table.rows.map((r) => r.clubId).filter((id) => id !== 'muc');
  return { order: ['muc', ...rows], cupWinner: rows[3], cupFinalist: rows[5], ec: 'muc', cwc: null, uefa: Object.keys(g.euroClubs ?? {}).find((id) => !g.clubs[id]) ?? null };
}
function runUntil(g: ReturnType<typeof make>, until: string) {
  ownSc = 0;
  while (g.calendar.currentDate < until) {
    const went = processDay(g, ui);
    if (!went) { const due = findOwnMatchDue(g); if (due) quickSimOwnMatch(g, due); processDay(g, ui); }
  }
  return ownSc;
}

for (const [year, name, n] of [[2012, 'Supercup', 1], [1999, 'Ligapokal', 3], [1990, 'Supercup', 1]] as const) {
  const g = make(year);
  setupSuperCups(g, seeds(g));
  const st = superCupState(g);
  const ev = st.events.find((e) => e.key === 'home');
  ok(ev && ev.name === name, `${year}: ${ev?.name} mit ${ev?.teams.length} Teams, Termine ${ev?.matches.map((m) => `${m.stage} ${m.date}`).join(', ')}`);
  const first = g.fixtures.reduce((a, m) => (m.date < a ? m.date : a), '9999');
  ok(ev && ev.matches.every((m) => m.date < first && m.date >= `${year}-07-01`), `${year}: alle Spiele vor dem ersten Ligaspieltag (${first})`);
  ok(ev && ev.matches.every((m) => !g.fixtures.some((f) => f.date === m.date && (f.homeClubId === m.home || f.awayClubId === m.home))), `${year}: keine Kollision mit Ligaspielen`);
  const own = runUntil(g, first);
  ok(own >= (name === 'Ligapokal' ? 1 : n), `${year}: eigenes Spiel über findOwnMatchDue (${own}×)`);
  ok(ev?.winner && ev.matches.every((m) => m.played), `${year}: Sieger ${ev?.winner ? g.clubs[ev.winner]?.name : '-'}${ev?.shared ? ' (geteilt)' : ''}`);
  const won = titlesOf(g, ev!.winner!).some((t) => t.kind === (name === 'Ligapokal' ? 'ligapokal' : 'super'));
  ok(won, `${year}: Titel beim Sieger eingetragen`);
  const tr = trophiesOf(g, ev!.winner!).find((t) => t.kind === 'super' || t.kind === 'ligapokal');
  ok(tr && tr.cat === 'pokal', `${year}: Trophäenschrank „${tr?.title}“ (${tr?.cat})`);
  const m = ev!.matches.find((x) => x.home === 'muc' || x.away === 'muc');
  ok(m?.match && findMatch(g, m.match.id), `${year}: Spielbericht auffindbar (${m?.hg}:${m?.ag})`);
  ok(superCupResultOf(g, g.season, 'muc'), `${year}: Karriere-Spalte „${superCupResultOf(g, g.season, 'muc')}“`);
  ok(st.archive.some((a) => a.country === 'Deutschland' && a.season === g.season), `${year}: Archiv-Eintrag`);
  const bg = st.archive.filter((a) => a.country !== 'Deutschland' && a.country !== 'Europa');
  ok(bg.length >= 3, `${year}: Hintergrund-Länder ${bg.map((a) => a.country).join(', ')}`);
  const u = st.events.find((e) => e.key === 'uefa');
  if (u) {
    runUntil(g, `${year}-09-05`);
    ok(u.winner, `${year}: Europäischer Supercup am ${u.matches[0].date}: ${u.matches[0].hg}:${u.matches[0].ag}`);
  }
  if (process.env.DUMP && year === 2012) {
    // Spielstand für Screenshots (Statistiken › Supercup, Karriere › Saisons).
    const { compressToUTF16 } = await import('lz-string');
    const { writeFileSync } = await import('node:fs');
    for (let k = 0; k < 10 && findOwnMatchDue(g); k++) { quickSimOwnMatch(g, findOwnMatchDue(g)!); processDay(g, ui); }
    delete (g as any).simAutoManage;
    const meta = { slot: 'sim', name: 'Simulation', managerName: 'Sim', clubName: g.clubs.muc.name, clubId: 'muc', season: g.season, gameDate: g.calendar.currentDate, savedAt: new Date().toISOString(), version: (await import('../src/engine/save')).SAVE_VERSION };
    writeFileSync(process.env.DUMP, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: g })));
    (g as any).simAutoManage = true;
  }
}

if (process.argv[2] === 'voll') {
  // Echter Saisonwechsel 2009/10 → 2010/11: Teilnehmer aus Tabelle und Pokal.
  const g = make(2009);
  // Saisonwechsel direkt (ohne die Saison auszuspielen): Tabelle/Pokal liefern Teilnehmer.
  g.calendar.currentDate = '2010-06-30';
  startNextSeason(g);
  const first = g.fixtures.reduce((a, m) => (m.date < a ? m.date : a), '9999');
  ok(superCupState(g).events.some((e) => e.matches.every((m) => m.date < first)), `Saisonwechsel: Termine vor dem Ligastart ${first}`);
  runUntil(g, first);
  const st = superCupState(g);
  const ev = st.events.find((e) => e.key === 'home');
  ok(ev && ev.season === '2010/11' && ev.winner, `Saisonwechsel: ${ev?.name} ${ev?.season}, ${ev?.teams.map((id) => g.clubs[id]?.name).join(' – ')}, Sieger ${ev?.winner}`);
}

console.log(fails ? `\n${fails} Fehler.` : '\nSupercup: alle Prüfungen bestanden.');
process.exit(fails ? 1 : 0);
