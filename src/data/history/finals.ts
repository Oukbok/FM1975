// =============================================================================
// HISTORIE VOR SPIELBEGINN: Pokalendspiele, Europapokal-Endspiele, Torschützenkönige
// -----------------------------------------------------------------------------
// Vereine als Spiel-IDs (deutsche: Stadt-Logik wie data/generate.ts; ausländische:
// eu_-IDs aus data/europe.ts, sonst `x_`-Einträge in HIST_FOREIGN mit Stadtnamen).
// Torschützenkönige: nur Verein und Torzahl – keine Namen echter Spieler.
// Zuordnung der deutschen Vereine: Meidericher SV/MSV Duisburg → dui, TSV 1860 → s_muc,
// Alemannia Aachen → n_aac, VfL Bochum → boc, Kickers Offenbach → off, FC Bayern → muc,
// Borussia Dortmund → n_dor, Hamburger SV → ham, 1. FC Köln → kln, FC Schalke 04 → gel,
// 1. FC Kaiserslautern → kai, Gladbach → mgl, Eintracht Frankfurt → fra,
// Rot-Weiß Oberhausen → h_rwo, 1. FC Magdeburg → ddr-magdeburg.
// Quellen: en.wikipedia.org „List of DFB-Pokal finals“, „List of European Cup and UEFA
// Champions League finals“, „List of UEFA Cup Winners' Cup finals“, „List of UEFA Cup
// and Europa League finals“, „Inter-Cities Fairs Cup“ (Messepokal 1963/64–1970/71,
// Vorläufer des UEFA-Pokals = im Spiel „Europa-Pokal“), „List of Bundesliga top scorers
// by season“.
// =============================================================================

export interface HistFinal {
  winner: string;
  runnerUp: string;
  /** Ergebnis aus Sicht des Siegers (Hin-/Rückspiel: Gesamtergebnis). */
  score: string;
  venue?: string;
  note?: string;
}

/** Ausländische Vereine ohne Eintrag in data/europe.ts. */
export const HIST_FOREIGN: Record<string, { name: string; country: string }> = {
  x_mun: { name: 'Manchester Rot', country: 'England' },
  x_mci: { name: 'Manchester Blau', country: 'England' },
  x_che: { name: 'London West', country: 'England' },
  x_ars: { name: 'London Rot', country: 'England' },
  x_wol: { name: 'Wolverhampton', country: 'England' },
  x_new: { name: 'Newcastle', country: 'England' },
  x_par: { name: 'Belgrad Schwarz-Weiß', country: 'Jugoslawien' },
  x_mtk: { name: 'Budapest Blau-Weiß', country: 'Ungarn' },
  x_val: { name: 'Valencia', country: 'Spanien' },
};

/** DFB-Pokal (im Spiel: Landespokal) – Endspiele. */
export const HIST_DFB_POKAL: Record<string, HistFinal> = {
  '1963/64': { winner: 's_muc', runnerUp: 'fra', score: '2:0', venue: 'Stuttgart' },
  '1964/65': { winner: 'n_dor', runnerUp: 'n_aac', score: '2:0', venue: 'Hannover', note: 'Finalist aus der 2. Liga (Regionalliga)' },
  '1965/66': { winner: 'muc', runnerUp: 'dui', score: '4:2', venue: 'Frankfurt' },
  '1966/67': { winner: 'muc', runnerUp: 'ham', score: '4:0', venue: 'Stuttgart' },
  '1967/68': { winner: 'kln', runnerUp: 'boc', score: '4:1', venue: 'Ludwigshafen', note: 'Finalist aus der 2. Liga (Regionalliga)' },
  '1968/69': { winner: 'muc', runnerUp: 'gel', score: '2:1', venue: 'Frankfurt' },
  '1969/70': { winner: 'off', runnerUp: 'kln', score: '2:1', venue: 'Hannover', note: 'Sieger aus der 2. Liga (Regionalliga)' },
  '1970/71': { winner: 'muc', runnerUp: 'kln', score: '2:1 n. V.', venue: 'Stuttgart' },
  '1971/72': { winner: 'gel', runnerUp: 'kai', score: '5:0', venue: 'Hannover' },
  '1972/73': { winner: 'mgl', runnerUp: 'kln', score: '2:1 n. V.', venue: 'Düsseldorf' },
  '1973/74': { winner: 'fra', runnerUp: 'ham', score: '3:1 n. V.', venue: 'Düsseldorf' },
  '1974/75': { winner: 'fra', runnerUp: 'dui', score: '1:0', venue: 'Hannover' },
};

