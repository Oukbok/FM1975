// =============================================================================
// Vereins-Stammdaten zum Spielstart 1975/76: 1. Liga (ClubSeed) und die
// zweigleisige 2. Liga (nur Stärke + Farben). Teil von data/generate.ts (dort
// weitergereicht).
// =============================================================================

// -----------------------------------------------------------------------------
// Vereins-Stammdaten (1. Liga 1980/81)
// -----------------------------------------------------------------------------
export interface ClubSeed {
  id: string; name: string; shortName: string; city: string;
  founded: number; primary: string; secondary: string;
  reputation: number; stadium: string; capacity: number;
}

// -----------------------------------------------------------------------------
// RECHTSSICHERE VEREINSNAMEN = STÄDTENAMEN
// -----------------------------------------------------------------------------
// Um geschützte Vereinsnamen und Logos zu vermeiden, tragen alle Vereine den
// Namen ihrer Stadt. Die 18 Erstliga-Vereine bilden den realen Teilnehmerkreis
// der Saison 1975/76 (belegt in den Design-Recherchedaten) – jeweils als reine
// Stadt abgebildet. Kommen zwei Vereine aus derselben Stadt (z. B. München,
// Berlin, Essen, Frankfurt, Köln, Hamburg – teils in Liga 1, teils in Liga 2),
// werden sie per belegter Vereinsfarbe unterschieden (München Rot/Blau, Essen
// Rot/Schwarz …); nur wo Farbe kollidiert/unbelegt ist, per Stadtteil.
// Farben werden generisch aus Stadttradition abgeleitet (Farben sind nicht
// schützbar); Stadionnamen sind generisch gehalten.
export const CLUB_SEEDS: ClubSeed[] = [
  { id: 'mgl', name: 'Mönchengladbach', shortName: 'MGL', city: 'Mönchengladbach', founded: 1900, primary: '#000000', secondary: '#00A650', reputation: 86, stadium: 'Stadion am Gladbacher Hang', capacity: 34500 },
  { id: 'ham', name: 'Hamburg Blau', shortName: 'HAB', city: 'Hamburg', founded: 1887, primary: '#003DA5', secondary: '#FFFFFF', reputation: 84, stadium: 'Elbpark-Stadion', capacity: 61000 },
  { id: 'bra', name: 'Braunschweig', shortName: 'BRA', city: 'Braunschweig', founded: 1895, primary: '#F6C500', secondary: '#004A99', reputation: 74, stadium: 'Oker-Stadion', capacity: 38000 },
  { id: 'muc', name: 'München Rot', shortName: 'MÜR', city: 'München', founded: 1900, primary: '#DC052D', secondary: '#0066B2', reputation: 85, stadium: 'Isar-Stadion', capacity: 69000 },
  { id: 'kai', name: 'Kaiserslautern', shortName: 'KAI', city: 'Kaiserslautern', founded: 1900, primary: '#E30613', secondary: '#FFFFFF', reputation: 78, stadium: 'Bergstadion Lautern', capacity: 38000 },
  { id: 'gel', name: 'Gelsenkirchen', shortName: 'GEL', city: 'Gelsenkirchen', founded: 1904, primary: '#004D9D', secondary: '#FFFFFF', reputation: 77, stadium: 'Emscherpark-Stadion', capacity: 70000 },
  { id: 'kln', name: 'Köln Rot', shortName: 'KÖR', city: 'Köln', founded: 1948, primary: '#ED1C24', secondary: '#FFFFFF', reputation: 82, stadium: 'Rheinwiesen-Stadion', capacity: 61000 },
  { id: 'ber', name: 'Berlin Blau', shortName: 'BEB', city: 'Berlin', founded: 1892, primary: '#004A99', secondary: '#FFFFFF', reputation: 79, stadium: 'Havel-Stadion', capacity: 76000 },
  { id: 'fra', name: 'Frankfurt Rot', shortName: 'FRR', city: 'Frankfurt', founded: 1899, primary: '#E1000F', secondary: '#000000', reputation: 80, stadium: 'Mainwald-Stadion', capacity: 62000 },
  { id: 'ess', name: 'Essen Rot', shortName: 'ESR', city: 'Essen', founded: 1907, primary: '#E30613', secondary: '#FFFFFF', reputation: 71, stadium: 'Stadion an der Zeche', capacity: 40000 },
  { id: 'dus', name: 'Düsseldorf', shortName: 'DÜS', city: 'Düsseldorf', founded: 1895, primary: '#E2001A', secondary: '#FFFFFF', reputation: 73, stadium: 'Rheinufer-Stadion', capacity: 68000 },
  { id: 'dui', name: 'Duisburg', shortName: 'DUI', city: 'Duisburg', founded: 1902, primary: '#0055A5', secondary: '#FFFFFF', reputation: 70, stadium: 'Stadion am Kanal', capacity: 38500 },
  { id: 'bre', name: 'Bremen', shortName: 'BRE', city: 'Bremen', founded: 1899, primary: '#009A44', secondary: '#FFFFFF', reputation: 72, stadium: 'Hanse-Stadion', capacity: 36000 },
  { id: 'kre', name: 'Krefeld', shortName: 'KRE', city: 'Krefeld', founded: 1905, primary: '#E2001A', secondary: '#0055A5', reputation: 66, stadium: 'Seidenweber-Stadion', capacity: 34500 },
  { id: 'kar', name: 'Karlsruhe', shortName: 'KAR', city: 'Karlsruhe', founded: 1894, primary: '#0033A0', secondary: '#FFFFFF', reputation: 67, stadium: 'Schlossgarten-Stadion', capacity: 35000 },
  { id: 'han', name: 'Hannover', shortName: 'HAN', city: 'Hannover', founded: 1896, primary: '#00963E', secondary: '#000000', reputation: 68, stadium: 'Leine-Stadion', capacity: 60000 },
  { id: 'boc', name: 'Bochum', shortName: 'BOC', city: 'Bochum', founded: 1848, primary: '#005CA9', secondary: '#FFFFFF', reputation: 66, stadium: 'Stadion an der Castroper', capacity: 40000 },
  { id: 'off', name: 'Offenbach', shortName: 'OFF', city: 'Offenbach', founded: 1901, primary: '#E30613', secondary: '#FFFFFF', reputation: 65, stadium: 'Stadion am Mainbogen', capacity: 30000 },
];

