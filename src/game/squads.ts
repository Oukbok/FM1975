// =============================================================================
// Kaderpflege zum Saisonwechsel: Karriereenden, Nachrücker (neue Spieler) für
// KI-Vereine und Kadergrößen. Hält die Liga über Jahrzehnte im Gleichgewicht.
// =============================================================================
import { Player, Position, Club } from '../types';
import { Game } from './state';
import { archiveRetired } from './archive';
import { staffFromRetired } from './staffWorld';
import { createPlayer } from '../engine/playerFactory';
import { isLeagueClub, marketWage } from '../engine/clubEconomy';
import { clubWageLevel } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import { refreshOverall } from '../engine/development';
import { GEM_CHANCE_YOUNG_PRO, maybeMakeGem } from '../engine/gems';

const TEMPLATE: Position[] = ['TW', 'TW', 'LIB', 'IV', 'IV', 'RV', 'LV', 'DM', 'ZM', 'ZM', 'OM', 'RA', 'LA', 'MS', 'MS', 'HS', 'ZM', 'LV', 'IV', 'RM'];
export const MIN_SQUAD = 20;
export const MAX_SQUAD = 25;
/** Notgrenze zum Saisonwechsel für Ligavereine mit Manager-KI (Rest über Transfers/Jugend). */
const AI_SEASON_MIN = 17;

/** Ziel-Durchschnittsstärke der 1. Liga (Anker gegen Inflation/Deflation). */
const LEAGUE_TARGET = 72;

function retireChance(p: Player): number {
  if (p.age >= 36) return 1;
  if (p.age >= 35) return 0.75;
  if (p.age >= 33) return p.overall < 70 ? 0.6 : 0.3;
  if (p.age >= 31) return p.overall < 60 ? 0.35 : 0.05;
  return 0;
}

