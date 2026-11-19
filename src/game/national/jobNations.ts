// Nationen zur Wahl „Zusätzlich Nationaltrainer“ im Assistenten (screens/newgame/StepMode.tsx):
// im Startjahr bestehend, nicht gesperrt, mit Turnierbetrieb (WM; EM für UEFA). Rang nach
// Grundstärke (data/nationalTeams.ts) – die echte Stärke entsteht erst mit der Spielwelt.
import { NATIONS, SUCCESSOR, baseStrength, confOf, nationExists, type Conf } from '../../data/nationalTeams';

export interface JobNation { code: string; conf: Conf; base: number; rank: number; label: string }

export function jobNations(year: number): JobNation[] {
  const list = NATIONS.filter((n) => nationExists(n, year) && !(n.bannedFrom && year >= n.bannedFrom))
    .map((n) => ({ code: n.code, conf: confOf(n, year), base: Math.round(baseStrength(n, year)) }))
    .sort((a, b) => b.base - a.base);
  return list.map((n, i) => ({ ...n, rank: i + 1, label: i < 6 ? 'Weltspitze' : i < 16 ? 'Spitze' : i < 36 ? 'Mittelfeld' : 'Außenseiter' }));
}

/** Gewählte Nation im neuen Startjahr (Nachfolger bei Teilung, sonst Rückfall). */
export function jobNationFor(code: string, year: number, fallback: string): string {
  const ok = new Set(jobNations(year).map((n) => n.code));
  let c = code;
  for (let i = 0; i < 3 && c && !ok.has(c); i++) c = SUCCESSOR[c] ?? '';
  return c && ok.has(c) ? c : ok.has(fallback) ? fallback : jobNations(year)[0]?.code ?? 'GER';
}
