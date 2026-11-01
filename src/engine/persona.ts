// =============================================================================
// SPIELERPERSÖNLICHKEIT — Charakterzüge, Karrierephase, Heimat
// -----------------------------------------------------------------------------
// Jeder Spieler hat sieben verdeckte Züge (0–100). Sie entstehen
// deterministisch aus der Spieler-ID (gleicher Spieler = gleiche Persönlichkeit)
// und stützen sich auf vorhandene Werte (Ehrgeiz aus der Entwicklung). Daraus
// leiten engine/playerWishes.ts Wunschvereine, Gehaltsforderung,
// Verzichtsbereitschaft und Wunsch-Versprechen ab.
//   ehrgeiz      – will nach oben, Titel, Europapokal, große Vereine
//   loyalitaet   – bleibt gern, wechselt nie zum Erzrivalen
//   geld         – Geldgier: höhere Forderung, kaum Verzicht
//   heimat       – Heimatverbundenheit: Region/Jugendverein
//   abenteuer    – reizt Ausland und Neues
//   rampenlicht  – Mediengeilheit: große Städte, Kapitänsbinde, Bühne
//   familie      – Familie: Stabilität, keine Umzüge, Nähe zur Heimat
// Alte Spielstände: `migratePersonas` (game/playerWishesGame.ts) rüstet nach.
// =============================================================================
import { Player } from '../types';
import { hash01 } from './transferMarket';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type PersonaTrait = 'ehrgeiz' | 'loyalitaet' | 'geld' | 'heimat' | 'abenteuer' | 'rampenlicht' | 'familie';
export const TRAITS: PersonaTrait[] = ['ehrgeiz', 'loyalitaet', 'geld', 'heimat', 'abenteuer', 'rampenlicht', 'familie'];
export const TRAIT_LABEL: Record<PersonaTrait, string> = {
  ehrgeiz: 'Ehrgeiz', loyalitaet: 'Loyalität', geld: 'Geld', heimat: 'Heimatverbundenheit',
  abenteuer: 'Abenteuerlust', rampenlicht: 'Rampenlicht', familie: 'Familie',
};

export interface PlayerPersona {
  /** Version der Erzeugung (für spätere Nachrüstungen). */
  v: 1;
  ehrgeiz: number;
  loyalitaet: number;
  geld: number;
  heimat: number;
  abenteuer: number;
  rampenlicht: number;
  familie: number;
  /** Jugendverein (Spieler aus einer Vereinsakademie). */
  homeClubId?: string;
  /** Verein, aus dem er ursprünglich stammt (ID-Präfix), für Heimatregion. */
  originClubId?: string;
}

/** Glockenförmiger Wert 0..100 aus zwei Hashes (selten extrem). */
function bell(id: string, k: string, mid = 50, spread = 28): number {
  const a = hash01(`${id}|${k}|a`), b = hash01(`${id}|${k}|b`);
  return Math.round(clamp(mid + ((a + b) - 1) * spread * 1.6, 3, 97));
}

/** Herkunftsverein aus der Spieler-ID (`<club>_p3`, `<club>_y_…`, `<club>_r1990_…`). */
export function originClubOf(id: string): { clubId?: string; homegrown: boolean } {
  const y = id.indexOf('_y_');
  if (y > 0) return { clubId: id.slice(0, y), homegrown: true };
  const m = /^(.+?)_(p\d+|r\d{4}_.*)$/.exec(id);
  if (m) return { clubId: m[1], homegrown: false };
  return { homegrown: false };
}

/** Persönlichkeit erzeugen (deterministisch, ohne Spielstand). */
export function makePersona(p: Player): PlayerPersona {
  const id = p.id;
  const dev = p.development;
  const o = originClubOf(id);
  const foreign = !!p.nationality && p.nationality !== 'GER' && p.nationality !== 'Deutschland';
  const ehrgeiz = Math.round(clamp((dev.ambition ?? bell(id, 'eh')) * 0.75 + bell(id, 'eh2') * 0.25, 3, 97));
  const loyalitaet = clamp(bell(id, 'lo') + (o.homegrown ? 12 : 0) - (ehrgeiz - 50) * 0.2, 3, 97);
  const geld = clamp(bell(id, 'gi') + (100 - (dev.professionalism ?? 50)) * 0.12 - 6, 3, 97);
  const heimat = clamp(bell(id, 'he') + (o.homegrown ? 10 : 0) - (foreign ? 8 : 0), 3, 97);
  const abenteuer = clamp(bell(id, 'ab') - (heimat - 50) * 0.3 + (foreign ? 10 : 0), 3, 97);
  const rampenlicht = clamp(bell(id, 'ra') + (ehrgeiz - 50) * 0.2, 3, 97);
  const familie = clamp(bell(id, 'fa', 45), 3, 97);
  return {
    v: 1, ehrgeiz, loyalitaet: Math.round(loyalitaet), geld: Math.round(geld), heimat: Math.round(heimat),
    abenteuer: Math.round(abenteuer), rampenlicht: Math.round(rampenlicht), familie: Math.round(familie),
    homeClubId: o.homegrown ? o.clubId : undefined, originClubId: o.clubId ?? (p.clubId || undefined),
  };
}

