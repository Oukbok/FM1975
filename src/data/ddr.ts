// =============================================================================
// 1975 – A Football Manager — DDR-LIGASYSTEM (parallele Ostliga bis 1991/92)
// =============================================================================
// Bis zur Wiedervereinigung im Fußball (Saison 1991/92) wird die DDR-Ligapyramide
// PARALLEL zum bundesdeutschen System geführt und – wie alle Nicht-Spielerligen –
// rein per Stärke simuliert (siehe engine/leagues.ts). Sie besteht aus:
//   • DDR-Oberliga  (oberste DDR-Ebene, 14 Vereine)   → interner tier 101
//   • DDR-Liga      (vereinfachte Unterbau-Staffel)    → interner tier 102
//
// Die tier-Werte 101/102 liegen bewusst WEIT über den West-Ebenen (1..4), damit
// der generische West-Auf-/Abstieg die DDR-Ligen NICHT versehentlich mit den
// West-Ligen vermischt. Die DDR-Ligen tragen die Staffelkennung 'nordost'.
//
// RECHTSSICHER: Alle Vereine tragen reine STÄDTENAMEN (keine geschützten realen
// Vereinsnamen/Logos). Berlin (Ost) ist klar von West-Berlin unterschieden.
// Die Oberliga entspricht dem realen Teilnehmerfeld 1975/76 (je als Stadt), die
// DDR-Liga wird mit klar fiktiven Platzhalterstädten auf die Sollgröße aufgefüllt.
// Frühere Oberligisten ohne Platz (Stralsund, Stendal …) liegen im DDR-Pool
// (data/history/historicClubs.ts, game/clubPool.ts).
//
// UMBENENNUNGEN: Chemnitz hieß von 1953 bis 1990 „Karl-Marx-Stadt". Das wird über
// die Felder canonicalId + historicalName + renamedYear modelliert; die Anzeige
// zeigt den zeit-korrekten Namen (simDisplayName): bis 1989 „Karl-Marx-Stadt",
// ab 1990 „Chemnitz".
// =============================================================================

import { SimClub } from '../engine/leagues';

export const DDR_OBERLIGA_TIER = 101;
export const DDR_LIGA_TIER = 102;

/** DDR-Oberliga — die 14 Vereine der Saison 1975/76 (Quelle: Abschlusstabelle 1975/76,
 *  claudionicoletti.eu „german DR 1971-80“; en.wikipedia.org „1975–76 DDR-Oberliga“).
 *  Reihenfolge/Stärke bestimmt die spätere Verteilung bei der Wiedervereinigung 1991/92
 *  (die zwei stärksten steigen in die 1. Liga auf; siehe reforms.ts / migrate1991). */
