// =============================================================================
// NACHWUCHS-INVESTITIONEN — Rechenlogik (ohne Spielablauf, ohne UI)
// -----------------------------------------------------------------------------
// Die Jugendarbeit eines Vereins besteht aus sieben Bausteinen plus einem
// laufenden Jugendetat. Jeder Baustein hat Stufen mit Bauzeit, Baukosten und
// jährlichem Unterhalt (alles in 1975-Basis, Buchung × economyScale) und wird
// erst in seiner Epoche verfügbar:
//   Jugendtrainer (Qualität × Anzahl) · Plätze & Halle · Internat ·
//   Schulkooperation · Sportwissenschaft · Scouting-Netz · Zweite Mannschaft.
// Daraus ergibt sich eine ZIEL-Ausbildungsqualität. Die WIRKSAME Qualität folgt
// ihr nur langsam (≈ 20 % je Jahr: Trainer, Konzept und Abläufe brauchen Zeit),
// der RUF der Akademie noch langsamer (Erfolg eigener Talente). Investitionen
// zahlen sich deshalb typischerweise erst nach 3–6 Jahren aus.
//
// Preisniveau (Ziel der Finanzen: Erstligist 1975 ≈ 4,5 Mio. DM Umsatz): Ein
// üblicher Erstligist 1975 kommt auf ≈ 100 Tsd. DM Nachwuchskosten im Jahr
// (Etat, nebenberufliche Trainer, Amateure), ein stark investierender auf
// 200–300 Tsd. – grob 3–6 % des Umsatzes. Diese Quote bleibt über die
// Jahrzehnte ähnlich: 2013/14 gaben die Bundesligisten zusammen 90 Mio. € für
// den Nachwuchs aus, ≈ 5 Mio. € je Verein (Soccer America, „Soccer made in
// Germany and the reality“). Ein volles NLZ der 2020er kostet hier ≈ 10–25 Mio. €.
// Für 1975 gibt es keine belastbare Quelle – die Zahl ist eine Schätzung.
//
// Historische Eckpunkte (im Spiel wirksam):
//   1985  Partnerschulen, nationales Sichtungsnetz, Kunstrasen/Halle
//   1988  erste Jugendinternate (verbreiten sich in den 90ern; Schalke/Gesamt-
//         schule Berger Feld: Talentzentrum seit 1995 – Wikipedia)
//   1994  Regionalliga → zweite Mannschaften auf höherem Niveau (U23)
//   1996  Bosman: internationales Scouting, ausländische Talente
//   2001  Leistungszentrum Pflicht für die Bundesliga, 2002 für die 2. Liga
//         („Seit 2001 sind die Clubs der Bundesliga dazu verpflichtet, ein
//         eigenes Leistungszentrum zu betreiben … Seit 2002 ist es auch für die
//         Zweitligisten eine der Lizenzbedingungen“ – FSA, LZ-Elternbroschüre)
//   2002  DFB-Talentförderprogramm nach WM 1998/EM 2000 (Soccer America; heute
//         339 Stützpunkte, ≈ 1.200 Trainer, ≈ 14.000 Talente – dfb.de)
//   2006  „Eliteschule des Fußballs“ (Berger Feld 2007 als vierte Schule)
// =============================================================================
import type { Club } from '../types';
import type { IconName } from '../components/Icon';

export type YouthBlockKey = 'coaches' | 'pitches' | 'boarding' | 'school' | 'science' | 'scouting' | 'reserve';

export interface YouthBuild { key: YouthBlockKey; target: number; done: string }

export interface YouthInvest {
  /** Aktive Stufe je Baustein (0 = nicht vorhanden; Trainer mindestens 1). */
  levels: Record<YouthBlockKey, number>;
  /** Anzahl der Jugendtrainer. */
  coachCount: number;
  /** Laufender Jugendetat je Saison (1975-Basis): Fahrten, Turniere, Material, Sichtungstage. */
  budget: number;
  /** Laufende Ausbauten (werden zum Datum `done` wirksam). */
  builds: YouthBuild[];
  /** Wirksame Ausbildungsqualität 0–100 (folgt dem Ziel verzögert). */
  quality: number;
  /** Ruf der Akademie 0–100 (Langzeitwert). */
  reputation: number;
  /** Durchlässigkeit 0–100: bekommen eigene Talente Einsatzzeit bei den Profis? */
  perspective: number;
  /** Verlauf je Saison (neueste zuletzt, max. 40). */
  history?: { season: string; quality: number; reputation: number; spend: number }[];
}

