// =============================================================================
// Fanartikel (Merchandising) des eigenen Vereins – optionales Feld `Club.merchShop`.
// Rechnung: engine/merch.ts · Ablauf/Aktionen: game/merchGame.ts · Katalog: data/merchCatalog.ts
// =============================================================================

export type MerchItemId =
  | 'schal' | 'wimpel' | 'magazin' | 'poster' | 'ball' | 'musik'
  | 'trikot' | 'bekleidung' | 'accessoires' | 'video';

/** Zähler je Artikel (Saison bzw. laufende Woche). */
export interface MerchCounter {
  /** verkaufte Stück */
  sold: number;
  /** Erlös nominal */
  rev: number;
  /** Einkauf nominal */
  cost: number;
  /** nicht lieferbare Nachfrage (Stück) */
  lost: number;
}

export interface MerchItemState {
  /** Bestand aktuelles Modell (Stück) */
  stock: number;
  /** Ladenhüter: Vorjahresmodell (Stück) */
  stale: number;
  /** Einstandswert des Bestands (nominal, für „Wert des Lagers“) */
  value: number;
  /** Preis-Faktor gegenüber dem Richtpreis (1 = Richtpreis, 0,5–2) */
  pf: number;
  /** Rabatt (Aktion) auf das aktuelle Modell 0–0,5 */
  disc: number;
  /** Rabatt auf Ladenhüter (Vorjahresmodell) 0–0,7 */
  sdisc?: number;
  /** veraltet (früher: Rabatt vom Assistenten gesetzt) */
  autoDisc?: boolean;
  /** Bruchteil der Nachfrage, der noch nicht zu einem ganzen Stück gereicht hat */
  frac: number;
  season: MerchCounter;
  week: MerchCounter;
  /** zuletzt gemeldeter Ausverkauf (ISO-Datum) */
  outNote?: string;
}

/** Eine abgeschlossene Woche (Montag–Sonntag). */
export interface MerchWeek {
  /** Montag der Woche */
  d: string;
  rev: number;
  cost: number;
  sold: number;
  /** Erlös je Artikel */
  it: Partial<Record<MerchItemId, number>>;
}

export interface MerchArchiveEntry {
  season: string;
  rev: number;
  cost: number;
  sold: number;
  /** Umsatz, den das alte Pauschalmodell gebucht hätte (Kontrolle) */
  pot: number;
  top?: { id: string; name: string; n: number }[];
  /** Erlös je Artikel */
  it?: Partial<Record<MerchItemId, number>>;
}

export interface MerchShop {
  v: 1;
  season: string;
  /** Assistent bestellt nach und räumt Ladenhüter ab */
  auto: boolean;
  items: Partial<Record<MerchItemId, MerchItemState>>;
  /** Nachverkauf: Anteil der Spieltags-Nachfrage, der in der Folgewoche kommt (nominal) */
  pending: number;
  /** Montag der laufenden Woche */
  weekStart: string;
  /** abgeschlossene Wochen der Saison */
  weeks: MerchWeek[];
  /** Spieler-Stück der laufenden Woche (Trikots bzw. vor 1995 Poster/Autogrammkarten) */
  plUnits: number;
  /** Spieler-Verkäufe der Saison */
  jersey: Record<string, number>;
  /** Spieler-Verkäufe je abgeschlossener Woche (Index = weeks) */
  jerseyW: Record<string, number[]>;
  /** Potenzial des alten Pauschalmodells in dieser Saison (nominal, Kontrolle) */
  pot: number;
  /** Zugkraft der Stars/Neuzugänge auf Trikots und Poster (wöchentlich gesetzt, ≈ 0,9–1,15) */
  boost?: number;
  archive: MerchArchiveEntry[];
  /** letzte Bestellungen */
  orders: { d: string; id: MerchItemId; qty: number; cost: number; auto?: boolean }[];
}
