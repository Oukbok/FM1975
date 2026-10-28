// =============================================================================
// JUGENDMANNSCHAFTEN DES EIGENEN VEREINS (volle Kader G- bis A-Jugend)
// -----------------------------------------------------------------------------
// Jede Altersklasse hat eine volle Mannschaft wie im deutschen Jugendfußball:
//   G 10 · F 12 · E 14 · D 16 · C 20 · B 20 · A 22 Spieler.
// Die Akademie-Talente (academyIntake, je nach Ausbaustufe 1–4 pro Jahr) sind
// der Kern; aufgefüllt wird mit Breitensportlern, die meist wenig Potenzial
// haben. Zum 1. Juli rücken alle auf; einige hören auf oder wechseln (eher die
// Schwächeren), zu große Mannschaften werden ausgedünnt, Lücken mit neuen
// Spielern gefüllt. Nur wer genug Potenzial hat, wird am Ende Profi.
// KI-Vereine behalten ihre schlanken Akademien (Spielstandgröße).
// =============================================================================
import { scoutRange } from '../engine/scouting';
import { generateYouthPlayer } from '../engine/youth';
import { makeMessage, pushMessage } from '../engine/messages';
import { Club, Player, Position, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_ORDER, YouthAgeClass, youthAgeClass } from '../types';
import { Game } from './state';

export const YOUTH_TEAM_SIZE: Record<YouthAgeClass, number> = { G: 10, F: 12, E: 14, D: 16, C: 20, B: 20, A: 22 };
export const CLASS_AGES: Record<YouthAgeClass, number[]> = { G: [7], F: [8, 9], E: [10, 11], D: [12, 13], C: [14, 15], B: [16, 17], A: [18, 19] };

const GROUP: Record<string, 'TW' | 'DEF' | 'MID' | 'ATT'> = {
  TW: 'TW', LIB: 'DEF', VS: 'DEF', AV: 'DEF', DM: 'MID', ZM: 'MID', OM: 'MID', FL: 'ATT', MS: 'ATT', HS: 'ATT',
};

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

function squadByClass(g: Game, club: Club): Record<YouthAgeClass, Player[]> {
  const out: Record<YouthAgeClass, Player[]> = { G: [], F: [], E: [], D: [], C: [], B: [], A: [] };
  for (const id of club.youthPlayerIds) {
    const p = g.youthPlayers[id];
    const c = p ? youthAgeClass(p.age) : null;
    if (p && c) out[c].push(p);
  }
  return out;
}

/** Welche Position fehlt der Mannschaft am meisten? */
function neededPosition(team: Player[], size: number, year: number, r: number): Position {
  const tw = team.filter((p) => p.naturalPosition === 'TW').length;
  if (tw < (size <= 10 ? 1 : 2)) return 'TW';
  const count = (grp: string) => team.filter((p) => GROUP[p.naturalPosition] === grp).length;
  const field = size - (size <= 10 ? 1 : 2);
  const gaps: [string, number][] = [['DEF', field * 0.36 - count('DEF')], ['MID', field * 0.36 - count('MID')], ['ATT', field * 0.28 - count('ATT')]];
  gaps.sort((a, b) => b[1] - a[1]);
  const pools: Record<string, Position[]> = {
    DEF: year < 1995 ? ['LIB', 'VS', 'VS', 'AV', 'AV'] : ['VS', 'VS', 'AV', 'AV'],
    MID: ['DM', 'ZM', 'ZM', 'OM'],
    ATT: ['FL', 'FL', 'MS', 'HS'],
  };
  const pool = pools[gaps[0][0]];
  return pool[Math.floor(r * pool.length)];
}

/** Bewertung für Aussortieren/Aufhören: Stärke im Jahrgang plus erkennbares Potenzial. */
function keepScore(p: Player): number {
  const [lo, hi] = scoutRange(p);
  return p.overall + ((lo + hi) / 2) * 6 + (p.development.legendId ? 1000 : 0) + (p.development.protectedUntil ? 50 : 0);
}

function addPlayer(g: Game, club: Club, p: Player): void {
  g.youthPlayers[p.id] = p;
  club.youthPlayerIds.push(p.id);
}

