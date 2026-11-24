// =============================================================================
// LIGANAMEN JE LAND (Wunsch Pascal: „Nenne die Ligen der anderen Länder auch dementsprechend in
// deren Sprache, also in Frankreich 1. Ligue, in England 1. League, etc.“ – und bei möglichen
// Rechteproblemen „die Liga anders, aber sichtbar in der nativen Sprache benennen“).
// -----------------------------------------------------------------------------
// Einheitliches Schema für jede Ebene: „<Ebene>. <Wort der Landessprache>“ (1. League, 2. Ligue,
// 3. Divisie …), mehrere Staffeln mit landessprachlichem Zusatz (Nord/Süd, North/South, Norte/Sur …;
// ab vier Staffeln „Group 1“, „Groupe 2“ …). Bewusst KEINE geschützten Markennamen (Premier League,
// Championship, League One, Serie A, LaLiga, Ligue 1, Eredivisie, Süper Lig, Challenger Pro League …)
// und keine Sponsorzusätze – die Nummer steht immer vorn, das Wort ist die allgemeine Bezeichnung.
// Ausnahmen: Deutschland behält die Namen des Spiels (1. Liga, 2. Liga, 3. Liga, Regionalliga …),
// die DDR heißt weiter DDR-Oberliga/DDR-Liga.
// Nicht simulierte, regional verschiedene Amateurebenen (data/leagueTiers.ts, `teams: null` –
// z. B. „Regional Preferente“, „Distritais“) behalten ihren rein beschreibenden Namen
// (`structTierName`). Länder ohne Eintrag: „1. Liga“.
// Einzige Quelle für Ligennamen im Ausland und im Heimatland außerhalb Deutschlands.
// =============================================================================
import type { LeagueGroup } from '../engine/leagues';
import { historicTiers } from './leagueTiers';
import { competitionYear, compPeriod } from './competitions/overrides';

/** Staffel-Zusätze einer Sprache: Nord, Süd, Mitte, Wort für „Staffel n“. */
interface GroupWords { n: string; s: string; m: string; g: string }

const W = (n: string, s: string, m: string, g: string): GroupWords => ({ n, s, m, g });
const DE = W('Nord', 'Süd', 'Mitte', 'Staffel');
const EN = W('North', 'South', 'Central', 'Group');
const FR = W('Nord', 'Sud', 'Centre', 'Groupe');
const ES = W('Norte', 'Sur', 'Centro', 'Grupo');
const PT = W('Norte', 'Sul', 'Centro', 'Zona');
const IT = W('Nord', 'Sud', 'Centro', 'Girone');
const NL = W('Noord', 'Zuid', 'Midden', 'Groep');
const SV = W('Norra', 'Södra', 'Mellersta', 'Grupp');
const NO = W('Nord', 'Sør', 'Midt', 'Avdeling');
const DA = W('Nord', 'Syd', 'Midt', 'Pulje');
const FI = W('Pohjoinen', 'Etelä', 'Keski', 'Lohko');
const IS = W('Norður', 'Suður', 'Mið', 'Riðill');
const RU = W('Sever', 'Yug', 'Tsentr', 'Zona');
const UK = W('Pivnich', 'Pivden', 'Tsentr', 'Hrupa');
const SH = W('Sever', 'Jug', 'Centar', 'Grupa');
const HR = W('Sjever', 'Jug', 'Centar', 'Skupina');
const CS = W('Sever', 'Jih', 'Střed', 'Skupina');
const SK = W('Sever', 'Juh', 'Stred', 'Skupina');
const PL = W('Północ', 'Południe', 'Centrum', 'Grupa');
const HU = W('Észak', 'Dél', 'Közép', 'Csoport');
const RO = W('Nord', 'Sud', 'Centru', 'Seria');
const BG = W('Sever', 'Yug', 'Tsentar', 'Zona');
const SQ = W('Veri', 'Jug', 'Qendër', 'Grupi');
const EL = W('Voreios', 'Notios', 'Kentrikos', 'Omilos');
const TR = W('Kuzey', 'Güney', 'Orta', 'Grup');
const HE = W('Tzafon', 'Darom', 'Merkaz', 'Mahoz');

