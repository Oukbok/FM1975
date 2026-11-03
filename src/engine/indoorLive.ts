// =============================================================================
// HALLENTURNIER LIVE – dasselbe Turnier wie runIndoorTournament (engine/indoor.ts),
// aber Spiel für Spiel: Gruppen in Schlangenlinie, Gruppenspiele abwechselnd A/B,
// Halbfinale über Kreuz, Spiel um Platz 3, Finale. Fremde Spiele würfelt
// simIndoorMatch mit einem eigenen Zufall je Spielnummer (Reihenfolge egal, beim
// erneuten Öffnen gleich); eigene Spiele setzt die Show (engine/indoorMatch.ts).
// Rein rechnerisch, ohne Spielstand. Oberfläche: screens/indoor/.
// =============================================================================
import { hashStr, mulberry32 } from './leagues';
import {
  IndoorEntrant, IndoorMatch, IndoorResult, IndoorRow, IndoorStage, finalRanking, groupTable, seedGroups, simIndoorMatch, winnerOf,
} from './indoor';

export interface LiveSlot {
  /** Laufende Spielnummer (1 …). */
  no: number;
  stage: IndoorStage;
  a: string | null;
  b: string | null;
  match?: IndoorMatch;
}

export interface IndoorLive {
  seed: string;
  winPts: number;
  groups: [string[], string[]];
  strength: Record<string, number>;
  slots: LiveSlot[];
}

/** Spielreihenfolge innerhalb einer Gruppe (jeder möglichst mit Pause). */
function groupPairs(n: number): [number, number][] {
  if (n === 3) return [[0, 1], [1, 2], [0, 2]];
  if (n === 4) return [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j]);
  return out;
}

export function createIndoorLive(entrants: IndoorEntrant[], winPts: number, seed: string): IndoorLive {
  const groups = seedGroups(entrants, mulberry32(hashStr(`${seed}|seed`)));
  const slots: LiveSlot[] = [];
  const pa = groupPairs(groups[0].length).map(([i, j]) => ({ stage: 'A' as const, a: groups[0][i], b: groups[0][j] }));
  const pb = groupPairs(groups[1].length).map(([i, j]) => ({ stage: 'B' as const, a: groups[1][i], b: groups[1][j] }));
  for (let k = 0; k < Math.max(pa.length, pb.length); k++) {
    if (pa[k]) slots.push({ no: slots.length + 1, ...pa[k] });
    if (pb[k]) slots.push({ no: slots.length + 1, ...pb[k] });
  }
  for (const stage of ['SF', 'SF', 'P3', 'F'] as IndoorStage[]) slots.push({ no: slots.length + 1, stage, a: null, b: null });
  return { seed, winPts, groups, strength: Object.fromEntries(entrants.map((e) => [e.id, e.strength])), slots };
}

const isGroup = (s: LiveSlot) => s.stage === 'A' || s.stage === 'B';

export function liveTables(l: IndoorLive): [IndoorRow[], IndoorRow[]] {
  const played = l.slots.filter((s) => s.match && isGroup(s)).map((s) => s.match!);
  return [groupTable(l.groups[0], played.filter((m) => m.stage === 'A'), l.winPts), groupTable(l.groups[1], played.filter((m) => m.stage === 'B'), l.winPts)];
}

/** Paarungen der K.-o.-Runde eintragen, sobald die Vorrunde bzw. die Halbfinals gespielt sind. */
export function refreshKnockouts(l: IndoorLive): void {
  const ko = l.slots.filter((s) => !isGroup(s));
  const [sf1, sf2, p3, fin] = ko;
  if (!sf1.a && l.slots.filter(isGroup).every((s) => s.match)) {
    const [tA, tB] = liveTables(l);
    sf1.a = tA[0].id; sf1.b = tB[1].id;
    sf2.a = tB[0].id; sf2.b = tA[1].id;
  }
  if (!fin.a && sf1.match && sf2.match) {
    const w1 = winnerOf(sf1.match)!, w2 = winnerOf(sf2.match)!;
    p3.a = w1 === sf1.match.a ? sf1.match.b : sf1.match.a;
    p3.b = w2 === sf2.match.a ? sf2.match.b : sf2.match.a;
    fin.a = w1; fin.b = w2;
  }
}

export function nextSlot(l: IndoorLive): LiveSlot | undefined {
  refreshKnockouts(l);
  return l.slots.find((s) => !s.match);
}

export function liveOver(l: IndoorLive): boolean { return l.slots.every((s) => !!s.match); }

/** Spiel als Ergebnis (gleiche Verteilung wie im Hintergrund). */
export function autoPlaySlot(l: IndoorLive, s: LiveSlot): IndoorMatch {
  const rng = mulberry32(hashStr(`${l.seed}|${s.no}`));
  const m = simIndoorMatch({ id: s.a!, strength: l.strength[s.a!] }, { id: s.b!, strength: l.strength[s.b!] }, s.stage, rng);
  s.match = m;
  return m;
}

export function setSlotMatch(l: IndoorLive, s: LiveSlot, m: IndoorMatch): void {
  s.match = m;
  refreshKnockouts(l);
}

/** Alle offenen Spiele; `own` liefert das Ergebnis eines eigenen Spiels (sonst null = Ergebnis würfeln). */
export function playRest(l: IndoorLive, own?: (s: LiveSlot) => IndoorMatch | null): void {
  for (let s = nextSlot(l), guard = 0; s && guard < 64; s = nextSlot(l), guard++) {
    const m = own?.(s);
    if (m) s.match = m; else autoPlaySlot(l, s);
  }
}

/** Endergebnis im Format von runIndoorTournament (für game/indoorGame.ts). */
export function liveResult(l: IndoorLive): IndoorResult {
  const [tA, tB] = liveTables(l);
  const ko = l.slots.filter((s) => !isGroup(s)).map((s) => s.match!);
  const [sf1, sf2, p3, fin] = ko;
  const matches = [...l.slots.filter(isGroup).map((s) => s.match!), sf1, sf2, p3, fin];
  return { groups: l.groups, tables: [tA, tB], matches, ranking: finalRanking(tA, tB, sf1, sf2, p3, fin) };
}
