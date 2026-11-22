// =============================================================================
// ARBEITSMARKT FÜR MITARBEITER — ein Pool für alle Stellen, über die Jahrzehnte
// -----------------------------------------------------------------------------
// Wunsch Pascal: Mitarbeiter sind Personen wie Spieler. Alle Personen außerhalb
// deines Vereins stehen in `game.staffWorld.people`: vereinslos (Bewerber) oder
// bei einem KI-Verein angestellt (`clubId`). Jede Person kommt für JEDE Stelle
// infrage – wie gut, sagt ihre Eignung (engine/staffSkills.ts). `roleId` einer
// vereinslosen Person ist nur die Stelle, in der sie am meisten taugt.
//   • Karriereende: Spieler bleiben mit einer Wahrscheinlichkeit im Fußball
//     (game/squads.ts → staffFromRetired) – als Trainer, Scout, später auch in
//     der sportlichen Leitung. Erfolgreiche Spieler häufiger und mit höherem
//     Potenzial; frühere Spieler DEINES Vereins melden sich bei dir und warten
//     ein Jahr auf ein Angebot, bevor die Konkurrenz zugreift.
//   • Quereinsteiger aus vielen Berufen und jedes Jahr ein Jahrgang junger
//     Nachwuchskräfte (engine/staffGen.ts); für jede Stelle, die es in der Zeit
//     gibt, stehen immer einige geeignete Bewerber bereit.
//   • Saisonwechsel: Altern, Ruhestand, Lernen im Beruf (Erfolg beschleunigt),
//     Vertragsenden, KI-Vereine stellen nach ihrem Ruf ein und werben ab,
//     gute Co-Trainer steigen zum Cheftrainer auf (game.coachPool).
//   • Cheftrainer: freie Trainer des Trainerpools und Trainer kleinerer Vereine
//     stehen als Personen auf dem Markt (`coachAsStaff`).
// Der eigene Verein hat seine Leute in `game.staff` (game/staffGame.ts).
// =============================================================================
import { Game, hashSeed } from './state';
import { Club, ClubCoach, Player } from '../types';
import { isLeagueClub } from '../engine/clubEconomy';
import { makeCoach } from '../engine/aiManager';
import { makeMessage, pushMessage } from '../engine/messages';
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import { StaffMember } from '../engine/staffPeople';
import { personaOf } from '../engine/persona';
import {
  AI_TRACKED_ROLES, bestRole, demandFactor, ExProInfo, learnSeason, roleFit, ROLE_SKILLS, rolesAvailable, roleName, specialtyOfSkills,
  syncQuality, TEAM_ROLE_IDS,
} from '../engine/staffSkills';
import {
  careerSuccess, coachAsStaff, coachingChance, coachRepOf, makeOutsider, skillsFromQuality, snapshotOf, staffFromPlayer,
} from '../engine/staffGen';
import { recordBook } from './clubRecords';
import { aiStaffSeason, ensureAiStaff } from './staffAi';

