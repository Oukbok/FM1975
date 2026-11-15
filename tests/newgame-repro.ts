// =============================================================================
// „Neues Spiel“ reproduzierbar: Mehrere neue Spiele im selben Prozess (wie mehrere
// Spiele in einer Browser-Sitzung) müssen bei gleichen Optionen und gleichem
// Zufallsstartwert exakt gleich verlaufen – unabhängig davon, welches Spiel vorher
// lief (Modul-Zustand wird von game/resetModuleState.ts zurückgesetzt) und
// unabhängig von der Uhrzeit (IDs kommen aus dem Spielstand, engine/idSeq.ts).
//   npm run test:newgame-repro [tage=60]
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { loadGameSync as loadGame, saveGameSync as saveGame } from '../src/engine/save';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { Game } from '../src/game/state';
import { createHash } from 'node:crypto';

// --- Umgebung: localStorage, verstellbare Uhr, fester Zufall -----------------
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
let NOW = RealDate.UTC(2026, 0, 1);
/** Gefälschte Uhr: `new Date()`/`Date.now()` liefern NOW, das jeder Lauf anders setzt (und das weiterläuft). */
(globalThis as any).Date = class extends RealDate {
  constructor(...a: any[]) { if (a.length) super(...(a as [any])); else super(NOW); }
  static now() { return (NOW += 7); }
};
let seed = 1;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const DAYS = Math.max(10, Number(process.argv[2]) || 60);
let fails = 0;
const ok = (c: boolean, msg: string) => { console.log(`${c ? 'OK  ' : 'FEHL'} ${msg}`); if (!c) fails++; };

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

const mgr = { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any;
interface Opts { club: string; year?: number }
function build(o: Opts, rngSeed: number, now: number): Game {
  seed = rngSeed; NOW = now;
  const g = createNewGame({
    managedClubId: o.club, manager: mgr, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
    ...(o.year ? { startYear: o.year } : {}),
  } as any);
  (g as any).simAutoManage = true; // Entscheidungen/Angebote automatisch (wie test:season)
  return g;
}
const plain = (g: Game) => JSON.parse(JSON.stringify(g));
const sha = (x: unknown) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);

/** Fingerabdruck: Gesamtstand + lesbare Teile (Tabelle, Kontostände, Stärken, Transfers, IDs). */
function fingerprint(g: Game) {
  const p = plain(g) as Game;
  const ids = {
    msgs: p.messages.map((m) => m.id),
    events: p.calendar.events.map((e) => e.id),
    tx: Object.values(p.clubs).flatMap((c: any) => (c.finances?.transactions ?? []).map((t: any) => t.id)),
    staff: (p.staff ?? []).map((s: any) => s.id),
    players: Object.keys(p.players).length + Object.keys(p.youthPlayers).length,
  };
  return {
    date: p.calendar.currentDate,
    all: sha(p),
    table: sha(p.table.rows.map((r) => [r.clubId, r.points, r.goalsFor, r.goalsAgainst])),
    money: sha(Object.values(p.clubs).map((c) => [c.id, Math.round(c.finances.balance)])),
    strength: sha(Object.values(p.players).map((x) => [x.id, x.overall, x.potential])),
    transfers: sha(Object.values(p.players).map((x) => [x.id, x.clubId, x.history?.transfers?.length ?? 0])),
    ids: sha(ids),
    raw: p,
  };
}
type FP = ReturnType<typeof fingerprint>;
function firstDiff(a: unknown, b: unknown, path = ''): string | null {
  if (a === b) return null;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return null;
    return `${path}: ${JSON.stringify(a)?.slice(0, 70)} ≠ ${JSON.stringify(b)?.slice(0, 70)}`;
  }
  for (const k of new Set([...Object.keys(a as object), ...Object.keys(b as object)])) {
    const d = firstDiff((a as any)[k], (b as any)[k], `${path}.${k}`);
    if (d) return d;
  }
  return null;
}
function same(a: FP, b: FP, what: string): void {
  const parts = (['table', 'money', 'strength', 'transfers', 'ids'] as const).filter((k) => a[k] !== b[k]);
  const d = a.all === b.all ? null : firstDiff(a.raw, b.raw);
  ok(a.all === b.all, `${what}: identisch (${a.date}, ${a.all})${d ? ` – abweichend ${parts.join('/') || 'sonst'}: ${d}` : ''}`);
}

function play(o: Opts, rngSeed: number, now: number): FP {
  const g = build(o, rngSeed, now);
  for (let i = 0; i < DAYS; i++) tick(g);
  return fingerprint(g);
}

const A: Opts = { club: 'fra' };
const T1 = RealDate.UTC(2026, 0, 1), T2 = RealDate.UTC(2031, 6, 15, 13, 37);

const a1 = play(A, 4711, T1);
console.log(`     A (Frankfurt 1975): ${DAYS} Tage bis ${a1.date}, Tabelle ${a1.table}, Konten ${a1.money}, IDs ${a1.ids}`);
const a2 = play(A, 4711, T2);
same(a1, a2, 'Zweites neues Spiel im selben Prozess, andere Uhrzeit');
// Dazwischen ein anderes Spiel (anderer Verein, anderes Startjahr, andere Uhrzeit)
const b = play({ club: 'muc', year: 1995 }, 99, T2 + 123456);
ok(b.all !== a1.all, `Anderes Spiel dazwischen (München 1995, ${b.date}) läuft anders`);
const a3 = play(A, 4711, T1 + 999_999);
same(a1, a3, 'Erstes Spiel nach einem anderen Spiel erneut');
const b2 = play({ club: 'muc', year: 1995 }, 99, T1);
same(b, b2, 'Anderes Spiel (München 1995) nach Frankfurt 1975 erneut, andere Uhrzeit');

// Laden mitten im anderen Spiel → danach wieder ein neues Spiel A
{
  const gb = build({ club: 'muc', year: 1995 }, 99, T2);
  for (let i = 0; i < 20; i++) tick(gb);
  saveGame('repro', { name: 'r', managerName: 'r', clubName: 'r', clubId: gb.managedClubId, season: gb.season, gameDate: gb.calendar.currentDate }, gb);
  const s = loadGame<Game>('repro');
  if (!s) throw new Error('Laden fehlgeschlagen');
  prepareLoadedGame(s.game);
  for (let i = 0; i < 10; i++) tick(s.game);
}
const a4 = play(A, 4711, T2 - 5_000_000);
same(a1, a4, 'Neues Spiel nach Laden eines anderen Spielstands');

// IDs hängen nicht an der Uhr: Nachrichten/Buchungen/Termine im neuen Format
const msgIds = a1.raw.messages.map((m) => m.id);
ok(msgIds.length > 0 && msgIds.every((id) => !/^msg-[0-9a-z]{6,}-\d+$/.test(id)), `Nachrichten-IDs ohne Uhrzeit (${msgIds.slice(0, 3).join(', ')} …)`);
ok(new Set(msgIds).size === msgIds.length, `Nachrichten-IDs eindeutig (${msgIds.length})`);

console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
