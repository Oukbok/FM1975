// Rückennummern (engine/shirtNumbers.ts) – Prüfungen für npm run test:worldpool.
import type { Game } from '../src/game/state';
import type { WP } from '../src/game/worldPool';
import { numberSquad, FIXED_SHIRTS_FROM, type ShirtEntry } from '../src/engine/shirtNumbers';
import { renumberSquad } from '../src/game/squads';

type Fields = { club: number; shirt: number; id: number; pos: number; youth: number; born: number };

function worldByClub(g: Game, W: Fields): Map<string, WP[]> {
  const m = new Map<string, WP[]>();
  for (const w of g.worldPool!.p) { const l = m.get(w[W.club] as string) ?? []; l.push(w); m.set(w[W.club] as string, l); }
  return m;
}

export function checkShirtNumbers(g: Game, fail: (m: string) => never, worldPoolSeason: (g: Game) => void, W: Fields): void {
  // Volle Kader: jede Nummer 1–99, eindeutig.
  for (const c of Object.values(g.clubs)) {
    const seen = new Set<number>();
    for (const id of c.playerIds) {
      const n = g.players[id]?.shirtNumber ?? 0;
      if (n < 1 || n > 99 || seen.has(n)) fail(`${c.name}: Rückennummer ${n} ungültig/doppelt`);
      seen.add(n);
    }
  }
  // Weltspieler: eindeutig je Verein, klassisch 1–11 vergeben, Torwart mit der 1.
  const check = (label: string) => {
    for (const [cid, l] of worldByClub(g, W)) {
      const ns = l.map((w) => w[W.shirt] as number | undefined);
      if (ns.some((n) => !n) || new Set(ns).size !== ns.length) fail(`${label}: Weltverein ${cid} Nummern ${ns.join(',')}`);
    }
  };
  check('Start');
  const one = [...worldByClub(g, W).values()][0];
  for (let n = 1; n <= 11; n++) if (!one.some((w) => w[W.shirt] === n)) fail(`klassische Nummer ${n} fehlt`);
  if (one.find((w) => w[W.shirt] === 1)?.[W.pos] !== 'TW') fail('Nummer 1 ist kein Torwart');
  // Angelegter Weltspieler trägt seine Nummer.
  const w0 = one[3];
  const p0 = g.players[w0[W.id] as string];
  if (p0 && p0.shirtNumber !== w0[W.shirt]) fail('volles Spielerobjekt mit anderer Nummer');

  // Ab 1993/94: Nummern bleiben über den Saisonwechsel, Neue bekommen freie.
  const was = new Map(g.worldPool!.p.map((w) => [w[W.id] as string, `${w[W.club]}|${w[W.shirt]}`]));
  // Pool auf 1993 verschieben (gleiches Alter), dann eine Saison weiter.
  for (const w of g.worldPool!.p) (w[W.born] as number) += 18;
  g.season = '1994/95'; g.worldPool!.year = 1993;
  worldPoolSeason(g);
  check('1994/95');
  let kept = 0, same = 0;
  for (const w of g.worldPool!.p) { const v = was.get(w[W.id] as string); if (v && v.startsWith(`${w[W.club]}|`)) { same++; if (v === `${w[W.club]}|${w[W.shirt]}`) kept++; } }
  if (kept !== same) fail(`feste Nummern geändert: ${same - kept} von ${same}`);
  g.season = '1975/76';

  // Reine Rechnung: Epochen, Jugend, eigener Verein bleibt.
  const sq: ShirtEntry[] = [
    ...['TW', 'TW', 'TW', 'LIB', 'IV', 'IV', 'RV', 'LV', 'DM', 'ZM', 'ZM', 'OM', 'RA', 'LA', 'MS', 'MS', 'HS', 'RM'].map((pos, i) => ({ id: `t${i}`, pos, ov: 80 - i } as ShirtEntry)),
    { id: 'y1', pos: 'ZM', ov: 50, youth: true }, { id: 'y2', pos: 'MS', ov: 48, youth: true },
  ];
  const classic = numberSquad(sq, 1980, true);
  if (classic.get('t0') !== 1 || classic.get('t1') !== 12 || classic.get('t14') !== 9 || classic.get('t3') !== 5) fail(`klassisch: ${[...classic].join(' ')}`);
  const modern = numberSquad(sq, 2010, true);
  if (modern.get('t0') !== 1 || !['y1', 'y2'].every((y) => (modern.get(y) ?? 0) >= 30)) fail(`modern: ${[...modern].join(' ')}`);
  if ([...modern.values()].some((n) => n > 40)) fail('modern über 40');
  const keep = numberSquad(sq.map((e) => ({ ...e, cur: classic.get(e.id) })).concat([{ id: 'neu', pos: 'MS', ov: 90 }]), 2010, false);
  if (sq.some((e) => keep.get(e.id) !== classic.get(e.id))) fail('behalten: Nummern geändert');
  if (!keep.get('neu') || [...classic.values()].includes(keep.get('neu')!)) fail('Neuzugang ohne freie Nummer');
  const mine = g.clubs[g.managedClubId];
  const before = mine.playerIds.map((id) => g.players[id].shirtNumber).join(',');
  for (const c of Object.values(g.clubs)) if (c.id !== mine.id) renumberSquad(c, g.players, FIXED_SHIRTS_FROM - 1);
  if (mine.playerIds.map((id) => g.players[id].shirtNumber).join(',') !== before) fail('eigene Nummern verändert');
  console.log(`Rückennummern: ${worldByClub(g, W).size} Weltvereine eindeutig, ${kept}/${same} feste Nummern über den Saisonwechsel erhalten.`);
}
