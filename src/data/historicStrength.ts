// =============================================================================
// HISTORISCHE STÄRKE DER VEREINE (Option „Entwicklung der anderen Vereine“)
// -----------------------------------------------------------------------------
// Je Spiel-Verein eine Zielkurve „Ressourcen/Stärkerang“ über die Jahre: Faktor
// 0,7 (abgestürzt, kaum Mittel) … 1,0 (normal für seine Liga) … 1,42 (Weltspitze,
// z. B. FC Bayern ab 2012, Real Madrid). Stützpunkte [Saison-Startjahr, Faktor],
// dazwischen linear, vor dem ersten und nach dem letzten Punkt konstant
// (Fortschreibung nach 2025 = letzter Stand). Die Kurve wirkt nur auf KI-Vereine
// (game/historicSteer.ts) und nur, wenn beim Spielstart „Mittel“ oder „Stark“
// gewählt wurde. Sie ist keine Ergebnisvorgabe: Sie lenkt Ruf, Marke, Geld und bei
// Sim-Vereinen die Stärke sanft in diese Richtung.
//
// Zuordnung echter Verein → Spiel-Verein (Städtenamen, data/generate.ts, data/ddr.ts,
// data/history/historicClubs.ts, data/europe.ts, generierte Auslandsvereine in
// engine/world.ts nach Stadt). Wo der echte Verein im Spiel fehlt, trägt der
// Verein derselben Stadt bzw. desselben Stadtteils die Kurve:
//   Manchester (w_, einziger Verein der Stadt) = Manchester United UND City
//   London Nord = Arsenal/Tottenham (beide Nord-London); Chelsea fehlt (kein West-London-Verein)
//   Leipzig (DDR, Lok) = bis 1991 Lok Leipzig, ab 2009 RB Leipzig (gleiche Stadt)
//   Winterslag = KRC Genk (1988 aus Waterschei und Winterslag entstanden)
//   Rom = AS Rom, Rom Rot = Lazio; Birmingham = Aston Villa; Nottingham = Forest
//   Hoffenheim, RB Salzburg u. a. fehlen im Spiel und bekommen keine Kurve.
//
// Quellen (abgerufen 11/2026):
//   Meister je Land: de/en.wikipedia.org „Liste der deutschen Fußballmeister“,
//     „List of English football champions“, „List of Spanish football champions“,
//     „List of Italian football champions“, „List of French football champions“
//     (en.wikipedia.org/wiki/List_of_French_football_champions),
//     „List of Dutch football champions“ + flashscore.com „All Eredivisie champions in history“,
//     topendsports.com „Portugal, (Primeira) Liga Winners“ (list-league-superliga.htm),
//     rsssf.org/tablesb/belgchamp.html (Belgien), „List of Scottish football champions“,
//     „DDR-Oberliga“ (Meister 1975–1991: Dresden 76–78/89/90, BFC Dynamo 79–88, Rostock 91).
//   Europapokalsieger: „List of European Cup and UEFA Champions League finals“,
//     „UEFA Cup and Europa League finals“, „Cup Winners' Cup finals“.
//   Umsatzranking ab 1996/97: Deloitte Football Money League
//     (en.wikipedia.org/wiki/Deloitte_Football_Money_League): Man Utd 1996/97–2003/04
//     Platz 1, Real Madrid 2004/05–2014/15, Bayern ab 1997/98 stets Top 5, Man City ab
//     2011/12 Top 7 und 2020/21–2021/22 Platz 1, PSG ab 2011/12, Schalke 2010/11 Top 10.
//   UEFA-Klubkoeffizienten (kassiesa.net/uefa/data) für die Mittelklasse je Jahrzehnt.
// Die Faktoren sind Spielwerte, abgeleitet aus Titeln, Europapokal-Erfolgen und
// Umsatzrang – keine Messwerte.
// =============================================================================

export type Curve = [year: number, factor: number][];

