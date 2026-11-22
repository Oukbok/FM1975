// =============================================================================
// INTERKONTINENTALE WETTBEWERBE DER VEREINE – Formate je Epoche (Namen verfremdet).
// -----------------------------------------------------------------------------
// Vorbilder (Quellen in docs/research/continents.md):
//  • „Weltpokal“ (Intercontinental Cup) 1960–2004: Europas Landesmeister gegen den
//    Sieger Südamerikas. 1960–1979 Hin- und Rückspiel (Nov./Dez. bzw. bis März),
//    in den 1970ern sagten Europas Meister mehrfach ab (Finalist sprang ein, 1975
//    und 1978 fiel er aus), ab 1980 ein Spiel in Tokio (Dezember).
//  • „Klub-Weltmeisterschaft“: Januar 2000 in Brasilien mit 8 Teams (zwei Vierer-
//    gruppen, Finale + Spiel um Platz 3), 2001 abgesagt; ab Dezember 2005 jährlich:
//    2005/06 sechs Kontinentalsieger (Viertel-, Halbfinale, Finale), ab 2007 sieben
//    mit dem Meister des Gastlandes (Play-off gegen Ozeanien). 2020–2022 im
//    Folgejahr gespielt – im Spiel vereinfacht immer im Dezember.
//  • „Interkontinentalpokal“ ab Dezember 2024: Stufenturnier, Europas Meister erst
//    im Finale.
//  • Erweiterte Klub-WM 2025 in den USA: 32 Teams (12 Europa, 6 Südamerika, je 4
//    Afrika/Asien/Nord-/Mittelamerika + Gastgeber, 1 Ozeanien), acht Vierergruppen,
//    Achtelfinale bis Finale, 14.6.–13.7.2025; danach alle vier Jahre. Im Spiel
//    VOR dem Ligastart der Saison 2025/26 (Juli), damit sie nicht über den
//    Saisonwechsel läuft.
// Prämien in 1975-Basis (× economyScale): grobe Größenordnung der echten Prämien.
// =============================================================================

export type IcKey = 'wp' | 'cwc' | 'icup' | 'big';
export type IcFormat = 'legs2' | 'tokyo' | 'cwc2000' | 'six' | 'seven' | 'icup' | 'big32';

export const IC_NAMES: Record<IcKey, string> = {
  wp: 'Transatlantik-Pokal', cwc: 'Klub-Weltturnier', icup: 'Kontinentalsieger-Pokal', big: 'Klub-Weltturnier',
};

export const IC_FORMAT_DE: Record<IcFormat, string> = {
  legs2: 'Hin- und Rückspiel: Europas Landesmeister gegen den Sieger Südamerikas',
  tokyo: 'ein Endspiel auf neutralem Platz in Tokio (Dezember)',
  cwc2000: '8 Teams in zwei Vierergruppen, Gruppensieger im Finale (Januar, Brasilien)',
  six: '6 Kontinentalsieger: Viertelfinale, Europa und Südamerika steigen im Halbfinale ein',
  seven: '7 Teams mit dem Meister des Gastlandes: Play-off, Viertelfinale, Halbfinale, Finale',
  icup: 'Stufenturnier der Kontinentalsieger, Europas Meister erst im Finale (Dezember)',
  big32: '32 Teams in acht Vierergruppen, Achtelfinale bis Finale (Juli, vor dem Ligastart)',
};

export interface IcPlan { key: IcKey; format: IcFormat; month: number }

/** Interkontinentale Wettbewerbe in der Saison mit Startjahr `y`. */
export function icPlansFor(y: number): IcPlan[] {
  const out: IcPlan[] = [];
  if (y >= 2025 && (y - 2025) % 4 === 0) out.push({ key: 'big', format: 'big32', month: 7 });
  if (y >= 1960 && y <= 1979) out.push({ key: 'wp', format: 'legs2', month: 11 });
  else if (y >= 1980 && y <= 2004) out.push({ key: 'wp', format: 'tokyo', month: 12 });
  if (y === 1999) out.push({ key: 'cwc', format: 'cwc2000', month: 1 });
  else if (y >= 2005 && y <= 2006) out.push({ key: 'cwc', format: 'six', month: 12 });
  else if (y >= 2007 && y <= 2023) out.push({ key: 'cwc', format: 'seven', month: 12 });
  if (y >= 2024) out.push({ key: 'icup', format: 'icup', month: 12 });
  return out;
}

/** Gastland der Klub-WM mit sieben Teams (Meister des Gastlandes spielt mit). */
export function cwcHost(y: number): string {
  if (y <= 2008) return 'jpn';
  if (y <= 2010) return 'uae';
  if (y <= 2012) return 'jpn';
  if (y <= 2014) return 'mar';
  if (y <= 2016) return 'jpn';
  if (y <= 2018) return 'uae';
  if (y <= 2020) return 'qat';
  if (y === 2021) return 'uae';
  if (y === 2022) return 'mar';
  return 'ksa';
}

/** Austragungsort neutraler Spiele (Vorschau „Nächstes Spiel“). */
export function icVenue(format: IcFormat, y: number): string | undefined {
  if (format === 'tokyo') return 'Nationalstadion Tokio';
  if (format === 'cwc2000') return 'Maracanã-Stadion, Rio';
  if (format === 'six' || format === 'seven') return ({ jpn: 'Stadion Yokohama', uae: 'Stadion Abu Dhabi', mar: 'Stadion Marrakesch', qat: 'Stadion Doha', ksa: 'Stadion Dschidda' } as Record<string, string>)[cwcHost(y)];
  if (format === 'icup') return 'Stadion Doha';
  if (format === 'big32') return 'Turnier in den USA';
  return undefined;
}

/** In den 1970ern sagten Europas Meister den Weltpokal oft ab (KI-Meister, fest aus der Saison). */
export const WP_DECLINE = { from: 1970, to: 1979, chance: 0.35 };

/** Prämien (1975-Basis): Antritt, je Sieg in Gruppe/Runde, Titel. */
export const IC_PRIZE: Record<IcFormat, { start: number; round: number; win: number }> = {
  legs2: { start: 40000, round: 0, win: 80000 },
  tokyo: { start: 60000, round: 0, win: 120000 },
  // Klub-WM 2000: rund 2,5 Mio. $ Antritt, 6 Mio. $ für den Sieger (× economyScale 2000 ≈ 15)
  cwc2000: { start: 250000, round: 40000, win: 400000 },
  // Klub-WM 2005–2023 bzw. Interkontinentalpokal: Sieger zuletzt rund 4–5 Mio. $
  six: { start: 100000, round: 30000, win: 100000 },
  seven: { start: 100000, round: 30000, win: 100000 },
  icup: { start: 30000, round: 20000, win: 60000 },
  // Große Klub-WM 2025: Europas Teilnehmer 12–36 Mio. € Antritt, Sieger zusammen gut 100 Mio. € (× economyScale 2025 ≈ 107, Anzeige in €)
  big32: { start: 365000, round: 120000, win: 700000 },
};

/** Stärke-Zuschlag der historischen Sieger im Kontinentalpokal je Option „Historische Entwicklung“. */
export const CT_STEER: Record<string, number> = { off: 0, medium: 4, strong: 7 };
