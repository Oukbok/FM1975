// =============================================================================
// Ausnahmetalente der Fußballgeschichte (npm run test:legends, Logik-Teil):
// 132 Einträge, verfremdete Namen ≠ Vorbilder (docs/recherche/legenden.md),
// Spawn-Jahr/-Alter/Verein, Gewichtung nach Ausbildungsqualität, fester Verein,
// Determinismus je Spielstand, Option aus, keine Nachrichten, verdeckte Werte
// übernommen, Datensatz leer = keine, Alt-Migration lässt neue Felder stehen.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { createNewGame } from '../src/game/newGame';
import { BUILTIN_LEGENDS, LEGENDS } from '../src/data/legends';
import { initLegends, joinAge, legendIds, legendsDaily, routeOf, youthWeight } from '../src/game/legendsGame';
import { ageOn } from '../src/game/legendFactory';
import { applyDataset } from '../src/data/dataset/apply';
import { builtinDataset } from '../src/data/dataset/builtin';
import { migrateLegacyLegends } from '../src/game/playerMigration';
import { isLeagueClub } from '../src/engine/clubEconomy';
import { maturity, tempoOf } from '../src/engine/talent';
import { checkDataset } from '../src/editor/validate';
import type { Game } from '../src/game/state';

let fails = 0;
const fail = (m: string) => { console.error('FEHLER:', m); fails++; };
const ok = (m: string) => console.log('  ok ', m);
const opts = (legends?: boolean) => ({ managedClubId: 'fra', manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' }, difficulty: 'normal', realisticSquads: true, injuriesEnabled: true, speedMs: 0, ...(legends === undefined ? {} : { legends }) } as any);

// --- 1) Liste & Namen ---------------------------------------------------------
if (BUILTIN_LEGENDS.length !== 132) fail(`Liste hat ${BUILTIN_LEGENDS.length} statt 132 Einträgen`);
const ids = new Set(BUILTIN_LEGENDS.map((l) => l.id)), names = new Set(BUILTIN_LEGENDS.map((l) => `${l.firstName} ${l.lastName}`));
if (ids.size !== BUILTIN_LEGENDS.length || names.size !== BUILTIN_LEGENDS.length) fail('IDs/Namen nicht eindeutig');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z ]/g, '').trim();
const lev = (a: string, b: string) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const doc = readFileSync('docs/recherche/legenden.md', 'utf8');
const real = new Map<string, string>();
for (const m of doc.matchAll(/^\| ([a-z_-]+) \| ([^|]+) \| [^|]+ \| \d{4}/gm)) real.set(m[1], m[2].trim());
if (real.size !== BUILTIN_LEGENDS.length) fail(`Recherche-Tabelle hat ${real.size} Vorbilder`);
const realLast = new Set<string>();
for (const l of BUILTIN_LEGENDS) {
  const r = real.get(l.id);
  if (!r) { fail(`${l.id}: kein Vorbild in der Recherche`); continue; }
  const rw = norm(r).split(' '), fake = norm(`${l.firstName} ${l.lastName}`), fw = fake.split(' ');
  const rLast = rw[rw.length - 1], fLast = fw[fw.length - 1];
  realLast.add(rLast);
  if (fake === norm(r)) fail(`${l.id}: echter Name`);
  if (lev(fLast, rLast) < 3) fail(`${l.id}: Nachname „${l.lastName}“ zu nah am Vorbild`);
  if (lev(fw[0], rw[0]) < 2) fail(`${l.id}: Vorname „${l.firstName}“ zu nah am Vorbild`);
}
// Kein Vorbild-Nachname (≥ 5 Buchstaben) im Code der Legenden.
const code = ['src/data/legends', 'src/game'].flatMap((d) => readdirSync(d).filter((f) => /^legend|\.ts$/.test(f) && (d.endsWith('legends') || f.startsWith('legend'))).map((f) => readFileSync(`${d}/${f}`, 'utf8'))).join('\n');
const codeN = norm(code.replace(/\n/g, ' '));
const leaked = [...realLast].filter((n) => n.length >= 5 && new RegExp(`\\b${n}\\b`).test(codeN));
if (leaked.length) fail(`Vorbild-Namen im Code: ${leaked.join(', ')}`); else ok('132 Einträge, Namen eindeutig und verfremdet, keine Vorbilder im Code');
const pots = BUILTIN_LEGENDS.map((l) => l.potential);
if (pots.filter((p) => p >= 97).length > 12 || Math.min(...pots) < 85) fail('Potenziale nicht gestaffelt'); else ok(`Potenziale gestaffelt ${Math.min(...pots)}–${Math.max(...pots)}`);
const ds = builtinDataset();
const errs = checkDataset(ds).filter((i) => i.area === 'Legenden');
if (errs.length) fail('Editor-Prüfung: ' + errs.map((e) => e.text).join(' | ')); else ok('Editor-Prüfung ohne Befund');