/** Europapokal-Endspiele: ec = Landesmeister, cwc = Pokalsieger, uefa = Messe-/UEFA-Pokal. */
export const HIST_EURO_FINALS: Record<string, Partial<Record<'ec' | 'cwc' | 'uefa', HistFinal>>> = {
  '1963/64': {
    ec: { winner: 'eu_int', runnerUp: 'eu_rma', score: '3:1', venue: 'Wien' },
    cwc: { winner: 'eu_spo', runnerUp: 'x_mtk', score: '3:3, 1:0 im Wiederholungsspiel', venue: 'Brüssel/Antwerpen' },
    uefa: { winner: 'eu_zar', runnerUp: 'x_val', score: '2:1', note: 'Messepokal' },
  },
  '1964/65': {
    ec: { winner: 'eu_int', runnerUp: 'eu_ben', score: '1:0', venue: 'Mailand' },
    cwc: { winner: 'eu_whu', runnerUp: 's_muc', score: '2:0', venue: 'London' },
    uefa: { winner: 'eu_fer', runnerUp: 'eu_juv', score: '1:0', note: 'Messepokal' },
  },
  '1965/66': {
    ec: { winner: 'eu_rma', runnerUp: 'x_par', score: '2:1', venue: 'Brüssel' },
    cwc: { winner: 'n_dor', runnerUp: 'eu_liv', score: '2:1 n. V.', venue: 'Glasgow' },
    uefa: { winner: 'eu_bar', runnerUp: 'eu_zar', score: '4:3 (0:1, 4:2 n. V.)', note: 'Messepokal' },
  },
  '1966/67': {
    ec: { winner: 'eu_cel', runnerUp: 'eu_int', score: '2:1', venue: 'Lissabon' },
    cwc: { winner: 'muc', runnerUp: 'eu_ran', score: '1:0 n. V.', venue: 'Nürnberg' },
    uefa: { winner: 'eu_diz', runnerUp: 'eu_lee', score: '2:0', note: 'Messepokal' },
  },
  '1967/68': {
    ec: { winner: 'x_mun', runnerUp: 'eu_ben', score: '4:1 n. V.', venue: 'London' },
    cwc: { winner: 'eu_acm', runnerUp: 'ham', score: '2:0', venue: 'Rotterdam' },
    uefa: { winner: 'eu_lee', runnerUp: 'eu_fer', score: '1:0', note: 'Messepokal' },
  },
  '1968/69': {
    ec: { winner: 'eu_acm', runnerUp: 'eu_ajx', score: '4:1', venue: 'Madrid' },
    cwc: { winner: 'eu_slo', runnerUp: 'eu_bar', score: '3:2', venue: 'Basel' },
    uefa: { winner: 'x_new', runnerUp: 'eu_upe', score: '6:2', note: 'Messepokal' },
  },
  '1969/70': {
    ec: { winner: 'eu_fey', runnerUp: 'eu_cel', score: '2:1 n. V.', venue: 'Mailand' },
    cwc: { winner: 'x_mci', runnerUp: 'eu_gor', score: '2:1', venue: 'Wien' },
    uefa: { winner: 'x_ars', runnerUp: 'eu_and', score: '4:3', note: 'Messepokal' },
  },
  '1970/71': {
    ec: { winner: 'eu_ajx', runnerUp: 'eu_pan', score: '2:0', venue: 'London' },
    cwc: { winner: 'x_che', runnerUp: 'eu_rma', score: '1:1, 2:1 im Wiederholungsspiel', venue: 'Piräus' },
    uefa: { winner: 'eu_lee', runnerUp: 'eu_juv', score: '3:3 (Auswärtstore)', note: 'Messepokal' },
  },
  '1971/72': {
    ec: { winner: 'eu_ajx', runnerUp: 'eu_int', score: '2:0', venue: 'Rotterdam' },
    cwc: { winner: 'eu_ran', runnerUp: 'eu_dmo', score: '3:2', venue: 'Barcelona' },
    uefa: { winner: 'eu_tot', runnerUp: 'x_wol', score: '3:2' },
  },
  '1972/73': {
    ec: { winner: 'eu_ajx', runnerUp: 'eu_juv', score: '1:0', venue: 'Belgrad' },
    cwc: { winner: 'eu_acm', runnerUp: 'eu_lee', score: '1:0', venue: 'Saloniki' },
    uefa: { winner: 'eu_liv', runnerUp: 'mgl', score: '3:2' },
  },
  '1973/74': {
    ec: { winner: 'muc', runnerUp: 'eu_atm', score: '1:1, 4:0 im Wiederholungsspiel', venue: 'Brüssel' },
    cwc: { winner: 'ddr-magdeburg', runnerUp: 'eu_acm', score: '2:0', venue: 'Rotterdam' },
    uefa: { winner: 'eu_fey', runnerUp: 'eu_tot', score: '4:2' },
  },
  '1974/75': {
    ec: { winner: 'muc', runnerUp: 'eu_lee', score: '2:0', venue: 'Paris' },
    cwc: { winner: 'eu_kyi', runnerUp: 'eu_fer', score: '3:0', venue: 'Basel' },
    uefa: { winner: 'mgl', runnerUp: 'eu_twe', score: '5:1' },
  },
};

/** Torschützenkönig der Bundesliga: Verein(e) und Tore (geteilt = mehrere Vereine). */
export const HIST_TOP_SCORERS: Record<string, { clubs: string[]; goals: number }> = {
  '1963/64': { clubs: ['ham'], goals: 30 },
  '1964/65': { clubs: ['s_muc'], goals: 24 },
  '1965/66': { clubs: ['n_dor'], goals: 31 },
  '1966/67': { clubs: ['n_dor', 'muc'], goals: 28 },
  '1967/68': { clubs: ['kln'], goals: 27 },
  '1968/69': { clubs: ['muc'], goals: 30 },
  '1969/70': { clubs: ['muc'], goals: 38 },
  '1970/71': { clubs: ['h_rwo'], goals: 24 },
  '1971/72': { clubs: ['muc'], goals: 40 },
  '1972/73': { clubs: ['muc'], goals: 36 },
  '1973/74': { clubs: ['mgl', 'muc'], goals: 30 },
  '1974/75': { clubs: ['mgl'], goals: 27 },
};
