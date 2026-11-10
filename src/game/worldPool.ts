// =============================================================================
// WELTSPIELER (Wunsch Pascal: Spielerpool mit allen Spielern der Welt)
// -----------------------------------------------------------------------------
// Vereine ohne vollen Kader (alle Auslandsvereine der Hintergrund-Welt und die
// deutschen Vereine ab der 2. Liga, die nur als Stärkezahl laufen) bekommen einen
// schlanken Kader: 22 Spieler + 3 Jugendliche mit Name, Nation, verdeckter Ethnie,
// Geburtsjahr, Position, Stärke, Potenzial, Fuß, Größe. Gespeichert als Tupel
// (`g.worldPool.p`), damit 25 000+ Spieler nur wenig Platz brauchen.
//
// - Stärke um die Vereinsstärke (Top 14 im Schnitt = Vereinsstärke, wie bei vollen
//   Kadern, engine/euroLight.ts `teamStrength`).
// - Saisonwechsel: Entwicklung (jung ↑, alt ↓), Karriereende ab 35 bzw. bei zu
//   geringer Stärke, Nachrücker aus der Jugend, Wechsel herausragender Spieler zu
//   stärkeren Vereinen, sanftes Nachführen an die Vereinsstärke.
// - Steigt ein Verein in die Liga mit vollen Kadern auf, verschwinden seine
//   Weltspieler (der Verein bekommt dort einen echten Kader); neue Vereine bekommen
//   beim nächsten Abgleich einen Kader.
// - Verhandlung über einen Weltspieler: Er wird zum vollwertigen Spieler
//   (`materializeWorldPlayer`), sein Eintrag bleibt bis zum Wechsel bestehen.
// =============================================================================
import { COUNTRY_ORIGIN } from '../engine/euroLight';
import { isForeignId } from '../engine/world';
import { createPlayer } from '../engine/playerFactory';
import { marketValueFor } from '../engine/clubEconomy';
import { faceFor, makeName, ORIGINS, pickOrigin, type Origin } from '../data/origins';
import { COUNTRY_BY_KEY } from '../data/world/countries';
import type { Player, Position } from '../types';
import type { Game } from './state';

/** [id, Verein, Vorname, Nachname, Nation, Ethnie, Geburtsjahr, Position, Stärke, Potenzial, Fuß 0 r/1 l/2 b, Größe, Jugend 0/1] */
export type WP = [string, string, string, string, string, string, number, Position, number, number, number, number, number];

export interface WorldPool {
  v: 1;
  /** Saison (Startjahr) des letzten Abgleichs. */
  year: number;
  next: number;
  p: WP[];
}

const W = { id: 0, club: 1, first: 2, last: 3, nat: 4, face: 5, born: 6, pos: 7, ov: 8, pot: 9, foot: 10, height: 11, youth: 12 } as const;
export { W as WP_FIELD };

