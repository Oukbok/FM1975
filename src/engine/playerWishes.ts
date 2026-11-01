// =============================================================================
// SPIELERWÜNSCHE — Wunschverein, Gehaltsforderung, Verzicht, Forderungen
// -----------------------------------------------------------------------------
// Reine Rechenlogik ohne Spielstand (Kontext kommt von game/playerWishesGame.ts).
// Gilt für dich UND alle KI-Vereine: Stars lehnen kleine Vereine ab, Talente
// wollen spielen, Loyale wechseln nie zum Erzrivalen, Routiniers suchen den
// letzten großen Vertrag oder die Nähe zur Familie.
//
// 1) Reiz eines Vereins (`clubAppeal`): Punkte je Faktor, 50 = neutral.
// 2) Gehalt (`wageDemand`): Marktgehalt × Liga × Phase × Geldgier, Bosman-
//    Aufschlag, Handgeld, Berater-Provision; Verzicht bei Wunschverein
//    (oder Aufschlag bei ungeliebtem Verein).
// 3) Wunsch-Versprechen (`promiseWeights`) nach Persönlichkeit und Lage.
// Alle Beträge sind Preisschilder in 1975-Basis (Gehalt pro Woche).
// =============================================================================
import { Club, Player } from '../types';
import { marketWage } from './clubEconomy';
import { clubWageLevel } from './economy';
import { CareerPhase, careerPhase, familyWeight, personaOf, PlayerPersona } from './persona';
import { hash01 } from './transferMarket';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Großstädte mit Medienrummel (Rampenlicht). */
const BIG_CITIES = ['Hamburg', 'München', 'Berlin', 'Köln', 'Frankfurt', 'Dortmund', 'Stuttgart', 'Düsseldorf', 'Gelsenkirchen', 'Bremen'];

export interface WishCtx {
  year: number;
  /** Aktueller Verein (null = vereinslos/Ausland). */
  current: Club | null;
  buyer: Club;
  /** Ligaebene des Käufers (1 = 1. Liga). */
  buyerTier: number;
  /** Käufer spielt (voraussichtlich) international. */
  buyerEuro: boolean;
  /** Spieler, die in seiner Positionsgruppe beim Käufer besser sind. */
  depthRank: number;
  /** Käufer ist Erzrivale seines jetzigen Vereins bzw. seines Jugendvereins. */
  rivalOfCurrent: boolean;
  rivalOfHome: boolean;
  /** Käufer liegt in seiner Heimatregion bzw. der jetzige Verein liegt dort. */
  buyerInHome: boolean;
  currentInHome: boolean;
  /** Wechsel ins Ausland. */
  abroad: boolean;
  /** Jahre beim jetzigen Verein. */
  yearsAtClub: number;
  /** Ablösefrei (Vertrag endet, ab Bosman). */
  freeAgent: boolean;
  /** Ruf des Trainers beim Käufer (eigener Verein: dein Ansehen) – optional. */
  coachRep?: number;
}

export interface AppealFactor { key: string; label: string; value: number }
export interface ClubAppeal {
  /** 0..100, 50 = neutral (wechselt zum Marktgehalt). */
  score: number;
  factors: AppealFactor[];
  /** Kommt nicht in Frage (z. B. Erzrivale). */
  dealBreaker?: string;
}

const PHASE_PLAYTIME: Record<CareerPhase, number> = { talent: 1.35, durchbruch: 1.3, peak: 1, letzterVertrag: 0.8, ausklang: 0.6 };

