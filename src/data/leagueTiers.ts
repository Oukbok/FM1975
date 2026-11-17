// =============================================================================
// LIGENSTRUKTUR DER TOP-5-LÄNDER bis zur 4. Ebene (Wunsch Pascal, Statistiken › Ligensystem)
// -----------------------------------------------------------------------------
// Je Land Epochen ab Saison-Startjahr (`from`, 1975 = 1975/76); eine Epoche gilt, bis die
// nächste beginnt, die letzte wird fortgeschrieben. Je Epoche Ebene 1–4 mit Ligenname,
// Zahl der Staffeln und Mannschaften je Staffel (`teams: null` = regional verschieden).
// Genutzt von game/leaguePyramid.ts: simulierte Ebenen der Auslandsligen tragen den
// historischen Namen, nicht simulierte Ebenen erscheinen als reine Strukturangabe.
// Nur Ligennamen ohne Sponsorzusatz, keine Vereinsnamen.
//
// Quellen (abgerufen 11/2026):
//  England: en.wikipedia.org/wiki/English_Football_League (1986–88 Verkleinerung der First Division
//    auf 20, 1991/92 wieder 22 und 93 Vereine, 1992 Premier League + 70 Vereine, 1995 PL 20 + 72,
//    2004 Championship/League One/League Two).
//  Spanien: en.wikipedia.org/wiki/La_Liga (18 bis 1986/87, 20 ab 1987/88, 22 1995–97, 20 ab 1997/98),
//    Saisonartikel 1985–86/1986–87/1987–88/1997–98 Segunda División (20/18/20/22),
//    en.wikipedia.org/wiki/Segunda_División_B (2 Staffeln 1977–86, 1 × 22 1986/87, 4 × 20 1987–2020,
//    5 Staffeln 2020/21), en.wikipedia.org/wiki/Tercera_División + Saisonartikel 1977–78 (6 × 20),
//    1979–80 (8 × 20), 1980–81 (13 × 20), 1986–87 (16), 2004–05 (18 Staffeln); 2021 Primera/
//    Segunda Federación (RFEF).
//  Italien: en.wikipedia.org/wiki/Serie_C1 (1978 2 × 18, 2008 Lega Pro Prima Divisione, 2014 Serie C
//    3 × 20), en.wikipedia.org/wiki/Serie_C2 (4 × 18 1978–91, 3 × 18 1991–2011, 2011/12 2 Staffeln
//    20/21, 2012–14 2 × 18), en.wikipedia.org/wiki/Serie_D (Namen Campionato Interregionale 1981–92,
//    Campionato Nazionale Dilettanti 1992–99; 9 Staffeln; ab 2014 4. Ebene). Serie A 16/18 (1988)/20 (2004),
//    Serie B 20/24 (2003)/22 (2004)/19 (2018)/20 (2019).
//  Frankreich: fr.wikipedia.org/wiki/Championnat_de_France_de_football_de_deuxième_division (2 × 18
//    1972–93, 22 1993–98, 20 1998–2024, 18 ab 2024), en.wikipedia.org/wiki/French_Division_3_(1971–1993)
//    (6 × 16), en.wikipedia.org/wiki/French_Division_4_(1978–1993) (8 × 14),
//    fr.wikipedia.org/wiki/Championnat_de_France_de_football_National (National 1 1993–97 2 × 18,
//    danach 1 Staffel 20, ab 2013 18, Ligue 3 ab 2026/27), CFA/National 2 (4 Staffeln, 2023/24 4 × 14,
//    ab 2024 3 × 16), fff.fr „L'abécédaire du N1 2026-2027“ (4. Ebene heißt National 1, 3 Staffeln).
//    Ligue 1: 20, 1997–2002 18, ab 2023 18. Größe der Ligue 3 2026/27 angenommen 18.
//  Deutschland (nur Ebenen, die das Spiel nicht selbst führt): en.wikipedia.org/wiki/Oberliga_(football)
//    (bis 1978 15 Amateurligen, 1978–94 8 Oberligen + ab 1991 3 NOFV-Staffeln, 1994–2004 10 bzw.
//    2004–08 9 Oberligen als 4. Ebene); Regionalligen 1994–2000 4, 2000–08 2, ab 2008 4. Ebene
//    (3 Staffeln, ab 2012 5). Namen wie im Spiel („1. Liga“, „2. Liga“).
// =============================================================================

export interface TierRow {
  /** Ligenname (bei mehreren Staffeln der Sammelname, z. B. „Serie C2“). */
  name: string;
  /** Zahl der Staffeln (1 = eingleisig). */
  groups: number;
  /** Mannschaften je Staffel; null = regional verschieden. */
  teams: number | null;
}
interface TierEra { from: number; tiers: [TierRow, TierRow, TierRow, TierRow] }

const t = (name: string, groups: number, teams: number | null): TierRow => ({ name, groups, teams });