export const DDR_OBERLIGA_SEEDS: SimClub[] = [
  { id: 'ddr-dresden', canonicalId: 'ddr-dresden', name: 'Dresden', shortName: 'DRE', city: 'Dresden', strength: 79, colors: { primary: '#000000', secondary: '#FFD400' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-berlin-ost', canonicalId: 'ddr-berlin-ost', name: 'Berlin (Ost)', shortName: 'BEO', city: 'Berlin (Ost)', strength: 75, colors: { primary: '#8B0000', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-magdeburg', canonicalId: 'ddr-magdeburg', name: 'Magdeburg', shortName: 'MAG', city: 'Magdeburg', strength: 76, colors: { primary: '#1565C0', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-jena', canonicalId: 'ddr-jena', name: 'Jena', shortName: 'JEN', city: 'Jena', strength: 73, colors: { primary: '#003399', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-leipzig', canonicalId: 'ddr-leipzig', name: 'Leipzig', shortName: 'LEI', city: 'Leipzig', strength: 71, colors: { primary: '#00579C', secondary: '#FFD400' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-frankfurt-oder', canonicalId: 'ddr-frankfurt-oder', name: 'Frankfurt (Oder)', shortName: 'FFO', city: 'Frankfurt (Oder)', strength: 68, colors: { primary: '#C62828', secondary: '#F2C200' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true, historicalName: 'Berlin Rot-Gelb', renamedYear: 1971 },
  { id: 'ddr-erfurt', canonicalId: 'ddr-erfurt', name: 'Erfurt', shortName: 'ERF', city: 'Erfurt', strength: 67, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-halle', canonicalId: 'ddr-halle', name: 'Halle', shortName: 'HAL', city: 'Halle', strength: 67, colors: { primary: '#1B5E20', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-chemnitz', canonicalId: 'ddr-chemnitz', name: 'Chemnitz', shortName: 'CHE', city: 'Chemnitz', strength: 66, colors: { primary: '#00838F', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true, historicalName: 'Karl-Marx-Stadt', renamedYear: 1990 },
  { id: 'ddr-zwickau', canonicalId: 'ddr-zwickau', name: 'Zwickau', shortName: 'ZWI', city: 'Zwickau', strength: 65, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-aue', canonicalId: 'ddr-aue', name: 'Aue', shortName: 'AUE', city: 'Aue', strength: 64, colors: { primary: '#5C2D91', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-riesa', canonicalId: 'ddr-riesa', name: 'Riesa', shortName: 'RIE', city: 'Riesa', strength: 62, colors: { primary: '#1565C0', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-leipzig-chemie', canonicalId: 'ddr-leipzig-chemie', name: 'Leipzig Grün', shortName: 'LEG', city: 'Leipzig', strength: 60, colors: { primary: '#2E7D32', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-cottbus', canonicalId: 'ddr-cottbus', name: 'Cottbus', shortName: 'COT', city: 'Cottbus', strength: 58, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
];

/** DDR-Liga — vereinfachter Unterbau (eine Staffel, 12 Vereine): Absteiger 1975 (Rostock,
 *  Stralsund liegt im Pool), Brandenburg, Berlin-Köpenick und fiktive Regionalvereine. */
export const DDR_LIGA_SEEDS: SimClub[] = [
  { id: 'ddr-rostock', canonicalId: 'ddr-rostock', name: 'Rostock', shortName: 'ROS', city: 'Rostock', strength: 63, colors: { primary: '#0055A4', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-brandenburg', canonicalId: 'ddr-brandenburg', name: 'Brandenburg', shortName: 'BRB', city: 'Brandenburg', strength: 57, colors: { primary: '#B71C1C', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-union', canonicalId: 'ddr-union', name: 'Berlin Köpenick', shortName: 'BKÖ', city: 'Berlin (Ost)', strength: 58, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph1',  name: 'Havelberg',  shortName: 'HAV', city: 'Havelberg',  strength: 54, colors: { primary: '#455A64', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph2',  name: 'Muldental',  shortName: 'MUL', city: 'Muldental',  strength: 53, colors: { primary: '#1565C0', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph3',  name: 'Harzberg',   shortName: 'HAR', city: 'Harzberg',   strength: 52, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph4',  name: 'Oderbruch',  shortName: 'ODE', city: 'Oderbruch',  strength: 51, colors: { primary: '#6A1B9A', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph5',  name: 'Vogtland',   shortName: 'VOG', city: 'Vogtland',   strength: 50, colors: { primary: '#00838F', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph6',  name: 'Uckermark',  shortName: 'UCK', city: 'Uckermark',  strength: 49, colors: { primary: '#EF6C00', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph7',  name: 'Altmark',    shortName: 'ALT', city: 'Altmark',    strength: 48, colors: { primary: '#2E7D32', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph8',  name: 'Lausitz',    shortName: 'LAU', city: 'Lausitz',    strength: 47, colors: { primary: '#AD1457', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph9',  name: 'Elstertal',  shortName: 'EST', city: 'Elstertal',  strength: 46, colors: { primary: '#455A64', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
];

export const DDR_OBERLIGA_ID = 'ddr-oberliga';
export const DDR_LIGA_ID = 'ddr-liga';
