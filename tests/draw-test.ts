// Pokalauslosung ohne UI: Ziehungstermine je Epoche, Regeln (Heimrecht der
// Amateure, Setzliste, Länderschutz), vollständige Paarungen, unveränderte
// Spieltermine, Ziehung erst am Auslosungstag, alte Spielstände unverändert.
//   npm run test:draw
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI, type DayUi } from '../src/game/day';
import { Game } from '../src/game/state';
import { CalendarEngine } from '../src/engine/calendar';
import { createCup } from '../src/engine/cup';
import { runDraw } from '../src/engine/cupDrawRules';
import { daysBetween, drawDateFor, drawRulesFor, drawVenue } from '../src/data/drawHistory';
import { DRAW_COMPS, compCup, hasScheduledDraw, type DrawNotice } from '../src/game/cupDraw';
import { startNextSeason } from '../src/game/season';
import type { DrawComp } from '../src/types/draw';
import { ENGINE_TIEBREAK, ruleSheet } from '../src/data/drawRuleSheet';
import { bracketFromCup } from '../src/game/cupBracket';

let seed = 1976;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let failures = 0;
const check = (cond: boolean, msg: string) => { if (!cond) { failures++; console.error('FEHLER:', msg); } };
const wd = (iso: string) => ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(iso + 'T00:00:00Z').getUTCDay()];

// 1) Termine je Epoche (synthetische Rundentermine wie im Spiel)
const ROUNDS: Record<DrawComp, string[]> = {
  cup: ['09-24', '11-05', '12-17', '04-01', '06-20'],
  ec: ['10-22', '03-03', '04-07', '05-12'],
  cwc: ['10-01', '03-17', '04-21', '05-05'],
  uefa: ['09-17', '10-29', '03-10', '04-14', '05-19'],
};
for (const y of [1976, 1985, 1993, 2005, 2020]) {
  const line: string[] = [];
  for (const comp of DRAW_COMPS) {
    const dates = ROUNDS[comp].map((md) => `${Number(md.slice(0, 2)) >= 7 ? y : y + 1}-${md}`);
    dates.forEach((rd, i) => {
      const d = drawDateFor(comp, i, dates.length, y, rd, i ? dates[i - 1] : null, `${y}-07-01`);
      if (i === dates.length - 1) { check(d === null, `${comp} ${y}: Finale ohne Ziehung`); return; }
      check(!!d, `${comp} ${y} R${i}: Termin fehlt`);
      if (!d) return;
      check(d > (i ? dates[i - 1] : `${y}-07-01`), `${comp} ${y} R${i}: Ziehung ${d} nicht nach der Vorrunde`);
      check(daysBetween(d, rd) >= 3, `${comp} ${y} R${i}: Ziehung ${d} zu knapp vor ${rd}`);
      if (i === 0) line.push(`${comp} ${d.slice(5)} ${wd(d)} (${drawVenue(comp, 0, y).venue})`);
    });
  }
  console.log(`${y}/${String((y + 1) % 100).padStart(2, '0')}  ` + line.join(' · '));
}
check(drawDateFor('cup', 0, 5, 1976, '1976-09-24', null, '1976-07-01') === '1976-07-17', 'Landespokal 1976: Samstag Mitte Juli');
check(wd(drawDateFor('cup', 1, 5, 2020, '2020-11-05', '2020-09-24', '2020-07-01')!) === 'So', 'ab 2017 sonntags');
check(wd(drawDateFor('cup', 1, 5, 1990, '1990-11-05', '1990-09-24', '1990-07-01')!) === 'Sa', 'vor 2017 samstags');
check(drawDateFor('ec', 0, 4, 2005, '2005-10-22', null, '2005-07-01')!.slice(5, 7) === '08', 'Monaco Ende August');
check(drawVenue('ec', 0, 1980).venue === 'Zürich' && drawVenue('ec', 0, 1992).venue === 'Genf' && drawVenue('ec', 1, 2000).venue === 'Nyon', 'Orte Europapokal');

