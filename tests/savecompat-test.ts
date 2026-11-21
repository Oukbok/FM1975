// =============================================================================
// Spielstand-Kompatibilität (Steam: Spieler behalten ihre Stände über Patches):
// jeder eingefrorene Stand in tests/fixtures/saves/ (Liste index.json, alte
// Formate aus der Git-Historie + aktuelle Vorlagen) wird wie in App.tsx geladen
// (game/loadMigrations.ts `prepareLoadedGame`) und muss danach
//   1. Grundinvarianten erfüllen (keine NaN in Kontoständen/Stärken, Kader
//      vollständig, Spielerliga mit Spielplan, IDs eindeutig, keine verwaisten
//      Verweise in Kadern/Aufstellungen),
//   2. 14 Tage `processDay` ohne Ausnahme laufen (danach erneut Invarianten),
//   3. Speichern → Laden verlustfrei überstehen (Fingerabdruck identisch mit dem
//      laufenden Stand + denselben Nachrüstungen; Laden ändert nichts Spielrelevantes),
//   4. bei Ständen mit `fullSeason` bis zum Saisonwechsel (`startNextSeason`) und
//      drei Tage in die neue Saison laufen.
//   npm run test:savecompat            (alle Stände)
//   ONLY=ddr-1980 npm run test:savecompat   (Teilname der Datei)
//   FULL=0 …  ohne Saisonwechsel · DAYS=… andere Tageszahl
// Neue Formatänderung → Stand hier einfrieren (siehe CLAUDE.md „Spielstandformat ändern“).
// =============================================================================
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { decompressFromUTF16 } from 'lz-string';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { loadGameSync, saveGameSync } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { Game } from '../src/game/state';
import { migrateTacticsRefs } from '../src/game/tacticsRefsMigration';

// --- Umgebung wie tests/season-test.ts: localStorage, feste Uhr, fester Zufall --
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
  clear: () => store.clear(),
};
const RealDate = Date;
const FIXED_NOW = RealDate.UTC(2026, 0, 1);
(globalThis as any).Date = class extends RealDate {
  constructor(...a: any[]) { if (a.length) super(...(a as [any])); else super(FIXED_NOW); }
  static now() { return FIXED_NOW; }
};
let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const DIR = 'tests/fixtures/saves';
const DAYS = Math.max(1, Number(process.env.DAYS) || 14);
const FULL = process.env.FULL !== '0';
const ONLY = process.env.ONLY ?? '';

interface Fixture { file: string; source: string; savedAt: string; season: string; club: string; fullSeason?: boolean; why: string }
const fixtures = (JSON.parse(readFileSync(`${DIR}/index.json`, 'utf8')) as Fixture[]).filter((f) => !ONLY || f.file.includes(ONLY));

let fails = 0;
const failed: string[] = [];
let cur = '';
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) { fails++; failed.push(`${cur}: ${msg}`); } };

// --- Tagesablauf wie die Shell (Vorschau-Pause → schnell simulieren) ---------
const ui: DayUi = {
  onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {},
  onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false,
};
function tick(g: Game): void {
  if (!processDay(g, ui)) {
    const due = findOwnMatchDue(g);
    if (due) { quickSimOwnMatch(g, due); processDay(g, ui); }
  }
}

// --- Invarianten ---------------------------------------------------------------
const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
/**
 * Prüft den Stand; liefert Fehlerzeilen (leer = alles in Ordnung). `refs` = Aufstellungs-Verweise streng prüfen:
 * gilt direkt nach dem Laden; im laufenden Spiel dürfen Wechsel kurz Verweise auf Abgänge hinterlassen
 * (die Engine nimmt nur Kaderspieler, beim Laden räumt game/tacticsRefsMigration.ts auf).
 */
