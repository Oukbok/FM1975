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
// Prägende DDR-Standorte (Dresden, Magdeburg, Berlin Ost, Jena, Rostock, Erfurt,
// Halle, Chemnitz, Leipzig, Brandenburg) werden durch klar fiktive Platzhalter-
// städte auf die Sollgröße aufgefüllt.
//
// UMBENENNUNGEN: Chemnitz hieß von 1953 bis 1990 „Karl-Marx-Stadt". Das wird über
// die Felder canonicalId + historicalName + renamedYear modelliert; die Anzeige
// zeigt den zeit-korrekten Namen (simDisplayName): bis 1989 „Karl-Marx-Stadt",
// ab 1990 „Chemnitz".
// =============================================================================

import { SimClub } from '../engine/leagues';

export const DDR_OBERLIGA_TIER = 101;
export const DDR_LIGA_TIER = 102;

/** DDR-Oberliga — 14 Vereine. Reihenfolge/Stärke bestimmt die spätere Verteilung
 *  bei der Wiedervereinigung 1991/92 (die zwei stärksten steigen in die 1. Liga
 *  auf; siehe reforms.ts / migrate1991). */
export const DDR_OBERLIGA_SEEDS: SimClub[] = [
  { id: 'ddr-dresden',    canonicalId: 'ddr-dresden',    name: 'Dresden',        shortName: 'DRE', city: 'Dresden',        strength: 79, colors: { primary: '#000000', secondary: '#FFD400' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-rostock',    canonicalId: 'ddr-rostock',    name: 'Rostock',        shortName: 'ROS', city: 'Rostock',        strength: 76, colors: { primary: '#0055A4', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-berlin-ost', canonicalId: 'ddr-berlin-ost', name: 'Berlin (Ost)',   shortName: 'BEO', city: 'Berlin (Ost)',   strength: 74, colors: { primary: '#8B0000', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-magdeburg',  canonicalId: 'ddr-magdeburg',  name: 'Magdeburg',      shortName: 'MAG', city: 'Magdeburg',      strength: 73, colors: { primary: '#1565C0', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-jena',       canonicalId: 'ddr-jena',       name: 'Jena',           shortName: 'JEN', city: 'Jena',           strength: 71, colors: { primary: '#003399', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-erfurt',     canonicalId: 'ddr-erfurt',     name: 'Erfurt',         shortName: 'ERF', city: 'Erfurt',         strength: 70, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-halle',      canonicalId: 'ddr-halle',      name: 'Halle',          shortName: 'HAL', city: 'Halle',          strength: 69, colors: { primary: '#1B5E20', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  // Chemnitz hieß bis 1990 „Karl-Marx-Stadt" → zeit-korrekte Anzeige via renamedYear.
  { id: 'ddr-chemnitz',   canonicalId: 'ddr-chemnitz',   name: 'Chemnitz',       shortName: 'CHE', city: 'Chemnitz',       strength: 68, colors: { primary: '#00838F', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true, historicalName: 'Karl-Marx-Stadt', renamedYear: 1990 },
  { id: 'ddr-leipzig',    canonicalId: 'ddr-leipzig',    name: 'Leipzig',        shortName: 'LEI', city: 'Leipzig',        strength: 67, colors: { primary: '#00579C', secondary: '#FFD400' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-brandenburg',canonicalId: 'ddr-brandenburg',name: 'Brandenburg',    shortName: 'BRB', city: 'Brandenburg',    strength: 65, colors: { primary: '#B71C1C', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-ob-ph1',     name: 'Ostheim',        shortName: 'OST', city: 'Ostheim',        strength: 62, colors: { primary: '#455A64', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-ob-ph2',     name: 'Elbstadt',       shortName: 'ELB', city: 'Elbstadt',       strength: 60, colors: { primary: '#6A1B9A', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-ob-ph3',     name: 'Saalfurt',       shortName: 'SAA', city: 'Saalfurt',       strength: 59, colors: { primary: '#EF6C00', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-ob-ph4',     name: 'Spreewald',      shortName: 'SPR', city: 'Spreewald',      strength: 57, colors: { primary: '#2E7D32', secondary: '#FFFFFF' }, tier: DDR_OBERLIGA_TIER, group: 'nordost', ddr: true },
];

/** DDR-Liga — vereinfachter Unterbau (12 klar fiktive Vereine, eine Staffel). */
export const DDR_LIGA_SEEDS: SimClub[] = [
  { id: 'ddr-li-ph1',  name: 'Havelberg',  shortName: 'HAV', city: 'Havelberg',  strength: 54, colors: { primary: '#455A64', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph2',  name: 'Muldental',  shortName: 'MUL', city: 'Muldental',  strength: 53, colors: { primary: '#1565C0', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph3',  name: 'Harzberg',   shortName: 'HAR', city: 'Harzberg',   strength: 52, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph4',  name: 'Oderbruch',  shortName: 'ODE', city: 'Oderbruch',  strength: 51, colors: { primary: '#6A1B9A', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph5',  name: 'Vogtland',   shortName: 'VOG', city: 'Vogtland',   strength: 50, colors: { primary: '#00838F', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph6',  name: 'Uckermark',  shortName: 'UCK', city: 'Uckermark',  strength: 49, colors: { primary: '#EF6C00', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph7',  name: 'Altmark',    shortName: 'ALT', city: 'Altmark',    strength: 48, colors: { primary: '#2E7D32', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph8',  name: 'Lausitz',    shortName: 'LAU', city: 'Lausitz',    strength: 47, colors: { primary: '#AD1457', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph9',  name: 'Elstertal',  shortName: 'EST', city: 'Elstertal',  strength: 46, colors: { primary: '#455A64', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph10', name: 'Prignitz',   shortName: 'PRI', city: 'Prignitz',   strength: 45, colors: { primary: '#1565C0', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph11', name: 'Thüringtal', shortName: 'THU', city: 'Thüringtal', strength: 44, colors: { primary: '#C62828', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
  { id: 'ddr-li-ph12', name: 'Ostsee',     shortName: 'OSE', city: 'Ostsee',     strength: 43, colors: { primary: '#00838F', secondary: '#FFFFFF' }, tier: DDR_LIGA_TIER, group: 'nordost', ddr: true },
];

export const DDR_OBERLIGA_ID = 'ddr-oberliga';
export const DDR_LIGA_ID = 'ddr-liga';
