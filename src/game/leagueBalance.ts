// =============================================================================
// LIGA-TICKER & LIGA-GLEICHGEWICHT
// -----------------------------------------------------------------------------
// • Nach jeder Winter- und Saison-Bewertung: die größten Gewinner und Verlierer
//   der anderen Vereine deiner Liga – damit du siehst, wo Talente reifen.
// • Zum Saisonstart wird die Durchschnittsstärke deiner Liga mit einem Zielwert
//   verglichen. Liegt sie zu hoch, werden neue Jugendjahrgänge etwas schwächer
//   erzeugt (zu niedrig: etwas stärker). Bestehende Spieler werden nie
//   nachträglich verändert.
// • Breite der Spitze: Weicht die Zahl der Spieler mit Stärke ≥ 85 in der
//   1. Liga vom Ziel (ELITE_TARGET, Korridor 10–15) ab, verschiebt sich die
//   Weltklasse-Bremse der Entwicklung anteilig (zu viele → früher, zu wenige →
//   später). Ohne Rücksprung auf 0 im Korridor, damit nichts aufschaukelt.
// =============================================================================
import { makeMessage, pushMessage } from '../engine/messages';
import { setYouthPotentialShift } from '../engine/youth';
import { setEliteShift } from '../engine/development';
import { setTalentSupply } from '../engine/talent';
import { leagueClubs } from './season';
import { Game } from './state';

const TARGET: Record<number, number> = { 1: 72.5 };
const SHIFT_MIN = -0.6, SHIFT_MAX = 0.5;
/** Ziel der Spieler ≥ 85 in der 1. Liga (Recherche: 10–15, docs/recherche/spielerkurven.md). */
const ELITE_TARGET = 12.5;
/**
 * PI-Regler: Sofortanteil (Punkte Bremse je Spieler Abweichung) plus langsamer
 * Gedächtnisanteil (je Saison, begrenzt auf ±2). Spieler brauchen Jahre bis zur
 * Weltklasse – ein reiner Summen-Regler schaukelte sich deshalb auf (zu wenige
 * 85er in den 80ern, zu viele in den 2000ern). Der Gedächtnisanteil steuert
 * zusätzlich das Talent-Angebot neuer Spieler (engine/talent.ts): Die Bremse
 * allein kann nicht verhindern, dass Spieler ihr Potenzial irgendwann erreichen.
 */
const ELITE_P = 0.4, ELITE_I = 0.05, ELITE_I_MAX = 2;

/** Stärke aller Spieler der eigenen Liga (außer eigener Verein) vor der Bewertung merken. */
export function snapshotLeague(g: Game): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of leagueClubs(g)) {
    if (c.id === g.managedClubId) continue;
    for (const id of c.playerIds) { const p = g.players[id]; if (p) m.set(id, p.overall); }
  }
  return m;
}

export function ratingTicker(g: Game, before: Map<string, number>, label: string, today: string): void {
  const rows: { name: string; club: string; age: number; pos: string; d: number; now: number }[] = [];
  for (const [id, old] of before) {
    const p = g.players[id];
    if (!p) continue;
    const d = p.overall - old;
    if (d !== 0) rows.push({ name: p.fullName, club: g.clubs[p.clubId]?.shortName ?? '?', age: p.age, pos: p.naturalPosition, d, now: p.overall });
  }
  if (!rows.length) return;
  const up = [...rows].sort((a, b) => b.d - a.d || a.age - b.age).slice(0, 6);
  const down = [...rows].sort((a, b) => a.d - b.d).slice(0, 4).filter((r) => r.d < 0);
  const line = (r: typeof rows[number]) => `${r.d > 0 ? '+' : ''}${r.d}  ${r.name} (${r.club}, ${r.pos}, ${r.age} J.) → ${r.now}`;
  const young = up.filter((r) => r.age <= 21 && r.d >= 3);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'media', from: 'Liga-Ticker',
    subject: `${label}: Gewinner und Verlierer der Liga`,
    shortText: young.length ? `Aufgepasst: ${young[0].name} (${young[0].club}) macht einen großen Sprung.` : `Größter Sprung: ${up[0].name} (${up[0].club}).`,
    bodyText: `Gewinner:\n${up.map(line).join('\n')}${down.length ? `\n\nVerlierer:\n${down.map(line).join('\n')}` : ''}\n\nJunge Spieler mit großen Sprüngen sind spätere Transferziele – beobachte sie im Scouting.`,
  }));
}

