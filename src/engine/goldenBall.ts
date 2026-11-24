// =============================================================================
// KRISTALLSTERN — Fußballer des Jahres (rein, ohne Spielstand)
// -----------------------------------------------------------------------------
// Ende Dezember wählt die Jury den besten Spieler des Kalenderjahres. Vorbild ist
// die europäische Auszeichnung der Fachpresse (seit 1956). Regeln je Epoche
// (Quelle: topendsports.com „Timeline of Significant Events in Ballon d'Or History“,
// rsssf.org „European Footballer of the Year“):
//   • bis 1994: nur Spieler mit europäischer Staatsangehörigkeit bei europäischen Vereinen,
//   • ab 1995: alle Spieler europäischer Vereine, gleich welcher Herkunft,
//   • ab 2007: Spieler aller Ligen weltweit (im Spiel sind nur europäische Ligen
//     simuliert – praktisch also wie ab 1995, die Wahl heißt dann „Weltfußballer“).
// Gala-Ort: Paris; 2010–2015 Zürich (Zusammenlegung mit der Weltfußballer-Wahl),
// ab 2016 wieder Paris. Der Name der Trophäe ist bewusst neutral („Kristallstern“).
//
// Wertung (Punkte, höher = besser) – Leistung des Kalenderjahres:
//   Leistung   3,0 × (4,0 − Notenschnitt)
//   Klasse     0,08 × (Stärke − 70)                    (Weltklasse 90 → 1,6)
//   Tore       je Position: Sturm 4,0 / Mittelfeld 3,0 / Abwehr 2,0 × (Tore + 0,5 × Vorlagen) je Spiel,
//              über 0,7 je Spiel nur halb (Rekordquoten einzelner Ligen entscheiden die Wahl nicht allein)
//   Defensive  Torwart/Abwehr: 2,0 × Zu-null-Quote
//   Titel      Landesmeister-/Champions-Cup 2,0 · Pokalsieger-Cup 1,0 · UEFA-Cup 0,8 ·
//              Meister 1,0 · Pokal 0,5 – nationale Titel × Bühne (Ligastärke gegen die stärkste
//              Liga: 1 − 0,08 je Stärkepunkt Abstand über 2 Punkte hinaus, mindestens 0,35)
//   Bühne      3,5 × (Bühne − 1): Spieler schwächerer Ligen verlieren bis 2,3 Punkte – die Jury
//              schaut auf die großen Ligen (Kalibrierung über die Epochen: tests/simAwards.ts)
//   Einsätze   unter 20 Spielen im Jahr anteilig weniger (Faktor Einsätze/20).
// =============================================================================
import { nOf } from './textNum';
import type { PositionGroup } from '../types';

export type GBTitle = 'ec' | 'cwc' | 'uefa' | 'meister' | 'pokal';
export const GB_TITLE_LABEL: Record<GBTitle, string> = {
  ec: 'Pokal der Landesmeister', cwc: 'Pokal der Pokalsieger', uefa: 'Europa-Pokal', meister: 'Meister', pokal: 'Pokalsieger',
};
const TITLE_PTS: Record<GBTitle, number> = { ec: 2.0, cwc: 1.0, uefa: 0.8, meister: 1.0, pokal: 0.5 };

/** Europäische Staatsangehörigkeiten (Kürzel wie in data/origins.ts). */
export const EUROPEAN_NATS = new Set([
  'GER', 'AUT', 'SUI', 'NED', 'BEL', 'DEN', 'SWE', 'NOR', 'FIN', 'ISL', 'YUG', 'CRO', 'SRB', 'SVN', 'BIH', 'MKD', 'MNE', 'ALB',
  'POL', 'TCH', 'CZE', 'SVK', 'HUN', 'ROU', 'BUL', 'RUS', 'URS', 'UKR', 'BLR', 'ITA', 'ESP', 'POR', 'FRA', 'ENG', 'SCO', 'WAL',
  'NIR', 'IRL', 'TUR', 'GRE', 'CYP', 'LUX', 'DDR', 'GDR', 'LTU', 'LVA', 'EST', 'GEO', 'ARM', 'AZE', 'ISR', 'MLT',
]);

export interface GBEra { title: string; short: string; rule: string; venue: string }

/** Bezeichnung, Teilnahmeregel und Gala-Ort eines Jahres. */
export function gbEra(year: number): GBEra {
  const venue = year >= 2010 && year <= 2015 ? 'Zürich' : 'Paris';
  if (year < 1995) return { title: 'Europas Fußballer des Jahres', short: 'Kristallstern', rule: 'Nur Europäer bei europäischen Vereinen', venue };
  if (year < 2007) return { title: 'Europas Fußballer des Jahres', short: 'Kristallstern', rule: 'Alle Spieler europäischer Vereine', venue };
  return { title: 'Weltfußballer des Jahres', short: 'Kristallstern', rule: 'Spieler aller Ligen weltweit', venue };
}