export interface StaffWorldLog { season: string; exPros: number; outsiders: number; promoted: number; retired: number; hires: number }
export interface StaffWorld {
  /** 2 = ein Pool für alle Stellen, 13 Fähigkeiten. */
  v: 1 | 2;
  people: StaffMember[];
  /** Kurzer Verlauf je Saison (Zugänge/Abgänge des Marktes). */
  log: StaffWorldLog[];
  /** Laufende Saison (Zähler bis zum nächsten Saisonwechsel). */
  cur: StaffWorldLog;
  /** 1 = KI-Vereine haben einen vollen Stab (game/staffAi.ts); fehlt = alter Spielstand, wird beim Laden einmalig besetzt. */
  ai?: 1;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const yearOf = (d: string) => Number(d.slice(0, 4));
/** Ab dieser Eignung (1–20) gilt ein Bewerber als brauchbar für eine Stelle. */
const FIT_OK = 7;
/** So viele brauchbare Bewerber je Stelle sollen frei sein. */
const MIN_PER_ROLE = 4;
/** Jahrgang junger Nachwuchskräfte je Saison. */
const NEWCOMERS = 18;
/** Zusätzliche Bewerber zu Spielbeginn (bunt gemischt nach Berufen). */
const INITIAL_EXTRA = 120;
/** Obergrenze des freien Pools (Spielstandgröße). */
const MAX_FREE = 320;

function emptyLog(season: string): StaffWorldLog { return { season, exPros: 0, outsiders: 0, promoted: 0, retired: 0, hires: 0 }; }

/** Ziel-Qualität eines Vereins (Ruf → Anspruch an sein Trainerteam). */
export function clubStaffTarget(c: Club): number {
  return clamp(3 + (c.reputation ?? 60) * 0.13, 5, 17);
}

/** KI-Vereine mit vollem Kader im Heimatland (in Simulationen auch der eigene, den dann die KI führt). */
export function aiClubs(g: Game): Club[] {
  const sim = !!(g as Game & { simAutoManage?: boolean }).simAutoManage;
  return Object.values(g.clubs).filter((c) => isLeagueClub(c) && (sim || c.id !== g.managedClubId));
}

export function contractEndIn(date: string, years: number): string {
  return `${yearOf(date) + years}-06-30`;
}

/** Eigener, deterministischer Zufall für die Erstbesetzung (verbraucht kein Math.random). */
export function seededRng(key: string): () => number {
  let a = hashSeed(key) >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function ensureStaffWorld(g: Game, rngIn?: () => number): StaffWorld {
  if (g.staffWorld?.v === 2) return g.staffWorld;
  const rng = rngIn ?? seededRng(`staff:${g.managedClubId}:${g.calendar.currentDate}`);
  const date = g.calendar.currentDate;
  const year = yearOf(date);
  if (g.staffWorld) {
    // Älterer Spielstand (acht Fachgebiete, Bewerber je Rolle): Fähigkeiten ergänzen, Pool auf alle Stellen erweitern.
    const w = g.staffWorld;
    for (const m of w.people) skillsFromQuality(m, rng);
    w.v = 2;
    refillFree(g, w, year, rng, INITIAL_EXTRA / 2);
    announceStaff2(g);
    return w;
  }
  const w: StaffWorld = { v: 2, people: [], log: [], cur: emptyLog(g.season) };
  g.staffWorld = w;
  // Startbesetzung der KI-Vereine: voller Stab passend zu Ruf und Epoche (game/staffAi.ts), dazu einige Ex-Profis.
  refillFree(g, w, year, rng, INITIAL_EXTRA);
  ensureAiStaff(g, rng);
  for (const m of w.people) if (m.clubId && !m.exPro && !m.coach && rng() < 0.4 && (m.roleId === 'cotrainer' || m.roleId === 'torwarttrainer')) markExPro(m, rng);
  return w;
}

/** Älterer Spielstand: einmal erklären, was neu ist – und was dem eigenen Trainerteam fehlt. */
function announceStaff2(g: Game): void {
  if ((g as Game & { simAutoManage?: boolean }).simAutoManage || !g.clubs[g.managedClubId]) return;
  const staff = g.staff ?? [];
  const head = staff.some((m) => m.roleId === 'cheftrainer');
  const co = staff.filter((m) => m.roleId === 'cotrainer').length;
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'training', from: 'Geschäftsstelle',
    subject: 'Neu: Mitarbeiter sind Personen wie Spieler',
    shortText: head ? 'Jede Person taugt für jede Stelle – wie gut, zeigt ihre Eignung.' : 'Dein Verein braucht einen Cheftrainer – ohne ihn leidet die Entwicklung der Spieler.',
    bodyText: 'Jeder Mitarbeiter hat jetzt 13 Fähigkeiten und eine Eignung für jede Stelle im Verein (Stärke 1–99, wie bei Spielern). Der Arbeitsmarkt ist ein gemeinsamer Pool für alle Stellen – auch Ärzte, Scouts und die Verwaltung holst du von dort. Mitarbeiter lernen im Beruf dazu, lassen im Alter nach, und eigene Leute kannst du auf eine andere Stelle versetzen.\n\n'
      + 'Wichtig für die Entwicklung deiner Spieler:\n'
      + '• Das Niveau deines Trainerteams (65 % Cheftrainer, 35 % Co-Trainer) steht jedem Spieler gegenüber. Sein volles Potenzial erreicht er nur, wenn das Niveau im Bereich seines Potenzials liegt. Liegt es klar über seiner heutigen Stärke, lernt er schneller.\n'
      + '• Ohne Cheftrainer und mit zu wenigen Co-Trainern für die Größe des Vereins leidet das Training deutlich.\n\n'
      + (head ? '' : 'Derzeit hast du KEINEN Cheftrainer. ') + `Co-Trainer: ${co}. `
      + 'Wen dein Trainerteam bremst und wer besonders profitiert, zeigt Training › Trainerteam in der Ansicht „Wirkung“.',
  }));
}