function invariants(g: Game, refs: boolean): string[] {
  const errs: string[] = [];
  const add = (m: string) => { if (errs.length < 40) errs.push(m); };
  const me = g.clubs[g.managedClubId];
  if (!me) { add(`eigener Verein ${g.managedClubId} fehlt`); return errs; }
  // Kontostände / Stärken
  for (const c of Object.values(g.clubs)) {
    if (!finite(c.finances?.balance)) add(`Kontostand ${c.id} = ${c.finances?.balance}`);
    if (!finite(c.reputation)) add(`Ansehen ${c.id} = ${c.reputation}`);
  }
  for (const s of Object.values(g.simClubs ?? {})) if (!finite(s.strength)) add(`Sim-Stärke ${s.id} = ${s.strength}`);
  for (const rec of [g.players, g.youthPlayers]) for (const p of Object.values(rec ?? {})) {
    if (!finite(p.overall)) add(`Stärke ${p.id} = ${p.overall}`);
    for (const [k, v] of Object.entries(p.attributes ?? {})) if (!finite(v)) { add(`Attribut ${p.id}.${k} = ${v}`); break; }
  }
  // IDs eindeutig: Spieler höchstens in einem Kader, keine Doppelungen
  const owner = new Map<string, string>();
  const youthOwner = new Map<string, string>();
  for (const c of Object.values(g.clubs)) {
    if (!Array.isArray(c.playerIds)) { add(`playerIds fehlt bei ${c.id}`); continue; }
    for (const id of c.playerIds) {
      if (owner.has(id)) add(`Spieler ${id} in zwei Kadern (${owner.get(id)}, ${c.id})`);
      owner.set(id, c.id);
      const p = g.players[id];
      if (!p) add(`verwaister Kader-Eintrag ${c.id} → ${id}`);
      else if (p.clubId !== c.id) add(`Spieler ${id}: clubId ${p.clubId} ≠ Kader ${c.id}`);
    }
    for (const id of c.youthPlayerIds ?? []) {
      if (youthOwner.has(id)) add(`Jugendspieler ${id} in zwei Akademien (${youthOwner.get(id)}, ${c.id})`);
      youthOwner.set(id, c.id);
      if (!g.youthPlayers?.[id]) add(`verwaister Jugend-Eintrag ${c.id} → ${id}`);
    }
  }
  for (const id of Object.keys(g.youthPlayers ?? {})) if (g.players[id]) add(`Spieler ${id} zugleich Profi und Jugend`);
  for (const p of Object.values(g.players) as (Game['players'][string] & { world?: boolean })[]) {
    if (p.isYouth || p.world || !g.clubs[p.clubId]) continue;
    if (owner.get(p.id) !== p.clubId) { add(`Spieler ${p.id} (clubId ${p.clubId}) steht in keinem Kader`); }
  }
  const dupMsg = g.messages.length - new Set(g.messages.map((m) => m.id)).size;
  if (dupMsg) add(`${dupMsg} doppelte Nachrichten-IDs`);
  const fxIds = g.fixtures.map((m) => m.id);
  if (fxIds.length !== new Set(fxIds).size) add('doppelte Spiel-IDs im Spielplan');
  // Aufstellungen ohne verwaiste Verweise (alle Vereine mit vollem Kader)
  for (const c of refs ? Object.values(g.clubs) : []) {
    const t = c.tactics; if (!t) continue;
    const squad = new Set(c.playerIds);
    const refs: [string, string | null | undefined][] = [
      ...(t.startingXI ?? []).map((id) => ['startingXI', id] as [string, string]),
      ...(t.substitutes ?? []).map((id) => ['substitutes', id] as [string, string]),
      ['captainId', t.captainId], ['penaltyTakerId', t.penaltyTakerId], ['freeKickTakerId', t.freeKickTakerId], ['cornerTakerId', t.cornerTakerId],
      ...Object.values(t.lineupMap ?? {}).map((id) => ['lineupMap', id] as [string, string]),
      ...Object.keys(t.assignedPositions ?? {}).map((id) => ['assignedPositions', id] as [string, string]),
      ...Object.entries(t.takers ?? {}).flatMap(([k, l]) => (l ?? []).map((id) => [`takers.${k}`, id] as [string, string])),
    ];
    for (const [where, id] of refs) if (id && !squad.has(id)) { add(`Aufstellung ${c.id}.${where} → ${id} nicht im Kader`); break; }
    const cap = c.dressingRoom?.captainId;
    if (cap && !squad.has(cap)) add(`Kabine ${c.id}: Kapitän ${cap} nicht im Kader`);
    const xi = t.startingXI ?? [];
    if (xi.length !== new Set(xi).size) add(`Startelf ${c.id} mit doppeltem Spieler`);
  }
  // Kader vollständig: Spielerliga + eigener Verein
  const leagueIds = new Set(g.fixtures.flatMap((m) => [m.homeClubId, m.awayClubId]));
  for (const id of leagueIds) {
    const c = g.clubs[id];
    if (!c) { add(`Liga-Verein ${id} fehlt in g.clubs`); continue; }
    const fit = c.playerIds.filter((pid) => g.players[pid]).length;
    if (fit < 16) add(`Kader ${id} nur ${fit} Spieler`);
    if (!c.playerIds.some((pid) => g.players[pid]?.naturalPosition === 'TW')) add(`Kader ${id} ohne Torwart`);
  }
  // Spielerliga mit Spielplan
  if (!g.leagues?.playerDivision) add('keine Spielerliga (leagues.playerDivision)');
  if (!g.fixtures.length) add('Spielplan leer');
  if (!leagueIds.has(g.managedClubId)) add('eigener Verein nicht im Spielplan');
  if (!g.table?.rows?.some((r) => r.clubId === g.managedClubId)) add('eigener Verein nicht in der Tabelle');
  const tblIds = new Set((g.table?.rows ?? []).map((r) => r.clubId));
  if (tblIds.size !== leagueIds.size || [...leagueIds].some((id) => !tblIds.has(id))) add(`Tabelle (${tblIds.size}) passt nicht zum Spielplan (${leagueIds.size})`);
  for (const d of g.leagues?.otherDivisions ?? []) {
    for (const id of d.clubIds) if (!g.simClubs?.[id] && !g.clubs[id]) { add(`Division ${d.id}: Verein ${id} fehlt`); break; }
  }
  if (!g.calendar?.currentDate || !/^\d{4}-\d{2}-\d{2}$/.test(g.calendar.currentDate)) add(`Datum ${g.calendar?.currentDate}`);
  return errs;
}
function checkInv(g: Game, when: string, refs = true): void {
  const e = invariants(g, refs);
  ok(e.length === 0, `${when}: Invarianten${e.length ? ' – ' + e.slice(0, 6).join(' | ') + (e.length > 6 ? ` … (+${e.length - 6})` : '') : ''}`);
}

