// =============================================================================
// VERHANDLUNG MIT MITARBEITERN — Spielablauf (Wunsch Pascal: Verhandlungen wie in
// großen Managern, auch mit Mitarbeitern)
// -----------------------------------------------------------------------------
// Rechnung: engine/staffNegotiation.ts. Hier: Lage aus dem Spielstand (Forderung
// für die Stelle, Ruf des Vereins, ob die Person anderswo arbeitet oder lange
// ohne Stelle ist), Gesprächszustand im optionalen `game.staffTalks`, Runden mit
// Geduld, Abbruch mit Sperre, Abschluss: Einstellung über game/trainerTeam.ts
// `offerContract` bzw. Verlängerung, dazu Handgeld, zugesagte Fortbildung und
// die ausgehandelten Vertragspunkte am Mitarbeiter (`StaffMember.deal`).
// Zwei Arten: `hire` (Person vom Arbeitsmarkt für eine Stelle) und `extend`
// (eigener Mitarbeiter im letzten Vertragsjahr).
// Bildschirm: screens/negotiation/StaffTalk.tsx.
// =============================================================================
import { STAFF_BY_ID, staffAvailable } from '../data/staff';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { memberMonthlySalary, StaffMember } from '../engine/staffPeople';
import {
  buildStaffDemand, SEV_RANK, staffAnswer, StaffClause, StaffDemand, StaffNegCtx, StaffTerms, staffValue, STAFF_MAX_ROUNDS,
} from '../engine/staffNegotiation';
import { acceptTolerance, hasTrait, roleFit, roleName, staffLevel } from '../engine/staffSkills';
import { hash01 } from '../engine/transferMarket';
import { fmtDM } from '../ui/format';
import { staffAccuracy } from './contractCtx';
import { goalOf } from './dressingRoomGame';
import { ensureStaff } from './staffGame';
import { findPerson } from './staffWorld';
import { Game } from './state';
import {
  canCourse, canExtend, compensationOf, demandOf, EXTEND_MAX_YEARS, moveBlocker, offerContract, replacedBy, sendToCourse, severanceOf,
} from './trainerTeam';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type StaffTalkMode = 'hire' | 'extend';
export interface StaffTalkLog { d: string; who: 'du' | 'person' | 'info'; text: string }

/** Gesprächszustand je Person (gespeichert). */
export interface StaffTalkState {
  mode: StaffTalkMode;
  role: string;
  started: string;
  last: string;
  round: number;
  patience: number;
  start: number;
  /** Aktuelle Forderung (nach Gegenvorschlägen). */
  ask: StaffTerms;
  /** Wert der Eröffnungsforderung (Maßstab der Positionsanzeige). */
  open0: number;
  /** Verlauf je Runde: [Wert deines Angebots, Wert der Forderung danach]. */
  hist: [number, number][];
  log: StaffTalkLog[];
  status: 'open' | 'agreed' | 'failed';
  deal?: StaffTerms;
  /** Ergebnistext bzw. Grund des Abbruchs. */
  endNote?: string;
  /** Nach einem Abbruch: erst ab diesem Tag wieder gesprächsbereit. */
  blockedUntil?: string;
  name: string;
}

export interface Lever { text: string; side: 1 | -1; w: number }

const talks = (g: Game) => (g.staffTalks ??= {});
const COACH_ROLES = new Set(['cheftrainer', 'cotrainer']);

/** Eigener Mitarbeiter oder Person vom Arbeitsmarkt. */
export function staffPerson(g: Game, id: string): { m: StaffMember; own: boolean } | null {
  const mine = ensureStaff(g).find((x) => x.id === id);
  if (mine) return { m: mine, own: true };
  const m = findPerson(g, id);
  return m ? { m, own: false } : null;
}

/** Lage des Gesprächs aus dem Spielstand. */
export function staffCtx(g: Game, m: StaffMember, role: string, own: boolean): StaffNegCtx {
  const year = yearOf(g.calendar.currentDate);
  const club = g.clubs[g.managedClubId];
  const rep = club?.reputation ?? 60;
  const demand = own ? Math.max(m.salaryFactor, demandOf(g, m, role)) : demandOf(g, m, role);
  const goal = club ? goalOf(g, club) : undefined;
  // Chance aufs Saisonziel: aus dem Tabellenstand, sonst die Hälfte.
  const pGoal = goal && goal.played >= 6 ? clamp(0.5 + (goal.expected - goal.pos) * 0.07, 0.1, 0.9) : 0.5;
  return {
    demand, tolerance: acceptTolerance(rep, 2, m.age), age: m.age, level: staffLevel(roleFit(m.skills, role, m.quality)),
    employed: !own && !!m.clubId, yearsFree: !own && !m.clubId && m.freeSince ? Math.max(0, year - m.freeSince) : 0,
    bond: own || m.home === g.managedClubId, extend: own, coach: COACH_ROLES.has(role), eager: hasTrait(m, 'lernfreudig'),
    canCourse: m.course !== year, pGoal, seed: `${m.id}|${role}|${g.season}`,
  };
}