export interface YouthLevelDef {
  name: string;
  desc: string;
  /** Verfügbar ab Jahr. */
  from: number;
  /** Baukosten (1975-Basis). */
  build: number;
  /** Bauzeit in Monaten. */
  months: number;
  /** Unterhalt je Jahr (1975-Basis); bei Jugendtrainern je Trainer. */
  upkeep: number;
  /** Voraussetzung: andere Bausteine mit Mindeststufe. */
  needs?: Partial<Record<YouthBlockKey, number>>;
}

export interface YouthBlockDef { key: YouthBlockKey; name: string; icon: IconName; what: string; levels: YouthLevelDef[] }

export const YOUTH_BLOCKS: YouthBlockDef[] = [
  { key: 'coaches', name: 'Jugendtrainer', icon: 'staff', what: 'Qualität der Ausbildung – der stärkste Hebel, wirkt aber erst über Jahre.', levels: [
    { name: '—', desc: '', from: 0, build: 0, months: 0, upkeep: 0 },
    { name: 'Ehrenamtliche Übungsleiter', desc: 'Väter und Vereinsmitglieder gegen Aufwandsentschädigung.', from: 1975, build: 0, months: 0, upkeep: 1000 },
    { name: 'Lizenztrainer, nebenberuflich', desc: 'B-/A-Lizenz, Training nach Feierabend.', from: 1975, build: 0, months: 1, upkeep: 3000 },
    { name: 'Hauptamtliche Jugendtrainer', desc: 'Vollzeitkräfte mit A-Lizenz – 1975 noch die Ausnahme.', from: 1975, build: 0, months: 3, upkeep: 8000 },
    { name: 'Fußballlehrer im Nachwuchs', desc: 'Fußballlehrer leiten die älteren Jahrgänge.', from: 1985, build: 0, months: 4, upkeep: 10000 },
    { name: 'Ausbilder-Team (NLZ-Standard)', desc: 'Fußballlehrer, Torwart-, Athletik- und Individualtrainer mit gemeinsamer Spielidee.', from: 2001, build: 0, months: 6, upkeep: 12000 },
  ] },
  { key: 'pitches', name: 'Plätze & Halle', icon: 'facilities', what: 'Trainingszeit und -qualität, mehr Talente je Jahrgang.', levels: [
    { name: 'Nebenplatz (Asche)', desc: 'Die Jugend teilt sich den Ascheplatz mit allen.', from: 0, build: 0, months: 0, upkeep: 0 },
    { name: 'Eigener Rasenplatz', desc: 'Ein Platz nur für den Nachwuchs.', from: 1975, build: 30000, months: 4, upkeep: 5000 },
    { name: 'Zwei Plätze mit Flutlicht', desc: 'Training auch im Winter am Abend.', from: 1975, build: 80000, months: 8, upkeep: 10000 },
    { name: 'Kunstrasen & Halle', desc: 'Ganzjährig gute Bedingungen.', from: 1985, build: 250000, months: 14, upkeep: 20000 },
    { name: 'Nachwuchs-Campus', desc: 'Mehrere Plätze, Kabinen, Athletik- und Reha-Bereich an einem Ort.', from: 1998, build: 600000, months: 24, upkeep: 35000 },
  ] },
  { key: 'boarding', name: 'Internat', icon: 'dashVerein', what: 'Talente von außerhalb können kommen – entscheidend im Wettbewerb um Talente.', levels: [
    { name: 'kein Internat', desc: 'Nur Talente aus der Umgebung.', from: 0, build: 0, months: 0, upkeep: 0 },
    { name: 'Gastfamilien & Betreuer', desc: 'Auswärtige Talente wohnen bei Gastfamilien.', from: 1975, build: 0, months: 1, upkeep: 12000 },
    { name: 'Jugendhaus (Internat)', desc: 'Eigenes Haus mit Erziehern – ab Ende der 80er.', from: 1988, build: 150000, months: 12, upkeep: 25000 },
    { name: 'Internat im Campus', desc: 'Wohnen, Schule und Training an einem Ort.', from: 2003, build: 400000, months: 18, upkeep: 45000, needs: { pitches: 3 } },
  ] },
  { key: 'school', name: 'Schulkooperation', icon: 'wiki', what: 'Mehr Trainingszeit am Vormittag, Eltern vertrauen dem Verein.', levels: [
    { name: 'keine', desc: '', from: 0, build: 0, months: 0, upkeep: 0 },
    { name: 'Partnerschule', desc: 'Freistellungen und Hausaufgabenhilfe.', from: 1985, build: 0, months: 3, upkeep: 5000 },
    { name: 'Eliteschule des Fußballs', desc: 'DFB-Titel ab 2006: Training im Stundenplan.', from: 2006, build: 0, months: 6, upkeep: 12000, needs: { boarding: 2 } },
  ] },
  { key: 'science', name: 'Sportwissenschaft', icon: 'training', what: 'Ernährung, Leistungsdiagnostik, Psychologie – kleine Vorteile, erst spät verfügbar.', levels: [
    { name: 'keine', desc: '', from: 0, build: 0, months: 0, upkeep: 0 },
    { name: 'Ernährung & Leistungsdiagnostik', desc: 'Regelmäßige Tests, Ernährungsberatung.', from: 1995, build: 0, months: 2, upkeep: 10000 },
    { name: 'Sportpsychologie', desc: 'Psychologe für Druck, Rückschläge und Heimweh.', from: 2004, build: 0, months: 3, upkeep: 25000 },
    { name: 'Athletik- und Analyse-Team', desc: 'Datenbasierte Belastungssteuerung.', from: 2012, build: 0, months: 4, upkeep: 45000 },
  ] },
  { key: 'scouting', name: 'Scouting-Netz', icon: 'watchlist', what: 'Wie viele Talente du im Wettbewerb überhaupt kennst.', levels: [
    { name: 'lokal', desc: 'Man kennt die Talente aus der Stadt.', from: 0, build: 0, months: 0, upkeep: 0 },
    { name: 'regional', desc: 'Zwei Sichter im Umkreis.', from: 1975, build: 0, months: 2, upkeep: 6000 },
    { name: 'national', desc: 'Sichter-Netz in ganz Deutschland.', from: 1985, build: 0, months: 4, upkeep: 20000 },
    { name: 'international', desc: 'Partnervereine und Sichter im Ausland – nach Bosman.', from: 1996, build: 0, months: 6, upkeep: 50000, needs: { boarding: 1 } },
  ] },
  { key: 'reserve', name: 'Zweite Mannschaft', icon: 'squad', what: 'Spielpraxis für Eigengewächse bis 23, die bei den Profis (noch) nicht spielen.', levels: [
    { name: 'keine', desc: 'Junge Profis ohne Einsatz verkümmern auf der Bank.', from: 0, build: 0, months: 0, upkeep: 0 },
    { name: 'Amateure (Oberliga)', desc: 'Klassische Amateurmannschaft unterhalb der Profis.', from: 1975, build: 0, months: 1, upkeep: 40000 },
    { name: 'U23 (Regionalliga)', desc: 'Leistungsorientierte U23 mit Profitrainer – ab 1994.', from: 1994, build: 0, months: 2, upkeep: 90000 },
  ] },
];

