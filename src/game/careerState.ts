// =============================================================================
// TRAINERKARRIERE — Zustand, Ansehen, Stationen (ohne Spielablauf)
// -----------------------------------------------------------------------------
// Optionales Feld `game.career` (fehlt bei alten Spielständen → `ensureCareer`
// legt es an, idempotent). Ablauf (Angebote, Entlassung) in game/careerGame.ts,
// Vereinswechsel in game/careerSwitch.ts.
// =============================================================================
import { CoachRecord } from '../types';
import { seasonExpectation } from '../engine/environment';
import { isForeignId } from '../engine/world';
import { recordNow } from './coachRecord';
import { recordBook } from './clubRecords';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface CareerSeason {
  season: string;
  tier: number;
  pos: number;
  size: number;
  goal?: string;
  /** Ziel erreicht? */
  ok?: boolean;
  /** Änderung des Ansehens durch diese Saison. */
  dRep?: number;
  titles?: string[];
}

export interface CareerStint {
  clubId: string;
  clubName: string;
  from: string;
  to?: string;
  /** Wie die Station endete. */
  end?: 'wechsel' | 'entlassen';
  /** Liga bei Amtsantritt. */
  tier: number;
  rec?: CoachRecord;
  seasons: CareerSeason[];
  /** Jahresgehalt (1975-Basis, nur Kennzahl). */
  wage?: number;
  /** Alter Spielstand: Bilanz erst ab dieser Saison gezählt. */
  recFrom?: string;
}

export interface JobOffer {
  id: string;
  clubId: string;
  clubName: string;
  tier: number;
  /** Größe des Vereins (Ruf, um die Liga bereinigt). */
  level: number;
  /** Wechsel sofort (gleiche Liga) oder zum Saisonende. */
  when: 'sofort' | 'saisonende';
  /** Jahresgehalt (1975-Basis). */
  wage: number;
  /** Saisonziel des Vorstands. */
  goal: string;
  /** Zugesagtes Transferbudget (1975-Basis). */
  budget: number;
  date: string;
  deadline: string;
  /** Nach der Entlassung: eine Wahl ist Pflicht. */
  forced?: boolean;
  /** Bereits nachverhandelt. */
  improved?: boolean;
  /** Grund (Anzeige): z. B. „Trainer entlassen“. */
  why?: string;
}

export interface CareerEvent { date: string; text: string }

export interface CareerState {
  v: 1;
  /** Dein Ansehen als Trainer 0–100. */
  rep: number;
  stints: CareerStint[];
  /** Offene Angebote (mit Nachricht). */
  offers: JobOffer[];
  /** Angenommenes Angebot, das zum Saisonwechsel wirksam wird. */
  pendingMove?: JobOffer & { fromId: string; reason: 'wechsel' | 'entlassen' };
  /** Abgelehnte Vereine: Verein → Saison. */
  declined: Record<string, string>;
  /** Angebote insgesamt / Entlassungen. */
  offerCount: number;
  sacked: number;
  /** Chronik der Karriere (kurz). */
  log: CareerEvent[];
  /** Vorstand hat eine letzte Chance gegeben (Saison). */
  lastChance?: string;
}

const BG_BONUS: Record<string, number> = { legend: 8, ex_pro: 3, tactician: 0, rookie: -5 };

export function isCareerMode(g: Game): boolean {
  return g.manager?.startMode === 'career';
}

/** Spielt der eigene Verein in der Spielerliga (volle Kader)? */
export function playerTier(g: Game): number {
  return g.leagues?.playerDivision?.tier ?? 1;
}

/** Liga eines Vereins (Spielerliga oder Sim-Liga). */
export function tierOf(g: Game, id: string): number | null {
  if (g.clubs[id] && g.table.rows.some((r) => r.clubId === id)) return playerTier(g);
  return g.simClubs?.[id]?.tier ?? null;
}

/** Größe eines Vereins als Arbeitgeber: Ruf, bereinigt um die Liga (≈ 30–95). */
export function jobLevel(g: Game, id: string): number {
  const tier = tierOf(g, id) ?? 3;
  const full = g.clubs[id];
  const rep = full ? full.reputation ?? 60 : clamp(Math.round((g.simClubs?.[id]?.strength ?? 50) - 6), 35, 80);
  return Math.round(rep - (tier - 1) * 7);
}

/** Kann der Verein dein Arbeitgeber werden? (deutsche Ligen 1–2, keine DDR vor 1991, kein Ausland) */
export function isJobClub(g: Game, id: string): boolean {
  if (isForeignId(id) || id.startsWith('am') || id.startsWith('x_')) return false;
  const sc = g.simClubs?.[id];
  if (sc) return !sc.ddr && !String(sc.group ?? '').startsWith('ddr') && sc.tier >= 1 && sc.tier <= 2;
  return !!g.clubs[id] && g.table.rows.some((r) => r.clubId === id);
}

export function clubNameOf(g: Game, id: string): string {
  return g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? id;
}

/** Jahresgehalt eines Trainers bei einem Verein dieser Größe (1975-Basis). */
export function managerWageFor(level: number, rep: number): number {
  const base = 40000 + Math.pow(Math.max(0, level - 40), 1.6) * 600;
  return Math.round(base * (0.85 + clamp(rep - level, -15, 20) / 60) / 1000) * 1000;
}