// 2) Regeln
const ids = (p: string, n: number) => Array.from({ length: n }, (_, i) => `${p}${i}`);
const base = { seed: 7, strengthOf: (id: string) => Number(id.replace(/\D/g, '')) + (id.startsWith('am') ? 0 : 50), nameOf: (id: string) => id, countryOf: () => 'X' };
for (const y of [1976, 1985]) {
  const all = [...ids('pro', 18), ...ids('am', 14)];
  for (let s = 0; s < 30; s++) {
    const r = runDraw({ ...base, seed: s, ids: all, rules: drawRulesFor('cup', 0, y), isAmateur: (id) => id.startsWith('am') });
    const used = r.pairs.flatMap((p) => [p.home, p.away]);
    check(used.length === 32 && new Set(used).size === 32, `Landespokal ${y}: Paarungen unvollständig`);
    check(r.balls.filter((b) => !b.rejected).length === 32, `Landespokal ${y}: Kugeln ≠ Teilnehmer`);
    const mixed = r.pairs.filter((p) => p.home.startsWith('am') !== p.away.startsWith('am'));
    if (y >= 1982) {
      check(r.pots.length === 2, '1985: zwei Töpfe');
      check(mixed.length === 14 && mixed.every((p) => p.home.startsWith('am')), '1985: Amateure haben Heimrecht und treffen alle auf Profis');
    } else check(r.pots.length === 1, '1976: ein Topf');
  }
  // Folgerunde: Heimrecht-Tausch
  const r = runDraw({ ...base, seed: 3, ids: [...ids('pro', 12), ...ids('am', 4)], rules: drawRulesFor('cup', 1, y), isAmateur: (id) => id.startsWith('am') });
  const amAway = r.pairs.filter((p) => p.away.startsWith('am') && !p.home.startsWith('am')).length;
  check(y >= 1982 ? amAway === 0 : true, `${y}: Amateur auswärts gegen Profi trotz Regel`);
}
{
  // Europa-Pokal: 32 Teams, 8 Länder à 4 → Länderschutz + Setzliste
  const field = ids('eu', 32);
  const country = (id: string) => `L${Number(id.slice(2)) % 8}`;
  let seededHome = 0;
  for (let s = 0; s < 40; s++) {
    const r = runDraw({ ...base, seed: s, ids: field, countryOf: country, rules: drawRulesFor('uefa', 0, 1990), isAmateur: () => false });
    check(r.pairs.length === 16 && r.pairs.every((p) => country(p.home) !== country(p.away)), 'Länderschutz verletzt');
    const seeded = new Set(r.pots[1].ids);
    check(r.pots.length === 2 && r.pairs.every((p) => seeded.has(p.home) !== seeded.has(p.away)), 'Setzliste verletzt');
    const homeSeeded = r.pairs.filter((p) => seeded.has(p.home)).length;
    check(r.balls.filter((b) => !b.rejected).every((b, i, arr) => i % 2 === 1 || r.pairs[b.pair].home === b.id || r.pairs[b.pair].swapped), 'zuerst gezogen = Heimrecht');
    seededHome += homeSeeded;
  }
  check(seededHome > 40 * 16 * 0.35 && seededHome < 40 * 16 * 0.65, `Heimrecht Gesetzte ${seededHome} von 640 – etwa die Hälfte erwartet`);
  const r1 = drawRulesFor('uefa', 2, 1990);
  check(!r1.countryProtection && !r1.seeded, 'Viertelfinale ohne Schutz/Setzliste');
}