/** Reiz eines Vereins für den Spieler (deterministisch). */
export function clubAppeal(p: Player, ctx: WishCtx): ClubAppeal {
  const pe = personaOf(p);
  const phase = careerPhase(p);
  const f: AppealFactor[] = [];
  const add = (key: string, label: string, v: number) => { if (Math.abs(v) >= 0.5) f.push({ key, label, value: Math.round(v * 10) / 10 }); };
  const amb = pe.ehrgeiz;
  const fam = familyWeight(p, pe);

  // Größe gegenüber dem jetzigen Verein und gegenüber der eigenen Klasse.
  if (ctx.current && !ctx.abroad) {
    const gap = ctx.buyer.reputation - ctx.current.reputation;
    add('size', gap >= 0 ? 'größerer Verein' : 'kleinerer Verein', clamp(gap * (0.35 + amb / 180), -22, 22));
  }
  const lvl = ctx.buyer.reputation - p.overall;
  const lateDamp = phase === 'ausklang' ? 0.4 : phase === 'letzterVertrag' ? 0.7 : 1;
  if (lvl < -2) add('level', 'Verein unter seinem Niveau', Math.max(-24, (lvl + 2) * (0.35 + amb / 150) * lateDamp));
  else if (lvl > 4) add('level', 'Top-Adresse für ihn', Math.min(7, (lvl - 4) * 0.25 * (0.5 + amb / 100)));

  // Sportliche Perspektive: Stammplatz-Chance auf seiner Position.
  const pt = PHASE_PLAYTIME[phase] * (0.6 + amb / 125);
  const dr = ctx.depthRank;
  add('playtime', dr === 0 ? 'klare Aussicht auf einen Stammplatz' : dr === 1 ? 'gute Chance auf Einsätze' : dr === 2 ? 'Konkurrenzkampf auf seiner Position' : 'kaum Aussicht auf Einsätze',
    (dr === 0 ? 9 : dr === 1 ? 3 : dr === 2 ? -5 : -13) * pt);

  if (ctx.buyerEuro) add('euro', 'Europapokal', 3 + amb / 14 + pe.rampenlicht / 25);
  if (ctx.coachRep != null) add('coach', ctx.coachRep >= 60 ? 'renommierter Trainer' : 'unbekannter Trainer', clamp((ctx.coachRep - 60) * amb / 400, -5, 6));
  if (ctx.buyerTier >= 2) add('tier', 'tiefere Liga', -Math.min(40, (10 + amb / 6) * (ctx.buyerTier - 1)));

  // Heimat, Familie, Ausland
  const isHome = !!pe.homeClubId && pe.homeClubId === ctx.buyer.id;
  if (isHome && ctx.current?.id !== ctx.buyer.id) add('home', 'Heimkehr zum Jugendverein', 6 + pe.heimat / 8 + pe.loyalitaet / 12);
  else if (ctx.buyerInHome && !ctx.currentInHome) add('region', 'zurück in die Heimat', (pe.heimat - 30) / 6 + fam / 20);
  else if (!ctx.buyerInHome && ctx.currentInHome && !ctx.abroad) add('region', 'weg aus der Heimat', -(pe.heimat / 14 + fam / 12));
  if (ctx.abroad) add('abroad', pe.abenteuer >= 55 ? 'reizt das Ausland' : 'Ausland, fremde Sprache', (pe.abenteuer - 55) / 3 - fam / 8 - pe.heimat / 10);
  if (BIG_CITIES.some((c) => (ctx.buyer.city ?? '').startsWith(c)) || ctx.buyer.reputation >= 86) add('media', 'große Bühne', (pe.rampenlicht - 45) / 7);

  // Bindung an den jetzigen Verein, Unzufriedenheit
  if (ctx.current && !ctx.freeAgent && ctx.current.id !== ctx.buyer.id) {
    add('loyal', 'fühlt sich beim jetzigen Verein wohl', -pe.loyalitaet / 9 * clamp(ctx.yearsAtClub / 4, 0.25, 1.2));
    const sat = p.contract.satisfaction ?? 60;
    if (sat < 52) add('unhappy', 'unzufrieden beim jetzigen Verein', (55 - sat) / 2.2);
  }
  if (ctx.freeAgent) add('free', 'sucht einen neuen Vertrag', 3);

  // Erzrivale
  let dealBreaker: string | undefined;
  if (ctx.rivalOfCurrent || ctx.rivalOfHome) {
    const tied = ctx.rivalOfHome || ctx.yearsAtClub >= 3;
    add('rival', 'Wechsel zum Rivalen', -(tied ? pe.loyalitaet / 4 + pe.heimat / 8 : pe.loyalitaet / 10));
    if (pe.loyalitaet >= 70 && (ctx.rivalOfHome || ctx.yearsAtClub >= 5)) dealBreaker = 'Zum Erzrivalen wechselt er nie – das würden ihm die Fans nicht verzeihen.';
  }
  const score = Math.round(clamp(50 + f.reduce((s, x) => s + x.value, 0), 0, 100));
  f.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { score, factors: f, dealBreaker };
}