/** Ligawort und Staffel-Zusätze je Ländercode (data/world/countries.ts). */
const BY_CC: Record<string, { word: string; w: GroupWords }> = {
  ger: { word: 'Liga', w: DE }, aut: { word: 'Liga', w: DE }, sui: { word: 'Liga', w: DE },
  eng: { word: 'League', w: EN }, sco: { word: 'League', w: EN }, wal: { word: 'League', w: EN },
  nir: { word: 'League', w: EN }, irl: { word: 'League', w: EN }, mlt: { word: 'Division', w: EN },
  fra: { word: 'Ligue', w: FR }, lux: { word: 'Ligue', w: FR }, bel: { word: 'Division', w: FR },
  ita: { word: 'Lega', w: IT },
  esp: { word: 'División', w: ES }, por: { word: 'Divisão', w: PT },
  ned: { word: 'Divisie', w: NL },
  swe: { word: 'Divisionen', w: SV }, nor: { word: 'Divisjon', w: NO }, den: { word: 'Division', w: DA },
  fin: { word: 'Divisioona', w: FI }, isl: { word: 'Deild', w: IS },
  urs: { word: 'Divizion', w: RU }, rus: { word: 'Divizion', w: RU }, ukr: { word: 'Liha', w: UK },
  yug: { word: 'Savezna Liga', w: SH }, srb: { word: 'Liga', w: SH }, cro: { word: 'Liga', w: HR },
  tch: { word: 'Liga', w: CS }, cze: { word: 'Liga', w: CS }, svk: { word: 'Liga', w: SK },
  pol: { word: 'Liga', w: PL }, hun: { word: 'Osztály', w: HU }, rou: { word: 'Divizia', w: RO },
  bul: { word: 'Grupa', w: BG }, alb: { word: 'Kategoria', w: SQ },
  gre: { word: 'Ethniki', w: EL }, cyp: { word: 'Katigoria', w: EL },
  tur: { word: 'Lig', w: TR }, isr: { word: 'Liga', w: HE },
};

const entry = (cc: string | undefined) => (cc && BY_CC[cc]) || BY_CC.ger;

/** Ligawort des Landes („League“, „Ligue“ …; Standard „Liga“). */
export const leagueWord = (cc: string | undefined): string => entry(cc).word;

/**
 * Name der Ebene ohne Staffel: „1. League“, „3. Divisie“; Deutschland/DDR wie im Spiel.
 * 1. und 2. Ebene können im Datensatz umbenannt werden (Editor › Wettbewerbe, `league:<cc>:<ebene>`).
 */
export function leagueName(cc: string | undefined, tier: number, year?: number): string {
  if (tier <= 2) {
    const p = compPeriod(leagueCompId(cc, tier), year ?? competitionYear());
    if (p?.name) return p.name;
  }
  return leagueNameBase(cc, tier, year);
}
/** Schlüssel einer Liga im Datensatz (`league:ger:1`). */
export const leagueCompId = (cc: string | undefined, tier: number): string => `league:${cc || 'ger'}:${tier}`;
/** Ländercodes mit eigenem Ligawort (Reihenfolge der Liste im Editor). */
export const LEAGUE_NAME_CCS = (): string[] => Object.keys(BY_CC);

/** Eingebauter Name (ohne Datensatz). */
export function leagueNameBase(cc: string | undefined, tier: number, year?: number): string {
  if (cc === 'gdr') return tier <= 1 ? 'DDR-Oberliga' : tier === 2 ? 'DDR-Liga' : tier === 3 ? 'Bezirksliga' : `${tier}. Liga`;
  if (!cc || cc === 'ger') {
    // Hintergrund-Deutschland ab Ebene 3: Ebenen laut data/leagueTiers.ts („Regionalligen“ → eine Liga).
    const row = tier >= 3 && year != null ? historicTiers('ger', year)?.[tier - 1] : undefined;
    return row ? row.name.replace(/^Regionalligen$/, 'Regionalliga') : `${tier}. Liga`;
  }
  return `${tier}. ${entry(cc).word}`;
}

