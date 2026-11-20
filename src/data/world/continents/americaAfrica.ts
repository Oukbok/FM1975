// =============================================================================
// NORD-/MITTELAMERIKA und AFRIKA – Spitzenvereine je Land (verfremdet nach
// Stadt/Farbe). Stärke je Epoche grob nach Titeln im Kontinentalpokal und dem
// Abschneiden bei der Klub-WM (Vorbilder/Quellen: docs/recherche/kontinente.md).
// USA: Profiliga 1975–1984 und wieder ab 1996 (dazwischen keine landesweite
// Profiliga). Südafrika: Kontinentalpokal erst nach der Rückkehr 1992/93.
// Reihenfolge je Land nur hinten erweitern (Platzierungen als Index gespeichert).
// =============================================================================
import { club } from './southAmerica';
import type { CtCountry } from './types';

const R = '#c8202a', W = '#f2f2f2', K = '#16181c', B = '#1f4aa0', Y = '#f0c020', G = '#1f7a3e', LB = '#6aa8dc', V = '#5b2c83';

export const NORTH_AMERICA: CtCountry[] = [
  {
    cc: 'mex', key: 'Mexiko', origin: 'mex', conf: [[0, 'na']], slots: [[0, 2], [2008, 4]], center: [23.6, -102.5],
    geo: { 'Mexiko-Stadt': [19.43, -99.13], Guadalajara: [20.67, -103.35], Pachuca: [20.1, -98.76], Monterrey: [25.69, -100.32], 'León': [21.12, -101.68] },
    clubs: [
      club('ame', 'Mexiko-Stadt Gelb', 'MXG', 'Mexiko-Stadt', Y, B, [72, 75, 74, 73]),
      club('cru', 'Mexiko-Stadt Blau', 'MXB', 'Mexiko-Stadt', B, W, [74, 72, 73, 73]),
      club('gua', 'Guadalajara Rot-Weiß', 'GRW', 'Guadalajara', R, W, [73, 73, 73, 69]),
      club('pac', 'Pachuca Blau-Weiß', 'PBW', 'Pachuca', '#163a7a', W, [65, 66, 73, 71]),
      club('mty', 'Monterrey Blau', 'MOB', 'Monterrey', '#12305e', W, [68, 70, 72, 74], { x: [[2012, 74]] }),
      club('tig', 'Monterrey Gelb', 'MOG', 'Monterrey', Y, B, [68, 70, 70, 73]),
      club('leo', 'León Grün', 'LEG', 'León', G, W, [69, 69, 66, 70]),
      club('unam', 'Mexiko-Stadt Gold-Blau', 'MGB', 'Mexiko-Stadt', '#12305e', '#c5a253', [72, 74, 71, 68], { x: [[1981, 75]] }),
    ],
  },
  {
    cc: 'usa', key: 'USA', origin: 'usa', conf: [[0, 'na']], league: [[1975, 1984], [1996, 9999]], slots: [[0, 1], [2008, 3]], center: [39.8, -98.6],
    geo: { 'New York': [40.71, -74.01], Tampa: [27.95, -82.46], Seattle: [47.61, -122.33], 'Los Angeles': [34.05, -118.24], Washington: [38.9, -77.04], Columbus: [39.96, -83.0], Miami: [25.76, -80.19] },
    clubs: [
      club('nyc', 'New York Grün', 'NYG', 'New York', G, W, [71, 0, 0, 0], { y: [[1975, 1983]] }),
      club('tam', 'Tampa Orange', 'TAO', 'Tampa', '#e8791e', G, [65, 0, 0, 0], { y: [[1975, 1983]] }),
      club('sea', 'Seattle Grün', 'SEG', 'Seattle', '#4f9a3c', B, [64, 0, 68, 69], { y: [[1975, 1982], [2009, 9997]] }),
      club('lag', 'Los Angeles Weiß-Gold', 'LAW', 'Los Angeles', W, '#c5a253', [0, 0, 69, 69], { y: [[1996, 9998]] }),
      club('dcu', 'Washington Schwarz-Rot', 'WSR', 'Washington', K, R, [0, 0, 68, 65], { y: [[1996, 9998]], x: [[1998, 70]] }),
      club('clb', 'Columbus Gelb', 'COG', 'Columbus', Y, K, [0, 0, 66, 67], { y: [[1996, 9998]] }),
      club('mia', 'Miami Rosa', 'MIR', 'Miami', '#e9a0bf', K, [0, 0, 0, 70], { y: [[2020, 9995]] }),
    ],
  },
  {
    cc: 'crc', key: 'Costa Rica', origin: 'crc', conf: [[0, 'na']], slots: [[0, 2]], center: [9.75, -83.75],
    geo: { 'San José': [9.93, -84.08], Alajuela: [10.02, -84.21], Heredia: [10.0, -84.12], Cartago: [9.86, -83.92] },
    clubs: [
      club('sap', 'San José Violett', 'SJV', 'San José', V, W, [67, 69, 70, 64]),
      club('ala', 'Alajuela Rot-Schwarz', 'ARS', 'Alajuela', R, K, [67, 70, 68, 65]),
      club('her', 'Heredia Rot-Gelb', 'HRG', 'Heredia', R, Y, [63, 65, 64, 63]),
      club('car', 'Cartago Blau', 'CAB', 'Cartago', '#163a7a', W, [63, 66, 62, 60]),
    ],
  },
];

