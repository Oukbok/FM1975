// =============================================================================
// Doppelte Namen im Spiel (Wunsch Pascal: zu viele gleiche Namen). Je Heimatland ein neues
// Spiel (Startjahr 1995, `YEAR=…`), dann über alle Spieler mit Namen (volle Kader, Jugend,
// Weltspieler) gezählt, wie oft Vor- + Nachname innerhalb derselben Nationalität mehrfach
// vorkommen. Ausgabe je Heimatland: Spieler der Heimat-Nationalität, Paare mit Doppelung,
// Anteil der Spieler mit Namensvetter; dazu dieselben Werte über alle Nationalitäten.
//   node scripts/run-ts.mjs tests/name-dupes.ts [ger,eng,ita,esp,fra]
// =============================================================================
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
let seed = 1995;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const { createNewGame } = await import('../src/game/newGame');
const { composeHome } = await import('../src/game/worldCompose');
const { homeNationality } = await import('../src/data/origins');

const lands = (process.argv[2] ?? 'ger,eng,ita,esp,fra').split(',');
const year = Number(process.env.YEAR ?? 1995);
console.log(['Heimat', 'Jahr', 'Spieler', 'doppelt', 'Anteil', 'Namen>1', 'häufigster', 'alle Spieler', 'alle doppelt', 'Anteil alle'].join('\t'));
for (const cc of lands) {
  const club = composeHome(cc, year)?.tier1[0]?.id ?? 'fra';
  seed = 1995;
  const g = createNewGame({ managedClubId: club, manager: { name: 'T', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'rookie' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, country: cc } as any);
  const nat = homeNationality();
  const people: [string, string][] = [];
  for (const p of [...Object.values(g.players), ...Object.values(g.youthPlayers)]) people.push([p.nationality, `${p.firstName} ${p.lastName}`]);
  for (const w of g.worldPool?.p ?? []) people.push([w[4], `${w[2]} ${w[3]}`]);
  const stat = (rows: [string, string][]) => {
    const m = new Map<string, number>();
    for (const [n, name] of rows) m.set(`${n}|${name}`, (m.get(`${n}|${name}`) ?? 0) + 1);
    let dup = 0, names = 0, top = ['', 0] as [string, number];
    for (const [k, v] of m) if (v > 1) { dup += v; names++; if (v > top[1]) top = [k.split('|')[1], v]; }
    return { n: rows.length, dup, names, top };
  };
  const h = stat(people.filter(([n]) => n === nat)), a = stat(people);
  const pct = (x: number, n: number) => `${((100 * x) / Math.max(1, n)).toFixed(1)} %`;
  console.log([cc, year, h.n, h.dup, pct(h.dup, h.n), h.names, `${h.top[0]} ×${h.top[1]}`, a.n, a.dup, pct(a.dup, a.n)].join('\t'));
}
