// =============================================================================
// SPONSORING 2.0 — Werbeflächen, Branchen, Herkunftsländer, Regulierung
// -----------------------------------------------------------------------------
// Rechnung: engine/sponsorship.ts · Spielablauf: game/sponsorGame.ts ·
// Recherche: docs/recherche/sponsoring.md (Quellen [S1] …) und fcbayern_2026.md.
//
// Werte: Jahreswert eines Vertrags für einen MEDIAN-Erstligisten (Reichweite 1),
// nominal (DM bis 2001, Euro ab 2002 – intern in DM-Einheiten, 1 € = 1,95583).
// Zwischen den Stützjahren geometrisch interpoliert, nach dem letzten Stützjahr
// wächst der Wert mit dem Vermarktungsmarkt (revenueScale('commercial')).
// Wo es keine belastbare Zahl gibt, ist der Wert als „Annahme“ markiert.
// =============================================================================
import type { SponsorIndustry, SponsorSlotId } from '../types/sponsor';

/** Stützwert: Jahr → Mio. (Währung der Epoche). */
type Pt = [number, number];
const E = 1.95583;

export interface SponsorSlotDef {
  id: SponsorSlotId;
  name: string;
  short: string;
  desc: string;
  /** Erste Saison (Startjahr), ab der die Fläche vermarktet werden darf. */
  unlock: number;
  /** Letzte Saison (Startjahr), danach verschwindet die Fläche. */
  until?: number;
  /** Einnahmen-Topf der Buchhaltung. */
  bucket: 'sponsorship' | 'advertising';
  /** Welche Bekanntheit zählt: regional (Mittelstand), national, global (Weltkonzerne). */
  reach: 'regional' | 'national' | 'global';
  /** Laufzeit-Spanne in Saisons. */
  years: [number, number];
  /** Anzahl Verträge je Liga-Ebene (Index 1–5) und Jahr. */
  count: (year: number, tier: number) => number;
  /** Stützwerte Median-Erstligist (Mio., Währung der Epoche). */
  value: Pt[];
  /** Zulässige Branchen (Auswahl der Angebote). */
  industries: SponsorIndustry[];
  /** Erfolgsprämien üblich (Meister, Pokal, Europapokal). */
  bonuses: boolean;
  source: string;
}

const t1 = (tier: number) => tier <= 1;
const upTo = (tier: number, max: number) => tier <= max;

