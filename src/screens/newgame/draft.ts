// =============================================================================
// Neues Spiel – gemeinsamer Zustand des Assistenten, Beschriftungen, Angebote
// =============================================================================
import { Difficulty, ManagerBackground, ManagerProfile, ManagerStyle, NewGameOptions } from '../../types';
import type { HistoryMode } from '../../game/historicSteer';
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

export type StartMode = 'manager' | 'career';

/** Gemeinsamer Zustand aller Schritte. */
export interface NewGameDraft {
  datasetId: string;
  difficulty: Difficulty;
  injuries: boolean;
  /** Entwicklung der anderen Vereine (game/historicSteer.ts). */
  history: HistoryMode;
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
  /** Weitere Länder Spiel für Spiel (sonst Hintergrund). */
  fullCountries: string[];
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
}

export const START_ISO = '1975-07-01';
export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
/** Jahrgänge: 20 bis 65 Jahre beim Spielstart. */
export const BIRTH_YEARS = Array.from({ length: 46 }, (_, i) => 1955 - i);
/** Jahrgänge für ein Startjahr (20 bis 65 Jahre alt). */
export const birthYearsFor = (start: number) => Array.from({ length: 46 }, (_, i) => start - 20 - i);

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
  };
}

export function gameOptions(d: NewGameDraft): NewGameOptions {
  return {
    managedClubId: d.clubId, manager: managerProfile(d), difficulty: d.difficulty, realisticSquads: true,
    injuriesEnabled: d.injuries, speedMs: d.speedMs, datasetId: d.datasetId, historyMode: d.history, legends: d.legends,
    ...(d.startYear !== 1975 ? { startYear: d.startYear } : {}),
    ...(d.country !== 'ger' ? { country: d.country } : {}),
    ...(d.fullCountries.length ? { fullCountries: [...d.fullCountries] } : {}),
  };
}

/** Alle wählbaren deutschen Vereine (für Lieblingsverein/„niemals“). */
export function allPreviewClubs(): ClubPreview[] {
  return LEAGUES.flatMap((l) => leaguePreview(l.key)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