/** Deutsche Vereine (West + DDR) nach Spiel-ID. */
export const GERMAN_CURVES: Record<string, Curve> = {
  // FC Bayern: Europapokalsieger 1974–76, ab den 80ern Serienmeister (1980–90: 6 Titel),
  // Umsatz Top 5 Europas ab 1997/98; 2012/13–2022/23 elf Titel in Folge, Meister 2025.
  muc: [[1975, 1.25], [1980, 1.3], [1990, 1.32], [2000, 1.36], [2012, 1.42]],
  // Gladbach: Meister 1975–77, UEFA-Pokal 1975/79; danach Mittelmaß, Abstieg 2007, CL 2015/2019.
  mgl: [[1975, 1.3], [1979, 1.2], [1985, 1.04], [1995, 0.98], [2005, 0.92], [2011, 1.05], [2020, 1.0]],
  // HSV: Meister 1979/82/83, Landesmeister 1983; danach Abstieg ins Mittelfeld, Abstieg 2018, Rückkehr 2025.
  ham: [[1975, 1.15], [1978, 1.25], [1983, 1.28], [1987, 1.1], [1992, 1.0], [2008, 1.0], [2012, 0.9], [2018, 0.85], [2025, 0.92]],
  // Köln: Double 1978, Vize 1989/90; erster Abstieg 1998, seitdem Fahrstuhl.
  kln: [[1975, 1.15], [1978, 1.2], [1985, 1.1], [1990, 1.05], [1998, 0.88], [2005, 0.9]],
  // Frankfurt: UEFA-Pokal 1980, Pokal 1981/88; Abstieg 1996; Europa League 2022.
  fra: [[1975, 1.08], [1980, 1.1], [1990, 1.08], [1996, 0.9], [2005, 0.95], [2017, 1.05], [2022, 1.1]],
  // Kaiserslautern: Meister 1991 und 1998; Abstieg 2006, später 3. Liga.
  kai: [[1975, 1.0], [1990, 1.12], [1998, 1.15], [2003, 0.95], [2006, 0.85], [2012, 0.8]],
  // Schalke: Abstiege 1981/83/88; UEFA-Pokal 1997, Umsatz Top 10 2010/11; Abstieg 2021.
  gel: [[1975, 1.1], [1980, 0.92], [1991, 1.0], [1997, 1.1], [2001, 1.18], [2011, 1.15], [2019, 1.0], [2021, 0.85]],
  // Werder: Meister 1988/93/2004, Pokalsieger-Cup 1992; ab 2013 Mittelfeld.
  bre: [[1975, 0.95], [1981, 1.1], [1988, 1.18], [1993, 1.15], [1999, 1.08], [2004, 1.18], [2010, 1.05], [2013, 0.97]],
  // Hertha: Abstieg 1980, Oberliga 1986–88; CL 1999; Investor 2019.
  ber: [[1975, 1.05], [1979, 0.95], [1986, 0.8], [1997, 1.0], [1999, 1.08], [2010, 0.95], [2019, 1.0], [2023, 0.88]],
  dus: [[1975, 0.98], [1979, 1.02], [1987, 0.85], [2000, 0.8], [2012, 0.85]],
  kar: [[1975, 0.92], [1993, 1.0], [1998, 0.85]],
  kre: [[1975, 0.9], [1983, 1.0], [1986, 1.02], [1991, 0.9], [1996, 0.8]],
  bra: [[1975, 0.98], [1980, 0.92], [1985, 0.85]],
  ess: [[1975, 0.92], [1978, 0.88], [1985, 0.8]],
  dui: [[1975, 0.95], [1985, 0.88]],
  han: [[1975, 0.92], [1987, 0.88], [2002, 0.97], [2016, 0.9]],
  boc: [[1975, 0.92], [1995, 0.9]],
  off: [[1975, 0.9], [1984, 0.82]],
  // Dortmund: Rückkehr 1976, Pokal 1989; Meister 1995/96/2002, CL 1997; Beinahe-Pleite 2004/05;
  // Meister 2011/12, CL-Finale 2013/2024, Umsatz Top 12 Europas.
  n_dor: [[1975, 1.0], [1986, 1.05], [1992, 1.18], [1995, 1.25], [2002, 1.25], [2004, 1.0], [2009, 1.12], [2011, 1.28]],
  // Leverkusen: Aufstieg 1979, UEFA-Pokal 1988, CL-Finale 2002, Meister 2024 (Konzern Bayer).
  n_lev: [[1975, 0.95], [1979, 1.02], [1988, 1.1], [1996, 1.18], [2002, 1.2], [2005, 1.12], [2023, 1.22]],
  // Stuttgart: Aufstieg 1977, Meister 1984/92/2007; Abstiege 2016/2019; Pokal 2025.
  s_vfb: [[1975, 1.0], [1977, 1.12], [1984, 1.15], [1992, 1.12], [2007, 1.12], [2015, 0.95], [2023, 1.1]],
  s_nue: [[1975, 0.95], [1985, 0.92], [2000, 0.9]],
  s_muc: [[1975, 0.95], [1994, 1.0], [2004, 0.85]],
  // Wolfsburg: Aufstieg 1997, Meister 2009 (VW-Konzern), Pokal 2015.
  h_wob: [[1975, 0.9], [1997, 1.05], [2007, 1.15], [2009, 1.18], [2016, 1.05]],
  h_fre: [[1975, 0.9], [1993, 0.95], [2016, 1.02], [2021, 1.08]],
  s_mai: [[1975, 0.9], [2004, 0.98]],
  s_aug: [[1975, 0.9], [2011, 0.98]],
  // Leipzig: Lok (CWC-Finale 1987), nach 1991 tief; ab 2009 RB (Bundesliga 2016, Pokal 2022/23).
  'ddr-leipzig': [[1975, 1.0], [1988, 1.05], [1992, 0.8], [2009, 0.95], [2014, 1.1], [2016, 1.22]],
  // DDR: Dresden Meister 1976–78/89/90; BFC Dynamo 1979–88 zehnmal in Folge; Magdeburg CWC 1974.
  'ddr-dresden': [[1975, 1.25], [1979, 1.12], [1988, 1.2], [1991, 1.0], [1995, 0.85]],
  'ddr-berlin-ost': [[1975, 1.05], [1978, 1.35], [1988, 1.3], [1990, 0.85], [1991, 0.75]],
  'ddr-magdeburg': [[1975, 1.2], [1980, 1.05], [1991, 0.8]],
  'ddr-jena': [[1975, 1.1], [1981, 1.1], [1991, 0.85]],
  // Rostock: letzter DDR-Meister 1991, Bundesliga 1995–2005.
  'ddr-rostock': [[1975, 0.95], [1990, 1.08], [1995, 1.0], [2005, 0.85]],
  // Union Berlin (Köpenick): Bundesliga 2019, Champions League 2023.
  'ddr-union': [[1975, 0.9], [2019, 1.05], [2022, 1.15], [2024, 1.0]],
  'ddr-chemnitz': [[1975, 1.0], [1991, 0.85]],
  'ddr-erfurt': [[1975, 1.0], [1991, 0.85]],
};