function clubLevel(game: Game, club: Club): number {
  const ovr = club.playerIds.map((id) => game.players[id]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
  return ovr.length ? ovr.reduce((a, b) => a + b, 0) / ovr.length : 65;
}

/** Fehlende Position nach Vorlage ermitteln. */
function neededPosition(game: Game, club: Club): Position {
  const have: Record<string, number> = {};
  for (const id of club.playerIds) { const p = game.players[id]; if (p) have[p.naturalPosition] = (have[p.naturalPosition] ?? 0) + 1; }
  const want: Record<string, number> = {};
  for (const pos of TEMPLATE) want[pos] = (want[pos] ?? 0) + 1;
  let best: Position = 'ZM', gap = -99;
  for (const pos of Object.keys(want) as Position[]) {
    const g = (want[pos] ?? 0) - (have[pos] ?? 0);
    if (g > gap) { gap = g; best = pos; }
  }
  return best;
}

/**
 * Rückennummern: Spieler ohne Nummer (0) oder mit doppelter Nummer bekommen die kleinste freie
 * Nummer ihres Kaders (1–99). Wer zuerst im Kader steht, behält seine Nummer. Idempotent.
 */
/** Rückennummer vergeben (Wunsch Pascal); trägt sie schon ein anderer, tauschen beide. */
export function setShirtNumber(club: Club, players: Record<string, Player>, pid: string, n: number): void {
  const p = players[pid];
  if (!p || n < 1 || n > 99 || !club.playerIds.includes(pid)) return;
  const other = club.playerIds.map((id) => players[id]).find((x) => x && x.id !== pid && x.shirtNumber === n);
  if (other) other.shirtNumber = p.shirtNumber;
  p.shirtNumber = n;
}

export function assignShirtNumbers(club: Club, players: Record<string, Player>): number {
  const used = new Set<number>();
  const need: Player[] = [];
  for (const id of club.playerIds) {
    const p = players[id];
    if (!p) continue;
    const n = p.shirtNumber;
    if (!n || n < 1 || n > 99 || used.has(n)) need.push(p); else used.add(n);
  }
  let next = 1;
  for (const p of need) {
    while (used.has(next) && next < 99) next++;
    p.shirtNumber = next; used.add(next);
  }
  return need.length;
}

/** Konsistenz: Kaderlisten ohne Geister-IDs/Dubletten, jeder Spieler genau einem Verein zugeordnet. */
export function repairSquadLists(game: Game): number {
  let fixed = 0;
  for (const club of Object.values(game.clubs)) {
    const seen = new Set<string>();
    const ok = club.playerIds.filter((id) => {
      const p = game.players[id];
      if (!p || p.clubId !== club.id || seen.has(id)) return false;
      seen.add(id); return true;
    });
    fixed += club.playerIds.length - ok.length;
    club.playerIds = ok;
  }
  for (const p of Object.values(game.players)) {
    const c = game.clubs[p.clubId];
    if (c && !c.playerIds.includes(p.id) && !p.isYouth && !(p as Player & { world?: boolean }).world) { c.playerIds.push(p.id); fixed++; }
  }
  for (const club of Object.values(game.clubs)) assignShirtNumbers(club, game.players);
  return fixed;
}

/** Liga-Anker: liegt die Liga über/unter dem Ziel, werden Nachrücker etwas schwächer/stärker. */
export function leagueAnchor(game: Game): number {
  const leagueClubs = Object.values(game.clubs).filter((c) => !c.id.startsWith('am') && !c.id.startsWith('eu_'));
  const all = leagueClubs.flatMap((c) => c.playerIds.map((id) => game.players[id]).filter(Boolean)) as Player[];
  const avg = all.length ? all.reduce((s, p) => s + p.overall, 0) / all.length : LEAGUE_TARGET;
  return Math.max(-6, Math.min(6, (LEAGUE_TARGET - avg) * 1.5));
}

/**
 * Notnagel: Kader mit generierten Nachrückern bis `min` auffüllen.
 * @returns Anzahl erzeugter Spieler.
 */
export function fillSquad(game: Game, club: Club, date: string, min = MIN_SQUAD, anchor = leagueAnchor(game)): number {
  const year = Number(date.slice(0, 4));
  const level = clubLevel(game, club);
  let n = 0;
  while (club.playerIds.length < min) {
    const pos = neededPosition(game, club);
    const age = 18 + Math.floor(Math.random() * 6);
    // Nachrücker sind nie fertige Weltklasse (höchstens 82).
    const strength = Math.round(Math.max(40, Math.min(82, level - 8 + (age - 18) * 1.5 + anchor + (Math.random() - 0.5) * 10)));
    const p = createPlayer({
      id: `${club.id}_r${year}_${n++}_${Math.floor(Math.random() * 1e6)}`, clubId: club.id, pos, age, strength,
      year, date, rng: Math.random, shirt: 0,
    });
    refreshOverall(p);
    // Gehalt im Gefüge des Vereins (Nachrücker kosten, was der Kader im Schnitt verdient).
    p.contract.weeklyWage = Math.max(Math.max(5, Math.round(80 * clubWageLevel(club, year))), Math.round(marketWage(p) * wageRatioOf(game, club)));
    if (age <= 20) maybeMakeGem(p, GEM_CHANCE_YOUNG_PRO);
    game.players[p.id] = p;
    club.playerIds.push(p.id);
  }
  if (n) assignShirtNumbers(club, game.players);
  return n;
}

/** Torhüter im Kader des verwalteten Vereins. */
function keepersLeft(game: Game): number {
  const c = game.clubs[game.managedClubId];
  return c ? c.playerIds.filter((id) => game.players[id]?.naturalPosition === 'TW').length : 0;
}

export function manageSquads(game: Game, date: string, autoManageMine = false): void {
  repairSquadLists(game);
  const year = Number(date.slice(0, 4));
  const mine = game.managedClubId;
  const retiredMine: Player[] = [];

  const anchor = leagueAnchor(game);

  for (const club of Object.values(game.clubs)) {
    // 1) Karriereenden
    for (const id of [...club.playerIds]) {
      const p = game.players[id];
      if (!p) continue;
      if (Math.random() < retireChance(p)) {
        club.playerIds = club.playerIds.filter((x) => x !== id);
        if (club.id === mine) retiredMine.push(p);
        archiveRetired(game, p, date);
        staffFromRetired(game, p, date);
        delete game.players[id];
      }
    }
    if (club.id === mine && !autoManageMine) continue;

    // 2) Zu große Kader verkleinern (schwächste Ältere zuerst)
    while (club.playerIds.length > MAX_SQUAD) {
      const worst = club.playerIds.map((id) => game.players[id]).filter((p) => p
          && !(p.naturalPosition === 'TW' && club.playerIds.filter((x) => game.players[x]?.naturalPosition === 'TW').length <= 2))
        .sort((a, b) => (a.overall - a.age * 0.5) - (b.overall - b.age * 0.5))[0];
      if (!worst) break;
      club.playerIds = club.playerIds.filter((x) => x !== worst.id);
      delete game.players[worst.id];
    }

    // 3) Nachrücker für KI-Vereine. Mit Manager-KI nur bis zur Notgrenze – den Rest
    //    regeln Transfers und Jugend im Sommer (game/aiClubs.ts), aufgefüllt wird
    //    erst wieder zum Ende des Transferfensters.
    fillSquad(game, club, date, isLeagueClub(club) ? AI_SEASON_MIN : MIN_SQUAD, anchor);
  }

  if (retiredMine.length) {
    pushMessage(game.messages, makeMessage({
      date, category: 'training', from: 'Sportdirektor',
      subject: `${retiredMine.length} Spieler beenden ihre Karriere`,
      shortText: retiredMine.map((p) => p.fullName).join(', '),
      bodyText: 'Zum Saisonwechsel verabschieden sich:\n\n'
        + retiredMine.map((p) => `• ${p.fullName} (${p.naturalPosition}, ${p.age} Jahre, Stärke ${p.overall})`).join('\n')
        + '\n\nDenk an Ersatz: Jugend, Transfermarkt oder Umschulung.'
        + (keepersLeft(game) < 2 ? `\n\nAchtung: Im Kader ${keepersLeft(game) === 0 ? 'steht kein Torwart mehr' : 'steht nur noch ein Torwart'}. Hol rechtzeitig Ersatz.` : ''),
    }));
  }
}

/** Durchschnittliches Verhältnis Gehalt : Marktgehalt im Kader (0,2 … 1,5). */
export function wageRatioOf(game: Game, club: Club): number {
  const mates = club.playerIds.map((id) => game.players[id]).filter(Boolean);
  if (!mates.length) return 1;
  const r = mates.reduce((a, m) => a + m.contract.weeklyWage / Math.max(1, marketWage(m)), 0) / mates.length;
  return Math.max(0.01, Math.min(1.5, r));
}
