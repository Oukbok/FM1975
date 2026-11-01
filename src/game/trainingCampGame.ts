// =============================================================================
// TRAININGSLAGER – Spielablauf: Buchung im Voraus (Ziel, Unterkunft, Schwerpunkt),
// Sponsor-Pflichten, Storno, Rückkehr mit Wirkung, verzögertes Höhentraining,
// Lager der KI-Vereine. Rechnung: engine/trainingCamp.ts · Ziele/Quellen:
// data/campDestinations.ts · Unterkünfte: data/campLodgings.ts · Anschluss: game/day.ts.
// =============================================================================
import { CAMP_OPP_LABEL, campDestination } from '../data/campDestinations';
import { campLodging, defaultLodging, lodgingsFor } from '../data/campLodgings';
import { CalendarEngine } from '../engine/calendar';
import { ensureBrand } from '../engine/clubEconomy';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { recordInjury } from '../engine/history';
import { hashStr, mulberry32 } from '../engine/leagues';
import { createMatchInjury } from '../engine/match/finish';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  CAMP_ALTITUDE_DELAY, CAMP_FOCUS, CAMP_LEAD_DAYS, CAMP_MAX_DAYS, CAMP_MIN_DAYS, CAMP_REFUND, CAMP_SHORT_NOTICE_DAYS,
  CAMP_SHORT_NOTICE_SURCHARGE, CAMP_YOUTH_AGE, CampFocus, aiCampChoice, campCostBase, campOutlook, campYear, destinationStatus,
} from '../engine/trainingCamp';
import type { Club } from '../types';
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

// -----------------------------------------------------------------------------
// Sponsor-Klauseln (Schnittstelle: club.commerce.campObligations, Strang Sponsoring)
// -----------------------------------------------------------------------------
/**
 * Pflichtziel eines Vereins für ein Fenster der laufenden Saison (oder undefined). Eine
 * Pflicht zählt nur, wenn das Ziel in diesem Fenster und Jahr überhaupt angeboten wird.
 */
export function campObligation(g: Game, club: Club | undefined, s: CampSeason, season = g.season): string | undefined {
  const ob = club?.commerce?.campObligations?.find((o) => o.season === season && o.window === s);
  if (!ob) return undefined;
  const d = campDestination(ob.destId);
  if (!d) return undefined;
  const st = destinationStatus(d, s, campYear(season, s), 100);
  return st.ok ? d.id : undefined;
}

/** Hat der Verein seine Sponsor-Pflicht im Fenster erfüllt (gebucht bzw. gefahren)? */
export function campObligationMet(g: Game, clubId: string, s: CampSeason): boolean | undefined {
  const club = g.clubs[clubId];
  const dest = campObligation(g, club, s);
  if (!dest) return undefined;
  if (clubId === g.managedClubId) return ownBooking(g, s)?.destId === dest;
  return campState(g).ai.some((a) => a.clubId === clubId && a.season === s && a.destId === dest);
}

// -----------------------------------------------------------------------------
// Buchung
// -----------------------------------------------------------------------------
export interface CampChoice { lodgingId?: string; focus?: CampFocus }
export interface CampQuote { costBase: number; cost: number; surcharge: boolean; end: string; error?: string; indoorConflict?: string[] }

