// =============================================================================
// Stadionumfeld (Vereinsgelände 2.0) — Typen. Logik: engine/grounds.ts,
// Spielablauf: game/groundsGame.ts, Preise/Freischaltjahre: data/groundsCatalog.ts.
// Alle Felder optional am Verein (`Club.grounds`) → alte Spielstände bleiben ladbar.
// =============================================================================

/** Ausbaubare Teile des Umfelds (zusätzlich zu den Einrichtungen in `infrastructure`). */
export type GroundsModuleKey =
  | 'parking'      // Parkplätze → Parkhaus
  | 'transit'      // ÖPNV-Anbindung (Verhandlung mit der Stadt)
  | 'vereinsheim'  // Vereinsheim → Clubhaus-Gaststätte
  | 'megastore'    // Fanshop-Filiale → Megastore
  | 'onlineShop'   // Katalogversand → Onlineshop
  | 'museum'       // Vereinsmuseum
  | 'tours'        // Stadionführungen
  | 'stewards'     // Ordnungsdienst
  | 'fanProject'   // Sozialpädagogisches Fanprojekt
  | 'familyBlock'  // Familienblock / Kinderland
  | 'fanZone'      // Fan-Zone / Public Viewing
  | 'choreoRoom'   // Fanräume & Choreo-Lager
  | 'hospitality'  // VIP-Zelt → Business-Club → Premium
  | 'press'        // Pressetribüne → Pressezentrum → TV-Compound
  | 'floodlight';  // Flutlicht (Lux-Stufen, Lizenzauflage)

/** Lage des Stadions in der Stadt (fest je Verein). */
export type GroundsLocation = 'innenstadt' | 'stadtteil' | 'stadtrand';

/** Zustand eines Umfeld-Teils. */
export interface GroundsModuleState {
  level: number;
  /** Zustand 0–100 (Abnutzung, Sanierung). */
  condition: number;
  /** Jahr der Errichtung bzw. letzten Grundsanierung. */
  builtYear: number;
  /** Fanprojekt: Monate in Betrieb (Wirkung baut sich auf). */
  months?: number;
}

/** Laufendes Bauvorhaben (Genehmigung → Bau). */
export interface GroundsProject {
  id: string;
  module: GroundsModuleKey;
  targetLevel: number;
  phase: 'permit' | 'build';
  /** Ende der aktuellen Phase (ISO, UTC). */
  phaseEnd: string;
  /** Bereits gebuchte Kosten (nominal). */
  cost: number;
  /** Anwohnerprotest im Genehmigungsverfahren (vorab gewürfelt). */
  protest?: 'none' | 'auflage' | 'abgelehnt';
  /** Protest wurde bereits gemeldet. */
  protestShown?: boolean;
}

/** Verhandlung mit der Stadt über die ÖPNV-Anbindung. */
export interface TransitTalk {
  targetLevel: number;
  decideDate: string;
  /** Vereinsanteil (nominal), bei Zusage gebucht. */
  clubShare: number;
  /** Vorab gewürfeltes Ergebnis. */
  accepted: boolean;
}

/** Ereignis im Umfeld (für Nachrichten und die Übersicht). */
export interface GroundsLogEntry {
  date: string;
  kind: 'chaos' | 'incident' | 'police' | 'license' | 'info';
  text: string;
  amount?: number;
  /** Bereits als Nachricht gemeldet. */
  shown?: boolean;
}

/** Saisonbilanz des Umfelds (nominal). */
export interface GroundsSeasonStats {
  season: string;
  income: number;
  cost: number;
  fines: number;
  incidents: number;
  chaos: number;
}

export interface ClubGrounds {
  location: GroundsLocation;
  /** Gesamtfläche in Parzellen (je ~1.000 m²). */
  area: number;
  /** Zugekaufte Parzellen-Pakete. */
  landBought: number;
  modules: Partial<Record<GroundsModuleKey, GroundsModuleState>>;
  projects: GroundsProject[];
  talk?: TransitTalk;
  /** Keine neue Verhandlung vor diesem Datum. */
  talkCooldown?: string;
  /** Bereits auf die Auslastung angewandter Umfeld-Bonus (Delta-Verfahren). */
  attApplied: number;
  /** Zuletzt verarbeitetes Spieldatum (Vorfälle, Polizei). */
  lastScan?: string;
  lastMonth?: string;
  lastSeason?: string;
  /** Saisons in Folge mit verfehlter Lizenzauflage. */
  licenseStrikes?: number;
  log: GroundsLogEntry[];
  stats?: GroundsSeasonStats;
  prevStats?: GroundsSeasonStats;
}
