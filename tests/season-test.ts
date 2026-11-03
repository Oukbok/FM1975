// =============================================================================
// Saison-Test ohne UI: neues Spiel → komplette Saison über denselben Tagesablauf
// wie die Oberfläche (game/day.ts `processDay`, Rückrufe wie in shell/usePopupQueue.ts,
// eigenes Spiel per „Schnell simulieren“ wie in GameShell), Saisonwechsel, Start der
// zweiten Saison. Zwischendurch Speichern/Laden (engine/save.ts + game/loadMigrations.ts)
// – der geladene Stand muss gleich sein und gleich weiterlaufen.
//   npm run test:season [saisons=1]
// Hinweis: Der 30.6. wird nicht verarbeitet (Saison gilt dann als beendet).
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { leagueClubs, startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { loadGame, saveGame } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { Game } from '../src/game/state';
import type { Match } from '../src/types';

// --- Umgebung: localStorage für engine/save.ts, fester Zufall ---------------
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
  clear: () => store.clear(),
};
let seed = 1975;
const setSeed = (s: number) => { seed = s; };
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const SEASONS = Math.max(1, Number(process.argv[2] ?? 1));
let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };

// --- Rückrufe wie in der Oberfläche (Fenster werden nur gezählt) -------------
const seen = { ownMatch: 0, rating: 0, seasonEnd: 0, draws: 0, camps: 0, windows: 0, due: 0 };
const ui: DayUi = {
  onOwnMatch: () => { seen.ownMatch++; },
  onRatingCeremony: () => { seen.rating++; },
  onSeasonEnd: () => { seen.seasonEnd++; },
  onOwnMatchDue: () => { seen.due++; },
  onCupDraw: (d) => { seen.draws++; return d.involvesMe; },
  onCampEnd: () => { seen.camps++; return true; },
  onTransferWindow: () => { seen.windows++; return true; },
  onIndoorShow: () => false,
};

/** Ein Tick wie der Zeitlauf der Shell: Spiel fällig → schnell simulieren, dann weiter. */
function tick(g: Game): void {
  const went = processDay(g, ui);
  if (!went) {
    const due = findOwnMatchDue(g);
    if (due) { quickSimOwnMatch(g, due); processDay(g, ui); }
  }
}

/** Nach dem Laden: dieselben Schritte wie App.tsx `doLoad`. */
function saveAndLoad(g: Game): Game {
  const okSave = saveGame('test', { name: 't', managerName: 't', clubName: 't', clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate }, g);
  ok(okSave, `Speichern am ${g.calendar.currentDate}`);
  const s = loadGame<Game>('test');
  if (!s) throw new Error('Laden fehlgeschlagen');
  prepareLoadedGame(s.game);
  return s.game;
}

// Struktureller Vergleich mit Pfad der ersten Abweichung.
// Ausnahme: Buchungs-/Nachrichten-IDs und Tabellenstempel enthalten die Uhrzeit und sind nie gleich.
const VOLATILE = /(\.(transactions|messages)\.\d+\.id|\.lastUpdated)$/;
function firstDiff(a: unknown, b: unknown, path = '', all?: string[]): string | null {
  if (a === b || VOLATILE.test(path)) return null;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return null;
    const msg = `${path}: ${JSON.stringify(a)?.slice(0, 60)} ≠ ${JSON.stringify(b)?.slice(0, 60)}`;
    if (all) { all.push(msg); return null; }
    return msg;
  }
  const ka = Object.keys(a as object).filter((k) => (a as any)[k] !== undefined);
  const kb = Object.keys(b as object).filter((k) => (b as any)[k] !== undefined);
  for (const k of new Set([...ka, ...kb])) {
    const d = firstDiff((a as any)[k], (b as any)[k], `${path}.${k}`, all);
    if (d && !all) return d;
  }
  return null;
}
const plain = (g: Game) => JSON.parse(JSON.stringify(g));

/**
 * Laden prüfen: (1) Rundreise verlustfrei – geladener Stand = laufender Stand mit denselben
 * Nachrüstungen; (2) die Nachrüstungen ändern am laufenden Spiel nur Erlaubtes: verdeckte
 * Persönlichkeit (deterministisch beim Lesen erzeugt), Attribut-Ausgangswert des eigenen
 * Kaders, Rückennummern von Neuzugängen der KI (im Spiel bis zum Laden 0, nur Anzeige),
 * Platzkategorien von Auslandsvereinen (nur Anzeige), Briefing-/Budget-Fenster (beim Laden bewusst aus).
 */
