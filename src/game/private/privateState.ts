// =============================================================================
// PRIVATLEBEN – Zustand (Wunsch Pascal #47). Optionales Feld `game.private`;
// `ensurePrivate` legt es für neue und alte Spielstände an (idempotent).
// -----------------------------------------------------------------------------
// Personen (du, Partner, Kinder, Eltern, frühere Manager der Familie) in `persons`,
// Geld nominal (DM-Werte wie Vereinskonten, Anzeige fmtDM), Zustand Energie/Laune/Gesundheit/
// Kontakte 0–100, Fähigkeiten 0–20, Wochenplan als Prioritäten 0–5.
// Ablauf: game/private/privateGame.ts, Generationswechsel: succession.ts,
// Seiten: views/privat/.
// =============================================================================
import type { Game } from '../state';
import { mulberry32 } from '../../engine/leagues';
import { hashSeed } from '../state';
import { economyScale } from '../../engine/economy';
import { jobLevel, managerWageFor } from '../careerState';
import {
  cpi, firstNamesFor, HOMES, housing, LAST_NAMES, storyById, type PlanKey, type Sex, type SkillKey,
} from '../../data/privateLife';

export type Role = 'self' | 'partner' | 'kind' | 'ex' | 'eltern' | 'alt';
export type KidPath = 'offen' | 'spieler' | 'manager' | 'eigen';

export interface Person {
  id: string;
  first: string;
  last: string;
  sex: Sex;
  /** Geburtsdatum (ISO). */
  birth: string;
  /** Generation der Familie (1 = du beim Spielstart). */
  gen: number;
  role: Role;
  parents?: string[];
  alive: boolean;
  died?: string;
  // --- Kinder (verdeckte Anlagen, in der Oberfläche nur als Einschätzung) ---
  /** Fußballtalent 0–100. */
  talent?: number;
  /** Lust auf Fußball 0–100 (wächst mit gemeinsamer Zeit und Erfolgen). */
  fussball?: number;
  /** Eignung für Führung/Management 0–100. */
  fuehrung?: number;
  /** Bindung zu dir 0–100. */
  bond?: number;
  path?: KidPath;
  /** Spieler-ID, wenn das Kind Fußballer ist (Jugend/Profi). */
  playerId?: string;
  /** Musik/Schule u. Ä. statt Verein (Einschulung). */
  hobby?: string;
  /** Managerzeit dieser Person beim Verein. */
  managed?: { from: string; to?: string; club: string };
  /** Kurzer Lebenslauf (Ereignisse). */
  notes?: string[];
}

export interface PrivLog { d: string; t: string }

export interface PrivateState {
  v: 1;
  selfId: string;
  partnerId?: string;
  /** Hochzeitsdatum. */
  married?: string;
  /** Beziehung 0–100. */
  rel: number;
  /** Wen du kennenlernen möchtest. */
  seeking: Sex;
  /** Kinderwunsch. */
  wish: boolean;
  /** Baby unterwegs: Geburtstermin. */
  expecting?: string;
  persons: Record<string, Person>;
  /** Privatkonto, Sparbuch, Aktienfonds (nominal in DM-Werten wie Vereinskonten; Anzeige fmtDM). */
  money: number;
  savings: number;
  stocks: number;
  /** Bisher an den Verein gegeben (nominal). */
  donated: number;
  home: number;
  car: number;
  hobby: string;
  plan: Record<PlanKey, number>;
  study: SkillKey;
  energy: number;
  mood: number;
  health: number;
  /** Kontakte/Netzwerk 0–100. */
  net: number;
  skills: Record<SkillKey, number>;
  xp: Record<SkillKey, number>;
  /** Hintergrundgeschichte (Junger Manager). */
  story?: string;
  /** Wochen-/Monatsabschluss (ISO). */
  week?: string;
  month?: string;
  /** Letzte Woche: Veränderungen (Anzeige). */
  last?: { units: number; energy: number; mood: number; rel: number; net: number };
  /** Monatsabschluss (Anzeige). */
  ledger?: { d: string; income: number; living: number; home: number; car: number; hobby: number; kids: number; interest: number; stocks: number };
  /** Urlaub bis (Energie-Bonus, keine Kontakte). */
  vacation?: { to: string; label: string };
  /** Hinweise schon gegeben: Schlüssel → Datum. */
  told: Record<string, string>;
  log: PrivLog[];
  /** Generation des aktuellen Managers. */
  gen: number;
}

type G = Game & { private?: PrivateState; privateOff?: boolean };

export const privOn = (g: Game) => !(g as G).privateOff;
export const privOf = (g: Game): PrivateState | undefined => (g as G).private;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
export { clamp };