export const AFRICA: CtCountry[] = [
  {
    cc: 'egy', key: 'Aegypten', origin: 'egy', conf: [[0, 'af']], slots: [[0, 1], [1997, 2]], center: [26.8, 30.8],
    geo: { Kairo: [30.04, 31.24], Ismailia: [30.6, 32.27] },
    clubs: [
      club('ahl', 'Kairo Rot', 'KAR', 'Kairo', R, W, [69, 71, 73, 73], { x: [[2013, 74]] }),
      club('zam', 'Kairo Weiß', 'KAW', 'Kairo', W, R, [68, 71, 71, 69]),
      club('ism', 'Ismailia Gelb', 'ISG', 'Ismailia', Y, B, [65, 66, 65, 62]),
      club('pyr', 'Kairo Blau', 'KAB', 'Kairo', '#163a7a', W, [0, 0, 0, 72], { y: [[2018, 9997]] }),
    ],
  },
  {
    cc: 'mar', key: 'Marokko', origin: 'mar', conf: [[0, 'af']], slots: [[0, 1], [1997, 2]], center: [31.8, -7.1],
    geo: { Casablanca: [33.57, -7.59], Rabat: [34.02, -6.84], Berkane: [34.92, -2.32] },
    clubs: [
      club('raj', 'Casablanca Grün', 'CAG', 'Casablanca', G, W, [65, 69, 71, 69]),
      club('wyd', 'Casablanca Rot', 'CAR', 'Casablanca', R, W, [66, 69, 70, 70]),
      club('far', 'Rabat Schwarz-Rot', 'RSR', 'Rabat', K, R, [66, 67, 66, 66]),
      club('ber', 'Berkane Orange', 'BEO', 'Berkane', '#e8791e', K, [57, 59, 63, 69]),
    ],
  },
  {
    cc: 'tun', key: 'Tunesien', origin: 'tun', conf: [[0, 'af']], slots: [[0, 1], [1997, 2]], center: [34.0, 9.5],
    geo: { Tunis: [36.81, 10.18], Sousse: [35.83, 10.64], Sfax: [34.74, 10.76] },
    clubs: [
      club('est', 'Tunis Rot-Gelb', 'TRG', 'Tunis', R, Y, [65, 69, 71, 70]),
      club('ess', 'Sousse Rot-Weiß', 'SRW', 'Sousse', R, W, [64, 67, 71, 66]),
      club('caf', 'Tunis Weiß-Rot', 'TWR', 'Tunis', W, R, [65, 68, 67, 64]),
      club('css', 'Sfax Schwarz-Weiß', 'SSW', 'Sfax', K, W, [62, 65, 67, 63]),
    ],
  },
  {
    cc: 'alg', key: 'Algerien', origin: 'alg', conf: [[0, 'af']], slots: [[0, 1], [1997, 2]], center: [36.0, 3.0],
    geo: { 'Sétif': [36.19, 5.41], 'Tizi Ouzou': [36.72, 4.05], Algier: [36.75, 3.06], Oran: [35.7, -0.63] },
    clubs: [
      club('ess', 'Sétif Schwarz-Weiß', 'SES', 'Sétif', K, W, [63, 66, 66, 65], { x: [[1988, 68], [2014, 69]] }),
      club('jsk', 'Tizi Ouzou Gelb-Grün', 'TOG', 'Tizi Ouzou', Y, G, [67, 69, 65, 62]),
      club('mca', 'Algier Rot-Grün', 'ALR', 'Algier', R, G, [67, 64, 64, 64]),
      club('mco', 'Oran Rot-Weiß', 'ORW', 'Oran', R, W, [63, 64, 62, 60]),
    ],
  },
  {
    cc: 'nga', key: 'Nigeria', origin: 'nga', conf: [[0, 'af']], slots: [[0, 1], [1997, 2]], center: [9.08, 7.4],
    geo: { Aba: [5.11, 7.37], Enugu: [6.45, 7.51], Ibadan: [7.38, 3.95], Kano: [12.0, 8.52] },
    clubs: [
      club('eny', 'Aba Blau', 'ABB', 'Aba', B, W, [59, 63, 69, 61], { x: [[2003, 70]] }),
      club('enu', 'Enugu Grün', 'ENG', 'Enugu', G, W, [66, 63, 62, 59]),
      club('iba', 'Ibadan Blau-Weiß', 'IBW', 'Ibadan', LB, W, [65, 64, 61, 57]),
      club('kan', 'Kano Blau', 'KAN', 'Kano', '#163a7a', Y, [57, 59, 65, 59]),
    ],
  },
  {
    cc: 'gha', key: 'Ghana', origin: 'gha', conf: [[0, 'af']], slots: [[0, 1]], center: [7.95, -1.02],
    geo: { Kumasi: [6.69, -1.62], Accra: [5.6, -0.19], Obuasi: [6.2, -1.66], Tamale: [9.4, -0.84] },
    clubs: [
      club('kot', 'Kumasi Rot', 'KUR', 'Kumasi', R, W, [67, 66, 65, 61]),
      club('hoo', 'Accra Regenbogen', 'ACR', 'Accra', R, Y, [66, 65, 67, 60], { x: [[2000, 69]] }),
      club('obu', 'Obuasi Gelb-Schwarz', 'OGS', 'Obuasi', Y, K, [59, 62, 63, 57]),
      club('tam', 'Tamale Gelb', 'TAG', 'Tamale', Y, G, [61, 60, 59, 55]),
    ],
  },
  {
    cc: 'cmr', key: 'Kamerun', origin: 'cmr', conf: [[0, 'af']], slots: [[0, 1]], center: [7.37, 12.35],
    geo: { 'Yaoundé': [3.87, 11.52], Douala: [4.05, 9.77], Garoua: [9.3, 13.4] },
    clubs: [
      club('can', 'Yaoundé Rot-Grün', 'YRG', 'Yaoundé', R, G, [68, 65, 61, 58], { x: [[1980, 69]] }),
      club('ton', 'Yaoundé Weiß-Blau', 'YWB', 'Yaoundé', W, B, [66, 64, 61, 57]),
      club('udo', 'Douala Gelb', 'DOG', 'Douala', Y, K, [66, 63, 60, 56]),
      club('cot', 'Garoua Grün-Weiß', 'GGW', 'Garoua', G, W, [0, 62, 66, 61], { y: [[1986, 9998]] }),
    ],
  },
  {
    cc: 'rsa', key: 'Südafrika', origin: 'rsa', conf: [[0, 'af']], slots: [[0, 1], [1997, 2]], cupFrom: 1993, center: [-28.5, 24.7],
    geo: { Johannesburg: [-26.2, 28.05], Pretoria: [-25.75, 28.19] },
    clubs: [
      club('kai', 'Johannesburg Gold-Schwarz', 'JGS', 'Johannesburg', Y, K, [65, 66, 67, 65]),
      club('orl', 'Johannesburg Schwarz-Weiß', 'JSW', 'Johannesburg', K, W, [65, 66, 67, 66], { x: [[1995, 69]] }),
      club('sun', 'Pretoria Gelb-Blau', 'PGB', 'Pretoria', Y, B, [59, 63, 67, 73]),
      club('sus', 'Pretoria Blau', 'PRB', 'Pretoria', LB, W, [0, 62, 65, 61], { y: [[1985, 9998]] }),
    ],
  },
  {
    cc: 'cod', key: 'DR Kongo', origin: 'cod', conf: [[0, 'af']], slots: [[0, 1]], center: [-2.9, 23.6],
    geo: { Lubumbashi: [-11.66, 27.48], Kinshasa: [-4.33, 15.31] },
    clubs: [
      club('maz', 'Lubumbashi Schwarz-Weiß', 'LSW', 'Lubumbashi', K, W, [65, 62, 68, 67], { x: [[2010, 71]] }),
      club('vit', 'Kinshasa Grün-Schwarz', 'KGS', 'Kinshasa', G, K, [65, 63, 63, 63]),
      club('dcm', 'Kinshasa Grün-Weiß', 'KGW', 'Kinshasa', G, W, [64, 62, 62, 60]),
      club('lup', 'Lubumbashi Blau', 'LUB', 'Lubumbashi', B, Y, [62, 61, 62, 59]),
    ],
  },
  {
    cc: 'civ', key: 'Elfenbeinkueste', origin: 'civ', conf: [[0, 'af']], slots: [[0, 1]], center: [7.54, -5.55],
    geo: { Abidjan: [5.36, -4.01] },
    clubs: [
      club('ase', 'Abidjan Gelb-Schwarz', 'AGS', 'Abidjan', Y, K, [63, 66, 68, 61], { x: [[1998, 70]] }),
      club('afs', 'Abidjan Rot-Grün', 'ARG', 'Abidjan', R, G, [63, 65, 63, 57]),
      club('ste', 'Abidjan Rot-Weiß', 'ARW', 'Abidjan', R, W, [61, 62, 60, 56]),
      club('sda', 'Abidjan Himmelblau', 'AHB', 'Abidjan', LB, W, [60, 61, 60, 56]),
    ],
  },
];