export const SPONSOR_SLOTS: SponsorSlotDef[] = [
  {
    id: 'brust', name: 'Trikot-Brustsponsor', short: 'Brust', bucket: 'sponsorship', reach: 'national', years: [2, 5], bonuses: true,
    desc: 'Die wichtigste Werbefläche: das Logo auf der Brust. Seit Braunschweig 1973 mit einem Kräuterlikör-Hersteller auflief, Pflicht jedes Profiklubs.',
    unlock: 1975, count: () => 1,
    // 1975 ≈ 0,25 Mio. DM (Remington/Frankfurt 275 Tsd.), 1990 ≈ 1,6, 2000 ≈ 6,5 Mio. DM, 2024 ≈ 9 Mio. € (Median; Spitze 50–60 Mio. €).
    value: [[1975, 0.25], [1980, 0.4], [1985, 0.85], [1990, 1.6], [1995, 3.2], [2000, 6.5], [2005, 4.5], [2010, 5.5], [2015, 7], [2020, 8.5], [2024, 9]],
    industries: ['spirituosen', 'brauerei', 'versicherung', 'bank', 'auto', 'elektronik', 'handel', 'bau', 'chemie', 'telekom', 'energie', 'airline', 'tech', 'online', 'wetten', 'lebensmittel', 'logistik', 'pharma', 'staatsfonds'],
    source: '[S1] Trikotwerbung seit 1973, [S2] Branchen je Jahrzehnt, [B1] Trikotpartner des Rekordmeisters',
  },
  {
    id: 'ausruester', name: 'Ausrüster', short: 'Ausrüster', bucket: 'sponsorship', reach: 'global', years: [3, 8], bonuses: true,
    desc: 'Trikots, Schuhe, Bälle – und ab den 1990ern viel Geld. Ein Weltkonzern als Ausrüster zahlt Spitzenklubs heute zweistellige Millionen.',
    unlock: 1975, count: () => 1,
    // 1975: Material + kleiner Zuschuss (Annahme 50 Tsd. DM), 2024 Median ≈ 5 Mio. € (Spitze ≈ 60 Mio. €, [B3]).
    value: [[1975, 0.05], [1985, 0.25], [1990, 0.6], [1995, 1.4], [2000, 3], [2005, 2.2], [2010, 2.8], [2015, 3.5], [2020, 4.5], [2024, 5]],
    industries: ['sportartikel'],
    source: 'Annahme nach [B3] (Ausrüsterverträge der Spitzenklubs)',
  },
  {
    id: 'banden', name: 'Bandenwerbung', short: 'Banden', bucket: 'advertising', reach: 'national', years: [1, 3], bonuses: false,
    desc: 'Werbeflächen rund ums Spielfeld. Wert = Zuschauer × TV-Präsenz. Ab 2010 LED-Banden mit wechselnden Motiven (mehr Fläche je Spiel).',
    unlock: 1975, count: () => 1,
    value: [[1975, 0.2], [1980, 0.3], [1985, 0.55], [1990, 0.9], [1995, 1.8], [2000, 3.4], [2005, 2.2], [2010, 3], [2015, 3.5], [2024, 4]],
    industries: ['tabak', 'spirituosen', 'brauerei', 'auto', 'elektronik', 'bank', 'versicherung', 'handel', 'telekom', 'energie', 'tech', 'online', 'wetten', 'logistik', 'airline'],
    source: 'Annahme; LED-Banden ab ca. 2010 [S5]',
  },
  {
    id: 'regional', name: 'Regionalpartner', short: 'Regional', bucket: 'sponsorship', reach: 'regional', years: [1, 3], bonuses: false,
    desc: 'Autohaus, Sparkasse, Brauerei vor Ort: kleine Beträge, aber treu – gerade in den unteren Ligen das Rückgrat.',
    unlock: 1975, count: (y, t) => (t >= 3 ? 4 : y < 1990 ? 2 : y < 2005 ? 3 : 4),
    value: [[1975, 0.03], [1985, 0.06], [1995, 0.15], [2005, 0.2], [2015, 0.35], [2024, 0.5]],
    industries: ['brauerei', 'bank', 'versicherung', 'auto', 'handel', 'bau', 'lebensmittel', 'energie'],
    source: 'Annahme',
  },
  {
    id: 'premium', name: 'Premium-Partner', short: 'Premium', bucket: 'sponsorship', reach: 'national', years: [2, 4], bonuses: true,
    desc: 'Die Spitze der Sponsorenpyramide unter dem Brustsponsor: Logo im Stadion, auf der Pressewand, in Kampagnen. Kam mit der Professionalisierung der 1990er.',
    unlock: 1990, count: (y, t) => (t1(t) ? (y < 1998 ? 1 : y < 2008 ? 2 : 3) : upTo(t, 2) && y >= 1998 ? 1 : 0),
    value: [[1990, 0.35], [1995, 0.8], [2000, 2], [2005, 1.5], [2010, 2], [2015, 2.5], [2024, 3]],
    industries: ['auto', 'versicherung', 'bank', 'telekom', 'energie', 'airline', 'tech', 'handel', 'brauerei', 'logistik', 'staatsfonds'],
    source: '[B2] Partnerpyramide des Rekordmeisters (Platin-/Premium-Partner), Annahme für den Median',
  },
  {
    id: 'copartner', name: 'Co- und Exklusivpartner', short: 'Co-Partner', bucket: 'sponsorship', reach: 'national', years: [1, 3], bonuses: false,
    desc: 'Die breite Basis der Pyramide: offizielle Partner einer Branche („Offizieller Reifenpartner“), oft mit Exklusivität.',
    unlock: 1995, count: (y, t) => (t1(t) ? (y < 2005 ? 2 : y < 2015 ? 4 : 6) : t === 2 ? (y < 2010 ? 2 : 3) : t === 3 ? 1 : 0),
    value: [[1995, 0.2], [2000, 0.5], [2005, 0.35], [2015, 0.6], [2024, 0.8]],
    industries: ['auto', 'versicherung', 'bank', 'handel', 'lebensmittel', 'brauerei', 'logistik', 'tech', 'online', 'pharma', 'energie'],
    source: 'Annahme',
  },
  {
    id: 'trainingswear', name: 'Trainingsanzug & Kollektion', short: 'Training', bucket: 'sponsorship', reach: 'national', years: [2, 4], bonuses: false,
    desc: 'Eigener Sponsor auf Trainingskleidung und Aufwärmshirts – sichtbar bei jeder Pressekonferenz und jedem Warmmachen.',
    unlock: 1994, count: (y, t) => (upTo(t, 2) ? 1 : 0),
    value: [[1994, 0.3], [2005, 0.6], [2015, 1.2], [2024, 1.5]],
    industries: ['auto', 'versicherung', 'bank', 'telekom', 'tech', 'handel', 'logistik'],
    source: 'Annahme',
  },
  {
    id: 'jugend', name: 'Nachwuchs-Partner', short: 'Jugend', bucket: 'sponsorship', reach: 'regional', years: [2, 4], bonuses: false,
    desc: 'Partner des Nachwuchsleistungszentrums. Ein Teil des Geldes ist zweckgebunden: Der Jugendetat darf nicht darunter fallen.',
    unlock: 2001, count: (y, t) => (upTo(t, 3) ? 1 : 0),
    value: [[2001, 0.3], [2010, 0.35], [2024, 0.8]],
    industries: ['bank', 'versicherung', 'energie', 'lebensmittel', 'handel', 'auto'],
    source: 'NLZ-Pflicht ab 2001 (game/youthInvest.ts), Werte Annahme',
  },
  {
    id: 'digital', name: 'Digital- & Technologiepartner', short: 'Digital', bucket: 'sponsorship', reach: 'global', years: [1, 3], bonuses: false,
    desc: 'Cloud, Daten, Apps, Streaming: Technologiekonzerne kaufen sich in die Vereine ein – je internationaler die Fans, desto mehr.',
    unlock: 2012, count: (y, t) => (upTo(t, 2) ? 1 : 0),
    value: [[2012, 0.5], [2020, 1.2], [2024, 1.5]],
    industries: ['tech', 'telekom', 'online'],
    source: 'Annahme',
  },
  {
    id: 'wetten', name: 'Wettpartner', short: 'Wetten', bucket: 'advertising', reach: 'national', years: [1, 3], bonuses: false,
    desc: 'Sportwetten-Anbieter. 2006 wurde Werbung privater Anbieter untersagt (bwin musste von den Trikots), ab 2012 mit Lizenz wieder erlaubt, seit 2021 voll legal.',
    unlock: 2005, count: (y, t) => (upTo(t, 3) && wettenAllowed(y) ? 1 : 0),
    value: [[2005, 0.8], [2012, 1.2], [2021, 2], [2024, 2]],
    industries: ['wetten'],
    source: '[S3] bwin-Verbot 2006, Glücksspielstaatsvertrag 2008/2012/2021',
  },
  {
    id: 'aermel', name: 'Ärmelsponsor', short: 'Ärmel', bucket: 'sponsorship', reach: 'global', years: [2, 4], bonuses: true,
    desc: 'Seit 2017/18 dürfen die Klubs den Trikotärmel selbst vermarkten (vorher ein zentraler Liga-Partner).',
    unlock: 2017, count: (y, t) => (upTo(t, 2) ? 1 : 0),
    value: [[2017, 1.2], [2020, 1.6], [2024, 2]],
    industries: ['airline', 'staatsfonds', 'tech', 'online', 'logistik', 'auto', 'versicherung', 'bank', 'energie', 'wetten', 'krypto'],
    source: '[S1][S2] Ärmelvermarktung ab 2017/18; Airline-Ärmel beim Rekordmeister 2018–2023 [S4]',
  },
  {
    id: 'krypto', name: 'Krypto- & NFT-Partner', short: 'Krypto', bucket: 'sponsorship', reach: 'global', years: [1, 2], bonuses: false,
    desc: 'Die Welle 2021/22: Börsen und Fan-Token zahlen viel – bis zum Einbruch nach der FTX-Pleite im November 2022.',
    unlock: 2021, until: 2022, count: (y, t) => (upTo(t, 2) ? 1 : 0),
    value: [[2021, 1.5], [2022, 1.5]],
    industries: ['krypto'],
    source: '[S6] Krypto-Sponsoring 2021/22, FTX-Insolvenz 11/2022',
  },
];