export function ageOn(birth: string, date: string): number {
  const by = +birth.slice(0, 4), bm = +birth.slice(5, 7), bd = +birth.slice(8, 10);
  const y = +date.slice(0, 4), m = +date.slice(5, 7), d = +date.slice(8, 10);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}
export const ageOf = (g: Game, p: Person) => ageOn(p.birth, p.died ?? g.calendar.currentDate);
export const fullName = (p: Person) => `${p.first} ${p.last}`;

export function selfOf(g: Game): Person {
  const st = ensurePrivate(g);
  return st.persons[st.selfId];
}
export const partnerOf = (st: PrivateState) => (st.partnerId ? st.persons[st.partnerId] : undefined);
/** Kinder des aktuellen Managers (lebend). */
export const kidsOf = (st: PrivateState, of = st.selfId) => Object.values(st.persons).filter((p) => p.alive && p.parents?.includes(of)).sort((a, b) => a.birth.localeCompare(b.birth));

/** Jahresgehalt des Managers (1975-Basis). */
export function salaryOf(g: Game): number {
  const rep = g.career?.rep ?? 50;
  return managerWageFor(jobLevel(g, g.managedClubId), rep);
}

export function privLog(st: PrivateState, d: string, t: string): void {
  st.log.push({ d, t });
  if (st.log.length > 120) st.log.splice(0, st.log.length - 120);
}

/** Neue Personen-ID – nur aus dem Spielstand (deterministisch auch nach dem Laden). */
export function newPersonId(st: PrivateState, tag: string): string {
  let n = Object.keys(st.persons).length, id = '';
  do { id = `pp_${tag}_${n++}`; } while (st.persons[id]);
  return id;
}

export function makePerson(st: PrivateState, r: () => number, o: { sex: Sex; birth: string; last: string; gen: number; role: Role; parents?: string[]; first?: string }): Person {
  const names = firstNamesFor(o.sex, +o.birth.slice(0, 4));
  const p: Person = {
    id: newPersonId(st, o.role), first: o.first ?? names[Math.floor(r() * names.length)], last: o.last, sex: o.sex,
    birth: o.birth, gen: o.gen, role: o.role, parents: o.parents, alive: true,
  };
  st.persons[p.id] = p;
  return p;
}

/** Anlagen eines neuen Kindes (vom Elternteil geprägt). */
export function kidTraits(st: PrivateState, kid: Person, r: () => number, parentWasPro: boolean): void {
  const self = st.persons[st.selfId];
  const lead = (st.skills.menschen + st.skills.taktik + st.skills.medien + st.skills.wirtschaft) / 4;
  kid.talent = Math.round(clamp(28 + r() * 45 + (parentWasPro ? 10 : 0) + (r() < 0.06 ? 20 : 0)));
  kid.fussball = Math.round(clamp(30 + r() * 30));
  kid.fuehrung = Math.round(clamp(20 + r() * 40 + lead));
  kid.bond = 60;
  kid.path = 'offen';
  void self;
}

