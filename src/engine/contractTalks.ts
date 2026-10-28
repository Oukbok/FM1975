// =============================================================================
// VERTRAGSGESPRÄCHE (rein, ohne Spielstand): Forderung eines Spielers,
// Bewertung eines Angebots, Bosman-Regel.
// -----------------------------------------------------------------------------
// Gehälter sind Preisschilder in 1975-Basis (wie `weeklyWage`).
// Die Forderung hängt ab von: Marktgehalt, Stellenwert im Kader, Alter,
// Zufriedenheit, Ehrgeiz und – ab Bosman – der Verhandlungsmacht kurz vor
// Vertragsende. Ob ein Spieler überhaupt verlängern will, hängt vom Verhältnis
// zwischen seiner Stärke und dem Ansehen des Vereins ab.
// =============================================================================
import { Club, Player } from '../types';
import { HISTORY } from '../data/history';
import { marketWage } from './clubEconomy';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Gilt am Datum die Ablösefreiheit nach Vertragsende? */
export function bosmanActive(dateISO: string): boolean {
  return Number(dateISO.slice(0, 4)) >= (HISTORY.bosmanFromYear ?? 1996);
}

/** Saison-Endjahr eines Datums (Saison läuft 1. Juli – 30. Juni). */
export function seasonEndYear(dateISO: string): number {
  const y = Number(dateISO.slice(0, 4));
  return Number(dateISO.slice(5, 7)) >= 7 ? y + 1 : y;
}

/** Monate bis zum Vertragsende (UTC, ≥ 0). */
export function monthsLeft(today: string, expiry: string): number {
  const a = new Date(today + 'T00:00:00Z'), b = new Date(expiry + 'T00:00:00Z');
  return Math.max(0, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()));
}

export type TalkMood = 'gern' | 'offen' | 'zögerlich' | 'ablehnend';

export interface ContractDemand {
  /** Gefordertes Wochengehalt (1975-Basis). */
  wage: number;
  minYears: number;
  maxYears: number;
  mood: TalkMood;
  /** Ein Satz, wie der Spieler die Lage sieht. */
  reason: string;
  /** Kann aktuell verhandelt werden? (sonst `blockedText`) */
  open: boolean;
  blockedText?: string;
}

function yearRange(age: number): [number, number] {
  if (age <= 23) return [2, 5];
  if (age <= 29) return [2, 4];
  if (age <= 32) return [1, 2];
  return [1, 1];
}

/** Stärke der besten 11 eines Kaders (Maß für das Niveau des Vereins). */
export function squadLevel(squad: Player[]): number {
  const top = squad.map((p) => p.overall).sort((a, b) => b - a).slice(0, 11);
  return top.length ? top.reduce((s, v) => s + v, 0) / top.length : 60;
}

/**
 * Forderung eines Spielers für eine Verlängerung beim eigenen Verein.
 * Deterministisch (kein Zufall), damit das Fenster nicht „rerollt“ werden kann.
 */
