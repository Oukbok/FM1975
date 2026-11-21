// =============================================================================
// WÄHRUNGS-TEST (ohne UI) — npm run test:currency
// -----------------------------------------------------------------------------
// 1) Jedes spielbare Heimatland × jedes Startjahr 1975–2027: Währung vorhanden,
//    Kurs endlich und > 0, Epochen/Stützjahre aufsteigend, keine Sprünge.
// 2) Stichjahre 1975/1990/1998/2002/2010/2026 (jeweils 1. Juli): Code + Einheit
//    gegen eine unabhängige Soll-Tabelle, Kurs gegen Richtwerte (± 20 %).
// 3) Umstellungstage taggenau (Vortag alte, Stichtag neue Währung).
// 4) Umstellungsverhältnisse: alter Kurs × Verhältnis ≈ neuer Kurs; Euro-Beitritte
//    gegen die unwiderruflichen Umrechnungskurse.
// 5) Aufgelöste Staaten: Währung des Nachfolgestaats nach Stadt des Vereins.
// 6) Feste Texte (Berater, Briefing, Tipps, i-Hilfe, Wiki) für England 1992 und
//    Italien 1985: keine „DM“/„€“-Beträge; Deutschland unverändert.
// =============================================================================
import { CURRENCIES } from '../src/data/currencies';
import { homeCurrencyKey } from '../src/data/currencySuccessors';
import { BUDGET_ERAS } from '../src/data/budgetEras';
import { INFO_TEXTS } from '../src/data/infoTexts';
import { WIKI_ARTICLES } from '../src/data/wiki';
import { COUNTRY_BY_CC } from '../src/data/world/countries';
import { currencyAt, DM_PER_EUR, formatMoney, formatMoneyShort, setCurrencyDate, setHomeCurrency } from '../src/engine/economy';
import { localCurrencyText, localMoneyText } from '../src/engine/moneyText';
import { composeBriefing, localEraTips } from '../src/game/seasonBriefing';
import { playableCountries } from '../src/game/worldCompose';
import { setDisplayYear, fmtDM, fmtWage } from '../src/ui/format';

let fails = 0, checks = 0;
const ok = (cond: boolean, msg: string) => { checks++; if (!cond) { fails++; console.log(`  FEHLER: ${msg}`); } };
const at = (cc: string, iso: string) => currencyAt(Number(iso.slice(0, 4)), iso, cc);
const dm = (cc: string, iso: string) => 1 / at(cc, iso).perDM;

// ---------------------------------------------------------------------------
// 1) Vollständigkeit je Land und Startjahr
// ---------------------------------------------------------------------------
console.log('1) Jedes spielbare Land × Startjahr 1975–2027');
const seen = new Set<string>();
for (let y = 1975; y <= 2027; y++) {
  for (const cc of playableCountries(y)) {
    seen.add(cc);
    ok(!!CURRENCIES[cc], `${cc} ${y}: keine Währungstabelle`);
    if (!CURRENCIES[cc]) continue;
    const c = at(cc, `${y}-07-01`);
    ok(Number.isFinite(c.perDM) && c.perDM > 0, `${cc} ${y}: Kurs ${c.perDM}`);
    ok(c.era.from <= `${y}-07-01`, `${cc} ${y}: Währung ${c.code} gilt erst ab ${c.era.from}`);
    ok(/^\S.*\s\S+$/.test(formatMoney(1_000_000, y, false, cc)), `${cc} ${y}: Format „${formatMoney(1_000_000, y, false, cc)}“`);
  }
}
console.log(`   ${seen.size} Länder: ${[...seen].join(' ')}`);
for (const [key, eras] of Object.entries(CURRENCIES)) {
  for (let i = 0; i < eras.length; i++) {
    const e = eras[i];
    ok(i === 0 || eras[i - 1].from < e.from, `${key}: Epochen nicht aufsteigend bei ${e.code} ${e.from}`);
    ok(/^\d{4}-\d{2}-\d{2}$/.test(e.from) && !Number.isNaN(Date.parse(e.from)), `${key}: Stichtag „${e.from}“`);
    ok(e.rates.length > 0 && e.rates.every(([, r]) => r > 0 && Number.isFinite(r)), `${key} ${e.code}: Kurse`);
    for (let k = 1; k < e.rates.length; k++) {
      ok(e.rates[k - 1][0] < e.rates[k][0], `${key} ${e.code}: Stützjahre nicht aufsteigend bei ${e.rates[k][0]}`);
      // Sprung je Jahr: stabile Währungen höchstens × 1,6; Hochinflation (Verlust) höchstens × 30.000 (Jugoslawien 1993).
      const years = e.rates[k][0] - e.rates[k - 1][0], f = e.rates[k][1] / e.rates[k - 1][1];
      ok(Math.pow(f, 1 / years) < 1.6 && Math.pow(f, 1 / years) > 1 / 100000, `${key} ${e.code}: Sprung ${e.rates[k - 1][0]}→${e.rates[k][0]} × ${f.toPrecision(3)}`);
    }
    if (e.code === 'EUR') ok(e.rates.length === 1 && Math.abs(e.rates[0][1] - DM_PER_EUR) < 1e-9, `${key}: Euro ≠ 1,95583 DM`);
  }
}

