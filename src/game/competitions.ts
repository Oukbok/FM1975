import { EURO_COMP_NAMES, EuroClub, EuroCompId } from '../data/europe';
import { CalendarEngine } from '../engine/calendar';
import { decisionBadge } from '../engine/cup';
import { createEuroCup } from '../engine/euro';
import { cupWinnersCupActive } from '../data/history';
import { makeMessage } from '../engine/messages';
import { Club, CupState, CupTie, GameCalendar, InboxMessage, Match } from '../types';
import { hashSeed } from './state';

/** Fügt für jede Pokalrunde ein Kalender-Event ein (chronologisch einsortiert). */
export function addCupCalendarEvents(calendar: GameCalendar, cup: CupState): void {
  let cnt = 0;
  for (const round of cup.rounds) {
    calendar.events.push({
      id: `cupev_${round.index}`,
      date: round.date,
      type: 'cup_matchday',
      title: `Landespokal: ${round.name}`,
      description: `${round.name} im Landespokal ${cup.season}.`,
      cupRoundIndex: round.index,
      processed: false,
      requiresAction: false,
    });
    cnt++;
  }
  calendar.events.sort((a, b) => a.date.localeCompare(b.date));
  void cnt;
}

/** Baut die Menge aller Liga-Spieltag-Daten (für kollisionsfreie Pokaltermine). */
export function leagueDateSet(fixtures: Match[]): Set<string> {
  return new Set(fixtures.map((m) => m.date));
}

// -----------------------------------------------------------------------------
// EUROPAPOKAL — Hilfsfunktionen für Kalender, Aufbau & Nachrichten
// -----------------------------------------------------------------------------

/** Menge aller Landespokal-Termine (zur Kollisionsvermeidung der Euro-Termine). */
export function cupDateSet(cup: CupState | null | undefined): Set<string> {
  const s = new Set<string>();
  if (cup) for (const r of cup.rounds) s.add(r.date);
  return s;
}

