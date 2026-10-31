// =============================================================================
// TRAININGSLAGER – Spielablauf: Buchung im Voraus, Storno, Rückkehr mit Wirkung,
// vereinfachte Lager der KI-Vereine. Rechnung: engine/trainingCamp.ts ·
// Ziele/Quellen: data/campDestinations.ts · Anschluss: game/day.ts (campDaily).
// =============================================================================
import { CAMP_OPP_LABEL, campDestination } from '../data/campDestinations';
import { CalendarEngine } from '../engine/calendar';
import { ensureBrand } from '../engine/clubEconomy';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { recordInjury } from '../engine/history';
import { hashStr, mulberry32 } from '../engine/leagues';
import { createMatchInjury } from '../engine/match/finish';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  CAMP_LEAD_DAYS, CAMP_MAX_DAYS, CAMP_MIN_DAYS, CAMP_REFUND, CAMP_SHORT_NOTICE_DAYS, CAMP_SHORT_NOTICE_SURCHARGE,
  aiCampChoice, campCostBase, campOutlook, campYear, destinationStatus,
} from '../engine/trainingCamp';
import { fmtDM, fmtDay } from '../ui/format';
import { setOwnIndoorDecision } from './indoorGame';
import { leagueClubs } from './season';
import { Game, bumpMorale } from './state';
import {
  CampBooking, CampSeason, campState, competitiveDays, daysBetween, ownIndoorDays, summerWindow, winterWindow,
} from './winterShared';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function campWindow(g: Game, s: CampSeason): { from: string; to: string } {
  return s === 'summer' ? summerWindow(g) : winterWindow(g);
}

/** Die Buchung deines Vereins für Sommer/Winter der laufenden Saison. */
export function ownBooking(g: Game, s: CampSeason): CampBooking | undefined {
  const w = campWindow(g, s);
  return campState(g).bookings.find((b) => b.season === s && b.start >= w.from && b.start <= w.to);
}

export interface CampQuote { costBase: number; cost: number; surcharge: boolean; end: string; error?: string; indoorConflict?: string[] }

/** Preis und Prüfung einer geplanten Buchung (ohne zu buchen). */
export function quoteCamp(g: Game, destId: string, s: CampSeason, start: string, days: number): CampQuote {
  const today = g.calendar.currentDate;
  const club = g.clubs[g.managedClubId];
  const d = campDestination(destId);
  const end = CalendarEngine.addDays(start, Math.max(1, days) - 1);
  const q: CampQuote = { costBase: 0, cost: 0, surcharge: false, end };
  if (!d) return { ...q, error: 'Unbekanntes Ziel.' };
  const year = campYear(g.season, s);
  const st = destinationStatus(d, s, year, club.reputation);
  if (!st.ok) return { ...q, error: `${d.name}: ${st.reason}.` };
  if (days < CAMP_MIN_DAYS || days > CAMP_MAX_DAYS) return { ...q, error: `Dauer ${CAMP_MIN_DAYS}–${CAMP_MAX_DAYS} Tage.` };
  const w = campWindow(g, s);
  q.costBase = campCostBase(d, days, club.reputation);
  const lead = (Date.parse(start + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86_400_000;
  q.surcharge = lead < CAMP_SHORT_NOTICE_DAYS;
  q.cost = Math.round(q.costBase * economyScale(yearOf(start)) * (q.surcharge ? 1 + CAMP_SHORT_NOTICE_SURCHARGE : 1));
  if (lead < CAMP_LEAD_DAYS) return { ...q, error: `Buchung mindestens ${CAMP_LEAD_DAYS} Tage im Voraus.` };
  if (start < w.from || end > w.to) return { ...q, error: `Das Lager muss in die ${s === 'summer' ? 'Sommervorbereitung' : 'Winterpause'} passen (${fmtDay(w.from)} – ${fmtDay(w.to)}).` };
  const busy = competitiveDays(g);
  const range = daysBetween(start, end);
  const clash = range.find((x) => busy.has(x));
  if (clash) return { ...q, error: `Pflichtspiel am ${fmtDay(clash)}.` };
  const indoor = ownIndoorDays(g, true);
  const conflicts = [...new Set(range.filter((x) => indoor.has(x)).map((x) => indoor.get(x)!))];
  const accepted = conflicts.filter((t) => t.own && t.own !== 'decline');
  if (accepted.length) return { ...q, error: `Kollision mit zugesagtem Hallenturnier: ${accepted.map((t) => t.name).join(', ')}.` };
  if (conflicts.length) q.indoorConflict = conflicts.map((t) => t.name);
  return q;
}

/** Bucht ein Lager (Kosten sofort). Liefert Fehlertext oder null. */
export function bookCamp(g: Game, destId: string, s: CampSeason, start: string, days: number, tests: number): string | null {
  if (ownBooking(g, s)) return `Für ${s === 'summer' ? 'den Sommer' : 'den Winter'} ist schon ein Lager gebucht.`;
  const q = quoteCamp(g, destId, s, start, days);
  if (q.error) return q.error;
  const club = g.clubs[g.managedClubId];
  if (club.finances.balance < q.cost) return 'Kontostand zu niedrig.';
  const today = g.calendar.currentDate;
  const d = campDestination(destId)!;
  // Offene Hallen-Einladungen im Zeitraum werden abgesagt.
  const indoor = ownIndoorDays(g, true);
  for (const x of daysBetween(start, q.end)) { const t = indoor.get(x); if (t && t.own === null) setOwnIndoorDecision(g, t.id, 'decline'); }
  book(club.finances, today, -q.cost, 'training_facilities', `Trainingslager ${d.name} (Buchung)`, true);
  campState(g).bookings.push({ id: `camp-${g.season}-${s}`, destId, season: s, start, end: q.end, tests: clamp(Math.round(tests), 0, 4), cost: q.cost, bookedOn: today, done: false });
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Teammanager',
    subject: `Trainingslager gebucht: ${d.name}`,
    shortText: `${fmtDay(start)} – ${fmtDay(q.end)}, ${fmtDM(q.cost)}.`,
    bodyText: `Hotel, Plätze und Reise sind gebucht: ${d.place} (${d.country}), ${fmtDay(start)} bis ${fmtDay(q.end)}.\n`
      + `Kosten: ${fmtDM(q.cost)}${q.surcharge ? ' (inkl. Aufschlag für kurzfristige Buchung)' : ''}. Testspiele vor Ort: ${tests}.\n`
      + (q.indoorConflict?.length ? `\nOffene Hallen-Einladungen im Zeitraum wurden abgesagt: ${q.indoorConflict.join(', ')}.\n` : '')
      + `\nEine Stornierung bringt nur noch ${Math.round(CAMP_REFUND * 100)} % zurück.`,
  }));
  return null;
}