export const SLOT_BY_ID = Object.fromEntries(SPONSOR_SLOTS.map((s) => [s.id, s])) as Record<SponsorSlotId, SponsorSlotDef>;

/** Private Sportwetten-Werbung erlaubt? 2005/06 ja, 2006/07–2011/12 untersagt, ab 2012/13 wieder (Lizenz). */
export function wettenAllowed(year: number): boolean {
  return year === 2005 || year >= 2012;
}

/** Stützwerte → nominaler Wert (DM-Einheiten) im Jahr X; null vor der Freischaltung. */
export function slotAnchorValue(def: SponsorSlotDef, year: number): number | null {
  const pts = def.value.map(([y, v]) => [y, v * 1e6 * (y > 2001 ? E : 1)] as Pt);
  if (year < pts[0][0]) return null;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ya, va] = pts[i], [yb, vb] = pts[i + 1];
    if (year >= ya && year <= yb) return va * Math.pow(vb / va, (year - ya) / (yb - ya));
  }
  return pts[pts.length - 1][1];
}

// -----------------------------------------------------------------------------
// Branchen: Epochen, Regulierung, Imagewirkung
// -----------------------------------------------------------------------------
export interface IndustryDef {
  id: SponsorIndustry;
  name: string;
  /** Jahre, in denen die Branche als Sponsor auftritt. */
  from: number;
  to?: number;
  /** Gewicht je Epoche (Häufigkeit der Angebote). */
  weight: (year: number) => number;
  /** Umstrittenheit 0–3 je Jahr (Fan-Protest, Image-Klausel). */
  image?: (year: number, country: string) => number;
  /** Rechtliche Sperren je Fläche (Grund als Text) – null = erlaubt. */
  banned?: (year: number, slot: SponsorSlotId) => string | null;
}

