// =============================================================================
// Weltdaten 1975–2025: echte (verfremdete) Vereine und Ligazusammensetzung je Saison.
// Format und Regeln: docs/specs/WELTDATEN_SPEC.md. Echte Namen nur in docs/recherche/weltvereine_<cc>.md.
// =============================================================================
export type EuroComp = 'ec' | 'cwc' | 'uefa' | 'cl' | 'el' | 'ecl';

export interface RealClub {
  /** `<cc>-<slug>` aus dem verfremdeten Namen; nie ändern (Spielstände). Deutschland: vorhandene IDs. */
  id: string;
  /** Verfremdeter Name (Stadt [+ Farbe]). */
  name: string;
  /** Drei Großbuchstaben. */
  short: string;
  /** Deutscher Ortsname, wo üblich. */
  city: string;
  colors: { primary: string; secondary: string };
  /** Spätere (verfremdete) Namen ab Jahr. */
  rename?: [number, string][];
}

export interface SeasonRow {
  /** 1. Liga in Reihenfolge der Abschlusstabelle (Platz 1 = Meister). */
  t1: string[];
  /** 2. Liga (Top-8-Länder, DDR), Reihenfolge wenn bekannt. */
  t2?: string[];
  /** Zweite Staffel der 2. Liga (z. B. 2. Bundesliga Süd bis 1980/81). */
  t2b?: string[];
  cup?: string;
  cupFinalist?: string;
  /** Teilnehmer des Landes an den Europapokalen DIESER Saison. */
  euro?: Partial<Record<EuroComp, string[]>>;
  note?: string;
}