const ENG: TierEra[] = [
  { from: 1975, tiers: [t('First Division', 1, 22), t('Second Division', 1, 22), t('Third Division', 1, 24), t('Fourth Division', 1, 24)] },
  { from: 1987, tiers: [t('First Division', 1, 21), t('Second Division', 1, 23), t('Third Division', 1, 24), t('Fourth Division', 1, 24)] },
  { from: 1988, tiers: [t('First Division', 1, 20), t('Second Division', 1, 24), t('Third Division', 1, 24), t('Fourth Division', 1, 24)] },
  { from: 1991, tiers: [t('First Division', 1, 22), t('Second Division', 1, 24), t('Third Division', 1, 24), t('Fourth Division', 1, 23)] },
  { from: 1992, tiers: [t('Premier League', 1, 22), t('First Division', 1, 24), t('Second Division', 1, 24), t('Third Division', 1, 22)] },
  { from: 1995, tiers: [t('Premier League', 1, 20), t('First Division', 1, 24), t('Second Division', 1, 24), t('Third Division', 1, 24)] },
  { from: 2004, tiers: [t('Premier League', 1, 20), t('Championship', 1, 24), t('League One', 1, 24), t('League Two', 1, 24)] },
];

const ESP: TierEra[] = [
  { from: 1975, tiers: [t('Primera División', 1, 18), t('Segunda División', 1, 20), t('Tercera División', 4, 20), t('Regional Preferente', 1, null)] },
  { from: 1977, tiers: [t('Primera División', 1, 18), t('Segunda División', 1, 20), t('Segunda División B', 2, 20), t('Tercera División', 6, 20)] },
  { from: 1978, tiers: [t('Primera División', 1, 18), t('Segunda División', 1, 20), t('Segunda División B', 2, 20), t('Tercera División', 8, 20)] },
  { from: 1980, tiers: [t('Primera División', 1, 18), t('Segunda División', 1, 20), t('Segunda División B', 2, 20), t('Tercera División', 13, 20)] },
  { from: 1986, tiers: [t('Primera División', 1, 18), t('Segunda División', 1, 18), t('Segunda División B', 1, 22), t('Tercera División', 16, 20)] },
  { from: 1987, tiers: [t('Primera División', 1, 20), t('Segunda División', 1, 20), t('Segunda División B', 4, 20), t('Tercera División', 17, 20)] },
  { from: 1995, tiers: [t('Primera División', 1, 22), t('Segunda División', 1, 20), t('Segunda División B', 4, 20), t('Tercera División', 17, 20)] },
  { from: 1997, tiers: [t('Primera División', 1, 20), t('Segunda División', 1, 22), t('Segunda División B', 4, 20), t('Tercera División', 17, 20)] },
  { from: 2004, tiers: [t('Primera División', 1, 20), t('Segunda División', 1, 22), t('Segunda División B', 4, 20), t('Tercera División', 18, 20)] },
  { from: 2020, tiers: [t('Primera División', 1, 20), t('Segunda División', 1, 22), t('Segunda División B', 5, 20), t('Tercera División', 18, null)] },
  { from: 2021, tiers: [t('Primera División', 1, 20), t('Segunda División', 1, 22), t('Primera Federación', 2, 20), t('Segunda Federación', 5, 18)] },
];

const ITA: TierEra[] = [
  { from: 1975, tiers: [t('Serie A', 1, 16), t('Serie B', 1, 20), t('Serie C', 3, 20), t('Serie D', 9, 18)] },
  { from: 1978, tiers: [t('Serie A', 1, 16), t('Serie B', 1, 20), t('Serie C1', 2, 18), t('Serie C2', 4, 18)] },
  { from: 1988, tiers: [t('Serie A', 1, 18), t('Serie B', 1, 20), t('Serie C1', 2, 18), t('Serie C2', 4, 18)] },
  { from: 1991, tiers: [t('Serie A', 1, 18), t('Serie B', 1, 20), t('Serie C1', 2, 18), t('Serie C2', 3, 18)] },
  { from: 2003, tiers: [t('Serie A', 1, 18), t('Serie B', 1, 24), t('Serie C1', 2, 18), t('Serie C2', 3, 18)] },
  { from: 2004, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 22), t('Serie C1', 2, 18), t('Serie C2', 3, 18)] },
  { from: 2008, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 22), t('Lega Pro Prima Divisione', 2, 18), t('Lega Pro Seconda Divisione', 3, 18)] },
  { from: 2011, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 22), t('Lega Pro Prima Divisione', 2, 18), t('Lega Pro Seconda Divisione', 2, 20)] },
  { from: 2012, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 22), t('Lega Pro Prima Divisione', 2, 18), t('Lega Pro Seconda Divisione', 2, 18)] },
  { from: 2014, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 22), t('Lega Pro', 3, 20), t('Serie D', 9, 18)] },
  { from: 2017, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 22), t('Serie C', 3, 20), t('Serie D', 9, 18)] },
  { from: 2018, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 19), t('Serie C', 3, 20), t('Serie D', 9, 18)] },
  { from: 2019, tiers: [t('Serie A', 1, 20), t('Serie B', 1, 20), t('Serie C', 3, 20), t('Serie D', 9, 18)] },
];

