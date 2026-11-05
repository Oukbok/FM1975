// =============================================================================
// SPONSORING 2.0 — Rechenlogik ohne Spielstand: Marktwert je Werbefläche,
// Angebote mit Klauseln, Verhandlung, Monatsraten, Fanartikel weltweit,
// Betriebs- und Vermarktungskosten. Spielablauf: game/sponsorGame.ts.
//
// Wert eines Vertrags (nominal) = Stützwert der Fläche (Median-Erstligist, Jahr)
//   × Reichweite^Exponent (Marke im Verhältnis zum Median; der Exponent wächst mit der
//     Globalisierung von 1,25 (1975) auf 2,5 (ab 2020) – Superstars ziehen das Geld an)
//   × Liga-Anteil (Unterklassige wachsen nur anteilig mit, wie tierScale)
//   × Banden: Zuschauer und TV-Präsenz, ab 2010 LED
//   × Zufall (0,85–1,15) × Klausel-Aufschläge.
// Gespeichert wird in 1975-Basis (÷ economyScale des Abschlussjahres), gebucht wird
// × economyScale des Buchungsjahres: Lange Verträge folgen der Inflation, aber nicht
// dem schneller wachsenden Werbemarkt – Verlängerungen bringen dann den Sprung.
// =============================================================================
import { COUNTRY_BY_ID, INDUSTRY_BY_ID, LED_YEAR, SLOT_BY_ID, SPONSOR_SLOTS, SponsorSlotDef, industryBan, industryImage, slotAnchorValue, tvEra } from '../data/sponsorCatalog';
import { SPONSOR_FIRMS } from '../data/sponsorNames';
import { campDestination } from '../data/campDestinations';
import { Club, ClubBrand } from '../types';
import type { CampObligation, SponsorBonuses, SponsorClause, SponsorDeal, SponsorDealOffer, SponsorIndustry, SponsorSlotId } from '../types/sponsor';
import { brandFromReputation, brandIndex, ensureBrand, internationalWeight } from './clubEconomy';
import { economyScale, revenueScale, tierScale } from './economy';
import { hashStr, mulberry32 } from './leagues';
import { campYear, destinationStatus } from './trainingCamp';

export const SPONSOR_V = 1;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1k = (n: number) => Math.round(n / 1000) * 1000;

// -----------------------------------------------------------------------------
// Reichweite & Marktwert
// -----------------------------------------------------------------------------
/** Ruf des Median-Erstligisten (Bezug der Reichweite: Zugkraft 1). */
export const REACH_REF_REP = 74;

function reachOf(b: ClubBrand, year: number, mode: SponsorSlotDef['reach']): number {
  if (mode === 'regional') return b.regional;
  if (mode === 'national') return brandIndex(b, year);
  return 0.25 * b.regional + 0.4 * b.national + (internationalWeight(year) + 0.25) * b.international;
}

/** Reichweite eines Vereins für eine Fläche (regional / national / global). */
export function reachIndex(c: Club, year: number, mode: SponsorSlotDef['reach']): number {
  const b = ensureBrand(c);
  if (mode === 'regional') return b.regional;
  if (mode === 'national') return brandIndex(b, year);
  // Weltkonzerne: nationale Bühne plus internationale Strahlkraft (gewichtet nach Epoche).
  return 0.25 * b.regional + 0.4 * b.national + (internationalWeight(year) + 0.25) * b.international;
}

/** Exponent der Reichweite: 1975 1,25 → ab 2020 2,5 (Globalisierung, „Superstar-Effekt“). */
export function pullExponent(year: number): number {
  return 1.25 + 1.25 * clamp((year - 1975) / 45, 0, 1);
}

/** Zugkraft eines Vereins gegenüber dem Median-Erstligisten (Median ≈ 1). */
export function sponsorPull(c: Club, year: number, mode: SponsorSlotDef['reach']): number {
  const ratio = Math.max(0.1, reachIndex(c, year, mode)) / Math.max(10, reachOf(brandFromReputation(REACH_REF_REP), year, mode));
  const expo = mode === 'regional' ? 1 : pullExponent(year);
  return clamp(Math.pow(ratio, expo), 0.12, 9);
}

