// =============================================================================
// ERFAHRUNG (Wunsch Pascal): wächst mit Pflichtspielen, wirkt auf die Konstanz
// (Streuung der Tagesform, match/skills.ts `dayForm`) und in wichtigen Spielen
// leicht auf die Leistung (Nervenstärke unter Druck, `nerveF`).
// -----------------------------------------------------------------------------
// Wer hohe Erfahrung erreicht (Wunsch Pascal): Spieler, die schon jung Stammspieler
// sind, viele Länderspiele und internationale Spiele bestreiten und Titel sammeln.
// - Pflichtspiele: 0,24 × Spielanteil × Wettbewerb × Alter × (1 − Erfahrung/110);
//   jung (≤ 21) zählt jedes Spiel 1,4-fach, ab 32 nur 0,7-fach. Aufruf match/finish.ts.
// - Länderspiele `intlExperience` (game/national/nationalGame.ts), Turnierspiele 1,6-fach.
// - Titel `titleExperience` (game/clubRecords.ts recordSeasonEnd) für alle mit Einsätzen.
// - Erzeugung `initialExperience` (playerFactory): Alter UND Stärke – ein 28-jähriger
//   Weltklassespieler hat eine ganz andere Laufbahn hinter sich als ein Ergänzungsspieler.
// Bruchteile sammeln sich in `development.expProg`, die Attribut-Zahl bleibt ganzzahlig.
// =============================================================================
import type { Player } from '../types';

const COMP = { Liga: 1, Pokal: 1.15, Europapokal: 1.6 } as const;

/** Bruchteile sammeln, ganze Punkte aufs Attribut. */
function grant(p: Player, gain: number): void {
  const a = p.attributes;
  const exp = a.experience ?? 50;
  if (exp >= 99 || gain <= 0) return;
  const dev = p.development as Player['development'] & { expProg?: number };
  const prog = (dev.expProg ?? 0) + gain;
  const whole = Math.floor(prog);
  dev.expProg = Math.round((prog - whole) * 1000) / 1000;
  if (whole > 0) a.experience = Math.min(99, exp + whole);
}

const ageF = (p: Player) => (p.age <= 21 ? 1.4 : p.age <= 23 ? 1.2 : p.age >= 32 ? 0.7 : 1);
const room = (p: Player) => Math.max(0.05, 1 - (p.attributes.experience ?? 50) / 110);

/** Erfahrung bei der Erzeugung: Laufbahnjahre × Niveau (Stärke), gesättigt. Kein Zufall außer `noise`. */
export function initialExperience(age: number, overall: number, noise: number): number {
  const q = Math.max(0, Math.min(1, (overall - 45) / 40));
  const raw = Math.max(0, age - 17) * (2 + 5 * q);
  return Math.round(5 + 90 * (1 - Math.exp(-raw / 55)) + noise);
}

/** Länderspiele: `apps` Einsätze, `starter` = in der Startelf, `tournament` = WM/EM. */
export function intlExperience(p: Player, apps: number, starter: boolean, tournament = false): void {
  grant(p, apps * (starter ? 0.5 : 0.22) * (tournament ? 1.6 : 1) * ageF(p) * room(p));
}

const TITLE: Record<string, number> = { meister: 3, ec: 3, pokal: 2, cwc: 2, uefa: 2, ddr: 2 };
/** Titel: Spieler mit Einsätzen in der Saison sammeln Erfahrung (Stammspieler mehr). */
export function titleExperience(players: Player[], kind: string): void {
  const v = TITLE[kind];
  if (!v) return;
  for (const p of players) {
    const apps = p.seasonStats?.appearances ?? 0;
    if (apps >= 3) grant(p, (apps >= 15 ? v : v / 2) * Math.max(0.3, room(p) * 1.4));
  }
}

export function addExperience(p: Player, minutes: number, competition: keyof typeof COMP, pressure = 0): void {
  if (minutes <= 0) return;
  const share = Math.min(1, minutes / 90);
  grant(p, 0.24 * share * COMP[competition] * (1 + pressure * 0.3) * ageF(p) * room(p));
}