/** Was deine Position stärkt (+) oder schwächt (−). */
export function staffLevers(g: Game, m: StaffMember, role: string, own: boolean): Lever[] {
  const year = yearOf(g.calendar.currentDate);
  const club = g.clubs[g.managedClubId];
  const out: Lever[] = [];
  if (own) out.push({ text: 'Arbeitet schon für dich', side: 1, w: 1 });
  else if (m.clubId) out.push({ text: `Steht bei ${g.clubs[m.clubId]?.shortName ?? 'einem anderen Verein'} unter Vertrag`, side: -1, w: 2 });
  else {
    const free = m.freeSince ? Math.max(0, year - m.freeSince) : 0;
    out.push(free >= 2 ? { text: `Seit ${free} Jahren ohne Stelle`, side: 1, w: 3 } : free >= 1 ? { text: 'Seit einem Jahr ohne Stelle', side: 1, w: 2 } : { text: 'Vereinslos', side: 1, w: 1 });
  }
  if (m.home === g.managedClubId) out.push({ text: 'Dem Verein verbunden (früherer Spieler)', side: 1, w: 2 });
  if (hasTrait(m, 'treu') && own) out.push({ text: 'Vereinstreu', side: 1, w: 1 });
  const rep = club?.reputation ?? 60;
  if (rep >= 75) out.push({ text: 'Großer Verein – hier will man arbeiten', side: 1, w: 2 });
  else if (rep < 55) out.push({ text: 'Kleiner Verein – wenig Glanz', side: -1, w: 1 });
  const lvl = staffLevel(roleFit(m.skills, role, m.quality));
  if (lvl >= 80) out.push({ text: 'Spitzenkraft – begehrt', side: -1, w: 2 });
  if (m.exPro && m.exPro.s >= 0.6) out.push({ text: 'Großer Name als früherer Profi', side: -1, w: 1 });
  if (m.age >= 58) out.push({ text: 'Sucht eine letzte Station', side: 1, w: 1 });
  return out;
}

function say(st: StaffTalkState, d: string, who: StaffTalkLog['who'], text: string): void {
  st.log.push({ d, who, text });
  if (st.log.length > 30) st.log.splice(0, st.log.length - 30);
}

const yearsWord = (y: number) => `${y} ${y === 1 ? 'Jahr' : 'Jahre'}`;
const SEV_TEXT: Record<StaffTerms['severance'], string> = { cap: 'Abfindung höchstens drei Monatsgehälter', standard: 'Abfindung nach halber Restlaufzeit', full: 'Abfindung über die volle Restlaufzeit' };

/** Paket in einem Satz (Gehalt als Betrag). */
export function staffTermsLine(g: Game, m: StaffMember, role: string, t: StaffTerms): string {
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const month = memberMonthlySalary({ ...m, roleId: role, salaryFactor: t.factor }, scale);
  const parts = [`${fmtDM(month * 12)} im Jahr`, yearsWord(t.years), t.signing > 0 && `Handgeld ${fmtDM(month * t.signing)}`, t.bonus > 0 && `Erfolgsprämie ${fmtDM(month * t.bonus)}`,
    t.severance !== 'standard' && SEV_TEXT[t.severance], t.protect && 'Abwerbeschutz', t.course && 'Fortbildung'];
  return parts.filter(Boolean).join(', ');
}

/** Grund, warum (gerade) nicht verhandelt werden kann – sonst null. */
export function staffTalkBlocker(g: Game, m: StaffMember, own: boolean): string | null {
  const today = g.calendar.currentDate;
  const prev = g.staffTalks?.[m.id];
  if (prev?.blockedUntil && prev.blockedUntil > today) return `${m.name} will nach dem Abbruch erst ab ${CalendarEngine.formatDate(prev.blockedUntil)} wieder reden.`;
  if (own) { const c = canExtend(g, m); return c.ok ? null : c.reason ?? 'Verlängerung noch nicht möglich.'; }
  return moveBlocker(g, m);
}