/** Zusätze der Staffeln: zwei Nord/Süd, drei Nord/Mitte/Süd, sonst „Staffel n“ – in der Landessprache. */
export function groupNamesOf(cc: string | undefined, n: number): string[] {
  const w = entry(cc).w;
  if (n === 2) return [w.n, w.s];
  if (n === 3) return [w.n, w.m, w.s];
  return Array.from({ length: n }, (_, i) => `${w.g} ${i + 1}`);
}

/** Zusatz einer Staffel nach Kennung des Heimatlandes (`nord`/`sued`/`west` …; Rückfall ohne Staffelzahl). */
export function groupWordOfKey(cc: string | undefined, key: string | null | undefined): string {
  const w = entry(cc).w;
  switch (key) {
    case 'nord': return w.n;
    case 'sued': return w.s;
    case 'west': return w.m;
    default: return '';
  }
}

export interface LeagueLabelOpts {
  /** Zahl der Staffeln der Ebene (1 = eingleisig). */
  n?: number;
  /** Index der Staffel (0 …). */
  i?: number;
  /** Saison-Startjahr (nur für Deutschland ab Ebene 3 von Belang). */
  year?: number;
}

/** Anzeigename einer Liga: „1. League“, „2. Ligue Nord“, „3. División Grupo 4“, „2. Liga Süd“. */
export function leagueLabel(cc: string | undefined, tier: number, o: LeagueLabelOpts = {}): string {
  const base = leagueName(cc, tier, o.year);
  const n = o.n ?? 1;
  if (n <= 1) return base;
  const names = groupNamesOf(cc, n);
  return `${base} ${names[o.i ?? 0] ?? `${entry(cc).w.g} ${(o.i ?? 0) + 1}`}`;
}

/**
 * Name einer nicht simulierten Strukturebene (Ligapyramide, Assistent): regional verschiedene
 * Amateurebenen behalten den beschreibenden Namen aus data/leagueTiers.ts, nummerierte Ebenen
 * folgen dem Schema.
 */
export function structTierName(cc: string | undefined, tier: number, year: number): string {
  const row = cc ? historicTiers(cc, year)?.[tier - 1] : undefined;
  if (!cc || cc === 'ger') return row?.name ?? leagueName(cc, tier, year);
  if (row && row.teams == null) return row.name;
  return leagueName(cc, tier, year);
}

/** Staffelkennungen im Heimatland (Divisionen `tier2-<kennung>`, `tier3-<kennung>`). */
export function homeGroupKeys(n: number): LeagueGroup[] {
  if (n <= 1) return [null];
  if (n === 2) return ['nord', 'sued'];
  if (n === 3) return ['nord', 'west', 'sued'];
  if (n === 4) return ['nord', 'west', 'suedwest', 'sued'];
  return (['nord', 'nordost', 'west', 'suedwest', 'sued', 'bayern'] as LeagueGroup[]).slice(0, Math.min(6, n));
}

/**
 * Name einer Division des Heimatlandes aus Ebene, Staffelkennung und Staffelzahl der Ebene
 * (`fallback` = Index, wenn die Kennung nicht passt). Auch für alte Spielstände (loadMigrations).
 */
export function homeDivisionName(cc: string | undefined, tier: number, group: LeagueGroup | undefined, n: number, fallback = 0, year?: number): string {
  if (n <= 1) return leagueLabel(cc, tier, { year });
  const k = homeGroupKeys(n).indexOf(group ?? null);
  return leagueLabel(cc, tier, { n, i: k >= 0 ? k : fallback, year });
}