// --- 2) Spielstart -------------------------------------------------------------
const g = createNewGame(opts());
if (!g.legends2?.on) fail('Legenden nicht standardmäßig an');
const done = g.legends2!.done;
const atStart = Object.values(done).filter((x) => x !== '-').length;
const msgs0 = g.messages.length;
for (const l of LEGENDS) {
  const pid = done[l.id];
  const age = ageOn(l.birth, '1975-07-01');
  if (!pid) continue;
  const p = g.players[pid] ?? g.youthPlayers[pid];
  if (!p) { fail(`${l.id}: Spieler fehlt`); continue; }
  if (p.fullName !== `${l.firstName} ${l.lastName}` || p.dateOfBirth !== l.birth) fail(`${l.id}: Name/Geburt falsch`);
  if (!!p.isYouth !== (age < 18 && l.country === 'GER')) fail(`${l.id}: Jugend/Profi falsch (${age} J.)`);
  if (p.development.consistency !== l.hidden.consistency || p.development.tempo !== l.hidden.tempo || p.development.professionalism !== l.hidden.professionalism) fail(`${l.id}: verdeckte Werte nicht übernommen`);
  if (Math.abs(maturity(p) - l.maturity) > 1e-9 || tempoOf(p) !== l.hidden.tempo) fail(`${l.id}: Körperuhr/Tempo nicht wirksam`);
  if (!p.isYouth && p.clubId === g.managedClubId) fail(`${l.id}: Profi beim eigenen Verein`);
  if (/legend|legende/i.test(p.id)) fail(`${l.id}: Kennung verrät die Legende`);
}
ok(`Spielstart: ${atStart} im Kader/in der Jugend (z. B. ${LEGENDS.filter((l) => done[l.id] && done[l.id] !== '-').slice(0, 3).map((l) => l.lastName).join(', ')})`);

// --- 3) Jahrgänge 1976–2025: Alter und Weg ------------------------------------
let wrong = 0;
for (let y = 1976; y <= 2036; y++) {
  const date = `${y}-07-01`;
  const before = new Set(Object.keys(done));
  legendsDaily(g, date);
  for (const id of Object.keys(done)) {
    if (before.has(id) || done[id] === '-') continue;
    const l = LEGENDS.find((x) => x.id === id)!;
    const age = ageOn(l.birth, date);
    const p = g.players[done[id]] ?? g.youthPlayers[done[id]];
    const domestic = l.country === 'GER' || (l.country === 'DDR' && Number(l.birth.slice(0, 4)) >= 1976);
    const expect = domestic ? age === 15 : l.country === 'DDR' ? y === 1990 : age === joinAge(l, g.youthSalt ?? '|');
    if (!expect || !p) { wrong++; fail(`${l.id}: ${y} mit ${age} J. erschienen`); }
  }
}
const missing = LEGENDS.filter((l) => !done[l.id]);
if (missing.length) fail(`nicht erschienen: ${missing.map((l) => l.id).join(', ')}`);
if (!wrong) ok(`alle ${BUILTIN_LEGENDS.length} bis 2036 erschienen, im richtigen Jahr (Jugend mit 15, Ausland mit 18–27, DDR 1990)`);
if (g.messages.length !== msgs0) fail(`Nachrichten durch Legenden: ${g.messages.length - msgs0}`); else ok('keine Nachrichten');
const legendNames = LEGENDS.map((l) => l.lastName);
if (g.messages.some((m) => legendNames.some((n) => `${m.subject} ${m.bodyText}`.includes(n)))) fail('Nachricht nennt eine Legende');

