// =============================================================================
// VOLLE KADER AUS WELTSPIELERN (Wunsch Pascal: Kontinuität zwischen Sim und Spielerliga)
// -----------------------------------------------------------------------------
// Vereine ohne vollen Kader laufen mit ihren Weltspielern (game/worldPool.ts). Drei Übergänge
// nutzen dieselben Spieler statt eines neu gewürfelten Kaders – Name, Geburtsjahr, Position,
// Stärke, Potenzial, Gesicht und Rückennummer bleiben:
//  1. Gastverein (`ensureGuestClub`): ein Sim-Verein des eigenen Landes, gegen den der eigene
//     Verein ein Pflichtspiel hat (Start in der DDR: Europapokal gegen einen Bundesligisten),
//     wird bis zum Saisonwechsel als voller Verein angelegt (`Club.guest`). Seine Weltspieler
//     bleiben im Pool (Markierung `world` wie bei einer Verhandlung); `dropGuestClubs` räumt ab.
//     Für alle Abläufe der Spielerliga zählt er nicht (`isLeagueClub` → false).
//  2. Aufstieg/Einzug in die Spielerliga (`adoptWorldSquad`, season.ts Schritt 5a, auch
//     Wiedervereinigung 1991/92): Der erzeugte Kader wird durch die Weltspieler ersetzt.
//  3. Abschied aus der Spielerliga (`squadToWorld`, season.ts Schritt 5b): Der volle Kader
//     wird zu Weltspielern, statt gelöscht und später neu erzeugt zu werden.
// Nicht übertragen werden Karrierestatistik und Einzelattribute (Weltspieler haben nur eine
// Stärkezahl): Attribute entstehen fest aus der ID, die Laufbahn beginnt neu.
// =============================================================================
import { buildEuroClubFull } from '../data/generate';
import { buildAutoTactics } from '../engine/lineupAI';
import type { SimClub } from '../engine/leagues';
import type { Club, Player } from '../types';
import type { Game } from './state';
import { WP_FIELD as W, buildWorldPlayer, isWorldId, numberWorldPool, takeWorldSquad, type WP } from './worldPool';
import { assignShirtNumbers } from './squads';
import { ensureSeating } from '../engine/seating';

type WorldMark = Player & { world?: boolean };
const startYearOf = (g: Game) => Number((g.season ?? '1975').slice(0, 4)) || Number(g.calendar.currentDate.slice(0, 4));
const prosOf = (g: Game, id: string): WP[] => (g.worldPool?.p ?? []).filter((w) => w[W.club] === id && !w[W.youth]);
/** Reicht der Weltkader für ein Spiel (elf Mann, ein Torwart)? */
const playable = (list: WP[]) => list.length >= 14 && list.some((w) => w[W.pos] === 'TW');

/** Lässt sich der Verein als Gastverein anlegen (Sim-Verein des eigenen Landes)? */
export function canGuest(g: Game, id: string): boolean {
  const s = g.simClubs?.[id];
  return !!s && !g.clubs[id] && s.tier < 200;
}

/**
 * Sim-Verein für ein eigenes Pflichtspiel als vollen Verein anlegen – Kader = seine Weltspieler.
 * Ohne Weltkader (z. B. DDR-Liga) ein erzeugter Kader wie bei Auslandsgegnern (Notnagel).
 */
export function ensureGuestClub(g: Game, id: string): boolean {
  if (g.clubs[id]) return true;
  if (!canGuest(g, id)) return false;
  const s = g.simClubs[id];
  const tmp: Record<string, Player> = {};
  const club = buildEuroClubFull({ id, name: s.name, shortName: s.shortName, city: s.city, country: 'Deutschland', strength: s.strength, colors: s.colors, comp: 'ec' },
    g.calendar?.seasonStartDate ?? '', tmp);
  const pros = prosOf(g, id);
  if (playable(pros)) {
    club.playerIds = pros.map((w) => {
      const p = g.players[w[W.id]] ?? buildWorldPlayer(g, w);
      g.players[p.id] = p;
      return p.id;
    });
    club.tactics = buildAutoTactics(club, g.players);
  } else {
    Object.assign(g.players, tmp);
  }
  club.guest = true;
  ensureSeating(club, Number(g.calendar.currentDate.slice(0, 4))); // sonst rüstet erst das Laden die Platzkategorien nach
  g.clubs[id] = club;
  return true;
}

/** Gastvereine wieder entfernen (Saisonwechsel, vor dem Abgleich der Spielerliga). */
export function dropGuestClubs(g: Game): void {
  for (const c of Object.values(g.clubs)) {
    if (!c.guest) continue;
    for (const pid of c.playerIds) if (g.players[pid]?.clubId === c.id) delete g.players[pid];
    delete g.clubs[c.id];
  }
}