/** Darf der Spieler in diesem Jahr gewählt werden? (Alle simulierten Vereine sind europäisch.) */
export function gbEligible(year: number, nationality: string): boolean {
  if (year >= 1995) return true;
  return EUROPEAN_NATS.has((nationality || '').toUpperCase());
}

export interface GBCandidate {
  pid: string; name: string; nat: string;
  clubId: string; clubName: string; country: string;
  pos: string; group: PositionGroup; age: number;
  /** Stärke (Gesamtwert). */
  ovr: number;
  /** Kalenderjahr: Spiele, Notenschnitt, Tore, Vorlagen, Zu-null-Spiele. */
  apps: number; avg: number; goals: number; assists: number; clean: number;
  titles: GBTitle[];
  /** true = Werte aus Vereinsstärke geschätzt (Auslandsverein ohne Einzelstatistik). */
  est?: boolean;
  /** Bühne 0,35..1: Stärke der Liga gegen die stärkste Liga – gewichtet Meisterschaft/Pokal (fehlt = 1). */
  lg?: number;
}

export interface GBScored extends GBCandidate { score: number }

/** Torbeteiligung je Spiel: über 0,7 zählt nur noch die Hälfte (Rekordquoten entscheiden die Wahl nicht allein). */
const soften = (v: number) => (v <= 0.7 ? v : 0.7 + 0.5 * (v - 0.7));
/** Gewicht der Bühne: Abzug für Spieler schwächerer Ligen (Bühne 1 = keine Abzüge). */
const STAGE = 3.5;

export function gbScore(c: GBCandidate): number {
  const per = (v: number) => v / Math.max(1, c.apps);
  let s = 3.0 * (4.0 - c.avg) + 0.08 * (c.ovr - 70);
  const gw = c.group === 'ATT' ? 4.0 : c.group === 'MID' ? 3.0 : c.group === 'DEF' ? 2.0 : 0;
  s += gw * soften(per(c.goals + 0.5 * c.assists));
  if (c.group === 'GK' || c.group === 'DEF') s += 2.0 * per(c.clean);
  for (const t of c.titles) s += TITLE_PTS[t] * (t === 'meister' || t === 'pokal' ? c.lg ?? 1 : 1);
  s += STAGE * ((c.lg ?? 1) - 1);
  s *= Math.min(1, c.apps / 20);
  return Math.round(s * 100) / 100;
}

/** Top-N der Wahl (nur wählbare Spieler mit mindestens 10 Spielen im Jahr). */
export function rankGoldenBall(cands: GBCandidate[], year: number, n = 10): GBScored[] {
  return cands
    .filter((c) => c.apps >= 10 && gbEligible(year, c.nat) && Number.isFinite(c.avg) && c.avg > 0)
    .map((c) => ({ ...c, score: gbScore(c) }))
    .sort((a, b) => b.score - a.score || b.ovr - a.ovr || a.pid.localeCompare(b.pid))
    .slice(0, n);
}

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

/** Ein Satz Begründung. */
export function gbReason(c: GBScored): string {
  const bits: string[] = [];
  const big = c.titles.find((t) => t === 'ec' || t === 'cwc' || t === 'uefa');
  if (big) bits.push(`Gewinner des ${GB_TITLE_LABEL[big].replace(/^(Pokal|Europa-Pokal)(?= |$)/, '$1s')}`);
  if (c.titles.includes('meister')) bits.push(c.titles.includes('pokal') ? 'Double aus Meisterschaft und Pokal' : 'Meister');
  else if (c.titles.includes('pokal')) bits.push('Pokalsieger');
  if (c.group === 'ATT' || (c.group === 'MID' && c.goals >= 10)) bits.push(`${nOf(c.goals, 'Tor', 'Tore')}${c.assists ? ` und ${nOf(c.assists, 'Vorlage', 'Vorlagen')}` : ''} im Kalenderjahr`);
  else if (c.group === 'MID') bits.push(`${nOf(c.assists, 'Vorlage', 'Vorlagen')}, Notenschnitt ${fmt(c.avg)}`);
  else bits.push(`${nOf(c.clean, 'Spiel', 'Spiele')} zu null, Notenschnitt ${fmt(c.avg)}`);
  if (!bits.length || bits.length < 2) bits.push(c.ovr >= 88 ? 'Weltklasse in Bestform' : `konstant stark über ${c.apps} Spiele`);
  return bits.join(' – ').replace(/^./, (s) => s.toUpperCase()) + '.';
}