/** Preis und Prüfung einer geplanten Buchung (ohne zu buchen). */
export function quoteCamp(g: Game, destId: string, s: CampSeason, start: string, days: number, opt: CampChoice = {}): CampQuote {
  const today = g.calendar.currentDate;
  const club = g.clubs[g.managedClubId];
  const d = campDestination(destId);
  const end = CalendarEngine.addDays(start, Math.max(1, days) - 1);
  const q: CampQuote = { costBase: 0, cost: 0, surcharge: false, end };
  if (!d) return { ...q, error: 'Unbekanntes Ziel.' };
  const year = campYear(g.season, s);
  const ob = campObligation(g, club, s);
  const st = destinationStatus(d, s, year, club.reputation, ob);
  if (!st.ok) return { ...q, error: ob && ob !== d.id ? `Sponsor-Vertrag: Pflicht-Trainingslager in ${campDestination(ob)?.name}.` : `${d.name}: ${st.reason}.` };
  const l = opt.lodgingId ? lodgingsFor(d.id, year).find((x) => x.id === opt.lodgingId) : defaultLodging(d.id, year);
  if (!l) return { ...q, error: 'Diese Unterkunft ist in diesem Jahr nicht buchbar.' };
  if (days < CAMP_MIN_DAYS || days > CAMP_MAX_DAYS) return { ...q, error: `Dauer ${CAMP_MIN_DAYS}–${CAMP_MAX_DAYS} Tage.` };
  const w = campWindow(g, s);
  q.costBase = campCostBase(d, l, days, club.reputation, opt.focus ?? 'ausgewogen');
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
export function bookCamp(g: Game, destId: string, s: CampSeason, start: string, days: number, tests: number, opt: CampChoice = {}): string | null {
  if (ownBooking(g, s)) return `Für ${s === 'summer' ? 'den Sommer' : 'den Winter'} ist schon ein Lager gebucht.`;
  const q = quoteCamp(g, destId, s, start, days, opt);
  if (q.error) return q.error;
  const club = g.clubs[g.managedClubId];
  if (club.finances.balance < q.cost) return 'Kontostand zu niedrig.';
  const today = g.calendar.currentDate;
  const d = campDestination(destId)!;
  const l = opt.lodgingId ? campLodging(destId, opt.lodgingId)! : defaultLodging(destId, campYear(g.season, s))!;
  const focus = opt.focus ?? 'ausgewogen';
  // Offene Hallen-Einladungen im Zeitraum werden abgesagt.
  const indoor = ownIndoorDays(g, true);
  for (const x of daysBetween(start, q.end)) { const t = indoor.get(x); if (t && t.own === null) setOwnIndoorDecision(g, t.id, 'decline'); }
  book(club.finances, today, -q.cost, 'training_facilities', `Trainingslager ${d.name} (Buchung)`, true);
  campState(g).bookings.push({
    id: `camp-${g.season}-${s}`, destId, lodgingId: l.id, focus, season: s, start, end: q.end,
    tests: clamp(Math.round(tests), 0, 4), cost: q.cost, bookedOn: today, done: false,
  });
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Teammanager',
    subject: `Trainingslager gebucht: ${d.name}`,
    shortText: `${l.name}, ${fmtDay(start)} – ${fmtDay(q.end)}, ${fmtDM(q.cost)}.`,
    bodyText: `Unterkunft, Plätze und Reise sind gebucht: ${l.name} in ${d.place} (${d.country}), ${fmtDay(start)} bis ${fmtDay(q.end)}.\n`
      + `Schwerpunkt: ${CAMP_FOCUS[focus].label}. Testspiele vor Ort: ${tests}.\n`
      + `Kosten: ${fmtDM(q.cost)}${q.surcharge ? ' (inkl. Aufschlag für kurzfristige Buchung)' : ''}.\n`
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
    applyAiCamp(g, a.clubId, a.destId, a.lodgingId, a.focus, a.season, daysBetween(a.start, a.end).length, a.start);
  }
  for (const b of st.bookings) {
    if (!b.done && b.start === today) arrival(g, b, today);
    if (!b.done && b.end <= today) finishCamp(g, b, today);
    if (b.delayed && !b.delayed.done && b.delayed.due <= today) altitudeEffect(g, b, today);
  }
}

/** Vereinfachte Wirkung bei KI-Vereinen (etwa ein Drittel des eigenen Lagers). */
function applyAiCamp(g: Game, clubId: string, destId: string, lodgingId: string | undefined, focus: CampFocus | undefined, s: CampSeason, days: number, start: string): void {
  const club = g.clubs[clubId];
  const d = campDestination(destId);
  if (!club || !d) return;
  const year = campYear(g.season, s);
  const l = campLodging(destId, lodgingId) ?? defaultLodging(destId, year);
  if (!l) return;
  const o = campOutlook({ d, l, focus: focus ?? 'ausgewogen', season: s, days, tests: 2, year, rep: club.reputation, start });
  const fit = clamp((o.fitness + o.altitudeFitness) * 0.35, 1.5, 6);
  const form = clamp(o.form * 0.35, -1, 2.5);
  for (const pid of club.playerIds) {
    const p = g.players[pid];
    if (!p || p.injury) continue;
    p.attributes.fitness = Math.min(100, p.attributes.fitness + fit);
    p.form = clamp(p.form + form, 0, 100);
  }
}

