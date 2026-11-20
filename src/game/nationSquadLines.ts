// Länderprofil › Nationalkader: Saisonzeile je Spieler (Wunsch Pascal: statt „Spiele · Tore“ seit
// Spielbeginn, die bei fast allen leer blieb, eine aussagekräftige Saisonbilanz im Verein).
// Volle Spieler aus `seasonStats`, Weltspieler aus der Verteilung ihrer Auslandsliga (game/worldScorers.ts
// `leanLines` – dieselbe Rechnung wie die Bestenlisten, nichts gespeichert).
import type { Game } from './state';
import { ensureWorldLive } from './worldLeagues';
import { leanLines } from './worldScorers';

export interface SeasonLine { apps: number; goals: number; assists: number; grade?: number }

export function squadSeasonLines(g: Game, rows: { id: string; clubId: string }[]): Map<string, SeasonLine> {
  const out = new Map<string, SeasonLine>();
  const live = ensureWorldLive(g);
  const divLines = new Map<string, Map<string, SeasonLine>>();
  for (const r of rows) {
    const p = g.players[r.id];
    if (p) {
      const s = p.seasonStats;
      out.set(r.id, { apps: s?.appearances ?? 0, goals: s?.goals ?? 0, assists: s?.assists ?? 0, grade: s?.ratedMatches ? s.ratingSum / s.ratedMatches : undefined });
      continue;
    }
    if (!live || !r.clubId) continue;
    const key = Object.keys(live.divs).find((k) => live.divs[k].ids.includes(r.clubId));
    if (!key) continue;
    let m = divLines.get(key);
    if (!m) {
      m = new Map();
      for (const l of leanLines(g, live.divs[key], live.season)) m.set(l.w[0] as string, { apps: l.apps, goals: l.goals, assists: l.assists });
      divLines.set(key, m);
    }
    const l = m.get(r.id);
    if (l) out.set(r.id, l);
  }
  return out;
}