/** Persönlichkeit lesen; fehlt sie (alte Spielstände, neue Spieler), wird sie erzeugt und gespeichert. */
export function personaOf(p: Player): PlayerPersona {
  if (!p.persona || p.persona.v !== 1) p.persona = makePersona(p);
  return p.persona;
}

/** Familie wiegt mit dem Alter schwerer (Kinder, Schule). */
export function familyWeight(p: Player, pe: PlayerPersona): number {
  return pe.familie * clamp((p.age - 20) / 10, 0.2, 1.2);
}

// -----------------------------------------------------------------------------
// Karrierephase
// -----------------------------------------------------------------------------
export type CareerPhase = 'talent' | 'durchbruch' | 'peak' | 'letzterVertrag' | 'ausklang';
export const PHASE_LABEL: Record<CareerPhase, string> = {
  talent: 'Talent – will spielen und lernen',
  durchbruch: 'Durchbruch – will sich durchsetzen',
  peak: 'Leistungshöhepunkt – will gewinnen',
  letzterVertrag: 'Spätphase – der letzte große Vertrag',
  ausklang: 'Karriereausklang – Ruhe und Nähe zur Familie',
};

export function careerPhase(p: Player): CareerPhase {
  if (p.age <= 20) return 'talent';
  if (p.age <= 24) return 'durchbruch';
  if (p.age <= 29) return 'peak';
  if (p.age <= 32) return 'letzterVertrag';
  return 'ausklang';
}

// -----------------------------------------------------------------------------
// Charakter in Worten
// -----------------------------------------------------------------------------
const ARCHETYPE: Record<PersonaTrait, string> = {
  ehrgeiz: 'Karrierist', loyalitaet: 'Vereinsmensch', geld: 'Geschäftsmann', heimat: 'Heimatverbundener',
  abenteuer: 'Weltenbummler', rampenlicht: 'Rampensau', familie: 'Familienmensch',
};

/** Kurzbeschreibung aus den beiden stärksten Zügen, z. B. „Ehrgeiziger Karrierist“. */
export function personaTitle(pe: PlayerPersona): string {
  const ranked = TRAITS.map((t) => [t, pe[t]] as [PersonaTrait, number]).sort((a, b) => b[1] - a[1]);
  const [first, second] = ranked;
  if (first[1] < 58) return 'Ausgeglichener Typ';
  const adj: Record<PersonaTrait, string> = {
    ehrgeiz: 'Ehrgeiziger', loyalitaet: 'Treuer', geld: 'Geschäftstüchtiger', heimat: 'Bodenständiger',
    abenteuer: 'Neugieriger', rampenlicht: 'Extrovertierter', familie: 'Häuslicher',
  };
  const clash = (a: PersonaTrait, b: PersonaTrait) => [a, b].includes('abenteuer') && ([a, b].includes('heimat') || [a, b].includes('familie'));
  return second[1] >= 58 && !clash(first[0], second[0]) ? `${adj[second[0]]} ${ARCHETYPE[first[0]]}` : ARCHETYPE[first[0]];
}

/** Grobe Einstufung für die Anzeige, abhängig vom Wissen (0..1). */
export function traitBand(value: number, knowledge: number, seed: string): { text: string; lo: number; hi: number } {
  const err = Math.round(30 - 26 * clamp(knowledge, 0, 1));
  const bias = Math.round((hash01(seed) * 2 - 1) * err * 0.5);
  const mid = clamp(value + bias, 0, 100);
  const lo = clamp(mid - err, 0, 100), hi = clamp(mid + err, 0, 100);
  const text = knowledge < 0.15 ? 'unbekannt' : mid >= 75 ? 'sehr hoch' : mid >= 60 ? 'hoch' : mid >= 40 ? 'mittel' : mid >= 25 ? 'niedrig' : 'sehr niedrig';
  return { text, lo, hi };
}
