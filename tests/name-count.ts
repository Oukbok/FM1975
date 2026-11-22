// =============================================================================
// Namenszählung (Wunsch Pascal: Namen je Land im Verhältnis zu den simulierten Vereinen).
//   node scripts/run-ts.mjs tests/name-count.ts [pools|clubs|alle]
// pools: Nachnamen + Vornamen je Geburtsjahrzehnt je Land (Haupt-Herkünfte, Deutschland =
//        ger + ger_modern + ger_ost), so wie origins.ts sie nach dem Einmischen aller Stufen führt.
// clubs: je Heimatland × Startjahr 1975/1995/2025 ein neues Spiel → Vereine des Heimatlandes mit
//        Spielern (volle Kader + Weltspieler-Kader, Jugend inbegriffen) und Zahl der einheimischen
//        Spieler. `ONLY=eng,fra` schränkt die Länder ein.
// Ergebnis als Tabelle auf der Konsole (Grundlage für docs/research/names-target.md).
// =============================================================================
import { ORIGINS, firstNamesFor } from '../src/data/origins';
import { WORLD_COUNTRIES } from '../src/data/world/countries';

const MODE = process.argv[2] ?? 'pools';
export const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010];

/** Haupt-Herkünfte je Herkunftsschlüssel des Landes (Deutschland = drei Herkünfte). */
export const MAIN: Record<string, string[]> = { ger: ['ger', 'ger_modern', 'ger_ost'] };
const mainOf = (o: string) => MAIN[o] ?? [o];

export function poolCount(origin: string): { last: number; first: number[] } {
  const os = mainOf(origin).map((id) => ORIGINS[id]).filter(Boolean);
  const last = new Set(os.flatMap((o) => o.last)).size;
  const first = DECADES.map((d) => {
    const s = new Set<string>();
    for (let y = d; y < d + 10; y++) for (const o of os) for (const n of firstNamesFor(o, y)) s.add(n);
    return s.size;
  });
  return { last, first };
}

const origins = [...new Set(WORLD_COUNTRIES.map((c) => c.origin))].filter((o) => ORIGINS[o]);
if (MODE === 'pools' || MODE === 'alle') {
  console.log(['Herkunft', 'Nachn.', ...DECADES.map((d) => `V${d % 100}`), 'Vmin'].join('\t'));
  for (const o of origins) {
    const c = poolCount(o);
    console.log([o, c.last, ...c.first, Math.min(...c.first)].join('\t'));
  }
}

if (MODE === 'clubs' || MODE === 'alle') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
  let seed = 1975;
  Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const { createNewGame } = await import('../src/game/newGame');
  const { composeHome, playableCountries } = await import('../src/game/worldCompose');
  const { worldClubs } = await import('../src/game/worldPool');
  const { homeNationality } = await import('../src/data/origins');
  const only = process.env.ONLY?.split(',');
  const years = (process.env.YEARS ?? '1975,1995,2025').split(',').map(Number);
  console.log(['Land', 'Jahr', 'Herkunft', 'VereineVoll', 'VereineWelt', 'Vereine', 'Einheimische', 'Spieler'].join('\t'));
  for (const year of years) {
    for (const cc of playableCountries(year)) {
      if (cc === 'gdr' || (only && !only.includes(cc))) continue;
      const club = composeHome(cc, year)?.tier1[0]?.id ?? (cc === 'ger' ? 'fra' : null);
      if (!club) continue;
      seed = 1975;
      let g;
      try {
        g = createNewGame({ managedClubId: club, manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'rookie' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: year, country: cc } as any);
      } catch (e) { console.log(`${cc}\t${year}\tFEHLER ${(e as Error).message}`); continue; }
      const nat = homeNationality();
      const fullClubs = new Set<string>();
      for (const c of Object.values(g.clubs)) if ((c.playerIds?.length ?? 0) >= 11 && !c.id.startsWith('w_')) fullClubs.add(c.id);
      const wc = worldClubs(g);
      const worldHome = new Set([...wc.values()].filter((c) => c.country === 'Deutschland').map((c) => c.id));
      const wpClubsHome = new Set((g.worldPool?.p ?? []).filter((w) => worldHome.has(w[1])).map((w) => w[1]));
      let natives = 0, all = 0;
      for (const p of [...Object.values(g.players), ...Object.values(g.youthPlayers)]) {
        if (!fullClubs.has(p.clubId ?? '')) continue;
        all++; if (p.nationality === nat) natives++;
      }
      for (const w of g.worldPool?.p ?? []) {
        if (!wpClubsHome.has(w[1])) continue;
        all++; if (w[4] === nat) natives++;
      }
      const o = WORLD_COUNTRIES.find((c) => c.cc === cc)!.origin;
      console.log([cc, year, o, fullClubs.size, wpClubsHome.size, fullClubs.size + wpClubsHome.size, natives, all].join('\t'));
    }
  }
}
