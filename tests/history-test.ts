// Test „Entwicklung der anderen Vereine“ ohne UI (game/historicSteer.ts, data/historicStrength.ts):
// Kurven gültig und alle Vereine im Spiel vorhanden, Option am Spielstand, Aus = keine
// Änderung, Mittel/Stark lenken nur KI-Vereine (nie den eigenen, auch nach Vereinswechsel),
// Sim-Vereine und Ausland, alte Spielstände, zwei Saisons Stark ohne NaN/Absturz.
//   npm run test:history
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { startNextSeason } from '../src/game/season';
import { CalendarEngine } from '../src/engine/calendar';
import { allEuroClubs } from '../src/data/europe';
import { initWorld } from '../src/engine/world';
import { curveAt, FOREIGN_CURVES, GERMAN_CURVES } from '../src/data/historicStrength';
import {
  historicMoney, historicSeasonClose, historicSimClubs, historicWorld, historyModeOf, migrateHistoryMode, targetReputation,
} from '../src/game/historicSteer';
import { Game } from '../src/game/state';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const ok = (msg: string) => console.log('ok  ', msg);
function fresh(mode?: 'off' | 'medium' | 'strong', club = 'mgl'): Game {
  return createNewGame({
    managedClubId: club,
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, historyMode: mode,
  });
}

// 1) Kurven: aufsteigende Jahre, Faktoren 0,7–1,45, Interpolation
for (const [k, c] of [...Object.entries(GERMAN_CURVES), ...Object.entries(FOREIGN_CURVES)]) {
  for (let i = 0; i < c.length; i++) {
    if (c[i][1] < 0.7 || c[i][1] > 1.45) fail(`${k}: Faktor ${c[i][1]} außerhalb 0,7–1,45`);
    if (i && c[i][0] <= c[i - 1][0]) fail(`${k}: Jahre nicht aufsteigend`);
  }
}
const m = GERMAN_CURVES.muc;
if (curveAt(m, 1960) !== m[0][1] || curveAt(m, 2100) !== m[m.length - 1][1]) fail('Kurve außen nicht konstant');
if (Math.abs(curveAt([[2000, 1], [2010, 1.2]], 2005) - 1.1) > 1e-9) fail('Interpolation falsch');
if (curveAt(GERMAN_CURVES.muc, 2015) < 1.4) fail('München Rot ab 2012 nicht Weltspitze');
if (curveAt(GERMAN_CURVES.ham, 2019) > 0.9) fail('Hamburg Blau nach 2018 nicht abgestürzt');
ok(`Kurven: ${Object.keys(GERMAN_CURVES).length} deutsche, ${Object.keys(FOREIGN_CURVES).length} ausländische`);

// 2) Alle Vereine mit Kurve existieren im Spiel
const g0 = fresh();
const germanIds = new Set([...Object.keys(g0.clubs), ...Object.values(g0.simClubs).flatMap((s) => [s.id, s.canonicalId ?? s.id])]);
for (const id of Object.keys(GERMAN_CURVES)) if (!germanIds.has(id)) fail(`deutscher Verein ${id} fehlt im Spiel`);
const euro = allEuroClubs();
const w0 = initWorld(euro, 1975);
const foreignKeys = new Set(Object.keys(w0.meta).map((id) => `${euro[id].country}|${euro[id].name}`));
for (const k of Object.keys(FOREIGN_CURVES)) if (!foreignKeys.has(k)) fail(`Auslandsverein ${k} fehlt in der Welt`);
ok('alle Kurven-Vereine vorhanden (West, DDR, Pool, Ausland)');

// 3) Option am Spielstand; alte Spielstände = Aus
if (historyModeOf(g0) !== 'off' || g0.historyMode !== 'off') fail('Standard ist nicht Aus');
if (fresh('strong').historyMode !== 'strong') fail('Stark nicht gespeichert');
const old = fresh(); delete (old as any).historyMode; migrateHistoryMode(old);
if (historyModeOf(old) !== 'off') fail('alter Spielstand nicht Aus');
const bad = fresh(); (bad as any).historyMode = 'quatsch'; migrateHistoryMode(bad);
if (historyModeOf(bad) !== 'off') fail('ungültiger Wert nicht auf Aus gesetzt');
ok('Option gespeichert, alte Spielstände = Aus');

// 4) Aus: nichts ändert sich
const snap = (g: Game) => JSON.stringify([Object.values(g.clubs).map((c) => [c.reputation, c.brand, c.finances.balance]), Object.values(g.simClubs).map((s) => s.strength), g.world]);
{
  const g = fresh('off');
  g.world = initWorld(g.euroClubs ?? allEuroClubs(), 1976);
  const before = snap(g);
  historicSeasonClose(g, 2015); historicMoney(g, 2015, '2015-07-01'); historicSimClubs(g, 2015); historicWorld(g, g.world, g.euroClubs!, 2015);
  if (snap(g) !== before) fail('Aus verändert den Spielstand');
}
ok('Aus: keine Änderung');

