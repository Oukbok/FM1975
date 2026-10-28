// =============================================================================
// LIGA-TICKER & LIGA-GLEICHGEWICHT
// -----------------------------------------------------------------------------
// • Nach jeder Winter- und Saison-Bewertung: die größten Gewinner und Verlierer
//   der anderen Vereine deiner Liga – damit du siehst, wo Talente reifen.
// • Zum Saisonstart wird die Durchschnittsstärke deiner Liga mit einem Zielwert
//   verglichen. Liegt sie zu hoch, werden neue Jugendjahrgänge etwas schwächer
//   erzeugt (zu niedrig: etwas stärker). Bestehende Spieler werden nie
//   nachträglich verändert.
// =============================================================================
import { makeMessage, pushMessage } from '../engine/messages';
import { setYouthPotentialShift } from '../engine/youth';
import { leagueClubs } from './season';
import { Game } from './state';

const TARGET: Record<number, number> = { 1: 72.5 };
const SHIFT_MIN = -0.6, SHIFT_MAX = 0.3;

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
    g.leagueBalance = lb0;
    setYouthPotentialShift(lb0.shift);
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
  lb.history.push({ season: g.season, avg: Math.round(avg * 10) / 10, shift: lb.shift });
  if (lb.history.length > 60) lb.history.splice(0, lb.history.length - 60);
  g.leagueBalance = lb;
  setYouthPotentialShift(lb.shift);
}

/** Beim Laden/Tageswechsel den gespeicherten Wert setzen. */
export function applyLeagueBalance(g: Game): void {
  setYouthPotentialShift(g.leagueBalance?.shift ?? 0);
}