export const BLOCK_BY_KEY = Object.fromEntries(YOUTH_BLOCKS.map((b) => [b.key, b])) as Record<YouthBlockKey, YouthBlockDef>;

export const ETAT_MIN = 10000;
export const ETAT_MAX = 150000;
export const ETAT_STEP = 5000;
/** Empfohlener Jugendetat (Wirkung flacht darüber ab). */
export const ETAT_REC = 60000;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Höchste in einem Jahr verfügbare Stufe eines Bausteins. */
export function maxLevelIn(key: YouthBlockKey, year: number): number {
  const lv = BLOCK_BY_KEY[key].levels;
  let m = 0;
  for (let i = 0; i < lv.length; i++) if (lv[i].from <= year) m = i;
  return m;
}

/** Benötigte Trainerzahl für volle Betreuung (7 Mannschaften G–A; ab dem NLZ mehr Spezialisten). */
export function coachesNeeded(year: number): number {
  return year >= 2001 ? 10 : 7;
}
export function coachCountMax(year: number): number {
  return year >= 2001 ? 14 : 10;
}

/** Erfüllt der Baustein seine Voraussetzungen für Stufe `lvl`? */
export function needsMet(inv: YouthInvest, key: YouthBlockKey, lvl: number): boolean {
  const n = BLOCK_BY_KEY[key].levels[lvl]?.needs;
  return !n || Object.entries(n).every(([k, v]) => (inv.levels[k as YouthBlockKey] ?? 0) >= (v as number));
}

