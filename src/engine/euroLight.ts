// =============================================================================
// Europapokal im Hintergrund: schnelle Spielsimulation MIT Statistik.
// -----------------------------------------------------------------------------
// Alle Spiele ohne eigenen Verein laufen hier (Spiele des eigenen Vereins nutzen die
// volle Match-Engine). Tore nach Stärke (Poisson wie engine/leagues.ts), dazu
// Torschützen, Vorlagen, Karten, Einsätze und Zu-null-Spiele – damit die Bestenlisten
// eines Wettbewerbs ALLE Spiele zählen.
//   • Deutsche Vereine (volle Kader): Spieler aus dem Kader (verfügbar, nach Stärke).
//   • Ausländische Vereine ohne Kader: fester Kurzkader (16 Spieler) je Verein, der sich
//     über die Jahre langsam erneuert (je Platz alle 6 Jahre ein neuer Spieler, versetzt).
//     Namen nach Herkunft des Landes (data/origins.ts). Statistik am Wettbewerb
//     (`CupState.xstats`, Namen `xpeople`), nicht am Spielstand-Spieler.
// Plausibilität: Torverteilung nach Positionsgruppen ≈ Stürmer 55 %, Mittelfeld 30 %,
// Abwehr 15 % (übliche Verteilung in Profiligen); ≈ 75 % der Tore mit Vorlage; Gelbe
// Karten je Team und Spiel 1975 ≈ 1,2 → heute ≈ 2,0 (Kartenstatistiken der Bundesliga).
// =============================================================================
import type { Club, CupState, Player, Position } from '../types';
import type { XTuple } from '../types/euro2';
import { ORIGINS } from '../data/origins';
import { POSITION_GROUPS } from '../types';
import type { KoRule } from './match/sim';

const COUNTRY_ORIGIN: Record<string, string> = {
  England: 'eng', Italien: 'ita', Spanien: 'esp', Frankreich: 'fra', Schottland: 'sco', Niederlande: 'ned',
  Sowjetunion: 'rus', Portugal: 'por', Jugoslawien: 'yug', Griechenland: 'gre', Belgien: 'bel', Ungarn: 'hun',
  Tschechoslowakei: 'cze', Polen: 'pol', Oesterreich: 'aut', Tuerkei: 'tur', Schweiz: 'sui', Schweden: 'swe',
  Rumaenien: 'hun', Daenemark: 'den', Ukraine: 'rus', Russland: 'rus', Kroatien: 'cro', Serbien: 'srb',
  Slowakei: 'cze', Tschechien: 'cze', Norwegen: 'nor', Bulgarien: 'srb', Slowenien: 'cro', 'Bosnien-Herzegowina': 'srb',
};

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function poisson(lambda: number, r: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L && k < 12);
  return k - 1;
}

/** Spielstand-Schnittstelle (strukturell, wie EuroGameLike). */
export interface LightGame {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  euroClubs?: Record<string, { name: string; country: string; strength: number }>;
  simClubs?: Record<string, { strength: number }>;
}

export function teamStrength(g: LightGame, id: string): number {
  const c = g.clubs[id];
  if (c && c.playerIds.length) {
    const ovs = c.playerIds.map((pid) => g.players[pid]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
    if (ovs.length) return ovs.reduce((a, b) => a + b, 0) / ovs.length;
  }
  return g.euroClubs?.[id]?.strength ?? g.simClubs?.[id]?.strength ?? c?.reputation ?? 60;
}

// -----------------------------------------------------------------------------
// Kader für die Statistik
// -----------------------------------------------------------------------------
interface Pl { id: string; pos: Position; q: number }
const SLOTS: Position[] = ['TW', 'TW', 'VS', 'VS', 'AV', 'AV', 'LIB', 'DM', 'ZM', 'ZM', 'OM', 'FL', 'FL', 'MS', 'MS', 'HS'];

/** Kurzkader eines ausländischen Vereins (deterministisch je Verein und Jahr). */
function phantomRoster(cup: CupState, clubId: string, country: string, strength: number, year: number): Pl[] {
  const origin = ORIGINS[COUNTRY_ORIGIN[country] ?? 'eng'] ?? ORIGINS.eng;
  const people = (cup.xpeople ??= {});
  return SLOTS.map((pos, slot) => {
    const gen = Math.floor((year + slot * 3) / 6);
    const id = `x:${clubId}:${slot}:${gen}`;
    const r = rng(hashKey(id));
    if (!people[id]) {
      const first = origin.first[Math.floor(r() * origin.first.length)];
      const last = origin.last[Math.floor(r() * origin.last.length)];
      people[id] = [`${first} ${last}`, clubId, pos];
    } else { r(); r(); }
    // Ein Platz je Kader ist der Star (Stürmer 13), sonst Streuung um die Vereinsstärke.
    const q = strength + (slot === 13 ? 5 : 0) + (r() - 0.5) * 8 - (slot === 1 ? 6 : 0);
    return { id, pos, q };
  });
}

/** Spieler eines Vereins mit vollem Kader (verfügbar, nach Stärke). */
function realRoster(g: LightGame, club: Club): Pl[] {
  return club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !p.injury && !(p.suspensionMatches > 0))
    .sort((a, b) => b.overall - a.overall).map((p) => ({ id: p.id, pos: p.naturalPosition, q: p.overall }));
}

