// Ausnahmetalente 51–100: Italien, Spanien, Großbritannien, Portugal, Südamerika,
// übriges Europa und Afrika. Aufbau wie list1.ts.
import { L, type LegendDef } from './types';

export const LEGENDS_B: LegendDef[] = [
  // --- Italien ---
  L('baggiani', 'Rodolfo', 'Baggiani', '1967-02-18', 'ITA', 'HS', ['OM', 'MS'], 'R', 'kuenstler', 94, 174, [0.5, 0.4], [82, 80, 65, 80, 80, 80, 70], [60, 45, 70, 40, 55, 75]),
  L('pierro', 'Alessio', 'Dal Pierotti', '1974-11-09', 'ITA', 'HS', ['LA', 'OM'], 'R', 'kuenstler', 91, 173, [0.4, 0.6], [85, 88, 40, 75, 90, 80, 75], [95, 45, 75, 40, 45, 80]),
  L('cannavelli', 'Flavio', 'Cannavelli', '1973-09-13', 'ITA', 'IV', [], 'R', 'vorstopper', 90, 176, [0.2, 0.4], [92, 92, 25, 70, 88, 85, 70], [60, 55, 70, 50, 45, 75]),
  L('pirlotti', 'Amedeo', 'Pirlanti', '1979-05-19', 'ITA', 'DM', ['ZM', 'OM'], 'R', 'regisseur', 92, 177, [-0.3, 0.6], [92, 95, 20, 60, 80, 70, 75], [65, 50, 60, 55, 35, 70]),
  L('buffari', 'Gianpaolo', 'Buffardi', '1978-01-28', 'ITA', 'TW', [], 'R', 'reflex', 93, 192, [0.6, 1.0], [94, 92, 20, 75, 90, 88, 70], [95, 50, 70, 35, 60, 75]),
  // --- Spanien ---
  L('gonzalvo', 'Rubén', 'Garzalvo', '1977-06-27', 'ESP', 'MS', ['HS'], 'L', 'torjaeger', 92, 180, [0.8, 0.3], [90, 92, 20, 85, 92, 85, 80], [92, 45, 85, 45, 45, 80]),
  L('hernando', 'Ivo', 'Hermandaro', '1980-01-25', 'ESP', 'ZM', ['DM'], 'R', 'regisseur', 94, 170, [0.0, 0.5], [97, 90, 20, 70, 92, 80, 75], [97, 45, 85, 45, 25, 80]),
  L('iniestra', 'Adrián', 'Iniestrada', '1984-05-11', 'ESP', 'ZM', ['OM', 'LA'], 'R', 'kuenstler', 94, 171, [0.3, 0.6], [92, 95, 40, 75, 92, 75, 75], [95, 40, 75, 50, 15, 90]),
  L('casillero', 'Ibai', 'Casillero', '1981-05-20', 'ESP', 'TW', [], 'R', 'reflex', 92, 182, [0.8, 0.3], [88, 92, 20, 85, 88, 85, 70], [95, 50, 85, 35, 55, 70]),
  L('ramoso', 'Sebas', 'Rambosio', '1986-03-30', 'ESP', 'IV', ['RV'], 'R', 'vorstopper', 92, 184, [0.5, 0.7], [84, 96, 30, 75, 85, 92, 75], [70, 65, 60, 50, 85, 70]),
  L('cascanto', 'Rodolfo', 'Escalante', '1996-06-22', 'ESP', 'DM', ['ZM', 'IV'], 'R', 'regisseur', 92, 191, [-0.4, 0.3], [96, 90, 35, 65, 92, 85, 85], [75, 40, 55, 60, 20, 75]),
  L('yamali', 'Lamar', 'Yamarou', '2007-07-13', 'ESP', 'RA', ['OM'], 'L', 'dribbler', 96, 180, [1.0, 0.0], [85, 88, 30, 98, 82, 90, 85], [80, 60, 75, 40, 75, 85], 'nordafrika'),
  // --- England, Schottland ---
  L('keeghan', 'Kieran', 'Keighley', '1951-02-14', 'ENG', 'HS', ['MS', 'RA'], 'R', 'antreiber', 91, 172, [-0.2, -0.2], [88, 85, 30, 80, 92, 95, 85], [50, 60, 45, 80, 70, 60]),
  L('dalgleash', 'Kendall', 'Dalgreave', '1951-03-04', 'SCO', 'HS', ['MS', 'OM'], 'R', 'kuenstler', 91, 173, [0.0, 0.4], [92, 88, 20, 70, 88, 85, 70], [85, 40, 70, 40, 30, 80]),
  L('linacre', 'Garth', 'Linacre', '1960-11-30', 'ENG', 'MS', [], 'R', 'torjaeger', 89, 177, [0.0, 0.0], [90, 85, 20, 70, 90, 80, 85], [55, 50, 50, 75, 60, 70]),
  L('shearwood', 'Alec', 'Shearwood', '1970-08-13', 'ENG', 'MS', [], 'R', 'wandspieler', 90, 183, [0.3, 0.0], [88, 90, 55, 70, 88, 85, 65], [90, 50, 95, 20, 50, 75]),
  L('beckford', 'Darren', 'Beckwell', '1975-05-02', 'ENG', 'RM', ['ZM'], 'R', 'aussen', 89, 180, [0.4, 0.3], [85, 90, 25, 70, 92, 85, 90], [55, 75, 40, 85, 99, 70]),
  L('gerrardson', 'Stewart', 'Garradine', '1980-05-30', 'ENG', 'ZM', ['DM', 'OM'], 'R', 'antreiber', 91, 183, [0.4, 0.2], [85, 92, 40, 75, 90, 88, 60], [97, 50, 95, 20, 55, 80]),
  L('rooneham', 'Warren', 'Rooneham', '1985-10-24', 'ENG', 'HS', ['MS', 'OM'], 'R', 'antreiber', 91, 176, [0.9, -0.4], [82, 85, 35, 90, 75, 88, 65], [75, 70, 70, 35, 60, 75]),
  L('kaneford', 'Harvey', 'Kaynesford', '1993-07-28', 'ENG', 'MS', [], 'R', 'torjaeger', 93, 188, [-0.6, 0.4], [92, 85, 35, 60, 95, 92, 85], [80, 45, 70, 50, 45, 85]),
  L('bellingworth', 'Jed', 'Bellingworth', '2003-06-29', 'ENG', 'OM', ['ZM'], 'R', 'antreiber', 93, 186, [0.95, 0.1], [88, 92, 35, 92, 92, 96, 92], [55, 55, 50, 85, 80, 70]),
  // --- Portugal ---
  L('figueiro', 'Lucas', 'Figueiró', '1972-11-04', 'POR', 'RA', ['LA', 'OM'], 'R', 'dribbler', 93, 180, [0.3, 0.4], [88, 88, 25, 75, 88, 88, 85], [25, 80, 45, 80, 70, 65]),
  L('ronalvo', 'Cristóvão', 'Ronalves', '1985-02-05', 'POR', 'LA', ['MS', 'RA'], 'R', 'sprinter', 98, 187, [0.6, 1.0], [96, 92, 5, 90, 99, 99, 88], [45, 80, 55, 80, 99, 70]),
  // --- Brasilien ---
  L('zicao', 'Arturzinho', 'Zicardo', '1953-03-03', 'BRA', 'OM', ['HS'], 'R', 'regisseur', 94, 172, [0.2, 0.2], [88, 85, 45, 80, 88, 85, 70], [90, 50, 90, 40, 55, 80]),
  L('sofocles', 'Doutor', 'Sófocles', '1954-02-19', 'BRA', 'OM', ['ZM'], 'R', 'regisseur', 91, 192, [-0.3, -0.4], [80, 85, 40, 65, 40, 70, 60], [80, 30, 90, 40, 75, 60]),
  L('romarinho', 'Romarinho', 'Sousela', '1966-01-29', 'BRA', 'MS', [], 'R', 'torjaeger', 94, 168, [0.3, 0.8], [75, 92, 30, 75, 35, 85, 60], [30, 75, 85, 55, 85, 55]),
  L('ronaldao', 'Reinaldão', 'Nazarbes', '1976-09-18', 'BRA', 'MS', [], 'R', 'sprinter', 98, 183, [0.9, -0.6], [85, 90, 80, 95, 55, 90, 80], [40, 80, 50, 75, 85, 60]),
  L('rivalto', 'Rivaldinho', 'Pereirinha', '1972-04-19', 'BRA', 'OM', ['LA', 'HS'], 'L', 'kuenstler', 93, 186, [-0.2, 0.5], [82, 88, 30, 70, 82, 85, 70], [40, 75, 60, 70, 45, 70]),
  L('ronaldelo', 'Rodolfinho', 'Gaudério', '1980-03-21', 'BRA', 'OM', ['LA', 'HS'], 'R', 'kuenstler', 96, 181, [0.6, -0.8], [75, 85, 25, 85, 40, 75, 75], [40, 70, 55, 75, 90, 60]),
  L('kaquinho', 'Ricardinho', 'Kaquinho', '1982-04-22', 'BRA', 'OM', ['ZM', 'HS'], 'R', 'antreiber', 93, 186, [0.6, -0.6], [88, 85, 55, 85, 92, 85, 80], [70, 50, 55, 65, 60, 85]),
  L('neimarcos', 'Neimarcos', 'Santinho', '1992-02-05', 'BRA', 'LA', ['MS', 'OM'], 'R', 'dribbler', 94, 175, [0.7, -0.5], [76, 80, 65, 90, 50, 88, 75], [35, 92, 60, 75, 97, 65]),
  // --- Argentinien ---
  L('kempelli', 'Marcelo', 'Kempelli', '1954-07-15', 'ARG', 'MS', ['HS'], 'L', 'wandspieler', 90, 184, [0.0, 0.0], [80, 92, 30, 70, 80, 80, 75], [50, 55, 60, 70, 55, 65]),
  L('maradano', 'Dario', 'Maradorro', '1960-10-30', 'ARG', 'OM', ['HS'], 'L', 'kuenstler', 99, 165, [0.8, -0.3], [84, 96, 55, 92, 30, 90, 75], [55, 75, 70, 70, 95, 55]),
  L('messini', 'Leandro', 'Mesquino', '1987-06-24', 'ARG', 'RA', ['HS', 'OM'], 'L', 'kuenstler', 99, 170, [0.9, 0.7], [97, 88, 25, 95, 90, 92, 60], [92, 55, 75, 30, 25, 90]),
  // --- übriges Europa, Afrika, Uruguay ---
  L('weahson', 'Gordon', 'Wehabo', '1966-10-01', 'LBR', 'MS', ['HS'], 'R', 'sprinter', 92, 184, [-0.2, 0.0], [82, 85, 30, 70, 85, 88, 85], [55, 55, 70, 80, 65, 70]),
  L('schewtschenkow', 'Oleh', 'Schewtschuk', '1976-09-29', 'UKR', 'MS', [], 'R', 'torjaeger', 93, 183, [0.2, -0.2], [88, 88, 35, 75, 88, 85, 80], [65, 55, 65, 60, 55, 75]),
  L('laudrupsen', 'Mogens', 'Laudsgaard', '1964-06-15', 'DEN', 'OM', ['HS', 'ZM'], 'R', 'kuenstler', 92, 183, [0.7, 0.2], [85, 82, 25, 85, 80, 70, 90], [40, 55, 40, 85, 35, 70]),
  L('simonsgaard', 'Arne', 'Simonsgaard', '1952-12-15', 'DEN', 'HS', ['RA', 'MS'], 'R', 'dribbler', 89, 165, [0.0, 0.0], [85, 85, 30, 70, 85, 80, 85], [55, 45, 55, 75, 40, 70]),
  L('bonialek', 'Zdzisław', 'Bonieczko', '1956-03-03', 'POL', 'OM', ['HS', 'RA'], 'R', 'sprinter', 89, 177, [0.2, -0.2], [80, 85, 30, 75, 75, 85, 80], [45, 70, 50, 80, 70, 60]),
  L('lewadowiak', 'Radosław', 'Lewadowiak', '1988-08-21', 'POL', 'MS', [], 'R', 'torjaeger', 94, 185, [-0.3, 0.8], [95, 85, 8, 70, 98, 95, 90], [55, 65, 60, 75, 60, 85]),
  L('stoitschew', 'Kiril', 'Stoikanow', '1966-02-08', 'BUL', 'LA', ['MS', 'HS'], 'L', 'sprinter', 91, 178, [0.2, -0.2], [75, 88, 30, 75, 65, 92, 70], [55, 65, 70, 65, 85, 55]),
  L('modrinic', 'Lovro', 'Modrovac', '1985-09-09', 'CRO', 'ZM', ['OM', 'DM'], 'R', 'regisseur', 93, 172, [-0.3, 1.0], [95, 92, 15, 65, 96, 90, 85], [75, 45, 70, 60, 25, 85]),
  L('ibrahimagic', 'Zoran', 'Ibrahimbegić', '1981-10-03', 'SWE', 'MS', ['HS'], 'R', 'kuenstler', 91, 195, [0.0, 1.0], [84, 88, 30, 70, 88, 97, 88], [15, 85, 30, 95, 99, 50], 'balkan'),
  L('nedvidek', 'Petr', 'Nedvídek', '1972-08-30', 'CZE', 'LM', ['OM', 'ZM'], 'B', 'antreiber', 91, 177, [-0.2, 0.3], [92, 88, 25, 70, 98, 90, 80], [85, 45, 55, 60, 35, 75]),
  L('haalvik', 'Eirik', 'Haalvik', '2000-07-21', 'NOR', 'MS', [], 'L', 'torjaeger', 95, 195, [0.7, 0.0], [90, 88, 35, 90, 95, 97, 85], [55, 70, 60, 75, 60, 70]),
  L('salahi', 'Mahmoud', 'Selhawi', '1992-06-15', 'EGY', 'RA', ['MS'], 'L', 'sprinter', 92, 175, [-0.3, 0.3], [92, 85, 15, 70, 95, 90, 75], [75, 55, 80, 60, 50, 85]),
  L('bruynck', 'Kasper', 'De Bruyckere', '1991-06-28', 'BEL', 'OM', ['ZM', 'RA'], 'R', 'regisseur', 93, 181, [0.0, 0.2], [90, 85, 40, 75, 85, 88, 75], [70, 60, 55, 65, 30, 80]),
  L('etoumbe', 'Salomon', 'Etoumbé', '1981-03-10', 'CMR', 'MS', ['RA'], 'R', 'sprinter', 91, 180, [0.3, 0.2], [85, 88, 20, 80, 88, 92, 85], [40, 80, 55, 80, 80, 65]),
  L('drogbeni', 'Désiré', 'Drogbeni', '1978-03-11', 'CIV', 'MS', [], 'R', 'wandspieler', 90, 189, [-1.0, 0.6], [85, 95, 25, 45, 88, 92, 85], [70, 60, 60, 75, 80, 75]),
  L('suarte', 'Lucio', 'Soarelli', '1987-01-24', 'URU', 'MS', ['HS'], 'R', 'torjaeger', 93, 182, [0.3, 0.4], [86, 88, 25, 75, 80, 95, 85], [55, 65, 60, 80, 70, 90]),
];
