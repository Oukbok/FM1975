// =============================================================================
// STÄBE DER KI-VEREINE (Wunsch Pascal: „Spitzentrainer kann sich nicht jeder
// Bundesligist leisten. Andere Vereine müssen auch Trainer anstellen und die
// entsprechenden Effekte bekommen.“)
// -----------------------------------------------------------------------------
// • Volle Vereine im Heimatland (Kader im Spielstand, `staffedClubs`): eine Person
//   je Stelle aus `STAFF_W` aus dem gemeinsamen Pool `game.staffWorld` – nach Ruf,
//   Kasse und Epoche (`aiStaffTarget`); neue Berufe besetzen zuerst die großen
//   Vereine (`aiWantsRole`), kleine Vereine haben Lücken. Große Vereine wählen
//   zuerst und werben kleineren gelegentlich Schlüsselleute ab (Ablöse über
//   game/staffPoach.ts). Gehälter gehen monatlich in die KI-Finanzen.
// • Schlanke Vereine (Sim-Vereine der 2. Ebene, Spitzenvereine im Ausland):
//   nur wenige Schlüsselstellen, damit Personen aus dem Pool verschwinden und
//   dort angestellt zu sehen sind (`leanSeason`). Keine Wirkung.
// • Gespeichert wird nur die Person (`clubId` am Mitarbeiter im Pool); die
//   Zuordnung Verein → Stab entsteht beim Lesen (`staffIndex`).
// • Trainerkarussell: Eigener Co-Trainer als Nachfolger (`internalSuccessor`),
//   ein neuer Cheftrainer bringt manchmal seinen Co-Trainer mit (`afterCoachChange`).
// Wirkung (Spielstärke, Verletzungen): game/staffGame.ts.
// =============================================================================
import { Club, ClubCoach } from '../types';
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { memberMonthlySalary, StaffMember } from '../engine/staffPeople';
import { demandFactor, roleFit, specialtyOfSkills, syncQuality } from '../engine/staffSkills';
import { coachAsStaff, coachRepOf, makeOutsider } from '../engine/staffGen';
import { hash01 } from '../engine/transferMarket';
import { aiClubs, clubStaffTarget, ensureStaffWorld, freeUp, hireInto, StaffWorld, toClubCoach, tuneTo } from './staffWorld';
import { poachFee } from './staffPoach';
import { leanSeason } from './staffLean';
import type { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Gewicht je Stelle für die Spielstärke (game/staffGame.ts `staffStrengthFor`) – zugleich die Stellen, die KI-Vereine besetzen. */
export const STAFF_W: Record<string, number> = {
  cotrainer: 1, torwarttrainer: 0.6, mannschaftsarzt: 1, masseur: 0.5, physio_haupt: 0.8, konditionstrainer: 0.7,
  athletiktrainer: 0.7, reha_trainer: 0.4, leistungsdiag: 0.4, ernaehrung: 0.3, sportpsychologe: 0.4, head_performance: 0.5,
  sportwissenschaftler: 0.3, belastungsmanager: 0.4, return_to_play: 0.3, fussballpsychologe: 0.3, gegnerbeobachter: 0.6,
  videoanalyst: 0.6, spielanalyst: 0.6, datenanalyst: 0.4, head_data: 0.3, sportl_leiter: 0.5, sportdirektor: 0.5,
  zeugwart: 0.2, platzwart: 0.3, kaufm_leiter: 0.2, verwaltung: 0.2,
};
export const AI_STAFF_ROLES = Object.keys(STAFF_W);
/** Stellen, um die große Vereine bei kleineren werben. */
const KEY_ROLES = new Set(['cotrainer', 'torwarttrainer', 'mannschaftsarzt', 'physio_haupt', 'konditionstrainer', 'athletiktrainer', 'spielanalyst', 'sportdirektor']);
/** Höchstens so viele Abwerbungen unter KI-Vereinen je Saison (maßvoll). */
const AI_POACH_MAX = 5;

const isSim = (g: Game) => !!(g as Game & { simAutoManage?: boolean }).simAutoManage;
const available = (role: string, year: number) => !!STAFF_BY_ID[role] && staffAvailable(STAFF_BY_ID[role], year);

/** Vereine mit vollem Stab: volle Kader im Heimatland ohne den eigenen (in Simulationen mit ihm). */
export function staffedClubs(g: Game): Club[] { return aiClubs(g); }

/** Verein → angestellte Personen (aus dem Pool). */
export function staffIndex(g: Game): Map<string, StaffMember[]> {
  const out = new Map<string, StaffMember[]>();
  for (const m of g.staffWorld?.people ?? []) {
    if (!m.clubId) continue;
    const l = out.get(m.clubId);
    if (l) l.push(m); else out.set(m.clubId, [m]);
  }
  return out;
}

/** Epochengewicht 0,5 (1975) … 1 (ab 2010) – wie die Wirkung auf die Spielstärke. */
export const eraWeight = (year: number): number => 0.5 + 0.5 * clamp((year - 1975) / 35, 0, 1);

/**
 * Anspruch eines KI-Vereins an seine Leute (Eignung 1–20): Ruf, dazu die Kasse
 * (Schulden → sparen) und mit der Epoche ein größerer Abstand zwischen reich und klein.
 */
export function aiStaffTarget(c: Club, year: number): number {
  const rep = c.reputation ?? 60;
  let t = clubStaffTarget(c) + eraWeight(year) * (rep - 70) / 24;
  const bal = c.finances?.balance ?? 0;
  if (bal < 0) t -= 1.5;
  return clamp(t, 4, 18);
}

/**
 * Besetzt der Verein diese Stelle überhaupt? Stellen von 1975 immer; neue Berufe zuerst
 * bei großen Vereinen, nach rund zehn Jahren fast überall. Fest je Verein/Stelle/drei Jahre.
 */
export function aiWantsRole(c: Club, role: string, year: number): boolean {
  const r = STAFF_BY_ID[role];
  if (!r || !staffAvailable(r, year)) return false;
  if (r.unlockYear <= 1975) return true;
  const rep = c.reputation ?? 60;
  const p = clamp(0.15 + (year - r.unlockYear) / 12 + (rep - 68) / 40 - ((c.finances?.balance ?? 0) < 0 ? 0.2 : 0), 0, 1);
  return hash01(`${c.id}|${role}|${Math.floor(year / 3)}`) < p;
}

/** Bester freier Kandidat für eine Stelle (nach Anspruch: wer viel zu gut ist, ist zu teuer). */
function pickFree(g: Game, w: StaffWorld, role: string, target: number, year: number, rng: () => number): { m: StaffMember; fit: number } | null {
  let best: StaffMember | null = null, bs = -99, bf = 0;
  for (const m of w.people) {
    // Frühere Spieler deines Vereins warten im ersten Jahr auf dein Angebot.
    if (m.clubId || m.age >= 64 || (m.home === g.managedClubId && m.freeSince === year && !isSim(g))) continue;
    const fit = roleFit(m.skills, role, 1);
    if (fit < 4) continue;
    const sc = fit - Math.max(0, fit - target - 2) * 0.8 + rng() * 2.5 + (m.exPro ? m.exPro.s * 2 : 0);
    if (sc > bs) { bs = sc; best = m; bf = fit; }
  }
  return best ? { m: best, fit: bf } : null;
}

/** Person für die Stelle einstellen (Gehalt nach Forderung, 1–3 Jahre). */
function take(m: StaffMember, c: Club, role: string, date: string, rng: () => number): void {
  m.roleId = role;
  syncQuality(m);
  if (m.skills) m.specialty = specialtyOfSkills(m.skills, role);
  hireInto(m, c.id, date, 1 + Math.floor(rng() * 3));
  m.salaryFactor = demandFactor(m, c.reputation ?? 60);
}

export interface FillOpts { poach?: { left: number }; /** Nur freie Stellen besetzen (kein Austausch). */ vacantOnly?: boolean; /** Startbesetzung: Personen neu anlegen. */ seed?: boolean }

/**
 * Stab eines KI-Vereins prüfen: doppelte Besetzung auflösen, schwache Leute ersetzen,
 * Lücken füllen – aus dem Pool, notfalls mit einem neuen Quereinsteiger.
 * @returns Zahl der Einstellungen
 */
export function aiFillClub(g: Game, w: StaffWorld, c: Club, mine: StaffMember[], date: string, rng: () => number, o: FillOpts = {}): number {
  const year = yearOf(date);
  const byRole = new Map<string, StaffMember>();
  for (const m of mine) {
    if (!STAFF_W[m.roleId] || byRole.has(m.roleId)) { freeUp(m, year); continue; }
    byRole.set(m.roleId, m);
  }
  const target = aiStaffTarget(c, year);
  let hires = 0;
  for (const role of AI_STAFF_ROLES) {
    if (!available(role, year)) continue;
    const cur = byRole.get(role);
    if (!aiWantsRole(c, role, year)) continue;
    if (cur && (o.vacantOnly || cur.quality >= target - 3)) continue;
    let pick: { m: StaffMember; fit: number } | null = null;
    if (o.seed) {
      const m = makeOutsider(year, rng, role);
      tuneTo(m, target + (rng() - 0.5) * 5);
      w.people.push(m);
      pick = { m, fit: m.quality };
    } else {
      pick = pickFree(g, w, role, target, year, rng);
      if (o.poach && o.poach.left > 0 && KEY_ROLES.has(role) && (c.reputation ?? 60) >= 74) {
        const better = poachFromSmaller(g, w, c, role, Math.max(pick?.fit ?? 0, cur?.quality ?? 0) + 3, year, rng);
        if (better) { pick = better; o.poach.left--; payPoach(g, c, better.m, date); }
      }
      // Kaum jemand Brauchbares frei: ein neuer Quereinsteiger aus dem Beruf (der Markt wächst mit den Stellen).
      if (!pick || pick.fit < Math.max(5, target - 4)) {
        if (cur) continue;
        const m = makeOutsider(year, rng, role);
        tuneTo(m, target - 1 - rng() * 2.5);
        w.people.push(m);
        w.cur.outsiders++;
        pick = { m, fit: m.quality };
      }
    }
    if (cur && pick.fit <= cur.quality + 1) continue;
    if (cur) freeUp(cur, year);
    take(pick.m, c, role, date, rng);
    // Startbesetzung: Die Leute sind schon länger im Verein (sonst gälten alle als „gerade erst gewechselt“).
    if (o.seed) pick.m.hired = `${year - 1 - Math.floor(rng() * 6)}-07-01`;
    byRole.set(role, pick.m);
    hires++;
  }
  w.cur.hires += o.seed ? 0 : hires;
  return hires;
}

/** Große Vereine werben kleineren eine Schlüsselkraft ab (nicht Vereinstreue, nicht im ersten Jahr). */
function poachFromSmaller(g: Game, w: StaffWorld, c: Club, role: string, minFit: number, year: number, rng: () => number): { m: StaffMember; fit: number } | null {
  if (rng() > 0.4) return null;
  const rep = c.reputation ?? 60;
  let best: StaffMember | null = null, bf = minFit;
  for (const m of w.people) {
    const from = m.clubId ? g.clubs[m.clubId] : undefined;
    if (!from || from.id === c.id || from.id === g.managedClubId || (from.reputation ?? 60) > rep - 6) continue;
    if (m.traits?.includes('treu') || (m.hired && yearOf(m.hired) >= year) || m.age >= 60) continue;
    const fit = roleFit(m.skills, role, 1);
    if (fit > bf) { bf = fit; best = m; }
  }
  return best ? { m: best, fit: bf } : null;
}

function payPoach(g: Game, buyer: Club, m: StaffMember, date: string): void {
  const from = m.clubId ? g.clubs[m.clubId] : undefined;
  const fee = poachFee(g, m, date);
  if (fee > 0) {
    book(buyer.finances, date, -fee, 'staff_wages', `Ablöse ${m.name}`, false);
    if (from) book(from.finances, date, fee, 'other', `Ablöse ${m.name}`, false);
  }
  if (from) freeUp(m, yearOf(date));
}

/** Saisonwechsel: alle KI-Stäbe prüfen (große Vereine zuerst), dann die schlanken Vereine. */
export function aiStaffSeason(g: Game, w: StaffWorld, date: string, rng: () => number): void {
  const idx = staffIndex(g);
  const poach = { left: AI_POACH_MAX };
  const clubs = staffedClubs(g).sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
  for (const c of clubs) aiFillClub(g, w, c, idx.get(c.id) ?? [], date, rng, { poach });
  leanSeason(g, w, date, rng);
}

/** Monatsanfang: offene Stellen der KI-Vereine besetzen (Abgänge, Entlassungen im Trainerkarussell). */
export function aiStaffVacancies(g: Game, date: string, rng: () => number = Math.random): number {
  const w = g.staffWorld;
  if (!w) return 0;
  const idx = staffIndex(g);
  let n = 0;
  for (const c of staffedClubs(g)) n += aiFillClub(g, w, c, idx.get(c.id) ?? [], date, rng, { vacantOnly: true });
  return n;
}

/** Monatsgehälter des Stabs (mit Cheftrainer) eines KI-Vereins (nominal). */
export function aiStaffPayroll(g: Game, c: Club, members: StaffMember[] | undefined, year: number): number {
  const scale = economyScale(year);
  let sum = 0;
  for (const m of members ?? []) sum += memberMonthlySalary(m, scale);
  if (c.coach) {
    const head = coachAsStaff(c.coach, year);
    sum += memberMonthlySalary({ ...head, salaryFactor: demandFactor(head, c.reputation ?? 60) }, scale);
  }
  return sum;
}

/** Monatsabschluss (game/dayFinance.ts): Gehälter der KI-Stäbe buchen. */
export function bookAiStaffPayroll(g: Game, c: Club, idx: Map<string, StaffMember[]>, date: string): void {
  if (!g.staffWorld?.ai) return;
  const sum = aiStaffPayroll(g, c, idx.get(c.id), yearOf(date));
  if (sum > 0) book(c.finances, date, -sum, 'staff_wages', 'Gehälter Mitarbeiterstab (Monat)', false);
}

// -----------------------------------------------------------------------------
// Trainerkarussell
// -----------------------------------------------------------------------------
/** Eigener Co-Trainer als Nachfolger: wenn er als Cheftrainer klar taugt (fest aus Verein/Datum). */
export function internalSuccessor(g: Game, club: Club, date: string, rng: () => number): ClubCoach | null {
  const w = g.staffWorld;
  if (!w?.ai) return null;
  const co = w.people.find((m) => m.clubId === club.id && m.roleId === 'cotrainer');
  if (!co || co.age < 34 || co.age > 60) return null;
  const rep = coachRepOf(co) - 6;
  if (rep < (club.reputation ?? 60) - 12 || rng() > 0.25) return null;
  w.people.splice(w.people.indexOf(co), 1);
  w.cur.promoted++;
  return toClubCoach(co, yearOf(date), date, rng);
}

/** Nach einem Trainerwechsel: Manchmal bringt der Neue seinen eigenen Co-Trainer mit – der alte geht. */
export function afterCoachChange(g: Game, club: Club, date: string, rng: () => number): void {
  const w = g.staffWorld;
  if (!w?.ai) return;
  const co = w.people.find((m) => m.clubId === club.id && m.roleId === 'cotrainer');
  if (co && rng() < 0.35) freeUp(co, yearOf(date));
}

// -----------------------------------------------------------------------------
// Start und alte Spielstände
// -----------------------------------------------------------------------------
/** Einmalig: alle KI-Stäbe vollständig besetzen (neues Spiel, alter Spielstand beim Laden). Markierung `staffWorld.ai`. */
export function ensureAiStaff(g: Game, rng?: () => number): void {
  const w = ensureStaffWorld(g, rng);
  if (w.ai) return;
  const r = rng ?? seeded(`staffai:${g.managedClubId}:${g.calendar.currentDate}`);
  const date = g.calendar.currentDate;
  const idx = staffIndex(g);
  // Vorhandene Leute bleiben; fehlende Stellen bekommen neue Personen auf Vereinsniveau (der Pool bleibt unberührt).
  for (const c of staffedClubs(g).sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0))) {
    aiFillClub(g, w, c, idx.get(c.id) ?? [], date, r, { seed: true, vacantOnly: true });
  }
  w.ai = 1;
  leanSeason(g, w, date, r, true);
}

function seeded(key: string): () => number {
  let a = 0;
  for (let i = 0; i < key.length; i++) a = (Math.imul(a ^ key.charCodeAt(i), 16777619) + 1) | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Kurzüberblick für Tests/Bericht: Besetzung und Ø Eignung je KI-Verein. */
export function aiStaffSummary(g: Game): { id: string; rep: number; filled: number; avail: number; q: number; pay: number }[] {
  const year = yearOf(g.calendar.currentDate);
  const idx = staffIndex(g);
  return staffedClubs(g).map((c) => {
    const mine = (idx.get(c.id) ?? []).filter((m) => STAFF_W[m.roleId]);
    const avail = AI_STAFF_ROLES.filter((r) => available(r, year)).length;
    const q = mine.length ? mine.reduce((a, m) => a + m.quality, 0) / mine.length : 0;
    return { id: c.id, rep: c.reputation ?? 60, filled: mine.length, avail, q, pay: aiStaffPayroll(g, c, idx.get(c.id), year) };
  });
}
