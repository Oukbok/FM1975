// =============================================================================
// Vertrags-Angebote (Trikot & Banden) alter Spielstände und der Kader-Erzeugung,
// 1975-DM-Basis. Teil von engine/finances.ts (dort weitergereicht).
// =============================================================================
import { Club, SponsorOffer } from '../types';

// -----------------------------------------------------------------------------
// Vertrags-Angebotsgeneratoren (Trikot & Banden) — 1975-DM-Basis
// -----------------------------------------------------------------------------

/** Historische Trikot-Anker (1975-DM/Jahr). */
export const SHIRT_TIERS = [
  { label: 'Regional', tier: 100000 },
  { label: 'National', tier: 275000 },
  { label: 'Premium', tier: 500000 },
];

export const SHIRT_SPONSOR_NAMES = [
  'Lohwald Bekleidung', 'Deichgraf Versicherung', 'Siegtal Metallwerke', 'Kesselberg Bräu',
  'Hansa Elektro', 'Kontorbank Nord', 'Elbgummi Reifen', 'Schuhhaus Brenner',
  'Weltmarke Kaffee', 'Möbel Wohnwerk', 'Greifen Chemie', 'Sonnen Molkerei',
];
export const BANDEN_PARTNER_NAMES = [
  'Regio Werbung', 'Plakat & Co.', 'Stadion-Marketing GmbH', 'Säulen Media',
  'City Reklame', 'Panorama Werbung', 'Arena Promotion',
];

/** Deterministischer Zufall aus einem String-Seed. */
function seedRand(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const round5000 = (n: number) => Math.round(n / 5000) * 5000;

/**
 * Erzeugt 2–3 Trikotsponsoring-Angebote (1975-DM/Jahr) abhaengig von Reputation.
 * `annual = tier * (0.85 + reputation/100 * 0.4)`, gerundet auf 5.000; Laufzeit 1–5 J.
 */
export function generateShirtOffers(club: Club, seasonSeed: string): SponsorOffer[] {
  const rnd = seedRand(`${club.id}-shirt-${seasonSeed}`);
  const rep = club.reputation;
  const factor = 0.85 + (rep / 100) * 0.4;
  // Tier-Auswahl nach Reputation: kleine Vereine Regional/National, grosse National/Premium.
  const tiers = rep >= 78 ? [275000, 500000, 275000] : rep >= 62 ? [275000, 100000, 275000] : [100000, 100000, 275000];
  const count = rnd() > 0.5 ? 3 : 2;
  const offers: SponsorOffer[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name = SHIRT_SPONSOR_NAMES[Math.floor(rnd() * SHIRT_SPONSOR_NAMES.length)];
    while (usedNames.has(name)) name = SHIRT_SPONSOR_NAMES[Math.floor(rnd() * SHIRT_SPONSOR_NAMES.length)];
    usedNames.add(name);
    const variance = 0.9 + rnd() * 0.25;
    const annual = round5000(tiers[i] * factor * variance);
    const years = 1 + Math.floor(rnd() * 5);
    offers.push({ name, annualValue: annual, years });
  }
  return offers.sort((a, b) => b.annualValue - a.annualValue);
}

/**
 * Banden-Grundwert (1975-DM/Jahr): `base = 80.000 + capacity/1000*1500 + reputation*800`,
 * gedeckelt auf 300.000, Boden 100.000.
 */
export function bandenBaseValue(club: Club): number {
  const cap = club.stadium?.capacity ?? 30000;
  const base = 80000 + (cap / 1000) * 1500 + club.reputation * 800;
  return Math.max(100000, Math.min(300000, base));
}

/** Erzeugt 2–3 Banden-Angebote (1975-DM/Jahr), Laufzeit 1–3 J. */
export function generateBandenOffers(club: Club, seasonSeed: string): SponsorOffer[] {
  const rnd = seedRand(`${club.id}-banden-${seasonSeed}`);
  const base = bandenBaseValue(club);
  const count = rnd() > 0.5 ? 3 : 2;
  const offers: SponsorOffer[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name = BANDEN_PARTNER_NAMES[Math.floor(rnd() * BANDEN_PARTNER_NAMES.length)];
    while (usedNames.has(name)) name = BANDEN_PARTNER_NAMES[Math.floor(rnd() * BANDEN_PARTNER_NAMES.length)];
    usedNames.add(name);
    const variance = 0.88 + rnd() * 0.28;
    const annual = Math.max(100000, Math.min(300000, round5000(base * variance)));
    const years = 1 + Math.floor(rnd() * 3);
    offers.push({ name, annualValue: annual, years });
  }
  return offers.sort((a, b) => b.annualValue - a.annualValue);
}