const LOAD_OK = [/^\.(players|youthPlayers)\.[^.]+\.persona$/, /^\.players\.[^.]+\.shirtNumber$/, /^\.players\.[^.]+\.history\.attributeSnapshots$/, /^\.clubs\.(w_|eu_)[^.]+\.stadium\.seating$/, /^\.(briefing|budget)\.pending$/];
function checkLoad(g: Game, when: string): void {
  const loadedG = saveAndLoad(g);
  const ref = plain(g) as Game;
  prepareLoadedGame(ref);
  const d = firstDiff(plain(ref), plain(loadedG));
  ok(!d, `${when}: Speichern/Laden verlustfrei${d ? ' – ' + d : ''}`);
  const all: string[] = [];
  firstDiff(plain(g), plain(loadedG), '', all);
  const bad = all.filter((m) => !LOAD_OK.some((re) => re.test(m.split(':')[0])));
  ok(bad.length === 0, `${when}: Laden ändert nichts Spielrelevantes (${all.length - bad.length} erlaubte Nachrüstungen)${bad.length ? ' – ' + bad.slice(0, 5).join(' | ') + (bad.length > 5 ? ` … (+${bad.length - 5})` : '') : ''}`);
}


// --- Neues Spiel ------------------------------------------------------------
let g: Game = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
(g as any).simAutoManage = true; // Entscheidungen/Angebote wie im Simulator automatisch
ok(!!g.clubs[g.managedClubId], `Neues Spiel ${g.season}, eigener Verein ${g.clubs[g.managedClubId]?.name}`);

