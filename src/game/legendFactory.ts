// =============================================================================
// Ausnahmetalente der Fußballgeschichte – Erzeugung eines Spielers aus einem
// Datensatz-Eintrag (data/legends/types.ts). Ergebnis ist ein ganz normaler
// Spieler ohne jede Markierung: verfremdeter Name, echtes Geburtsdatum, Land,
// Position, Fuß, Größe, Spielertyp (Attribut-Schwerpunkte), Potenzial,
// Körperuhr (Frühreife/Langlebigkeit) und verdeckte Werte. Entwicklung danach
// über die normalen Systeme (engine/development.ts, engine/youth.ts).
// Ablauf/Zeitpunkt/Verein: game/legendsGame.ts.
// =============================================================================
import type { AttributeKey, Player, Position } from '../types';
import { clampStars, potentialToStars } from '../types';
import { LEGEND_TYPES, COUNTRY_FACE, type LegendDef } from '../data/legends/types';
import { ORIGINS, type Origin } from '../data/origins';
import { createPlayer } from '../engine/playerFactory';
import { generateYouthPlayer } from '../engine/youth';
import { applyOverallChange, ensureDevFields, refreshOverall } from '../engine/development';
import { ensurePositionSkill } from '../engine/positionSkill';
import { updateScoutEstimate } from '../engine/scouting';
import { wageForOverall } from '../engine/economy';
import { marketValueFor } from '../engine/clubEconomy';
import { originClubOf } from '../engine/persona';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** Deterministischer Zufall (mulberry32) aus einem Schlüssel. */
export function seededRng(key: string): () => number {
  let a = hashStr(key);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Alter an einem Datum (UTC, ganze Jahre). */
export function ageOn(birth: string, date: string): number {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [y, m, d] = date.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

/** Herkunft für Sprache/Namenspool (Nationalität und Gesicht kommen aus dem Eintrag). */
const COUNTRY_ORIGIN: Record<string, string> = {
  GER: 'ger', DDR: 'ger_ost', NED: 'ned', FRA: 'fra', ITA: 'ita', ESP: 'esp', ENG: 'eng', SCO: 'sco', POR: 'por',
  BEL: 'bel', DEN: 'den', SWE: 'swe', NOR: 'nor', POL: 'pol', UKR: 'rus', RUS: 'rus', CZE: 'cze', BUL: 'yug', CRO: 'cro',
  YUG: 'yug', SRB: 'srb', AUT: 'aut', SUI: 'sui', HUN: 'hun', TUR: 'tur', GRE: 'gre', BRA: 'bra', ARG: 'arg', URU: 'arg',
  LBR: 'gha', GHA: 'gha', NGA: 'nga', CMR: 'cmr', CIV: 'gha', EGY: 'mar', MAR: 'mar', JPN: 'jpn', KOR: 'kor', USA: 'usa',
  NIR: 'eng', IRL: 'eng', ROU: 'yug', CHI: 'arg', PER: 'arg', COL: 'arg', MEX: 'arg',
};
export function originFor(def: LegendDef): Origin {
  return ORIGINS[COUNTRY_ORIGIN[def.country] ?? ''] ?? ORIGINS.ger;
}

/** Kennung im Spiel: unauffällig (Hash statt Name). */
export function legendPlayerId(def: LegendDef, clubId: string, salt: string, youth: boolean, year: number): string {
  const h = hashStr(`${def.id}|${salt}`).toString(36);
  return youth ? `${clubId}_y_${year}x${h}` : `${clubId}_r${year}_x${h}`;
}

/**
 * Stärke eines fertigen Profis in einem Alter: altersgerechter Reifegrad (wie
 * engine/talent.ts), danach Höhepunkt bis ~29 (± Langlebigkeit), dann Abbau.
 * `noise` (0…1) = Umfeld der bisherigen Karriere (bis −2,5 Punkte).
 */
const RIPENESS: Record<number, number> = { 16: 0.68, 17: 0.74, 18: 0.79, 19: 0.84, 20: 0.88, 21: 0.92, 22: 0.95, 23: 0.97, 24: 0.99 };
export function legendStrengthAt(def: LegendDef, age: number, noise: number): number {
  const pot = def.potential;
  let s: number;
  if (age <= 24) s = pot * Math.min(1, (RIPENESS[Math.max(16, age)] ?? 0.68) + 0.08 * def.maturity);
  else {
    const peakEnd = 29 + 1.5 * def.longevity;
    s = age <= peakEnd ? pot - 1 : pot - 1 - (age - peakEnd) * 1.8;
  }
  return Math.round(clamp(s - noise * 2.5, 40, pot));
}

/** Spielertyp: Schwerpunkt-Attribute anheben (danach wird auf die Zielstärke ausgeglichen). */
function applyType(p: Player, def: LegendDef, rng: () => number, lift: number): void {
  const t = LEGEND_TYPES.find((x) => x.id === def.type);
  for (const k of t?.attrs ?? []) {
    const cur = p.attributes[k as AttributeKey] as number;
    (p.attributes as unknown as Record<string, number>)[k] = clamp(Math.round(cur + lift * (0.7 + rng() * 0.6)), 1, 99);
  }
}

/** Verdeckte Werte, Körperuhr, Potenzial und Persönlichkeit aus dem Eintrag übernehmen. */
function applyHidden(p: Player, def: LegendDef): void {
  const d = p.development, h = def.hidden;
  d.consistency = clamp(h.consistency, 1, 99);
  d.bigMatchTemperament = clamp(h.nerves, 1, 99);
  d.injuryProneness = clamp(h.injury, 0, 100);
  d.tempo = clamp(h.tempo, 0, 100);
  d.growthRate = 0.5 + d.tempo / 100 * 1.5; // Altbestand, gleiche Skala wie die Einschätzung früher
  d.professionalism = clamp(h.professionalism, 1, 99);
  d.ambition = clamp(h.ambition, 1, 99);
  d.adaptability = clamp(h.adaptability, 1, 99);
  d.clock = { m: clamp(def.maturity, -1, 1), l: clamp(def.longevity, -1, 1) };
  d.basePotential = def.potential;
  d.potentialAbility = def.potential;
  d.unfold = 0;
  delete d.gem;
  const pe = def.persona;
  const o = originClubOf(p.id);
  p.persona = {
    v: 1, ehrgeiz: Math.round(clamp(h.ambition, 3, 97)),
    loyalitaet: Math.round(clamp(pe?.loyalitaet ?? 55, 3, 97)), geld: Math.round(clamp(pe?.geld ?? 50, 3, 97)),
    heimat: Math.round(clamp(pe?.heimat ?? 55, 3, 97)), abenteuer: Math.round(clamp(pe?.abenteuer ?? 50, 3, 97)),
    rampenlicht: Math.round(clamp(pe?.rampenlicht ?? 50, 3, 97)), familie: Math.round(clamp(pe?.familie ?? 50, 3, 97)),
    homeClubId: o.homegrown ? o.clubId : undefined, originClubId: o.clubId ?? (p.clubId || undefined),
  };
}

/** Name, Herkunft, Körper und Positionen übernehmen. */
function applyIdentity(p: Player, def: LegendDef, date: string): void {
  const origin = originFor(def);
  p.firstName = def.firstName; p.lastName = def.lastName; p.fullName = `${def.firstName} ${def.lastName}`;
  p.dateOfBirth = def.birth; p.age = ageOn(def.birth, date);
  p.nationality = def.country === 'DDR' ? 'GER' : def.country;
  p.origin = origin.id;
  p.face = def.face ?? COUNTRY_FACE[def.country] ?? origin.face;
  if (def.height) { p.height = def.height; p.weight = Math.round(def.height - 105 + (def.pos === 'TW' ? 4 : 0)); }
  p.preferredFoot = def.foot;
  p.naturalPosition = def.pos;
  p.secondaryPositions = (def.pos2 ?? []).filter((x) => x !== def.pos) as Position[];
  delete p.positionSkill;
  ensurePositionSkill(p, date);
  // Nebenpositionen des Eintrags sind vertraut (mindestens „gut“), wie bei Datensatz-Positionen üblich.
  for (const pos of def.pos2 ?? []) if (p.positionSkill && pos !== def.pos) p.positionSkill.v[pos] = Math.max(p.positionSkill.v[pos] ?? 0, 82);
}

export interface LegendMake {
  clubId: string;
  date: string;
  salt: string;
  /** Akademie-Stufe des Vereins (nur Jugend). */
  academyLevel?: number;
}

/** Jugendspieler (15–19) beim Verein `clubId`. */
export function makeLegendYouth(def: LegendDef, m: LegendMake): Player {
  const year = Number(m.date.slice(0, 4));
  const age = clamp(ageOn(def.birth, m.date), 7, 19);
  const id = legendPlayerId(def, m.clubId, m.salt, true, year);
  const seed = id.slice(m.clubId.length + 3);
  const p = generateYouthPlayer(m.clubId, seed, m.date, Math.max(1, m.academyLevel ?? 2), age, { positions: [def.pos] });
  p.id = id;
  const rng = seededRng(`${id}|typ`);
  applyIdentity(p, def, m.date);
  applyHidden(p, def);
  applyType(p, def, rng, 6);
  // Ausgangsstärke: knapp unter der altersgerechten Obergrenze der Jugend (engine/youth.ts).
  const target = Math.round(def.potential * (0.63 + 0.035 * (age - 15) + 0.07 * def.maturity) * (0.86 + rng() * 0.05));
  refreshOverall(p);
  applyOverallChange(p, target - p.overall);
  refreshOverall(p);
  p.development.abilityHistory = [{ date: m.date, ability: p.overall }];
  const stars = clampStars(potentialToStars(def.potential));
  p.potentialStars = stars;
  const w = age <= 15 ? 1.0 : age <= 17 ? 0.75 : 0.5;
  p.scoutedPotentialMin = clampStars(stars - w * (0.5 + rng()));
  p.scoutedPotentialMax = clampStars(stars + w * rng());
  p.contract.transferValue = Math.round(p.overall * p.overall * 400);
  return p;
}

/** Profi beim Verein `clubId` (Startkader 1975 oder Wechsel). `noise` 0…1 = Karriereumfeld. */
export function makeLegendPro(def: LegendDef, m: LegendMake, noise: number): Player {
  const year = Number(m.date.slice(0, 4));
  const age = ageOn(def.birth, m.date);
  const id = legendPlayerId(def, m.clubId, m.salt, false, year);
  const rng = seededRng(`${id}|pro`);
  const target = legendStrengthAt(def, age, noise);
  const p = createPlayer({ id, clubId: m.clubId, pos: def.pos, age, strength: target, year, date: m.date, rng, origin: originFor(def) });
  applyIdentity(p, def, m.date);
  applyHidden(p, def);
  applyType(p, def, rng, 6);
  refreshOverall(p);
  applyOverallChange(p, target - p.overall);
  refreshOverall(p);
  // Erfahrung nach Alter (createPlayer würfelt sie unabhängig davon).
  p.attributes.experience = clamp(Math.max(p.attributes.experience, 20 + (age - 17) * 5), 1, 95);
  ensureDevFields(p);
  p.development.abilityHistory = [{ date: m.date, ability: p.overall }];
  p.potentialStars = clampStars(potentialToStars(Math.max(p.overall, def.potential)));
  p.contract.weeklyWage = Math.round(wageForOverall(p.overall) * (0.95 + rng() * 0.2));
  p.contract.expiryDate = `${year + 2 + Math.floor(rng() * 3)}-06-30`;
  p.contract.transferValue = marketValueFor(p, year);
  updateScoutEstimate(p, 0.2, false);
  return p;
}