function rosterOf(g: LightGame, cup: CupState, id: string, year: number): Pl[] {
  const c = g.clubs[id];
  if (c && c.playerIds.length >= 11) return realRoster(g, c);
  const eu = g.euroClubs?.[id];
  return phantomRoster(cup, id, eu?.country ?? 'England', eu?.strength ?? teamStrength(g, id), year);
}

/** Aufstellung: 1 TW, 4 Abwehr, 4 Mittelfeld, 2 Sturm (Rest auffüllen), dazu Einwechselspieler. */
function lineup(roster: Pl[], subs: number): { xi: Pl[]; bench: Pl[] } {
  const by = (grp: string) => roster.filter((p) => POSITION_GROUPS[p.pos] === grp);
  const xi: Pl[] = [...by('GK').slice(0, 1), ...by('DEF').slice(0, 4), ...by('MID').slice(0, 4), ...by('ATT').slice(0, 2)];
  for (const p of roster) if (xi.length < 11 && !xi.includes(p)) xi.push(p);
  const bench = roster.filter((p) => !xi.includes(p) && POSITION_GROUPS[p.pos] !== 'GK').slice(0, subs);
  return { xi, bench };
}

const SCORE_W: Record<string, number> = { GK: 0, DEF: 0.12, MID: 0.38, ATT: 1 };
const POS_SCORE: Partial<Record<Position, number>> = { MS: 1.25, HS: 1.05, FL: 0.8, OM: 1.4, DM: 0.55, LIB: 0.8 };
const ASSIST_W: Record<string, number> = { GK: 0.02, DEF: 0.3, MID: 1, ATT: 0.7 };
const POS_ASSIST: Partial<Record<Position, number>> = { OM: 1.3, FL: 1.4, AV: 1.6 };

function pick(list: Pl[], w: (p: Pl) => number, r: () => number, not?: Pl): Pl | null {
  const ws = list.map((p) => (p === not ? 0 : Math.max(0, w(p))));
  const sum = ws.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  let x = r() * sum;
  for (let i = 0; i < list.length; i++) { x -= ws[i]; if (x <= 0) return list[i]; }
  return list[list.length - 1];
}

// -----------------------------------------------------------------------------
// Spiel
// -----------------------------------------------------------------------------
export interface LightResult {
  hg: number; ag: number;
  decision: 'regular' | 'aet' | 'penalties';
  penalties: { home: number; away: number } | null;
  attendance: number;
  yellow: [number, number];
  red: [number, number];
}

/**
 * Hintergrundspiel inkl. Statistik. `ko`: K.-o.-Regel wie in der Match-Engine
 * (Rückspiel mit Gesamtstand/Auswärtstoren, Verlängerung, Elfmeterschießen).
 */