/** Auslandsvereine nach „Land|Name“ (Name wie im Spiel). */
export const FOREIGN_CURVES: Record<string, Curve> = {
  // England: Liverpool Meister 1976–90 (10×) und Landesmeister 1977/78/81/84; CL 2005/2019, Meister 2020/25.
  'England|Liverpool Rot': [[1975, 1.38], [1990, 1.2], [1995, 1.12], [2004, 1.15], [2010, 1.05], [2016, 1.25], [2019, 1.32]],
  // Manchester: United 13 Titel 1993–2013, Umsatz Platz 1 1996/97–2003/04; City Meister 2012–2024 (8×).
  'England|Manchester': [[1975, 1.05], [1986, 1.12], [1990, 1.25], [1993, 1.38], [2013, 1.3], [2016, 1.38]],
  // Nord-London: Arsenal Meister 1989/91/98/2002/04, Tottenham Umsatz Top 10 ab 2016.
  'England|London Nord': [[1975, 1.05], [1988, 1.18], [1997, 1.28], [2006, 1.2], [2016, 1.18], [2022, 1.25]],
  'England|London Ost': [[1975, 1.0], [2016, 1.05]],
  'England|Leeds': [[1975, 1.15], [1980, 0.95], [1990, 1.1], [2000, 1.12], [2004, 0.85], [2020, 0.98]],
  // Nottingham Forest: Meister 1978, Landesmeister 1979/80. Aston Villa: Meister 1981, Landesmeister 1982.
  'England|Nottingham': [[1975, 1.0], [1977, 1.2], [1981, 1.05], [1993, 0.9]],
  'England|Birmingham': [[1975, 1.0], [1980, 1.12], [1983, 1.0]],
  // Everton Meister 1985/87; Derby Meister 1975; Ipswich UEFA-Pokal 1981.
  'England|Liverpool Blau': [[1975, 1.0], [1984, 1.15], [1988, 1.0], [2000, 0.98]],
  'England|Derby': [[1975, 1.1], [1980, 0.9]],
  'England|Ipswich': [[1975, 1.05], [1983, 0.9]],
  'England|Newcastle': [[1975, 0.98], [1993, 1.12], [2004, 1.0], [2021, 1.15]],
  'England|Blackburn': [[1975, 1.0], [1992, 1.1], [1996, 0.98]],
  'England|Leicester': [[1975, 1.0], [2015, 1.08]],
  // Spanien: Real Madrid (Umsatz Platz 1 2004/05–2014/15 und ab 2022/23), Barcelona; Atlético Meister 1977/96/2014/21.
  'Spanien|Madrid Weiß': [[1975, 1.35], [1995, 1.32], [2000, 1.42]],
  'Spanien|Barcelona': [[1975, 1.3], [1988, 1.35], [2004, 1.4], [2021, 1.32], [2023, 1.38]],
  'Spanien|Madrid Rot-Weiß': [[1975, 1.15], [1980, 1.05], [1996, 1.1], [2000, 0.95], [2011, 1.15], [2013, 1.25]],
  // Bilbao Meister 1983/84, San Sebastián 1981/82, Valencia 2002/04, Deportivo 2000, Sevilla UEFA-Pokal ab 2006.
  'Spanien|Bilbao': [[1975, 1.0], [1980, 1.1], [1985, 1.0]],
  'Spanien|San Sebastián': [[1975, 1.0], [1979, 1.12], [1985, 1.0]],
  'Spanien|Valencia': [[1975, 1.0], [1999, 1.18], [2005, 1.1], [2015, 0.95]],
  'Spanien|Sevilla': [[1975, 1.0], [2005, 1.12]],
  'Spanien|La Coruña': [[1975, 0.95], [1992, 1.08], [1999, 1.15], [2004, 1.0], [2011, 0.85]],
  // Italien: Juventus Serienmeister (1975–86, 1994–2003, 2012–2020), Zwangsabstieg 2006;
  // Milan unter Berlusconi ab 1986, Inter 2006–10 und 2021/24; Napoli 1987/90/2023/25.
  'Italien|Turin Schwarz-Weiß': [[1975, 1.35], [1990, 1.25], [1994, 1.35], [2006, 1.0], [2007, 1.15], [2011, 1.38], [2020, 1.25], [2022, 1.15]],
  'Italien|Mailand Rot-Schwarz': [[1975, 1.1], [1980, 0.92], [1986, 1.32], [1996, 1.25], [2007, 1.25], [2012, 1.05], [2018, 1.08], [2021, 1.15]],
  'Italien|Mailand Blau-Schwarz': [[1975, 1.15], [1995, 1.2], [2004, 1.3], [2011, 1.12], [2019, 1.25]],
  'Italien|Neapel': [[1975, 1.0], [1984, 1.2], [1991, 1.0], [1998, 0.88], [2004, 0.85], [2008, 1.0], [2010, 1.12], [2022, 1.18]],
  'Italien|Rom': [[1975, 1.0], [1980, 1.12], [1985, 1.05], [1999, 1.15], [2010, 1.1]],
  'Italien|Rom Rot': [[1975, 0.95], [1998, 1.12], [2003, 1.0]],
  'Italien|Turin Granat': [[1975, 1.12], [1980, 0.98]],
  'Italien|Verona': [[1975, 1.0], [1984, 1.05], [1987, 0.95]],
  'Italien|Sampdoria-Genua': [[1975, 0.95], [1985, 1.08], [1990, 1.12], [1995, 0.95]],
  'Italien|Parma': [[1975, 0.95], [1992, 1.1], [2003, 0.95]],
  // Frankreich: Saint-Étienne 70er, Bordeaux 80er, Marseille 1989–93, Lyon 2002–08, PSG ab 2012 (QSI).
  'Frankreich|Saint-Étienne': [[1975, 1.25], [1982, 0.95]],
  'Frankreich|Paris': [[1975, 1.0], [1985, 1.08], [1991, 1.12], [1998, 1.0], [2011, 1.3], [2013, 1.42]],
  'Frankreich|Marseille': [[1975, 1.0], [1986, 1.25], [1993, 0.9], [1996, 1.05], [2009, 1.1]],
  'Frankreich|Lyon': [[1975, 0.95], [1999, 1.1], [2001, 1.25], [2009, 1.12], [2018, 1.05]],
  'Frankreich|Bordeaux': [[1975, 1.0], [1983, 1.18], [1991, 0.95], [1998, 1.08], [2014, 0.95], [2021, 0.8]],
  'Frankreich|Nantes': [[1975, 1.1], [1984, 1.0], [1994, 1.08], [2001, 1.0], [2008, 0.92]],
  'Frankreich|Monaco': [[1975, 1.0], [1977, 1.1], [1996, 1.12], [2004, 1.08], [2008, 0.95], [2013, 1.15]],
  'Frankreich|Lille': [[1975, 1.0], [2009, 1.08], [2020, 1.1]],
  // Niederlande: Ajax, PSV (Landesmeister 1988, Serienmeister 1986–92 und 2000er), Feyenoord; AZ 1981/2009, Twente 2010.
  'Niederlande|Amsterdam': [[1975, 1.3], [1985, 1.25], [1995, 1.32], [2000, 1.2], [2010, 1.25], [2023, 1.1]],
  'Niederlande|Eindhoven': [[1975, 1.2], [1986, 1.3], [1992, 1.2], [2000, 1.28], [2009, 1.15], [2023, 1.25]],
  'Niederlande|Rotterdam': [[1975, 1.15], [1985, 1.05], [1990, 1.08], [2016, 1.12]],
  'Niederlande|Alkmaar': [[1975, 1.0], [1978, 1.08], [1983, 0.98], [2006, 1.08]],
  'Niederlande|Enschede': [[1975, 1.0], [2008, 1.08], [2012, 0.98]],
  // Portugal: Benfica, Porto (Landesmeister 1987/2004, 1995–99 fünf Titel), Sporting; Boavista 2001.
  'Portugal|Lissabon Rot': [[1975, 1.32], [1995, 1.15], [2004, 1.25], [2013, 1.32]],
  'Portugal|Porto': [[1975, 1.1], [1984, 1.3], [1995, 1.38], [2015, 1.25]],
  'Portugal|Lissabon Grün': [[1975, 1.12], [1985, 1.05], [1999, 1.15], [2005, 1.08], [2020, 1.2]],
  'Portugal|Boavista-Porto': [[1975, 1.0], [1998, 1.1], [2003, 0.9]],
  'Portugal|Braga': [[1975, 0.95], [2008, 1.1], [2015, 1.12]],
  // Schottland: Rangers 1989–97 neunmal Meister, Insolvenz 2012 (bis 2016 unterklassig); Celtic 2012–20 und ab 2022.
  'Schottland|Glasgow Blau': [[1975, 1.25], [1985, 1.3], [1988, 1.4], [1998, 1.3], [2011, 1.25], [2012, 0.8], [2016, 1.15], [2020, 1.25]],
  'Schottland|Glasgow Grün': [[1975, 1.3], [1988, 1.25], [1994, 1.15], [1998, 1.3], [2012, 1.4], [2020, 1.32]],
  // Aberdeen Meister 1980/84/85, Pokalsieger-Cup 1983.
  'Schottland|Aberdeen': [[1975, 1.0], [1978, 1.18], [1987, 1.0]],
  // Belgien: Anderlecht (Rekordmeister), Brügge (seit 2016 Serienmeister), Standard 1982/83/2008/09, Genk 1999–2019.
  'Belgien|Brüssel Lila': [[1975, 1.25], [1984, 1.32], [1995, 1.25], [2004, 1.28], [2017, 1.1], [2020, 1.0]],
  'Belgien|Brügge': [[1975, 1.22], [1980, 1.12], [1988, 1.18], [2000, 1.12], [2015, 1.3]],
  'Belgien|Lüttich': [[1975, 1.0], [1980, 1.12], [1985, 0.98], [2007, 1.15], [2011, 1.0]],
  'Belgien|Winterslag': [[1975, 0.95], [1997, 1.05], [1998, 1.12], [2018, 1.12]],
  'Belgien|Gent': [[1975, 0.98], [2014, 1.1]],
  'Belgien|Mechelen': [[1975, 0.98], [1987, 1.12], [1991, 0.95]],
  'Belgien|Antwerpen': [[1975, 1.0], [2021, 1.08]],
  'Belgien|Beveren': [[1975, 1.0], [1978, 1.05], [1985, 0.95]],
};

/** Faktor einer Kurve im Jahr (linear zwischen den Stützpunkten, außen konstant). */
export function curveAt(c: Curve, year: number): number {
  if (year <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    const [y1, f1] = c[i];
    if (year <= y1) {
      const [y0, f0] = c[i - 1];
      return f0 + (f1 - f0) * (year - y0) / Math.max(1, y1 - y0);
    }
  }
  return c[c.length - 1][1];
}

/** Faktor eines deutschen Vereins (Spiel-ID) oder null ohne Kurve. */
export function germanFactor(id: string, year: number): number | null {
  const c = GERMAN_CURVES[id];
  return c ? curveAt(c, year) : null;
}

/** Faktor eines Auslandsvereins (Land + Name) oder null ohne Kurve. */
export function foreignFactor(country: string, name: string, year: number): number | null {
  const c = FOREIGN_CURVES[`${country}|${name}`];
  return c ? curveAt(c, year) : null;
}

/** Historisch starke Vereine eines Jahres (Faktor ≥ 1,15) – für Berichte und Tests. */
export function historicBigIds(year: number, min = 1.15): string[] {
  return Object.keys(GERMAN_CURVES).filter((id) => curveAt(GERMAN_CURVES[id], year) >= min);
}