function planAiCamps(g: Game, s: CampSeason, w: { from: string; to: string }, today: string): void {
  const st = campState(g);
  const year = campYear(g.season, s);
  const scale = economyScale(yearOf(today));
  const rng = mulberry32(hashStr(`camps|${g.season}|${s}`));
  const len = s === 'summer' ? 8 : 7;
  // Winterlager in den letzten vier Wochen vor dem Rückrundenstart (lange Pausen der
  // 80er/90er: Dezember ist Urlaub/Halle, das Lager liegt im Januar/Februar).
  const lateFrom = s === 'winter' ? CalendarEngine.addDays(w.to, -28) : today;
  const from = lateFrom > today ? lateFrom : today;
  const span = Math.max(0, daysBetween(from, w.to).length - len);
  for (const c of leagueClubs(g)) {
    if (c.id === g.managedClubId) continue;
    const pick = aiCampChoice(s, year, c.reputation, c.finances.balance, scale, rng, {
      style: c.coach?.style, philosophy: c.coach?.philosophy, obligation: campObligation(g, c, s),
    });
    if (!pick) continue;
    const start = CalendarEngine.addDays(from, Math.floor(rng() * (span + 1)));
    const end = CalendarEngine.addDays(start, len - 1);
    // Unterklassige Vereine reisen deutlich günstiger (Bus, Sportschule, kürzer) – sonst
    // fräße das Lager in Liga 3/4 bis zu 10 % des Umsatzes.
    const tier = c.finances.leagueTier ?? 1;
    const tierF = tier <= 1 ? 1 : tier === 2 ? 0.6 : tier === 3 ? 0.3 : 0.18;
    const cost = Math.round(campCostBase(pick.d, pick.l, len, c.reputation, pick.focus) * scale * tierF);
    book(c.finances, today, -cost, 'training_facilities', `Trainingslager ${pick.d.name}`, false);
    st.ai.push({ clubId: c.id, destId: pick.d.id, lodgingId: pick.l.id, focus: pick.focus, season: s, start, end, applied: false });
  }
  if (!st.ai.some((a) => a.season === s)) st.ai.push({ clubId: '', destId: '', season: s, start: today, end: today, applied: true });
}

function arrival(g: Game, b: CampBooking, today: string): void {
  const d = campDestination(b.destId);
  if (!d) return;
  const l = campLodging(b.destId, b.lodgingId);
  const f = CAMP_FOCUS[b.focus ?? 'ausgewogen'];
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Teammanager',
    subject: `Ankunft im Trainingslager: ${d.place}`,
    shortText: `${l?.name ?? d.name} bis ${fmtDay(b.end)}.`,
    bodyText: `Die Mannschaft ist in ${d.place} angekommen${l ? ` (${l.name})` : ''}. ${d.note.replace(/\s*\[C\d+\](\[C\d+\])*/g, '')}\n\n`
      + `Schwerpunkt bis ${fmtDay(b.end)}: ${f.label} – ${f.text}${b.tests ? `\nDazu ${b.tests} Testspiel(e) gegen ${CAMP_OPP_LABEL[d.opp]}.` : ''}`,
  }));
}