/** Füllt alle Mannschaften des eigenen Vereins auf Sollstärke auf. */
export function fillYouthTeams(g: Game, date: string): number {
  const club = g.clubs[g.managedClubId];
  if (!club) return 0;
  const year = Number(date.slice(0, 4));
  const by = squadByClass(g, club);
  let added = 0;
  for (const cls of YOUTH_AGE_CLASS_ORDER) {
    const team = by[cls];
    const size = YOUTH_TEAM_SIZE[cls];
    let i = 0;
    while (team.length < size && i < 40) {
      const seed = `breite_${date}_${cls}_${i++}`;
      const ages = CLASS_AGES[cls];
      const age = ages.reduce((best, a) => (team.filter((p) => p.age === a).length < team.filter((p) => p.age === best).length ? a : best), ages[0]);
      const pos = neededPosition(team, size, year, hash01(seed));
      const p = generateYouthPlayer(club.id, seed, date, Math.max(1, club.infrastructure.youthAcademy), age, { pool: 'breite', positions: [pos] });
      addPlayer(g, club, p);
      team.push(p);
      added++;
    }
  }
  return added;
}

const QUIT_REASONS = [
  'hört mit dem Fußball auf', 'wechselt zum Nachbarverein', 'konzentriert sich auf die Schule', 'beginnt eine Ausbildung',
  'zieht mit den Eltern weg', 'wechselt zu einer anderen Sportart', 'hat die Lust verloren',
];

/**
 * Jährlicher Wechsel (1. Juli, nach dem Aufrücken und vor dem Auffüllen):
 * Abgänge und Aussortieren. Liefert Text für die Nachricht.
 */
export function youthTeamsSeasonChange(g: Game, date: string): string[] {
  const club = g.clubs[g.managedClubId];
  if (!club) return [];
  const year = Number(date.slice(0, 4));
  const by = squadByClass(g, club);
  const lines: string[] = [];
  const remove = (p: Player, why: string) => {
    club.youthPlayerIds = club.youthPlayerIds.filter((id) => id !== p.id);
    delete g.youthPlayers[p.id];
    lines.push(`${p.fullName} (${p.naturalPosition}, ${p.age} J.) ${why}`);
  };
  for (const cls of YOUTH_AGE_CLASS_ORDER) {
    const team = [...by[cls]].sort((a, b) => keepScore(b) - keepScore(a));
    const third = Math.ceil(team.length * 2 / 3);
    // Abgänge: eher Ältere und Schwächere; klare Talente bleiben fast immer.
    team.forEach((p, idx) => {
      if (p.development.legendId || (p.development.protectedUntil ?? 0) >= year) return;
      const base = p.age <= 11 ? 0.04 : p.age <= 15 ? 0.08 : 0.12;
      const weak = idx >= third ? 1.8 : 1;
      const talent = scoutRange(p)[1] >= 3.5 ? 0.3 : 1;
      const r = hash01(`${p.id}|quit|${year}`);
      if (r < base * weak * talent) remove(p, QUIT_REASONS[Math.floor(hash01(p.id + year) * QUIT_REASONS.length)] + '.');
    });
    // Zu große Mannschaft: die Schwächsten werden aussortiert.
    const left = team.filter((p) => g.youthPlayers[p.id]);
    const over = left.length - YOUTH_TEAM_SIZE[cls];
    if (over > 0) {
      left.sort((a, b) => keepScore(a) - keepScore(b)).slice(0, over).forEach((p) => remove(p, `wird in der ${YOUTH_AGE_CLASS_LABEL[cls]} aussortiert.`));
    }
  }
  return lines;
}

/** Einmalig (neues Spiel oder alter Spielstand): volle Mannschaften herstellen. */
export function ensureYouthTeams(g: Game, date: string): void {
  if (g.youthTeamsReady || (g as any).simAutoManage) return;
  fillYouthTeams(g, date);
  g.youthTeamsReady = true;
}

/** Nachricht zum Jahreswechsel der Jugend. */
export function youthChangeMessage(g: Game, date: string, leaving: string[], added: number): void {
  if (!leaving.length && !added) return;
  pushMessage(g.messages, makeMessage({
    date, category: 'training', from: 'Leiter Jugendakademie',
    subject: `Jugend: ${leaving.length} Abgänge, ${added} Neuzugänge`,
    shortText: 'Die Jugendmannschaften sind für die neue Saison aufgestellt.',
    bodyText: `Zum Saisonwechsel haben sich die Jugendmannschaften neu sortiert.\n\n${leaving.length ? `Abgänge:\n${leaving.join('\n')}\n\n` : ''}${added} neue Spieler füllen die Lücken – die meisten spielen aus Freude am Fußball, nur wenige werden einmal Profi.`,
  }));
}