// -----------------------------------------------------------------------------
// Kosten
// -----------------------------------------------------------------------------
/** Jährlicher Unterhalt aller Bausteine (ohne Etat), 1975-Basis. */
export function upkeepBase(inv: YouthInvest): number {
  let s = 0;
  for (const b of YOUTH_BLOCKS) {
    const l = inv.levels[b.key] ?? 0;
    const u = b.levels[l]?.upkeep ?? 0;
    s += b.key === 'coaches' ? u * inv.coachCount : u;
  }
  return s;
}

/** Jährliche Gesamtkosten (Unterhalt + Etat), 1975-Basis. */
export function annualCostBase(inv: YouthInvest): number {
  return upkeepBase(inv) + inv.budget;
}

/** Aufschlüsselung der Jahreskosten je Baustein (1975-Basis). */
export function costBreakdown(inv: YouthInvest): { label: string; base: number }[] {
  const rows = YOUTH_BLOCKS.map((b) => {
    const l = inv.levels[b.key] ?? 0;
    const u = b.levels[l]?.upkeep ?? 0;
    return { label: b.name, base: b.key === 'coaches' ? u * inv.coachCount : u };
  }).filter((r) => r.base > 0);
  rows.unshift({ label: 'Jugendetat', base: inv.budget });
  return rows;
}

// -----------------------------------------------------------------------------
// Wirkung
// -----------------------------------------------------------------------------
const COACH_Q = [0, 10, 21, 32, 42, 50];
const PITCH_Q = [0, 6, 11, 17, 22];
const BOARD_Q = [0, 3, 6, 8];
const SCHOOL_Q = [0, 3, 6];
const SCIENCE_Q = [0, 4, 7, 10];

/** Stufe der Plätze inkl. der alten Ausbaustufe „Jugendakademie“ des Vereinsgeländes. */
export function pitchLevel(club: Club, inv: YouthInvest): number {
  const legacy = Math.max(0, (club.infrastructure?.youthAcademy ?? 1) - 1);
  return clamp(Math.max(inv.levels.pitches ?? 0, Math.min(3, legacy)), 0, 4);
}

/**
 * Ziel-Ausbildungsqualität (0–100) aus den aktiven Bausteinen und dem Etat.
 * Trainer zählen nur so weit, wie genug von ihnen da sind.
 */
export function targetQuality(club: Club, inv: YouthInvest, year: number): number {
  const need = coachesNeeded(year);
  const cover = Math.min(1, inv.coachCount / need) + Math.min(0.12, Math.max(0, inv.coachCount - need) / need * 0.3);
  const coach = COACH_Q[inv.levels.coaches ?? 1] * cover;
  const etat = 12 * Math.min(1, Math.sqrt(inv.budget / ETAT_REC)) + 4 * clamp(Math.log2(Math.max(1, inv.budget / ETAT_REC)), 0, 1);
  const q = coach + PITCH_Q[pitchLevel(club, inv)] + etat + BOARD_Q[inv.levels.boarding ?? 0]
    + SCHOOL_Q[inv.levels.school ?? 0] + SCIENCE_Q[inv.levels.science ?? 0];
  return clamp(Math.round(q * 10) / 10, 0, 100);
}

/**
 * Gleichwertige alte Akademie-Stufe (1–5) für die Nachwuchs-Erzeugung
 * (Potenzialverteilung, Scouting-Genauigkeit): 60 % Qualität, 40 % Ruf.
 */
