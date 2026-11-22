// =============================================================================
// ABWERBEN VON MITARBEITERN (Wunsch Pascal: „Man soll auch nach bereits
// angestellten Mitarbeitern suchen können und versuchen, diese für realistische
// Preise abzuwerben – zu Konditionen oder aus Gründen, weshalb sie zu einem
// wechseln sollen (oder auch nicht).“)
// -----------------------------------------------------------------------------
// • Ablöse an den Verein `poachFee`: nach Restlaufzeit, Gehalt, Stärke, Rolle im
//   Verein (Schlüsselperson), Größe des abgebenden Vereins, Epoche; mitten in der
//   Saison teurer. Cheftrainer kosten am meisten (ab den 2000ern deutlich mehr).
// • Wechselwunsch der Person `poachView`: Gründe dafür/dagegen mit Gewicht –
//   größerer/kleinerer Verein, Gehalt, früherer Verein/Heimat, Aufstieg zum
//   Cheftrainer oder Rückschritt, sportliche Aussichten, Vereinstreue, gerade erst
//   gewechselt, Zufriedenheit, auslaufender Vertrag; Abwerbeschutz sperrt.
// • KI wirbt auch deine Leute ab (`aiStaffOffers`, an wenigen Stichtagen, höchstens
//   ein Angebot): Nachricht mit Wahl Freigeben / Gehaltserhöhung / Ablehnen.
// =============================================================================
import type { MessageEventRef } from '../types';
import { STAFF_BY_ID } from '../data/staff';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { honourFx } from '../engine/honourEffects';
import { memberMonthlySalary, StaffMember } from '../engine/staffPeople';
import { demandFactor, hasTrait, roleFit, roleName, staffLevel } from '../engine/staffSkills';
import { fmtDM } from '../ui/format';
import { CHOICE_HANDLERS } from './eventsGame';
import { closeHeadCoach, syncHeadCoach } from './headCoaches';
import { anyClubName, anyClubRep, leanClubs } from './staffLean';
import { staffMovedTo } from './staffWorld';
import type { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const KEY = new Set(['cheftrainer', 'cotrainer', 'torwarttrainer', 'mannschaftsarzt', 'physio_haupt', 'sportdirektor', 'sportl_leiter', 'head_performance']);
const isSim = (g: Game) => !!(g as Game & { simAutoManage?: boolean }).simAutoManage;
export const STAFF_OFFER_TYPE = 'staff_poach';

function monthsTo(today: string, end?: string): number {
  if (!end) return 12;
  const a = new Date(today + 'T00:00:00Z'), b = new Date(end + 'T00:00:00Z');
  return Math.max(0, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth());
}

/** Monatsgehalt der Person bei ihrem Verein (KI-Cheftrainer: nach seiner Forderung). */
export function currentMonthly(g: Game, m: StaffMember, year: number): number {
  const f = m.coach && m.salaryFactor <= 1 ? demandFactor(m, m.clubId ? anyClubRep(g, m.clubId) : 60) : m.salaryFactor;
  return memberMonthlySalary({ ...m, salaryFactor: f }, economyScale(year));
}

/** Ist die Person die wichtigste ihrer Stelle beim Verein (Schlüsselperson)? */
function isKeyPerson(g: Game, m: StaffMember): boolean {
  if (m.roleId === 'cheftrainer') return true;
  if (!KEY.has(m.roleId) || !m.clubId) return false;
  const same = (g.staffWorld?.people ?? []).filter((x) => x.clubId === m.clubId && x.roleId === m.roleId);
  return !same.some((x) => x !== m && x.quality > m.quality);
}

/**
 * Ablöse an den bisherigen Verein (nominal). Grundlage: Monatsgehälter nach Restlaufzeit
 * (Mitarbeiter knapp die Hälfte, Cheftrainer gut die Hälfte), mal Epoche, Stärke,
 * Schlüsselrolle, Saisonzeit und Größe des Vereins gegenüber dem Käufer. Gedeckelt.
 */
export function poachFee(g: Game, m: StaffMember, date = g.calendar.currentDate, buyerRep = g.clubs[g.managedClubId]?.reputation ?? 60): number {
  if (!m.clubId) return 0;
  const year = yearOf(date);
  const monthly = currentMonthly(g, m, year);
  const left = monthsTo(date, m.contractEnd);
  const head = m.roleId === 'cheftrainer';
  let months = head ? clamp(left * 0.6, 4, 30) : clamp(left * 0.45, 2, 15);
  months *= 0.55 + 0.45 * clamp((year - 1975) / 40, 0, 1);
  if (head) months *= 1 + 0.4 * clamp((year - 1995) / 25, 0, 1);
  const lvl = staffLevel(roleFit(m.skills, m.roleId, m.quality));
  months *= 1 + Math.max(0, lvl - 72) / 40;
  if (isKeyPerson(g, m)) months *= 1.25;
  const mo = Number(date.slice(5, 7));
  if (mo >= 8 || mo <= 4) months *= 1.3;
  if (anyClubRep(g, m.clubId) >= buyerRep) months *= 1.15;
  months = Math.min(months, head ? 36 : 24);
  const fee = monthly * months;
  const unit = fee >= 1e6 ? 10000 : 1000;
  return Math.max(unit, Math.round(fee / unit) * unit);
}

export interface PoachReason { text: string; w: number }
export interface PoachView {
  /** Steht unter Vertrag (sonst vereinslos). */
  employed: boolean;
  fee: number;
  reasons: PoachReason[];
  score: number;
  /** Will grundsätzlich wechseln (Gründe dafür überwiegen). */
  ok: boolean;
  /** Grund, warum es gar nicht geht (Abwerbeschutz, Gründe dagegen überwiegen). */
  blocker?: string;
}

/** Tabellenplatz in der Spielerliga (sonst null). */
function tablePos(g: Game, id: string): number | null {
  return g.table?.rows.find((r) => r.clubId === id)?.position ?? null;
}

/**
 * Wechselwunsch einer angestellten Person zum Verein `toId` für die Stelle `role` (Standard: dein Verein).
 * Gründe mit Gewicht: positiv = spricht für den Wechsel.
 */
export function poachView(g: Game, m: StaffMember, role = m.roleId, toId = g.managedClubId, fromId = m.clubId): PoachView {
  const today = g.calendar.currentDate, year = yearOf(today);
  if (!fromId) return { employed: false, fee: 0, reasons: [], score: 0, ok: true };
  const from = anyClubName(g, fromId, true);
  const toRep = anyClubRep(g, toId) + (toId === g.managedClubId ? honourFx(toId, 'coachAppeal') * 50 : 0);
  const fromRep = anyClubRep(g, fromId);
  const out: PoachReason[] = [];
  const diff = toRep - fromRep;
  if (diff >= 4) out.push({ text: `Größerer Verein als ${from}`, w: Math.min(3, diff / 6) });
  else if (diff <= -4) out.push({ text: `Kleinerer Verein als ${from}`, w: Math.max(-4, diff / 4) });
  if (m.home === toId || m.exPro?.cids?.includes(toId)) out.push({ text: 'Sein früherer Verein – eine Herzensangelegenheit', w: 3 });
  if (role === 'cheftrainer' && m.roleId !== 'cheftrainer') out.push({ text: 'Die Chance, Cheftrainer zu werden', w: 3 });
  else if (role !== m.roleId && (STAFF_BY_ID[role]?.costClass ?? 'K1') < (STAFF_BY_ID[m.roleId]?.costClass ?? 'K1')) out.push({ text: `Als ${roleName(role)} wäre es ein Rückschritt`, w: -2 });
  const cur = currentMonthly(g, m, year);
  const next = memberMonthlySalary({ ...m, roleId: role, salaryFactor: demandFactor(m, toRep, m.quality) }, economyScale(year));
  if (cur > 0 && next >= cur * 1.1) out.push({ text: `Würde deutlich mehr verdienen (+${Math.round((next / cur - 1) * 100)} %)`, w: Math.min(2, (next / cur - 1) * 4) });
  else if (cur > 0 && next < cur * 0.95) out.push({ text: 'Würde weniger verdienen', w: -2 });
  const pf = tablePos(g, fromId), pt = tablePos(g, toId);
  if (pf != null && pt != null && pf - pt >= 4) out.push({ text: 'Bessere sportliche Aussichten', w: 1 });
  else if (pf != null && pt != null && pt - pf >= 4) out.push({ text: `${from} steht sportlich besser da`, w: -1 });
  if (hasTrait(m, 'treu')) out.push({ text: `Vereinstreu – hängt an ${from}`, w: -4 });
  if (m.hired && CalendarEngine.addDays(m.hired, 365) > today) out.push({ text: 'Ist gerade erst gewechselt', w: -2 });
  if (m.loyalty >= 65) out.push({ text: `Fühlt sich bei ${from} wohl`, w: -clamp((m.loyalty - 50) / 20, 0.5, 2) });
  else if (m.loyalty <= 35) out.push({ text: `Ist bei ${from} unzufrieden`, w: clamp((50 - m.loyalty) / 20, 0.5, 2) });
  if (m.contractEnd && monthsTo(today, m.contractEnd) <= 6) out.push({ text: 'Sein Vertrag läuft bald aus', w: 1 });
  const score = Math.round(out.reduce((a, r) => a + r.w, 0) * 10) / 10;
  const fee = toId === g.managedClubId ? poachFee(g, m, today, toRep) : poachFee(g, m, today, anyClubRep(g, toId));
  const shielded = !!m.deal?.protect && !!m.contractEnd && m.contractEnd > today;
  let blocker: string | undefined;
  if (shielded) blocker = `${m.name} hat bei ${from} einen Abwerbeschutz bis ${m.contractEnd!.slice(0, 4)}.`;
  else if (score < 0) {
    const against = out.filter((r) => r.w < 0).sort((a, b) => a.w - b.w).slice(0, 2).map((r) => r.text);
    blocker = `${m.name} will ${from} nicht verlassen${against.length ? ` (${against.join(', ')})` : ''}.`;
  }
  return { employed: true, fee, reasons: out.sort((a, b) => b.w - a.w), score, ok: !blocker, blocker };
}

// -----------------------------------------------------------------------------
// KI wirbt deine Leute ab
// -----------------------------------------------------------------------------
/** Stichtage für Abwerbeversuche (Saisonende, Sommer, Winterpause). */
const OFFER_DAYS = new Set(['05-20', '06-08', '12-12', '01-08']);

/** An den Stichtagen: höchstens ein Angebot eines KI-Vereins für einen deiner Mitarbeiter. */
export function aiStaffOffers(g: Game, today: string, rng: () => number = Math.random): void {
  if (isSim(g) || !OFFER_DAYS.has(today.slice(5)) || !g.staff?.length || !g.staffWorld?.ai) return;
  if (rng() > 0.55) return;
  const mine = g.clubs[g.managedClubId];
  if (!mine) return;
  const year = yearOf(today);
  const myRep = mine.reputation ?? 60;
  const open = new Set(g.messages.filter((x) => x.eventRef?.type === STAFF_OFFER_TYPE && !x.eventRef.resolved).map((x) => x.eventRef!.playerId));
  const cands = g.staff.filter((m) => m.quality >= 12 && !open.has(m.id) && !hasTrait(m, 'treu') && !(m.deal?.protect && m.contractEnd && m.contractEnd > today)
    && !(m.hired && CalendarEngine.addDays(m.hired, 300) > today)).sort((a, b) => b.quality - a.quality);
  const people = g.staffWorld.people;
  for (const m of cands.slice(0, 4)) {
    // Bieter: größere KI-Vereine, deren Kraft auf dieser Stelle klar schwächer ist; Spitzenleute auch ins Ausland.
    const bidders: { id: string; rep: number }[] = [];
    for (const c of Object.values(g.clubs)) {
      if (c.id === mine.id || !g.table.rows.some((r) => r.clubId === c.id) || (c.reputation ?? 60) < myRep - 2) continue;
      if (m.roleId === 'cheftrainer') continue; // KI-Cheftrainer kommen aus dem Trainerkarussell
      if (people.some((x) => x.clubId === c.id && x.roleId === m.roleId && x.quality >= m.quality - 1)) continue;
      bidders.push({ id: c.id, rep: c.reputation ?? 60 });
    }
    if (m.quality >= 15 && rng() < 0.3) {
      const top = leanClubs(g).filter((c) => c.kind === 'foreign' && c.rep >= myRep);
      if (top.length) { const c = top[Math.floor(rng() * Math.min(8, top.length))]; bidders.push({ id: c.id, rep: c.rep }); }
    }
    if (!bidders.length) continue;
    const b = bidders[Math.floor(rng() * bidders.length)];
    const fee = Math.round(poachFee(g, { ...m, clubId: mine.id }, today, b.rep) * (0.9 + rng() * 0.25) / 1000) * 1000;
    const wish = poachView(g, { ...m, clubId: mine.id }, m.roleId, b.id, mine.id);
    const bName = anyClubName(g, b.id);
    const raise = Math.round(memberMonthlySalary(m, economyScale(year)) * 12 * 0.15);
    const msg = makeMessage({
      date: today, category: 'board', from: bName,
      subject: `${bName} will ${m.name} abwerben`,
      shortText: `${roleName(m.roleId)} · Ablöse ${fmtDM(fee)} · ${wish.score >= 1 ? 'er würde gern wechseln' : wish.score >= 0 ? 'er ist unentschlossen' : 'er will bleiben'}`,
      bodyText: `${bName} möchte ${m.name} (${roleName(m.roleId)}, Stärke ${staffLevel(m.quality)}) verpflichten und bietet eine Ablöse von ${fmtDM(fee)}.\n\n`
        + `Was ihn bewegt:\n${wish.reasons.map((r) => `• ${r.text} (${r.w > 0 ? 'dafür' : 'dagegen'})`).join('\n') || '• Nichts Besonderes'}\n\n`
        + `Du kannst ihn freigeben, ihn mit einer Gehaltserhöhung (+15 %, rund ${fmtDM(raise)} im Jahr) halten oder ablehnen. `
        + `${wish.score >= 1 ? 'Lehnst du einfach ab, wird er enttäuscht sein.' : ''}\n\nDas Angebot gilt fünf Tage.`,
      actionRequired: true,
    });
    msg.choices = [
      { id: 'freigeben', label: 'Freigeben', hint: `${fmtDM(fee)} Ablöse` },
      { id: 'halten', label: 'Gehalt erhöhen (+15 %)', hint: 'Er bleibt' },
      { id: 'ablehnen', label: 'Ablehnen' },
    ];
    const ref: MessageEventRef = { type: STAFF_OFFER_TYPE, playerId: m.id, deadline: CalendarEngine.addDays(today, 5), defaultChoice: 'ablehnen', data: { buyer: b.id, buyerName: bName, fee, wish: wish.score } };
    msg.eventRef = ref;
    pushMessage(g.messages, msg);
    return;
  }
}

/** Antwort auf ein Abwerbe-Angebot (auch für Tests). */
export function answerStaffOffer(g: Game, ref: MessageEventRef, choice: string): { text: string } {
  const m = (g.staff ?? []).find((x) => x.id === ref.playerId);
  const mine = g.clubs[g.managedClubId];
  const buyerId = String(ref.data?.buyer ?? '');
  const bName = String(ref.data?.buyerName ?? anyClubName(g, buyerId));
  if (!m || !mine) return { text: 'Das Angebot ist hinfällig.' };
  const today = g.calendar.currentDate;
  const fee = Number(ref.data?.fee ?? 0);
  const wish = Number(ref.data?.wish ?? 0);
  if (choice === 'freigeben') {
    book(mine.finances, today, fee, 'other', `Ablöse ${m.name} (${bName})`, true);
    const buyer = g.clubs[buyerId];
    if (buyer) book(buyer.finances, today, -fee, 'staff_wages', `Ablöse ${m.name}`, false);
    closeHeadCoach(g, m.id, 'abgeworben', today);
    g.staff!.splice(g.staff!.indexOf(m), 1);
    g.hiredStaff = g.staff!.map((x) => x.roleId);
    staffMovedTo(g, m, buyerId, today);
    syncHeadCoach(g);
    return { text: `${m.name} wechselt für ${fmtDM(fee)} zu ${bName}. Die Stelle ist frei.` };
  }
  if (choice === 'halten') {
    m.salaryFactor = Math.round(m.salaryFactor * 1.15 * 100) / 100;
    m.loyalty = clamp(m.loyalty + 12, 0, 100);
    return { text: `${m.name} bleibt – zu einem um 15 % höheren Gehalt.` };
  }
  if (wish >= 1) {
    m.loyalty = clamp(m.loyalty - 20, 0, 100);
    return { text: `${m.name} ist enttäuscht, dass du ihn nicht gehen lässt. Seine Bindung an den Verein leidet.` };
  }
  return { text: `${m.name} bleibt – er hatte ohnehin nicht auf einen Wechsel gedrängt.` };
}

CHOICE_HANDLERS[STAFF_OFFER_TYPE] = (g, ref, choice) => answerStaffOffer(g, ref, choice);