export const INDUSTRIES: IndustryDef[] = [
  { id: 'spirituosen', name: 'Spirituosen', from: 1975, weight: (y) => (y < 1985 ? 3 : y < 1995 ? 1.5 : 0.4),
    image: (y) => (y >= 1995 ? 1 : 0),
    // Annahme: Hochprozentiges ab 2000 nicht mehr auf dem Trikot (Selbstverpflichtung, heute verboten [S1]).
    banned: (y, s) => (s !== 'banden' && y >= 2000 ? 'Werbung für Spirituosen ist im Sport nicht mehr erlaubt' : null) },
  { id: 'brauerei', name: 'Brauerei', from: 1975, weight: (y) => (y < 1990 ? 2.5 : 1.5) },
  { id: 'tabak', name: 'Tabak', from: 1975, to: 2006, weight: (y) => (y < 1990 ? 1.5 : 0.8),
    image: (y) => (y < 1990 ? 1 : 2),
    // Fernsehwerbung für Zigaretten seit 1.1.1975 verboten; Trikot daher unattraktiv (Annahme: nur Banden);
    // ab 2007 Sponsoringverbot (EU-Tabakwerberichtlinie, Umsetzung Ende 2006) [S7].
    banned: (y, s) => (y >= 2007 ? 'Tabakwerbung und -sponsoring sind verboten (EU-Richtlinie 2003/33/EG)' : s !== 'banden' ? 'Tabakwerbung im Fernsehen ist seit 1975 verboten' : null) },
  { id: 'versicherung', name: 'Versicherung', from: 1975, weight: () => 2 },
  { id: 'bank', name: 'Bank', from: 1975, weight: () => 1.8 },
  { id: 'auto', name: 'Automobil', from: 1975, weight: (y) => (y < 1985 ? 1.2 : 2.2) },
  { id: 'elektronik', name: 'Unterhaltungselektronik', from: 1975, to: 2012, weight: (y) => (y < 1980 ? 1 : y < 1995 ? 3 : 1) },
  { id: 'handel', name: 'Handel', from: 1975, weight: () => 1.5 },
  { id: 'bau', name: 'Bau & Immobilien', from: 1975, weight: () => 1 },
  { id: 'chemie', name: 'Chemie & Industrie', from: 1975, weight: (y) => (y < 2000 ? 1.2 : 0.6) },
  { id: 'lebensmittel', name: 'Lebensmittel', from: 1975, weight: () => 1 },
  { id: 'pharma', name: 'Pharma & Gesundheit', from: 1975, weight: () => 0.7 },
  { id: 'sportartikel', name: 'Sportartikel', from: 1975, weight: () => 1 },
  { id: 'logistik', name: 'Logistik', from: 1990, weight: () => 0.8 },
  { id: 'telekom', name: 'Telekommunikation', from: 1992, weight: (y) => (y < 1996 ? 1 : y < 2010 ? 3 : 1.8) },
  { id: 'energie', name: 'Energie', from: 1998, weight: (y) => (y < 2005 ? 2 : 1.6),
    image: (y, c) => (c === 'RU' ? (y >= 2022 ? 3 : y >= 2014 ? 1 : 0) : 0) },
  { id: 'tech', name: 'Technologie & IT', from: 1998, weight: (y) => (y < 2010 ? 1 : 2.4) },
  { id: 'online', name: 'Online-Handel & Portale', from: 1999, weight: (y) => (y < 2008 ? 0.8 : 1.8) },
  { id: 'airline', name: 'Fluggesellschaft', from: 2000, weight: (y) => (y < 2010 ? 1 : 1.6),
    image: (y, c) => (c === 'QA' || c === 'AE' ? (y >= 2020 ? 2 : y >= 2014 ? 1 : 0) : 0) },
  { id: 'staatsfonds', name: 'Staatsfonds & Tourismus', from: 2011, weight: () => 1.1,
    image: (y, c) => (c === 'QA' || c === 'AE' || c === 'SA' ? (y >= 2020 ? 3 : 2) : 1) },
  { id: 'wetten', name: 'Sportwetten', from: 2005, weight: (y) => (y >= 2020 ? 2.5 : 1.5),
    image: (y) => (y >= 2020 ? 2 : 1),
    banned: (y) => (wettenAllowed(y) ? null : 'Werbung privater Wettanbieter ist untersagt (2006–2012)') },
  { id: 'krypto', name: 'Krypto & Fan-Token', from: 2021, to: 2022, weight: () => 3, image: () => 1 },
];