for (let season = 0; season < SEASONS; season++) {
  const seasonName = g.season;
  const myId = g.managedClubId;
  const startBalance = g.clubs[myId].finances.balance;
  const startDate = g.calendar.currentDate;
  Object.keys(seen).forEach((k) => ((seen as any)[k] = 0));
  let days = 0, loaded = false, errors = 0;
  const midDate = `${Number(seasonName.slice(0, 4)) + 1}-01-15`;

  while (!CalendarEngine.isSeasonOver(g.calendar)) {
    try { tick(g); } catch (e) { errors++; console.log('Exception am', g.calendar.currentDate, (e as Error).stack?.split('\n').slice(0, 4).join(' | ')); if (errors > 3) break; }
    if (++days > 1200) { ok(false, 'Saison endet nicht'); break; }
    // Speichern/Laden in der Saisonmitte: Stand gleich, Weiterlauf gleich.
    if (!loaded && g.calendar.currentDate >= midDate) {
      loaded = true;
      checkLoad(g, 'Saisonmitte');
      const g2 = saveAndLoad(g);
      // Weiterlauf: geladener Stand und laufender Stand (mit denselben Nachrüstungen) 21 Tage gleich.
      const ref = plain(g) as Game;
      prepareLoadedGame(ref);
      const s0 = seed;
      for (let i = 0; i < 21; i++) tick(ref);
      const after1 = plain(ref);
      setSeed(s0);
      for (let i = 0; i < 21; i++) tick(g2);
      const d1 = firstDiff(after1, plain(g2));
      ok(!d1, `21 Tage nach dem Laden identisch weitergespielt (bis ${g2.calendar.currentDate})${d1 ? ' – ' + d1 : ''}`);
      g = g2; // mit dem geladenen Stand weiter
    }
  }
  ok(errors === 0, `${seasonName}: ${days} Tage ohne Ausnahme (${startDate} → ${g.calendar.currentDate})`);
  ok(g.calendar.currentDate < `${Number(seasonName.slice(0, 4)) + 1}-06-30` || g.calendar.currentDate.endsWith('06-30'), `Saisonende vor/am 30.6. (${g.calendar.currentDate})`);

  // Spieltage komplett
  const fx: Match[] = g.fixtures;
  const open = fx.filter((m) => m.status !== 'finished' || !m.result);
  ok(open.length === 0, `Alle ${fx.length} Ligaspiele gespielt (offen: ${open.length})`);
  const clubs = new Set(fx.flatMap((m) => [m.homeClubId, m.awayClubId]));
  const mds = new Map<number, number>();
  for (const m of fx) mds.set(m.matchday, (mds.get(m.matchday) ?? 0) + 1);
  const perMd = clubs.size / 2;
  ok([...mds.values()].every((n) => n === perMd) && mds.size === 2 * (clubs.size - 1),
    `${mds.size} Spieltage mit je ${perMd} Spielen (${clubs.size} Vereine)`);
  const pairs = new Set(fx.map((m) => `${m.homeClubId}-${m.awayClubId}`));
  ok(pairs.size === fx.length, 'Jede Paarung genau einmal (Hin- und Rückspiel)');

  // Tabelle konsistent mit den Ergebnissen
  const rows = g.table.rows;
  const win = g.pointSystem === '3-point' ? 3 : 2;
  let tableOk = rows.length === clubs.size;
  for (const r of rows) {
    const mine = fx.filter((m) => m.homeClubId === r.clubId || m.awayClubId === r.clubId);
    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    for (const m of mine) {
      const home = m.homeClubId === r.clubId;
      const f = home ? m.result!.homeGoals : m.result!.awayGoals, a = home ? m.result!.awayGoals : m.result!.homeGoals;
      gf += f; ga += a; if (f > a) w++; else if (f === a) d++; else l++;
    }
    const pts = w * win + d - (r.deduction ?? 0);
    if (r.played !== mine.length || r.won !== w || r.drawn !== d || r.lost !== l || r.goalsFor !== gf || r.goalsAgainst !== ga || r.points !== pts || r.goalDifference !== gf - ga) {
      tableOk = false; console.log('  Tabelle abweichend:', r.clubId, JSON.stringify(r), { w, d, l, gf, ga, pts });
    }
  }
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const ordered = sorted.every((r, i) => i === 0 || sorted[i - 1].points >= r.points);
  ok(tableOk, `Tabelle = Ergebnisse (Spiele, S/U/N, Tore, Punkte bei ${win}-Punkte-Regel)`);
  ok(ordered && sorted.every((r, i) => r.position === i + 1), 'Tabellenplätze 1…n lückenlos und nach Punkten geordnet');

  // Sim-Ligen und Pokal fertig
  const divs = g.leagues?.otherDivisions ?? [];
  const divOpen = divs.filter((d: any) => (d.fixtures ?? []).some((m: any) => m.status !== 'finished'));
  ok(divOpen.length === 0, `${divs.length} weitere Ligen fertig gespielt${divOpen.length ? ' – offen: ' + divOpen.map((d: any) => d.id).join(', ') : ''}`);
  ok(!!g.cup?.winnerClubId, `Pokalsieger ermittelt (${g.clubs[g.cup?.winnerClubId ?? '']?.name ?? '–'})`);

  // Finanzen gebucht
  const fin = g.clubs[myId].finances;
  ok(fin.balance !== startBalance, `Kontostand bewegt (${Math.round(startBalance)} → ${Math.round(fin.balance)})`);
  ok((fin.income?.ticketSales ?? 0) > 0 && (fin.income?.tvMoney ?? 0) > 0, 'Eigener Verein: Zuschauer- und TV-Einnahmen gebucht');
  ok((fin.expenses?.wages ?? 0) > 0, 'Eigener Verein: Gehälter gebucht');
  const lc = leagueClubs(g).filter((c) => clubs.has(c.id));
  ok(lc.every((c) => (c.finances.income?.ticketSales ?? 0) > 0 && (c.finances.expenses?.wages ?? 0) > 0), `Alle ${lc.length} Ligavereine mit Einnahmen und Gehältern`);

  // Oberflächen-Rückrufe wie im Spiel
  ok(seen.due > 0 && seen.ownMatch > 0, `Eigene Spiele über die Vorschau-Pause: ${seen.due} angehalten, ${seen.ownMatch} Spielberichte`);
  ok(seen.seasonEnd === 1 && g.messages.some((m) => m.subject === 'Die Saison ist beendet!'), `Saisonende verarbeitet (Nachricht + Autospeichern-Rückruf am 29.6.)`);
  ok(seen.rating >= 2, `Bewertungsrunden als Fenster: ${seen.rating}`);
  console.log(`     Fenster: Auslosungen ${seen.draws}, Trainingslager ${seen.camps}, Transferbilanzen ${seen.windows}`);

  // Saisonwechsel
  const before = g.season;
  startNextSeason(g);
  ok(g.season !== before && Number(g.season.slice(0, 4)) === Number(before.slice(0, 4)) + 1, `Saisonwechsel ${before} → ${g.season}`);
  ok(g.fixtures.length > 0 && g.fixtures.every((m) => m.status === 'scheduled'), `Neuer Spielplan: ${g.fixtures.length} Spiele angesetzt`);
  ok(!CalendarEngine.isSeasonOver(g.calendar), `Kalender läuft wieder (${g.calendar.currentDate})`);
  ok(g.table.rows.every((r) => r.played === 0 && r.points === 0 - (r.deduction ?? 0)), 'Tabelle zurückgesetzt');
}

// Ein paar Wochen der neuen Saison inkl. erstem Spieltag
let errs = 0;
const until = `${g.season.slice(0, 4)}-09-01`;
for (let i = 0; i < 120 && g.calendar.currentDate < until; i++) {
  try { tick(g); } catch (e) { errs++; console.log('Exception', (e as Error).message); }
}
ok(errs === 0 && g.fixtures.some((m) => m.status === 'finished'), `Neue Saison läuft an (${g.calendar.currentDate}, ${g.fixtures.filter((m) => m.status === 'finished').length} Spiele gespielt)`);
checkLoad(g, 'neue Saison');

console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