// -----------------------------------------------------------------------------
// Berater (ab den 1990ern wichtig)
// -----------------------------------------------------------------------------
/**
 * Berater: In den 70ern verhandeln die meisten selbst (oder mit einem Anwalt).
 * Private Arbeitsvermittlung ist in Deutschland bis 1994 Sache der Bundesanstalt
 * für Arbeit; die FIFA regelt Spielervermittler ab 1994. Nach Bosman (1995)
 * hat praktisch jeder Profi einen Berater; üblich sind 5–10 % des Gehalts.
 */
export function agentShare(year: number): number {
  return year < 1985 ? 0.03 : year < 1994 ? 0.05 : year < 2001 ? 0.07 : 0.1;
}
export function hasAgent(p: Player, year: number): boolean {
  const base = year < 1985 ? 0.12 : year < 1994 ? 0.4 : year < 2001 ? 0.85 : 0.97;
  return hash01(p.id + '|berater') < clamp(base + (p.overall - 75) / 120, 0, 1);
}

// -----------------------------------------------------------------------------
// Gehalt
// -----------------------------------------------------------------------------
export interface WageDemand {
  /** Marktgehalt beim Käufer (ohne Persönlichkeit). */
  market: number;
  /** Echte Untergrenze (verdeckt). */
  min: number;
  /** Eröffnungsforderung (Berater bzw. Spieler selbst). */
  ask: number;
  /** Verzicht (+) bzw. Aufschlag (−) gegenüber seinem Normalwert, Anteil. */
  cut: number;
  /** Erwartetes Handgeld (Einmalzahlung). */
  signingFee: number;
  /** Provision des Beraters (Einmalzahlung des Vereins), 0 ohne Berater. */
  agentFee: number;
  agent: boolean;
  years: [number, number];
}

const PHASE_WAGE: Record<CareerPhase, number> = { talent: 0.85, durchbruch: 0.95, peak: 1, letzterVertrag: 1.08, ausklang: 0.9 };
const PHASE_YEARS: Record<CareerPhase, [number, number]> = { talent: [3, 5], durchbruch: [2, 5], peak: [2, 4], letzterVertrag: [2, 3], ausklang: [1, 2] };