const OPEN_LINES = {
  free: ['„Ich höre mir das gern an.“', '„Schön, dass ihr an mich denkt. Was habt ihr vor?“', '„Ich bin frei und habe Lust auf die Aufgabe – wenn die Bedingungen stimmen.“'],
  employed: ['„Ich habe einen laufenden Vertrag. Für einen Wechsel muss einiges zusammenpassen.“', '„Mein Verein lässt mich ungern gehen – ihr müsst mich schon überzeugen.“'],
  own: ['„Ich fühle mich wohl hier. Reden wir über die Zukunft.“', '„Gern – aber ich weiß auch, was ich hier leiste.“'],
};
const REPLY: Record<string, string[]> = {
  insult: ['„Das kann nicht euer Ernst sein.“', '„Dafür stehe ich morgens nicht auf.“'],
  far: ['„Da liegen wir weit auseinander.“', '„So komme ich nicht – da muss deutlich mehr kommen.“'],
  gap: ['„Wir nähern uns, aber es fehlt noch ein Stück.“', '„Die Richtung stimmt. Noch nicht das Ergebnis.“'],
  close: ['„Fast. Einen kleinen Schritt noch.“', '„Wir sind dicht beieinander.“'],
  accept: ['„Einverstanden. Wann fange ich an?“', '„Abgemacht – ich freue mich auf die Aufgabe.“', '„So machen wir es.“'],
  breakoff: ['„Das führt zu nichts. Ich wünsche euch alles Gute.“', '„Dann eben nicht. Für mich ist das Thema erledigt.“'],
};
const FOCUS: Record<StaffClause, string> = {
  wage: '„Beim Gehalt müsst ihr nachlegen.“', years: '„Die Laufzeit passt mir so nicht.“', signing: '„Für einen Wechsel erwarte ich ein Handgeld.“',
  bonus: '„Wenn wir Erfolg haben, will ich daran beteiligt sein.“', severance: '„Ich brauche Sicherheit, falls ihr mich vor die Tür setzt.“',
  protect: '„Ich lasse mir die Tür zu einem größeren Verein nicht zunageln.“', course: '„Ich will mich weiterbilden – das gehört für mich dazu.“',
};
const pick = (list: string[], seed: string) => list[Math.floor(hash01(seed) * list.length) % list.length];

/** Gespräch öffnen bzw. fortsetzen (nach 30 Tagen ohne Runde oder bei anderer Stelle beginnt es neu). */
export function openStaffTalk(g: Game, id: string, role?: string): StaffTalkState | string {
  const who = staffPerson(g, id);
  if (!who) return 'Die Person ist nicht mehr verfügbar.';
  const { m, own } = who;
  const today = g.calendar.currentDate;
  const useRole = own ? m.roleId : role ?? m.roleId;
  const prev = g.staffTalks?.[id];
  if (prev && prev.role === useRole && prev.status === 'open' && CalendarEngine.addDays(prev.last, 30) >= today) return prev;
  const block = staffTalkBlocker(g, m, own);
  if (block) return block;
  const def = STAFF_BY_ID[useRole];
  if (!def || !staffAvailable(def, yearOf(today))) return 'Diese Stelle gibt es noch nicht.';
  // Alte, beendete Gespräche aufräumen (Sperren sind dann längst abgelaufen).
  for (const [k, x] of Object.entries(talks(g))) if (x.status !== 'open' && CalendarEngine.addDays(x.last, 120) < today) delete talks(g)[k];
  const ctx = staffCtx(g, m, useRole, own);
  const d = buildStaffDemand(ctx);
  const start = clamp(100 + (ctx.yearsFree >= 1 ? 15 : 0) - (ctx.employed ? 10 : 0) + (ctx.bond ? 10 : 0), 60, 130);
  const st: StaffTalkState = {
    mode: own ? 'extend' : 'hire', role: useRole, started: today, last: today, round: 0, patience: start, start, ask: d.ask,
    open0: staffValue(d.ask, d, ctx), hist: [], log: [], status: 'open', name: m.name,
  };
  say(st, today, 'person', pick(own ? OPEN_LINES.own : m.clubId ? OPEN_LINES.employed : OPEN_LINES.free, `${id}|${today}|o`));
  say(st, today, 'person', `„Meine Vorstellung: ${staffTermsLine(g, m, useRole, d.ask)}.“`);
  talks(g)[id] = st;
  return st;
}

export interface StaffTalkResult { ok: boolean; done: boolean; text: string }

