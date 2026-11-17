// =============================================================================
// Namensregister für verlinkten Fließtext (Wunsch Pascal: jede Erwähnung eines
// Spielers oder Vereins ist ein Link). Ein Register je Spielstand und Tag:
// volle Namen aller Spieler (Kader + Weltspieler), Name und Kurzname aller Vereine
// (volle Kader, Sim-Ligen, Ausland). Doppelte Namen gelten als mehrdeutig und
// werden nicht verlinkt. `linkParts` zerlegt einen Text in Text- und Link-Stücke –
// über Wortfolgen (bis 4 Wörter, längster Treffer zuerst), nicht über einen Riesen-Regex.
// =============================================================================
import type { Player } from '../types';
import type { Game } from './state';
import { WP_FIELD } from './worldPool';

export type NameRef = { kind: 'player' | 'club'; id: string };
type Index = { day: string; map: Map<string, NameRef | null> };
const CACHE = new WeakMap<Game, Index>();

function add(map: Map<string, NameRef | null>, key: string | undefined, ref: NameRef): void {
  const k = key?.trim();
  if (!k || k.length < 3) return;
  const old = map.get(k);
  if (old === undefined) map.set(k, ref);
  else if (old && (old.kind !== ref.kind || old.id !== ref.id)) map.set(k, null); // mehrdeutig
}

export function nameIndex(g: Game): Map<string, NameRef | null> {
  const day = g.calendar.currentDate;
  const hit = CACHE.get(g);
  if (hit && hit.day === day) return hit.map;
  const map = new Map<string, NameRef | null>();
  for (const c of Object.values(g.clubs)) { add(map, c.name, { kind: 'club', id: c.id }); add(map, c.shortName, { kind: 'club', id: c.id }); }
  for (const c of Object.values(g.simClubs ?? {})) { add(map, c.name, { kind: 'club', id: c.id }); add(map, c.shortName, { kind: 'club', id: c.id }); }
  for (const c of Object.values(g.euroClubs ?? {})) { add(map, c.name, { kind: 'club', id: c.id }); add(map, c.shortName, { kind: 'club', id: c.id }); }
  const players = (p: Player) => add(map, p.fullName, { kind: 'player', id: p.id });
  for (const p of Object.values(g.players)) players(p);
  for (const p of Object.values(g.youthPlayers ?? {})) players(p);
  // Weltspieler nur, wo kein voller Spieler gleich heißt (Wechsel lassen manchmal einen Doppelgänger im Pool).
  for (const w of g.worldPool?.p ?? []) {
    const k = `${w[WP_FIELD.first]} ${w[WP_FIELD.last]}`;
    const old = map.get(k);
    if (old && old.kind === 'player' && !old.id.startsWith('wp')) continue;
    add(map, k, { kind: 'player', id: String(w[WP_FIELD.id]) });
  }
  CACHE.set(g, { day, map });
  return map;
}

export type TextPart = string | { text: string; ref: NameRef };
const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’-]*|\([\p{L}]+\)/gu;

/** Text in Stücke zerlegen; `extra` = zusätzliche Kurzformen (z. B. Nachnamen der Spieler der Nachricht). */
export function linkParts(g: Game, text: string, extra?: Map<string, NameRef>): TextPart[] {
  if (!text) return [];
  const map = nameIndex(g);
  const words: { s: number; e: number }[] = [];
  for (const m of text.matchAll(WORD)) words.push({ s: m.index!, e: m.index! + m[0].length });
  const out: TextPart[] = [];
  let pos = 0;
  for (let i = 0; i < words.length; i++) {
    const c0 = text[words[i].s];
    if (c0.toLowerCase() === c0 && c0 !== '(') continue; // Namen beginnen groß
    let found: { j: number; ref: NameRef } | null = null;
    for (let j = Math.min(words.length - 1, i + 3); j >= i; j--) {
      // nur Wörter, die durch genau ein Leerzeichen getrennt sind
      let ok = true;
      for (let k = i; k < j; k++) if (text.slice(words[k].e, words[k + 1].s) !== ' ') { ok = false; break; }
      if (!ok) continue;
      const key = text.slice(words[i].s, words[j].e);
      const ref = extra?.get(key) ?? map.get(key);
      if (ref) { found = { j, ref }; break; }
    }
    if (!found) continue;
    if (words[i].s > pos) out.push(text.slice(pos, words[i].s));
    out.push({ text: text.slice(words[i].s, words[found.j].e), ref: found.ref });
    pos = words[found.j].e;
    i = found.j;
  }
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

/** Volle Namen und Nachnamen bestimmter Spieler als Zusatz (Nachnamen nur eindeutige). */
export function lastNameRefs(players: Pick<Player, 'id' | 'lastName' | 'fullName'>[]): Map<string, NameRef> {
  const out = new Map<string, NameRef>();
  const dup = new Set<string>();
  for (const p of players) {
    if (p.fullName) out.set(p.fullName, { kind: 'player', id: p.id }); // volle Namen dieser Spieler haben Vorrang
    if (!p.lastName || p.lastName.length < 3) continue;
    if (out.has(p.lastName) && out.get(p.lastName)!.id !== p.id) dup.add(p.lastName);
    out.set(p.lastName, { kind: 'player', id: p.id });
  }
  for (const d of dup) out.delete(d);
  return out;
}