/** Anteil einer Liga-Ebene am Werbemarkt der 1. Liga (wie tierScale; regional wie das Stadiongeschäft). */
export function tierShare(year: number, tier: number, mode: SponsorSlotDef['reach']): number {
  if (tier <= 1) return 1;
  const kind = mode === 'regional' ? 'matchday' : 'commercial';
  const s = revenueScale(kind, year);
  return s <= 1 ? (tier >= 5 ? 0.3 : 1 / tier) : tierScale(s, tier, kind) / s;
}

/** Fernsehpräsenz eines Vereins 0–1,2 (Epoche, nationale Bekanntheit, Europapokal). */
export function tvPresence(c: Club, year: number, euro = false): number {
  const b = ensureBrand(c);
  return clamp(tvEra(year) * (0.55 + 0.45 * b.national / 100) + (euro ? 0.1 : 0), 0, 1.2);
}

/** Banden: Zuschauer (Kapazität) × TV-Präsenz, ab 2010 LED-Banden (+20 %). */
export function bandenFactor(c: Club, year: number): number {
  const cap = Math.max(5000, c.stadium?.capacity ?? 30000);
  return (0.55 + 0.6 * tvPresence(c, year)) * Math.pow(cap / 40000, 0.35) * (year >= LED_YEAR ? 1.2 : 1);
}

/** Wachstum über das letzte Stützjahr hinaus (Vermarktungsmarkt). */
function anchorValue(def: SponsorSlotDef, year: number): number | null {
  const v = slotAnchorValue(def, year);
  if (v == null) return null;
  const last = def.value[def.value.length - 1][0];
  return year > last ? v * revenueScale('commercial', year) / revenueScale('commercial', last) : v;
}

/** Ist die Fläche in diesem Jahr vermarktbar? */
export function slotOpen(def: SponsorSlotDef, year: number, tier: number): boolean {
  if (year < def.unlock) return false;
  if (def.until != null && year > def.until) return false;
  return def.count(year, tier) > 0;
}

/** Marktwert einer Fläche (nominal, Jahreswert, ohne Zufall/Klauseln). */
export function slotMarketValue(c: Club, slot: SponsorSlotId, year: number, tier: number): number {
  const def = SLOT_BY_ID[slot];
  const a = anchorValue(def, year);
  if (a == null) return 0;
  const banden = slot === 'banden' ? bandenFactor(c, year) : 1;
  return a * sponsorPull(c, year, def.reach) * tierShare(year, tier, def.reach) * banden;
}

// -----------------------------------------------------------------------------
// Angebote
// -----------------------------------------------------------------------------
export interface OfferContext {
  club: Club;
  year: number;
  season: string;
  tier: number;
  /** Bestehende Verträge (Exklusivität, keine Doppelnamen). */
  deals: SponsorDeal[];
  /** Weitere vergebene Namen (offene Angebote). */
  taken?: Set<string>;
  /** Gültig bis. */
  until: string;
}

