// Prüfungen Auslandsgäste + Hallenturniere im Ausland (Wunsch Pascal), aufgerufen aus tests/winter-test.ts.
//  • Gäste in deutschen Turnieren bis 1997 (nur Länder mit Winterpause, Ostblock vor 1989 erlaubt), nie im Masters, ab 1998 keine
//  • Auslandsturniere je Epoche (Jahre/Formate aus data/indoorAbroad.ts), Schweizer Finale aus den Vorrunden
//  • Einladung des eigenen Vereins ins Ausland (Zusage, Winterpause, Archiv), Speichern/Laden, alter Spielstand ohne Felder
//  • anderes Heimatland (Österreich): Wiener Turnier = Heimturnier, keine deutschen Turniere
import type { Game } from '../src/game/state';
import { allTournaments, indoorDaily, setOwnIndoorDecision } from '../src/game/indoorGame';
import { indoorState } from '../src/game/winterShared';
import { BreakCache } from '../src/game/indoorWindow';
import { GUEST_COUNTRIES, GUESTS_LAST_WINTER } from '../src/data/indoorHistory';
import { ABROAD_BY_ID, abroadFor } from '../src/data/indoorAbroad';
import { foreignCountry } from '../src/game/competitionView';
import { isForeignId } from '../src/engine/worldTypes';
import { CalendarEngine } from '../src/engine/calendar';
import { createNewGame } from '../src/game/newGame';
import { composeHome } from '../src/game/worldCompose';

type Fresh = () => Game;
type RunWinter = (g: Game, season: string, before?: (d: string) => void) => void;

const EAST = new Set(['Tschechoslowakei', 'Sowjetunion', 'Polen', 'Ungarn', 'Jugoslawien']);
const season = (wy: number) => `${wy - 1}/${String(wy % 100).padStart(2, '0')}`;

