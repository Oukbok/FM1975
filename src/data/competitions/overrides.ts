// =============================================================================
// WETTBEWERBE IM DATENSATZ (Wunsch Pascal: „Im Editor muss jeder Wettbewerb
// editierbar sein … Perioden, in welchen das Reglement mehr oder weniger gleich ist“)
// -----------------------------------------------------------------------------
// Speicher der aktiven Überschreibungen (Datensatz-Feld `competitions`, gesetzt in
// data/dataset/apply.ts). Absichtlich ohne Abhängigkeiten: die Namens- und
// Formatfunktionen der Wettbewerbe (euroFormats, superCups, leagueNames …) fragen
// hier nach, ob für eine Saison etwas überschrieben ist – fehlt der Eintrag, gilt
// das eingebaute Verhalten unverändert.
//
// Perioden: Saison-Startjahre `from`–`to` (einschließlich, 9999 = offen). Jedes Feld
// ist optional; ein fehlendes Feld heißt „wie im Standard für diese Saison“.
// Standard-Perioden und Bedeutung der Felder: data/competitions/registry.ts.
// =============================================================================

export type CompSuperFormat = 'final' | 'legs2' | 'four' | 'six';

export interface CompPeriod {
  /** Erste Saison (Startjahr, z. B. 1992 = 1992/93). */
  from: number;
  /** Letzte Saison (Startjahr, 9999 = offen). */
  to: number;
  name?: string;
  short?: string;
  /** Gezeichnete Trophäe (Form aus TrophyArt, z. B. `henkel`). */
  trophy?: string;
  /** Eigenes Trophäenbild (Data-URL WebP/JPEG/PNG, im Editor verkleinert). */
  trophyImg?: string;
  /** Wird der Wettbewerb ausgetragen? (nur Supercups; fehlt = wie im Standard) */
  held?: boolean;
  /** Startplätze je Land nach Rang der Fünfjahreswertung: [bis Rang, Plätze] aufsteigend. */
  slots?: [number, number][];
  /** Landespokal: Startplatz des Pokalsiegers. */
  cupTo?: 'cwc' | 'uefa' | 'none';
  /** Landespokal: Wiederholungsspiel bei Remis nach Verlängerung (Runden / Finale). */
  replayRounds?: boolean;
  replayFinal?: boolean;
  /** Europapokal: Auswärtstorregel, Punkte je Sieg, Hin-/Rückspiel und Name je K.-o.-Runde (Schlüssel der Runde). */
  awayGoals?: boolean;
  winPts?: 2 | 3;
  legs?: Record<string, 1 | 2>;
  stageNames?: Record<string, string>;
  /** Supercup: Modus, Gegner beim Double, Heimrecht, Monat, direkt Elfmeterschießen, geteilter Titel. */
  superFormat?: CompSuperFormat;
  double?: 'cupFinalist' | 'runnerUp';
  host?: 'champion' | 'other' | 'neutral';
  month?: number;
  directPens?: boolean;
  shared?: boolean;
}

let active: Record<string, CompPeriod[]> = {};
let anyActive = false;
let version = 0;
let compYear = 1975;

const IMG = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const bool = (v: unknown) => (typeof v === 'boolean' ? v : undefined);