/** Zum Saisonstart (1. Juli, vor dem Nachwuchs-Jahrgang): Gleichgewicht nachführen. */
export function seasonLeagueBalance(g: Game): void {
  // Gemessen wird nur die 1. Liga (nur dort sind alle Kader voll simuliert, wenn du dort spielst).
  const lb0 = g.leagueBalance ?? { shift: 0, history: [] };
  if ((g.leagues?.playerDivision?.tier ?? 1) !== 1) {
    lb0.shift = Math.round(lb0.shift * 0.8 * 100) / 100;
    lb0.elite = Math.round((lb0.elite ?? 0) * 0.8 * 100) / 100;
    lb0.eliteI = Math.round((lb0.eliteI ?? 0) * 0.8 * 100) / 100;
    g.leagueBalance = lb0;
    setYouthPotentialShift(lb0.shift);
    setEliteShift(lb0.elite);
    setTalentSupply(supplyOf(lb0.eliteI));
    return;
  }
  const ps = leagueClubs(g).flatMap((c) => c.playerIds.map((id) => g.players[id]).filter(Boolean));
  if (ps.length < 100) return;
  const avg = ps.reduce((s, p) => s + p.overall, 0) / ps.length;
  const target = TARGET[1];
  const lb = lb0;
  if (avg > target + 1) lb.shift -= 0.1;
  else if (avg < target - 1) lb.shift += 0.1;
  else lb.shift *= 0.5;
  lb.shift = Math.round(Math.max(SHIFT_MIN, Math.min(SHIFT_MAX, lb.shift)) * 100) / 100;
  // Breite der Spitze: zu viele Weltklasse-Spieler → Bremse greift früher (negativ).
  const n85 = ps.filter((p) => p.overall >= 85).length;
  const err = ELITE_TARGET - n85;
  lb.eliteI = Math.round(Math.max(-ELITE_I_MAX, Math.min(ELITE_I_MAX, (lb.eliteI ?? 0) + err * ELITE_I)) * 100) / 100;
  const elite = err * ELITE_P + lb.eliteI;
  lb.elite = Math.round(Math.max(-5, Math.min(4, elite)) * 100) / 100;
  // Talent-Angebot neuer Spieler: folgt dem Gedächtnisanteil (dauerhafte Abweichung).
  setTalentSupply(supplyOf(lb.eliteI));
  lb.history.push({ season: g.season, avg: Math.round(avg * 10) / 10, shift: lb.shift, n85, elite: lb.elite });
  if (lb.history.length > 60) lb.history.splice(0, lb.history.length - 60);
  g.leagueBalance = lb;
  setYouthPotentialShift(lb.shift);
  setEliteShift(lb.elite);
}

/** Talent-Angebot aus dem Gedächtnisanteil des Weltklasse-Reglers (±2 → 0,7 … 1,3). */
function supplyOf(eliteI: number | undefined): number { return 1 + (eliteI ?? 0) * 0.15; }

/** Beim Laden/Tageswechsel den gespeicherten Wert setzen. */
export function applyLeagueBalance(g: Game): void {
  setYouthPotentialShift(g.leagueBalance?.shift ?? 0);
  setEliteShift(g.leagueBalance?.elite ?? 0);
  setTalentSupply(supplyOf(g.leagueBalance?.eliteI));
}
