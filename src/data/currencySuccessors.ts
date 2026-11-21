// =============================================================================
// WÄHRUNGEN DER NACHFOLGESTAATEN (Wunsch Pascal: immer die historisch richtige
// Währung) – für Spiele, die in der Tschechoslowakei, der Sowjetunion oder
// Jugoslawien begonnen haben und über die Auflösung hinaus laufen.
// -----------------------------------------------------------------------------
// Das Heimatland des Spielstands bleibt (`tch`/`urs`/`yug`); welche Währung nach
// der Auflösung gilt, richtet sich nach der Stadt des eigenen Vereins:
// `homeCurrencyKey('tch', 'Bratislava')` → „tch:svk“. Unbekannte Stadt = größter
// Nachfolger (Tschechien, Russland, BR Jugoslawien/Serbien; data/currencies.ts).
// Kurse wie dort: [Jahr, DM je Einheit], Jahresmittel, grob gerundet; ab 1999 aus
// dem Eurokurs. Bis zur eigenen Währung gilt der Rubel bzw. Dinar weiter.
// Quellen: Stichtage und Umstellungsverhältnisse nach den Nationalbanken (Lietuvos
// bankas, Eesti Pank, Latvijas Banka, Banka Slovenije, Centralna banka BiH, NBRM,
// CBCG, Nationalbanken Georgiens, Armeniens, Aserbaidschans, Belarus’, Kasachstans,
// Usbekistans, Tadschikistans); Kurse: IWF International Financial Statistics
// (Jahresmittel je US-Dollar, über den DM- bzw. Euro-Dollarkurs umgerechnet), EZB.
// =============================================================================
import { EURO, eur, type CurrencyEra } from './currencyParts';

/** Stadt des Vereins → Nachfolgestaat (Stadtnamen wie in den Weltdaten, alte und neue Namen). */
const CITY_STATE: Record<string, Record<string, string[]>> = {
  tch: {
    svk: ['Bratislava', 'Košice', 'Trnava', 'Prešov', 'Žilina', 'Nitra', 'Banská Bystrica', 'Dunajská Streda', 'Trenčín', 'Michalovce', 'Ružomberok', 'Považská Bystrica', 'Martin', 'Senica'],
  },
  urs: {
    ukr: ['Kiew', 'Charkiw', 'Dnipropetrowsk', 'Dnipro', 'Donezk', 'Lwiw', 'Nikolajew', 'Mykolajiw', 'Odessa', 'Saporischschja', 'Simferopol', 'Woroschilowgrad', 'Luhansk', 'Poltawa', 'Ternopil', 'Tscherniwzi', 'Uschhorod'],
    ltu: ['Wilna', 'Vilnius', 'Kaunas', 'Klaipėda'],
    lva: ['Riga', 'Liepāja', 'Daugavpils'],
    est: ['Tallinn', 'Tartu'],
    blr: ['Minsk', 'Brest', 'Gomel', 'Homel', 'Witebsk'],
    geo: ['Tiflis', 'Kutaissi', 'Lantschchuti', 'Batumi', 'Suchumi'],
    arm: ['Jerewan', 'Eriwan', 'Leninakan'],
    aze: ['Baku', 'Kirowabad', 'Gandscha'],
    kaz: ['Alma-Ata', 'Almaty', 'Karaganda', 'Tschimkent'],
    uzb: ['Taschkent', 'Samarkand'],
    tjk: ['Duschanbe'],
  },
  yug: {
    cro: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Vinkovci', 'Šibenik', 'Pula', 'Zadar', 'Varaždin'],
    svn: ['Ljubljana', 'Maribor', 'Celje', 'Koper'],
    bih: ['Sarajevo', 'Mostar', 'Tuzla', 'Zenica', 'Banja Luka', 'Bugojno'],
    mkd: ['Skopje', 'Bitola', 'Tetovo', 'Prilep'],
    mne: ['Titograd', 'Podgorica', 'Nikšić'],
    kos: ['Priština', 'Kosovska Mitrovica'],
  },
};

/** Schlüssel in `CURRENCIES` für ein Heimatland und die Stadt des eigenen Vereins. */
export function homeCurrencyKey(cc: string | undefined, city?: string | null): string | undefined {
  const states = cc ? CITY_STATE[cc] : undefined;
  if (!states || !city) return cc;
  for (const [st, cities] of Object.entries(states)) if (cities.includes(city)) return `${cc}:${st}`;
  return cc;
}