// -----------------------------------------------------------------------------
// 2. LIGA 1975/76 — zweigleisig (Staffel Nord / Staffel Süd)
// -----------------------------------------------------------------------------
// Rechtssicher als reine Städtenamen. Ein Teil sind reale, in den Design-Daten
// belegte Standorte der Saison 1975/76 (z. B. Berlin, Dortmund, Saarbrücken);
// der Rest sind klar fiktive Platzhalter aus kleineren realen Städten, die
// keinem bekannten Profiverein zugeordnet sind. Jede Mannschaft hat nur eine
// aggregierte Stärke + Farben (kein voller Kader) und wird performant per
// Stärke-Simulation geführt. Erst bei Aufstieg in die Spielerliga wird ein
// vollständiger Kader generiert (buildProClub).
export interface SecondLigaSeed {
  id: string; name: string; shortName: string; city: string;
  primary: string; secondary: string; strength: number;
}

export const SECOND_LIGA_NORD_SEEDS: SecondLigaSeed[] = [
  // Reale Teilnehmer der 2. 1. Liga Nord 1975/76 (als rechtssichere Stadt-
  // namen). Doppelstädte werden per belegter Vereinsfarbe unterschieden; wo
  // Farbe kollidiert/unbelegt ist, per belegtem Stadtteil (Köln Süd = Südstadt,
  // Berlin Reinickendorf = Wacker 04, dessen Lila mit Berlin Lila/TeBe kollidiert).
  { id: 'n_tebe', name: 'Berlin Lila', shortName: 'BEL', city: 'Berlin', primary: '#5B2A86', secondary: '#FFFFFF', strength: 66 },
  { id: 'n_dor', name: 'Dortmund', shortName: 'DOR', city: 'Dortmund', primary: '#FDE100', secondary: '#000000', strength: 68 },
  { id: 'n_mun', name: 'Münster', shortName: 'MÜN', city: 'Münster', primary: '#00693C', secondary: '#FFFFFF', strength: 60 },
  { id: 'n_koes', name: 'Köln Süd', shortName: 'KÖS', city: 'Köln', primary: '#E30613', secondary: '#FFFFFF', strength: 62 },
  { id: 'n_wup', name: 'Wuppertal', shortName: 'WUP', city: 'Wuppertal', primary: '#E30613', secondary: '#0055A5', strength: 63 },
  { id: 'n_osn', name: 'Osnabrück', shortName: 'OSN', city: 'Osnabrück', primary: '#5B2A86', secondary: '#FFFFFF', strength: 58 },
  { id: 'n_ess', name: 'Essen Schwarz', shortName: 'ESZ', city: 'Essen', primary: '#000000', secondary: '#FFFFFF', strength: 57 },
  { id: 'n_wat', name: 'Wattenscheid', shortName: 'WAT', city: 'Wattenscheid', primary: '#000000', secondary: '#FFFFFF', strength: 56 },
  { id: 'n_bie', name: 'Bielefeld', shortName: 'BIE', city: 'Bielefeld', primary: '#004B87', secondary: '#000000', strength: 61 },
  { id: 'n_hern', name: 'Herne', shortName: 'HRN', city: 'Herne', primary: '#0055A5', secondary: '#FFFFFF', strength: 54 },
  { id: 'n_goe', name: 'Göttingen', shortName: 'GÖT', city: 'Göttingen', primary: '#000000', secondary: '#F2C200', strength: 52 },
  { id: 'n_aac', name: 'Aachen', shortName: 'AAC', city: 'Aachen', primary: '#000000', secondary: '#F2C200', strength: 59 },
  { id: 'n_sol', name: 'Solingen', shortName: 'SOL', city: 'Solingen', primary: '#E30613', secondary: '#000000', strength: 53 },
  { id: 'n_ham', name: 'Hamburg Braun', shortName: 'HBR', city: 'Hamburg', primary: '#6A3B23', secondary: '#FFFFFF', strength: 58 },
  { id: 'n_lev', name: 'Leverkusen', shortName: 'LEV', city: 'Leverkusen', primary: '#E30613', secondary: '#000000', strength: 60 },
  { id: 'n_wac', name: 'Berlin Reinickendorf', shortName: 'BRK', city: 'Berlin', primary: '#5B2A86', secondary: '#FFFFFF', strength: 52 },
  { id: 'n_mue', name: 'Mülheim', shortName: 'MÜL', city: 'Mülheim', primary: '#0055A5', secondary: '#FFFFFF', strength: 51 },
  { id: 'n_erk', name: 'Erkenschwick', shortName: 'ERK', city: 'Erkenschwick', primary: '#E30613', secondary: '#FFFFFF', strength: 49 },
  { id: 'n_gue', name: 'Gütersloh', shortName: 'GÜT', city: 'Gütersloh', primary: '#00963E', secondary: '#FFFFFF', strength: 50 },
  { id: 'n_spa', name: 'Berlin Rot', shortName: 'BER', city: 'Berlin', primary: '#E30613', secondary: '#FFFFFF', strength: 50 },
];