function finishCamp(g: Game, b: CampBooking, today: string): void {
  b.done = true;
  const d = campDestination(b.destId);
  const club = g.clubs[g.managedClubId];
  if (!d || !club) return;
  const year = campYear(g.season, b.season);
  const l = campLodging(b.destId, b.lodgingId) ?? defaultLodging(b.destId, year);
  if (!l) return;
  const focus = b.focus ?? 'ausgewogen';
  const days = daysBetween(b.start, b.end).length;
  const o = campOutlook({ d, l, focus, season: b.season, days, tests: b.tests, year, rep: club.reputation, start: b.start });
  const rng = mulberry32(hashStr(`camp|${b.id}|${today}`));
  // Wetter dieses Mal: Glück oder Pech gegenüber dem Mittel (Spanne wie in der Vorschau).
  const luck = 1 - o.weatherRisk * 0.6 + rng() * o.weatherRisk * 0.9;
  const injured: string[] = [];
  const incidents: string[] = [];
  const grumble: string[] = [];
  let moraleUp = 0, healed = 0, steadier = 0;
  for (const pid of club.playerIds) {
    const p = g.players[pid];
    if (!p) continue;
    if (p.injury) {
      // Verletzte reisen mit: Regeneration beschleunigt die Heilung.
      if (o.heal > 0 && p.injury.daysRemaining > 1) {
        const cut = Math.min(p.injury.daysRemaining - 1, o.heal);
        p.injury.daysRemaining -= cut;
        p.injury.expectedReturnDate = CalendarEngine.addDays(today, p.injury.daysRemaining);
        healed++;
      }
      continue;
    }
    const young = p.age <= CAMP_YOUTH_AGE;
    const dv = p.development;
    p.attributes.fitness = Math.min(100, p.attributes.fitness + o.fitness * luck);
    p.frische = clamp((p.frische ?? 100) - o.travelFrische + o.campFrische, 30, 100);
    p.form = clamp(p.form + (o.form + o.travelForm) * luck - o.travelForm, 0, 100);
    dv.devPoints = (dv.devPoints ?? 0) + (young ? o.devYouth : o.dev) * luck;
    if (b.tests) dv.recentMinutes = (dv.recentMinutes ?? 0) + b.tests * (young && focus === 'jugend' ? 60 : 40);
    const mChance = young && focus === 'jugend' ? Math.min(0.9, o.morale * 1.5) : o.morale;
    if (rng() < mChance) { p.morale = bumpMorale(p.morale, 1); moraleUp++; }
    if (o.starGrumble && p.age >= 28 && rng() < o.starGrumble) { p.morale = bumpMorale(p.morale, -1); grumble.push(p.fullName); }
    p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) + o.satisfaction, 0, 100);
    // Disziplin: Ablenkung verführt die weniger Professionellen, Abgeschiedenheit erzieht.
    const prof = dv.professionalism ?? 50;
    if (rng() < o.discipline * (1.5 - prof / 100)) {
      dv.professionalism = clamp(prof - 3, 0, 100);
      p.form = clamp(p.form - 2, 0, 100);
      dv.devPoints = (dv.devPoints ?? 0) - 0.2;
      incidents.push(p.fullName);
    } else if (prof < 60 && rng() < o.disciplineGain) {
      dv.professionalism = clamp(prof + 1, 0, 100);
      steadier++;
    }
    if (g.injuriesEnabled && rng() < o.injury) {
      const inj = createMatchInjury(rng() < 0.75 ? 'minor' : 'moderate', today);
      inj.fromTraining = true;
      inj.description = `${inj.description} (Trainingslager)`;
      p.injury = inj; p.availability = 'injured'; recordInjury(p, inj);
      injured.push(`${p.fullName} – ${inj.description}, ${inj.totalDays} Tage`);
    }
  }
  if (o.altitudeFitness > 0) b.delayed = { due: CalendarEngine.addDays(today, CAMP_ALTITUDE_DELAY), fitness: o.altitudeFitness * luck };
  const scale = economyScale(yearOf(today));
  const income = Math.round(o.testIncome * scale);
  if (income > 0) book(club.finances, today, income, 'matchday', `Testspiele im Trainingslager ${d.name}`, true);
  const sponsor = Math.round(o.sponsorBase * scale);
  if (sponsor > 0) book(club.finances, today, sponsor, 'sponsorship', `Marketing-Erlöse ${d.name}`, true);
  if (o.brandIntl > 0) { const br = ensureBrand(club); br.international = clamp(br.international + o.brandIntl, 0, 100); }
  const fan = o.fanMood - o.criticism;
  if (fan !== 0 && g.environment) g.environment.fanMood = clamp(g.environment.fanMood + fan, 0, 100);
  const fitTxt = (o.fitness * luck).toFixed(1);
  const formV = (o.form + o.travelForm) * luck - o.travelForm;
  const note = `${d.name} (${l.name}, ${CAMP_FOCUS[focus].label}): Fitness +${fitTxt}, Form ${formV >= 0 ? '+' : ''}${formV.toFixed(1)}, ${injured.length} verletzt${incidents.length ? `, ${incidents.length} Disziplinverstöße` : ''}`;
  b.report = note;
  campState(g).history.push({ season: g.season, destId: d.id, campSeason: b.season, note });
  if (campState(g).history.length > 60) campState(g).history.shift();
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Trainerstab',
    subject: `Zurück aus dem Trainingslager (${d.place})`,
    shortText: note,
    bodyText: `Bilanz des Trainingslagers in ${d.place} (${l.name}, Schwerpunkt ${CAMP_FOCUS[focus].label}):\n\n`
      + `• Kondition: +${fitTxt} Fitness je Spieler${luck < 0.95 ? ' (Wetter hat Einheiten gekostet)' : luck > 1.05 ? ' (bestes Wetter)' : ''}\n`
      + (o.altitudeFitness > 0 ? `• Höhentraining (${o.altitude} m): weitere +${(o.altitudeFitness * luck).toFixed(1)} Fitness in etwa ${CAMP_ALTITUDE_DELAY} Tagen\n` : '')
      + `• Taktik & Technik: zusätzliche Entwicklungsschritte${focus === 'jugend' ? ' – besonders für die Jungen' : ''}; ${moraleUp} Spieler mit besserer Stimmung\n`
      + (grumble.length ? `• Unmut über die einfache Unterkunft: ${grumble.join(', ')}\n` : '')
      + (incidents.length ? `• Disziplin: Zapfenstreich verpasst – ${incidents.join(', ')}\n` : steadier ? `• Disziplin: Die Abgeschiedenheit hat ${steadier} Spielern gutgetan.\n` : '')
      + (healed ? `• Regeneration: ${healed} Verletzte kommen früher zurück\n` : '')
      + (o.travelFrische > 0 ? `• Reisestrapazen: Frische −${o.travelFrische}${o.travelForm > 0 ? `, Form −${o.travelForm} (Zeitverschiebung ${d.tz > 0 ? '+' : ''}${d.tz} h)` : ''}\n` : '')
      + (income > 0 ? `• Testspiele (${CAMP_OPP_LABEL[d.opp]}): +${fmtDM(income)}\n` : '')
      + (sponsor > 0 ? `• Marketing/Sponsoren: +${fmtDM(sponsor)}, internationale Bekanntheit steigt\n` : '')
      + (o.fanMood > 0 ? `• Zaungäste beim Training: Fan-Stimmung +${o.fanMood}\n` : '')
      + (o.criticism > 0 ? `• Kritik: ${o.criticismText ?? ''} Fan-Stimmung −${o.criticism}\n` : '')
      + (injured.length ? `\nVerletzt:\n${injured.map((x) => '• ' + x).join('\n')}` : '\nKeine Verletzten.'),
  }));
}

/** Verzögerte Wirkung des Höhentrainings (rote Blutkörperchen brauchen Zeit). */
function altitudeEffect(g: Game, b: CampBooking, today: string): void {
  const del = b.delayed!;
  del.done = true;
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  for (const pid of club.playerIds) {
    const p = g.players[pid];
    if (!p || p.injury) continue;
    p.attributes.fitness = Math.min(100, p.attributes.fitness + del.fitness);
  }
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Trainerstab',
    subject: 'Höhentraining zahlt sich aus',
    shortText: `Fitness +${del.fitness.toFixed(1)} je Spieler.`,
    bodyText: `Zwei Wochen nach der Rückkehr aus der Höhe greift die Anpassung: Die Spieler haben spürbar mehr Luft (Fitness +${del.fitness.toFixed(1)} je Spieler).`,
  }));
}
