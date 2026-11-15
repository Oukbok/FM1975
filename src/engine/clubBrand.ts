// =============================================================================
// FINANZEN 2.0 — Marke (regional/national/international), Marke & Ruf nach der
// Saison, Vermarktung. Teil von engine/clubEconomy.ts (dort weitergereicht).
// =============================================================================
import { Club, ClubBrand } from '../types';
import { economyScale, revenueShare } from './economy';

const revenueShareCommercial = (y: number) => revenueShare('commercial', y);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Marke
// -----------------------------------------------------------------------------
/** Marke, die allein aus dem Ruf zu erwarten wäre. */
export function brandFromReputation(rep: number): ClubBrand {
  return {
    regional: clamp(rep + 12, 0, 100),
    national: clamp(rep - 8, 0, 100),
    international: clamp((rep - 62) * 1.6, 0, 100),
  };
}

export function ensureBrand(c: Club): ClubBrand {
  if (!c.brand) c.brand = brandFromReputation(c.reputation ?? 50);
  return c.brand;
}

/** Gewicht der internationalen Bekanntheit je Epoche (Globalisierung, Auslands-TV). */
export function internationalWeight(year: number): number {
  return clamp(0.1 + (year - 1975) * 0.011, 0.1, 0.65);
}

export function brandIndex(b: ClubBrand, year: number): number {
  return 0.45 * b.regional + 0.35 * b.national + internationalWeight(year) * b.international;
}

/**
 * Multiplikator für Sponsoring und Fanartikel: Marke im Verhältnis zu dem, was der
 * Ruf allein erwarten lässt. Abnehmender Grenznutzen und Deckel (Sättigung).
 */
export function commercialMultiplier(c: Club, year: number): number {
  const b = ensureBrand(c);
  const ratio = brandIndex(b, year) / Math.max(10, brandIndex(brandFromReputation(c.reputation ?? 50), year));
  return Math.pow(clamp(ratio, 0.6, 1.9), 0.8);
}

// -----------------------------------------------------------------------------
// Marke & Ruf nach der Saison
// -----------------------------------------------------------------------------
export interface SeasonOutcome {
  /** Platz in der Liga (1 = Meister), Ligagröße, Ebene (1 = 1. Liga). */
  position: number;
  size: number;
  tier: number;
  cupWinner: boolean;
  /** Europapokal-Punkte (siehe engine/world.ts seasonEuroPoints). */
  euroPoints: number;
  euroTitle: boolean;
}

export function updateBrand(c: Club, o: SeasonOutcome, year: number, isManaged: boolean): void {
  const b = ensureBrand(c);
  const perf = o.size > 1 ? 1 - (o.position - 1) / (o.size - 1) : 0.5;
  const tierBonus = o.tier === 1 ? 0 : o.tier === 2 ? -2.5 : -5;
  const anchor = brandFromReputation(c.reputation ?? 50);
  const champion = o.tier === 1 && o.position === 1;
  // Regional: treue Fans, wenig Schwankung.
  b.regional = clamp(b.regional + (perf - 0.5) * 1.5 + tierBonus * 0.3 + (anchor.regional - b.regional) * 0.05, 0, 100);
  // National: Titel und Tabellenplatz zählen.
  b.national = clamp(b.national + (perf - 0.5) * 3 + tierBonus + (champion ? 4 : 0) + (o.cupWinner ? 2 : 0)
    + (anchor.national - b.national) * 0.08, 0, 100);
  // International: Europapokal und Meistertitel; ab den 1990ern wichtiger.
  // Seit den 1990ern (Champions League, weltweite Übertragungen) bringt jeder Europapokal-Abend mehr
  // internationale Bekanntheit: wer Jahr für Jahr weit kommt, wird zur Weltmarke.
  const euroW = 0.7 + 0.3 * clamp((year - 1990) / 30, 0, 1);
  const intGain = o.euroPoints * euroW + (o.euroTitle ? 6 : 0) + (champion ? (year >= 1990 ? 2.5 : 1) : 0);
  b.international = clamp(b.international + intGain - 1.2 + (anchor.international - b.international) * 0.06, 0, 100);
  // Ruf der KI-Vereine driftet mit dem Erfolg (der eigene Verein: siehe game/day.ts).
  if (!isManaged) {
    const repTarget = 35 + perf * 30 + (o.tier === 1 ? 20 : o.tier === 2 ? 8 : 0) + (champion ? 8 : 0);
    c.reputation = Math.round(clamp(c.reputation + (repTarget - c.reputation) * 0.12, 20, 99));
  }
}

// -----------------------------------------------------------------------------
// Vermarktung (Partner, Lizenzen, Werbung) – Business-Plätze laufen über das Stadionumfeld
// -----------------------------------------------------------------------------
/** Durchschnittsumsatz eines Erstligisten 1975 (Recherche: Median ≈ 4,5 Mio. DM; Bezug für die Vermarktung). */
export const AVG_REVENUE_1975 = 4_500_000;
/** Anteil der pauschalen Vermarktung, der neben Sponsoring 2.0 und Hospitality bleibt (vorher 0,85). */
export const COMMERCIAL_REST = 0.3;

/**
 * Jahreswert der Vermarktung (nominal): 1975 praktisch null, ab den 1990ern ein
 * Hauptpfeiler. Große Marken verdienen überproportional (internationale Strahlkraft),
 * gedeckelt durch die Markenwerte (max. 100).
 */
export function commercialAnnualFor(c: Club, tier: number, year: number): number {
  const b = ensureBrand(c);
  const growth = Math.max(0, revenueShareCommercial(year) - revenueShareCommercial(1975));
  const size = Math.pow(Math.max(5, brandIndex(b, year)) / 45, 1.5);
  const tierF = tier <= 1 ? 1 : tier === 2 ? 0.35 : 0.1;
  // Hospitality (Business-Plätze) verdient das Stadionumfeld (engine/grounds.ts), Partner,
  // Trikot, Banden und Ausrüster das Sponsoring 2.0 (engine/sponsorship.ts). Hier bleiben
  // Lizenzen, Events, Kooperationen und sonstige Vermarktung: Anteil COMMERCIAL_REST.
  return Math.round(AVG_REVENUE_1975 * economyScale(year) * growth * 0.6 * size * tierF * COMMERCIAL_REST);
}