const SLOTS: Position[] = ['TW', 'TW', 'TW', 'IV', 'IV', 'IV', 'IV', 'RV', 'RV', 'LV', 'LV', 'DM', 'DM', 'ZM', 'ZM', 'OM', 'OM', 'RA', 'LA', 'MS', 'MS', 'MS'];
const YOUTH_SLOTS: Position[] = ['IV', 'ZM', 'MS'];
/** Abweichung von der Vereinsstärke: 14 Stammkräfte (Schnitt 0), 8 Ergänzungsspieler. */
const CORE = [6, 5, 4, 3, 2, 1, 0, 0, -1, -2, -3, -4, -5, -6];
const EAST = new Set(['Sowjetunion', 'Polen', 'Ungarn', 'Tschechoslowakei', 'Rumaenien', 'Bulgarien', 'Albanien', 'Jugoslawien']);
const FOREIGN: [string, number][] = [
  ['bra', 6], ['arg', 4], ['fra', 3], ['fra_af', 3], ['ned', 3], ['por', 2], ['esp', 2], ['ita', 1.5], ['eng', 1.5], ['ger_modern', 2],
  ['nga', 3], ['gha', 2.5], ['cmr', 2], ['mar', 2], ['srb', 2], ['cro', 2], ['den', 1.5], ['swe', 1.5], ['nor', 1], ['bel', 1.5],
  ['pol', 1.5], ['cze', 1.5], ['tur', 1], ['jpn', 1], ['kor', 1], ['usa', 1], ['sui', 1], ['aut', 1],
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export interface WorldClubInfo {
  id: string; name: string; shortName: string; city: string;
  /** Land (Schlüssel der Hintergrund-Welt, z. B. 'England'), 'Deutschland' für deutsche Vereine. */
  country: string;
  /** Liga-Ebene im Land (1 = höchste). */
  level: number;
  strength: number;
  colors: { primary: string; secondary: string };
}

/** Vereine, deren Spieler als Weltspieler laufen (ohne vollen Kader). */
export function worldClubs(g: Game): Map<string, WorldClubInfo> {
  const out = new Map<string, WorldClubInfo>();
  // Volle Kader zählen nur für deutsche (bzw. Heimat-)Vereine; alte Europapokal-Kader von 1975 (`w_*`) ersetzt der Weltpool.
  const real = (id: string) => (g.clubs[id]?.playerIds.length ?? 0) >= 11 && (!isForeignId(id) || id === g.managedClubId);
  for (const s of Object.values(g.simClubs ?? {})) {
    if (real(s.id) || s.tier >= 200 || s.tier >= 100) continue; // Länder Spiel für Spiel = Auslandsvereine (unten), DDR-Ligen haben volle Kader
    out.set(s.id, { id: s.id, name: s.name, shortName: s.shortName, city: s.city, country: 'Deutschland', level: s.tier, strength: s.strength, colors: s.colors });
  }
  const countries = g.world?.countries ?? {};
  for (const [key, c] of Object.entries(countries)) {
    if (c.active === false) continue;
    c.tiers.forEach((ids, t) => {
      for (const id of ids) {
        const e = g.euroClubs?.[id];
        if (!e || real(id) || out.has(id)) continue;
        out.set(id, { id, name: e.name, shortName: e.shortName, city: e.city, country: key, level: t + 1, strength: e.strength, colors: e.colors });
      }
    });
  }
  return out;
}

/** Anzeigename eines Landes der Hintergrund-Welt. */
export function countryName(key: string): string {
  return key === 'Deutschland' ? 'Deutschland' : COUNTRY_BY_KEY[key]?.name ?? key;
}

function originFor(club: WorldClubInfo, year: number, r: () => number): Origin {
  if (club.country === 'Deutschland') return pickOrigin(year, r, false);
  const home = ORIGINS[COUNTRY_ORIGIN[club.country] ?? COUNTRY_BY_KEY[club.country]?.origin ?? 'eng'] ?? ORIGINS.eng;
  if (EAST.has(club.country) && year < 1990) return home;
  // Ausländeranteil: 1975 kaum, heute in starken Ligen fast die Hälfte.
  const t = clamp((year - 1975) / 50, 0, 1);
  const share = (0.03 + 0.42 * t * t) * (club.level === 1 ? 1 : 0.5) * (club.strength >= 75 ? 1.15 : 1);
  if (r() >= share) return home;
  const list = FOREIGN.filter(([id]) => ORIGINS[id] && ORIGINS[id].nationality !== home.nationality);
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [id, w] of list) { x -= w; if (x <= 0) return ORIGINS[id]; }
  return home;
}

function headroom(age: number, r: () => number): number {
  if (age <= 18) return 6 + r() * 16 + (r() < 0.04 ? 10 : 0);
  if (age <= 21) return 3 + r() * 13 + (r() < 0.03 ? 8 : 0);
  if (age <= 24) return 1 + r() * 7;
  if (age <= 27) return r() * 3;
  return 0;
}

function makeWP(g: Game, pool: WorldPool, club: WorldClubInfo, pos: Position, ov: number, age: number, year: number, youth: boolean, r: () => number): WP {
  const o = originFor(club, year, r);
  const born = year - age;
  const { firstName, lastName } = makeName(o, r, born);
  const id = `wp${(pool.next++).toString(36)}`;
  const s = Math.round(clamp(ov, 25, 95));
  const pot = Math.round(clamp(s + headroom(age, r), s, 97));
  const foot = r() < 0.72 ? 0 : r() < 0.85 ? 1 : 2;
  const height = pos === 'TW' ? 182 + Math.floor(r() * 14) : 168 + Math.floor(r() * 24);
  return [id, club.id, firstName, lastName, o.nationality, faceFor(o, born, id), born, pos, s, pot, foot, height, youth ? 1 : 0];
}