/** Fähigkeiten so verschieben, dass die Eignung für die eigene Stelle etwa `q` beträgt. */
export function tuneTo(m: StaffMember, q: number): void {
  if (!m.skills || !m.pot) return;
  const d = clamp(q, 2, 19) - roleFit(m.skills, m.roleId, m.quality);
  const mine = ROLE_SKILLS[m.roleId] ?? {};
  for (const k of Object.keys(m.skills) as (keyof typeof m.skills)[]) {
    // Nur was die Stelle ausmacht, verschiebt sich voll – sonst wäre jeder Gute ein Alleskönner.
    m.skills[k] = clamp(Math.round(((m.skills[k] ?? 1) + d * (mine[k] ? 1 : 0.2)) * 10) / 10, 1, 20);
    m.pot[k] = clamp(Math.max(m.pot[k] ?? 1, (m.skills[k] ?? 1) + (mine[k] ? 1 : 0.5)), 1, 20);
  }
  syncQuality(m);
  m.salaryFactor = demandFactor(m);
}

/** Startbesetzung: Ex-Profi ohne Spielstand-Spieler (Karriere vor Spielbeginn). */
function markExPro(m: StaffMember, rng: () => number): void {
  // Erfolg passend zur heutigen Güte (gute Trainer waren eher gute Spieler), mit Streuung.
  const s = Math.round(clamp((m.quality - 6) / 14 + (rng() - 0.5) * 0.3, 0, 0.9) * 100) / 100;
  m.exPro = { pos: m.roleId === 'torwarttrainer' || m.bg === 'torwartspezialist' ? 'TW' : ['IV', 'ZM', 'MS', 'RV', 'OM', 'LV', 'DM', 'RA'][Math.floor(rng() * 8)], peak: Math.round(62 + s * 25), apps: Math.round(80 + s * 300), titles: s > 0.5 ? 1 : 0, s, clubs: [] };
  m.bg = undefined;
}

export function hireInto(m: StaffMember, clubId: string, date: string, years: number): void {
  m.clubId = clubId;
  m.hired = date;
  m.contractEnd = contractEndIn(date, years);
  m.freeSince = undefined;
  m.loyalty = clamp(m.loyalty, 20, 90);
}

export function freeUp(m: StaffMember, year: number): void {
  m.clubId = undefined;
  m.contractEnd = undefined;
  m.freeSince = year;
}

