// =============================================================================
// Neues Spiel – gemeinsamer Zustand des Assistenten, Beschriftungen, Angebote
// =============================================================================
import { Difficulty, ManagerBackground, ManagerProfile, ManagerStyle, NewGameOptions } from '../../types';
import type { HistoryMode } from '../../game/historicSteer';
import type { LeagueRepMode } from '../../game/leagueRepGame';
import type { CSSProperties } from 'react';
import { LEAGUES, LeagueKey, ClubPreview, leaguePreview, leaguesFor } from './clubPreview';

export const STYLE_DE: Record<ManagerStyle, string> = { defensive: 'Defensiv', balanced: 'Ausgeglichen', attacking: 'Offensiv' };

export const BG_DE: Record<ManagerBackground, { label: string; desc: string }> = {
  legend: { label: 'Trainer-Legende', desc: 'Großer Name, hohes Ansehen beim Vorstand.' },
  ex_pro: { label: 'Ex-Profi', desc: 'Selbst gespielt – guter Draht zur Mannschaft.' },
  tactician: { label: 'Taktik-Fuchs', desc: 'Analytiker mit Sinn für Details.' },
  rookie: { label: 'Newcomer', desc: 'Unbeschriebenes Blatt mit Ambitionen.' },
};

export const DIFF_DE: [Difficulty, string, string][] = [
  ['easy', 'Leicht', 'Zum Kennenlernen'],
  ['normal', 'Normal', 'Der vorgesehene Weg'],
  ['hard', 'Schwer', 'Für erfahrene Manager'],
];

export type StartMode = 'manager' | 'career' | 'young';

/** Historische Entwicklung: eine Frage im Assistenten (StepWorld), setzt beide Mechaniken –
 *  `historyMode` (andere Vereine, game/historicSteer.ts) und `leagueRepMode` (Ligaruf, game/leagueRepGame.ts). */
export type HistoricLevel = 'free' | 'historic' | 'strict';
export const HISTORIC_LEVELS: { id: HistoricLevel; label: string; history: HistoryMode; leagueRep: LeagueRepMode; desc: string }[] = [
  {
    id: 'free', label: 'Frei', history: 'off', leagueRep: 'free',
    desc: 'Kein Eingriff von außen: Vereine wachsen nur mit Erfolg, Geld und Glück, Ligen nur mit ihren Europapokal-Ergebnissen. Auch Braunschweig kann eine Ära prägen – und 2026 können ganz andere Länder zu den Top 5 gehören.',
  },
  {
    id: 'historic', label: 'Historisch', history: 'medium', leagueRep: 'historic',
    desc: 'Vereine und Ligen werden zur echten Geschichte gezogen, Überraschungen bleiben häufig: Die Großklubs haben einen spürbaren Vorteil, Italien wird in den 90ern stark. Liegt eine Liga über ihrem historischen Ruf, verliert sie jede Saison mindestens ein Viertel des Vorsprungs.',
  },
  {
    id: 'strict', label: 'Streng historisch', history: 'strong', leagueRep: 'historic',
    desc: 'Die echten Großklubs landen meist oben: Mönchengladbach und Hamburg Blau in den 70ern, München Rot ab 2012 erdrückend, im Ausland Liverpool Rot, später Madrid Weiß und Barcelona. Die Ligen folgen der Geschichte wie bei Historisch.',
  },
];

/** Gemeinsamer Zustand aller Schritte. */
export interface NewGameDraft {
  datasetId: string;
  difficulty: Difficulty;
  injuries: boolean;
  /** Historische Entwicklung (eine Frage für Vereine und Ligen, HISTORIC_LEVELS), Standard historisch. */
  historic: HistoricLevel;
  speedMs: number;
  briefingAuto: boolean;
  briefingIntro: boolean;
  /** Ausnahmetalente der Fußballgeschichte (game/legendsGame.ts), Standard an. */
  legends: boolean;
  mode: StartMode;
  /** Zufallssaat der Karriere-Angebote (fest ab Assistent-Start). */
  offerSeed: number;
  league: LeagueKey;
  clubId: string;
  /** Startjahr (Saison-Start), Standard 1975. */
  startYear: number;
  /** Heimatland (data/world/countries.ts), Standard 'ger'. */
  country: string;
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  nationality: string;
  nationality2: string;
  avatarSeed: string;
  favoriteClubId: string;
  avoidClubId: string;
  style: ManagerStyle;
  background: ManagerBackground;
  /** Junger Manager: Hintergrundgeschichte (data/privateLife.ts). */
  story: string;
  /** Privatleben (Familie, Freizeit, Vermögen), Standard an. */
  privateLife: boolean;
  /** Zusätzlich Nationaltrainer (Standard aus) + Nation (game/national/jobNations.ts) + Entlassung möglich. */
  nationalOn: boolean;
  nationalTeam: string;
  nationalSackable: boolean;
}