const FRA: TierEra[] = [
  { from: 1975, tiers: [t('Division 1', 1, 20), t('Division 2', 2, 18), t('Division 3', 6, 16), t("Division d'Honneur", 1, null)] },
  { from: 1978, tiers: [t('Division 1', 1, 20), t('Division 2', 2, 18), t('Division 3', 6, 16), t('Division 4', 8, 14)] },
  { from: 1993, tiers: [t('Division 1', 1, 20), t('Division 2', 1, 22), t('National 1', 2, 18), t('National 2', 4, 16)] },
  { from: 1997, tiers: [t('Division 1', 1, 18), t('Division 2', 1, 22), t('National', 1, 20), t('CFA', 4, 18)] },
  { from: 1998, tiers: [t('Division 1', 1, 18), t('Division 2', 1, 20), t('National', 1, 20), t('CFA', 4, 18)] },
  { from: 2002, tiers: [t('Ligue 1', 1, 20), t('Ligue 2', 1, 20), t('National', 1, 20), t('CFA', 4, 18)] },
  { from: 2013, tiers: [t('Ligue 1', 1, 20), t('Ligue 2', 1, 20), t('National', 1, 18), t('CFA', 4, 16)] },
  { from: 2017, tiers: [t('Ligue 1', 1, 20), t('Ligue 2', 1, 20), t('National', 1, 18), t('National 2', 4, 16)] },
  { from: 2023, tiers: [t('Ligue 1', 1, 18), t('Ligue 2', 1, 20), t('National', 1, 18), t('National 2', 4, 14)] },
  { from: 2024, tiers: [t('Ligue 1', 1, 18), t('Ligue 2', 1, 18), t('National', 1, 18), t('National 2', 3, 16)] },
  { from: 2026, tiers: [t('Ligue 1', 1, 18), t('Ligue 2', 1, 18), t('Ligue 3', 1, 18), t('National 1', 3, 16)] },
];

const GER: TierEra[] = [
  { from: 1975, tiers: [t('1. Liga', 1, 18), t('2. Liga', 2, 20), t('Amateurligen', 15, null), t('Landesligen', 1, null)] },
  { from: 1978, tiers: [t('1. Liga', 1, 18), t('2. Liga', 2, 20), t('Amateur-Oberligen', 8, 18), t('Verbandsligen', 1, null)] },
  { from: 1981, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 20), t('Amateur-Oberligen', 8, 18), t('Verbandsligen', 1, null)] },
  { from: 1991, tiers: [t('1. Liga', 1, 20), t('2. Liga', 2, 12), t('Oberligen', 11, 18), t('Verbandsligen', 1, null)] },
  { from: 1992, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 24), t('Oberligen', 11, 18), t('Verbandsligen', 1, null)] },
  { from: 1993, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 20), t('Oberligen', 11, 18), t('Verbandsligen', 1, null)] },
  { from: 1994, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 18), t('Regionalligen', 4, 18), t('Oberligen', 10, 18)] },
  { from: 2000, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 18), t('Regionalligen', 2, 18), t('Oberligen', 10, 18)] },
  { from: 2004, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 18), t('Regionalligen', 2, 18), t('Oberligen', 9, 18)] },
  { from: 2008, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 18), t('3. Liga', 1, 20), t('Regionalligen', 3, 18)] },
  { from: 2012, tiers: [t('1. Liga', 1, 18), t('2. Liga', 1, 18), t('3. Liga', 1, 20), t('Regionalligen', 5, 18)] },
];

/** Länder mit Strukturdaten, Schlüssel = Ländercode aus data/world/countries.ts. */
const BY_CC: Record<string, TierEra[]> = { eng: ENG, esp: ESP, ita: ITA, fra: FRA, ger: GER };

/** Ebene 1–4 des Landes in der Saison mit Startjahr `year` (null = keine Strukturdaten). */
export function historicTiers(cc: string, year: number): TierRow[] | null {
  const eras = BY_CC[cc];
  if (!eras) return null;
  let hit = eras[0];
  for (const e of eras) if (e.from <= year) hit = e;
  return hit.tiers;
}

/** Kurztext „4 Staffeln · je 20 Mannschaften“ bzw. „20 Mannschaften“ / „regional“. */
export function tierText(r: TierRow): string {
  const teams = r.teams == null ? 'regional verschieden' : `${r.groups > 1 ? 'je ' : ''}${r.teams} Mannschaften`;
  if (r.groups > 1) return `${r.groups} Staffeln · ${teams}`;
  return r.teams == null ? 'regionale Staffeln' : teams;
}
