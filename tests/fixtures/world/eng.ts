// Beispieldaten NUR für Tests (test:world): England mit wenigen Saisons im Format der
// Weltdaten (docs/specs/WELTDATEN_SPEC.md). Die echten Daten liefert die Recherche
// in src/data/world/clubs|seasons/eng.ts.
import type { RealClub, SeasonRow } from '../../../src/data/world/types';

const C = (id: string, name: string, short: string, city: string, primary: string, secondary: string): RealClub =>
  ({ id: `eng-${id}`, name, short, city, colors: { primary, secondary } });

export const CLUBS_ENG: RealClub[] = [
  C('liverpool-rot', 'Liverpool Rot', 'LIR', 'Liverpool', '#C8102E', '#FFFFFF'),
  C('london-west', 'London West', 'LOW', 'London', '#1D5BA4', '#FFFFFF'),
  C('manchester-rot', 'Manchester Rot', 'MAR', 'Manchester', '#DA291C', '#000000'),
  C('derby', 'Derby', 'DER', 'Derby', '#FFFFFF', '#000000'),
  C('leeds', 'Leeds', 'LEE', 'Leeds', '#FFFFFF', '#1D428A'),
  C('ipswich', 'Ipswich', 'IPS', 'Ipswich', '#0033A0', '#FFFFFF'),
  C('leicester', 'Leicester', 'LEI', 'Leicester', '#003090', '#FFFFFF'),
  C('manchester-himmelblau', 'Manchester Himmelblau', 'MAH', 'Manchester', '#6CABDD', '#FFFFFF'),
  C('london-nord-weiss', 'London Nord Weiß', 'LNW', 'London', '#FFFFFF', '#132257'),
  C('norwich', 'Norwich', 'NOR', 'Norwich', '#FFF200', '#00A650'),
  C('liverpool-blau', 'Liverpool Blau', 'LIB', 'Liverpool', '#003399', '#FFFFFF'),
  C('stoke', 'Stoke', 'STO', 'Stoke', '#E03A3E', '#FFFFFF'),
  C('middlesbrough', 'Middlesbrough', 'MID', 'Middlesbrough', '#E21A23', '#FFFFFF'),
  C('coventry', 'Coventry', 'COV', 'Coventry', '#6CABDD', '#FFFFFF'),
  C('newcastle', 'Newcastle', 'NEW', 'Newcastle', '#000000', '#FFFFFF'),
  C('birmingham-weinrot', 'Birmingham Weinrot', 'BIW', 'Birmingham', '#670E36', '#95BFE5'),
  C('london-nord-rot', 'London Nord Rot', 'LNR', 'London', '#EF0107', '#FFFFFF'),
  C('london-ost', 'London Ost', 'LOO', 'London', '#7A263A', '#1BB1E7'),
  C('birmingham-blau', 'Birmingham Blau', 'BIB', 'Birmingham', '#0000FF', '#FFFFFF'),
  C('wolverhampton', 'Wolverhampton', 'WOL', 'Wolverhampton', '#FDB913', '#231F20'),
  C('burnley', 'Burnley', 'BUR', 'Burnley', '#6C1D45', '#99D6EA'),
  C('sheffield-rot', 'Sheffield Rot', 'SHR', 'Sheffield', '#EE2737', '#FFFFFF'),
  C('sunderland', 'Sunderland', 'SUN', 'Sunderland', '#EB172B', '#FFFFFF'),
  C('bristol-rot', 'Bristol Rot', 'BRR', 'Bristol', '#E21A23', '#FFFFFF'),
  C('west-bromwich', 'West Bromwich', 'WBR', 'West Bromwich', '#122F67', '#FFFFFF'),
  C('bolton', 'Bolton', 'BOL', 'Bolton', '#FFFFFF', '#263C7E'),
  C('nottingham-schwarz', 'Nottingham Schwarz-Weiß', 'NSW', 'Nottingham', '#000000', '#FFFFFF'),
  C('southampton', 'Southampton', 'SOU', 'Southampton', '#D71920', '#FFFFFF'),
  C('luton', 'Luton', 'LUT', 'Luton', '#F78F1E', '#002D62'),
  C('nottingham-rot', 'Nottingham Rot', 'NTR', 'Nottingham', '#DD0000', '#FFFFFF'),
  C('london-sued-rot', 'London Süd Rot', 'LSR', 'London', '#D4021D', '#FFFFFF'),
  C('blackpool', 'Blackpool', 'BLP', 'Blackpool', '#F68712', '#FFFFFF'),
  C('london-blau', 'London Blau', 'LOB', 'London', '#034694', '#FFFFFF'),
  C('london-weiss', 'London Weiß-Schwarz', 'LWS', 'London', '#FFFFFF', '#000000'),
  C('london-orient', 'London Orient', 'LOR', 'London', '#C8102E', '#FFFFFF'),
  C('hull', 'Hull', 'HUL', 'Hull', '#F5A12D', '#000000'),
  C('blackburn', 'Blackburn', 'BLB', 'Blackburn', '#009EE0', '#FFFFFF'),
  C('plymouth', 'Plymouth', 'PLY', 'Plymouth', '#00553E', '#FFFFFF'),
  C('oldham', 'Oldham', 'OLD', 'Oldham', '#004A9F', '#FFFFFF'),
  C('bristol-blau', 'Bristol Blau', 'BRB', 'Bristol', '#003399', '#FFFFFF'),
  C('carlisle', 'Carlisle', 'CAR', 'Carlisle', '#0033A0', '#FFFFFF'),
  C('oxford', 'Oxford', 'OXF', 'Oxford', '#FFF200', '#002147'),
  C('york', 'York', 'YOR', 'York', '#E21A23', '#FFFFFF'),
  C('portsmouth', 'Portsmouth', 'POR', 'Portsmouth', '#001489', '#FFFFFF'),
];

const ids = CLUBS_ENG.map((c) => c.id);
const T1 = ids.slice(0, 22), T2 = ids.slice(22, 44);
const rot = (a: string[], k: number) => [...a.slice(k), ...a.slice(0, k)];

export const SEASONS_ENG: Record<number, SeasonRow> = {
  1975: { t1: T1, t2: T2, cup: 'eng-southampton', euro: { ec: ['eng-liverpool-blau'], cwc: ['eng-london-ost'], uefa: ['eng-ipswich', 'eng-liverpool-rot', 'eng-london-nord-weiss', 'eng-leeds'] } },
  1976: { t1: rot(T1, 1), t2: rot(T2, 2), cup: 'eng-manchester-rot', euro: { ec: ['eng-liverpool-rot'], cwc: ['eng-southampton'], uefa: ['eng-london-west', 'eng-manchester-rot', 'eng-derby', 'eng-ipswich'] } },
  1985: { t1: rot(T1, 3), t2: rot(T2, 5), cup: 'eng-coventry' },
  2000: { t1: rot(T1, 4).slice(0, 20), t2: [...rot(T2, 1), ...rot(T1, 4).slice(20)].concat([]), euro: { cl: ['eng-manchester-rot', 'eng-london-nord-rot', 'eng-leeds'], el: ['eng-liverpool-rot', 'eng-ipswich'] } },
};