function squadFor(g: Game, pool: WorldPool, club: WorldClubInfo, year: number): WP[] {
  const r = rng(hash(`${club.id}|${year}|${pool.next}`));
  const S = club.strength;
  const out: WP[] = [];
  const order = [...SLOTS].sort(() => r() - 0.5);
  order.forEach((pos, i) => {
    const core = i < CORE.length;
    const ov = S + (core ? CORE[i] : -7 - (i - CORE.length) * 0.7) + (r() - 0.5) * 4 - (pos === 'TW' && i > 2 ? 4 : 0);
    const age = core ? 20 + Math.floor(r() * 13) : 18 + Math.floor(r() * 16);
    out.push(makeWP(g, pool, club, pos, ov, age, year, false, r));
  });
  for (const pos of YOUTH_SLOTS) out.push(makeWP(g, pool, club, pos, S - 18 - r() * 8, 16 + Math.floor(r() * 3), year, true, r));
  return out;
}

const startYearOf = (g: Game) => Number((g.season ?? '1975').slice(0, 4)) || Number(g.calendar.currentDate.slice(0, 4));

/** Pool anlegen bzw. mit den aktuellen Vereinen abgleichen (fehlende Kader erzeugen, veraltete entfernen). */
export function ensureWorldPool(g: Game): WorldPool {
  const year = startYearOf(g);
  let pool = g.worldPool;
  if (!pool || pool.v !== 1) pool = g.worldPool = { v: 1, year, next: 1, p: [] };
  const clubs = worldClubs(g);
  const have = new Set<string>();
  pool.p = pool.p.filter((w) => { if (!clubs.has(w[W.club])) return false; have.add(w[W.club]); return true; });
  for (const c of clubs.values()) if (!have.has(c.id)) pool.p.push(...squadFor(g, pool, c, year));
  return pool;
}