/**
 * Frisch aufgebauten Verein der Spielerliga (`buildProClub`) mit seinen Weltspielern besetzen.
 * Kadergröße, Gehaltssumme und Vertragslaufzeiten bleiben wie beim erzeugten Kader (Balance);
 * fehlen Weltspieler, füllen erzeugte Spieler auf. Rückgabe: Zahl der übernommenen Spieler.
 */
export function adoptWorldSquad(g: Game, club: Club, year: number): number {
  const pros = prosOf(g, club.id);
  if (!playable(pros)) return 0;
  const gen = club.playerIds.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall);
  const size = Math.max(gen.length, 16);
  // Auswahl: zwei Torhüter sicher, sonst die Stärksten.
  const sorted = [...pros].sort((a, b) => b[W.ov] - a[W.ov]);
  const gks = sorted.filter((w) => w[W.pos] === 'TW').slice(0, 2);
  const pick = [...gks, ...sorted.filter((w) => !gks.includes(w))].slice(0, size).sort((a, b) => b[W.ov] - a[W.ov]);
  const taken = new Set(pick.map((w) => w[W.id]));
  const wageGen = gen.reduce((a, p) => a + p.contract.weeklyWage, 0);
  const next: Player[] = pick.map((w, i) => {
    const p = (g.players[w[W.id]] ?? buildWorldPlayer(g, w)) as WorldMark;
    delete p.world;
    p.clubId = club.id;
    const twin = gen[Math.min(i, gen.length - 1)]; // Vertragslaufzeit des gleichrangigen erzeugten Spielers
    if (twin) p.contract.expiryDate = twin.contract.expiryDate;
    return p;
  });
  const wageNew = next.reduce((a, p) => a + p.contract.weeklyWage, 0);
  const f = wageNew > 0 && gen.length ? (wageGen / gen.length) / (wageNew / next.length) : 1;
  for (const p of next) p.contract.weeklyWage = Math.max(1, Math.round(p.contract.weeklyWage * f));
  // Auffüllen aus dem erzeugten Kader (schwächste zuerst), alle übrigen erzeugten Spieler entfallen.
  const keep = gen.slice(gen.length - Math.max(0, size - next.length));
  for (const p of gen) if (!keep.includes(p)) delete g.players[p.id];
  for (const p of next) g.players[p.id] = p;
  club.playerIds = [...next, ...keep].map((p) => p.id);
  takeWorldSquad(g, club.id, taken);
  for (const p of next) p.shirtNumber = 0;
  assignShirtNumbers(club, g.players, year);
  club.tactics = buildAutoTactics(club, g.players);
  return next.length;
}

/**
 * Vollen Kader eines Vereins, der die Spielerliga verlässt, als Weltspieler weiterführen
 * (22 Stärkste + bis zu 3 Jüngste als Nachwuchs). Aufruf, bevor die Spieler gelöscht werden.
 */
export function squadToWorld(g: Game, club: Club, sim: SimClub): number {
  const pool = g.worldPool;
  if (!pool || sim.tier >= 100 || club.id.startsWith('res-') || pool.p.some((w) => w[W.club] === club.id)) return 0;
  const year = startYearOf(g);
  const all = club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && p.clubId === club.id && !p.loan);
  const young = all.filter((p) => p.age <= 18).sort((a, b) => a.age - b.age).slice(0, 3);
  const pros = all.filter((p) => !young.includes(p) && p.age <= 35).sort((a, b) => b.overall - a.overall).slice(0, 22);
  const have = new Set(pool.p.map((w) => w[W.id]));
  const add = (p: Player, youth: boolean) => {
    const id = isWorldId(p.id) && !have.has(p.id) ? p.id : `wp${(pool.next++).toString(36)}`;
    const born = Number(p.dateOfBirth.slice(0, 4)) || year - p.age;
    const ov = Math.round(p.overall);
    const pot = Math.max(ov, Math.round(p.development?.basePotential ?? p.overall));
    pool.p.push([id, club.id, p.firstName, p.lastName, p.nationality || 'GER', p.face ?? 'mitteleuropa', born, p.naturalPosition, ov, pot,
      p.preferredFoot === 'left' ? 1 : p.preferredFoot === 'both' ? 2 : 0, p.height, youth ? 1 : 0]);
  };
  for (const p of pros) add(p, false);
  for (const p of young) add(p, true);
  numberWorldPool(pool, year, club.id);
  return pros.length + young.length;
}