/** Ein Mitarbeiter deines Vereins wurde abgeworben: Er arbeitet beim neuen Verein weiter (Cheftrainer gehen in den Trainerpool der Liga). */
export function staffMovedTo(g: Game, m: StaffMember, clubId: string, date: string, rng: () => number = Math.random): void {
  const w = ensureStaffWorld(g);
  const year = yearOf(date);
  // Cheftrainer zu einem deutschen Verein: über den Trainerpool (dort führt das Trainerkarussell); ins Ausland: direkt angestellt.
  if (m.roleId === 'cheftrainer' && (g.clubs[clubId] || !g.euroClubs?.[clubId])) { (g.coachPool ??= []).push(toClubCoach(m, year, date, rng)); return; }
  const cur = w.people.find((x) => x.clubId === clubId && x.roleId === m.roleId);
  if (cur) freeUp(cur, year);
  const moved: StaffMember = { ...m, coach: m.roleId === 'cheftrainer' ? m.coach : undefined, deal: undefined };
  hireInto(moved, clubId, date, 2);
  w.people.push(moved);
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
  const by = new Map<string, number>();
  for (const st of p.history?.stations ?? []) {
    if (st.clubName && clubs[clubs.length - 1] !== st.clubName) clubs.push(st.clubName);
    by.set(st.clubId, (by.get(st.clubId) ?? 0) + st.appearances);
  }
  const cids = [...by.entries()].filter(([, n]) => n >= 30).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  return { pos: p.naturalPosition, peak, apps, titles, captain: captain || undefined, s, clubs: clubs.slice(-3), cids: cids.length ? cids.slice(0, 4) : undefined };
}

/** Verein, mit dem ein früherer Spieler verbunden ist: letzter Verein oder der mit den meisten Einsätzen (ab 60). */
function homeClubOf(p: Player, info: ExProInfo): string | undefined {
  if (info.cids?.includes(p.clubId)) return p.clubId;
  const by = new Map<string, number>();
  for (const st of p.history?.stations ?? []) by.set(st.clubId, (by.get(st.clubId) ?? 0) + st.appearances);
  const top = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 60 ? top[0] : undefined;
}