// 5) Stark: KI-Vereine gelenkt, eigener Verein nie
{
  const g = fresh('strong', 'muc');
  const muc = g.clubs.muc, mgl = g.clubs.mgl, kai = g.clubs.kai;
  const r0 = { muc: muc.reputation, mgl: mgl.reputation, kai: kai.reputation }, b0 = muc.finances.balance;
  const brand0 = JSON.stringify(muc.brand);
  for (let i = 0; i < 6; i++) { historicSeasonClose(g, 2015); historicMoney(g, 2015, '2015-07-01'); }
  if (muc.reputation !== r0.muc || muc.finances.balance !== b0 || JSON.stringify(muc.brand) !== brand0) fail('eigener Verein wurde gelenkt');
  if (Math.abs(mgl.reputation - targetReputation(curveAt(GERMAN_CURVES.mgl, 2015))) > Math.abs(r0.mgl - targetReputation(curveAt(GERMAN_CURVES.mgl, 2015)))) fail('Gladbach nicht Richtung Kurve');
  if (kai.reputation >= r0.kai) fail(`Kaiserslautern 2015 nicht gesunken (${r0.kai} → ${kai.reputation})`);
  // Vereinswechsel: jetzt gilt die Kurve wieder für München Rot
  g.managedClubId = 'mgl';
  const rm = muc.reputation, bm = muc.finances.balance;
  historicSeasonClose(g, 2015); historicMoney(g, 2015, '2015-07-01');
  if (muc.reputation <= rm || muc.finances.balance <= bm) fail('verlassener Verein wird nach dem Wechsel nicht gelenkt');
}
ok('Stark: Ruf/Geld der KI gelenkt, eigener Verein unberührt, nach Wechsel wieder für den alten Verein');

// 6) Mittel lenkt schwächer als Stark; Sim-Vereine und Ausland
{
  const gm = fresh('medium'), gs = fresh('strong');
  for (const g of [gm, gs]) { historicSeasonClose(g, 2013); historicMoney(g, 2013, '2013-07-01'); }
  if (!(gs.clubs.muc.reputation > gm.clubs.muc.reputation)) fail('Stark nicht stärker als Mittel (Ruf)');
  if (!(gs.clubs.muc.finances.balance > gm.clubs.muc.finances.balance)) fail('Stark nicht stärker als Mittel (Geld)');
  const dor0 = gs.simClubs.n_dor.strength;
  for (let i = 0; i < 5; i++) historicSimClubs(gs, 2012);
  if (gs.simClubs.n_dor.strength <= dor0) fail(`Dortmund (Sim) 2012 nicht gestärkt (${dor0} → ${gs.simClubs.n_dor.strength})`);
  const ddr0 = gs.simClubs['ddr-berlin-ost'].strength;
  for (let i = 0; i < 5; i++) historicSimClubs(gs, 1982);
  if (gs.simClubs['ddr-berlin-ost'].strength <= ddr0) fail('Berlin (Ost) 1982 nicht gestärkt');
  const w = initWorld(gs.euroClubs ?? allEuroClubs(), 1976);
  const id = Object.keys(w.meta).find((k) => gs.euroClubs![k]?.name === 'Paris' && gs.euroClubs![k]?.country === 'Frankreich')!;
  const s0 = w.meta[id].home;
  for (let i = 0; i < 5; i++) historicWorld(gs, w, gs.euroClubs!, 2015);
  if (w.meta[id].home <= s0 + 0.15) fail(`Paris 2015 nicht gewachsen (${s0.toFixed(2)} → ${w.meta[id].home.toFixed(2)})`);
}
ok('Mittel < Stark; Sim-Vereine (Dortmund, Berlin Ost) und Ausland (Paris) gelenkt');

// 7) Zwei echte Saisons mit Stark: läuft, keine NaN, Großklub-Ruf über Aus
function play(g: Game, seasons: number) {
  for (let s = 0; s < seasons; s++) {
    let guard = 0;
    while (!CalendarEngine.isSeasonOver(g.calendar)) { processDay(g, HEADLESS_UI); if (++guard > 1000) fail('Saison endet nicht'); }
    startNextSeason(g);
  }
}
{
  seed = 77; const off = fresh('off', 'kar'); play(off, 2);
  seed = 77; const st = fresh('strong', 'kar'); play(st, 2);
  for (const c of Object.values(st.clubs)) if (!Number.isFinite(c.finances.balance) || !Number.isFinite(c.reputation)) fail(`${c.name}: NaN`);
  // Spielt deine Liga oben, hat München Rot einen vollen Kader (Ruf), sonst eine Sim-Stärke.
  const rep = (g: Game, id: string) => g.clubs[id]?.reputation ?? g.simClubs[id]?.strength ?? 0;
  const same = !!st.clubs.muc === !!off.clubs.muc;
  console.log(`     Liga: Aus ${off.leagues.playerDivision.tier}, Stark ${st.leagues.playerDivision.tier}`);
  if (same && !(rep(st, 'muc') > rep(off, 'muc'))) fail(`München Rot: Stark ${rep(st, 'muc')} nicht über Aus ${rep(off, 'muc')}`);
    ok(`2 Saisons Stark: München Rot Ruf/Sim-Stärke ${rep(st, 'muc')} (Aus ${rep(off, 'muc')}), Offenbach ${rep(st, 'off') || '-'} (Aus ${rep(off, 'off') || '-'})`);
}
console.log('Alle Prüfungen bestanden.');