/** Saisonwechsel: Entwicklung, Karriereende, Nachrücker, Wechsel, Nachführen an die Vereinsstärke. */
export function worldPoolSeason(g: Game): void {
  const pool = g.worldPool;
  if (!pool) return;
  const year = startYearOf(g);
  if (pool.year >= year) { ensureWorldPool(g); return; }
  const steps = Math.min(3, year - pool.year);
  pool.year = year;
  const clubs = worldClubs(g);
  const r = rng(hash(`world|${year}`));
  for (let s = 0; s < steps; s++) {
    for (const w of pool.p) {
      const age = year - w[W.born];
      const gap = w[W.pot] - w[W.ov];
      let d: number;
      if (age <= 23) d = gap * (0.25 + r() * 0.3) + (r() - 0.4) * 2;
      else if (age <= 28) d = gap * 0.5 + (r() - 0.5) * 2;
      else if (age <= 31) d = -r() * 1.5;
      else d = -1 - r() * 3;
      w[W.ov] = Math.round(clamp(w[W.ov] + d, 25, 97));
      if (w[W.ov] > w[W.pot]) w[W.pot] = w[W.ov];
      if (w[W.youth] && age >= 19) w[W.youth] = 0;
    }
  }
  // Karriereende und Nachrücker (gleiche Position, aus der eigenen Jugend)
  const byClub = new Map<string, WP[]>();
  for (const w of pool.p) { const l = byClub.get(w[W.club]); if (l) l.push(w); else byClub.set(w[W.club], [w]); }
  const keep: WP[] = [];
  for (const [cid, list] of byClub) {
    const club = clubs.get(cid);
    if (!club) continue;
    for (const w of list) {
      const age = year - w[W.born];
      const retire = age >= 36 || (age >= 33 && (w[W.ov] < club.strength - 14 || r() < 0.35)) || (age >= 30 && w[W.ov] < club.strength - 20);
      if (!retire) { keep.push(w); continue; }
      keep.push(makeWP(g, pool, club, w[W.pos], club.strength - 18 - r() * 8, 16 + Math.floor(r() * 2), year, true, r));
    }
  }
  pool.p = keep;
  // Herausragende Spieler wechseln zu stärkeren Vereinen (eigenes Land bevorzugt, sonst Topliga).
  const list = [...clubs.values()].sort((a, b) => b.strength - a.strength);
  for (const w of pool.p) {
    const club = clubs.get(w[W.club]);
    const age = year - w[W.born];
    if (!club || age < 19 || age > 30 || w[W.ov] < club.strength + 9 || r() > 0.6) continue;
    const want = w[W.ov] - 4;
    const cands = list.filter((c) => c.id !== club.id && c.strength >= want && c.strength <= want + 10);
    const home = cands.filter((c) => c.country === club.country);
    const from = home.length && r() < 0.6 ? home : cands;
    const pick = from[Math.floor(r() * from.length)];
    if (pick) { w[W.club] = pick.id; w[W.youth] = 0; }
  }
  // Nachführen an die Vereinsstärke (Median-Abstand der Stammkräfte, höchstens ±3 je Saison)
  byClub.clear();
  for (const w of pool.p) { const l = byClub.get(w[W.club]); if (l) l.push(w); else byClub.set(w[W.club], [w]); }
  for (const [cid, l] of byClub) {
    const club = clubs.get(cid);
    if (!club) continue;
    const core = l.filter((w) => !w[W.youth]).map((w) => w[W.ov]).sort((a, b) => b - a).slice(0, 14);
    if (!core.length) continue;
    const avg = core.reduce((a, b) => a + b, 0) / core.length;
    const shift = Math.round(clamp((club.strength - avg) * 0.6, -3, 3));
    if (shift) for (const w of l) { w[W.ov] = Math.round(clamp(w[W.ov] + shift, 25, 97)); if (w[W.pot] < w[W.ov]) w[W.pot] = w[W.ov]; }
    // Kadergröße halten: zu viele → schwächste Ergänzungsspieler gehen (Karriereende/unterklassig), zu wenige → auffüllen
    const prosList = l.filter((w) => !w[W.youth]).sort((a, b) => b[W.ov] - a[W.ov]);
    if (prosList.length > 24) {
      const gone = new Set(prosList.slice(24).map((w) => w[W.id]));
      pool.p = pool.p.filter((w) => !gone.has(w[W.id]));
    }
    const pros = Math.min(24, prosList.length);
    for (let i = pros; i < 20; i++) pool.p.push(makeWP(g, pool, club, SLOTS[Math.floor(r() * SLOTS.length)], club.strength - 4 - r() * 8, 19 + Math.floor(r() * 10), year, false, r));
  }
  ensureWorldPool(g);
}

/** Eintrag nach ID (linear; nur für Einzelzugriffe). */
export function worldEntry(g: Game, id: string): WP | undefined {
  return g.worldPool?.p.find((w) => w[W.id] === id);
}

export const isWorldId = (id: string) => id.startsWith('wp');

/** Marktwert eines Weltspielers (1975-Basis, wie Player.contract.transferValue). */
export function worldValue(w: WP, year: number): number {
  const age = year - w[W.born];
  return marketValueFor({ age, overall: w[W.ov], development: { basePotential: w[W.pot] } } as unknown as Player, year);
}

/**
 * Weltspieler als vollwertigen Spieler anlegen (Verhandlung): liegt danach in
 * `g.players` mit seinem Auslands- bzw. Amateurverein als `clubId`, aber in keinem
 * Kader. Platzt die Verhandlung, entfernt `dropWorldPlayer` ihn wieder.
 */
export function materializeWorldPlayer(g: Game, id: string): Player | null {
  if (g.players[id]) return g.players[id];
  const w = worldEntry(g, id);
  if (!w) return null;
  const p = buildWorldPlayer(g, w);
  g.players[id] = p;
  return p;
}