/** Eine Runde: Angebot abgeben. */
export function submitStaffOffer(g: Game, id: string, raw: StaffTerms, locks: StaffClause[] = [], replaceId?: string): StaffTalkResult {
  const who = staffPerson(g, id);
  const st = g.staffTalks?.[id];
  if (!who || !st || st.status !== 'open') return { ok: false, done: true, text: 'Kein offenes Gespräch.' };
  const { m, own } = who;
  const today = g.calendar.currentDate;
  const ctx = staffCtx(g, m, st.role, own);
  const d = buildStaffDemand(ctx);
  const t: StaffTerms = {
    factor: Math.round(clamp(raw.factor, 0.2, 12) * 100) / 100, years: clamp(Math.round(raw.years), 1, 4), signing: clamp(Math.round(raw.signing), 0, 6),
    bonus: clamp(Math.round(raw.bonus), 0, 6), severance: raw.severance in SEV_RANK ? raw.severance : 'standard', protect: !!raw.protect, course: !!raw.course && ctx.canCourse,
  };
  st.round += 1;
  st.last = today;
  say(st, today, 'du', `Angebot: ${staffTermsLine(g, m, st.role, t)}.`);
  const worth = staffValue(t, d, ctx);
  const ans = staffAnswer(t, d, ctx, st.ask, st.round, locks);
  const seed = `${id}|${today}|${st.round}`;
  if (ans.accepted) {
    st.hist.push([worth, worth]);
    say(st, today, 'person', pick(REPLY.accept, seed));
    const done = own ? { ok: true, text: applyExtension(g, m, t) } : applyHire(g, m, st.role, t, replaceId);
    st.status = done.ok ? 'agreed' : 'failed';
    st.deal = done.ok ? t : undefined;
    st.endNote = done.text;
    say(st, today, 'info', done.text);
    return { ok: done.ok, done: true, text: done.text };
  }
  st.patience -= ans.patienceLoss;
  say(st, today, 'person', pick(REPLY[ans.kind], seed));
  st.hist.push([worth, ans.counter ? staffValue(ans.counter, d, ctx) : staffValue(st.ask, d, ctx)]);
  if (st.patience <= 0 || st.round >= STAFF_MAX_ROUNDS) {
    st.status = 'failed';
    st.blockedUntil = CalendarEngine.addDays(today, ans.kind === 'insult' ? 60 : 30);
    st.endNote = st.patience <= 0 ? `${m.name} hat die Geduld verloren und bricht die Gespräche ab.` : `Nach ${STAFF_MAX_ROUNDS} Runden ohne Einigung beendet ${m.name} die Gespräche.`;
    say(st, today, 'person', pick(REPLY.breakoff, seed + 'b'));
    if (own) m.loyalty = clamp(m.loyalty - 8, 0, 100);
    return { ok: false, done: true, text: st.endNote };
  }
  if (ans.focus) say(st, today, 'person', FOCUS[ans.focus]);
  if (ans.counter) {
    st.ask = ans.counter;
    say(st, today, 'person', `„Mein Vorschlag: ${staffTermsLine(g, m, st.role, ans.counter)}.“`);
  }
  return { ok: false, done: false, text: st.log[st.log.length - 1]?.text ?? '' };
}

/** Gespräch von dir aus beenden. */
export function cancelStaffTalk(g: Game, id: string): void {
  const st = g.staffTalks?.[id];
  if (!st || st.status !== 'open') return;
  st.status = 'failed';
  st.endNote = 'Du hast die Verhandlung beendet.';
  if (st.round > 0) st.blockedUntil = CalendarEngine.addDays(g.calendar.currentDate, 14);
  say(st, g.calendar.currentDate, 'info', st.endNote);
}

function dealOf(t: StaffTerms): StaffMember['deal'] {
  const deal = { bonus: t.bonus || undefined, sev: t.severance === 'standard' ? undefined : t.severance, protect: t.protect || undefined };
  return deal.bonus || deal.sev || deal.protect ? deal : undefined;
}

function extras(g: Game, m: StaffMember, t: StaffTerms): string[] {
  const today = g.calendar.currentDate;
  const club = g.clubs[g.managedClubId];
  const lines: string[] = [];
  m.deal = dealOf(t);
  if (t.signing > 0 && club) {
    const sum = memberMonthlySalary(m, economyScale(yearOf(today))) * t.signing;
    book(club.finances, today, -sum, 'staff_wages', `Handgeld ${m.name}`, true);
    lines.push(`Handgeld ${fmtDM(sum)} bezahlt.`);
  }
  if (t.course && canCourse(g, m)) { const r = sendToCourse(g, m.id); if (r) lines.push(r); }
  return lines;
}

