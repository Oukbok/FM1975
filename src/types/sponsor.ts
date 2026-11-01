// =============================================================================
// Sponsoring 2.0 — Typen. Daten/Freischaltjahre: data/sponsorCatalog.ts,
// Rechnung: engine/sponsorship.ts, Spielablauf: game/sponsorGame.ts.
// Alle Felder optional an `Club.commerce` → alte Spielstände bleiben ladbar
// (Migration `migrateSponsorship` übernimmt Trikot-/Bandenverträge).
// =============================================================================

/** Werbeflächen bzw. Vertragsarten (Pyramide). */
export type SponsorSlotId =
  | 'brust'         // Trikot-Brustsponsor (seit 1973)
  | 'ausruester'    // Ausrüster (Kit-Deal)
  | 'banden'        // Bandenwerbung (statisch, ab 2010 LED)
  | 'regional'      // Regional-/Förderpartner
  | 'premium'       // Premium-Partner (ab 1990)
  | 'copartner'     // Co-/Exklusivpartner (ab 1995)
  | 'trainingswear' // Trainingsanzug & Kollektion (ab 1994)
  | 'jugend'        // Nachwuchs-Partner (ab 2001, NLZ-Pflicht)
  | 'digital'       // Digital-/Technologiepartner (ab 2012)
  | 'wetten'        // Wettanbieter (rechtliche Phasen)
  | 'aermel'        // Ärmelsponsor (ab 2017/18)
  | 'krypto';       // Krypto/NFT-Welle (2021–22)

/** Branche eines Sponsors (Epochen und Regulierung in data/sponsorCatalog.ts). */
export type SponsorIndustry =
  | 'spirituosen' | 'brauerei' | 'tabak' | 'versicherung' | 'bank' | 'auto' | 'elektronik'
  | 'handel' | 'bau' | 'chemie' | 'sportartikel' | 'telekom' | 'energie' | 'airline'
  | 'staatsfonds' | 'tech' | 'online' | 'wetten' | 'krypto' | 'lebensmittel' | 'logistik' | 'pharma';

/** Besondere Vertragsklausel. */
export type SponsorClause =
  /** Pflicht-Trainingslager (Winter) bzw. Pflicht-Reise (Sommer) im Herkunftsland des Sponsors. */
  | { kind: 'camp'; destId: string; window: 'winter' | 'summer' }
  /** Freundschaftsspiel beim Sponsor (einmal je Saison, im Winter). */
  | { kind: 'friendly' }
  /** Vertrag endet bei Abstieg (Ausstiegsklausel). */
  | { kind: 'relegationExit' }
  /** Wert sinkt bei Abstieg um den Anteil `cut` (0–1). */
  | { kind: 'relegationCut'; cut: number }
  /** Mindestplatzierung: schlechter als `place` → Wert −`cut` in der Folgesaison. */
  | { kind: 'minPlace'; place: number; cut: number }
  /** Branchen-Exklusivität: kein zweiter Partner derselben Branche. */
  | { kind: 'exclusive' }
  /** Verlängerungsoption des Vereins (Jahre, Aufschlag 0–1). */
  | { kind: 'option'; years: number; raise: number }
  /** Jugend-Klausel: Anteil fließt zweckgebunden in den Nachwuchs. */
  | { kind: 'youth'; share: number }
  /** Umstrittener Sponsor: Fan-Stimmung leidet (Stärke 0–3). */
  | { kind: 'image'; level: number };

/** Erfolgsprämien (1975-Basis, einmalig je Saison). */
export interface SponsorBonuses {
  title?: number;
  cup?: number;
  euro?: number;
  /** Klassenerhalt (für Abstiegskandidaten). */
  survive?: number;
}

/** Laufender Sponsorvertrag. */
export interface SponsorDeal {
  id: string;
  slot: SponsorSlotId;
  partner: string;
  industry: SponsorIndustry;
  /** Herkunftsland (ISO-ähnliches Kürzel, siehe data/sponsorCatalog.ts COUNTRIES). */
  country: string;
  /** Jahreswert in 1975-Basis (Buchung × economyScale des Buchungsjahres). */
  annualValue: number;
  yearsTotal: number;
  yearsLeft: number;
  /** Saison des Abschlusses (z. B. "1975/76"). */
  since: string;
  bonuses: SponsorBonuses;
  clauses: SponsorClause[];
  /** Aktuelle Kürzung durch Klauseln (0–1), gilt für die laufende Saison. */
  cut?: number;
  /** Liga-Ebene beim Abschluss (Abstiegsklauseln). */
  tier?: number;
  /** Kürzung aus der Mindestplatzierung der Vorsaison (0–1). */
  placeCut?: number;
  /** Aus altem Spielstand übernommen. */
  legacy?: boolean;
  /** Verlängerte Konditionen ab der nächsten Saison. */
  next?: { annualValue: number; clauses: SponsorClause[]; bonuses: SponsorBonuses };
}

/** Angebot eines Sponsors (je Saison neu, verhandelbar). */
export interface SponsorDealOffer {
  id: string;
  slot: SponsorSlotId;
  partner: string;
  industry: SponsorIndustry;
  country: string;
  annualValue: number;
  years: number;
  bonuses: SponsorBonuses;
  clauses: SponsorClause[];
  /** Interesse des Sponsors 0–1 (Spielraum in der Verhandlung). */
  interest: number;
  /** Bisherige Gegenangebote (max. 2). */
  rounds: number;
  /** Letzte Antwort des Sponsors (Anzeige). */
  reply?: string;
  /** Gültig bis (ISO-Datum). */
  until: string;
  /** Verlängerungsangebot des bisherigen Partners. */
  renewal?: boolean;
}

/** Pflichtreise aus einer Sponsor-Klausel – Schnittstelle zum Trainingslager. */
export interface CampObligation {
  /** Ziel aus data/campDestinations.ts. */
  destId: string;
  /** Saison, in der das Lager stattfinden muss ("2015/16"). */
  season: string;
  window: 'winter' | 'summer';
  dealId: string;
  partner: string;
  /** Ergebnis nach Ende des Fensters. */
  status?: 'open' | 'done' | 'missed';
}

/** Kurze Chronik der Sponsor-Ereignisse (Anzeige). */
export interface SponsorLogEntry { date: string; text: string; amount?: number }