const rand = (s: string) => mulberry32(hashSeed(s));

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Privatleben anlegen (neues Spiel, alter Spielstand). */
export function ensurePrivate(g: Game): PrivateState {
  const gg = g as G;
  if (gg.private?.v === 1) {
    const st = gg.private;
    st.told ??= {}; st.log ??= [];
    return st;
  }
  const today = g.calendar.currentDate;
  const year = +today.slice(0, 4);
  const m = g.manager;
  const r = rand(`priv|${g.managedClubId}|${m?.name ?? ''}|${m?.birthYear ?? 0}`);
  const [first0, ...rest] = (m?.name ?? 'Der Manager').split(' ');
  const first = m?.firstName || first0;
  const last = m?.lastName || rest.join(' ') || LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
  const birth = m?.birthDate?.slice(0, 10) || iso(m?.birthYear ?? year - 40, 5, 15);
  const sex: Sex = (m as any)?.sex === 'w' ? 'w' : 'm';
  const story = storyById((m as any)?.story);
  const st: PrivateState = {
    v: 1, selfId: '', rel: 0, seeking: sex === 'm' ? 'w' : 'm', wish: false, persons: {},
    money: 0, savings: 0, stocks: 0, donated: 0, home: 0, car: 1, hobby: 'laufen',
    plan: { erholung: 3, partner: 2, familie: 2, hobby: 2, netzwerk: 1, bildung: 1 }, study: 'taktik',
    energy: story?.energy ?? 75, mood: 60, health: 85, net: 20, skills: { taktik: 1, menschen: 1, medien: 1, wirtschaft: 1 },
    xp: { taktik: 0, menschen: 0, medien: 0, wirtschaft: 0 }, story: story?.id, told: {}, log: [], gen: 1,
  };
  const self: Person = { id: 'pp_self_1', first, last, sex, birth, gen: 1, role: 'self', alive: true, managed: { from: today, club: g.managedClubId } };
  st.persons[self.id] = self;
  st.selfId = self.id;
  const age = ageOn(birth, today);
  st.health = Math.round(clamp(92 - Math.max(0, age - 35) * 0.6));
  // Fähigkeiten nach Werdegang.
  const bg = m?.background;
  if (bg === 'ex_pro') { st.skills.menschen = 4; st.skills.taktik = 2; }
  if (bg === 'tactician') { st.skills.taktik = 6; st.skills.medien = 2; }
  if (bg === 'legend') { st.skills.menschen = 5; st.skills.medien = 6; st.skills.taktik = 4; st.skills.wirtschaft = 3; st.net = 55; }
  if (bg === 'rookie') { st.skills.taktik = 2; }
  if (story) {
    for (const [k, v] of Object.entries(story.skills) as [SkillKey, number][]) st.skills[k] = Math.min(20, st.skills[k] + v);
    st.net = clamp(st.net + story.net);
  }
  // Ersparnisse nach Alter und Gehalt.
  // Geld nominal (DM-Werte wie die Vereinskonten): Gehalt × economyScale, Preise × Verbraucherpreise.
  const wage = salaryOf(g);
  const k = cpi(year);
  st.money = Math.round(story ? story.money * k : Math.min(400000 * k, Math.max(5000 * k, (age - 22) * wage * economyScale(year) * 0.12)));
  st.home = age < 27 ? 0 : age < 35 ? 1 : wage > 120000 ? 3 : 2;
  if (st.home > 0) st.money = Math.round(Math.max(5000 * k, st.money - HOMES[st.home].price * housing(year) * 0.4));
  st.car = age < 24 ? 1 : wage > 150000 ? 3 : 2;
  // Familie beim Start (älterer Manager hat schon Partner und Kinder).
  const partnered = age >= 35 ? r() < 0.82 : age >= 27 ? r() < 0.5 : false;
  if (partnered) {
    const pAge = Math.max(20, age - 3 + Math.floor(r() * 5));
    const partner = makePerson(st, r, { sex: st.seeking, birth: iso(year - pAge, 1 + Math.floor(r() * 12), 1 + Math.floor(r() * 28)), last, gen: 1, role: 'partner' });
    st.partnerId = partner.id;
    st.rel = 62 + Math.floor(r() * 15);
    if (age >= 30 && r() < 0.85) st.married = iso(year - Math.min(age - 24, 2 + Math.floor(r() * 12)), 6, 12);
    const nKids = age >= 30 ? Math.min(3, Math.floor((age - 27) / 6 + r() * 1.6)) : 0;
    for (let i = 0; i < nKids; i++) {
      const kAge = Math.max(0, age - 27 - i * (2 + Math.floor(r() * 3)) - Math.floor(r() * 3));
      if (kAge > age - 20) continue;
      const kid = makePerson(st, r, { sex: r() < 0.5 ? 'm' : 'w', birth: iso(year - kAge, 1 + Math.floor(r() * 12), 1 + Math.floor(r() * 28)), last, gen: 2, role: 'kind', parents: [self.id, partner.id] });
      kidTraits(st, kid, r, bg === 'ex_pro' || bg === 'legend');
      // Ältere Kinder haben schon Richtung.
      if (kAge >= 16) kid.path = kid.fuehrung! > 55 ? 'manager' : 'eigen';
    }
  }
  if (story?.parent) {
    makePerson(st, r, { sex: story.parent === 'vater' ? 'm' : 'w', birth: iso(year - age - 27, 3, 3), last, gen: 0, role: 'eltern' });
  }
  privLog(st, today, story ? `${story.title}: Du übernimmst mit ${age} Jahren.` : `Start als Manager mit ${age} Jahren.`);
  gg.private = st;
  return st;
}

// -----------------------------------------------------------------------------
// Wirkung im Spiel
// -----------------------------------------------------------------------------
/** Lernfaktor des Trainings: Trainingslehre bis +4 %, Erschöpfung −3 %. */
export function privateTrainingFactor(g: Game): number {
  const st = privOf(g);
  if (!st || !privOn(g)) return 1;
  return 1 + st.skills.taktik / 20 * 0.04 + (st.energy < 30 ? -0.03 : st.energy > 70 ? 0.005 : 0);
}
/** Zuschlag auf die Erfolgsaussicht in Spielergesprächen (−0,05 … +0,1). */
export function privateTalkBonus(g: Game): number {
  const st = privOf(g);
  if (!st || !privOn(g)) return 0;
  return st.skills.menschen / 20 * 0.08 + (st.energy < 30 ? -0.05 : 0) + (st.mood > 70 ? 0.02 : st.mood < 30 ? -0.02 : 0);
}

