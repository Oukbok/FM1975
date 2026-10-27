// =============================================================================
// Kaderpflege zum Saisonwechsel: Karriereenden, Nachrücker (neue Spieler) für
// KI-Vereine und Kadergrößen. Hält die Liga über Jahrzehnte im Gleichgewicht.
// =============================================================================
import { Player, Position, Club } from '../types';
import { Game } from './state';
import { createPlayer } from '../engine/playerFactory';
import { makeMessage, pushMessage } from '../engine/messages';
import { refreshOverall } from '../engine/development';
import { GEM_CHANCE_YOUNG_PRO, maybeMakeGem } from '../engine/gems';

const TEMPLATE: Position[] = ['TW', 'TW', 'LIB', 'VS', 'VS', 'AV', 'AV', 'DM', 'ZM', 'ZM', 'OM', 'FL', 'FL', 'MS', 'MS', 'HS', 'ZM', 'AV', 'VS', 'FL'];
const MIN_SQUAD = 20;
const MAX_SQUAD = 25;

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

/** @param autoManageMine Auch den eigenen Verein automatisch auffüllen (nur Simulation/Tests). */
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
    if (c && !c.playerIds.includes(p.id) && !p.isYouth) { c.playerIds.push(p.id); fixed++; }
  }
  return fixed;
}

export function manageSquads(game: Game, date: string, autoManageMine = false): void {
  repairSquadLists(game);
  const year = Number(date.slice(0, 4));
  const mine = game.managedClubId;
  const retiredMine: Player[] = [];

  // Liga-Anker: liegt die Liga über/unter dem Ziel, werden Nachrücker etwas schwächer/stärker.
  const leagueClubs = Object.values(game.clubs).filter((c) => !c.id.startsWith('am') && !c.id.startsWith('eu_'));
  const all = leagueClubs.flatMap((c) => c.playerIds.map((id) => game.players[id]).filter(Boolean)) as Player[];
  const avg = all.length ? all.reduce((s, p) => s + p.overall, 0) / all.length : LEAGUE_TARGET;
  const anchor = Math.max(-6, Math.min(6, (LEAGUE_TARGET - avg) * 1.5));

  for (const club of Object.values(game.clubs)) {
    // 1) Karriereenden
    for (const id of [...club.playerIds]) {
      const p = game.players[id];
      if (!p) continue;
      if (Math.random() < retireChance(p)) {
        club.playerIds = club.playerIds.filter((x) => x !== id);
        if (club.id === mine) retiredMine.push(p);
        delete game.players[id];
      }
    }
    if (club.id === mine && !autoManageMine) continue;

    // 2) Zu große Kader verkleinern (schwächste Ältere zuerst)
    while (club.playerIds.length > MAX_SQUAD) {
      const worst = club.playerIds.map((id) => game.players[id]).filter(Boolean)
        .sort((a, b) => (a.overall - a.age * 0.5) - (b.overall - b.age * 0.5))[0];
      if (!worst) break;
      club.playerIds = club.playerIds.filter((x) => x !== worst.id);
      delete game.players[worst.id];
    }

    // 3) Nachrücker für KI-Vereine
    const level = clubLevel(game, club);
    let n = 0;
    while (club.playerIds.length < MIN_SQUAD) {
      const pos = neededPosition(game, club);
      const age = 18 + Math.floor(Math.random() * 6);
      const strength = Math.round(Math.max(40, Math.min(86, level - 8 + (age - 18) * 1.5 + anchor + (Math.random() - 0.5) * 10)));
      const p = createPlayer({
        id: `${club.id}_r${year}_${n++}_${Math.floor(Math.random() * 1e6)}`, clubId: club.id, pos, age, strength,
        year, date, rng: Math.random, shirt: 0,
      });
      refreshOverall(p);
      if (age <= 20) maybeMakeGem(p, GEM_CHANCE_YOUNG_PRO);
      game.players[p.id] = p;
      club.playerIds.push(p.id);
    }
  }

  if (retiredMine.length) {
    pushMessage(game.messages, makeMessage({
      date, category: 'training', from: 'Sportdirektor',
      subject: `${retiredMine.length} Spieler beenden ihre Karriere`,
      shortText: retiredMine.map((p) => p.fullName).join(', '),
      bodyText: 'Zum Saisonwechsel verabschieden sich:\n\n'
        + retiredMine.map((p) => `• ${p.fullName} (${p.naturalPosition}, ${p.age} Jahre, Stärke ${p.overall})`).join('\n')
        + '\n\nDenk an Ersatz: Jugend, Transfermarkt oder Umschulung.',
    }));
  }
}