/** Rubelzone 1992/93: der Rubel läuft bis zur eigenen Währung weiter (gleicher Code wie zuvor = keine Meldung im Briefing). */
const RUBLE_ZONE: CurrencyEra = { from: '1992-01-01', code: 'SUR', unit: 'Rbl', name: 'Rubel', rates: [[1992, 0.0071], [1993, 0.00167], [1994, 0.00073], [1995, 0.00032]] };
const DM_ERA = (from: string, note: string): CurrencyEra => ({ from, code: 'DEM', unit: 'DM', name: 'D-Mark', rates: [[1999, 1]], note });

/** Währungsfolgen der Nachfolgestaaten; `base` = Tabelle aus data/currencies.ts (Vorgänger + große Nachfolger). */
export function successorCurrencies(base: Record<string, CurrencyEra[]>): Record<string, CurrencyEra[]> {
  const before = (cc: string, iso: string) => base[cc].filter((e) => e.from < iso);
  const SUR = before('urs', '1992-01-01');
  const YU = before('yug', '1991-01-01'); // Dinar 1966, Neuer Dinar 1990
  const YU_SRB = base.yug; // bis in die BR Jugoslawien (Montenegro, Kosovo)
  return {
    'tch:svk': [...before('tch', '1993-01-01'), ...base.svk],
    'urs:ukr': [...SUR, ...base.ukr],
    'yug:cro': [...YU, ...base.cro],
    // Litauen: Talonas 1.10.1992 (1 : 1 zum Rubel), Litas 25.6.1993 (100 : 1), 1994–2002 fest 4 Litas = 1 US-$, danach 3,4528 je Euro.
    'urs:ltu': [...SUR, RUBLE_ZONE,
      { from: '1992-10-01', code: 'LTT', unit: 'Tal', name: 'Talonas', rates: [[1992, 0.0060], [1993, 0.0039]] },
      { from: '1993-06-25', code: 'LTL', unit: 'Lt', name: 'Litas', note: '100 Talonas = 1 Litas', rates: [[1993, 0.39], [1994, 0.405], [1995, 0.358], [1996, 0.376], [1997, 0.434], [1998, 0.440], [1999, 0.459], [2000, 0.530], [2001, 0.546], [2002, 0.5665]] },
      EURO('2015-01-01', '1 € = 3,45280 Litas')],
    // Lettland: Lettischer Rubel 7.5.1992 (1 : 1), Lats 5.3.1993 (200 : 1), ab 2005 fest 0,702804 je Euro.
    'urs:lva': [...SUR, RUBLE_ZONE,
      { from: '1992-05-07', code: 'LVR', unit: 'LVR', name: 'Lettischer Rubel', rates: [[1992, 0.0080], [1993, 0.0120]] },
      { from: '1993-03-05', code: 'LVL', unit: 'Ls', name: 'Lats', note: '200 Lettische Rubel = 1 Lats', rates: [[1993, 2.45], [1994, 2.90], [1995, 2.71], [1997, 2.98], [1998, 2.98], ...eur([[1999, 1.60], [2001, 1.786], [2003, 1.56], [2005, 1.4229], [2013, 1.4229]])] },
      EURO('2014-01-01', '1 € = 0,702804 Lats')],
    // Estland: Krone 20.6.1992 (10 Rubel = 1 Krone), fest 8 Kronen = 1 DM.
    'urs:est': [...SUR, RUBLE_ZONE,
      { from: '1992-06-20', code: 'EEK', unit: 'EEK', name: 'Estnische Krone', note: '10 Rubel = 1 Krone (fest 8 Kronen = 1 DM)', rates: [[1992, 0.125]] },
      EURO('2011-01-01', '1 € = 15,6466 Kronen')],
    // Belarus: Rubel 25.5.1992 (1 : 10), 20.8.1994 (10 : 1, Kurse hier durchgehend in dieser Einheit), 1.1.2000 (1.000 : 1), 1.7.2016 (10.000 : 1).
    'urs:blr': [...SUR, RUBLE_ZONE,
      { from: '1992-05-25', code: 'BYB', unit: 'BYR', name: 'Belarussischer Rubel', rates: [[1992, 0.071], [1993, 0.0061], [1994, 0.00044], [1995, 0.000124], [1996, 0.000114], [1997, 0.0000665], [1998, 0.000038], [1999, 0.0000074]] },
      { from: '2000-01-01', code: 'BYR', unit: 'BYR', name: 'Belarussischer Rubel', note: '1.000 alte Rubel = 1 Rubel', rates: eur([[2000, 0.00123], [2001, 0.00080], [2005, 0.000373], [2008, 0.000318], [2010, 0.000253], [2011, 0.000145], [2012, 0.0000934], [2015, 0.0000565]]) },
      { from: '2016-07-01', code: 'BYN', unit: 'BYN', name: 'Belarussischer Rubel', note: '10.000 alte Rubel = 1 Rubel', rates: eur([[2016, 0.455], [2018, 0.416], [2020, 0.358], [2022, 0.361], [2023, 0.308], [2025, 0.290]]) }],
    // Georgien: Kupon 5.4.1993 (1 : 1 zum Rubel), Lari 2.10.1995 (1.000.000 : 1).
    'urs:geo': [...SUR, RUBLE_ZONE,
      { from: '1993-04-05', code: 'GEK', unit: 'Kup', name: 'Georgischer Kupon', rates: [[1993, 0.00050], [1994, 0.0000015], [1995, 0.0000011]] },
      { from: '1995-10-02', code: 'GEL', unit: 'GEL', name: 'Lari', note: '1.000.000 Kupon = 1 Lari', rates: [[1995, 1.15], [1996, 1.19], [1997, 1.33], [1998, 1.27], ...eur([[1999, 0.465], [2000, 0.548], [2005, 0.444], [2010, 0.424], [2015, 0.397], [2018, 0.335], [2020, 0.282], [2022, 0.326], [2023, 0.352], [2025, 0.330]])] }],
    // Armenien: Dram 22.11.1993 (200 Rubel = 1 Dram).
    'urs:arm': [...SUR, RUBLE_ZONE,
      { from: '1993-11-22', code: 'AMD', unit: 'Dram', name: 'Dram', note: '200 Rubel = 1 Dram', rates: [[1993, 0.020], [1994, 0.0056], [1995, 0.00352], [1998, 0.00349], ...eur([[1999, 0.00175], [2000, 0.00200], [2005, 0.00175], [2008, 0.00222], [2010, 0.00202], [2015, 0.00189], [2020, 0.00179], [2023, 0.00236], [2025, 0.00235]])] }],
    // Aserbaidschan: Manat 15.8.1992 (10 Rubel = 1 Manat), neuer Manat 1.1.2006 (5.000 : 1).
    'urs:aze': [...SUR, RUBLE_ZONE,
      { from: '1992-08-15', code: 'AZM', unit: 'Man', name: 'Manat (alt)', rates: [[1992, 0.050], [1993, 0.0165], [1994, 0.00103], [1995, 0.000324], [1997, 0.000434], [1998, 0.000455], ...eur([[1999, 0.000228], [2000, 0.000242], [2005, 0.000170]])] },
      { from: '2006-01-01', code: 'AZN', unit: 'Man', name: 'Manat', note: '5.000 alte Manat = 1 Manat', rates: eur([[2006, 0.891], [2008, 0.829], [2010, 0.940], [2014, 0.960], [2015, 0.880], [2016, 0.565], [2017, 0.520], [2020, 0.515], [2022, 0.560], [2025, 0.530]]) }],
    // Kasachstan: Tenge 15.11.1993 (500 Rubel = 1 Tenge).
    'urs:kaz': [...SUR, RUBLE_ZONE,
      { from: '1993-11-15', code: 'KZT', unit: 'Tenge', name: 'Tenge', note: '500 Rubel = 1 Tenge', rates: [[1993, 0.33], [1994, 0.045], [1995, 0.0235], [1997, 0.0229], [1998, 0.0225], ...eur([[1999, 0.0078], [2000, 0.0076], [2005, 0.00605], [2008, 0.00565], [2010, 0.00512], [2014, 0.0042], [2016, 0.00264], [2020, 0.00212], [2023, 0.00203], [2025, 0.00175]])] }],
    // Usbekistan: Sum-Kupon 15.11.1993 (1 : 1 zum Rubel), Sum 1.7.1994 (1.000 : 1).
    'urs:uzb': [...SUR, RUBLE_ZONE,
      { from: '1993-11-15', code: 'UZC', unit: 'Sum', name: 'Sum-Kupon', rates: [[1993, 0.0014], [1994, 0.00030]] },
      { from: '1994-07-01', code: 'UZS', unit: 'Sum', name: 'Sum', note: '1.000 Sum-Kupon = 1 Sum', rates: [[1994, 0.147], [1995, 0.048], [1997, 0.026], [1998, 0.0185], ...eur([[1999, 0.0075], [2001, 0.00264], [2005, 0.00072], [2010, 0.000475], [2015, 0.00035], [2018, 0.000105], [2020, 0.000087], [2023, 0.0000788], [2025, 0.0000714]])] }],
    // Tadschikistan: Tadschikischer Rubel 10.5.1995 (100 : 1), Somoni 30.10.2000 (1.000 : 1).
    'urs:tjk': [...SUR, RUBLE_ZONE,
      { from: '1995-05-10', code: 'TJR', unit: 'TJR', name: 'Tadschikischer Rubel', note: '100 Rubel = 1 Tadschikischer Rubel', rates: [[1995, 0.020], [1996, 0.0051], [1997, 0.0031], [1998, 0.00227], [1999, 0.00148], [2000, 0.00120]] },
      { from: '2000-10-30', code: 'TJS', unit: 'Som', name: 'Somoni', note: '1.000 Tadschikische Rubel = 1 Somoni', rates: eur([[2000, 0.50], [2001, 0.47], [2005, 0.258], [2010, 0.172], [2015, 0.146], [2018, 0.0926], [2020, 0.085], [2025, 0.087]]) }],
    // Slowenien: Tolar 8.10.1991 (1 : 1 zum Dinar), Euro 1.1.2007.
    'yug:svn': [...YU,
      { from: '1991-10-08', code: 'SIT', unit: 'SIT', name: 'Tolar', rates: [[1991, 0.031], [1992, 0.0192], [1993, 0.0146], [1994, 0.0126], [1995, 0.0121], [1996, 0.0111], [1997, 0.01086], [1998, 0.0106], ...eur([[1999, 0.00514], [2001, 0.00460], [2004, 0.00418], [2006, 0.004173]])] },
      EURO('2007-01-01', '1 € = 239,640 Tolar')],
    // Bosnien-Herzegowina: BiH-Dinar 1.7.1992 (Hochinflation, grob), neuer Dinar 15.8.1994 (10.000 : 1, 100 Dinar = 1 DM), Konvertible Mark 22.6.1998 (1 KM = 1 DM).
    'yug:bih': [...YU,
      { from: '1992-07-01', code: 'BAD', unit: 'Din', name: 'Bosnisch-herzegowinischer Dinar', rates: [[1992, 0.0040], [1993, 0.000010], [1994, 0.0000010]] },
      { from: '1994-08-15', code: 'BAN', unit: 'Din', name: 'Neuer Dinar', note: '10.000 Dinar = 1 Neuer Dinar', rates: [[1994, 0.01]] },
      { from: '1998-06-22', code: 'BAM', unit: 'KM', name: 'Konvertible Mark', note: '100 Dinar = 1 Konvertible Mark (fest 1 KM = 1 DM)', rates: [[1998, 1]] }],
    // Mazedonien: Denar 26.4.1992 (1 : 1 zum Dinar), neuer Denar 10.5.1993 (100 : 1).
    'yug:mkd': [...YU,
      { from: '1992-04-26', code: 'MKN', unit: 'Den', name: 'Denar (alt)', rates: [[1992, 0.0025], [1993, 0.00072]] },
      { from: '1993-05-10', code: 'MKD', unit: 'Den', name: 'Denar', note: '100 alte Denar = 1 Denar', rates: [[1993, 0.0717], [1994, 0.0374], [1995, 0.0376], [1997, 0.0345], [1998, 0.0323], ...eur([[1999, 0.0165], [2025, 0.01626]])] }],
    // Montenegro: Dinar der BR Jugoslawien, D-Mark ab 2.11.1999, Euro 1.1.2002.
    'yug:mne': [...YU_SRB.filter((e) => e.from < '1999-11-02'), DM_ERA('1999-11-02', 'D-Mark als Zahlungsmittel neben dem Dinar, ab November 2000 allein'), EURO('2002-01-01', '1 € = 1,95583 DM')],
    // Kosovo: Dinar der BR Jugoslawien, D-Mark ab 3.9.1999 (UNMIK), Euro 1.1.2002.
    'yug:kos': [...YU_SRB.filter((e) => e.from < '1999-09-03'), DM_ERA('1999-09-03', 'D-Mark als Zahlungsmittel (UNMIK)'), EURO('2002-01-01', '1 € = 1,95583 DM')],
  };
}