// ---------------------------------------------------------------------------
// 2) Stichjahre: Code/Einheit + Kurs-Richtwerte
// ---------------------------------------------------------------------------
console.log('2) Stichjahre 1975/1990/1998/2002/2010/2026');
const YEARS = [1975, 1990, 1998, 2002, 2010, 2026];
const six = (a: string, b = a, c = b, d = c, e = d, f = e) => [a, b, c, d, e, f];
const euro02 = (code: string) => six(code, code, code, 'EUR');
/** Soll-Codes am 1. Juli der Stichjahre (unabhängig von der Datentabelle gepflegt). */
const CODES: Record<string, string[]> = {
  ger: euro02('DEM'), gdr: ['DDM', 'DEM', 'DEM', 'EUR', 'EUR', 'EUR'],
  eng: six('GBP'), sco: six('GBP'), wal: six('GBP'), nir: six('GBP'),
  irl: euro02('IEP'), ita: euro02('ITL'), esp: euro02('ESP'), por: euro02('PTE'), fra: euro02('FRF'), ned: euro02('NLG'),
  bel: euro02('BEF'), lux: euro02('LUF'), aut: euro02('ATS'), fin: euro02('FIM'), gre: euro02('GRD'),
  cyp: ['CYP', 'CYP', 'CYP', 'CYP', 'EUR', 'EUR'], mlt: ['MTL', 'MTL', 'MTL', 'MTL', 'EUR', 'EUR'],
  sui: six('CHF'), swe: six('SEK'), nor: six('NOK'), den: six('DKK'), isl: six('ISK'), hun: six('HUF'), alb: six('ALL'), isr: six('ILS'),
  tur: ['TRL', 'TRL', 'TRL', 'TRL', 'TRY', 'TRY'], pol: ['PLZ', 'PLZ', 'PLN', 'PLN', 'PLN', 'PLN'],
  tch: ['CSK', 'CSK', 'CZK', 'CZK', 'CZK', 'CZK'], cze: six('CZK'), svk: ['SKK', 'SKK', 'SKK', 'SKK', 'EUR', 'EUR'],
  rou: ['ROL', 'ROL', 'ROL', 'ROL', 'RON', 'RON'], bul: ['BGL', 'BGL', 'BGL', 'BGN', 'BGN', 'EUR'],
  urs: ['SUR', 'SUR', 'RUB', 'RUB', 'RUB', 'RUB'], rus: six('RUB'), ukr: six('UAH'),
  yug: ['YUD', 'YUN', 'YUM', 'YUM', 'YUM', 'YUM'], srb: six('YUM'), cro: ['HRK', 'HRK', 'HRK', 'HRK', 'HRK', 'EUR'],
  // Nachfolgestaaten nach Stadt (data/currencySuccessors.ts)
  'tch:svk': ['CSK', 'CSK', 'SKK', 'SKK', 'EUR', 'EUR'], 'urs:ukr': ['SUR', 'SUR', 'UAH', 'UAH', 'UAH', 'UAH'],
  'yug:cro': ['YUD', 'YUN', 'HRK', 'HRK', 'HRK', 'EUR'], 'yug:svn': ['YUD', 'YUN', 'SIT', 'SIT', 'EUR', 'EUR'],
  'yug:bih': ['YUD', 'YUN', 'BAM', 'BAM', 'BAM', 'BAM'], 'yug:mkd': ['YUD', 'YUN', 'MKD', 'MKD', 'MKD', 'MKD'],
  'yug:mne': ['YUD', 'YUN', 'YUM', 'EUR', 'EUR', 'EUR'], 'yug:kos': ['YUD', 'YUN', 'YUM', 'EUR', 'EUR', 'EUR'],
  'urs:ltu': ['SUR', 'SUR', 'LTL', 'LTL', 'LTL', 'EUR'], 'urs:lva': ['SUR', 'SUR', 'LVL', 'LVL', 'LVL', 'EUR'],
  'urs:est': ['SUR', 'SUR', 'EEK', 'EEK', 'EEK', 'EUR'], 'urs:blr': ['SUR', 'SUR', 'BYB', 'BYR', 'BYR', 'BYN'],
  'urs:geo': ['SUR', 'SUR', 'GEL', 'GEL', 'GEL', 'GEL'], 'urs:arm': ['SUR', 'SUR', 'AMD', 'AMD', 'AMD', 'AMD'],
  'urs:aze': ['SUR', 'SUR', 'AZM', 'AZM', 'AZN', 'AZN'], 'urs:kaz': ['SUR', 'SUR', 'KZT', 'KZT', 'KZT', 'KZT'],
  'urs:uzb': ['SUR', 'SUR', 'UZS', 'UZS', 'UZS', 'UZS'], 'urs:tjk': ['SUR', 'SUR', 'TJR', 'TJS', 'TJS', 'TJS'],
};
const UNITS: Record<string, string> = { DEM: 'DM', DDM: 'M', EUR: '€', GBP: '£', ITL: 'Lire', ESP: 'Pta', FRF: 'FF', CHF: 'sfr', ATS: 'öS', NLG: 'hfl', TRL: 'TL', TRY: 'TL', PLN: 'Zł', CZK: 'Kč', HUF: 'Ft', SEK: 'skr' };
for (const cc of seen) ok(!!CODES[cc], `${cc}: keine Soll-Zeile im Test`);
for (const [cc, codes] of Object.entries(CODES)) {
  const def = COUNTRY_BY_CC[cc];
  YEARS.forEach((y, i) => {
    if (def && y < def.from) return; // Land gibt es noch nicht (Nachfolgestaaten, Israel im Spiel ab 1992)
    const c = at(cc, `${y}-07-01`);
    ok(c.code === codes[i], `${cc} ${y}: ${c.code} (${c.name}) statt ${codes[i]}`);
    if (UNITS[c.code]) ok(c.unit === UNITS[c.code], `${cc} ${y}: Einheit „${c.unit}“ statt „${UNITS[c.code]}“`);
  });
}
/** Richtwerte DM je Einheit (Jahresmittel, Bundesbank bis 1998 / EZB × 1,95583) – eigene, grobe Soll-Werte. */
const E = DM_PER_EUR;
const RATES: Record<string, (number | null)[]> = {
  eng: [5.45, 2.88, 2.91, 1.59 * E, 1.166 * E, 1.16 * E],
  ita: [0.00377, 0.00135, 0.00101, null, null, null], esp: [0.0429, 0.0159, 0.0118, null, null, null],
  fra: [0.574, 0.297, 0.298, null, null, null], ned: [0.973, 0.887, 0.887, null, null, null],
  bel: [0.0669, 0.0484, 0.0485, null, null, null], aut: [0.141, 0.142, 0.142, null, null, null],
  por: [0.096, 0.0114, 0.00977, null, null, null], gre: [0.076, 0.0102, 0.0060, null, null, null],
  fin: [0.669, 0.423, 0.329, null, null, null], irl: [5.45, 2.67, 2.50, null, null, null],
  sui: [0.953, 1.165, 1.214, 0.682 * E, 0.725 * E, 1.07 * E], swe: [0.593, 0.273, 0.221, 0.1092 * E, 0.1048 * E, 0.09 * E],
  nor: [0.471, 0.258, 0.233, 0.133 * E, 0.125 * E, 0.086 * E], den: [0.428, 0.261, 0.263, 0.1346 * E, 0.1343 * E, 0.134 * E],
  hun: [null, null, 0.0082, 0.00412 * E, 0.00364 * E, 0.0025 * E], pol: [null, null, 0.504, 0.259 * E, 0.250 * E, 0.235 * E],
  cze: [null, null, 0.0545, 0.0325 * E, 0.0395 * E, 0.040 * E], rus: [null, null, 0.18, 0.0337 * E, 0.0248 * E, 0.0105 * E],
  tur: [0.171, 0.00062, 0.0000068, 0.00000070 * E, 0.50 * E, null], ger: [1, 1, 1, E, E, E], gdr: [1, 1, 1, E, E, E],
  bul: [null, null, 0.001, 1, 1, E], cro: [null, null, 0.277, 0.135 * E, 0.137 * E, E], svk: [null, null, 0.0499, 0.0234 * E, E, E],
  isl: [0.0167, 0.0277, 0.0247, 0.0116 * E, 0.0062 * E, 0.0070 * E], isr: [null, null, 0.463, 0.223 * E, 0.202 * E, 0.255 * E],
};
for (const [cc, vals] of Object.entries(RATES)) YEARS.forEach((y, i) => {
  const want = vals[i];
  if (want == null) return;
  const got = dm(cc, `${y}-07-01`);
  ok(Math.abs(got / want - 1) <= 0.2, `${cc} ${y}: ${got.toPrecision(4)} DM je Einheit, Richtwert ${want.toPrecision(4)}`);
});

