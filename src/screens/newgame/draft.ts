// =============================================================================
// Neues Spiel – gemeinsamer Zustand des Assistenten, Beschriftungen, Angebote
// =============================================================================
import { Difficulty, ManagerBackground, ManagerProfile, ManagerStyle, NewGameOptions } from '../../types';
import type { HistoryMode } from '../../game/historicSteer';
import type { LeagueRepMode } from '../../game/leagueRepGame';
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

/** Kandidaten: untere Hälfte beider 2.-Liga-Staffeln + die drei schwächsten Erstligisten; ein Angebot je Liga, wenn möglich. */
export function careerOffers(seed: number, avoidId: string, cc = 'ger', year = 1975): CareerOffer[] {
  const r = rng(seed);
  const pools = leaguesFor(cc, year).map((l) => {
    const list = leaguePreview(l.key, cc, year).filter((c) => c.id !== avoidId);
    const weak = list.filter((c) => (l.tier === 1 ? c.rank > c.size - 4 : c.rank > c.size / 2));
    return { l, weak };
  });
  const out: CareerOffer[] = [];
  for (const { l, weak } of pools) {
    if (!weak.length) continue;
    const c = weak[Math.floor(r() * weak.length)];
    out.push({ club: c, league: l.key, leagueName: l.name });
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
  };
}

/** Alle wählbaren deutschen Vereine (für Lieblingsverein/„niemals“). */
export function allPreviewClubs(): ClubPreview[] {
  return LEAGUES.flatMap((l) => leaguePreview(l.key)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