export function lightMatch(
  g: LightGame, cup: CupState, home: string, away: string, date: string, seedKey: string,
  ko?: (KoRule & { knockout: true }) | null,
): LightResult {
  const year = Number(date.slice(0, 4));
  const r = rng(hashKey(`${cup.seed}:${seedKey}`));
  const hs = teamStrength(g, home), as = teamStrength(g, away);
  const diff = (hs - as) / 100;
  // Heimvorteil im Europapokal früher deutlich größer (Reisen, Plätze).
  const homeAdv = year < 1990 ? 0.42 : year < 2005 ? 0.33 : 0.25;
  const lh = Math.max(0.2, 1.3 + diff * 2.4 + homeAdv);
  const la = Math.max(0.15, 1.0 - diff * 2.4);
  let hg = poisson(lh, r), ag = poisson(la, r);
  let decision: LightResult['decision'] = 'regular';
  let penalties: LightResult['penalties'] = null;
  const level = (h: number, a: number) => {
    if (!ko) return false;
    if (!ko.prev) return h === a;
    if (h + ko.prev[0] !== a + ko.prev[1]) return false;
    return !ko.awayGoals || ko.prev[0] === a;
  };
  if (ko && level(hg, ag) && ko.extraTime !== false) {
    decision = 'aet';
    hg += poisson(lh / 3, r); ag += poisson(la / 3, r);
    if (level(hg, ag) && ko.shootout !== false) {
      decision = 'penalties';
      const ph = 3 + Math.floor(r() * 3);
      let pa = 3 + Math.floor(r() * 3);
      if (ph === pa) pa = r() < 0.5 ? ph + 1 : Math.max(2, ph - 1);
      penalties = { home: ph, away: pa };
    }
  }

  // --- Statistik ---
  const subs = year >= 2020 ? 4 : year >= 1995 ? 3 : 2;
  const H = lineup(rosterOf(g, cup, home, year), subs), A = lineup(rosterOf(g, cup, away, year), subs);
  const stats = (cup.xstats ??= {});
  const tup = (id: string): XTuple => (stats[id] ??= [0, 0, 0, 0, 0, 0, 0]);
  const yRate = year < 1985 ? 1.2 : year < 2000 ? 1.7 : 2.0;
  const yellow: [number, number] = [0, 0], red: [number, number] = [0, 0];
  const side = (team: { xi: Pl[]; bench: Pl[] }, goals: number, conceded: number, s: 0 | 1) => {
    const used = [...team.xi, ...team.bench.filter(() => r() < 0.8)];
    for (const p of used) tup(p.id)[0]++;
    const mean = used.reduce((a, p) => a + p.q, 0) / Math.max(1, used.length);
    for (let k = 0; k < goals; k++) {
      const sc = pick(used, (p) => SCORE_W[POSITION_GROUPS[p.pos]] * (POS_SCORE[p.pos] ?? 1) * Math.exp((p.q - mean) / 7), r);
      if (!sc) continue;
      tup(sc.id)[1]++;
      if (r() < 0.75) {
        const as2 = pick(used, (p) => ASSIST_W[POSITION_GROUPS[p.pos]] * (POS_ASSIST[p.pos] ?? 1) * Math.exp((p.q - mean) / 9), r, sc);
        if (as2) tup(as2.id)[2]++;
      }
    }
    const ny = poisson(yRate, r);
    for (let k = 0; k < ny; k++) {
      const p = pick(team.xi, (x) => (POSITION_GROUPS[x.pos] === 'GK' ? 0.1 : POSITION_GROUPS[x.pos] === 'ATT' ? 0.6 : 1), r);
      if (p) { tup(p.id)[3]++; yellow[s]++; }
    }
    if (r() < (year >= 1991 ? 0.035 : 0.0)) { const p = pick(team.xi, () => 1, r); if (p) { tup(p.id)[4]++; red[s]++; } }
    if (r() < 0.04) { const p = pick(team.xi, () => 1, r); if (p) { tup(p.id)[5]++; red[s]++; } }
    if (conceded === 0) { const gk = team.xi.find((p) => POSITION_GROUPS[p.pos] === 'GK'); if (gk) tup(gk.id)[6]++; }
  };
  side(H, hg, ag, 0);
  side(A, ag, hg, 1);
  const cap = g.clubs[home]?.stadium?.capacity ?? 25000 + Math.round((g.euroClubs?.[home]?.strength ?? 60) * 400);
  const attendance = Math.round(cap * Math.min(1, 0.7 + 0.25 * r() + (hs > 75 ? 0.05 : 0)));
  return { hg, ag, decision, penalties, attendance, yellow, red };
}