export function academyLevelOf(club: Club): number {
  const inv = club.youthInvest;
  if (!inv) return club.infrastructure?.youthAcademy ?? 1;
  return clamp(1 + (0.6 * inv.quality + 0.4 * inv.reputation) / 22, 1, 5);
}

/** Lernraten-Faktor der Jugendentwicklung (alt: 0,85–1,5 je Stufe). */
export function academyGrowthOf(club: Club): number {
  const inv = club.youthInvest;
  if (!inv) return [0, 0.85, 1.0, 1.15, 1.3, 1.5][clamp(Math.round(club.infrastructure?.youthAcademy ?? 1), 1, 5)];
  return 0.8 + inv.quality / 100 * 0.85;
}

/** Zusatz zur altersgerechten Obergrenze der Talente (gute Ausbildung → reifer mit 18/19). */
export function ageCapBonus(club: Club, age: number): number {
  const inv = club.youthInvest;
  if (!inv || age < 13) return 0;
  return inv.quality / 100 * 0.08 * Math.min(1, (age - 12) / 6);
}

/** Neue Bambini je Jahr (Breite: Etat, Plätze, Qualität). */
export function intakeCountOf(club: Club): number {
  const inv = club.youthInvest;
  if (!inv) return [0, 1, 2, 2, 3, 4][clamp(Math.round(club.infrastructure?.youthAcademy ?? 1), 1, 5)];
  return clamp(Math.round(1 + inv.quality / 45 + pitchLevel(club, inv) * 0.25 + (inv.budget >= ETAT_REC ? 0.5 : 0)), 1, 4);
}

/**
 * Hochzieh-Regel der KI zum Jahrgangsabschluss: wie viele Absolventen und ab
 * welchem Potenzial. Gute Akademien und Jugend-Trainer trauen mehr Talenten.
 */
export function cpuPromotionPolicy(club: Club): { max: number; minStars: number } {
  const inv = club.youthInvest;
  const phil = club.coach?.philosophy;
  const q = inv?.quality ?? 30;
  const max = 1 + (q >= 55 ? 1 : 0) + (phil === 'jugend' ? 1 : 0);
  const minStars = 3.5 - (q >= 55 ? 0.25 : 0) - (phil === 'jugend' ? 0.25 : 0) + (phil === 'einkauf' ? 0.25 : 0);
  return { max, minStars };
}

/** Gewicht einer Minute in der zweiten Mannschaft (Spielpraxis-Faktor). */
export const RESERVE_WEIGHT = [0, 0.4, 0.55];
/** Spielminuten je Woche in der zweiten Mannschaft (ein Spiel). */
export const RESERVE_MINUTES = 85;

/**
 * Effektive Reserve-Minuten dieser Woche für einen jungen Profi (≤ 23), der
 * aus einer Akademie kommt (ID mit „_y_“). Die zweite Mannschaft ist die Brücke
 * für Eigengewächse; eingekaufte junge Profis profitieren nicht – sonst stiege
 * die Zahl der Spitzenspieler ligaweit (Sim: Ø ≥85 in Liga 1 von 26 auf 38).
 */
export function reserveMinutesFor(club: Club, age: number, proMinutes: number, playerId = '_y_'): number {
  const lvl = club.youthInvest?.levels.reserve ?? 0;
  if (lvl <= 0 || age > 23 || !playerId.includes('_y_')) return 0;
  return Math.max(0, RESERVE_MINUTES - proMinutes) * RESERVE_WEIGHT[lvl];
}

// -----------------------------------------------------------------------------
// Anziehungskraft im Wettbewerb um Talente
// -----------------------------------------------------------------------------
/** Anziehungskraft eines Vereins für ein Talent (ohne Heimat-/Zufallsanteil). */
export function attraction(club: Club): number {
  const inv = club.youthInvest;
  if (!inv) return (club.reputation ?? 50) * 0.5;
  return 0.38 * inv.reputation + 0.27 * (club.reputation ?? 50) + 0.2 * inv.perspective + 0.15 * inv.quality;
}

