// =============================================================================
// LIGARUF JE LAND — Entwicklung der Ligen (frei oder historisch)
// -----------------------------------------------------------------------------
// Jedes Hintergrund-Land (engine/world.ts) bekommt einen Ligaruf 0–100. Er bestimmt
// das Landesniveau (`countryLevel` = repBase + REP_LEVEL_K × rep) und damit die
// Zielstärke aller Vereine des Landes – also Europapokal-Erfolg, Koeffizient und
// Startplätze. Beim Anlegen wird `repBase` so gewählt, dass das Niveau im Startjahr
// genau dem bisherigen entspricht (gleicher Start wie ohne Option).
//
// Saisonwechsel (aus advanceWorldSeason, nach den Koeffizienten, vor der Stärke):
//   1. Frei (beide Modi): Die Länder werden nach der Fünfjahreswertung gereiht (dein
//      Heimatland zählt mit). Rang k „verdient“ den k-höchsten Ruf, den es in diesem
//      Jahr historisch gab (die Rufleiter bleibt so breit wie in der Geschichte – wer
//      oben steht, entscheidet allein der Europapokal). Der Ruf geht 20 % des Wegs
//      dorthin (in den ersten Jahren anteilig weniger, solange die Wertung noch keine
//      fünf Saisons hat), dazu 2 % zurück zur eigenen Grundgröße beim Start und ein
//      kleiner Zufall (Wirtschaft, Generationen).
//   2. Nur Historisch: Danach wird ein Teil der Abweichung zur historischen Zielkurve
//      (data/leagueReputation.ts) abgebaut – HIST_PULL = 30 % (mindestens ein Viertel:
//      20 Punkte über der Kurve → mindestens −5, netto nach Schritt 1), symmetrisch auch nach oben.
// Das Heimatland (volle Kader) wird nie verändert: Es zählt nur für die Reihung, seine
// Stärke kommt aus den echten Kadern.
// =============================================================================
import { repTargetAt } from '../data/leagueReputation';
import { historicFade } from '../data/historicStrength';
import { coefSum, legacyCountryLevel, REP_LEVEL_K, type WorldCountry, type WorldState } from './world';

export type LeagueRepMode = 'free' | 'historic';

/** Anteil des Wegs zum „verdienten“ Ruf je Saison (bei voller Fünfjahreswertung). */
export const FREE_PULL = 0.2;
/** Rückzug zur Grundgröße des Landes beim Start je Saison. */
export const STRUCT_PULL = 0.02;
/** Zufall je Saison (Standardabweichung in Ruf-Punkten). */
export const REP_NOISE = 1;
/** Historisch: Anteil der Abweichung zur Zielkurve, der je Saison abgebaut wird (≥ 0,25). */
export const HIST_PULL = 0.3;
/** Historisch: so viel der Abweichung wird je Saison mindestens abgebaut – netto, nach dem freien Schritt. */
export const MIN_SHARE = 0.25;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

/** Ligaruf eines Landes anlegen (historischer Wert im Jahr, Niveau bleibt unverändert). */
export function initCountryRep(c: WorldCountry, year: number): void {
  if (c.rep != null && c.repBase != null) return;
  const t = repTargetAt(c.name, year);
  c.repBase = legacyCountryLevel(c, year) - REP_LEVEL_K * t;
  c.rep = Math.round(t * 10) / 10;
  c.repStart = c.rep;
  c.repHist = [];
}

/** Alle aktiven Länder mit Ligaruf versehen (Spielstart). */
export function initLeagueRep(w: WorldState, year: number): void {
  for (const c of Object.values(w.countries)) if (c.active) initCountryRep(c, year);
}

/** Verdienter Ruf je Land aus der Fünfjahreswertung (Rang k → k-höchster historischer Ruf des Jahres). */
export function earnedReputation(w: WorldState, year: number, homeKey: string | null): Record<string, number> {
  const rows = Object.values(w.countries).filter((c) => c.active)
    .map((c) => ({ key: c.name, coef: coefSum(c.coef), rep: c.rep ?? repTargetAt(c.name, year) }));
  if (homeKey && !w.countries[homeKey]) rows.push({ key: homeKey, coef: coefSum(w.germanCoef), rep: repTargetAt(homeKey, year) });
  rows.sort((a, b) => b.coef - a.coef || b.rep - a.rep || a.key.localeCompare(b.key));
  const ladder = rows.map((x) => repTargetAt(x.key, year)).sort((a, b) => b - a);
  const out: Record<string, number> = {};
  rows.forEach((x, i) => { out[x.key] = ladder[i]; });
  return out;
}

/**
 * Ligaruf am Saisonwechsel fortschreiben. `year` = Kalenderjahr des Saisonendes (= Startjahr der
 * neuen Saison), `homeKey` = Hintergrund-Schlüssel des Heimatlandes (wird nie verändert).
 */
export function seasonLeagueRep(w: WorldState, year: number, mode: LeagueRepMode, homeKey: string | null): void {
  for (const c of Object.values(w.countries)) if (c.active) initCountryRep(c, year);
  const earned = earnedReputation(w, year, homeKey);
  for (const c of Object.values(w.countries)) {
    if (!c.active || c.rep == null) continue;
    const r = rng(hash(`rep|${year}|${c.name}`));
    const full = Math.min(5, c.coef.length) / 5;
    let v = c.rep + FREE_PULL * full * ((earned[c.name] ?? c.rep) - c.rep)
      + STRUCT_PULL * ((c.repStart ?? c.rep) - c.rep) + gauss(r) * REP_NOISE;
    if (mode === 'historic') {
      // Nach den echten Daten (2025) läuft die Lenkung aus (Halbwertszeit 25 Jahre, historicFade) –
      // sonst bliebe die Rangordnung von 2025 bis 2075 eingefroren.
      const fade = historicFade(year);
      const target = repTargetAt(c.name, year);
      v -= (v - target) * HIST_PULL * fade;
      // Zusage: Mindestens ein Viertel der Abweichung vom Saisonbeginn wird tatsächlich abgebaut –
      // auch wenn das Land gerade alles gewinnt (20 über der Kurve → mindestens −5).
      const dev0 = c.rep - target;
      if (dev0 > 0) v = Math.min(v, c.rep - dev0 * MIN_SHARE * fade);
      else if (dev0 < 0) v = Math.max(v, c.rep - dev0 * MIN_SHARE * fade);
    }
    c.rep = Math.round(clamp(v, 0, 100) * 10) / 10;
    (c.repHist ??= []).push(c.rep);
    while (c.repHist.length > 10) c.repHist.shift();
  }
}