/**
 * Spieler beendet die Karriere: mit einer Wahrscheinlichkeit (Erfolg, Führung)
 * bleibt er im Fußball und steht auf dem Arbeitsmarkt; sehr erfolgreiche
 * Führungsspieler gehen teils direkt in den Cheftrainer-Pool der KI.
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
  // Selbstauswahl: Wer kaum Begabung dafür hat, lässt es meist bleiben.
  if (m.quality < 3 || (m.quality < 5 && rng() < 0.8)) return null;
  m.home = homeClubOf(p, info);
  const w = g.staffWorld;
  w.cur.exPros++;
  const mine = m.home === g.managedClubId && !(g as Game & { simAutoManage?: boolean }).simAutoManage;
  // Große Namen mit Führungsqualität: direkt als Cheftrainer-Kandidat (nicht, wenn er zu deinem Verein gehört – er fragt erst dich).
  if (!mine && info.s >= 0.45 && lead >= 60 && rng() < 0.22 + info.s * 0.25) {
    (g.coachPool ??= []).push(toClubCoach(m, year, date, rng));
    w.cur.promoted++;
    return m;
  }
  w.people.push(m);
  if (mine) {
    pushMessage(g.messages, makeMessage({
      date, category: 'general', from: m.name,
      subject: `${m.name} möchte dem Verein erhalten bleiben`,
      shortText: `Dein früherer Spieler sucht eine Aufgabe – am ehesten als ${roleName(m.roleId)}.`,
      bodyText: `${m.name} hat seine Laufbahn beendet und möchte im Fußball bleiben – am liebsten bei uns. Nach ${info.apps} Spielen als Profi sieht er sich am ehesten als ${roleName(m.roleId)}.\n\n`
        + `Noch fehlt ihm die Erfahrung im neuen Beruf, aber er kann hineinwachsen. Bis zum nächsten Sommer wartet er auf ein Angebot von uns, und er käme uns beim Gehalt entgegen. Du findest ihn auf dem Arbeitsmarkt unter Training › Trainerteam bzw. Verein › Mitarbeiter.`,
    }));
  }
  return m;
}

/** Person aus dem Trainerteam wird Cheftrainer-Kandidat der KI (game.coachPool); ihre Fähigkeiten bleiben erhalten. */
export function toClubCoach(m: StaffMember, year: number, date: string, rng: () => number): ClubCoach {
  // Ansehen aus den Fähigkeiten; wer noch nie Cheftrainer war, muss sich erst einen Namen machen (−8).
  const rep = m.coach && Math.abs(coachRepOf(m) - m.coach.rep) < 3 ? m.coach.rep : clamp(coachRepOf(m) - (m.coach ? 0 : 8) + Math.round(rng() * 4 - 2), 15, 95);
  const c = makeCoach(year, rep, date, rng);
  c.name = m.name;
  c.age = m.age;
  if (m.nat) c.nationality = m.nat;
  c.reputation = rep;
  if (m.coach) { c.id = m.coach.id; c.style = m.coach.style; c.philosophy = m.coach.philosophy; if (m.coach.formation) c.preferredFormation = m.coach.formation; }
  c.sm = snapshotOf(m);
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
  const avail = rolesAvailable(year);
  for (const m of w.people) {
    if (!m.skills) skillsFromQuality(m, rng);
    m.age++;
    const idle = m.clubId ? 0 : year - (m.freeSince ?? year);
    // Ruhestand – oder Berufswechsel nach langer Zeit ohne Stelle.
    if (m.age >= 69 || (m.age >= 63 && rng() < 0.3) || (idle >= 3 && m.age >= 58 && rng() < 0.5) || (idle >= 6 && rng() < 0.35)) {
      log.retired++;
      continue;
    }
    // Angestellt: bei einem vollen Verein, einem Sim-Verein oder im Ausland (schlanke Stäbe, game/staffLean.ts).
    const employed = !!m.clubId && (!!g.clubs[m.clubId] || !!g.simClubs?.[m.clubId] || !!g.euroClubs?.[m.clubId]);
    if (m.clubId && !employed) freeUp(m, year);
    learnSeason(m, employed, employed ? clubSuccess(g, m.clubId!) : 0, rng);
    if (employed) m.methodYear = rng() < 0.35 ? year : m.methodYear;
    // Vereinslose: die Stelle, in der sie heute am meisten taugen (nur bei klarem Abstand wechseln).
    if (!employed) {
      const b = bestRole(m.skills!, year, avail);
      if (!avail.includes(m.roleId) || roleFit(m.skills, b, 1) >= roleFit(m.skills, m.roleId, 1) + 1) { m.roleId = b; syncQuality(m); }
      m.salaryFactor = demandFactor(m);
    }
    m.specialty = specialtyOfSkills(m.skills!, m.roleId);
    // Aufstieg: guter Co-Trainer wird Cheftrainer-Kandidat (nicht im ersten Jahr, wenn er auf dein Angebot wartet).
    const waits = m.home === g.managedClubId && m.freeSince === year - 1;
    const headFit = roleFit(m.skills, 'cheftrainer', 1);
    if (m.roleId === 'cotrainer' && !waits && headFit >= 13 && m.age >= 36 && m.age <= 56 && rng() < (m.clubId ? 0.08 : 0.2) + (headFit - 13) * 0.03) {
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
  aiStaffSeason(g, w, date, rng);
  refillFree(g, w, year, rng, NEWCOMERS);
  if (pool.length > 60) { pool.sort((a, b) => b.reputation - a.reputation); pool.length = 60; }
  w.log.push(log);
  if (w.log.length > 60) w.log.splice(0, w.log.length - 60);
  w.cur = emptyLog(g.season);
  return log;
}

/**
 * Pool auffüllen: `extra` neue Leute (ein Jahrgang Nachwuchskräfte, zu Spielbeginn bunt gemischt),
 * dann für jede Stelle der Zeit genug brauchbare Bewerber; zuletzt den Pool begrenzen.
 */
function refillFree(g: Game, w: StaffWorld, year: number, rng: () => number, extra: number): void {
  // Unter den Neuen sind ehemalige Spieler aus Ligen außerhalb der Spielerliga (Trainer, Torwartspezialisten, Späher).
  const add = (m: StaffMember) => {
    if (!m.exPro && (m.bg === 'amateurtrainer' || m.bg === 'torwartspezialist' || m.bg === 'talentspaeher') && rng() < 0.6) { markExPro(m, rng); w.cur.exPros++; } else w.cur.outsiders++;
    w.people.push({ ...m, freeSince: year });
  };
  const initial = extra > NEWCOMERS;
  for (let i = 0; i < extra; i++) add(makeOutsider(year, rng, undefined, !initial || i % 3 === 0));
  const roles = rolesAvailable(year);
  for (const role of roles) {
    const want = role === 'cheftrainer' ? 2 : MIN_PER_ROLE;
    let n = 0;
    for (const m of w.people) if (!m.clubId && m.age < 62 && roleFit(m.skills, role, 1) >= FIT_OK) n++;
    for (let guard = 0; n < want && guard < 10; guard++) {
      const m = makeOutsider(year, rng, role);
      if (roleFit(m.skills, role, 1) < FIT_OK) tuneTo(m, FIT_OK + rng() * 3);
      add(m);
      n++;
    }
  }
  const free = w.people.filter((m) => !m.clubId);
  if (free.length <= MAX_FREE) return;
  // Die am wenigsten gefragten gehen zuerst (alt, schwach, lange ohne Stelle) – nie die besten vier einer Stelle.
  const keep = new Set<StaffMember>();
  for (const role of roles) {
    [...free].sort((a, b) => roleFit(b.skills, role, 1) - roleFit(a.skills, role, 1)).slice(0, MIN_PER_ROLE).forEach((m) => keep.add(m));
  }
  const worth = (m: StaffMember) => m.quality - Math.max(0, m.age - 50) * 0.2 - (year - (m.freeSince ?? year)) * 0.8 + (m.home === g.managedClubId ? 5 : 0);
  const drop = new Set<StaffMember>();
  for (const m of [...free].sort((a, b) => worth(a) - worth(b))) {
    if (free.length - drop.size <= MAX_FREE) break;
    if (!keep.has(m)) drop.add(m);
  }
  if (drop.size) w.people = w.people.filter((m) => !drop.has(m));
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

/** Person vom Arbeitsmarkt – auch ein Cheftrainer aus dem Trainerpool oder von einem KI-Verein (`cp:<id>`). */
export function findPerson(g: Game, id: string): StaffMember | null {
  const m = g.staffWorld?.people.find((x) => x.id === id);
  if (m) return m;
  return headCoachMarket(g, false).find((x) => x.id === id) ?? null;
}

/** Cheftrainer auf dem Markt: freie aus dem Trainerpool, auf Wunsch auch die Trainer der KI-Vereine. */
export function headCoachMarket(g: Game, onlyFree: boolean): StaffMember[] {
  const year = yearOf(g.calendar.currentDate);
  const out = (g.coachPool ?? []).map((c) => coachAsStaff(c, year));
  if (!onlyFree) {
    const today = g.calendar.currentDate;
    for (const c of aiClubs(g)) {
      if (!c.coach || c.id === g.managedClubId) continue;
      // Vertrag des KI-Trainers: zwei bis drei Jahre ab Amtsantritt, mindestens bis zum nächsten Sommer (nicht gespeichert).
      const since = c.coach.since || today;
      let end = yearOf(since) + (Number(since.slice(5, 7)) >= 7 ? 1 : 0) + 1 + (hashSeed(c.coach.id) % 2);
      const next = yearOf(today) + (Number(today.slice(5, 7)) >= 7 ? 1 : 0);
      if (end < next) end = next + (hashSeed(c.coach.id + today.slice(0, 4)) % 2);
      out.push({ ...coachAsStaff(c.coach, year), clubId: c.id, hired: since, contractEnd: `${end}-06-30` });
    }
  }
  return out;
}

export interface MarketFilter {
  /** Stelle, nach deren Eignung sortiert wird ('all' = beste Stelle der Person). */
  role: string;
  onlyFree?: boolean;
  /** Nur angestellte Personen (bei KI-Vereinen, Sim-Vereinen, im Ausland). */
  onlyEmployed?: boolean;
  /** Nur Personen dieses Vereins. */
  clubId?: string;
  /** Mindestwerte je Fähigkeit (1–20). */
  min?: Partial<Record<string, number>>;
  maxAge?: number;
  exPro?: boolean;
  /** Nur Stellen dieser Liste (bei role = 'all'): beste Stelle der Person muss dazugehören. */
  roles?: string[];
}
export interface MarketRow { m: StaffMember; /** Eignung 1–20 (fein) für die gesuchte bzw. beste Stelle. */ fit: number; role: string }

/** Arbeitsmarkt (für deinen Verein): beste Eignung zuerst; Vereinslose vor Angestellten bei Gleichstand. */
export function staffMarket(g: Game, f: MarketFilter): MarketRow[] {
  const year = yearOf(g.calendar.currentDate);
  const people: StaffMember[] = (g.staffWorld?.people ?? []).filter((m) => (!f.onlyFree || !m.clubId) && (!f.onlyEmployed || !!m.clubId) && (!f.clubId || m.clubId === f.clubId));
  if (f.role === 'cheftrainer' || f.role === 'all') {
    people.push(...headCoachMarket(g, !!f.onlyFree).filter((m) => (!f.onlyEmployed || !!m.clubId) && (!f.clubId || m.clubId === f.clubId)));
  }
  const avail = new Set(rolesAvailable(year));
  const rows: MarketRow[] = [];
  for (const m of people) {
    if (f.maxAge && m.age > f.maxAge) continue;
    if (f.exPro && !m.exPro) continue;
    if (f.min && Object.entries(f.min).some(([k, v]) => v != null && ((m.skills as Record<string, number> | undefined)?.[k] ?? 0) < v)) continue;
    let role = f.role, fit: number;
    if (role === 'all') {
      role = avail.has(m.roleId) ? m.roleId : bestRole(m.skills ?? {}, year);
      if (f.roles && !f.roles.includes(role)) {
        // Beste Stelle unter den gefragten.
        role = f.roles.filter((r) => avail.has(r)).sort((a, b) => roleFit(m.skills, b, 1) - roleFit(m.skills, a, 1))[0];
        if (!role || roleFit(m.skills, role, 1) < FIT_OK - 2) continue;
      }
    }
    fit = roleFit(m.skills, role, 1);
    rows.push({ m, fit, role });
  }
  return rows.sort((a, b) => b.fit - a.fit || Number(!!a.m.clubId) - Number(!!b.m.clubId) || a.m.age - b.m.age);
}

/** Arbeitsmarkt für eine Stelle als Personenliste (ältere Aufrufer). */
export function marketForRole(g: Game, roleId: string | 'all'): StaffMember[] {
  return staffMarket(g, { role: roleId, roles: roleId === 'all' ? [...TEAM_ROLE_IDS] : undefined }).map((r) => r.m);
}

/** Alte Spielstände: Fähigkeiten/Verträge des eigenen Stabs + Arbeitsmarkt anlegen bzw. erweitern. */
export function migrateStaffPeople(g: Game, rngIn?: () => number): void {
  const rng = rngIn ?? seededRng(`staffmig:${g.managedClubId}:${g.calendar.currentDate}`);
  for (const m of g.staff ?? []) {
    skillsFromQuality(m, rng);
    if (!m.contractEnd) m.contractEnd = contractEndIn(g.calendar.currentDate, 1 + (Number(g.calendar.currentDate.slice(5, 7)) >= 7 ? 1 : 0));
  }
  ensureStaffWorld(g, rngIn);
  // Älterer Spielstand ohne KI-Stäbe: einmalig besetzen (Markierung staffWorld.ai).
  ensureAiStaff(g, rngIn);
}