export const INDUSTRY_BY_ID = Object.fromEntries(INDUSTRIES.map((i) => [i.id, i])) as Record<SponsorIndustry, IndustryDef>;

/** Darf eine Branche in diesem Jahr auf dieser Fläche werben? (null = ja, sonst Grund) */
export function industryBan(ind: SponsorIndustry, slot: SponsorSlotId, year: number): string | null {
  const d = INDUSTRY_BY_ID[ind];
  if (!d) return 'unbekannte Branche';
  if (year < d.from) return `${d.name}: erst ab ${d.from}`;
  if (d.to != null && year > d.to) return d.banned?.(year, slot) ?? `${d.name}: nicht mehr am Markt`;
  return d.banned?.(year, slot) ?? null;
}

/** Image-Stufe eines Sponsors (0 = unbedenklich … 3 = massiver Protest). */
export function industryImage(ind: SponsorIndustry, year: number, country: string): number {
  return INDUSTRY_BY_ID[ind]?.image?.(year, country) ?? 0;
}

// -----------------------------------------------------------------------------
// Herkunftsländer – mit Pflichtreisen (Klausel „camp“, Ziele aus data/campDestinations.ts)
// -----------------------------------------------------------------------------
export interface SponsorCountry {
  id: string;
  name: string;
  /** Ab diesem Jahr treten Firmen aus dem Land als Sponsoren auf (bis `to`). */
  from: number;
  to?: number;
  /** Branchen, in denen das Land typischerweise auftritt (leer = alle). */
  industries?: SponsorIndustry[];
  /** Pflichtreise: Winter-Trainingslager bzw. Sommertour im Land (Ziel-ID). */
  camp?: { destId: string; window: 'winter' | 'summer'; from: number };
  weight: number;
}

