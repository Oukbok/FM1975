// =============================================================================
// FESTE TEXTE IN DER HEIMATWÄHRUNG (Wunsch Pascal: nie „DM“ oder „€“ in einem
// Spiel in England, Italien …)
// -----------------------------------------------------------------------------
// Redaktionelle Texte (Finanzberater, Briefing, Chronik, Wiki, i-Hilfe) nennen
// Beträge in D-Mark bzw. Euro. Für ein anderes Heimatland rechnet `localMoneyText`
// jeden Betrag in die Währung um, die dort im genannten Jahr galt:
//   „1988/89 rund 40 Mio. DM“ → England „13 Mio. £“, Italien „29,6 Mrd. Lire“.
// Das Jahr eines Betrags ist die letzte Jahreszahl davor in derselben Zeile,
// sonst das Jahr des Textes (`year`; im Wiki für D-Mark 1975 = Rechenbasis).
// Sätze, die von der deutschen Währung selbst handeln („Seit 2002 rechnen wir in
// Euro“), entfernt `localCurrencyText` – die Umstellungen des eigenen Landes
// meldet game/briefingChanges.ts. Deutschland bleibt unverändert.
// Ein Wortverbinder (U+2060) zwischen Zahl und Einheit nimmt einen Betrag von der
// Umrechnung aus (Wiki-Artikel zur Währung: „1 € = 1,95583 DM“).
// Nur Anzeige: Rechenwerte bleiben DM-nominal (engine/economy.ts).
// =============================================================================
import { CURRENCIES } from '../data/currencies';
import { currencyAt, DM_PER_EUR, homeCurrencyCc } from './economy';

