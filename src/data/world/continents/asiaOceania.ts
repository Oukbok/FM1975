// =============================================================================
// ASIEN und OZEANIEN – Spitzenvereine je Land (verfremdet nach Stadt/Farbe).
// Stärke je Epoche grob nach Titeln in der asiatischen Meisterliga (ab 1985/86;
// 1972–1984 kein Wettbewerb), dem Aufbau der Profiligen (Japan 1993, Südkorea
// 1983, China ab 1994, Saudi-Arabien mit großem Sprung nach 2022) und der
// Klub-WM. Australien spielt bis 2005 in Ozeanien, ab 2006 in Asien.
// Vorbilder/Quellen: docs/research/continents.md. Reihenfolge je Land nur hinten erweitern.
// =============================================================================
import { club } from './southAmerica';
import type { CtCountry } from './types';

const R = '#c8202a', W = '#f2f2f2', K = '#16181c', B = '#1f4aa0', Y = '#f0c020', G = '#1f7a3e', LB = '#6aa8dc', V = '#5b2c83';

export const ASIA: CtCountry[] = [
  {
    cc: 'jpn', key: 'Japan', origin: 'jpn', conf: [[0, 'as']], slots: [[0, 1], [2003, 2]], center: [36.2, 138.25],
    geo: { Saitama: [35.86, 139.65], Kashima: [35.97, 140.64], Osaka: [34.69, 135.5], Yokohama: [35.44, 139.64], Kawasaki: [35.53, 139.7] },
    clubs: [
      club('ura', 'Saitama Rot', 'SAR', 'Saitama', R, K, [60, 63, 71, 68], { x: [[2007, 73]] }),
      club('kas', 'Kashima Dunkelrot', 'KAD', 'Kashima', '#8e1b2a', B, [58, 62, 71, 69], { x: [[2016, 72]] }),
      club('gam', 'Osaka Blau-Schwarz', 'OBS', 'Osaka', B, K, [58, 61, 71, 66]),
      club('yfm', 'Yokohama Blau', 'YOB', 'Yokohama', B, W, [60, 64, 70, 67]),
      club('kaw', 'Kawasaki Himmelblau', 'KAH', 'Kawasaki', LB, K, [0, 0, 68, 68], { y: [[1997, 9999]] }),
    ],
  },
  {
    cc: 'kor', key: 'Suedkorea', origin: 'kor', conf: [[0, 'as']], slots: [[0, 1], [2003, 2]], center: [35.9, 127.8],
    geo: { Pohang: [36.02, 129.34], Jeonju: [35.82, 127.15], Seongnam: [37.42, 127.13], Ulsan: [35.54, 129.31], Suwon: [37.26, 127.03] },
    clubs: [
      club('poh', 'Pohang Rot-Schwarz', 'PRS', 'Pohang', R, K, [60, 66, 70, 65], { x: [[2009, 71]] }),
      club('jeo', 'Jeonju Grün', 'JEG', 'Jeonju', G, W, [0, 0, 70, 68], { y: [[1994, 9999]] }),
      club('seo', 'Seongnam Gelb-Schwarz', 'SGS', 'Seongnam', Y, K, [0, 64, 70, 61], { y: [[1989, 9999]] }),
      club('uls', 'Ulsan Blau', 'ULB', 'Ulsan', B, Y, [0, 65, 69, 68], { y: [[1983, 9999]] }),
      club('suw', 'Suwon Blau-Rot', 'SBR', 'Suwon', B, R, [0, 0, 70, 64], { y: [[1995, 9999]] }),
    ],
  },
  {
    cc: 'ksa', key: 'Saudi-Arabien', origin: 'ksa', conf: [[0, 'as']], slots: [[0, 1], [2003, 2]], center: [23.9, 45.1],
    geo: { Riad: [24.71, 46.68], Dschidda: [21.49, 39.19] },
    clubs: [
      club('hil', 'Riad Blau', 'RIB', 'Riad', B, W, [66, 70, 72, 74], { x: [[2019, 72]] }),
      club('nas', 'Riad Gelb', 'RIG', 'Riad', Y, B, [65, 69, 69, 73]),
      club('itt', 'Dschidda Gelb-Schwarz', 'DGS', 'Dschidda', Y, K, [65, 68, 72, 72], { x: [[2004, 73]] }),
      club('ahl', 'Dschidda Grün', 'DJG', 'Dschidda', G, W, [64, 67, 68, 72]),
    ],
  },
  {
    cc: 'irn', key: 'Iran', origin: 'irn', conf: [[0, 'as']], slots: [[0, 1], [2003, 2]], center: [32.4, 53.7],
    geo: { Teheran: [35.69, 51.39], Isfahan: [32.65, 51.67], Tabriz: [38.08, 46.29] },
    clubs: [
      club('per', 'Teheran Rot', 'TER', 'Teheran', R, W, [66, 68, 68, 65]),
      club('est', 'Teheran Blau', 'TEB', 'Teheran', B, W, [67, 69, 68, 64]),
      club('sep', 'Isfahan Gelb', 'ISG', 'Isfahan', Y, K, [60, 63, 67, 62]),
      club('tra', 'Tabriz Rot', 'TAR', 'Tabriz', R, W, [62, 62, 63, 63]),
    ],
  },
  {
    cc: 'chn', key: 'China', origin: 'chn', conf: [[0, 'as']], slots: [[0, 1], [2003, 2]], center: [35.9, 104.2],
    geo: { Guangzhou: [23.13, 113.26], Jinan: [36.65, 117.12], Shanghai: [31.23, 121.47], Peking: [39.9, 116.41] },
    clubs: [
      club('gua', 'Guangzhou Rot', 'GZR', 'Guangzhou', R, W, [58, 60, 62, 57], { x: [[2011, 70], [2015, 73], [2019, 69], [2022, 56]] }),
      club('sha', 'Jinan Orange', 'JIO', 'Jinan', '#e8791e', W, [60, 63, 66, 63]),
      club('sip', 'Shanghai Rot', 'SHR', 'Shanghai', R, K, [0, 0, 63, 64], { y: [[2006, 9998]], x: [[2018, 69]] }),
      club('bei', 'Peking Grün', 'PEG', 'Peking', G, W, [61, 63, 65, 62]),
    ],
  },
  {
    cc: 'qat', key: 'Katar', origin: 'qat', conf: [[0, 'as']], slots: [[0, 1], [2003, 2]], center: [25.35, 51.18],
    geo: { Doha: [25.29, 51.53] },
    clubs: [
      club('sad', 'Doha Weiß', 'DOW', 'Doha', W, K, [62, 66, 68, 67], { x: [[2011, 70]] }),
      club('duh', 'Doha Rot', 'DOR', 'Doha', R, W, [0, 0, 0, 65], { y: [[2009, 9997]] }),
      club('gha', 'Doha Gelb-Blau', 'DGB', 'Doha', Y, B, [58, 62, 65, 61]),
      club('ray', 'Doha Weinrot', 'DWR', 'Doha', '#7a1f35', Y, [60, 62, 63, 61]),
    ],
  },
  {
    cc: 'uae', key: 'VAE', origin: 'uae', conf: [[0, 'as']], slots: [[0, 1], [2003, 2]], center: [23.4, 53.8],
    geo: { 'Al Ain': [24.21, 55.75], Dubai: [25.2, 55.27], 'Abu Dhabi': [24.45, 54.38], Schardscha: [25.35, 55.39] },
    clubs: [
      club('ain', 'Al Ain Violett', 'AAV', 'Al Ain', V, W, [61, 64, 70, 66], { x: [[2003, 71], [2018, 68]] }),
      club('sha', 'Dubai Rot', 'DUR', 'Dubai', R, K, [60, 62, 64, 63]),
      club('was', 'Dubai Gelb', 'DUG', 'Dubai', Y, K, [61, 63, 63, 59]),
      club('wah', 'Abu Dhabi Weinrot', 'ADW', 'Abu Dhabi', '#7a1f35', W, [59, 62, 64, 60]),
    ],
  },
  {
    cc: 'aus', key: 'Australien', origin: 'aus', conf: [[0, 'oc'], [2006, 'as']], league: [[1977, 9999]], slots: [[0, 2], [2006, 1], [2010, 2]], center: [-25.3, 133.8],
    geo: { Sydney: [-33.87, 151.21], Melbourne: [-37.81, 144.96], Adelaide: [-34.93, 138.6] },
    clubs: [
      club('smb', 'Melbourne Weiß-Blau', 'MWB', 'Melbourne', W, B, [60, 63, 62, 0], { y: [[1977, 2004]], x: [[1999, 65]] }),
      club('ade', 'Adelaide Schwarz-Rot', 'ASR', 'Adelaide', K, R, [59, 62, 62, 0], { y: [[1977, 2004]] }),
      club('syd', 'Sydney Himmelblau', 'SYH', 'Sydney', LB, '#163a7a', [0, 0, 66, 63], { y: [[2005, 9999]] }),
      club('mvi', 'Melbourne Blau', 'MEB', 'Melbourne', '#163a7a', W, [0, 0, 66, 63], { y: [[2005, 9999]] }),
      club('wsw', 'Sydney Rot-Schwarz', 'SRS', 'Sydney', R, K, [0, 0, 0, 63], { y: [[2012, 9997]], x: [[2014, 68]] }),
    ],
  },
];

export const OCEANIA: CtCountry[] = [
  {
    cc: 'nzl', key: 'Neuseeland', origin: 'nzl', conf: [[0, 'oc']], slots: [[0, 2]], center: [-40.9, 174.9],
    geo: { Auckland: [-36.85, 174.76], Waitakere: [-36.85, 174.54], Wellington: [-41.29, 174.78], Christchurch: [-43.53, 172.64] },
    clubs: [
      club('chr', 'Christchurch Rot-Schwarz', 'CRS', 'Christchurch', R, K, [56, 57, 56, 56]),
      club('mtw', 'Auckland Gelb', 'AKG', 'Auckland', Y, K, [55, 57, 0, 0], { y: [[1975, 2003]] }),
      club('auc', 'Auckland Blau', 'AKB', 'Auckland', '#163a7a', W, [0, 0, 60, 63], { y: [[2004, 9999]] }),
      club('wai', 'Waitakere Rot', 'WAR', 'Waitakere', R, W, [0, 0, 59, 58], { y: [[2004, 9999]] }),
      club('wel', 'Wellington Gelb-Grün', 'WGG', 'Wellington', Y, G, [0, 0, 57, 60], { y: [[2004, 9999]] }),
    ],
  },
];
