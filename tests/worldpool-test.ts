// Weltspieler + Spielerpool + Scouting ohne UI (game/worldPool.ts, playerPool.ts, scoutingGame.ts)
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { clubOffer, playerOffer, startTalk, stanceFor, talkBlocker } from '../src/game/transferTalks';
import { materializeWorldPlayer, worldClubs, worldEntry } from '../src/game/worldPool';
import { estimate, knowCtx, knowledge, poolRows } from '../src/game/playerPool';
import { queueScouting, queuedJob, scoutReport, scoutSlots, scoutingOf, startScouting } from '../src/game/scoutingGame';
import type { Game } from '../src/game/state';

let seed = 7;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const g: Game = createNewGame({
  managedClubId: 'muc',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const pool = g.worldPool;
if (!pool || pool.p.length < 15000) fail(`Weltpool zu klein: ${pool?.p.length}`);
const clubs = worldClubs(g);
console.log(`Weltspieler ${pool.p.length} bei ${clubs.size} Vereinen`);
const { rows } = poolRows(g);
const ctx = knowCtx(g);
const ks = rows.filter((r) => r.kind === 'world').map((r) => knowledge(ctx, r));
const mean = ks.reduce((a, b) => a + b, 0) / ks.length;
if (mean > 0.3) fail(`Weltspieler 1975 zu bekannt: ${mean.toFixed(2)}`);
const league = rows.filter((r) => r.kind === 'pro' && g.table.rows.some((x) => x.clubId === r.clubId) && r.clubId !== g.managedClubId);
const kl = league.map((r) => knowledge(ctx, r)).reduce((a, b) => a + b, 0) / league.length;
if (kl < 0.45) fail(`Ligaspieler zu unbekannt: ${kl.toFixed(2)}`);
console.log(`Bekanntheit 1975: Welt Ø ${mean.toFixed(2)}, eigene Liga Ø ${kl.toFixed(2)}`);
// Schätzung umfasst meist die Wahrheit
let hit = 0; const sample = rows.filter((r) => r.kind === 'world').slice(0, 3000);
for (const r of sample) { const e = estimate(r, knowledge(ctx, r)); if (r.ov >= e.ovLo && r.ov <= e.ovHi) hit++; }
console.log(`Stärke in der Spanne: ${Math.round((hit / sample.length) * 100)} %`);
if (hit / sample.length < 0.7) fail('Spanne trifft zu selten');

// Scouting: Auftrag, Bericht
const target = [...rows].filter((r) => r.kind === 'world' && r.country === 'England' && r.level === 1).sort((a, b) => b.ov - a.ov)[0];
const err = startScouting(g, { id: target.id, name: target.name, clubName: clubs.get(target.clubId)!.name, abroad: true, youth: false });
if (err) fail(`Scouting: ${err}`);
for (let i = 0; i < 40; i++) processDay(g, HEADLESS_UI);
const rep = scoutReport(g, target.id);
if (!rep || rep < 0.7) fail(`kein Bericht nach 40 Tagen: ${rep}`);
console.log(`Bericht ${target.name}: Bekanntheit ${rep.toFixed(2)}`);

// Warteschlange: mehr Aufträge als Scouts → Rest wartet, startet nacheinander
const many = rows.filter((r) => r.kind === 'world' && r.country === 'Deutschland' && !r.youth).slice(0, scoutSlots(g) + 3);
const res = many.map((r) => queueScouting(g, { id: r.id, name: r.name, clubName: clubs.get(r.clubId)?.name ?? '', abroad: false, youth: false }));
if (res.filter((x) => x === 'queued').length !== 3) fail(`Warteschlange: ${res.join(',')}`);
for (let i = 0; i < 80 && (scoutingOf(g).queue?.length || scoutingOf(g).jobs.length); i++) processDay(g, HEADLESS_UI);
if (scoutingOf(g).queue?.length || many.some((r) => queuedJob(g, r.id) >= 0)) fail('Warteschlange nicht abgearbeitet');
if (many.some((r) => !scoutReport(g, r.id))) fail('Bericht aus der Warteschlange fehlt');
console.log(`Warteschlange: ${many.length} Aufträge bei ${scoutSlots(g)} Scout(s) abgearbeitet`);

// Verhandlung über einen Weltspieler bis zum Wechsel
const w = pool.p.filter((x) => clubs.get(x[1])?.country === 'England' && !x[12] && x[8] >= 70).sort((a, b) => b[8] - a[8])[3];
const p = materializeWorldPlayer(g, w[0]);
if (!p) fail('materialize');
const block = talkBlocker(g, p);
if (block) fail(`Blocker: ${block}`);
const t = startTalk(g, p.id);
if (typeof t === 'string') fail(t);
g.clubs[g.managedClubId].finances.transferBudget = 1e9;
g.clubs[g.managedClubId].finances.wageBudget = 1e9;
let ans = '';
for (let i = 0; i < 6 && t.phase === 'club'; i++) ans = clubOffer(g, t.id, { fee: Math.round(t.currentAsk * 1.05), installments: false, sellOn: 0, bonus: 0 });
if (t.phase !== 'player') fail(`Vereinsgespräch: ${t.phase} ${ans}`);
const st = stanceFor(g, t);
for (let i = 0; i < 4 && t.phase === 'player'; i++) ans = playerOffer(g, t.id, { wage: Math.round(st.minWage * 1.3), years: st.years[1] ?? st.years[0], signingFee: 0, releaseClause: false, promises: [] });
if (t.phase !== 'agreed' && t.phase !== 'done') fail(`Spielergespräch: ${t.phase} ${ans}`);
for (let i = 0; i < 260 && t.phase !== 'done'; i++) processDay(g, HEADLESS_UI);
if (t.phase !== 'done') fail(`Wechsel nicht vollzogen: ${t.phase}`);
if (g.players[p.id].clubId !== g.managedClubId || !g.clubs[g.managedClubId].playerIds.includes(p.id)) fail('nicht im Kader');
if (worldEntry(g, p.id)) fail('Weltspieler-Eintrag noch da');
console.log(`Wechsel: ${p.fullName} (${p.nationality}, Stärke ${p.overall}) ist jetzt bei ${g.clubs[g.managedClubId].name}.`);

// Abgebrochene Verhandlung: Spieler verschwindet wieder aus g.players, Eintrag bleibt
const w2 = pool.p.find((x) => clubs.get(x[1])?.country === 'Italien' && !x[12])!;
const p2 = materializeWorldPlayer(g, w2[0])!;
const t2 = startTalk(g, p2.id);
if (typeof t2 === 'string') fail(t2);
t2.phase = 'failed';
processDay(g, HEADLESS_UI);
if (g.players[p2.id]) fail('abgebrochener Weltspieler noch in g.players');
if (!worldEntry(g, p2.id)) fail('Eintrag weg');
console.log('Weltpool-Test bestanden.');