export function cancelCamp(g: Game, id: string): string {
  const st = campState(g);
  const i = st.bookings.findIndex((b) => b.id === id);
  if (i < 0) return 'Buchung nicht gefunden.';
  const b = st.bookings[i];
  const today = g.calendar.currentDate;
  if (b.start <= today || b.done) return 'Das Lager läuft bereits.';
  const refund = Math.round(b.cost * CAMP_REFUND);
  book(g.clubs[g.managedClubId].finances, today, refund, 'training_facilities', 'Storno Trainingslager (50 %)', true);
  st.bookings.splice(i, 1);
  return `Storniert – ${fmtDM(refund)} erstattet.`;
}

// -----------------------------------------------------------------------------
// Tagesablauf
// -----------------------------------------------------------------------------
export function campDaily(g: Game, today: string): void {
  const st = campState(g);
  if (st.aiSeason !== g.season) { st.ai = []; st.aiSeason = g.season; }
  for (const s of ['summer', 'winter'] as CampSeason[]) {
    const w = campWindow(g, s);
    if (today >= w.from && today <= w.to && !st.ai.some((a) => a.season === s)) planAiCamps(g, s, w, today);
  }
  for (const a of st.ai) {
    if (a.applied || a.end > today) continue;
    a.applied = true;
    const club = g.clubs[a.clubId];
    if (!club) continue;
    for (const pid of club.playerIds) {
      const p = g.players[pid];
      if (!p || p.injury) continue;
      p.attributes.fitness = Math.min(100, p.attributes.fitness + 4);
      p.form = clamp(p.form + 1.5, 0, 100);
    }
  }
  for (const b of st.bookings) {
    if (!b.done && b.start === today) arrival(g, b, today);
    if (!b.done && b.end <= today) finishCamp(g, b, today);
  }
}

function planAiCamps(g: Game, s: CampSeason, w: { from: string; to: string }, today: string): void {
  const st = campState(g);
  const year = campYear(g.season, s);
  const scale = economyScale(yearOf(today));
  const rng = mulberry32(hashStr(`camps|${g.season}|${s}`));
  const len = s === 'summer' ? 8 : 7;
  const span = Math.max(0, daysBetween(today, w.to).length - len);
  for (const c of leagueClubs(g)) {
    if (c.id === g.managedClubId) continue;
    const d = aiCampChoice(s, year, c.reputation, c.finances.balance, scale, rng);
    if (!d) continue;
    const start = CalendarEngine.addDays(today, Math.floor(rng() * (span + 1)));
    const end = CalendarEngine.addDays(start, len - 1);
    const cost = Math.round(campCostBase(d, len, c.reputation) * scale);
    book(c.finances, today, -cost, 'training_facilities', `Trainingslager ${d.name}`, false);
    st.ai.push({ clubId: c.id, destId: d.id, season: s, start, end, applied: false });
  }
  if (!st.ai.some((a) => a.season === s)) st.ai.push({ clubId: '', destId: '', season: s, start: today, end: today, applied: true });
}