// ---------------------------------------------------------------------------
// 3) Umstellungstage
// ---------------------------------------------------------------------------
console.log('3) Umstellungstage');
const SWITCH: [string, string, string, string][] = [
  ['ger', '2002-01-01', 'DEM', 'EUR'], ['gdr', '1990-07-01', 'DDM', 'DEM'], ['gdr', '2002-01-01', 'DEM', 'EUR'],
  ['ita', '2002-01-01', 'ITL', 'EUR'], ['esp', '2002-01-01', 'ESP', 'EUR'], ['por', '2002-01-01', 'PTE', 'EUR'], ['fra', '2002-01-01', 'FRF', 'EUR'],
  ['ned', '2002-01-01', 'NLG', 'EUR'], ['bel', '2002-01-01', 'BEF', 'EUR'], ['lux', '2002-01-01', 'LUF', 'EUR'], ['aut', '2002-01-01', 'ATS', 'EUR'],
  ['fin', '2002-01-01', 'FIM', 'EUR'], ['irl', '2002-01-01', 'IEP', 'EUR'], ['gre', '2002-01-01', 'GRD', 'EUR'],
  ['yug:svn', '2007-01-01', 'SIT', 'EUR'], ['cyp', '2008-01-01', 'CYP', 'EUR'], ['mlt', '2008-01-01', 'MTL', 'EUR'], ['svk', '2009-01-01', 'SKK', 'EUR'],
  ['urs:est', '2011-01-01', 'EEK', 'EUR'], ['urs:lva', '2014-01-01', 'LVL', 'EUR'], ['urs:ltu', '2015-01-01', 'LTL', 'EUR'],
  ['cro', '2023-01-01', 'HRK', 'EUR'], ['bul', '2026-01-01', 'BGN', 'EUR'],
  ['tur', '2005-01-01', 'TRL', 'TRY'], ['pol', '1995-01-01', 'PLZ', 'PLN'], ['rou', '2005-07-01', 'ROL', 'RON'], ['bul', '1999-07-05', 'BGL', 'BGN'],
  ['isl', '1981-01-01', 'ISK', 'ISK'], ['rus', '1998-01-01', 'RUR', 'RUB'], ['ukr', '1996-09-02', 'UAK', 'UAH'], ['cro', '1994-05-30', 'HRD', 'HRK'],
  ['yug', '1990-01-01', 'YUD', 'YUN'], ['srb', '1994-01-24', 'YUR', 'YUM'], ['tch', '1993-02-08', 'CSK', 'CZK'], ['tch:svk', '1993-02-08', 'CSK', 'SKK'],
  ['urs', '1992-01-01', 'SUR', 'RUR'], ['urs:ukr', '1992-11-12', 'SUR', 'UAK'], ['yug:cro', '1991-12-23', 'YUN', 'HRD'],
  ['yug:mne', '1999-11-02', 'YUM', 'DEM'], ['yug:mne', '2002-01-01', 'DEM', 'EUR'], ['yug:bih', '1998-06-22', 'BAN', 'BAM'],
];
const dayBefore = (iso: string) => new Date(Date.parse(iso + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10);
for (const [cc, day, before, after] of SWITCH) {
  ok(at(cc, dayBefore(day)).code === before, `${cc} ${dayBefore(day)}: ${at(cc, dayBefore(day)).code} statt ${before}`);
  ok(at(cc, day).code === after, `${cc} ${day}: ${at(cc, day).code} statt ${after}`);
}
// Taggenau über das Spieldatum (setCurrencyDate), wie es die Oberfläche nutzt.
setHomeCurrency('ita'); setDisplayYear(2001); setCurrencyDate('2001-12-31');
ok(fmtDM(1_000_000).endsWith('Lire'), `Italien 31.12.2001: ${fmtDM(1_000_000)}`);
setDisplayYear(2002); setCurrencyDate('2002-01-01');
ok(fmtDM(1_000_000) === '511 Tsd. €', `Italien 1.1.2002: ${fmtDM(1_000_000)}`);
setHomeCurrency('gdr'); setDisplayYear(1990); setCurrencyDate('1990-06-30');
ok(fmtDM(5000) === '5 Tsd. M' && fmtWage(100, { unit: false }).endsWith(' M'), `DDR 30.6.1990: ${fmtDM(5000)} / ${fmtWage(100, { unit: false })}`);
setCurrencyDate('1990-07-01');
ok(fmtDM(5000) === '5 Tsd. DM', `DDR 1.7.1990: ${fmtDM(5000)}`);

// ---------------------------------------------------------------------------
// 4) Umstellungsverhältnisse
// ---------------------------------------------------------------------------
console.log('4) Umstellungsverhältnisse');
/** [Land, Stichtag, alte Einheiten je neue Einheit, Toleranz]. Euro: amtlicher Kurs je Euro. */
const RATIO: [string, string, number, number][] = [
  ['ita', '2002-01-01', 1936.27, 0.02], ['esp', '2002-01-01', 166.386, 0.02], ['por', '2002-01-01', 200.482, 0.02], ['fra', '2002-01-01', 6.55957, 0.02],
  ['ned', '2002-01-01', 2.20371, 0.02], ['bel', '2002-01-01', 40.3399, 0.02], ['lux', '2002-01-01', 40.3399, 0.02], ['aut', '2002-01-01', 13.7603, 0.02],
  ['fin', '2002-01-01', 5.94573, 0.02], ['irl', '2002-01-01', 0.787564, 0.02], ['gre', '2002-01-01', 340.75, 0.02], ['ger', '2002-01-01', 1.95583, 0.001],
  ['yug:svn', '2007-01-01', 239.64, 0.02], ['cyp', '2008-01-01', 0.585274, 0.02], ['mlt', '2008-01-01', 0.4293, 0.02], ['svk', '2009-01-01', 30.126, 0.04],
  ['urs:est', '2011-01-01', 15.6466, 0.001], ['urs:lva', '2014-01-01', 0.702804, 0.02], ['urs:ltu', '2015-01-01', 3.4528, 0.02],
  ['cro', '2023-01-01', 7.5345, 0.02], ['bul', '2026-01-01', 1.95583, 0.001],
  // Streichung von Nullen (Jahresmittel beiderseits des Stichtags → grobe Toleranz)
  ['tur', '2005-01-01', 1e6, 0.5], ['pol', '1995-01-01', 1e4, 0.5], ['rou', '2005-07-01', 1e4, 0.5], ['bul', '1999-07-05', 1e3, 0.1],
  ['isl', '1981-01-01', 100, 0.5], ['rus', '1998-01-01', 1e3, 0.5], ['yug', '1990-01-01', 1e4, 0.9], ['gdr', '1990-07-01', 1, 0.001],
];
for (const [cc, day, perNew, tol] of RATIO) {
  const oldDm = dm(cc, dayBefore(day)), newDm = dm(cc, day);
  const got = newDm / oldDm;
  ok(Math.abs(got / perNew - 1) <= tol, `${cc} ${day}: ${got.toPrecision(5)} alte je neue Einheit, amtlich ${perNew}`);
}

// ---------------------------------------------------------------------------
// 5) Nachfolgestaaten nach Stadt
// ---------------------------------------------------------------------------
console.log('5) Nachfolgestaaten');
const CITY: [string, string, string][] = [
  ['tch', 'Prag', 'tch'], ['tch', 'Bratislava', 'tch:svk'], ['tch', 'Košice', 'tch:svk'], ['urs', 'Moskau', 'urs'], ['urs', 'Kiew', 'urs:ukr'],
  ['urs', 'Tiflis', 'urs:geo'], ['urs', 'Wilna', 'urs:ltu'], ['urs', 'Minsk', 'urs:blr'], ['yug', 'Belgrad', 'yug'], ['yug', 'Zagreb', 'yug:cro'],
  ['yug', 'Ljubljana', 'yug:svn'], ['yug', 'Sarajevo', 'yug:bih'], ['yug', 'Titograd', 'yug:mne'], ['eng', 'London', 'eng'], ['ger', 'Kiew', 'ger'],
];
for (const [cc, city, key] of CITY) {
  ok(homeCurrencyKey(cc, city) === key, `${cc}/${city}: ${homeCurrencyKey(cc, city)} statt ${key}`);
  ok(!!CURRENCIES[key], `${key}: keine Tabelle`);
}
setHomeCurrency('tch', 'Bratislava'); setDisplayYear(2010); setCurrencyDate('2010-03-01');
ok(fmtDM(1_000_000).endsWith('€'), `Bratislava 2010: ${fmtDM(1_000_000)}`);
setHomeCurrency('tch', 'Prag');
ok(fmtDM(1_000_000).endsWith('Kč'), `Prag 2010: ${fmtDM(1_000_000)}`);
setHomeCurrency('unbekannt');
ok(fmtDM(1_000_000).endsWith('€'), 'unbekanntes Land → Deutschland');

// ---------------------------------------------------------------------------
// 6) Feste Texte in der Heimatwährung
// ---------------------------------------------------------------------------
console.log('6) Feste Texte: England 1992, Italien 1985, Deutschland unverändert');
// Zeitgeschichte (Politik/Alltag/Kultur) bleibt, wie sie war: deutsche Nachrichten nennen deutsche Beträge.
// Wiki: nur Beträge zählen – der Artikel zur Währung nennt D-Mark und Euro beim Namen.
const BAD_AMOUNT = /(\d|Million(en)?|Milliarden?)[ \u00a0]?(Mio\.|Tsd\.|Mrd\.)?[ \u00a0]?(DM|€|EUR)(?![\wäöü])/;
const BAD = /(\d|Million(en)?|Milliarden?)[ \u00a0]?(Mio\.|Tsd\.|Mrd\.)?[ \u00a0]?(DM|€|EUR)(?![\wäöü])|\bD-Mark\b|\bEuro\b/;
const stripCode = (t: string) => t.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`(\s?DM[^\s,.;)]*)?/g, ''); // Formeln = Rechenwährung
function textsFor(year: number): [string, string | null][] {
  const out: [string, string | null][] = [];
  for (const e of BUDGET_ERAS) if (year >= e.from && year <= e.to) e.lines.forEach((l, i) => out.push([`Berater ${e.from}#${i}`, localCurrencyText(l, year)]));
  const b = composeBriefing(`${year}/${String(year + 1).slice(2)}`, { first: true, tier: 1 });
  for (const it of b.football) { out.push([`Briefing ${it.title}`, it.text]); if (it.inGame) out.push([`Briefing ${it.title} (im Spiel)`, it.inGame]); }
  for (const g of b.differences) for (const d of g.items) out.push([`Unterschied ${d.title}`, `${d.then} ${d.today}`]);
  for (const c of b.inGame) out.push([`Neu im Spiel ${c.title}`, `${c.title} ${c.text}`]);
  for (const t of localEraTips(year)) out.push([`Tipp ${t.title}`, `${t.text} ${t.inGame}`]);
  for (const [k, v] of Object.entries(INFO_TEXTS)) out.push([`i-Hilfe ${k}`, localMoneyText((v as { text: string }).text, year)]);
  for (const a of WIKI_ARTICLES) out.push([`Wiki ${a.id}`, stripCode(localMoneyText(a.body, year, { dmYear: 1975 }))]);
  return out;
}
for (const [cc, year, unit] of [['eng', 1992, '£'], ['ita', 1985, 'Lire'], ['tur', 2010, 'TL'], ['sui', 2026, 'sfr']] as const) {
  setHomeCurrency(cc); setDisplayYear(year); setCurrencyDate(`${year}-12-10`);
  let n = 0, conv = 0;
  for (const [where, t] of textsFor(year)) {
    if (t == null) continue;
    n++;
    if (t.includes(` ${unit}`)) conv++;
    // Wiki: Jahresangaben ab der Euro-Einführung des eigenen Landes dürfen „€“ zeigen (Italien: „2024 ≈ 15 €“).
    const wiki = where.startsWith('Wiki');
    const m = (wiki ? BAD_AMOUNT : BAD).exec(cc === 'ita' && wiki ? t.replace(/\d[\d.,–]*[ \u00a0]?(Mio\.|Tsd\.|Mrd\.)?[ \u00a0]?€/g, '') : t);
    ok(!m, `${cc} ${year} · ${where}: „${m ? t.slice(Math.max(0, m.index - 50), m.index + 30).replace(/\n/g, ' ') : ''}“`);
  }
  ok(conv > 20, `${cc} ${year}: nur ${conv} Texte mit ${unit}`);
  console.log(`   ${cc} ${year}: ${n} Texte geprüft, ${conv} mit Beträgen in ${unit}`);
}
setHomeCurrency('ger'); setDisplayYear(1985); setCurrencyDate('1985-12-10');
for (const a of WIKI_ARTICLES) ok(localMoneyText(a.body, 1985, { dmYear: 1975 }) === a.body, `Deutschland: Wiki ${a.id} verändert`);
for (const e of BUDGET_ERAS) for (const l of e.lines) ok(localCurrencyText(l, e.from) === l, `Deutschland: Berater ${e.from} verändert`);
ok(formatMoneyShort(2_500_000, 1985) === '2,50 Mio. DM', `Deutschland 1985: ${formatMoneyShort(2_500_000, 1985)}`);

console.log(`\n${checks} Prüfungen, ${fails} Fehler`);
process.exit(fails ? 1 : 0);
