// Talent-Test ohne UI: Potenzialverteilung (seltener Ausreißer-Schwanz),
// Frühreife/Langlebigkeit, Entfernung des Legenden-Systems (Migration, alter
// Spielstand läuft weiter).
//   node scripts/run-ts.mjs tests/talent-test.ts            (SAVE=<datei> lädt zusätzlich einen alten Spielstand)
import { readFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import { exceptionalPotential, longevity, maturity, youthTalentPotential } from '../src/engine/talent';
import { createNewGame } from '../src/game/newGame';
import { migrateLegacyLegends } from '../src/game/playerMigration';
import { processDay, HEADLESS_UI } from '../src/game/day';
import type { Game } from '../src/game/state';
import type { Player } from '../src/types';

let seed = 11;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }

// 1) Potenzialverteilung der Akademie-Talente.
const N = 200000;
let n85 = 0, n90 = 0, n93 = 0, low = 0;
for (let i = 0; i < N; i++) {
  const v = youthTalentPotential(Math.random, 0.1);
  if (v >= 85) n85++; if (v >= 90) n90++; if (v >= 93) n93++; if (v < 73) low++;
}
const pct = (x: number) => (x / N * 100).toFixed(2) + ' %';
console.log(`Potenzial: ≥85 ${pct(n85)}, ≥90 ${pct(n90)}, ≥93 ${pct(n93)}, unter 73 ${pct(low)}`);
if (n85 / N < 0.01 || n85 / N > 0.06) fail('Anteil ≥85 außerhalb 1–6 %');
if (n93 / N > 0.004) fail('Zu viele Jahrhundert-Potenziale (≥93)');
if (n93 === 0) fail('Kein einziges Potenzial ≥93 – Ausreißer-Schwanz fehlt');
for (let i = 0; i < 1000; i++) { const v = exceptionalPotential(Math.random); if (v < 85 || v > 99) fail('Ausnahmepotenzial außerhalb 85–99'); }

// 2) Verdeckte Eigenschaften: deterministisch, im Bereich, große Talente frühreifer.
const fake = (id: string, pot: number) => ({ id, isYouth: false, overall: 60, development: { basePotential: pot, potentialAbility: pot } } as unknown as Player);
let mSmall = 0, mBig = 0;
for (let i = 0; i < 2000; i++) {
  const a = fake('t' + i, 75), b = fake('t' + i, 96);
  const m = maturity(a), l = longevity(a);
  if (m < -1 || m > 1 || l < -1 || l > 1) fail('Eigenschaft außerhalb −1 … 1');
  if (maturity(a) !== m) fail('Frühreife nicht deterministisch');
  mSmall += m; mBig += maturity(b);
}
console.log(`Frühreife Ø: Potenzial 75 → ${(mSmall / 2000).toFixed(2)}, Potenzial 96 → ${(mBig / 2000).toFixed(2)}`);
if (mBig <= mSmall + 0.3) fail('Große Talente sind nicht frühreifer');

// 3) Neues Spiel: keine Legenden-Felder mehr.
const g = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
const raw = JSON.stringify(g);
if (/legendId|spawnedLegends|legendMode|legendProspects/.test(raw)) fail('Neues Spiel enthält Legenden-Felder');
const young = Object.values(g.players).filter((p) => p.age <= 20);
const young80 = young.filter((p) => p.overall >= 80).length;
console.log(`Startkader: ${young.length} Spieler ≤ 20 J., davon ≥ 80: ${young80}`);
if (young80 > Math.max(3, young.length * 0.03)) fail('Zu viele fertige Junge im Startkader');

// 3b) Jedes Spiel würfelt seine Talente neu (kein fest geplanter Star beim selben Verein).
const g2 = createNewGame({
  managedClubId: 'mgl',
  manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
});
if (!g.youthSalt || g.youthSalt === g2.youthSalt) fail('Kein eigenes Talent-Salz je Spiel');
const sameYouth = Object.keys(g.youthPlayers).filter((id) => g2.youthPlayers[id]);
const samePot = sameYouth.filter((id) => g.youthPlayers[id].development.potentialAbility === g2.youthPlayers[id].development.potentialAbility).length;
console.log(`Zwei neue Spiele: ${sameYouth.length} gleiche Jugend-IDs, davon gleiches Potenzial ${samePot}`);
if (sameYouth.length && samePot > sameYouth.length * 0.4) fail('Jugendtalente in zwei Spielen fast identisch');

// 4) Migration: alte Felder entfernen, idempotent.
const p0 = Object.values(g.players)[0];
Object.assign(p0.development as object, { legendId: 'lg_1954_1', legendBoost: 1.8, legendCurve: 'frueh', legendSignature: [{ attr: 'heading', min: 90, max: 95 }] });
Object.assign(g as object, { spawnedLegends: ['lg_1954_1'], legendMode: 'fictional', legendProspects: [] });
(g.archive ??= []).push({ id: 'x', name: 'X', nationality: 'GER', pos: 'MS', born: 1950, retired: 1985, peak: 90, apps: 300, goals: 100, clubs: [], lastClubId: 'mgl', legendId: 'lg' } as any);
const fixed = migrateLegacyLegends(g);
if (fixed < 8) fail(`Migration bereinigte nur ${fixed} Felder`);
if (/legendId|spawnedLegends|legendMode|legendProspects|legendBoost/.test(JSON.stringify(g))) fail('Legenden-Felder nach Migration übrig');
if (migrateLegacyLegends(g) !== 0) fail('Migration nicht idempotent');
console.log(`Migration: ${fixed} Felder bereinigt, zweiter Lauf 0.`);

// 5) Optional: alter Spielstand (vor der Entfernung erzeugt) lädt und läuft weiter.
if (process.env.SAVE) {
  const txt = readFileSync(process.env.SAVE, 'utf8');
  const s = JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game };
  const old = s.game;
  const legends = [...Object.values(old.players), ...Object.values(old.youthPlayers ?? {})].filter((p) => (p.development as any).legendId);
  console.log(`Alter Spielstand ${old.season}: ${legends.length} frühere Legenden, ${((old as any).legendProspects ?? []).length} Interessenten`);
  if (!legends.length) fail('Alter Spielstand enthält keine Legenden – Test ohne Aussagekraft');
  const ids = legends.map((p) => p.id);
  const n = migrateLegacyLegends(old);
  (old as any).simAutoManage = true;
  for (let d = 0; d < 60; d++) processDay(old, HEADLESS_UI);
  const still = ids.filter((id) => old.players[id] || old.youthPlayers[id]).length;
  console.log(`Nach Migration (${n} Felder) und 60 Tagen: ${still}/${ids.length} frühere Legenden als normale Spieler im Spiel, Datum ${old.calendar.currentDate}`);
  if (/legendId|legendProspects/.test(JSON.stringify(old))) fail('Legenden-Felder nach 60 Tagen wieder da');
}
console.log('Talent-Test bestanden.');
