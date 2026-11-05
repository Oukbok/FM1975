// =============================================================================
// Weltdaten isr: alle Vereine der erfassten Ligen 1975/76–2025/26 (verfremdete Namen).
// Echte Namen und Quellen: docs/recherche/weltvereine_isr.md. Format: docs/specs/WELTDATEN_SPEC.md.
// =============================================================================
import type { RealClub } from '../types';

export const CLUBS_ISR: RealClub[] = [
  { id: 'isr-akko', name: 'Akko', short: 'AKK', city: 'Akko', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'isr-aschkelon', name: 'Aschkelon', short: 'ASK', city: 'Aschkelon', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-ashdod', name: 'Ashdod', short: 'ASH', city: 'Ashdod', colors: { primary: '#D71920', secondary: '#FFD200' } },
  { id: 'isr-beer-sheva', name: 'Beer Sheva', short: 'BEE', city: 'Beer Sheva', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-beit-shean', name: 'Beit Shean', short: 'BSH', city: 'Beit Shean', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-hadera', name: 'Hadera', short: 'HAD', city: 'Hadera', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-haifa-gruen', name: 'Haifa Grün', short: 'HAG', city: 'Haifa', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'isr-haifa-rot', name: 'Haifa Rot', short: 'HAR', city: 'Haifa', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-herzlia', name: 'Herzlia', short: 'HER', city: 'Herzlia', colors: { primary: '#FFD200', secondary: '#003399' } },
  { id: 'isr-holon', name: 'Holon', short: 'HOL', city: 'Holon', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-jaffa', name: 'Jaffa', short: 'JAF', city: 'Tel Aviv', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'isr-jerusalem-gelb-schwarz', name: 'Jerusalem Gelb-Schwarz', short: 'JGS', city: 'Jerusalem', colors: { primary: '#FFD200', secondary: '#000000' } },
  { id: 'isr-jerusalem-rot', name: 'Jerusalem Rot', short: 'JRO', city: 'Jerusalem', colors: { primary: '#D71920', secondary: '#000000' } },
  { id: 'isr-kfar-saba', name: 'Kfar Saba', short: 'KFS', city: 'Kfar Saba', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'isr-kiryat-ata', name: 'Kiryat Ata', short: 'KAT', city: 'Kiryat Ata', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'isr-kiryat-schmona', name: 'Kiryat Schmona', short: 'KIS', city: 'Kiryat Schmona', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'isr-nazareth', name: 'Nazareth', short: 'NAZ', city: 'Nazareth', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'isr-nes-ziona', name: 'Nes Ziona', short: 'NES', city: 'Nes Ziona', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'isr-netanya', name: 'Netanya', short: 'NET', city: 'Netanya', colors: { primary: '#FFD200', secondary: '#000000' } },
  { id: 'isr-nof-hagalil', name: 'Nof HaGalil', short: 'NHG', city: 'Nof HaGalil', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-petach-tikva-blau', name: 'Petach Tikva Blau', short: 'PTB', city: 'Petach Tikva', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'isr-petach-tikva-rot', name: 'Petach Tikva Rot', short: 'PTR', city: 'Petach Tikva', colors: { primary: '#D71920', secondary: '#000000' } },
  { id: 'isr-raanana', name: 'Raanana', short: 'RAA', city: 'Raanana', colors: { primary: '#FFD200', secondary: '#003399' } },
  { id: 'isr-ramat-gan-blau-weiss', name: 'Ramat Gan Blau-Weiß', short: 'RGB', city: 'Ramat Gan', colors: { primary: '#003399', secondary: '#FFFFFF' } },
  { id: 'isr-ramat-gan-rot', name: 'Ramat Gan Rot', short: 'RGR', city: 'Ramat Gan', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-ramat-hascharon', name: 'Ramat HaScharon', short: 'RHS', city: 'Ramat HaScharon', colors: { primary: '#D71920', secondary: '#FFD200' } },
  { id: 'isr-reineh', name: 'Reineh', short: 'REI', city: 'Reineh', colors: { primary: '#00843D', secondary: '#FFFFFF' } },
  { id: 'isr-rischon-lezion', name: 'Rischon LeZion', short: 'RLZ', city: 'Rischon LeZion', colors: { primary: '#FFD200', secondary: '#003399' } },
  { id: 'isr-sachnin', name: 'Sachnin', short: 'SAC', city: 'Sachnin', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-taibe', name: 'Taibe', short: 'TAI', city: 'Taibe', colors: { primary: '#D71920', secondary: '#00843D' } },
  { id: 'isr-tel-aviv-gelb-blau', name: 'Tel Aviv Gelb-Blau', short: 'TGB', city: 'Tel Aviv', colors: { primary: '#FFD200', secondary: '#003399' } },
  { id: 'isr-tel-aviv-gelb-schwarz', name: 'Tel Aviv Gelb-Schwarz', short: 'TGS', city: 'Tel Aviv', colors: { primary: '#FFD200', secondary: '#000000' } },
  { id: 'isr-tel-aviv-hatikva', name: 'Tel Aviv-Hatikva', short: 'THA', city: 'Tel Aviv', colors: { primary: '#F26522', secondary: '#FFFFFF' } },
  { id: 'isr-tel-aviv-rot', name: 'Tel Aviv Rot', short: 'TAR', city: 'Tel Aviv', colors: { primary: '#D71920', secondary: '#FFFFFF' } },
  { id: 'isr-tel-aviv-shimshon', name: 'Tel Aviv-Shimshon', short: 'TSH', city: 'Tel Aviv', colors: { primary: '#D71920', secondary: '#FFD200' } },
  { id: 'isr-tiberias', name: 'Tiberias', short: 'TIB', city: 'Tiberias', colors: { primary: '#003399', secondary: '#FFFFFF' } },
];