const WORDS: Record<string, number> = { eine: 1, einer: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, hundert: 100 };
const NUM = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?|${Object.keys(WORDS).join('|')}`;
const MONEY = new RegExp(
  String.raw`(?<![\w.,])(${NUM})(?:(\s?[–-]\s?)(${NUM}))?[  ]?(Mio\.|Tsd\.|Mrd\.|Millionen|Million|Milliarden|Milliarde)?[  ]?(DM|D-Mark|€|Euro|EUR)(?![\wäöü-])`, 'g');
const SCALE: Record<string, number> = { 'Tsd.': 1e3, 'Mio.': 1e6, 'Mrd.': 1e9, Millionen: 1e6, Million: 1e6, Milliarden: 1e9, Milliarde: 1e9 };
/** Ungefähre Angaben: „wenige Millionen DM“ → Größenordnung in der Heimatwährung. */
const VAGUE = /\b(wenige|einige|mehrere|viele) (Millionen|Milliarden) (DM|D-Mark|Euro)(?![\wäöü-])/g;
const MAGNITUDE: [number, string][] = [[1e12, 'Billionen'], [1e9, 'Milliarden'], [1e6, 'Millionen'], [1e5, 'Hunderttausend'], [1e4, 'Zehntausend'], [0, 'Tausend']];
const YEAR = /\b(19[5-9]\d|20[0-3]\d)\b/g;

const parseDe = (s: string) => WORDS[s] ?? Number(s.replace(/\./g, '').replace(',', '.'));
const sig3 = (v: number) => Number(v.toPrecision(3));
const de = (v: number, dec: number) => v.toLocaleString('de-DE', { maximumFractionDigits: dec });

/** Stufe (Teiler, Wort) für einen Anzeigewert; `scaled` = der Quelltext nutzte Tsd./Mio./Mrd. */
function stepOf(v: number, scaled: boolean): [number, string] {
  const a = Math.abs(v);
  if (a >= 1e12) return [1e12, 'Bio. '];
  if (a >= 1e9) return [1e9, 'Mrd. '];
  if (a >= 1e6) return [1e6, 'Mio. '];
  if (a >= 1e4 && scaled) return [1e3, 'Tsd. '];
  return [1, ''];
}
function show(v: number, div: number): string {
  const x = sig3(v) / div;
  return de(x, div > 1 ? (Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2) : Math.abs(x) >= 100 ? 0 : 2);
}

/** Das Heimatland rechnet (irgendwann bis `year` + 1) in Euro? */
function homeHasEuro(year: number): boolean {
  return (CURRENCIES[homeCurrencyCc()] ?? []).some((e) => e.code === 'EUR' && e.from <= `${year + 1}-12-31`);
}

export interface MoneyTextOpts {
  /** Jahr für D-Mark-Beträge ohne Jahreszahl davor (Wiki: 1975 = Rechenbasis). Standard `year`. */
  dmYear?: number;
}

/** Beträge in D-Mark/Euro in die Heimatwährung des genannten Jahres umrechnen (Deutschland: unverändert). */
export function localMoneyText(text: string, year: number, opts: MoneyTextOpts = {}): string {
  if (homeCurrencyCc() === 'ger' || !/DM|D-Mark|€|Euro|EUR/.test(text)) return text;
  const vague = (line: string) => line.replace(VAGUE, (all: string, q: string, scale: string, cur: string) => {
    const isDm = cur !== 'Euro';
    const c = currencyAt(year, `${year}-07-01`);
    if (c.code === (isDm ? 'DEM' : 'EUR')) return all;
    const v = 3 * SCALE[scale] * (isDm ? 1 : DM_PER_EUR) * c.perDM;
    return `${q} ${MAGNITUDE.find(([min]) => v >= min)![1]} ${c.unit}`;
  });
  return text.split('\n').map((line) => vague(line).replace(MONEY, (all: string, a: string, dash: string | undefined, b: string | undefined, scale: string | undefined, cur: string, at: number) => {
    if ((a in WORDS || (b != null && b in WORDS)) && !scale) return all; // „zwei Euro“ bleibt Text, nur „zwei Millionen Euro“ ist ein Betrag
    const isDm = cur === 'DM' || cur === 'D-Mark';
    // Jahr des Betrags: letzte Jahreszahl davor in der Zeile (höchstens 70 Zeichen zurück).
    let y = isDm ? opts.dmYear ?? year : year;
    const before = line.slice(Math.max(0, at - 70), at);
    for (const m of before.matchAll(YEAR)) y = Number(m[1]);
    if (isDm && y > 2001) y = 2001;
    if (!isDm && y < 1999) y = year;
    const c = currencyAt(y, `${y}-07-01`);
    if (c.code === (isDm ? 'DEM' : 'EUR')) return all;
    const f = (SCALE[scale ?? ''] ?? 1) * (isDm ? 1 : DM_PER_EUR) * c.perDM;
    const lo = parseDe(a) * f, hi = b != null ? parseDe(b) * f : null;
    const [div, word] = stepOf(hi ?? lo, !!scale);
    return `${show(lo, div)}${hi != null ? `${dash!.trim()}${show(hi, div)}` : ''} ${word}${c.unit}`;
  })).join('\n');
}

/**
 * Wie `localMoneyText`, zusätzlich fallen Sätze weg, die von D-Mark oder Euro als
 * Währung handeln und im Heimatland nicht stimmen. `null` = nichts bleibt übrig.
 */
export function localCurrencyText(text: string, year: number, opts: MoneyTextOpts = {}): string | null {
  const cc = homeCurrencyCc();
  if (cc === 'ger') return text;
  const t = localMoneyText(text, year, opts);
  const mark = cc === 'gdr' || currencyAt(year, `${year}-07-01`).code === 'DEM' ? null : /\bD-Mark\b|\b(?:die|der|eine|jede|zwei|in|zur) Mark\b/;
  const euro = homeHasEuro(year) ? null : /\bEuro\b|€|\bEuro-Bargeld\b/;
  if (!(mark?.test(t) || euro?.test(t))) return t;
  const keep = t.split(/(?<=[.!?])(?<!\b(?:Mio|Tsd|Mrd|Bio|ca|bzw|Nr|St|z|B)\.)\s+/).filter((s) => !(mark?.test(s) || euro?.test(s)));
  return keep.length ? keep.join(' ') : null;
}