// --- Speichern/Laden (wie tests/season-test.ts) ------------------------------
const plain = (g: Game) => JSON.parse(JSON.stringify(g)) as Game;
const fp = (g: unknown) => createHash('sha1').update(JSON.stringify(g)).digest('hex').slice(0, 12);
function firstDiff(a: unknown, b: unknown, path = '', all?: string[]): string | null {
  if (a === b) return null;
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
/** Erlaubte Nachrüstungen beim Laden eines laufenden Standes (wie LOAD_OK in season-test.ts). */
const LOAD_OK = [/^\.(players|youthPlayers)\.[^.]+\.persona$/, /^\.players\.[^.]+\.shirtNumber$/, /^\.players\.[^.]+\.history\.attributeSnapshots$/, /^\.clubs\.(w_|eu_)[^.]+\.stadium\.seating$/, /^\.(briefing|budget)\.pending$/];
function saveAndLoad(g: Game): Game {
  const okSave = saveGameSync('compat', { name: 't', managerName: 't', clubName: 't', clubId: g.managedClubId, season: g.season, gameDate: g.calendar.currentDate }, g);
  if (!okSave) throw new Error('Speichern fehlgeschlagen');
  const s = loadGameSync<Game>('compat');
  if (!s) throw new Error('Laden fehlgeschlagen');
  store.clear();
  prepareLoadedGame(s.game);
  return s.game;
}
/** Rundlauf: geladener Stand = laufender Stand mit denselben Nachrüstungen; liefert den geladenen Stand zum Weiterspielen. */
function roundTrip(g: Game, when: string): Game {
  const ref = plain(g);
  prepareLoadedGame(ref);
  const loaded = saveAndLoad(g); // zuletzt vorbereitet → Modul-Zustand gehört zu `loaded`
  const a = fp(ref), b = fp(loaded);
  const d = a === b ? null : firstDiff(plain(ref), plain(loaded));
  ok(a === b || !d, `${when}: Speichern → Laden identisch (Fingerabdruck ${b}${a !== b ? ` ≠ ${a}` : ''})${d ? ' – ' + d : ''}`);
  // Bezug = laufender Stand mit aufgeräumten Aufstellungs-Verweisen (einzige erlaubte Änderung an Taktiken).
  const running = plain(g);
  migrateTacticsRefs(running);
  const all: string[] = [];
  firstDiff(running, plain(loaded), '', all);
  const bad = all.filter((m) => !LOAD_OK.some((re) => re.test(m.split(':')[0])));
  ok(bad.length === 0, `${when}: Laden ändert nichts Spielrelevantes (${all.length - bad.length} erlaubte Nachrüstungen)${bad.length ? ' – ' + bad.slice(0, 5).join(' | ') + (bad.length > 5 ? ` … (+${bad.length - 5})` : '') : ''}`);
  return loaded;
}

function readFixture(file: string): Game {
  const txt = readFileSync(`${DIR}/${file}`, 'utf8');
  const json = txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4)) : txt;
  if (!json) throw new Error('Entpacken fehlgeschlagen');
  return (JSON.parse(json) as { game: Game }).game;
}

