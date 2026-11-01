// =============================================================================
// ARBEITSMARKT FÜR TRAINER UND BETREUER — über die Jahrzehnte simuliert
// -----------------------------------------------------------------------------
// Alle Personen außerhalb deines Vereins stehen in `game.staffWorld.people`:
// vereinslos (Bewerber) oder bei einem KI-Verein angestellt (`clubId`).
//   • Karriereende: Spieler gehen mit einer Wahrscheinlichkeit ins Trainer-
//     geschäft (game/squads.ts → staffFromRetired). Erfolgreiche Spieler (Titel,
//     Einsätze, Spitzenstärke, Kapitän) häufiger und mit höherem Potenzial;
//     Stärken aus Spielerattributen/Persönlichkeit (engine/staffSkills.ts).
//     Sehr erfolgreiche Führungsspieler landen teils direkt im Cheftrainer-Pool.
//   • Quereinsteiger füllen jede Rolle auf (Sportlehrer, Sportwissenschaftler,
//     später Analysten und Psychologen).
//   • Saisonwechsel: Altern, Ruhestand, Lernen im Beruf (Erfolg beschleunigt),
//     Vertragsenden, KI-Vereine stellen nach ihrem Ruf ein und werben ab,
//     gute Co-Trainer steigen zum Cheftrainer auf (game.coachPool).
// Der eigene Verein hat seine Leute in `game.staff` (game/staffGame.ts).
// =============================================================================
import { Game } from './state';
import { Club, ClubCoach, Player } from '../types';
import { isLeagueClub } from '../engine/clubEconomy';
import { makeCoach } from '../engine/aiManager';
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import { StaffMember } from '../engine/staffPeople';
import { personaOf } from '../engine/persona';
import {
  AI_TRACKED_ROLES, ExProInfo, careerSuccess, coachingChance, demandFactor, learnSeason, makeOutsider,
  skillsFromQuality, specialtyOfSkills, staffFromPlayer, syncQuality, TEAM_ROLE_IDS, teamRolesAvailable,
} from '../engine/staffSkills';
import { recordBook } from './clubRecords';