/** Wie gut kennt das Scouting-Netz ein Talent? (Wahrscheinlichkeit 0–1) */
export function discoverChance(inv: YouthInvest | undefined, foreign: boolean, year: number): number {
  const lvl = inv?.levels.scouting ?? 0;
  if (foreign) return lvl >= 3 ? 0.85 : 0;
  // DFB-Talentförderprogramm (2002): Stützpunkte sichten flächendeckend.
  const tfp = year >= 2002 ? 0.12 : 0;
  return Math.min(0.95, [0.08, 0.3, 0.7, 0.85][lvl] + tfp);
}

/** Wie viele Talente kann die Akademie im Jahr zusätzlich aufnehmen? */
export function recruitCapacity(inv: YouthInvest | undefined): number {
  if (!inv) return 1;
  return 1 + (inv.levels.boarding ?? 0) + ((inv.levels.scouting ?? 0) >= 2 ? 1 : 0);
}

/** Abzug für ein auswärtiges Talent ohne Unterbringung. */
export function awayPenalty(inv: YouthInvest | undefined, age: number): number {
  const b = inv?.levels.boarding ?? 0;
  const base = [22, 9, 3, 0][b];
  return age >= 17 ? base * 0.5 : base;
}

// -----------------------------------------------------------------------------
// Leistungszentrum-Pflicht (Lizenzauflage)
// -----------------------------------------------------------------------------
/** Ab welcher Saison (Startjahr) gilt die Pflicht für eine Liga-Ebene? */
export function nlzDutyYear(tier: number): number | null {
  return tier === 1 ? 2001 : tier === 2 ? 2002 : null;
}

/** Mindestausstattung eines Leistungszentrums (vereinfacht). */
export const NLZ_MIN: Partial<Record<YouthBlockKey, number>> = { coaches: 4, pitches: 2, boarding: 1, school: 1 };
export const NLZ_MIN_COACHES = 8;

export function nlzMissing(club: Club, inv: YouthInvest): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(NLZ_MIN) as [YouthBlockKey, number][]) {
    const cur = k === 'pitches' ? pitchLevel(club, inv) : inv.levels[k] ?? 0;
    if (cur < v) out.push(`${BLOCK_BY_KEY[k].name}: ${BLOCK_BY_KEY[k].levels[v].name}`);
  }
  if (inv.coachCount < NLZ_MIN_COACHES) out.push(`mindestens ${NLZ_MIN_COACHES} Jugendtrainer`);
  return out;
}

// -----------------------------------------------------------------------------
// Startwerte (neues Spiel / alter Spielstand)
// -----------------------------------------------------------------------------
/** Startausstattung aus der alten Akademie-Stufe (1–5), dem Ansehen und der Epoche. */
export function initialInvest(club: Club, year: number): YouthInvest {
  const L = clamp(Math.round(club.infrastructure?.youthAcademy ?? 1), 1, 5);
  const rep = club.reputation ?? 55;
  const cap = (k: YouthBlockKey, v: number) => Math.min(maxLevelIn(k, year), Math.max(0, v));
  const modern = year >= 2001 ? 2 : year >= 1990 ? 1 : 0;
  const levels: Record<YouthBlockKey, number> = {
    coaches: Math.max(1, cap('coaches', 1 + (L >= 2 ? 1 : 0) + (L >= 4 ? 1 : 0) + modern)),
    pitches: cap('pitches', L - 1 + (modern >= 2 ? 1 : 0)),
    boarding: cap('boarding', (L >= 4 ? 1 : 0) + modern),
    school: cap('school', modern),
    science: cap('science', modern >= 2 ? 1 : 0),
    scouting: cap('scouting', (L >= 3 ? 1 : 0) + (L >= 5 ? 1 : 0) + (modern >= 1 ? 1 : 0)),
    reserve: cap('reserve', rep >= 55 ? 1 + (modern >= 2 && L >= 3 ? 1 : 0) : 0),
  };
  const inv: YouthInvest = {
    levels,
    coachCount: Math.min(coachCountMax(year), 4 + L + (modern >= 2 ? 3 : 0)),
    budget: 15000 + L * 8000,
    builds: [], quality: 0, reputation: 0, perspective: 30,
  };
  inv.quality = targetQuality(club, inv, year);
  inv.reputation = Math.round(clamp(0.55 * inv.quality + 0.35 * rep, 5, 90));
  return inv;
}