function pickWeighted<T>(items: T[], w: (t: T) => number, rng: () => number): T | undefined {
  const ws = items.map((x) => Math.max(0, w(x)));
  const sum = ws.reduce((a, b) => a + b, 0);
  if (sum <= 0) return undefined;
  let r = rng() * sum;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

/** Branchen, die wegen Exklusivität eines laufenden Vertrags gesperrt sind. */
export function exclusiveIndustries(deals: SponsorDeal[]): Set<SponsorIndustry> {
  return new Set(deals.filter((d) => d.clauses.some((k) => k.kind === 'exclusive')).map((d) => d.industry));
}

/** Kann der Verein das Pflicht-Ziel in diesem Fenster überhaupt bereisen? */
function campPossible(c: Club, destId: string, window: 'winter' | 'summer', season: string): boolean {
  const d = campDestination(destId);
  if (!d) return false;
  return destinationStatus(d, window, campYear(season, window), c.reputation ?? 50).ok;
}

/** Erzeugt bis zu `n` Angebote für eine Fläche (deterministisch je Schlüssel). */
export function makeOffers(ctx: OfferContext, slot: SponsorSlotId, n: number, key: string): SponsorDealOffer[] {
  const def = SLOT_BY_ID[slot];
  const { club, year, tier } = ctx;
  if (!slotOpen(def, year, tier)) return [];
  const rng = mulberry32(hashStr(`${club.id}|${slot}|${ctx.season}|${key}`));
  const blocked = exclusiveIndustries(ctx.deals);
  const taken = new Set([...(ctx.taken ?? []), ...ctx.deals.map((d) => d.partner)]);
  const industries = def.industries.filter((i) => !blocked.has(i) && !industryBan(i, slot, year));
  const market = slotMarketValue(club, slot, year, tier);
  const scale = economyScale(year);
  const pull = sponsorPull(club, year, def.reach);
  const out: SponsorDealOffer[] = [];
  for (let k = 0; k < n * 3 && out.length < n; k++) {
    const ind = pickWeighted(industries, (i) => INDUSTRY_BY_ID[i].weight(year), rng);
    if (!ind) break;
    // Ausländische Konzerne interessieren sich nur für Vereine mit Strahlkraft.
    const firms = SPONSOR_FIRMS[ind].filter((f) => (f.from ?? 0) <= year && (f.to ?? 9999) >= year && !taken.has(f.name)
      && (COUNTRY_BY_ID[f.country]?.from ?? 0) <= year && (COUNTRY_BY_ID[f.country]?.to ?? 9999) >= year
      && (f.country === 'DE' || slot === 'ausruester' || pull >= 0.8 || def.reach === 'global'));
    const firm = pickWeighted(firms, (f) => (f.country === 'DE' ? 2.5 : COUNTRY_BY_ID[f.country]?.weight ?? 0.5), rng);
    if (!firm) continue;
    taken.add(firm.name);
    let value = market * (0.85 + rng() * 0.3);
    const clauses: SponsorClause[] = [];
    const bonuses: SponsorBonuses = {};
    const country = COUNTRY_BY_ID[firm.country];
    // Pflichtreise ins Herkunftsland (nur wenn das Ziel für den Verein buchbar ist).
    if (country?.camp && year >= country.camp.from && slot !== 'regional' && slot !== 'jugend'
      && campPossible(club, country.camp.destId, country.camp.window, ctx.season)
      && rng() < (firm.country === 'QA' || firm.country === 'AE' ? 0.75 : 0.45)) {
      clauses.push({ kind: 'camp', destId: country.camp.destId, window: country.camp.window });
      value *= 1.12;
    }
    if ((slot === 'brust' || slot === 'premium') && firm.country === 'DE' && rng() < 0.2) {
      clauses.push({ kind: 'friendly' });
      value *= 1.04;
    }
    // Abstieg: Ausstieg oder Kürzung (für Spitzenklubs seltener).
    if (tier <= 2 && slot !== 'ausruester' && rng() < ((club.reputation ?? 60) >= 82 ? 0.3 : 0.7)) {
      if (rng() < 0.45) clauses.push({ kind: 'relegationExit' });
      else clauses.push({ kind: 'relegationCut', cut: Math.round((0.3 + rng() * 0.2) * 100) / 100 });
    }
    if ((club.reputation ?? 60) >= 78 && (slot === 'brust' || slot === 'premium' || slot === 'aermel') && rng() < 0.35) {
      clauses.push({ kind: 'minPlace', place: (club.reputation ?? 60) >= 86 ? 4 : 6, cut: Math.round((0.15 + rng() * 0.1) * 100) / 100 });
      value *= 1.08;
    }
    if ((slot === 'premium' || slot === 'copartner') && rng() < 0.4) {
      clauses.push({ kind: 'exclusive' });
      value *= 1.1;
    }
    if ((slot === 'brust' || slot === 'ausruester') && rng() < 0.3) clauses.push({ kind: 'option', years: 2, raise: 0.1 });
    if (slot === 'jugend') clauses.push({ kind: 'youth', share: 0.3 });
    const img = industryImage(ind, year, firm.country);
    if (img > 0) {
      clauses.push({ kind: 'image', level: img });
      value *= 1 + 0.08 * img; // umstrittene Sponsoren zahlen mehr
    }
    if (def.bonuses) {
      const b = value / scale;
      if (tier <= 1) bonuses.title = r1k(b * (0.15 + rng() * 0.15));
      bonuses.cup = r1k(b * (0.05 + rng() * 0.05));
      if (year >= 1975 && (club.reputation ?? 60) >= 70) bonuses.euro = r1k(b * (0.08 + rng() * 0.08));
      if ((club.reputation ?? 60) < 72 && tier <= 2) bonuses.survive = r1k(b * (0.06 + rng() * 0.06));
    }
    const years = def.years[0] + Math.floor(rng() * (def.years[1] - def.years[0] + 1));
    out.push({
      id: `${slot}-${ctx.season}-${key}-${out.length}`, slot, partner: firm.name, industry: ind, country: firm.country,
      annualValue: Math.max(500, Math.round(value / scale / 500) * 500), years, bonuses, clauses,
      interest: clamp(0.35 + rng() * 0.45 + (pull - 1) * 0.08, 0.2, 0.95), rounds: 0, until: ctx.until,
    });
  }
  return out.sort((a, b) => b.annualValue - a.annualValue);
}

/** Angebot → Vertrag. */
export function offerToDeal(o: SponsorDealOffer, season: string): SponsorDeal {
  return {
    id: `d-${o.id}`, slot: o.slot, partner: o.partner, industry: o.industry, country: o.country,
    annualValue: o.annualValue, yearsTotal: o.years, yearsLeft: o.years, since: season,
    bonuses: { ...o.bonuses }, clauses: o.clauses.map((k) => ({ ...k })),
  };
}

// -----------------------------------------------------------------------------
// Verhandlung
// -----------------------------------------------------------------------------
export interface CounterRequest {
  /** Gewünschter Jahreswert (1975-Basis). */
  annualValue: number;
  years: number;
  /** Klauseln, die gestrichen werden sollen (Index in offer.clauses). */
  drop: number[];
}

export interface CounterResult { outcome: 'accept' | 'meet' | 'hold' | 'withdraw'; offer: SponsorDealOffer; text: string }

/** Aufschlag, den eine Klausel dem Sponsor wert ist (Streichen kostet das). */
export function clausePremium(k: SponsorClause): number {
  switch (k.kind) {
    case 'camp': return 0.12;
    case 'friendly': return 0.04;
    case 'minPlace': return 0.08;
    case 'exclusive': return 0.1;
    case 'relegationExit': return 0.06;
    case 'relegationCut': return 0.04;
    case 'image': return 0;
    case 'option': return -0.04; // die Option nützt dem Verein – Streichen bringt etwas
    case 'youth': return 0;
  }
}

/** Klauseln, die der Sponsor nie streicht (Kern des Deals). */
export function clauseFixed(k: SponsorClause): boolean {
  return k.kind === 'image' || k.kind === 'youth';
}

/** Gegenangebot: Der Sponsor nimmt an, kommt entgegen, bleibt hart oder zieht zurück. */
export function counterOffer(o: SponsorDealOffer, req: CounterRequest): CounterResult {
  const rng = mulberry32(hashStr(`${o.id}|${o.rounds}|${req.annualValue}|${req.years}|${req.drop.join(',')}`));
  const drop = req.drop.filter((i) => o.clauses[i] && !clauseFixed(o.clauses[i]));
  const dropCost = drop.reduce((a, i) => a + clausePremium(o.clauses[i]), 0);
  // Was der Sponsor für die gewünschten Bedingungen gerade noch zahlen würde.
  const fair = o.annualValue * (1 - dropCost) * (1 + (req.years - o.years) * 0.02);
  const ask = req.annualValue / Math.max(1, fair);
  const p = clamp(o.interest * 1.15 - Math.max(0, ask - 1) * 3.2 - o.rounds * 0.12, 0.03, 0.95);
  const next: SponsorDealOffer = { ...o, rounds: o.rounds + 1, clauses: [...o.clauses], bonuses: { ...o.bonuses } };
  const roll = rng();
  if (ask <= 1.0001 || roll < p) {
    next.annualValue = Math.round(req.annualValue / 500) * 500;
    next.years = req.years;
    next.clauses = o.clauses.filter((_, i) => !drop.includes(i));
    next.reply = 'Einverstanden – wir unterschreiben zu deinen Bedingungen.';
    return { outcome: 'accept', offer: next, text: next.reply };
  }
  if (roll > 0.85 + p * 0.1 || (o.rounds >= 1 && ask > 1.25)) {
    next.reply = 'Der Sponsor bricht die Gespräche ab.';
    return { outcome: 'withdraw', offer: next, text: next.reply };
  }
  if (roll < p + 0.35 && ask > 1) {
    // Entgegenkommen: Hälfte der Differenz, Klauseln bleiben.
    next.annualValue = Math.round((o.annualValue + (Math.min(req.annualValue, fair * 1.3) - o.annualValue) / 2) / 500) * 500;
    next.reply = 'Wir kommen dir entgegen – mehr ist nicht drin.';
    return { outcome: 'meet', offer: next, text: next.reply };
  }
  next.reply = 'Wir bleiben bei unserem Angebot.';
  return { outcome: 'hold', offer: next, text: next.reply };
}

// -----------------------------------------------------------------------------
// Laufende Einnahmen
// -----------------------------------------------------------------------------
/** Jahreswert eines Vertrags (nominal) im Jahr X, nach Kürzungen. */
export function dealAnnualNominal(d: SponsorDeal, year: number): number {
  return d.annualValue * (1 - (d.cut ?? 0)) * economyScale(year);
}

/** Monatsraten aus allen Verträgen (nominal): Sponsoring- und Werbe-Topf. */
export function sponsorMonthly(c: Club, year: number): { sponsorship: number; advertising: number } {
  let sponsorship = 0, advertising = 0;
  for (const d of c.commerce?.deals ?? []) {
    const m = dealAnnualNominal(d, year) / 12;
    if (SLOT_BY_ID[d.slot]?.bucket === 'advertising') advertising += m; else sponsorship += m;
  }
  return { sponsorship: Math.round(sponsorship), advertising: Math.round(advertising) };
}

/**
 * Fanartikel weltweit (Lizenzen, Versand an Fans im Ausland, Kollektionen): nur für
 * international bekannte Vereine, wächst mit dem Vermarktungsmarkt und der Globalisierung.
 * Vollständig globale Marke (international 100, national 100) 2024 ≈ 130 Mio. € (dazu der Verkauf im Stadion).
 */
export const GLOBAL_MERCH_2024 = 130e6 * 1.95583;
export function merchGlobalAnnual(c: Club, year: number, tier: number): number {
  if (tier > 2) return 0;
  const b = ensureBrand(c);
  // Ab den 1990ern (Katalog, Lizenzen, später Online und Auslandsmärkte), vorher kaum.
  const ramp = clamp((year - 1985) / 15, 0, 1);
  const market = GLOBAL_MERCH_2024 * revenueScale('commercial', year) / revenueScale('commercial', 2024) * ramp;
  const reach = (0.5 * b.national + 0.5 * b.international) / 100;
  return Math.round(market * Math.pow(reach, 4) * (tier <= 1 ? 1 : 0.4));
}

/** Anteil Verwaltung, Beratung, Reisen am Umsatz (Professionalisierung): 1975 0 → 2020 5 %. */
export function adminShare(year: number): number {
  return 0.05 * clamp((year - 1975) / 45, 0, 1);
}
/** Betreuungskosten der Sponsoren (Aktivierung, Agentur, Hospitality): 5 % (1975) → 12 % (2010). */
export function servicingShare(year: number): number {
  return 0.05 + 0.07 * clamp((year - 1975) / 35, 0, 1);
}
/** Wareneinsatz Fanartikel. */
export const MERCH_COGS = 0.35;

/**
 * Betrieb & Vermarktung (Monat, nominal): Wareneinsatz der Fanartikel, Betreuung der
 * Sponsoren, Geschäftsstelle/Beratung/Reisen als Anteil am Umsatz der Vorsaison.
 * FC Bayern 2024/25: Materialaufwand 59,9 + sonstige betriebliche Aufwendungen 310 Mio. €
 * (docs/recherche/fcbayern_2026.md) – ein Teil davon steckt im Spiel schon in Stadion,
 * Gelände und Umfeld, der Rest hier.
 */
export function operationsMonthly(c: Club, year: number, sponsorMonth: number, commercialMonth: number, merchGlobalMonth: number): number {
  const h = c.finances.seasonHistory?.[c.finances.seasonHistory.length - 1];
  // Eigener Verein mit Fanshop-Lager: Wareneinsatz des Ladens wird beim Einkauf gebucht
  // (game/merchGame.ts) – hier nur noch für die übrigen Fanartikel-Erlöse.
  const shopRev = c.merchShop?.archive?.find((a) => a.season === h?.season)?.rev ?? 0;
  const merchYear = Math.max(0, (h?.income.merchandise ?? 0) - shopRev) + merchGlobalMonth * 12;
  const rev = h?.revenue ?? 0;
  const v = MERCH_COGS * merchYear / 12 + servicingShare(year) * (sponsorMonth + commercialMonth) + adminShare(year) * rev / 12;
  return Math.round(v);
}

// -----------------------------------------------------------------------------
// Pflichtreisen (Schnittstelle Trainingslager)
// -----------------------------------------------------------------------------
/**
 * Pflicht-Trainingslager bzw. -Reise eines Vereins für Saison und Fenster (oder null).
 * Für den Trainingslager-Strang: beim Buchen/Planen berücksichtigen (Ziel vorschlagen,
 * KI-Vereine dorthin schicken). Erfüllt ist sie, wenn in diesem Fenster `destId` gebucht ist.
 */
export function campObligationFor(c: Club, season: string, window: 'winter' | 'summer'): CampObligation | null {
  return c.commerce?.campObligations?.find((o) => o.season === season && o.window === window && o.status !== 'missed') ?? null;
}

/** Vertragsstrafe bei verpasster Pflichtreise (1975-Basis): 25 % des Jahreswerts. */
export function campPenaltyBase(d: SponsorDeal): number {
  return Math.round(d.annualValue * 0.25);
}

// -----------------------------------------------------------------------------
// Anzeige-Helfer
// -----------------------------------------------------------------------------
export function clauseLabel(k: SponsorClause): string {
  switch (k.kind) {
    case 'camp': {
      const d = campDestination(k.destId);
      return `${k.window === 'winter' ? 'Pflicht-Trainingslager' : 'Pflicht-Sommerreise'}: ${d?.name ?? k.destId}`;
    }
    case 'friendly': return 'Freundschaftsspiel beim Sponsor (Winter)';
    case 'relegationExit': return 'Ausstieg bei Abstieg';
    case 'relegationCut': return `Bei Abstieg −${Math.round(k.cut * 100)} %`;
    case 'minPlace': return `Mindestens Platz ${k.place}, sonst −${Math.round(k.cut * 100)} %`;
    case 'exclusive': return 'Branchen-Exklusivität';
    case 'option': return `Verlängerungsoption ${k.years} J. (+${Math.round(k.raise * 100)} %)`;
    case 'youth': return `${Math.round(k.share * 100)} % zweckgebunden für den Nachwuchs`;
    case 'image': return k.level >= 3 ? 'Hoch umstritten – Fanproteste' : k.level === 2 ? 'Umstritten – Kritik der Fans' : 'Leicht umstritten';
  }
}

export function clauseTone(k: SponsorClause): 'good' | 'bad' | 'neutral' {
  if (k.kind === 'option') return 'good';
  if (k.kind === 'image' || k.kind === 'relegationExit' || k.kind === 'camp' || k.kind === 'minPlace') return 'bad';
  return 'neutral';
}

/** Fernsehen der Epoche (Anzeige: TV-Präsenz der Werbeflächen). */
export function tvEraText(year: number): string {
  if (year < 1984) return 'Öffentlich-rechtliches Fernsehen: Zusammenfassungen am Samstag, kaum Live-Spiele';
  if (year < 1988) return 'Privatfernsehen startet, die Bundesliga bleibt bei den Öffentlich-Rechtlichen';
  if (year < 1992) return 'Privatfernsehen kauft die Liga: mehr Sendezeit, erste Live-Spiele';
  if (year < 2000) return 'Privatsender mit großer Samstagsshow, Live-Spiele im Bezahlfernsehen';
  if (year < 2010) return 'Alle Spiele live im Pay-TV, Highlights im Free-TV';
  return 'Weltweite Ausstrahlung, Streaming und Social Media – jede Bande läuft in Dutzenden Ländern';
}

export function slotsFor(year: number, tier: number): SponsorSlotDef[] {
  return SPONSOR_SLOTS.filter((s) => slotOpen(s, year, tier));
}

export function upcomingSlots(year: number, tier: number): SponsorSlotDef[] {
  return SPONSOR_SLOTS.filter((s) => s.unlock > year && (s.until == null || s.until >= s.unlock) && s.count(s.unlock, tier) > 0)
    .sort((a, b) => a.unlock - b.unlock);
}