/** Vollwertiges Spielerobjekt aus einem Weltspieler-Tupel, ohne es zu speichern. */
function buildWorldPlayer(g: Game, w: WP): Player {
  const id = w[W.id];
  const date = g.calendar.currentDate;
  const year = Number(date.slice(0, 4));
  const o = Object.values(ORIGINS).find((x) => x.nationality === w[W.nat]) ?? ORIGINS.eng;
  const age = startYearOf(g) - w[W.born];
  const p = createPlayer({ id, clubId: w[W.club], pos: w[W.pos], age, strength: w[W.ov], year, date, rng: rng(hash(id)), origin: o });
  p.firstName = w[W.first]; p.lastName = w[W.last]; p.fullName = `${w[W.first]} ${w[W.last]}`;
  p.nationality = w[W.nat]; p.face = w[W.face]; p.origin = o.id;
  p.dateOfBirth = `${w[W.born]}-${String(1 + (hash(id) % 12)).padStart(2, '0')}-${String(1 + (hash(id + 'd') % 28)).padStart(2, '0')}`;
  p.preferredFoot = w[W.foot] === 1 ? 'left' : w[W.foot] === 2 ? 'both' : 'right';
  p.height = w[W.height];
  p.development.basePotential = w[W.pot];
  p.development.potentialAbility = w[W.pot];
  p.contract.transferValue = worldValue(w, year);
  p.contract.expiryDate = `${year + 2}-06-30`;
  p.contract.satisfaction = 70;
  (p as Player & { world?: boolean }).world = true;
  return p;
}

// Ansicht für das Vereinsprofil (Wunsch Pascal: jeder Verein mit Kader): Weltspieler als
// Spielerobjekte, nur gelesen – gespeichert wird erst bei einer Verhandlung (materialize).
const previewCache = new WeakMap<Game, { key: string; map: Map<string, Player> }>();
export function worldSquadPreview(g: Game, clubId: string, youth = false): Player[] {
  const pool = g.worldPool;
  if (!pool) return [];
  const key = `${pool.year}|${pool.p.length}|${g.calendar.currentDate.slice(0, 7)}`;
  let c = previewCache.get(g);
  if (!c || c.key !== key) { c = { key, map: new Map() }; previewCache.set(g, c); }
  const out: Player[] = [];
  for (const w of pool.p) {
    if (w[W.club] !== clubId || (!!w[W.youth]) !== youth) continue;
    const id = w[W.id];
    let p = g.players[id] ?? c.map.get(id);
    if (!p) { p = buildWorldPlayer(g, w); c.map.set(id, p); }
    out.push(p);
  }
  return out.sort((a, b) => b.overall - a.overall);
}

const clubCache = new WeakMap<Game, { key: string; map: Map<string, WorldClubInfo> }>();
/** worldClubs mit Zwischenspeicher je Tag (für Profil-Prüfungen bei jedem Klick). */
export function worldClubInfo(g: Game, id: string): WorldClubInfo | undefined {
  const key = `${g.calendar.currentDate}|${Object.keys(g.euroClubs ?? {}).length}|${Object.keys(g.simClubs).length}`;
  let c = clubCache.get(g);
  if (!c || c.key !== key) { c = { key, map: worldClubs(g) }; clubCache.set(g, c); }
  return c.map.get(id);
}

/** Vollwertigen Weltspieler wieder entfernen (Verhandlung beendet, kein Wechsel). */
export function dropWorldPlayer(g: Game, id: string): void {
  const p = g.players[id] as (Player & { world?: boolean }) | undefined;
  if (p?.world && p.clubId !== g.managedClubId && !g.clubs[p.clubId]?.playerIds.includes(id)) delete g.players[id];
}

/** Wechsel vollzogen: Eintrag aus dem Weltpool nehmen. */
export function removeWorldEntry(g: Game, id: string): void {
  if (g.worldPool) g.worldPool.p = g.worldPool.p.filter((w) => w[W.id] !== id);
  const p = g.players[id] as (Player & { world?: boolean }) | undefined;
  if (p) delete p.world;
}

/** Spieler, der ins Ausland verkauft wird, bleibt als Weltspieler erhalten (Rückkauf möglich). */
export function addSoldAbroad(g: Game, p: Player, clubId: string): void {
  const pool = g.worldPool;
  if (!pool || !worldClubs(g).has(clubId)) return;
  const born = Number(p.dateOfBirth.slice(0, 4)) || startYearOf(g) - p.age;
  const pot = Math.max(p.overall, p.development?.basePotential ?? p.overall);
  pool.p.push([`wp${(pool.next++).toString(36)}`, clubId, p.firstName, p.lastName, p.nationality || 'GER', p.face ?? 'mitteleuropa', born,
    p.naturalPosition, p.overall, pot, p.preferredFoot === 'left' ? 1 : p.preferredFoot === 'both' ? 2 : 0, p.height, 0]);
}