function run(fx: Fixture): void {
  cur = fx.file;
  console.log(`\n== ${fx.file} (${fx.season}, ${fx.club}; ${fx.source})`);
  const t0 = performance.now();
  let g: Game;
  try { g = readFixture(fx.file); } catch (e) { ok(false, `Lesen: ${(e as Error).message}`); return; }
  seed = 1975;
  (g as any).simAutoManage = true; // Entscheidungen/Angebote automatisch wie im Simulator
  try { prepareLoadedGame(g); ok(true, `Laden (prepareLoadedGame) am ${g.calendar.currentDate}`); } catch (e) {
    ok(false, `Laden (prepareLoadedGame): ${(e as Error).stack?.split('\n').slice(0, 4).join(' | ')}`); return;
  }
  checkInv(g, 'nach dem Laden');
  const start = g.calendar.currentDate;
  let errors = 0;
  const until = CalendarEngine.addDays(start, DAYS);
  for (let n = 0; g.calendar.currentDate < until && !CalendarEngine.isSeasonOver(g.calendar) && n < DAYS * 3; n++) {
    try { tick(g); } catch (e) { errors++; console.log('  Ausnahme am', g.calendar.currentDate, (e as Error).stack?.split('\n').slice(0, 5).join(' | ')); if (errors > 2) break; }
  }
  ok(errors === 0 && g.calendar.currentDate >= until, `${DAYS} Tage processDay ohne Ausnahme (${start} → ${g.calendar.currentDate})`);
  checkInv(g, `nach ${DAYS} Tagen (laufend)`, false);
  try { g = roundTrip(g, `nach ${DAYS} Tagen`); } catch (e) { ok(false, `Rundlauf: ${(e as Error).message}`); return; }
  checkInv(g, `nach ${DAYS} Tagen, neu geladen`);
  if (FULL && fx.fullSeason) {
    const s0 = g.season;
    let days = 0; errors = 0;
    while (!CalendarEngine.isSeasonOver(g.calendar) && days++ < 400) {
      try { tick(g); } catch (e) { errors++; console.log('  Ausnahme am', g.calendar.currentDate, (e as Error).stack?.split('\n').slice(0, 5).join(' | ')); if (errors > 2) break; }
    }
    ok(errors === 0 && CalendarEngine.isSeasonOver(g.calendar), `${s0} bis zum Saisonende ohne Ausnahme (${days} Tage, bis ${g.calendar.currentDate})`);
    try { startNextSeason(g); ok(g.season !== s0, `Saisonwechsel ${s0} → ${g.season}`); } catch (e) {
      ok(false, `Saisonwechsel: ${(e as Error).stack?.split('\n').slice(0, 5).join(' | ')}`); return;
    }
    errors = 0;
    for (let d = 0; d < 3; d++) { try { tick(g); } catch (e) { errors++; console.log('  Ausnahme am', g.calendar.currentDate, (e as Error).stack?.split('\n').slice(0, 5).join(' | ')); break; } }
    ok(errors === 0, `3 Tage in der neuen Saison ohne Ausnahme (bis ${g.calendar.currentDate})`);
    checkInv(g, `neue Saison ${g.season} (laufend)`, false);
    try { g = roundTrip(g, `neue Saison ${g.season}`); checkInv(g, `neue Saison ${g.season}, neu geladen`); } catch (e) { ok(false, `Rundlauf neue Saison: ${(e as Error).message}`); }
  }
  console.log(`  (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
}

for (const fx of fixtures) run(fx);
console.log(`\n${fixtures.length} Spielstände, ${fails ? `${fails} FEHLER` : 'alles OK'}`);
for (const f of failed) console.log(`  - ${f}`);
process.exit(fails ? 1 : 0);