function arrival(g: Game, b: CampBooking, today: string): void {
  const d = campDestination(b.destId);
  if (!d) return;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Teammanager',
    subject: `Ankunft im Trainingslager: ${d.place}`,
    shortText: `${d.name} bis ${fmtDay(b.end)}.`,
    bodyText: `Die Mannschaft ist in ${d.place} angekommen. ${d.note}\n\nBis ${fmtDay(b.end)} stehen Konditions- und Taktikeinheiten auf dem Plan${b.tests ? `, dazu ${b.tests} Testspiel(e)` : ''}.`,
  }));
}

function finishCamp(g: Game, b: CampBooking, today: string): void {
  b.done = true;
  const d = campDestination(b.destId);
  const club = g.clubs[g.managedClubId];
  if (!d || !club) return;
  const year = campYear(g.season, b.season);
  const days = daysBetween(b.start, b.end).length;
  const o = campOutlook(d, b.season, days, b.tests, year, club.reputation);
  const rng = mulberry32(hashStr(`camp|${b.id}|${today}`));
  // Wetter dieses Mal: Glück oder Pech gegenüber dem Mittel.
  const luck = 1 - (rng() - 0.5) * 2 * (b.season === 'winter' ? d.weather[1] : d.weather[0]);
  const injured: string[] = [];
  let moraleUp = 0;
  for (const pid of club.playerIds) {
    const p = g.players[pid];
    if (!p || p.injury) continue;
    p.attributes.fitness = Math.min(100, p.attributes.fitness + o.fitness * luck);
    p.frische = clamp((p.frische ?? 100) - o.travelFrische, 30, 100);
    p.form = clamp(p.form + o.form * luck - o.travelForm, 0, 100);
    p.development.devPoints = (p.development.devPoints ?? 0) + o.dev * luck;
    if (b.tests) p.development.recentMinutes = (p.development.recentMinutes ?? 0) + b.tests * 40;
    if (rng() < o.morale) { p.morale = bumpMorale(p.morale, 1); moraleUp++; }
    p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) + 2, 0, 100);
    if (g.injuriesEnabled && rng() < o.injury) {
      const inj = createMatchInjury(rng() < 0.75 ? 'minor' : 'moderate', today);
      inj.fromTraining = true;
      inj.description = `${inj.description} (Trainingslager)`;
      p.injury = inj; p.availability = 'injured'; recordInjury(p, inj);
      injured.push(`${p.fullName} – ${inj.description}, ${inj.totalDays} Tage`);
    }
  }
  const scale = economyScale(yearOf(today));
  const income = Math.round(o.testIncome * scale);
  if (income > 0) book(club.finances, today, income, 'matchday', `Testspiele im Trainingslager ${d.name}`, true);
  const sponsor = Math.round(o.sponsorBase * scale);
  if (sponsor > 0) book(club.finances, today, sponsor, 'sponsorship', `Marketing-Erlöse ${d.name}`, true);
  if (o.brandIntl > 0) { const br = ensureBrand(club); br.international = clamp(br.international + o.brandIntl, 0, 100); }
  if (o.criticism > 0 && g.environment) g.environment.fanMood = clamp(g.environment.fanMood - o.criticism, 0, 100);
  const note = `${d.name}: Fitness +${(o.fitness * luck).toFixed(1)}, Form ${(o.form * luck - o.travelForm >= 0 ? '+' : '')}${(o.form * luck - o.travelForm).toFixed(1)}, ${injured.length} verletzt`;
  b.report = note;
  campState(g).history.push({ season: g.season, destId: d.id, campSeason: b.season, note });
  if (campState(g).history.length > 60) campState(g).history.shift();
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Trainerstab',
    subject: `Zurück aus dem Trainingslager (${d.place})`,
    shortText: note,
    bodyText: `Bilanz des Trainingslagers in ${d.place}:\n\n`
      + `• Kondition: +${(o.fitness * luck).toFixed(1)} Fitness je Spieler${luck < 0.95 ? ' (Wetter hat Einheiten gekostet)' : luck > 1.05 ? ' (bestes Wetter)' : ''}\n`
      + `• Taktik & Technik: zusätzliche Entwicklungsschritte, ${moraleUp} Spieler mit besserer Stimmung\n`
      + (o.travelFrische > 0 ? `• Reisestrapazen: Frische −${o.travelFrische}${o.travelForm > 0 ? `, Form −${o.travelForm} (Zeitverschiebung ${d.tz > 0 ? '+' : ''}${d.tz} h)` : ''}\n` : '')
      + (income > 0 ? `• Testspiele (${CAMP_OPP_LABEL[d.opp]}): +${fmtDM(income)}\n` : '')
      + (sponsor > 0 ? `• Marketing/Sponsoren: +${fmtDM(sponsor)}, internationale Bekanntheit steigt\n` : '')
      + (o.criticism > 0 ? `• Kritik: ${o.criticismText ?? ''} Fan-Stimmung −${o.criticism}\n` : '')
      + (injured.length ? `\nVerletzt:\n${injured.map((x) => '• ' + x).join('\n')}` : '\nKeine Verletzten.'),
  }));
}