export const START_ISO = '1975-07-01';
export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** Jahrgänge: 20 bis 65 Jahre beim Spielstart. */
export const BIRTH_YEARS = Array.from({ length: 46 }, (_, i) => 1955 - i);
/** Jahrgänge für ein Startjahr (18 bis 65 Jahre alt). */
export const birthYearsFor = (start: number) => Array.from({ length: 48 }, (_, i) => start - 18 - i);

export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export function birthIso(d: NewGameDraft): string {
  const day = Math.min(d.birthDay, daysInMonth(d.birthYear, d.birthMonth));
  return `${d.birthYear}-${String(d.birthMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
/** Alter am 1. Juli des Startjahres. */
export function ageAtStart(d: NewGameDraft): number {
  const before = d.birthMonth > 7 || (d.birthMonth === 7 && d.birthDay > 1);
  return (d.startYear ?? 1975) - d.birthYear - (before ? 1 : 0);
}
export const fullName = (d: NewGameDraft) => `${d.firstName.trim()} ${d.lastName.trim()}`.trim();
export const nameOk = (d: NewGameDraft) => d.firstName.trim().length >= 1 && d.lastName.trim().length >= 2;

/** Pseudo-Spieler für das Managergesicht (components/PlayerAvatar). */
export const managerFace = (seed: string, name: string) => ({ id: `mgr-${seed}`, fullName: name || 'Manager' });

// -----------------------------------------------------------------------------
// Karrieremodus: drei Angebote schwächerer Vereine (feste Saat je Assistent)
// -----------------------------------------------------------------------------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface CareerOffer { club: ClubPreview; league: LeagueKey; leagueName: string }

/**
 * Immer drei verschiedene Angebote, je nach Ligen des Heimatlandes im Startjahr:
 *   1 × 1. Liga (unteres Drittel der Kaderstärke) + 2 × 2. Liga (obere Hälfte) –
 *   bei zwei Staffeln (Deutschland bis 1980) je eins aus Nord und Süd, bei einer 2. Liga zwei daraus;
 *   ohne wählbare 2. Liga (viele Länder) drei Erstligisten aus dem unteren Drittel.
 * Reicht ein Topf nicht (kleine Liga, „niemals“-Verein), wird er erweitert: 1. Liga untere Hälfte,
 * dann die ganze Liga, zuletzt irgendein noch freier Verein des Landes.
 */
export function careerOffers(seed: number, avoidId: string, cc = 'ger', year = 1975): CareerOffer[] {
  const r = rng(seed);
  const lists = leaguesFor(cc, year)
    .map((l) => ({ l, list: leaguePreview(l.key, cc, year).filter((c) => c.id !== avoidId) }))
    .filter((x) => x.list.length > 0);
  const first = lists.filter((x) => x.l.tier === 1);
  const second = lists.filter((x) => x.l.tier === 2);
  type Src = (typeof lists)[number];
  const weakTop = (c: ClubPreview) => c.rank > (c.size * 2) / 3;
  const upperHalf = (c: ClubPreview) => c.rank <= Math.ceil(c.size / 2);
  const slots: { src: Src; tests: ((c: ClubPreview) => boolean)[] }[] = [];
  if (first[0]) slots.push({ src: first[0], tests: [weakTop, (c) => c.rank > c.size / 2] });
  for (let i = 0; second.length && i < 2; i++) slots.push({ src: second[i % second.length], tests: [upperHalf] });
  while (first[0] && slots.length < 3) slots.push({ src: first[0], tests: [weakTop, (c) => c.rank > c.size / 2] });

  const taken = new Set<string>();
  const out: CareerOffer[] = [];
  const take = (src: Src, pool: ClubPreview[]) => {
    const c = pool[Math.floor(r() * pool.length)];
    taken.add(c.id);
    out.push({ club: c, league: src.l.key, leagueName: src.l.name });
  };
  for (const { src, tests } of slots) {
    const free = src.list.filter((c) => !taken.has(c.id));
    const pool = tests.map((t) => free.filter(t)).find((p) => p.length) ?? free;
    if (pool.length) { take(src, pool); continue; }
    // Liga erschöpft: nächster freier Verein irgendeiner wählbaren Liga.
    const other = lists.find((x) => x.list.some((c) => !taken.has(c.id)));
    if (other) take(other, other.list.filter((c) => !taken.has(c.id)));
  }
  return out.slice(0, 3);
}

// -----------------------------------------------------------------------------
// Optionen für den Spielstart
// -----------------------------------------------------------------------------
export function managerProfile(d: NewGameDraft): ManagerProfile {
  return {
    name: fullName(d), nationality: d.nationality, birthYear: d.birthYear, style: d.style, background: d.background,
    avatarSeed: d.avatarSeed, firstName: d.firstName.trim(), lastName: d.lastName.trim(), birthDate: birthIso(d),
    ...(d.nationality2 ? { nationality2: d.nationality2 } : {}),
    ...(d.favoriteClubId ? { favoriteClubId: d.favoriteClubId } : {}),
    ...(d.avoidClubId ? { avoidClubId: d.avoidClubId } : {}),
    startMode: d.mode,
    ...(d.mode === 'young' ? { story: d.story } : {}),
  };
}

/** Beide Felder der Spieloptionen aus der einen Frage „Historische Entwicklung“. */
export function historicOptions(level: HistoricLevel): Pick<NewGameOptions, 'historyMode' | 'leagueRepMode'> {
  const l = HISTORIC_LEVELS.find((x) => x.id === level) ?? HISTORIC_LEVELS[1];
  return { historyMode: l.history, leagueRepMode: l.leagueRep };
}

export function gameOptions(d: NewGameDraft): NewGameOptions {
  return {
    managedClubId: d.clubId, manager: managerProfile(d), difficulty: d.difficulty, realisticSquads: true,
    injuriesEnabled: d.injuries, speedMs: d.speedMs, datasetId: d.datasetId, ...historicOptions(d.historic), legends: d.legends,
    ...(d.privateLife ? {} : { privateLife: false }),
    ...(d.startYear !== 1975 ? { startYear: d.startYear } : {}),
    ...(d.country !== 'ger' ? { country: d.country } : {}),
    ...(d.nationalOn && d.nationalTeam ? { nationalTeam: d.nationalTeam, ...(d.nationalSackable ? {} : { nationalSackable: false }) } : {}),
  };
}

/** Alle wählbaren deutschen Vereine (für Lieblingsverein/„niemals“). */
export function allPreviewClubs(): ClubPreview[] {
  return LEAGUES.flatMap((l) => leaguePreview(l.key)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// --- Farbe im Assistenten (Wunsch Pascal; Farben in 24-newgame.css, Tokens --ng-* in 00-base.css) ---
/** Füllstand eines Schiebereglers als CSS-Variable `--pct` (farbige Spur bis zum Griff). */
export const rangePct = (v: number, min: number, max: number): CSSProperties =>
  ({ '--pct': `${Math.max(0, Math.min(100, ((v - min) / Math.max(1, max - min)) * 100))}%` }) as CSSProperties;

/** Helligkeit 0–1 einer Hex-Farbe (#rgb/#rrggbb); unlesbar → 1. */
function lum(hex: string): number {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(f)) return 1;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Vereinsfarben als CSS-Variablen `--club`/`--club-2` für Band und Kante: Farben, die auf dem
 *  dunklen Grund verschwinden (fast schwarz), fallen weg – dann trägt die andere Farbe das Band. */
export function clubBandVars(primary: string, secondary: string): CSSProperties {
  const ok = [primary, secondary].filter((c) => lum(c) >= 0.1);
  const a = ok[0] ?? primary;
  const b = ok[1] ?? a;
  return { '--club': a, '--club-2': b } as CSSProperties;
}

/** Jahrzehnt für die Epochenfarbe (`data-era`): 70, 80, 90, 00, 10, 20. */
export const eraKey = (y: number) => String((Math.floor(y / 10) % 10) * 10).padStart(2, '0');

/** Kurzname der Epoche (Startjahr-Wahl). */
export const ERA_NAME: Record<string, string> = {
  '70': 'Die Siebziger', '80': 'Die Achtziger', '90': 'Die Neunziger', '00': 'Die Nullerjahre', '10': 'Die Zehnerjahre', '20': 'Die Zwanziger',
};
