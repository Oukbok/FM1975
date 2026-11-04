// Lerntempo der Positionsvertrautheit: eine Saison = 30 Ligaspiele à 90 Min. (+ 230 Trainingstage
// Positionstraining, Anlagen-Qualität 1,08 wie bei Anlagen 70). Ausgabe: Punkte je Saison
// für ähnliche vs. fremde Position vs. nur Training, je Alter, und das Abbremsen ab 80.
//   node scripts/run-ts.mjs tests/posLearnBench.ts
import { addPositionMinutes, positionRelation, setTrainingPosition, skillOf, trainPositionDays } from '../src/engine/positionSkill';
import type { Player, Position } from '../src/types';

const GAMES = 30, TRAIN_DAYS = 230, QUALITY = 1.08;
type Mode = 'spiele+training' | 'nur spiele' | 'nur training';

function mk(nat: Position, pos: Position, start: number, age: number): Player {
  return { id: `b-${nat}-${pos}`, naturalPosition: nat, preferredFoot: 'right', age, secondaryPositions: [],
    positionSkill: { v: { [nat]: 100, [pos]: start }, t0: 0 } } as unknown as Player;
}

/** Eine Saison: Spiele und Trainingstage gleichmäßig verteilt; Rückgabe = Wert danach. */
export function season(p: Player, pos: Position, mode: Mode, seasons = 1): number {
  if (mode !== 'nur spiele') setTrainingPosition(p, pos, '1976-07-01');
  for (let s = 0; s < seasons; s++) {
    for (let d = 0; d < TRAIN_DAYS; d++) {
      const date = '1976-08-01';
      if (mode !== 'nur training' && d % Math.round(TRAIN_DAYS / GAMES) === 0 && d / Math.round(TRAIN_DAYS / GAMES) < GAMES) addPositionMinutes(p, pos, 90, date);
      if (mode !== 'nur spiele') trainPositionDays(p, 1, date, QUALITY);
    }
  }
  return skillOf(p, pos);
}

const CASES: { label: string; nat: Position; pos: Position }[] = [
  { label: 'sehr ähnlich ZM→OM', nat: 'ZM', pos: 'OM' },
  { label: 'ähnlich RV→RM', nat: 'RV', pos: 'RM' },
  { label: 'ähnlich IV→DM', nat: 'IV', pos: 'DM' },
  { label: 'mittel ZM→RV', nat: 'ZM', pos: 'RV' },
  { label: 'fremd MS→ZM', nat: 'MS', pos: 'ZM' },
  { label: 'sehr fremd IV→RA', nat: 'IV', pos: 'RA' },
];
const f = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(1);
const pad = (s: string, n: number) => s.padEnd(n);

console.log(`Eine Saison = ${GAMES} Spiele à 90 Min., ${TRAIN_DAYS} Trainingstage (Qualität ${QUALITY}), Start 20, Alter 27`);
console.log(pad('Fall', 22) + pad('Verw.', 7) + pad('Spiele+Tr.', 12) + pad('nur Spiele', 12) + 'nur Training');
for (const c of CASES) {
  const rel = positionRelation({ preferredFoot: 'right' }, c.nat, c.pos);
  const row = (['spiele+training', 'nur spiele', 'nur training'] as Mode[]).map((m) => f(season(mk(c.nat, c.pos, 20, 27), c.pos, m) - 20));
  console.log(pad(c.label, 22) + pad(rel.toFixed(2), 7) + row.map((x) => pad(x, 12)).join(''));
}
console.log('\nJe Alter (fremd MS→ZM / ähnlich RV→RM, Spiele+Training, Start 20):');
for (const age of [19, 23, 27, 31, 34]) {
  console.log(`  Alter ${age}: ${f(season(mk('MS', 'ZM', 20, age), 'ZM', 'spiele+training') - 20)} / ${f(season(mk('RV', 'RM', 20, age), 'RM', 'spiele+training') - 20)}`);
}
console.log('\nAb 80 (Alter 27, Spiele+Training, Wert nach 1/2/3 Saisons):');
for (const c of [CASES[1], CASES[4]]) {
  const vals = [1, 2, 3].map((n) => season(mk(c.nat, c.pos, 80, 27), c.pos, 'spiele+training', n).toFixed(1));
  const onlyTr = season(mk(c.nat, c.pos, 80, 27), c.pos, 'nur training').toFixed(1);
  console.log(`  ${pad(c.label, 20)} 80 → ${vals.join(' → ')}   (nur Training 1 Saison: ${onlyTr})`);
}
console.log('\nVon 20 bis „gut“ 80 (Saisons, Spiele+Training, Alter 27):');
for (const c of [CASES[1], CASES[4]]) {
  const p = mk(c.nat, c.pos, 20, 27); let n = 0;
  while (skillOf(p, c.pos) < 80 && n < 10) { season(p, c.pos, 'spiele+training'); n++; }
  console.log(`  ${pad(c.label, 20)} ${n} Saison(s) → ${skillOf(p, c.pos).toFixed(1)}`);
}
