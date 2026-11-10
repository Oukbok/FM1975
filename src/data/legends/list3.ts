// Ausnahmetalente 101–132 (Wunsch Pascal: weniger deutsches Übergewicht, mehr
// andere Nationen gerade in den frühen Jahrzehnten). Aufbau wie list1.ts;
// Vorbilder nur in docs/recherche/legenden.md.
import { L, type LegendDef } from './types';

export const LEGENDS_C: LegendDef[] = [
  // --- Jahrgänge der 1940er ---
  L('rivelao', 'Rivelão', 'Batistela', '1946-01-01', 'BRA', 'OM', ['LM', 'ZM'], 'L', 'kuenstler', 92, 169, [0.4, 0.1], [84, 85, 30, 75, 75, 85, 70], [55, 60, 75, 55, 70, 70]),
  L('bestwood', 'Geordie', 'Bestwood', '1946-05-22', 'NIR', 'RA', ['LA', 'HS'], 'R', 'dribbler', 94, 175, [0.8, -0.9], [62, 85, 40, 85, 20, 70, 60], [45, 80, 40, 75, 95, 30]),
  L('deynarski', 'Kazimir', 'Deynarski', '1947-10-23', 'POL', 'ZM', ['OM'], 'R', 'regisseur', 90, 181, [0.0, 0.0], [85, 85, 30, 70, 80, 80, 70], [80, 50, 80, 40, 50, 70]),
  L('renselink', 'Robbert', 'Renselink', '1947-07-22', 'NED', 'LA', ['HS'], 'L', 'dribbler', 90, 176, [0.0, 0.3], [80, 82, 30, 70, 75, 75, 80], [55, 55, 55, 70, 40, 65]),
  // --- Jahrgänge der 1950er ---
  L('lattowski', 'Grzesław', 'Latowski', '1950-04-08', 'POL', 'RA', ['MS'], 'R', 'sprinter', 89, 172, [0.0, 0.3], [84, 85, 25, 70, 85, 80, 75], [80, 45, 80, 40, 40, 70]),
  L('neeskamp', 'Joop', 'Neeskamp', '1951-09-15', 'NED', 'ZM', ['DM', 'OM'], 'R', 'antreiber', 91, 176, [0.5, -0.4], [84, 90, 45, 80, 75, 88, 80], [45, 70, 45, 80, 60, 55]),
  L('millard', 'Rogatien', 'Millavon', '1952-05-20', 'CMR', 'MS', ['HS'], 'R', 'torjaeger', 88, 176, [-0.6, 1.0], [80, 92, 20, 55, 85, 85, 85], [60, 55, 70, 65, 80, 70]),
  L('blochnenko', 'Oleksij', 'Blochnenko', '1952-11-05', 'UKR', 'LA', ['MS'], 'L', 'sprinter', 92, 180, [0.4, 0.4], [88, 85, 20, 75, 92, 85, 70], [92, 40, 90, 20, 40, 70]),
  L('passarola', 'Danilo', 'Passaroni', '1953-05-25', 'ARG', 'IV', ['LIB'], 'R', 'vorstopper', 91, 173, [0.2, 0.3], [88, 92, 25, 70, 85, 95, 70], [75, 55, 70, 50, 75, 60]),
  L('sounesby', 'Gregor', 'Sounderby', '1953-05-06', 'SCO', 'ZM', ['DM'], 'R', 'antreiber', 89, 180, [0.0, 0.2], [86, 92, 30, 65, 82, 95, 75], [55, 65, 50, 70, 70, 55]),
  L('falconi', 'Paulinho', 'Falconi', '1953-10-16', 'BRA', 'ZM', ['DM', 'OM'], 'R', 'regisseur', 91, 183, [0.0, 0.3], [88, 88, 30, 70, 85, 85, 85], [55, 60, 60, 75, 55, 70]),
  L('pfaffaert', 'Jean-Luc', 'Pfaffaert', '1953-12-04', 'BEL', 'TW', [], 'R', 'reflex', 89, 180, [-0.2, 0.6], [85, 85, 20, 60, 85, 85, 85], [60, 55, 55, 75, 85, 60]),
  L('bradigan', 'Lorcan', 'Bradigan', '1956-02-13', 'IRL', 'ZM', ['OM'], 'L', 'regisseur', 88, 175, [0.4, -0.2], [82, 85, 35, 75, 80, 80, 85], [55, 60, 50, 80, 45, 70]),
  L('robshaw', 'Brendan', 'Robshaw', '1957-01-11', 'ENG', 'ZM', ['DM'], 'R', 'antreiber', 89, 178, [0.0, -0.2], [86, 92, 75, 70, 85, 92, 75], [85, 50, 70, 35, 60, 70]),
  L('dasajew', 'Rustam', 'Dastanow', '1957-06-13', 'RUS', 'TW', [], 'R', 'reflex', 91, 189, [-0.2, 0.3], [92, 90, 20, 60, 88, 80, 60], [90, 40, 85, 25, 30, 75]),
  L('elkjaersen', 'Palle', 'Elkjærsen', '1957-09-11', 'DEN', 'MS', ['HS'], 'L', 'sprinter', 89, 182, [0.0, 0.0], [78, 88, 30, 70, 55, 80, 85], [45, 65, 40, 85, 70, 55]),
  L('sanchiz', 'Hugolino', 'Santchero', '1958-07-11', 'MEX', 'MS', [], 'R', 'torjaeger', 91, 175, [0.0, 0.5], [88, 88, 25, 70, 90, 92, 85], [45, 65, 55, 85, 85, 70]),
  L('prudhommeau', 'Mikaël', 'Prudhommeau', '1959-01-24', 'BEL', 'TW', [], 'R', 'reflex', 90, 181, [-0.4, 0.8], [90, 88, 20, 55, 92, 85, 80], [75, 45, 65, 55, 40, 75]),
  // --- Jahrgänge der 1960er ---
  L('bilanow', 'Ihnat', 'Bilenkow', '1960-09-25', 'UKR', 'MS', ['RA'], 'R', 'sprinter', 89, 174, [0.0, -0.3], [80, 82, 30, 70, 80, 80, 65], [80, 50, 80, 35, 45, 70]),
  L('valderrosa', 'Carlitos', 'Valdecasa', '1961-09-02', 'COL', 'ZM', ['OM'], 'R', 'regisseur', 89, 176, [-0.2, 0.7], [85, 90, 20, 60, 70, 70, 75], [80, 55, 85, 40, 85, 75]),
  L('francescotti', 'Enrico', 'Francelotti', '1961-11-12', 'URU', 'OM', ['HS'], 'R', 'kuenstler', 91, 181, [0.2, 0.4], [85, 88, 25, 75, 88, 80, 85], [65, 55, 60, 75, 45, 75]),
  L('butraguero', 'Emiliano', 'Butracero', '1963-07-22', 'ESP', 'MS', ['HS'], 'R', 'torjaeger', 90, 170, [0.5, 0.0], [85, 88, 25, 80, 88, 80, 75], [95, 45, 90, 20, 45, 80]),
  L('pelewa', 'Abdul', 'Pelangwa', '1964-11-05', 'GHA', 'OM', ['LA', 'RA'], 'L', 'dribbler', 89, 172, [0.5, 0.3], [80, 85, 30, 80, 80, 85, 85], [55, 60, 55, 80, 70, 70]),
  L('hagescu', 'Gheorghiță', 'Hagescu', '1965-02-05', 'ROU', 'OM', ['HS'], 'L', 'kuenstler', 92, 174, [0.6, 0.2], [80, 90, 30, 85, 75, 90, 75], [60, 70, 70, 65, 90, 60]),
  L('stojkovac', 'Dragiša', 'Stojanovac', '1965-03-03', 'YUG', 'OM', ['HS', 'ZM'], 'R', 'kuenstler', 90, 175, [0.3, 0.0], [82, 85, 55, 75, 80, 80, 80], [60, 60, 65, 70, 70, 65]),
  L('sukerac', 'Darko', 'Šuković', '1968-01-01', 'CRO', 'MS', [], 'L', 'torjaeger', 90, 183, [0.0, 0.2], [82, 88, 30, 70, 75, 85, 75], [55, 70, 60, 70, 65, 60]),
  L('batistini', 'Gabino', 'Batistini', '1969-02-01', 'ARG', 'MS', [], 'R', 'torjaeger', 92, 185, [0.0, 0.2], [88, 90, 40, 70, 88, 88, 80], [90, 50, 70, 50, 55, 85]),
  L('laudsholm', 'Bjarne', 'Laudsholm', '1969-02-22', 'DEN', 'LA', ['RA', 'OM'], 'R', 'dribbler', 89, 186, [0.2, 0.2], [82, 82, 30, 75, 82, 75, 85], [45, 55, 40, 85, 35, 70]),
  // --- spätere Jahrgänge ---
  L('nakaoka', 'Hidetaka', 'Nakamori', '1977-01-22', 'JPN', 'OM', ['ZM'], 'R', 'regisseur', 88, 175, [0.3, -0.4], [85, 85, 30, 75, 92, 80, 85], [40, 70, 35, 90, 80, 55]),
  L('owensby', 'Mitchell', 'Owensby', '1979-12-14', 'ENG', 'MS', [], 'R', 'sprinter', 91, 173, [1.0, -1.0], [85, 88, 75, 92, 85, 85, 70], [70, 55, 70, 50, 60, 75]),
  L('seonheung', 'Heung-jin', 'Seon', '1992-07-08', 'KOR', 'LA', ['MS', 'RA'], 'B', 'sprinter', 91, 183, [0.0, 0.5], [90, 88, 20, 75, 96, 90, 90], [85, 50, 60, 75, 70, 80], 'ostasien'),
  L('vinicinho', 'Vinicinho', 'Paixão', '2000-07-12', 'BRA', 'LA', ['RA'], 'R', 'dribbler', 93, 176, [0.8, 0.0], [80, 85, 20, 90, 85, 92, 80], [70, 70, 65, 65, 85, 75], 'westafrika'),
];