// --- 4) Determinismus & fester Verein -----------------------------------------
const g2 = createNewGame(opts());
const salt = g2.youthSalt;
const clubOf = (gg: Game, id: string) => { const pid = gg.legends2!.done[id]; return (gg.players[pid] ?? gg.youthPlayers[pid])?.clubId; };
const first = LEGENDS.filter((l) => g2.legends2!.done[l.id] && g2.legends2!.done[l.id] !== '-').map((l) => `${l.id}@${clubOf(g2, l.id)}`).join();
initLegends(g2, true); // gleiche Welt, gleiches Salz → gleiche Vereine
const again = LEGENDS.filter((l) => g2.legends2!.done[l.id] && g2.legends2!.done[l.id] !== '-').map((l) => `${l.id}@${clubOf(g2, l.id)}`).join();
if (first !== again || g2.youthSalt !== salt) fail('nicht deterministisch'); else ok('deterministisch je Spielstand-Salz');
const fixedDef = LEGENDS.find((l) => l.country === 'GER' && Number(l.birth.slice(0, 4)) >= 1962)!;
const keep = fixedDef.club;
fixedDef.club = 'kln';
const g3 = createNewGame(opts());
for (let y = 1976; y <= 1990; y++) legendsDaily(g3, `${y}-07-01`);
if (clubOf(g3, fixedDef.id) !== 'kln') fail('fester Jugendverein nicht beachtet'); else ok('fester Jugendverein beachtet');
fixedDef.club = keep;

// --- 5) Gewichtung nach Ausbildungsqualität -----------------------------------
const gw = createNewGame(opts());
const clubs = Object.values(gw.clubs).filter((c) => isLeagueClub(c) && c.playerIds.length >= 11);
const total = clubs.reduce((a, c) => a + youthWeight(c), 0);
const youthDefs = LEGENDS.filter((l) => l.country === 'GER' && Number(l.birth.slice(0, 4)) >= 1961 && Number(l.birth.slice(0, 4)) <= 1975);
const hits = new Map<string, number>();
let n = 0;
for (let i = 0; i < 40; i++) {
  gw.youthSalt = `|w${i}`;
  gw.legends2 = { on: true, done: {} };
  for (const l of youthDefs) for (let y = 1976; y <= 1991; y++) legendsDaily(gw, `${y}-07-01`);
  for (const l of youthDefs) { const c = clubOf(gw, l.id); if (c) { hits.set(c, (hits.get(c) ?? 0) + 1); n++; } }
}
const ranked = [...clubs].sort((a, b) => youthWeight(b) - youthWeight(a));
const half = Math.floor(ranked.length / 2);
const share = (cs: typeof clubs) => cs.reduce((a, c) => a + (hits.get(c.id) ?? 0), 0) / Math.max(1, n);
const exp = (cs: typeof clubs) => cs.reduce((a, c) => a + youthWeight(c), 0) / total;
const topShare = share(ranked.slice(0, half)), topExp = exp(ranked.slice(0, half));
if (topShare <= 0.55 || Math.abs(topShare - topExp) > 0.1) fail(`Gewichtung: obere Hälfte ${Math.round(topShare * 100)} % (erwartet ${Math.round(topExp * 100)} %)`);
else ok(`Gewichtung nach Ausbildungsqualität: obere Hälfte der Akademien ${Math.round(topShare * 100)} % der Talente (erwartet ${Math.round(topExp * 100)} %, gleichverteilt 50 %), n = ${n}`);

// --- 6) Option aus, Datensatz leer, Alt-Migration -----------------------------
const off = createNewGame(opts(false));
const offNames = new Set(LEGENDS.map((l) => `${l.firstName} ${l.lastName}`));
legendsDaily(off, '1980-07-01');
if (off.legends2?.on || Object.keys(off.legends2?.done ?? {}).length || [...Object.values(off.players), ...Object.values(off.youthPlayers)].some((p) => offNames.has(p.fullName))) fail('Option aus erzeugt Legenden');
else ok('Option aus: keine Legenden');
const empty = builtinDataset(); empty.legendsV2 = [];
applyDataset(empty);
if (LEGENDS.length) fail('leere Datensatz-Liste schaltet nicht ab');
const ge = createNewGame(opts());
if (Object.keys(ge.legends2!.done).length) fail('leere Liste erzeugt trotzdem Legenden');
applyDataset(null);
if (LEGENDS.length !== BUILTIN_LEGENDS.length) fail('Standard-Liste nach Zurücksetzen nicht da'); else ok('Datensatz: leere Liste = keine, Standard = alle');
const before = legendIds(g).size;
migrateLegacyLegends(g);
const sample = g.players[[...legendIds(g)].find((id) => g.players[id])!];
if (legendIds(g).size !== before || !sample?.development.clock || !g.legends2) fail('Alt-Migration entfernt neue Legenden-Felder'); else ok('Alt-Migration lässt neue Felder stehen');
const old = createNewGame(opts());
delete (old as any).legends2;
legendsDaily(old, '1980-07-01');
if (old.legends2) fail('alter Spielstand bekommt Legenden'); else ok('alter Spielstand ohne Feld: keine Legenden');

if (fails) { console.error(`${fails} Fehler`); process.exit(1); }
console.log('Legenden-Test bestanden.');