export interface StaffWorldLog { season: string; exPros: number; outsiders: number; promoted: number; retired: number; hires: number }
export interface StaffWorld {
  v: 1;
  people: StaffMember[];
  /** Kurzer Verlauf je Saison (Zugänge/Abgänge des Marktes). */
  log: StaffWorldLog[];
  /** Laufende Saison (Zähler bis zum nächsten Saisonwechsel). */
  cur: StaffWorldLog;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const yearOf = (d: string) => Number(d.slice(0, 4));
/** Mindestens so viele Bewerber je Rolle sollen frei sein. */
const MIN_FREE = 6;
/** Obergrenze des freien Pools (Spielstandgröße). */
const MAX_FREE = 170;

function emptyLog(season: string): StaffWorldLog { return { season, exPros: 0, outsiders: 0, promoted: 0, retired: 0, hires: 0 }; }

/** Ziel-Qualität eines Vereins (Ruf → Anspruch an sein Trainerteam). */
export function clubStaffTarget(c: Club): number {
  return clamp(3 + (c.reputation ?? 60) * 0.13, 5, 17);
}

function aiClubs(g: Game): Club[] {
  return Object.values(g.clubs).filter((c) => isLeagueClub(c) && c.id !== g.managedClubId);
}

function contractEndIn(date: string, years: number): string {
  return `${yearOf(date) + years}-06-30`;
}

export function ensureStaffWorld(g: Game, rng: () => number = Math.random): StaffWorld {
  if (g.staffWorld && g.staffWorld.v === 1) return g.staffWorld;
  const date = g.calendar.currentDate;
  const year = yearOf(date);
  const w: StaffWorld = { v: 1, people: [], log: [], cur: emptyLog(g.season) };
  g.staffWorld = w;
  // Startbesetzung der KI-Vereine: passend zum Ruf, gemischt aus Ex-Profis (Name aus dem Pool) und Quereinsteigern.
  for (const c of aiClubs(g)) {
    for (const role of AI_TRACKED_ROLES) {
      if (!staffAvailable(STAFF_BY_ID[role], year)) continue;
      const m = makeOutsider(year, rng, role);
      tuneTo(m, clubStaffTarget(c) + (rng() - 0.5) * 5);
      if (rng() < 0.45 && role !== 'videoanalyst') m.exPro = syntheticExPro(m, rng);
      hireInto(m, c.id, date, 1 + Math.floor(rng() * 3));
      w.people.push(m);
    }
  }
  refillFree(g, w, year, rng);
  return w;
}

/** Fachgebiete so verschieben, dass die Rollenqualität etwa `q` beträgt. */
function tuneTo(m: StaffMember, q: number): void {
  if (!m.skills || !m.pot) return;
  const d = clamp(q, 2, 19) - m.quality;
  for (const k of Object.keys(m.skills) as (keyof typeof m.skills)[]) {
    m.skills[k] = clamp(Math.round(((m.skills[k] ?? 1) + d) * 10) / 10, 1, 20);
    m.pot[k] = clamp(Math.max(m.pot[k] ?? 1, (m.skills[k] ?? 1) + 1), 1, 20);
  }
  syncQuality(m);
  m.salaryFactor = demandFactor(m);
}

/** Startbesetzung 1975: Ex-Profi ohne Spielstand-Spieler (Karriere vor 1975). */
function syntheticExPro(m: StaffMember, rng: () => number): ExProInfo {
  const s = Math.round(rng() * rng() * 70) / 100;
  return { pos: m.roleId === 'torwarttrainer' ? 'TW' : ['VS', 'ZM', 'MS', 'AV', 'OM'][Math.floor(rng() * 5)], peak: Math.round(62 + s * 25), apps: Math.round(80 + s * 300), titles: s > 0.5 ? 1 : 0, s, clubs: [] };
}

function hireInto(m: StaffMember, clubId: string, date: string, years: number): void {
  m.clubId = clubId;
  m.hired = date;
  m.contractEnd = contractEndIn(date, years);
  m.freeSince = undefined;
  m.loyalty = clamp(m.loyalty, 20, 90);
}

function freeUp(m: StaffMember, year: number): void {
  m.clubId = undefined;
  m.contractEnd = undefined;
  m.freeSince = year;
}

// -----------------------------------------------------------------------------
// Karriereende eines Spielers (aus game/squads.ts)
// -----------------------------------------------------------------------------
/** Titel, an denen der Spieler mitgewirkt hat (Saison im Verein mit ≥ 8 Einsätzen). */
function playerTitles(g: Game, p: Player): number {
  const book = recordBook(g);
  if (!book) return 0;
  let n = 0;
  for (const st of p.history?.stations ?? []) {
    if (st.appearances < 8) continue;
    n += (book.titles[st.clubId] ?? []).filter(([, season]) => season === st.season).length;
  }
  return n;
}

export function exProInfoOf(g: Game, p: Player): ExProInfo {
  const peak = Math.max(p.overall, ...(p.development.abilityHistory ?? []).map((h) => h.ability));
  const apps = p.careerStats?.appearances ?? 0;
  const titles = playerTitles(g, p);
  const captain = g.clubs[p.clubId]?.tactics?.captainId === p.id;
  const s = careerSuccess(peak, apps, titles, captain, p.attributes.leadership ?? 50);
  const clubs: string[] = [];
  for (const st of p.history?.stations ?? []) if (st.clubName && clubs[clubs.length - 1] !== st.clubName) clubs.push(st.clubName);
  return { pos: p.naturalPosition, peak, apps, titles, captain: captain || undefined, s, clubs: clubs.slice(-3) };
}

/**
 * Spieler beendet die Karriere: mit einer Wahrscheinlichkeit (Erfolg, Führung)
 * wird er Trainer/Betreuer auf dem Arbeitsmarkt; sehr erfolgreiche Führungsspieler
 * gehen teils direkt in den Cheftrainer-Pool der KI.
 * @returns die neue Person (oder null)
 */
export function staffFromRetired(g: Game, p: Player, date: string, rng: () => number = Math.random): StaffMember | null {
  if (!g.staffWorld || p.isYouth) return null;
  const info = exProInfoOf(g, p);
  const lead = p.attributes.leadership ?? 50;
  if (rng() >= coachingChance(info.s, lead, p.age)) return null;
  const year = yearOf(date);
  const pe = personaOf(p);
  const m = staffFromPlayer(p, info, year, { loyal: pe.loyalitaet, family: pe.familie, ambition: pe.ehrgeiz }, rng);
  m.freeSince = year;
  const w = g.staffWorld;
  w.cur.exPros++;
  // Große Namen mit Führungsqualität: direkt als Cheftrainer-Kandidat.
  if (info.s >= 0.45 && lead >= 60 && rng() < 0.22 + info.s * 0.25) {
    (g.coachPool ??= []).push(toClubCoach(m, year, date, rng));
    w.cur.promoted++;
    return m;
  }
  w.people.push(m);
  return m;
}

/** Person aus dem Trainerteam wird Cheftrainer-Kandidat der KI (game.coachPool). */
function toClubCoach(m: StaffMember, year: number, date: string, rng: () => number): ClubCoach {
  const q = m.skills ? ((m.skills.taktik ?? 8) * 0.5 + (m.skills.mental ?? 8) * 0.3 + (m.skills.technik ?? 8) * 0.2) : m.quality;
  const rep = clamp(Math.round(18 + q * 2.6 + (m.exPro?.s ?? 0) * 22 + rng() * 8), 15, 95);
  const c = makeCoach(year, rep, date, rng);
  c.name = m.name;
  c.age = m.age;
  if (m.nat) c.nationality = m.nat;
  c.reputation = rep;
  return c;
}

// -----------------------------------------------------------------------------
// Saisonwechsel
// -----------------------------------------------------------------------------
/** Erfolg eines Vereins in der abgelaufenen Saison 0–1 (Tabellenplatz der Spielerliga). */
function clubSuccess(g: Game, clubId: string): number {
  const rows = g.table?.rows ?? [];
  const row = rows.find((r) => r.clubId === clubId);
  if (!row || rows.length < 2) return 0.4;
  return clamp(1 - (row.position - 1) / (rows.length - 1), 0, 1);
}

/** Jahres-Lauf des Marktes. Aufruf zum Saisonwechsel (game/staffGame.ts). */
export function staffWorldSeason(g: Game, date: string, rng: () => number = Math.random): StaffWorldLog {
  const w = ensureStaffWorld(g, rng);
  const year = yearOf(date);
  const log = w.cur;
  const keep: StaffMember[] = [];
  const pool = (g.coachPool ??= []);
  for (const m of w.people) {
    if (!m.skills) skillsFromQuality(m, rng);
    m.age++;
    // Ruhestand
    if (m.age >= 69 || (m.age >= 63 && rng() < 0.3) || (!m.clubId && m.age >= 58 && (m.freeSince ?? year) <= year - 3 && rng() < 0.5)) {
      log.retired++;
      continue;
    }
    const employed = !!m.clubId && !!g.clubs[m.clubId];
    if (m.clubId && !employed) freeUp(m, year);
    learnSeason(m, employed, employed ? clubSuccess(g, m.clubId!) : 0, rng);
    if (employed) m.methodYear = rng() < 0.35 ? year : m.methodYear;
    m.specialty = specialtyOfSkills(m.skills!, m.roleId);
    // Aufstieg: guter Co-Trainer wird Cheftrainer-Kandidat.
    if (m.roleId === 'cotrainer' && m.quality >= 14 && m.age >= 36 && m.age <= 56 && rng() < (m.clubId ? 0.08 : 0.2) + (m.quality - 14) * 0.03) {
      pool.push(toClubCoach(m, year, date, rng));
      log.promoted++;
      continue;
    }
    // Vertragsende bei KI-Vereinen: meist Verlängerung.
    if (m.clubId && m.contractEnd && m.contractEnd <= date) {
      if (rng() < 0.68) m.contractEnd = contractEndIn(date, 1 + Math.floor(rng() * 3));
      else freeUp(m, year);
    }
    keep.push(m);
  }
  w.people = keep;
  aiHiring(g, w, date, rng);
  refillFree(g, w, year, rng);
  if (pool.length > 60) { pool.sort((a, b) => b.reputation - a.reputation); pool.length = 60; }
  w.log.push(log);
  if (w.log.length > 60) w.log.splice(0, w.log.length - 60);
  w.cur = emptyLog(g.season);
  return log;
}

/** KI-Vereine besetzen freie Stellen und werben bessere Leute ab. */
function aiHiring(g: Game, w: StaffWorld, date: string, rng: () => number): void {
  const year = yearOf(date);
  const byClub = new Map<string, Map<string, StaffMember>>();
  for (const m of w.people) {
    if (!m.clubId) continue;
    let mm = byClub.get(m.clubId);
    if (!mm) byClub.set(m.clubId, (mm = new Map()));
    if (mm.has(m.roleId)) freeUp(m, year); // doppelt besetzt → einer geht
    else mm.set(m.roleId, m);
  }
  // Große Vereine zuerst – sie bekommen die Besten.
  const clubs = aiClubs(g).sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
  for (const c of clubs) {
    const mine = byClub.get(c.id) ?? new Map<string, StaffMember>();
    const target = clubStaffTarget(c);
    for (const role of AI_TRACKED_ROLES) {
      if (!staffAvailable(STAFF_BY_ID[role], year)) continue;
      const cur = mine.get(role);
      if (cur && cur.quality >= target - 3) continue;
      const free = w.people.filter((m) => !m.clubId && m.roleId === role && m.age < 64);
      const score = (m: StaffMember) => m.quality - Math.max(0, m.quality - target - 2) * 0.8 + rng() * 2.5 + (m.exPro ? m.exPro.s * 2 : 0);
      const best = free.sort((a, b) => score(b) - score(a))[0];
      if (!best || (cur && best.quality <= cur.quality + 1)) continue;
      if (cur) freeUp(cur, year);
      hireInto(best, c.id, date, 1 + Math.floor(rng() * 3));
      best.salaryFactor = demandFactor(best, c.reputation ?? 60);
      mine.set(role, best);
      w.cur.hires++;
    }
  }
}

/** Quereinsteiger, bis jede verfügbare Rolle genug Bewerber hat; Pool begrenzen. */
function refillFree(g: Game, w: StaffWorld, year: number, rng: () => number): void {
  for (const role of teamRolesAvailable(year)) {
    let n = w.people.filter((m) => !m.clubId && m.roleId === role).length;
    const want = role === 'cheftrainer' || role === 'fussballpsychologe' ? 3 : MIN_FREE;
    while (n < want) {
      w.people.push({ ...makeOutsider(year, rng, role), freeSince: year });
      w.cur.outsiders++;
      n++;
    }
  }
  const free = w.people.filter((m) => !m.clubId);
  if (free.length > MAX_FREE) {
    // Die am wenigsten gefragten gehen zuerst (alt, schwach, lange ohne Stelle) – aber nie unter die Mindestzahl je Rolle.
    const per = new Map<string, number>();
    for (const m of free) per.set(m.roleId, (per.get(m.roleId) ?? 0) + 1);
    const drop = new Set<StaffMember>();
    const sorted = free.sort((a, b) => (a.quality - a.age * 0.1 - (year - (a.freeSince ?? year))) - (b.quality - b.age * 0.1 - (year - (b.freeSince ?? year))));
    for (const m of sorted) {
      if (free.length - drop.size <= MAX_FREE) break;
      if ((per.get(m.roleId) ?? 0) <= MIN_FREE) continue;
      per.set(m.roleId, (per.get(m.roleId) ?? 0) - 1);
      drop.add(m);
    }
    w.people = w.people.filter((m) => !drop.has(m));
  }
}

// -----------------------------------------------------------------------------
// Abfragen
// -----------------------------------------------------------------------------
/** Personal eines KI-Vereins. */
export function staffOfClub(g: Game, clubId: string): StaffMember[] {
  return (g.staffWorld?.people ?? []).filter((m) => m.clubId === clubId);
}

/** Zusatz zum Trainingsfaktor je KI-Verein aus seinem Trainerteam (−0,03 … +0,08). */
export function aiStaffExtras(g: Game): Map<string, number> {
  const sum = new Map<string, { q: number; n: number }>();
  for (const m of g.staffWorld?.people ?? []) {
    if (!m.clubId || (m.roleId !== 'cotrainer' && m.roleId !== 'konditionstrainer' && m.roleId !== 'athletiktrainer')) continue;
    const s = sum.get(m.clubId) ?? { q: 0, n: 0 };
    s.q += m.quality; s.n++;
    sum.set(m.clubId, s);
  }
  const out = new Map<string, number>();
  for (const [id, s] of sum) out.set(id, clamp((s.q / s.n - 10) / 90, -0.03, 0.08));
  return out;
}

/** Arbeitsmarkt für eine Rolle (für deinen Verein): Vereinslose zuerst, dann Angestellte anderer Vereine. */
export function marketForRole(g: Game, roleId: string | 'all'): StaffMember[] {
  const ok = (m: StaffMember) => (roleId === 'all' ? TEAM_ROLE_IDS.has(m.roleId) : m.roleId === roleId);
  return (g.staffWorld?.people ?? []).filter(ok).sort((a, b) => Number(!!a.clubId) - Number(!!b.clubId) || b.quality - a.quality);
}

/** Alte Spielstände: Fachgebiete/Verträge des eigenen Stabs + Arbeitsmarkt anlegen. */
export function migrateStaffPeople(g: Game, rng: () => number = Math.random): void {
  for (const m of g.staff ?? []) {
    if (!m.skills) skillsFromQuality(m, rng);
    if (!m.contractEnd) m.contractEnd = contractEndIn(g.calendar.currentDate, 1 + (Number(g.calendar.currentDate.slice(5, 7)) >= 7 ? 1 : 0));
  }
  ensureStaffWorld(g, rng);
}
