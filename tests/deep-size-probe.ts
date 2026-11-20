// Speicherbedarf eines Spielstands (Entwicklung): JSON + lz-string je Bereich.
import { compressToUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const [club, year, country] = process.argv.slice(2);
const { composeHome } = await import('../src/game/worldCompose');
const id = club === 'auto' ? composeHome(country, Number(year))!.tier1[3].id : club;
const g = createNewGame({ managedClubId: id, manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'rookie' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: Number(year), country } as any);
const kb = (s: string) => (s.length / 1024).toFixed(0);
const all = JSON.stringify(g);
console.log('gesamt JSON', kb(all), 'KB, lz', kb(compressToUTF16(all)) , 'K Zeichen (×2 Byte)');
const parts = Object.entries(g as any).map(([k, v]) => [k, JSON.stringify(v) ?? ''] as const).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
for (const [k, s] of parts) console.log(' ', k, kb(s));
for (const [k, v] of Object.entries((g as any).world ?? {})) console.log('  world.', k, kb(JSON.stringify(v) ?? ''));
console.log('  euroClubs', Object.keys(g.euroClubs ?? {}).length);
for (const c of Object.values(g.world!.countries)) if (c.deep?.length) console.log('  tief', c.name, c.depth, c.deep.map((d) => d.groups.join('/')).join(' | '), 'pool', c.pool?.length);
