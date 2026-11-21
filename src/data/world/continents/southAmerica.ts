// =============================================================================
// SÜDAMERIKA – Spitzenvereine je Land (verfremdet nach Stadt/Farbe). Stärke je
// Epoche grob nach Kontinentalerfolgen (Titel/Finals im Südamerika-Pokal der
// Landesmeister), Ligatiteln und dem Abstand zu Europas Spitze im Weltpokal
// (1980–2004 gewann Südamerika 15 von 25 Endspielen in Tokio, die Klub-WM ab
// 2005 nur noch 4 von 19 Ausgaben) – Vorbilder/Quellen: docs/research/kontinente.md.
// Reihenfolge je Land nur hinten erweitern (Platzierungen als Index gespeichert).
// =============================================================================
import type { CtClub, CtCountry } from './types';

export const club = (key: string, name: string, short: string, city: string, p: string, q: string, s: CtClub['s'], more?: Pick<CtClub, 'x' | 'y'>): CtClub =>
  ({ key, name, short, city, colors: [p, q], s, ...more });

const R = '#c8202a', W = '#f2f2f2', K = '#16181c', B = '#1f4aa0', Y = '#f0c020', G = '#1f7a3e', LB = '#6aa8dc';

export const SOUTH_AMERICA: CtCountry[] = [
  {
    cc: 'bra', key: 'Brasilien', origin: 'bra', conf: [[0, 'sa']], slots: [[0, 2], [2000, 4]], center: [-14.2, -51.9],
    geo: { Rio: [-22.91, -43.17], 'São Paulo': [-23.55, -46.63], Santos: [-23.96, -46.33], 'Porto Alegre': [-30.03, -51.23], 'Belo Horizonte': [-19.92, -43.94] },
    clubs: [
      club('flm', 'Rio Rot-Schwarz', 'RRS', 'Rio', R, K, [78, 78, 71, 74], { x: [[1981, 81], [2019, 75]] }),
      club('flu', 'Rio Grün-Weinrot', 'RGW', 'Rio', '#7a1f35', G, [76, 74, 70, 71], { x: [[2023, 73]] }),
      club('vas', 'Rio Schwarz-Weiß', 'RSW', 'Rio', K, W, [77, 76, 72, 67], { x: [[1998, 79]] }),
      club('bot', 'Rio Stern', 'RST', 'Rio', K, W, [76, 72, 67, 72], { x: [[2024, 74]] }),
      club('spf', 'São Paulo Rot-Weiß', 'SPR', 'São Paulo', W, R, [78, 79, 75, 69], { x: [[1993, 81]] }),
      club('cor', 'São Paulo Schwarz-Weiß', 'SPS', 'São Paulo', K, W, [76, 76, 72, 70], { x: [[2012, 75]] }),
      club('pal', 'São Paulo Grün', 'SPG', 'São Paulo', G, W, [77, 75, 72, 73], { x: [[1999, 79], [2021, 75]] }),
      club('san', 'Santos', 'SAN', 'Santos', W, K, [78, 73, 71, 66], { x: [[2011, 74]] }),
      club('gre', 'Porto Alegre Blau', 'PAB', 'Porto Alegre', LB, K, [76, 77, 71, 70], { x: [[1983, 79], [1995, 79]] }),
      club('int', 'Porto Alegre Rot', 'PAR', 'Porto Alegre', R, W, [78, 75, 73, 69], { x: [[2006, 75], [2010, 75]] }),
      club('cru', 'Belo Horizonte Blau', 'BHB', 'Belo Horizonte', B, W, [79, 76, 72, 68], { x: [[1976, 80], [1997, 78]] }),
      club('cam', 'Belo Horizonte Schwarz-Weiß', 'BHS', 'Belo Horizonte', K, W, [76, 75, 69, 71], { x: [[2013, 75]] }),
    ],
  },
  {
    cc: 'arg', key: 'Argentinien', origin: 'arg', conf: [[0, 'sa']], slots: [[0, 2], [2000, 3]], center: [-34.6, -63.6],
    geo: { 'Buenos Aires': [-34.6, -58.38], Avellaneda: [-34.66, -58.37], 'La Plata': [-34.92, -57.95] },
    clubs: [
      club('riv', 'Buenos Aires Rot-Weiß', 'BRW', 'Buenos Aires', W, R, [79, 80, 74, 74], { x: [[1986, 81], [2015, 74], [2018, 75]] }),
      club('boc', 'Buenos Aires Blau-Gelb', 'BBG', 'Buenos Aires', '#163a7a', Y, [79, 77, 76, 71], { x: [[1978, 81], [2001, 80], [2007, 77]] }),
      club('ind', 'Avellaneda Rot', 'AVR', 'Avellaneda', R, W, [81, 77, 69, 65], { x: [[1984, 79]] }),
      club('rac', 'Avellaneda Himmelblau', 'AVH', 'Avellaneda', LB, W, [75, 73, 70, 70]),
      club('slo', 'Buenos Aires Blau-Rot', 'BBR', 'Buenos Aires', B, R, [75, 73, 71, 67], { x: [[2014, 73]] }),
      club('vel', 'Buenos Aires Weiß-Blau', 'BWB', 'Buenos Aires', W, B, [74, 76, 72, 67], { x: [[1994, 79]] }),
      club('est', 'La Plata Rot-Weiß', 'LPR', 'La Plata', R, W, [78, 72, 72, 68], { x: [[2009, 75]] }),
      club('arj', 'Buenos Aires Rot', 'BAR', 'Buenos Aires', R, W, [74, 75, 67, 65], { x: [[1985, 78]] }),
    ],
  },
  {
    cc: 'uru', key: 'Uruguay', origin: 'uru', conf: [[0, 'sa']], slots: [[0, 2]], center: [-32.5, -55.8],
    geo: { Montevideo: [-34.9, -56.19] },
    clubs: [
      club('pen', 'Montevideo Gelb-Schwarz', 'MGS', 'Montevideo', Y, K, [80, 77, 68, 66], { x: [[1982, 81], [1987, 79]] }),
      club('nac', 'Montevideo Weiß', 'MOW', 'Montevideo', W, B, [79, 78, 69, 66], { x: [[1980, 81], [1988, 79]] }),
      club('dfs', 'Montevideo Violett', 'MOV', 'Montevideo', '#5b2c83', W, [71, 71, 65, 62]),
      club('dan', 'Montevideo Weiß-Schwarz', 'MWS', 'Montevideo', W, K, [70, 70, 65, 61]),
    ],
  },
  {
    cc: 'col', key: 'Kolumbien', origin: 'col', conf: [[0, 'sa']], slots: [[0, 2]], center: [4.6, -74.1],
    geo: { Medellín: [6.25, -75.56], Bogotá: [4.71, -74.07], Cali: [3.45, -76.53], Manizales: [5.07, -75.52], Barranquilla: [10.96, -74.8] },
    clubs: [
      club('anc', 'Medellín Grün', 'MEG', 'Medellín', G, W, [73, 78, 71, 69], { x: [[1989, 79], [2016, 71]] }),
      club('mil', 'Bogotá Blau', 'BOB', 'Bogotá', B, W, [74, 72, 67, 66]),
      club('ame', 'Cali Rot', 'CAR', 'Cali', R, W, [73, 77, 70, 65]),
      club('onc', 'Manizales Weiß', 'MAW', 'Manizales', W, K, [69, 69, 71, 63], { x: [[2004, 75]] }),
      club('jun', 'Barranquilla Rot-Weiß', 'BRW', 'Barranquilla', R, W, [71, 72, 68, 67]),
    ],
  },
  {
    cc: 'chi', key: 'Chile', origin: 'chi', conf: [[0, 'sa']], slots: [[0, 2]], center: [-33.4, -70.6],
    geo: { Santiago: [-33.45, -70.67], Calama: [-22.46, -68.93] },
    clubs: [
      club('col', 'Santiago Weiß-Schwarz', 'SWS', 'Santiago', W, K, [75, 77, 69, 66], { x: [[1991, 78]] }),
      club('uch', 'Santiago Blau', 'SAB', 'Santiago', B, R, [73, 72, 68, 65]),
      club('uca', 'Santiago Weiß-Blau', 'SWB', 'Santiago', W, B, [72, 74, 69, 66]),
      club('cob', 'Calama Orange', 'CAO', 'Calama', '#e8791e', W, [71, 75, 65, 60]),
    ],
  },
  {
    cc: 'par', key: 'Paraguay', origin: 'par', conf: [[0, 'sa']], slots: [[0, 2]], center: [-23.4, -58.4],
    geo: { 'Asunción': [-25.26, -57.58] },
    clubs: [
      club('oli', 'Asunción Weiß', 'ASW', 'Asunción', W, K, [76, 78, 71, 66], { x: [[1979, 79], [2002, 76]] }),
      club('cer', 'Asunción Blau-Rot', 'ABR', 'Asunción', B, R, [73, 74, 71, 67]),
      club('lib', 'Asunción Schwarz-Weiß', 'ASS', 'Asunción', K, W, [69, 69, 70, 67]),
      club('gua', 'Asunción Gelb-Schwarz', 'AGS', 'Asunción', Y, K, [71, 70, 66, 64]),
    ],
  },
  {
    cc: 'ecu', key: 'Ecuador', origin: 'ecu', conf: [[0, 'sa']], slots: [[0, 2]], center: [-1.8, -78.2],
    geo: { Quito: [-0.18, -78.47], Guayaquil: [-2.19, -79.89], 'Sangolquí': [-0.33, -78.45] },
    clubs: [
      club('ldu', 'Quito Weiß', 'QUW', 'Quito', W, R, [70, 72, 72, 68], { x: [[2008, 74]] }),
      club('bsc', 'Guayaquil Gelb', 'GUG', 'Guayaquil', Y, K, [73, 74, 69, 67]),
      club('eme', 'Guayaquil Blau', 'GUB', 'Guayaquil', B, W, [71, 71, 68, 65]),
      club('idv', 'Sangolquí Schwarz-Blau', 'SSB', 'Sangolquí', K, B, [63, 64, 65, 70]),
    ],
  },
  {
    cc: 'per', key: 'Peru', origin: 'per', conf: [[0, 'sa']], slots: [[0, 2]], center: [-9.2, -75.0],
    geo: { Lima: [-12.05, -77.04], Cusco: [-13.53, -71.97] },
    clubs: [
      club('uni', 'Lima Creme', 'LIC', 'Lima', '#efe3c4', '#7a1f35', [73, 71, 66, 63]),
      club('ali', 'Lima Blau-Weiß', 'LBW', 'Lima', '#163a7a', W, [73, 70, 66, 63]),
      club('scr', 'Lima Himmelblau', 'LIH', 'Lima', LB, W, [72, 72, 67, 64]),
      club('cie', 'Cusco Rot', 'CUR', 'Cusco', R, W, [65, 65, 66, 60]),
    ],
  },
];