function applyHire(g: Game, m: StaffMember, role: string, t: StaffTerms, replaceId?: string): { ok: boolean; text: string } {
  const r = offerContract(g, m.id, t.factor, t.years, { roleId: role, replaceId, agreed: true });
  if (!r.ok || !r.member) return { ok: false, text: r.text };
  return { ok: true, text: [r.text, ...extras(g, r.member, t)].join(' ') };
}

function applyExtension(g: Game, m: StaffMember, t: StaffTerms): string {
  const today = g.calendar.currentDate;
  const base = m.contractEnd && m.contractEnd > today ? yearOf(m.contractEnd) : yearOf(today);
  const seasonEnd = yearOf(today) + (Number(today.slice(5, 7)) >= 7 ? 1 : 0);
  const end = Math.min(base + t.years, seasonEnd + EXTEND_MAX_YEARS);
  m.contractEnd = `${end}-06-30`;
  m.salaryFactor = t.factor;
  m.loyalty = clamp(m.loyalty + 6, 0, 100);
  return [`${m.name} verlängert als ${roleName(m.roleId)} bis ${end}.`, ...extras(g, m, t)].join(' ');
}

/** Alles für den Bildschirm (frisch gerechnet). */
export interface StaffTalkView {
  m: StaffMember; own: boolean; role: string;
  status: 'open' | 'agreed' | 'failed' | 'blocked';
  blocked?: string;
  st: StaffTalkState | null;
  d: StaffDemand | null; ctx: StaffNegCtx | null;
  ask: StaffTerms | null;
  /** Vorbelegung deines Angebots. */
  start: StaffTerms | null;
  levers: Lever[];
  /** Positionsanzeige relativ zur Eröffnungsforderung (= 1). */
  worth: ((t: StaffTerms) => number) | null;
  askWorth: number;
  zone: [number, number] | null;
  hist: [number, number][];
  /** Monatsgehalt der Stelle bei Faktor 1 (nominal). */
  unit: number;
  /** Ablöse an den bisherigen Verein und Abfindung für den Verdrängten (nominal). */
  fee: number; severance: number; replaced: StaffMember | null;
}

export function staffTalkView(g: Game, id: string, role?: string, replaceId?: string): StaffTalkView | null {
  const who = staffPerson(g, id);
  if (!who) return null;
  const { m, own } = who;
  const prev = g.staffTalks?.[id] ?? null;
  const useRole = own ? m.roleId : role ?? prev?.role ?? m.roleId;
  const opened = openStaffTalk(g, id, useRole);
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const unit = memberMonthlySalary({ ...m, roleId: useRole, salaryFactor: 1 }, scale);
  const ctx = staffCtx(g, m, useRole, own);
  const d = buildStaffDemand(ctx);
  const replaced = own ? null : replacedBy(g, useRole, replaceId);
  const base = { m, own, role: useRole, levers: staffLevers(g, m, useRole, own), unit, fee: own ? 0 : compensationOf(g, m), severance: replaced ? severanceOf(g, replaced) : 0, replaced };
  if (typeof opened === 'string') {
    return { ...base, status: 'blocked', blocked: opened, st: prev, d, ctx, ask: null, start: null, worth: null, askWorth: 1, zone: null, hist: [] };
  }
  const cur = opened;
  const open0 = Math.max(0.01, cur.open0);
  const width = 0.1 - 0.06 * staffAccuracy(g);
  const bias = (hash01(`${id}|${cur.started}|zone`) - 0.5) * width * 0.8;
  const need = d.reservation / open0;
  const askWorth = staffValue(cur.ask, d, ctx) / open0;
  const lo = Math.min(askWorth, need + bias - width / 2);
  const start: StaffTerms = { ...cur.ask, factor: Math.round(cur.ask.factor * 0.9 * 100) / 100, signing: 0, bonus: 0, severance: 'standard', protect: false, course: false };
  return {
    ...base, status: cur.status, st: cur, d, ctx, ask: cur.ask, start,
    worth: (t) => staffValue(t, d, ctx) / open0, askWorth, zone: [lo, Math.max(lo + 0.01, Math.min(askWorth, need + bias + width / 2))],
    hist: cur.hist.map(([o, a]) => [o / open0, a / open0] as [number, number]),
  };
}