/** Nur gültige Perioden übernehmen (fremde Dateien dürfen das Spiel nicht stören). */
export function cleanCompetitions(x: unknown): Record<string, CompPeriod[]> {
  const out: Record<string, CompPeriod[]> = {};
  if (!x || typeof x !== 'object' || Array.isArray(x)) return out;
  for (const [id, list] of Object.entries(x as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const ps: CompPeriod[] = [];
    for (const raw of list as CompPeriod[]) {
      if (!raw || typeof raw !== 'object') continue;
      const from = Math.round(Number(raw.from)), to = Math.round(Number(raw.to));
      if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) continue;
      const p: CompPeriod = { from, to };
      const name = str(raw.name); if (name) p.name = name;
      const short = str(raw.short); if (short) p.short = short;
      const trophy = str(raw.trophy); if (trophy) p.trophy = trophy;
      if (typeof raw.trophyImg === 'string' && IMG.test(raw.trophyImg)) p.trophyImg = raw.trophyImg;
      const held = bool(raw.held); if (held !== undefined) p.held = held;
      if (Array.isArray(raw.slots)) {
        const s = raw.slots.filter((b) => Array.isArray(b) && Number.isFinite(b[0]) && Number.isFinite(b[1]) && b[0] >= 1 && b[1] >= 0)
          .map((b) => [Math.round(b[0]), Math.min(8, Math.round(b[1]))] as [number, number]).sort((a, b) => a[0] - b[0]);
        if (s.length) p.slots = s;
      }
      if (raw.cupTo === 'cwc' || raw.cupTo === 'uefa' || raw.cupTo === 'none') p.cupTo = raw.cupTo;
      const rr = bool(raw.replayRounds); if (rr !== undefined) p.replayRounds = rr;
      const rf = bool(raw.replayFinal); if (rf !== undefined) p.replayFinal = rf;
      const ag = bool(raw.awayGoals); if (ag !== undefined) p.awayGoals = ag;
      if (raw.winPts === 2 || raw.winPts === 3) p.winPts = raw.winPts;
      if (raw.legs && typeof raw.legs === 'object') {
        const l: Record<string, 1 | 2> = {};
        for (const [k, v] of Object.entries(raw.legs)) if (v === 1 || v === 2) l[k] = v;
        if (Object.keys(l).length) p.legs = l;
      }
      if (raw.stageNames && typeof raw.stageNames === 'object') {
        const l: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw.stageNames)) { const s = str(v); if (s) l[k] = s; }
        if (Object.keys(l).length) p.stageNames = l;
      }
      if (raw.superFormat === 'final' || raw.superFormat === 'legs2' || raw.superFormat === 'four' || raw.superFormat === 'six') p.superFormat = raw.superFormat;
      if (raw.double === 'cupFinalist' || raw.double === 'runnerUp') p.double = raw.double;
      if (raw.host === 'champion' || raw.host === 'other' || raw.host === 'neutral') p.host = raw.host;
      if (Number.isInteger(raw.month) && raw.month! >= 1 && raw.month! <= 12) p.month = raw.month;
      const dp = bool(raw.directPens); if (dp !== undefined) p.directPens = dp;
      const sh = bool(raw.shared); if (sh !== undefined) p.shared = sh;
      ps.push(p);
    }
    if (ps.length) out[id] = ps.sort((a, b) => a.from - b.from);
  }
  return out;
}

/** Überschreibungen des aktiven Datensatzes setzen (apply.ts). */
export function setCompetitionOverrides(x: unknown): void {
  active = cleanCompetitions(x);
  anyActive = Object.keys(active).length > 0;
  version++;
}

/** Zähler, der bei jedem Datensatzwechsel steigt (Zwischenspeicher der Formate). */
export const competitionOverrideVersion = (): number => version;

/** Periode des Datensatzes, die die Saison (Startjahr) enthält; null = Standard. */
export function compPeriod(id: string, startYear: number): CompPeriod | null {
  if (!anyActive) return null;
  const list = active[id];
  if (!list) return null;
  for (const p of list) if (startYear >= p.from && startYear <= p.to) return p;
  return null;
}

/** Hat der Datensatz für den Wettbewerb überhaupt Perioden? */
export const hasCompOverride = (id: string): boolean => anyActive && !!active[id];

/**
 * Laufende Saison (Startjahr) für Namen, die ohne Saison abgefragt werden (Ligennamen,
 * Kalender). Gesetzt von newGame/Laden/processDay/App; Standard 1975.
 */
export function setCompetitionDate(iso: string | null): void {
  if (!iso) { compYear = 1975; return; }
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7));
  if (Number.isFinite(y)) compYear = m >= 7 ? y : y - 1;
}
export const competitionYear = (): number => compYear;

/** Name aus dem Datensatz oder der übergebene Standard (für Stellen mit festem Text). */
export function compNameOr(id: string, startYear: number, fallback: string): string {
  return compPeriod(id, startYear)?.name ?? fallback;
}
/** Landespokal (Heimatland): Name der Saison. */
export const cupName = (startYear = compYear): string => compNameOr('cup', startYear, 'Landespokal');
/** WM/EM der Nationalteams (Gattungsbegriffe, Wunsch Pascal: trotzdem umbenennbar). */
export const natTournamentName = (kind: 'WM' | 'EM', year: number): string =>
  compNameOr(kind === 'WM' ? 'nat:wm' : 'nat:em', year, kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft');