/** Saisonziel, das ein Verein seinem neuen Trainer nennt (aus der Stärke in seiner Liga). */
export function goalFor(g: Game, id: string): string {
  const tier = tierOf(g, id) ?? 2;
  const full = g.clubs[id];
  if (full && g.table.rows.some((r) => r.clubId === id)) {
    const str = (cid: string) => {
      const o = (g.clubs[cid]?.playerIds ?? []).map((p) => g.players[p]?.overall ?? 0).sort((a, b) => b - a).slice(0, 14);
      return o.reduce((a, b) => a + b, 0) / Math.max(1, o.length);
    };
    const ids = g.table.rows.map((r) => r.clubId);
    const ranked = [...ids].sort((a, b) => str(b) - str(a));
    return seasonExpectation(ranked.indexOf(id) + 1, ids.length, tier);
  }
  const div = g.leagues?.otherDivisions.find((d) => d.clubIds.includes(id));
  const ids = div?.clubIds ?? [id];
  const ranked = [...ids].sort((a, b) => (g.simClubs?.[b]?.strength ?? 0) - (g.simClubs?.[a]?.strength ?? 0));
  return seasonExpectation(ranked.indexOf(id) + 1, ids.length, tier);
}

/** Karriere-Zustand anlegen bzw. ergänzen (alte Spielstände, idempotent). */
export function ensureCareer(g: Game): CareerState {
  if (g.career?.v === 1) {
    const c = g.career;
    c.offers ??= []; c.declined ??= {}; c.log ??= []; c.stints ??= []; c.offerCount ??= 0; c.sacked ??= 0;
    if (!c.stints.length) c.stints.push(startStint(g, true));
    return c;
  }
  const own = g.managedClubId;
  const rep = clamp(jobLevel(g, own) + (BG_BONUS[g.manager?.background] ?? 0) - (isCareerMode(g) ? 3 : 0), 20, 92);
  const first = startStint(g, true);
  backfillStint(g, first);
  g.career = { v: 1, rep, stints: [first], offers: [], declined: {}, offerCount: 0, sacked: 0, log: [] };
  return g.career;
}

/** Station beim aktuellen Verein beginnen. */
export function startStint(g: Game, initial = false): CareerStint {
  const id = g.managedClubId;
  const startYear = Number(g.season.slice(0, 4));
  // Jedes Spiel beginnt 1975/76; vor der Karriere gab es keinen Vereinswechsel → erste Station seit Spielbeginn.
  const from = initial ? '1975-07-01' : g.calendar.currentDate;
  const recFrom = initial && startYear > 1975 ? g.season : undefined;
  return {
    clubId: id, clubName: clubNameOf(g, id), from, tier: playerTier(g), seasons: [],
    wage: managerWageFor(jobLevel(g, id), g.career?.rep ?? jobLevel(g, id)), recFrom,
    // Bilanz alter Spielstände erst ab der laufenden Saison (frühere Spielpläne sind nicht gespeichert).
    rec: recFrom ? { w: 0, d: 0, l: 0, upTo: `${startYear}-06-30` } : undefined,
  };
}

const TITLE_DE: Record<string, string> = { meister: 'Meisterschaft', pokal: 'Pokalsieg', ec: 'Europapokal', cwc: 'Europapokal', uefa: 'Europapokal' };

/**
 * Alter Spielstand: Saisons und Ligabilanz seit 1975 aus der Vereins-Historie
 * (game/clubRecords.ts: Endplätze, Titel, direkter Vergleich) nachtragen.
 */
function backfillStint(g: Game, st: CareerStint): void {
  const book = recordBook(g);
  if (!book) return;
  const cur = g.season;
  for (const [season, tier, pos, size] of book.seasons[st.clubId] ?? []) {
    if (season >= cur || season < '1975/76') continue; // Historie vor Spielbeginn gehört nicht zu dir
    const titles = (book.titles[st.clubId] ?? []).filter(([, s2]) => s2 === season).map(([k]) => TITLE_DE[k]).filter(Boolean);
    st.seasons.push({ season, tier, pos, size, titles: titles.length ? titles : undefined });
  }
  if (book.h2hClub !== st.clubId) return;
  const r = { w: 0, d: 0, l: 0 };
  let n = 0;
  for (const list of Object.values(book.h2h)) for (const [season, , comp, , a, b] of list) {
    if (comp !== 'L' || season >= cur) continue;
    n++;
    if (a > b) r.w++; else if (a < b) r.l++; else r.d++;
  }
  if (!n && st.recFrom) return;
  st.rec = { ...r, upTo: `${Number(cur.slice(0, 4))}-06-30` };
  st.recFrom = undefined;
}

export function currentStint(g: Game): CareerStint {
  const c = ensureCareer(g);
  let s = c.stints[c.stints.length - 1];
  if (!s || s.to || s.clubId !== g.managedClubId) { s = startStint(g); c.stints.push(s); }
  return s;
}

/** Bilanz einer Station (gespeichert + laufende Saison). */
export function stintRecord(g: Game, s: CareerStint): CoachRecord {
  if (s.to) return s.rec ?? { w: 0, d: 0, l: 0 };
  return recordNow(g, s.clubId, s.from, s.rec);
}

export function careerLog(g: Game, text: string): void {
  const c = ensureCareer(g);
  c.log.push({ date: g.calendar.currentDate, text });
  if (c.log.length > 60) c.log.splice(0, c.log.length - 60);
}

/** Wörtliche Einordnung des Ansehens. */
export function repLabel(rep: number): string {
  return rep >= 85 ? 'Weltklasse-Trainer' : rep >= 75 ? 'Spitzentrainer' : rep >= 65 ? 'Gefragter Bundesliga-Trainer'
    : rep >= 55 ? 'Etablierter Trainer' : rep >= 45 ? 'Solider Trainer' : 'Unbeschriebenes Blatt';
}