// 2b) Regeltexte je Epoche (Startbildschirm) – müssen dem entsprechen, was die Engine spielt.
{
  const names: Record<DrawComp, string[]> = {
    cup: ['1. Hauptrunde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'],
    ec: ['Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'],
    cwc: ['Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'],
    uefa: ['1. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'],
  };
  const sheet = (comp: DrawComp, ri: number, y: number) => {
    const rules = drawRulesFor(comp, ri, y);
    const pots = rules.twoPots || rules.seeded ? 2 : 1;
    return ruleSheet({ comp, roundIndex: ri, roundNames: names[comp], startYear: y, rules, potCount: pots });
  };
  const has = (items: ReturnType<typeof sheet>, re: RegExp) => items.some((i) => re.test(`${i.title} ${i.text} ${i.history ?? ''}`));
  for (const y of [1975, 1982, 1990, 1991, 1999, 2004, 2020, 2021, 2030]) {
    for (const comp of DRAW_COMPS) {
      names[comp].forEach((_, ri) => {
        const it = sheet(comp, ri, y);
        const tag = `${comp} ${y} R${ri}`;
        // Engine: immer ein Spiel, Verlängerung + Elfmeterschießen.
        check(it[0].title === 'Ein Spiel' && it.some((i) => i.text === ENGINE_TIEBREAK), `${tag}: Engine-Regeln fehlen`);
        check(!it.some((i) => /Wiederholungsspiel|Hin- und Rückspiel|doppelt/.test(i.text) && !/Kein Hin-|nicht doppelt/.test(i.text)), `${tag}: Regeltext widerspricht der Engine`);
        const repl = has(it, /Wiederholungsspiel/);
        check(comp === 'cup' && ri < 4 ? repl === (y <= 1990) : !repl, `${tag}: Hinweis Wiederholungsspiel falsch`);
        if (comp !== 'cup') {
          check(has(it, /Auswärtstore/), `${tag}: Auswärtstore fehlen`);
          check(y <= 2020 ? has(it, /doppelt \(bis 2020\/21\)/) : has(it, /seit 2021\/22 abgeschafft/), `${tag}: Auswärtstorregel falsch datiert`);
          const twoLegs = has(it, /Im Original Hin- und Rückspiel/);
          const finalOne = ri === names[comp].length - 1 && (comp !== 'uefa' || y >= 1997);
          check(twoLegs === !finalOne, `${tag}: Hinweis Hin-/Rückspiel falsch`);
        } else check(!has(it, /Auswärtstor/), `${tag}: Auswärtstore im Landespokal`);
        if (comp === 'cup' && ri === 0) check(has(it, /Zwei Lostöpfe/) === (y >= 1982), `${tag}: Lostöpfe`);
        check(has(it, /Amateurvereine empfangen Profis/) === (comp === 'cup' && y >= 1982), `${tag}: Heimrecht Amateure`);
        check(has(it, /Gruppenphase/) === ((comp === 'ec' && y >= 1991) || (comp === 'uefa' && y >= 2004)), `${tag}: Hinweis Gruppenphase`);
      });
    }
    const c0 = sheet('cup', 0, y), e0 = sheet('ec', 0, y);
    console.log(`Regeln ${y}: Pokal ${c0.map((i) => i.title + (i.history ? '*' : '')).join(', ')} | Landesmeister ${e0.map((i) => i.title + (i.history ? '*' : '')).join(', ')}`);
  }
}

// 3) Alter Spielstand: ohne Aufschub sofort gelost, kein Termin.
{
  const c = createCup(ids('pro', 18), ids('am', 14), new Set(), 5, '1980-07-01', 'pro0');
  check(c.rounds[0].drawn && !c.rounds[0].drawDate && !hasScheduledDraw(c, 1), 'Alt-Verfahren unverändert');
}

