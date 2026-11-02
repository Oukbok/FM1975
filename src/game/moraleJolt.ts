// =============================================================================
// KABINE — sofortige Moral-Sprünge (eigener Verein)
// -----------------------------------------------------------------------------
// Ereignisse (Sieg/Niederlage, Tor, nicht aufgestellt, Einwechslung, Lob/
// Kritik, Vertragsangebot, Transferliste, gebrochenes Versprechen,
// Kabinen-Vorfall …) verändern `Player.moraleScore` sofort. Danach gleitet die
// Moral im Tageslauf (game/dressingRoomGame.ts, 8 %/Tag) zum Zielwert zurück.
// Jeder Sprung wird mit Text am Kabinen-Zustand gemerkt (`jolts`) und beim
// Spieler im Fokus angezeigt („+6 Siegtor beim 2:1 gegen Köln“).
// Spiele werden täglich aus dem Spiel-Log der Spieler ausgewertet
// (`matchJolts`, aufgerufen aus `dressingRoomDaily`).
// Ohne Abhängigkeit zu dressingRoomGame.ts, damit Verträge/Versprechen es
// importieren können.
// =============================================================================
import { DRJolt, DressingRoomState, moraleStepOf, moraleScoreOf } from '../engine/dressingRoom';
import { personaOf } from '../engine/persona';
import { Club, MatchLogEntry, Player } from '../types';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const days = (a: string, b: string) => (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000;
const MAX_JOLTS = 400;

/**
 * Sofortiger Moral-Sprung für einen Spieler des eigenen Vereins.
 * Rückgabe false, wenn der Spieler nicht (mehr) im eigenen Kader ist – dann
 * kann der Aufrufer auf die alte Stufen-Logik zurückfallen.
 */
export function moraleJolt(g: Game, p: Player | undefined, value: number, label: string, date = g.calendar.currentDate): boolean {
  if (!p || p.clubId !== g.managedClubId || p.isYouth) return false;
  const club = g.clubs[g.managedClubId];
  if (!club) return false;
  const dr = (club.dressingRoom ??= { v: 1, mood: 58 });
  const before = typeof p.moraleScore === 'number' && Number.isFinite(p.moraleScore) ? p.moraleScore : moraleScoreOf(p.morale);
  const after = Math.round(clamp(before + value, 2, 98) * 10) / 10;
  p.moraleScore = after;
  p.morale = moraleStepOf(after);
  const real = Math.round(after - before);
  if (real !== 0) pushJolt(dr, { pid: p.id, date, value: real, label });
  return true;
}

function pushJolt(dr: DressingRoomState, j: DRJolt): void {
  const list = (dr.jolts ??= []);
  list.push(j);
  if (list.length > MAX_JOLTS) list.splice(0, list.length - MAX_JOLTS);
}

/** Alte Sprünge (über 60 Tage) entfernen. */
export function pruneJolts(dr: DressingRoomState, today: string): void {
  if (dr.jolts) dr.jolts = dr.jolts.filter((j) => days(j.date, today) <= 60);
}

/** Letzte Sprünge eines Spielers (neueste zuerst). */
export function joltsOf(dr: DressingRoomState | undefined, pid: string, n = 6): DRJolt[] {
  return (dr?.jolts ?? []).filter((j) => j.pid === pid).slice(-n).reverse();
}

// -----------------------------------------------------------------------------
// Spiele: einmal täglich aus dem Spiel-Log der Spieler
// -----------------------------------------------------------------------------
interface Played { key: string; date: string; e: MatchLogEntry }

function scoreOf(e: MatchLogEntry): [number, number] {
  const [a, b] = e.score.split(':').map((x) => Number.parseInt(x, 10));
  return [Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0];
}

/**
 * Wertet alle Spiele des eigenen Vereins seit dem letzten Lauf aus.
 * Rückgabe: Anzahl ausgewerteter Spiele.
 */
export function matchJolts(g: Game, club: Club, squad: Player[], today: string): number {
  const dr = (club.dressingRoom ??= { v: 1, mood: 58 });
  const since = dr.joltScan;
  dr.joltScan = today;
  if (!since) return 0; // erster Lauf (alter Spielstand): nichts rückwirkend
  // Spiele seit dem letzten Lauf: aus den Logs aller Kaderspieler zusammensetzen.
  const games = new Map<string, Played>();
  const byPlayer = new Map<string, Map<string, MatchLogEntry>>();
  for (const p of squad) {
    for (const e of p.history?.matches ?? []) {
      if (e.date <= since || e.date > today) continue;
      const key = `${e.date}|${e.competition}|${e.opponent}`;
      if (!games.has(key)) games.set(key, { key, date: e.date, e });
      let m = byPlayer.get(p.id);
      if (!m) byPlayer.set(p.id, (m = new Map()));
      m.set(key, e);
    }
  }
  if (!games.size) return 0;
  const byOvr = [...squad].sort((a, b) => b.overall - a.overall);
  const rank = new Map(byOvr.map((p, i) => [p.id, i + 1]));
  for (const gm of [...games.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    const [gf, ga] = scoreOf(gm.e);
    const diff = gf - ga;
    const res = diff > 0 ? 'W' : diff < 0 ? 'L' : 'D';
    const vs = `${gf}:${ga} gegen ${gm.e.opponent}`;
    const base = res === 'W' ? 2 + Math.min(3, diff - 1) : res === 'L' ? -2 - Math.min(3, -diff - 1) : 0;
    for (const p of squad) {
      const e = byPlayer.get(p.id)?.get(gm.key);
      const amb = 0.6 + personaOf(p).ehrgeiz / 125;
      const r = rank.get(p.id) ?? 99;
      const parts: { v: number; label: string; w: number }[] = [];
      if (base) parts.push({ v: base, label: res === 'W' ? `Sieg ${vs}` : `Niederlage ${vs}`, w: 1 });
      if (e) {
        if (e.goals > 0) {
          const decisive = res === 'W' && diff === 1;
          parts.push({ v: decisive ? 4 : 2 + Math.min(4, (e.goals - 1) * 2), label: decisive ? `Siegtor beim ${vs}` : e.goals > 1 ? `${e.goals} Tore beim ${vs}` : `Tor beim ${vs}`, w: 4 });
        }
        if (e.rating > 0 && e.rating <= 1.6) parts.push({ v: 2, label: `Glanzleistung beim ${vs}`, w: 3 });
        else if (e.rating >= 5) parts.push({ v: -2, label: `Schwaches Spiel beim ${vs}`, w: 2 });
        if (e.card === 'Rot' || e.card === 'Gelb-Rot') parts.push({ v: -2, label: `Platzverweis beim ${vs}`, w: 3 });
        if (e.minutes <= 30) {
          if (r <= 11 && p.age >= 21) parts.push({ v: -2 * amb, label: `Nur eingewechselt beim ${vs}`, w: 2 });
          else if (r >= 15 || p.age <= 20) parts.push({ v: 2, label: `Eingewechselt beim ${vs}`, w: 2 });
        }
      } else if (!p.injury && (p.suspensionMatches ?? 0) <= 0 && p.age >= 21 && r <= 13) {
        parts.push({ v: (r <= 11 ? -5 : -3) * amb, label: `Nicht aufgestellt beim ${vs}`, w: 3 });
      }
      if (!parts.length) continue;
      const v = clamp(parts.reduce((s, x) => s + x.v, 0), -10, 10);
      if (Math.abs(v) < 0.5) continue;
      const main = [...parts].sort((a, b) => b.w - a.w || Math.abs(b.v) - Math.abs(a.v))[0];
      moraleJolt(g, p, v, main.label, gm.date);
    }
  }
  return games.size;
}

/** Transferliste: Wer neu draufkommt, ist sofort gekränkt; wer runterkommt, atmet auf. */
export function listingJolts(g: Game, club: Club, squad: Player[], today: string): void {
  const dr = (club.dressingRoom ??= { v: 1, mood: 58 });
  const was = dr.listed ? new Set(dr.listed) : null;
  const now = squad.filter((p) => p.transferListed).map((p) => p.id);
  if (was) {
    for (const p of squad) {
      if (p.transferListed && !was.has(p.id)) moraleJolt(g, p, -8, 'Auf die Transferliste gesetzt', today);
      else if (!p.transferListed && was.has(p.id)) moraleJolt(g, p, 4, 'Von der Transferliste genommen', today);
    }
  }
  dr.listed = now;
}