/** Gehaltsforderung bei einem Wechsel (`appeal` = Reiz des Käufers). */
export function wageDemand(p: Player, buyer: Club, year: number, appeal: ClubAppeal, freeAgent: boolean, moving = true): WageDemand {
  const pe = personaOf(p);
  const phase = careerPhase(p);
  const market = marketWage(p) * clubWageLevel(buyer, year);
  let norm = market * PHASE_WAGE[phase] * (1 + (pe.geld - 50) / 220);
  if (buyer.reputation >= 80) norm *= 1 + (buyer.reputation - 80) / 120; // große Vereine zahlen mehr
  const bosman = freeAgent && year >= 1996;
  if (bosman) norm *= 1.1; // Bosman: Die gesparte Ablöse fließt teils ins Gehalt
  if (moving && phase !== 'ausklang') norm = Math.max(norm, p.contract.weeklyWage * 1.06);
  // Verzicht nur, wenn der Verein ihn reizt – Geldgierige verzichten kaum.
  const cut = clamp((appeal.score - 50) / 120, -0.35, 0.3) * (1.15 - pe.geld / 100);
  const min = Math.round(norm * (1 - cut) / 10) * 10;
  const agent = hasAgent(p, year);
  const h = hash01(p.id + '|agent');
  const ask = Math.round(min * (agent ? 1.12 + h * 0.15 : 1.04 + h * 0.06) / 10) * 10;
  const years = PHASE_YEARS[phase];
  // Handgeld: vor Bosman klein, danach ersetzt es bei ablösefreien Wechseln einen Teil der Ablöse.
  const weeks = bosman ? 8 + pe.geld / 6 : year >= 1996 ? pe.geld / 12 : pe.geld / 25;
  const signingFee = Math.round(min * weeks / 100) * 100;
  const agentFee = agent ? Math.round(agentShare(year) * min * 52 * ((years[0] + years[1]) / 2) / 100) * 100 : 0;
  return { market: Math.round(market), min, ask, cut, signingFee, agentFee, agent, years };
}

// -----------------------------------------------------------------------------
// Wunsch-Versprechen
// -----------------------------------------------------------------------------
export type WishPromise = 'stammplatz' | 'kapitaen' | 'europa' | 'titel' | 'stars' | 'entwicklung' | 'freigabe' | 'umzug' | 'wunschposition' | 'keinRivale';

/** Gewicht (0..12) je Versprechen, wichtigstes zuerst. */
export function promiseWeights(p: Player, ctx: { depthRank: number; buyerRep: number; foreignMove: boolean; rivals: boolean }): [WishPromise, number][] {
  const pe: PlayerPersona = personaOf(p);
  const phase = careerPhase(p);
  const h = (k: string) => hash01(p.id + '|w|' + k);
  const fam = familyWeight(p, pe);
  const sp = phase === 'ausklang' ? 3 : phase === 'letzterVertrag' ? 5 : 6 + pe.ehrgeiz / 20;
  const w: [WishPromise, number][] = [
    ['stammplatz', sp + (ctx.depthRank >= 2 ? 3 : 0) + h('s') * 2],
    ['titel', 1 + pe.ehrgeiz / 12 + h('t')],
    ['europa', 1 + pe.ehrgeiz / 16 + pe.rampenlicht / 25 + h('e')],
    ['stars', pe.ehrgeiz / 14 + h('x') * 2],
    ['kapitaen', p.age >= 25 ? pe.rampenlicht / 14 + pe.loyalitaet / 30 + h('k') : 0],
    ['entwicklung', p.age <= 21 ? 7 + h('j') * 4 : 0],
    ['freigabe', ctx.buyerRep < 85 ? pe.ehrgeiz / 16 + pe.abenteuer / 20 + h('f') : 0],
    ['umzug', fam / 10 + (ctx.foreignMove ? 4 : 0) + h('u')],
    ['wunschposition', 1.5 + h('p') * 4 - Math.min(2, (p.secondaryPositions?.length ?? 0))],
    ['keinRivale', ctx.rivals ? (pe.loyalitaet + pe.heimat) / 25 - 1.5 : 0],
  ];
  return w.map(([k, v]) => [k, Math.round(clamp(v, 0, 12) * 10) / 10] as [WishPromise, number]).filter((x) => x[1] > 0.5).sort((a, b) => b[1] - a[1]);
}

/** Verbale Stufe des Interesses. */
export function interestText(score: number): { text: string; level: 0 | 1 | 2 | 3 } {
  if (score >= 66) return { text: 'Will unbedingt zu euch', level: 3 };
  if (score >= 50) return { text: 'Offen für einen Wechsel', level: 2 };
  if (score >= 36) return { text: 'Zögerlich – nur mit gutem Angebot', level: 1 };
  return { text: 'Kein Interesse', level: 0 };
}