export const SECOND_LIGA_SUED_SEEDS: SecondLigaSeed[] = [
  // Reale Teilnehmer der 2. 1. Liga Süd 1975/76 (als rechtssichere Stadt-
  // namen). Doppelstädte per Farbe: München Blau = 1860, Stuttgart Rot/Blau =
  // VfB/Kickers, Frankfurt Blau = FSV (Gegenstueck zu Frankfurt Rot in Liga 1).
  { id: 's_saa', name: 'Saarbrücken', shortName: 'SAA', city: 'Saarbrücken', primary: '#000000', secondary: '#0055A5', strength: 67 },
  { id: 's_nue', name: 'Nürnberg', shortName: 'NÜR', city: 'Nürnberg', primary: '#8C1D18', secondary: '#FFFFFF', strength: 65 },
  { id: 's_muc', name: 'München Blau', shortName: 'MÜB', city: 'München', primary: '#0066B2', secondary: '#FFFFFF', strength: 62 },
  { id: 's_hom', name: 'Homburg', shortName: 'HOM', city: 'Homburg', primary: '#00693C', secondary: '#FFFFFF', strength: 55 },
  { id: 's_bay', name: 'Bayreuth', shortName: 'BAY', city: 'Bayreuth', primary: '#F2C200', secondary: '#000000', strength: 56 },
  { id: 's_voe', name: 'Völklingen', shortName: 'VÖL', city: 'Völklingen', primary: '#004D9D', secondary: '#FFFFFF', strength: 54 },
  { id: 's_dar', name: 'Darmstadt', shortName: 'DAR', city: 'Darmstadt', primary: '#005CA9', secondary: '#FFFFFF', strength: 58 },
  { id: 's_man', name: 'Mannheim', shortName: 'MAN', city: 'Mannheim', primary: '#0055A5', secondary: '#000000', strength: 60 },
  { id: 's_hof', name: 'Hof', shortName: 'HOF', city: 'Hof', primary: '#E2001A', secondary: '#FFFFFF', strength: 53 },
  { id: 's_fue', name: 'Fürth', shortName: 'FÜR', city: 'Fürth', primary: '#00693C', secondary: '#FFFFFF', strength: 57 },
  { id: 's_vfb', name: 'Stuttgart Rot', shortName: 'STR', city: 'Stuttgart', primary: '#E30613', secondary: '#FFFFFF', strength: 64 },
  { id: 's_mai', name: 'Mainz', shortName: 'MAI', city: 'Mainz', primary: '#E2001A', secondary: '#FFFFFF', strength: 56 },
  { id: 's_fsv', name: 'Frankfurt Blau', shortName: 'FRB', city: 'Frankfurt', primary: '#003DA5', secondary: '#000000', strength: 55 },
  { id: 's_pir', name: 'Pirmasens', shortName: 'PIR', city: 'Pirmasens', primary: '#E30613', secondary: '#FFFFFF', strength: 52 },
  { id: 's_aug', name: 'Augsburg', shortName: 'AUG', city: 'Augsburg', primary: '#E30613', secondary: '#00693C', strength: 58 },
  { id: 's_stk', name: 'Stuttgart Blau', shortName: 'STB', city: 'Stuttgart', primary: '#0055A5', secondary: '#FFFFFF', strength: 55 },
  { id: 's_reg', name: 'Regensburg', shortName: 'REG', city: 'Regensburg', primary: '#E2001A', secondary: '#FFFFFF', strength: 53 },
  { id: 's_sch', name: 'Schweinfurt', shortName: 'SCW', city: 'Schweinfurt', primary: '#00693C', secondary: '#FFFFFF', strength: 56 },
  { id: 's_bkr', name: 'Bad Kreuznach', shortName: 'BKR', city: 'Bad Kreuznach', primary: '#005CA9', secondary: '#E2001A', strength: 50 },
  { id: 's_reu', name: 'Reutlingen', shortName: 'REU', city: 'Reutlingen', primary: '#E2001A', secondary: '#FFFFFF', strength: 54 },
];