export function contractDemand(p: Player, club: Club, squad: Player[], today: string): ContractDemand {
  const d = p.development;
  const level = squadLevel(squad);
  const rel = p.overall - level; // > 0: Leistungsträger
  const sat = p.contract.satisfaction ?? 60;
  const ambition = d.ambition ?? 50;

  let f = 1;
  f *= 1 + clamp(rel / 25, -0.12, 0.3);          // Stellenwert im Kader
  if (p.age >= 31) f *= 0.9;                      // Routiniers nehmen weniger
  if (p.age <= 21) f *= 0.92;                     // Talente wollen vor allem spielen
  f *= sat < 40 ? 1.18 : sat > 75 ? 0.96 : 1;     // Zufriedenheit
  f *= 1 + (ambition - 50) / 400;                 // Ehrgeiz
  const left = monthsLeft(today, p.contract.expiryDate);
  if (bosmanActive(today) && left <= 12) f *= 1.1; // Verhandlungsmacht vor dem Vertragsende

  const floor = p.age >= 31 ? p.contract.weeklyWage * 0.85 : p.contract.weeklyWage * 1.03;
  const wage = Math.round(Math.max(floor, marketWage(p) * f) / 10) * 10;
  const [minYears, maxYears] = yearRange(p.age);

  // Bereitschaft: Zufriedenheit, Ansehen des Vereins gegenüber eigener Stärke, Ehrgeiz, Moral.
  const moraleBonus = { very_low: -15, low: -7, okay: 0, good: 5, excellent: 10 }[p.morale] ?? 0;
  const score = 50 + (sat - 55) * 0.7 + ((club.reputation ?? 60) - p.overall) * 0.9 - (ambition - 50) * 0.25 + moraleBonus;
  const mood: TalkMood = score >= 65 ? 'gern' : score >= 42 ? 'offen' : score >= 22 ? 'zögerlich' : 'ablehnend';
  const reason = mood === 'gern' ? 'Fühlt sich wohl und möchte bleiben.'
    : mood === 'offen' ? 'Ist offen für eine Verlängerung, wenn das Gehalt stimmt.'
      : mood === 'zögerlich' ? (p.overall > (club.reputation ?? 60) + 3 ? 'Traut sich einen größeren Verein zu.' : 'Ist unzufrieden und lässt sich bitten.')
        : 'Will den Verein verlassen.';

  const season = `${seasonEndYear(today) - 1}`;
  const talks = p.contract.talks;
  let open = mood !== 'ablehnend';
  let blockedText: string | undefined = open ? undefined : 'Er lehnt Gespräche ab.';
  if (p.contract.preContractClubId) { open = false; blockedText = 'Er hat bereits einen Vorvertrag bei einem anderen Verein unterschrieben.'; }
  else if (talks && talks.season === season && talks.blockedUntil && talks.blockedUntil > today) {
    open = false; blockedText = `Nach den gescheiterten Gesprächen will er erst ab ${talks.blockedUntil.slice(8, 10)}.${talks.blockedUntil.slice(5, 7)}. wieder reden.`;
  } else if (left > 30) {
    open = false; blockedText = 'Der Vertrag läuft noch lange – darüber spricht er frühestens zweieinhalb Jahre vor dem Ende.';
  }
  return { wage, minYears, maxYears, mood, reason, open, blockedText };
}

export interface OfferResult {
  accepted: boolean;
  text: string;
  /** Spieler bricht die Gespräche ab. */
  breakOff?: boolean;
}

/**
 * Bewertet ein Angebot. `attempt` = wievielter Versuch in dieser Saison (1…).
 * Nahe an der Forderung entscheidet ein kleiner Zufall; nach dem dritten
 * gescheiterten Versuch bricht der Spieler die Gespräche für zwei Monate ab.
 */
export function evaluateOffer(p: Player, dem: ContractDemand, wage: number, years: number, attempt: number, rnd = Math.random): OfferResult {
  if (!dem.open) return { accepted: false, text: dem.blockedText ?? 'Keine Gespräche möglich.' };
  if (years < dem.minYears || years > dem.maxYears) {
    return { accepted: false, text: `${p.lastName} möchte ${dem.minYears === dem.maxYears ? `genau ${dem.minYears} Jahr${dem.minYears > 1 ? 'e' : ''}` : `${dem.minYears}–${dem.maxYears} Jahre`} unterschreiben.` };
  }
  const ratio = wage / Math.max(1, dem.wage);
  const moodBonus = { gern: 0.04, offen: 0, zögerlich: -0.05, ablehnend: -1 }[dem.mood];
  const need = 1 - moodBonus;
  let accepted = ratio >= need;
  if (!accepted && ratio >= need - 0.07) accepted = rnd() < (ratio - (need - 0.07)) / 0.07 * 0.7;
  if (accepted) return { accepted: true, text: `${p.fullName} unterschreibt für ${years} Jahr${years > 1 ? 'e' : ''}.` };
  const breakOff = attempt >= 3;
  if (ratio < 0.8) return { accepted: false, breakOff, text: breakOff ? `${p.lastName} fühlt sich nicht wertgeschätzt und bricht die Gespräche ab.` : `${p.lastName} empfindet das Angebot als Beleidigung.` };
  return { accepted: false, breakOff, text: breakOff ? `${p.lastName} hat genug und will vorerst nicht mehr verhandeln.` : `${p.lastName} lehnt ab – es fehlt noch etwas.` };
}