export function abroadChecks(fresh: Fresh, runWinter: RunWinter, expect: (c: boolean, m: string) => void): void {
  // 1) Gäste in deutschen Turnieren
  const g = fresh();
  let guests = 0, east = 0, guestsLate = 0, guestsMasters = 0;
  const countries = new Set<string>();
  for (const wy of [1978, 1983, 1986, 1989, 1991, 1994, 1997, 1998, 1999, 2001, 2003]) {
    runWinter(g, season(wy));
    const cur = indoorState(g).current!;
    for (const t of cur.tournaments) {
      for (const id of t.clubIds) {
        if (!isForeignId(id)) continue;
        const c = foreignCountry(g, id) ?? '?';
        countries.add(c);
        expect(c in GUEST_COUNTRIES, `Gast aus ${c} (kein Land mit Winterpause)`);
        if (wy > GUESTS_LAST_WINTER) guestsLate++; else guests++;
        if (wy < 1990 && EAST.has(c)) east++;
      }
      expect(!t.done || (t.result?.ranking.length ?? 0) === t.clubIds.length, `Turnier ${t.id} unvollständig`);
    }
    if (cur.masters) guestsMasters += cur.masters.clubIds.filter((id) => isForeignId(id)).length;
  }
  console.log(`Halle Gäste: ${guests} bis ${GUESTS_LAST_WINTER} (Ostblock vor 1990: ${east}), danach ${guestsLate}, im Masters ${guestsMasters}; Länder ${[...countries].join(', ')}`);
  expect(guests >= 8, 'zu wenige Auslandsgäste bis 1997');
  expect(east >= 1, 'keine Ostblock-Gäste vor 1990');
  expect(guestsLate === 0, 'Auslandsgäste nach der Reform 1997/98');
  expect(guestsMasters === 0, 'Auslandsgast im Masters-Feld');

  // 2) Auslandsturniere je Epoche
  const g2 = fresh();
  let germans = 0;
  for (const wy of [1977, 1985, 1990, 1998, 2001, 2006, 2009, 2010]) {
    runWinter(g2, season(wy));
    const cur = indoorState(g2).current!;
    const ids = (cur.abroad ?? []).map((t) => t.aid);
    const want = abroadFor(wy).map((d) => d.id);
    expect(JSON.stringify(ids) === JSON.stringify(want), `Auslandsturniere ${wy}: ${ids.join(',')} statt ${want.join(',')}`);
    for (const t of cur.abroad ?? []) {
      const def = ABROAD_BY_ID[t.aid!];
      expect(t.done && !!t.result, `${t.name} ${wy} nicht gespielt`);
      expect(t.clubIds.length >= 6 && t.clubIds.length <= def.teams && new Set(t.clubIds).size === t.clubIds.length, `${t.name} ${wy}: ${t.clubIds.length} Teams`);
      const mmdd = t.date.slice(5);
      expect(mmdd >= def.window[0] && mmdd <= def.window[1], `${t.name} ${wy} außerhalb des Fensters (${t.date})`);
      if (def.domesticFrom && wy >= def.domesticFrom || def.series) {
        expect(t.clubIds.every((id) => (foreignCountry(g2, id) ?? 'Deutschland') === def.country), `${t.name} ${wy}: Vereine aus anderen Ländern`);
      }
      germans += t.clubIds.filter((id) => !isForeignId(id)).length;
      if (def.stage === 'f') {
        const q = new Set((cur.abroad ?? []).filter((x) => ABROAD_BY_ID[x.aid!].series === def.series && x !== t).flatMap((x) => x.clubIds));
        expect(t.clubIds.length === 8 && t.clubIds.every((id) => q.has(id)), 'Schweizer Finale nicht aus den Vorrunden');
      }
    }
    const h = indoorState(g2).history.find((x) => x.year === wy);
    expect((cur.abroad?.length ?? 0) === 0 || (h?.abroad?.length ?? 0) === cur.abroad!.length, `Archiv der Auslandsturniere ${wy}`);
  }
  console.log(`Halle Ausland: Epochen 1977–2010 ok, deutsche Gäste im Ausland ${germans}`);
  expect(germans >= 1, 'nie deutsche Vereine bei Auslandsturnieren');

  // 3) Einladung des eigenen Vereins + Speichern/Laden + alter Spielstand
  let invited: Game | undefined;
  let tid = '';
  for (let i = 0; i < 8 && !invited; i++) {
    const g3 = fresh();
    g3.clubs[g3.managedClubId].reputation = 92;
    const wy = 1985 + i;
    let snap: Game | undefined;
    runWinter(g3, season(wy), (d) => {
      const cur = indoorState(g3).current;
      if (!cur || snap) return;
      const t = (cur.abroad ?? []).find((x) => x.own === null);
      if (!t) { snap = g3; return; }
      expect(setOwnIndoorDecision(g3, t.id, 'mix').startsWith('Zusage'), 'Zusage ins Ausland');
      tid = t.id;
      const bc = new BreakCache(g3);
      expect(bc.fits(g3.managedClubId, t.date, t.days), 'Auslandsturnier außerhalb deiner Winterpause');
      const clash = allTournaments(cur).some((o) => o !== t && o.own !== undefined && Math.abs(Date.parse(o.date) - Date.parse(t.date)) < 2 * 86_400_000);
      expect(!clash, 'Auslandsturnier am Tag eines anderen eigenen Turniers');
      snap = JSON.parse(JSON.stringify(g3));
      // Speichern/Laden: der Klon spielt den Winter gleich weiter.
      void d;
    });
    if (tid && snap && snap !== g3) {
      const t = allTournaments(indoorState(g3).current).find((x) => x.id === tid)!;
      expect(t.done && t.result!.ranking.includes(g3.managedClubId), 'eigenes Auslandsturnier nicht gespielt');
      const own = indoorState(g3).history.find((x) => x.year === wy)!.abroad!.find((a) => `ha${wy}-${a[0]}` === tid)!;
      expect(own[3] === t.result!.ranking.indexOf(g3.managedClubId) + 1, 'eigener Platz im Archiv');
      const clone = snap;
      const y0 = wy - 1;
      let d = clone.calendar.currentDate;
      while (d <= `${y0 + 1}-02-10`) { clone.calendar.currentDate = d; indoorDaily(clone, d); d = CalendarEngine.addDays(d, 1); }
      const t2 = allTournaments(indoorState(clone).current).find((x) => x.id === tid)!;
      expect(JSON.stringify(t2.result!.ranking) === JSON.stringify(t.result!.ranking), 'Speichern/Laden ändert das Auslandsturnier');
      invited = g3;
      console.log(`Halle Ausland eigene Einladung ${wy}: ${t.name}, Platz ${own[3]}`);
    }
  }
  expect(!!invited, 'Spitzenverein nie ins Ausland eingeladen (1985–1992)');
  {
    // Alter Spielstand: Winter ohne `abroad`-Felder läuft fehlerfrei weiter.
    const g4 = fresh();
    runWinter(g4, season(1990), (d) => {
      const cur = indoorState(g4).current;
      if (cur && d === '1990-11-05') { delete cur.abroad; for (const h of indoorState(g4).history) delete h.abroad; }
    });
    expect(indoorState(g4).current!.finished === true, 'alter Spielstand: Winter nicht abgeschlossen');
  }

  // 4) Heimatland Österreich: Wiener Turnier als Heimturnier, keine deutschen Turniere
  const wienId = composeHome('aut', 1985)!.tier1.find((c) => c.city === 'Wien')!.id;
  const ga = createNewGame({
    managedClubId: wienId, manager: { name: 'T', nationality: 'AUT', birthYear: 1940, style: 'balanced', background: 'rookie' },
    difficulty: 'normal', realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: 1985, country: 'aut',
  } as any);
  runWinter(ga, ga.season);
  const ca = indoorState(ga).current!;
  expect(ca.tournaments.length === 0 && !ca.masters, 'Österreich: deutsche Hallenturniere');
  const wien = (ca.abroad ?? []).find((t) => t.aid === 'wien');
  expect(!!wien?.done && wien.clubIds.includes(ga.managedClubId), 'Österreich: Wiener Heimturnier ohne deinen Verein');
  expect(wien!.clubIds.filter((id) => !isForeignId(id)).length >= 3, 'Österreich: Heimturnier ohne Vereine der eigenen Liga');
  console.log(`Halle Heimat Österreich 1985/86: ${(ca.abroad ?? []).map((t) => `${t.name} (${t.clubIds.length})`).join(', ')}`);
}
