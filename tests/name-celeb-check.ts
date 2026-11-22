// =============================================================================
// Namenspools gegen bekannte reale Personen (Wunsch Pascal: keine Paare, die bekannte
// Personen ergeben). Für jede Person aus tests/realPeopleNames.ts (und den vollen Namen
// aus tests/realPeopleList.ts) wird geprüft, ob eine Herkunft Vor- UND Nachnamen führt –
// dann kann makeName das Paar erzeugen, und es muss in BLOCKED_NAMES stehen.
//   node scripts/run-ts.mjs tests/name-celeb-check.ts        (Exit 1 bei ungesperrten Paaren)
//   LIST=1 …                                                  (nur Liste zum Eintragen ausgeben)
// =============================================================================
import { ORIGINS, firstNamesFor } from '../src/data/origins';
import { BLOCKED_NAMES } from '../src/data/namePools';
import { CELEBS } from './realPeopleNames';
import { POLITICS, ATHLETES, FOOTBALL_PEOPLE, CULTURE, HISTORIC } from './realPeopleList';

const plain = [...POLITICS, ...ATHLETES, ...FOOTBALL_PEOPLE, ...CULTURE, ...HISTORIC]
  .filter((x) => /^[\p{L}' .-]+$/u.test(x) && x.includes(' '));
const people = [...new Set([...CELEBS, ...plain])];

// Vornamen und Nachnamen je Herkunft (alle Jahrgänge)
const pools = Object.values(ORIGINS).map((o) => {
  const first = new Set<string>(o.first);
  for (let y = 1930; y <= 2020; y++) for (const n of firstNamesFor(o, y)) first.add(n);
  return { id: o.id, first, last: new Set(o.last) };
});

const open: string[] = [];
const seen = new Set<string>();
for (const p of people) {
  const t = p.split(' ').filter(Boolean);
  for (let k = 1; k < t.length; k++) {
    const first = t.slice(0, k).join(' '), last = t.slice(k).join(' ');
    const pair = `${first} ${last}`;
    if (seen.has(pair)) continue;
    const hit = pools.find((o) => o.first.has(first) && o.last.has(last));
    if (hit) { seen.add(pair); if (!BLOCKED_NAMES.has(pair)) open.push(`${pair} (${hit.id})`); }
  }
}
if (process.env.LIST) { console.log(open.map((x) => x.replace(/ \(.*\)$/, '')).join('\n')); process.exit(0); }
console.log(`${people.length} Personen geprüft, ${seen.size} mögliche Paare, ungesperrt: ${open.length}`);
if (open.length) console.log(open.join(', '));
process.exit(open.length ? 1 : 0);
