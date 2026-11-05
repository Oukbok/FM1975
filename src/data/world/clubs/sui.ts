// =============================================================================
// Weltdaten sui: alle Vereine der erfassten Ligen 1975/76–2025/26 (verfremdete Namen).
// Echte Namen und Quellen: docs/recherche/weltvereine_sui.md. Format: docs/specs/WELTDATEN_SPEC.md.
// =============================================================================
import type { RealClub } from '../types';

export const CLUBS_SUI: RealClub[] = [
  { id: 'sui-aarau', name: 'Aarau', short: 'AAR', city: 'Aarau', colors: { primary: '#D71920', secondary: '#000000' } },
  { id: 'sui-baden', name: 'Baden', short: 'BAD', city: 'Baden', colors: { primary: '#000000', secondary: '#FFFFFF' } },
  { id: 'sui-basel', name: 'Basel', short: 'BAS', city: 'Basel', colors: { primary: '#D71920', secondary: '#003399' } },
  { id: 'sui-basel-kleinbasel', name: 'Basel-Kleinbasel', short: 'BKL', city: 'Basel', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-bellinzona', name: 'Bellinzona', short: 'BEL', city: 'Bellinzona', colors: { primary: '#8A1538', secondary: '#FFFFFF' } },
  { id: 'sui-bern', name: 'Bern', short: 'BER', city: 'Bern', colors: { primary: '#FFD200', secondary: '#000000' } },
  { id: 'sui-biel', name: 'Biel', short: 'BIE', city: 'Biel', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-bulle', name: 'Bulle', short: 'BUL', city: 'Bulle', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-carouge', name: 'Carouge', short: 'CAR', city: 'Carouge', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'sui-chene-bourg', name: 'Chêne-Bourg', short: 'CHB', city: 'Chêne-Bourg', colors: { primary: '#D71920', secondary: '#00843D' } },
  { id: 'sui-chiasso', name: 'Chiasso', short: 'CHI', city: 'Chiasso', colors: { primary: '#D71920', secondary: '#003399' } },
  { id: 'sui-delsberg', name: 'Delsberg', short: 'DEL', city: 'Delsberg', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-genf-granat', name: 'Genf Granat', short: 'GEG', city: 'Genf', colors: { primary: '#8A1538', secondary: '#FFFFFF' } },
  { id: 'sui-grenchen', name: 'Grenchen', short: 'GRE', city: 'Grenchen', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'sui-kriens', name: 'Kriens', short: 'KRI', city: 'Kriens', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-la-chaux-de-fonds', name: 'La Chaux-de-Fonds', short: 'LCF', city: 'La Chaux-de-Fonds', colors: { primary: '#FFD200', secondary: '#003399' } },
  { id: 'sui-lausanne', name: 'Lausanne', short: 'LAU', city: 'Lausanne', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'sui-lausanne-ouchy', name: 'Lausanne-Ouchy', short: 'LOU', city: 'Lausanne', colors: { primary: '#FFFFFF', secondary: '#003399' } },
  { id: 'sui-lugano', name: 'Lugano', short: 'LUG', city: 'Lugano', colors: { primary: '#000000', secondary: '#FFFFFF' } },
  { id: 'sui-luzern', name: 'Luzern', short: 'LUZ', city: 'Luzern', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'sui-neuenburg', name: 'Neuenburg', short: 'NEU', city: 'Neuenburg', colors: { primary: '#D71920', secondary: '#000000' } },
  { id: 'sui-schaffhausen', name: 'Schaffhausen', short: 'SHA', city: 'Schaffhausen', colors: { primary: '#FFD200', secondary: '#000000' } },
  { id: 'sui-sitten', name: 'Sitten', short: 'SIT', city: 'Sitten', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-st-gallen', name: 'St. Gallen', short: 'STG', city: 'St. Gallen', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'sui-thun', name: 'Thun', short: 'THU', city: 'Thun', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-vaduz', name: 'Vaduz', short: 'VAD', city: 'Vaduz', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-vevey', name: 'Vevey', short: 'VEV', city: 'Vevey', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'sui-wettingen', name: 'Wettingen', short: 'WET', city: 'Wettingen', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-wil', name: 'Wil', short: 'WIL', city: 'Wil', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-winterthur', name: 'Winterthur', short: 'WIN', city: 'Winterthur', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'sui-yverdon', name: 'Yverdon', short: 'YVE', city: 'Yverdon-les-Bains', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'sui-zuerich', name: 'Zürich', short: 'ZÜR', city: 'Zürich', colors: { primary: '#FFFFFF', secondary: '#0033A0' } },
  { id: 'sui-zuerich-blau-weiss', name: 'Zürich Blau-Weiß', short: 'ZBW', city: 'Zürich', colors: { primary: '#0047AB', secondary: '#FFFFFF' } },
  { id: 'sui-zuerich-wiedikon', name: 'Zürich-Wiedikon', short: 'ZWI', city: 'Zürich', colors: { primary: '#000000', secondary: '#D71920' } },
  { id: 'sui-zug', name: 'Zug', short: 'ZUG', city: 'Zug', colors: { primary: '#003399', secondary: '#FFFFFF' } },
];