export const COUNTRIES: SponsorCountry[] = [
  { id: 'DE', name: 'Deutschland', from: 1975, weight: 10 },
  { id: 'JP', name: 'Japan', from: 1978, industries: ['elektronik', 'auto', 'tech'], camp: { destId: 'asien', window: 'summer', from: 2015 }, weight: 1.5 },
  { id: 'US', name: 'USA', from: 1980, industries: ['elektronik', 'tech', 'online', 'lebensmittel', 'sportartikel', 'krypto'], camp: { destId: 'usatour', window: 'summer', from: 2014 }, weight: 1.2 },
  { id: 'NL', name: 'Niederlande', from: 1975, industries: ['elektronik', 'brauerei', 'bank', 'versicherung', 'online'], weight: 0.8 },
  { id: 'IT', name: 'Italien', from: 1975, industries: ['spirituosen', 'sportartikel', 'auto', 'lebensmittel'], weight: 0.7 },
  { id: 'FR', name: 'Frankreich', from: 1975, industries: ['auto', 'versicherung', 'bank', 'sportartikel'], weight: 0.6 },
  { id: 'CH', name: 'Schweiz', from: 1975, industries: ['bank', 'versicherung', 'lebensmittel', 'pharma'], weight: 0.6 },
  { id: 'KR', name: 'Südkorea', from: 1995, industries: ['elektronik', 'auto', 'tech', 'telekom'], camp: { destId: 'asien', window: 'summer', from: 2015 }, weight: 0.8 },
  { id: 'TR', name: 'Türkei', from: 2005, industries: ['airline', 'bank', 'handel', 'lebensmittel'], camp: { destId: 'tuerkei', window: 'winter', from: 2005 }, weight: 0.6 },
  { id: 'MT', name: 'Malta', from: 2005, industries: ['wetten', 'online'], weight: 1.2 },
  { id: 'GB', name: 'Großbritannien', from: 1990, industries: ['wetten', 'versicherung', 'bank', 'tech'], weight: 0.6 },
  { id: 'RU', name: 'Russland', from: 2006, to: 2021, industries: ['energie'], weight: 0.5 },
  { id: 'AE', name: 'Vereinigte Arabische Emirate', from: 2004, industries: ['airline', 'staatsfonds', 'bau'], camp: { destId: 'dubai', window: 'winter', from: 2004 }, weight: 0.7 },
  // Katar: Wintertrainingslager des FC Bayern seit 2011, Qatar Airways Ärmelpartner 2018–2023 [S4][C4].
  { id: 'QA', name: 'Katar', from: 2011, industries: ['airline', 'staatsfonds', 'bank', 'energie'], camp: { destId: 'katar', window: 'winter', from: 2011 }, weight: 0.6 },
  { id: 'CN', name: 'China', from: 2012, industries: ['elektronik', 'tech', 'telekom', 'auto', 'online'], camp: { destId: 'asien', window: 'summer', from: 2015 }, weight: 0.9 },
  { id: 'SA', name: 'Saudi-Arabien', from: 2023, industries: ['staatsfonds', 'energie', 'airline'], weight: 0.5 },
];

export const COUNTRY_BY_ID = Object.fromEntries(COUNTRIES.map((c) => [c.id, c])) as Record<string, SponsorCountry>;

/** TV-Präsenz der Epoche (Live-Übertragungen, Zusammenfassungen) 0–1. */
export const TV_ERA: Pt[] = [
  [1975, 0.3],  // Sportschau-Zusammenfassungen, kaum Live-Spiele
  [1988, 0.45], // Privatfernsehen (RTL „Anpfiff“)
  [1992, 0.7],  // SAT.1 „ran“, Premiere live
  [2000, 0.9],  // alle Spiele live im Pay-TV
  [2010, 1],    // HD, Streaming, weltweite Ausstrahlung
];

/** Fernsehpräsenz einer Epoche (interpoliert). */
export function tvEra(year: number): number {
  if (year <= TV_ERA[0][0]) return TV_ERA[0][1];
  for (let i = 0; i < TV_ERA.length - 1; i++) {
    const [ya, va] = TV_ERA[i], [yb, vb] = TV_ERA[i + 1];
    if (year <= yb) return va + (vb - va) * ((year - ya) / (yb - ya));
  }
  return TV_ERA[TV_ERA.length - 1][1];
}

/** LED-Banden ab 2010 (rotierende Motive: mehr Werbezeit je Spiel). */
export const LED_YEAR = 2010;