/** Fügt für jede Runde eines Europapokals ein Kalender-Event ein. */
export function addEuroCalendarEvents(calendar: GameCalendar, comp: EuroCompId, cup: CupState): void {
  for (const round of cup.rounds) {
    calendar.events.push({
      id: `euroev_${comp}_${round.index}`,
      date: round.date,
      type: 'euro_matchday',
      title: `${EURO_COMP_NAMES[comp]}: ${round.name}`,
      description: `${round.name} im ${EURO_COMP_NAMES[comp]} ${cup.season}.`,
      cupRoundIndex: round.index,
      euroComp: comp,
      processed: false,
      requiresAction: false,
    });
  }
  calendar.events.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Erstellt die drei Europapokal-Wettbewerbe für eine Saison, ergänzt die
 * Kalendereinträge und liefert sie als `euroCups`-Objekt zurück. Deutsche
 * Starter kommen aus `quals`; auslaendische fix aus europe.ts (getrennt je comp).
 */
export function buildEuroCupsForSeason(
  quals: Record<EuroCompId, string[]>,
  euroClubs: Record<string, EuroClub>,
  leagueDates: Set<string>,
  cupDates: Set<string>,
  seedBase: string,
  earliest: string,
  managedClubId: string,
  calendar: GameCalendar,
  foreign?: Record<EuroCompId, string[]> | null,
): { ec: CupState | null; cwc: CupState | null; uefa: CupState | null } {
  // Ausländische Starter: aus der Europa-Simulation (engine/world.ts) oder – in der
  // ersten Saison/alten Spielständen – der historische Satz aus data/europe.ts.
  const foreignByComp: Record<EuroCompId, string[]> = foreign
    ? { ec: [...foreign.ec], cwc: [...foreign.cwc], uefa: [...foreign.uefa] }
    : { ec: [], cwc: [], uefa: [] };
  if (!foreign) {
    for (const c of Object.values(euroClubs)) if (c.id.startsWith('eu_')) foreignByComp[c.comp].push(c.id);
  }

  const comps: EuroCompId[] = ['ec', 'cwc', 'uefa'];
  const out: { ec: CupState | null; cwc: CupState | null; uefa: CupState | null } = {
    ec: null, cwc: null, uefa: null,
  };
  // Ab 1999/2000 gibt es den Pokal der Pokalsieger nicht mehr: Der Pokalsieger
  // spielt im Europa-Pokal (historisch: Zusammenlegung mit dem UEFA-Pokal).
  const startYear = Number(earliest.slice(0, 4)) - (Number(earliest.slice(5, 7)) >= 7 ? 0 : 1);
  if (!cupWinnersCupActive(startYear)) {
    quals = { ...quals, uefa: [...(quals.cwc ?? []), ...(quals.uefa ?? [])], cwc: [] };
  }
  const FIELD: Record<EuroCompId, number> = { ec: 16, cwc: 16, uefa: 32 };
  for (const comp of comps) {
    const germanIds = (quals[comp] ?? []).filter(Boolean);
    if (germanIds.length === 0) continue;
    const cup = createEuroCup(
      comp,
      germanIds,
      foreignByComp[comp].slice(0, Math.max(0, FIELD[comp] - germanIds.length)),
      leagueDates,
      cupDates,
      hashSeed(`${seedBase}:euro:${comp}`),
      earliest,
      managedClubId,
    );
    addEuroCalendarEvents(calendar, comp, cup);
    out[comp] = cup;
  }
  return out;
}

/** Baut die Auslosungs-Info-Nachricht des Europapokals (nur wenn Spieler dabei). */
export function euroDrawMessage(
  comp: EuroCompId, cup: CupState, clubs: Record<string, Club>,
  euroClubs: Record<string, EuroClub>, managedClubId: string,
  roundIndex: number, date: string,
): InboxMessage | null {
  const round = cup.rounds[roundIndex];
  if (!round) return null;
  const myTie = round.ties.find((t) => t.involvesPlayerClub);
  if (!myTie) return null; // Nachrichten nur, wenn der Spielerverein beteiligt ist.
  const name = (id: string) => clubs[id]?.name ?? euroClubs[id]?.name ?? id;
  const heim = myTie.homeClubId === managedClubId;
  const gegner = heim ? name(myTie.awayClubId) : name(myTie.homeClubId);
  const compName = EURO_COMP_NAMES[comp];
  return makeMessage({
    date,
    category: 'cup',
    from: 'Europapokal-Kommission',
    subject: `Auslosung ${round.name} — ${compName} ${cup.season}`,
    shortText: `Dein Los: ${gegner}`,
    bodyText: `Die Auslosung der ${round.name} im ${compName} ${cup.season} ist erfolgt.\n\n`
      + `Deine Begegnung: ${heim ? 'Heimspiel gegen' : 'Auswärts bei'} ${gegner} (${CalendarEngine.formatDate(round.date)}).\n\nViel Erfolg in Europa!`,
    actionRequired: false,
  });
}

/** Baut die Ergebnis-Nachricht der eigenen Europapokal-Begegnung. */
export function euroResultMessage(
  comp: EuroCompId, cup: CupState, clubs: Record<string, Club>,
  euroClubs: Record<string, EuroClub>, managedClubId: string,
  tie: CupTie, roundIndex: number, prize: number,
): InboxMessage {
  const round = cup.rounds[roundIndex];
  const name = (id: string) => clubs[id]?.name ?? euroClubs[id]?.name ?? id;
  const myHome = tie.homeClubId === managedClubId;
  const opp = myHome ? name(tie.awayClubId) : name(tie.homeClubId);
  const advanced = tie.winnerClubId === managedClubId;
  const isFinal = roundIndex === cup.rounds.length - 1;
  const badge = decisionBadge(tie);
  const scoreLine = `${tie.homeGoals}:${tie.awayGoals}${badge ? ' ' + badge : ''}${tie.penalties ? ` (Elfmeter ${tie.penalties.home}:${tie.penalties.away})` : ''}`;
  const hName = name(tie.homeClubId); const aName = name(tie.awayClubId);
  const compName = EURO_COMP_NAMES[comp];
  let subject: string; let shortText: string; let body: string;
  if (isFinal && advanced) {
    subject = `Europapokalsieger! ${compName} ${cup.season}`;
    shortText = `Ihr habt den ${compName} gewonnen!`;
    body = `Sensation! Im Finale des ${compName} ${cup.season} setzte sich dein Verein mit ${scoreLine} gegen ${opp} durch.\n\nEin historischer Triumph in Europa! Prämie: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else if (advanced) {
    subject = `Europapokal: Weiter! ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} gewonnen — weiter in Europa.`;
    body = `${round.name}, ${compName} ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein steht in der nächsten Runde! Prämie für diese Runde: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else {
    subject = `Europapokal-Aus: ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} verloren — in Europa ausgeschieden.`;
    body = `${round.name}, ${compName} ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein ist gegen ${opp} ausgeschieden. Der Europapokal-Traum ist für diese Saison beendet.`;
  }
  return makeMessage({
    date: tie.date, category: 'cup', from: 'Spielbericht Europapokal',
    subject, shortText, bodyText: body, relatedId: tie.match?.id,
  });
}

/** Dezente Chronik-Notiz zum Europapokalsieger (auch wenn nicht der Spieler). */
export function euroWinnerChronicle(
  comp: EuroCompId, cup: CupState, clubs: Record<string, Club>,
  euroClubs: Record<string, EuroClub>, date: string,
): InboxMessage {
  const winner = cup.winnerClubId;
  const wname = winner ? (clubs[winner]?.name ?? euroClubs[winner]?.name ?? winner) : '';
  const compName = EURO_COMP_NAMES[comp];
  return makeMessage({
    date, category: 'media', from: 'Europapokal-Chronik',
    subject: `${compName} ${cup.season}: ${wname}`,
    shortText: `${wname} gewinnt den ${compName}.`,
    bodyText: `Das Finale des ${compName} ${cup.season} ist entschieden. ${wname} sichert sich den Titel.`,
    actionRequired: false,
  });
}

/** Baut die erste Pokal-Auslosungs-Nachricht (1. Hauptrunde). */
export function cupDrawMessage(cup: CupState, clubs: Record<string, Club>, managedClubId: string, date: string): InboxMessage {
  const round = cup.rounds[cup.currentRoundIndex];
  const myTie = round.ties.find((t) => t.involvesPlayerClub);
  const name = (id: string) => clubs[id]?.name ?? id;
  let body = `Die Auslosung der ${round.name} des Landespokals ${cup.season} ist erfolgt. 32 Mannschaften kämpfen um den Pokal — 18 Bundesligisten und 14 Amateurvereine.\n\n`;
  if (myTie) {
    const heim = myTie.homeClubId === managedClubId;
    const gegner = heim ? name(myTie.awayClubId) : name(myTie.homeClubId);
    body += `Deine Begegnung: ${heim ? 'Heimspiel gegen' : 'Auswärts bei'} ${gegner} (${CalendarEngine.formatDate(round.date)}).\n\nViel Erfolg im Pokal!`;
  } else {
    body += 'Dein Verein ist in dieser Saison nicht für den Pokal gesetzt.';
  }
  return makeMessage({
    date,
    category: 'cup',
    from: 'Landespokal-Kommission',
    subject: `Auslosung ${round.name} — Landespokal ${cup.season}`,
    shortText: myTie
      ? `Dein Los: ${myTie.homeClubId === managedClubId ? name(myTie.awayClubId) : name(myTie.homeClubId)}`
      : 'Die 1. Hauptrunde ist ausgelost.',
    bodyText: body,
    actionRequired: false,
  });
}

/** Baut die Auslosungs-Nachricht einer Folgerunde (Achtelfinale … Finale). */
export function cupNextDrawMessage(cup: CupState, clubs: Record<string, Club>, managedClubId: string, roundIndex: number, date: string): InboxMessage {
  const round = cup.rounds[roundIndex];
  const myTie = round.ties.find((t) => t.involvesPlayerClub);
  const name = (id: string) => clubs[id]?.name ?? id;
  let body = `Die Auslosung des ${round.name} im Landespokal ${cup.season} ist erfolgt. Noch ${round.ties.length * 2} Mannschaften sind im Wettbewerb.\n\n`;
  if (myTie) {
    const heim = myTie.homeClubId === managedClubId;
    const gegner = heim ? name(myTie.awayClubId) : name(myTie.homeClubId);
    body += `Deine Begegnung: ${heim ? 'Heimspiel gegen' : 'Auswärts bei'} ${gegner} (${CalendarEngine.formatDate(round.date)}).\n\nWeiter geht's im Pokal!`;
  } else {
    body += 'Dein Verein ist im Pokal bereits ausgeschieden.';
  }
  return makeMessage({
    date,
    category: 'cup',
    from: 'Landespokal-Kommission',
    subject: `Auslosung ${round.name} — Landespokal ${cup.season}`,
    shortText: myTie
      ? `Dein Los: ${myTie.homeClubId === managedClubId ? name(myTie.awayClubId) : name(myTie.homeClubId)}`
      : `${round.name} ausgelost.`,
    bodyText: body,
    actionRequired: false,
  });
}

/** Baut die Ergebnis-Nachricht der eigenen Pokalbegegnung (Weiterkommen/Aus/Sieg). */
export function cupResultMessage(cup: CupState, clubs: Record<string, Club>, managedClubId: string, tie: CupTie, roundIndex: number, prize: number): InboxMessage {
  const round = cup.rounds[roundIndex];
  const name = (id: string) => clubs[id]?.name ?? id;
  const myHome = tie.homeClubId === managedClubId;
  const opp = myHome ? name(tie.awayClubId) : name(tie.homeClubId);
  const advanced = tie.winnerClubId === managedClubId;
  const isFinal = roundIndex === cup.rounds.length - 1;
  const badge = decisionBadge(tie);
  const scoreLine = `${tie.homeGoals}:${tie.awayGoals}${badge ? ' ' + badge : ''}${tie.penalties ? ` (Elfmeter ${tie.penalties.home}:${tie.penalties.away})` : ''}`;
  const hName = name(tie.homeClubId); const aName = name(tie.awayClubId);
  let subject: string; let shortText: string; let body: string;
  if (isFinal && advanced) {
    subject = `Landespokalsieger ${cup.season}!`;
    shortText = 'Ihr habt den Landespokal gewonnen!';
    body = `Sensation! Im Finale des Landespokals ${cup.season} setzte sich dein Verein mit ${scoreLine} gegen ${opp} durch.\n\nDer Landespokal steht in der Vitrine — ein historischer Triumph! Prämie: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else if (advanced) {
    subject = `Pokal: Weiter! ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} gewonnen — weiter im Pokal.`;
    body = `${round.name}, Landespokal ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein steht in der nächsten Runde! Prämie für diese Runde: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else {
    subject = `Pokal-Aus: ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} verloren — im Pokal ausgeschieden.`;
    body = `${round.name}, Landespokal ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein ist gegen ${opp} ausgeschieden. Der Pokaltraum ist für diese Saison beendet.`;
  }
  return makeMessage({
    date: tie.date, category: 'cup', from: 'Spielbericht Pokal',
    subject, shortText, bodyText: body, relatedId: tie.match?.id,
  });
}