// 4) Ganze Saisons: Ziehung erst am Termin, Spieltermine unverändert
const g: Game = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, legendMode: 'fictional',
});
(g as any).simAutoManage = true;
const seasons = Number(process.argv[2] ?? 8);
const notices: DrawNotice[] = [];
const ui: DayUi = { ...HEADLESS_UI, onCupDraw: (d) => { notices.push(d); return d.involvesMe; } };
for (let s = 0; s < seasons; s++) {
  const before: Record<string, string[]> = {};
  for (const comp of DRAW_COMPS) {
    const cup = compCup(g, comp);
    if (!cup) continue;
    before[comp] = cup.rounds.map((r) => r.date);
    cup.rounds.forEach((r, i) => {
      if (i < cup.rounds.length - 1) check(!r.drawn && !!r.drawDate, `${g.season} ${comp} R${i}: schon zu Saisonbeginn gelost`);
    });
  }
  let guard = 0; let stops = 0;
  while (!CalendarEngine.isSeasonOver(g.calendar) && guard++ < 1000) {
    const today = g.calendar.currentDate;
    // Vor dem Termin darf nichts gelost sein.
    for (const comp of DRAW_COMPS) for (const r of compCup(g, comp)?.rounds ?? []) {
      if (r.drawDate && r.drawDate > today) check(!r.drawn, `${g.season} ${comp} ${r.name}: vor ${r.drawDate} gelost`);
    }
    const t = g.clubs[g.managedClubId]?.tactics;
    if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
    if (!processDay(g, ui)) stops++;
  }
  const y = Number(g.season.slice(0, 4));
  for (const comp of DRAW_COMPS) {
    const cup = compCup(g, comp);
    if (!cup) continue;
    check(JSON.stringify(cup.rounds.map((r) => r.date)) === JSON.stringify(before[comp]), `${g.season} ${comp}: Spieltermine verändert`);
    check(!!cup.winnerClubId, `${g.season} ${comp}: kein Sieger`);
    cup.rounds.forEach((r, i) => {
      check(r.drawn && r.ties.every((t) => t.played && t.date === r.date), `${g.season} ${comp} ${r.name}: nicht vollständig gespielt`);
      if (i === cup.rounds.length - 1) return;
      check(!!r.draw && r.draw.date === r.drawDate, `${g.season} ${comp} ${r.name}: Ziehung nicht am Termin`);
      check(r.draw!.pairs.length === r.ties.length && r.draw!.pairs.every((p, k) => p.home === r.ties[k].homeClubId && p.away === r.ties[k].awayClubId), `${comp} ${r.name}: Ablauf ≠ Begegnungen`);
      if (comp === 'cup' && y >= 1982) {
        const am = new Set(cup.amateurClubIds);
        check(r.ties.every((t) => !(am.has(t.awayClubId) && !am.has(t.homeClubId))), `${g.season} ${r.name}: Amateur auswärts gegen Profi`);
      }
      if (comp !== 'cup' && r.draw!.rules.some((x) => x.startsWith('Länderschutz'))) {
        const ctry = (id: string) => g.euroClubs?.[id]?.country ?? 'Deutschland';
        const bad = r.ties.filter((t) => ctry(t.homeClubId) === ctry(t.awayClubId)).length;
        check(bad === 0, `${g.season} ${comp} ${r.name}: ${bad} Paarungen aus einem Land`);
      }
    });
  }
  // Turnierbaum: jede Paarung der nächsten Runde stammt aus den beiden Begegnungen darüber.
  for (const comp of DRAW_COMPS) {
    const cup = compCup(g, comp);
    if (!cup) continue;
    const br = bracketFromCup(cup);
    br.forEach((r, i) => {
      check(r.ties.length === br[0].ties.length / (1 << i), `${g.season} ${comp} Baum: Rundengröße ${r.name}`);
      if (i === 0) return;
      r.ties.forEach((t, k) => {
        if (!t) return;
        const a = br[i - 1].ties[2 * k], b = br[i - 1].ties[2 * k + 1];
        check(!!a && !!b && a.winner === t.home && b.winner === t.away, `${g.season} ${comp} Baum: ${r.name} Paarung ${k + 1} nicht aus der Vorrunde`);
      });
    });
  }
  const dl = DRAW_COMPS.flatMap((c) => (compCup(g, c)?.rounds ?? []).filter((r) => r.draw).map((r) => `${c}:${r.draw!.date.slice(5)}`));
  console.log(`${g.season}: ${dl.length} Ziehungen (${dl.join(' ')}), Halte ${stops}`);
  startNextSeason(g);
}
check(notices.length > 0 && notices.some((n) => n.involvesMe), 'Oberfläche wurde über Ziehungen informiert');

console.log(failures ? `\n${failures} Fehler` : '\nAlle Auslosungs-Prüfungen bestanden.');
process.exit(failures ? 1 : 0);
