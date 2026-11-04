// =============================================================================
// HALLENFUSSBALL – Abgleich mit den Pflichtspielen (Wunsch Pascal: Halle nur in der
// Winterpause). Läuft täglich vor den Turnieren (game/indoorGame.ts `indoorDaily`):
// Liegt ein künftiges Turnier für einen Teilnehmer außerhalb seiner Winterpause
// (game/indoorWindow.ts) – alte Spielstände mit Pokalrunden in der Pause, Nachholspiele,
// Europapokal-Wiederholungen –, wird es so gelöst:
//  • betrifft es deinen Verein: Turnier auf den nächsten passenden Tag verlegen (alle
//    Teilnehmer in der Pause, kein Trainingslager, kein anderes Turnier), sonst Teilnahme
//    ohne Ärger absagen – jeweils mit kurzer Nachricht;
//  • betrifft es einen KI-Verein: er wird durch einen Verein in der Winterpause ersetzt.
// Idempotent: Danach liegen alle Termine in den Fenstern, und Fenster werden mit der Zeit
// nur größer (ausgeschiedene Vereine), ein zweiter Lauf ändert nichts mehr.
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { makeMessage, pushMessage } from '../engine/messages';
import { fmtDay } from '../ui/format';
import { BreakCache, indoorHoliday } from './indoorWindow';
import type { Game } from './state';
import { IndoorTournament, IndoorWinter, daysBetween, ownCampDays } from './winterShared';

const span = (t: IndoorTournament, date = t.date) => Array.from({ length: t.days }, (_, i) => CalendarEngine.addDays(date, i));

/** Prüft alle künftigen Hallentermine; `sub` füllt einen frei gewordenen Platz. Rückgabe: Anzahl Änderungen. */
export function reconcileIndoor(g: Game, cur: IndoorWinter, today: string, sub: (t: IndoorTournament) => unknown): number {
  const mid = g.managedClubId;
  const all = [...cur.tournaments, ...(cur.masters ? [cur.masters] : [])];
  const bc = new BreakCache(g);
  let changes = 0;
  for (const t of all) {
    if (t.done || t.id === cur.live || t.date < today || !t.clubIds.length) continue;
    const bad = t.clubIds.filter((id) => !bc.fits(id, t.date, t.days));
    if (!bad.length) continue;
    changes++;
    if (bad.includes(mid) && t.own !== 'decline') {
      const nd = newDate(g, cur, t, today, bc, all);
      if (nd) {
        const old = t.date;
        t.date = nd;
        for (const m of g.messages) {
          if (m.eventRef?.type === 'indoor_invite' && m.eventRef.data?.tid === t.id && !m.eventRef.resolved) {
            const dl = CalendarEngine.addDays(nd, -2);
            m.eventRef.deadline = dl > today ? dl : today;
          }
        }
        note(g, today, `Hallenturnier verlegt: ${t.name}`, `Neuer Termin ${fmtDay(nd)} statt ${fmtDay(old)}.`,
          `Am ${fmtDay(old)} hätte das ${t.name} mitten in die Pflichtspiele gefallen. Der Veranstalter verlegt es in die Winterpause: `
          + `${t.hall}, ${t.city}, ${fmtDay(nd)}${t.days > 1 ? ` (${t.days} Tage)` : ''}.`);
        continue;
      }
      // Kein Ausweichtermin: Teilnahme absagen – ohne Ärger, der Spielplan geht vor.
      t.clubIds = t.clubIds.filter((id) => id !== mid);
      t.own = undefined;
      for (const m of g.messages) {
        if (m.eventRef?.type !== 'indoor_invite' || m.eventRef.data?.tid !== t.id || m.eventRef.resolved) continue;
        m.eventRef.resolved = 'decline';
        m.actionRequired = false;
        m.resultText = 'Entfällt: Pflichtspiel am Turniertag.';
      }
      note(g, today, `Hallenturnier entfällt: ${t.name}`, 'Pflichtspiele gehen vor – die Teilnahme ist abgesagt.',
        `Das ${t.name} (${fmtDay(t.date)}) liegt außerhalb eurer Winterpause. Einen Ausweichtermin gibt es nicht, `
        + 'deshalb ist eure Teilnahme abgesagt. Der Veranstalter hat Verständnis – Ärger gibt es keinen.');
      sub(t);
    } else if (bad.includes(mid)) {
      t.clubIds = t.clubIds.filter((id) => id !== mid);
      sub(t);
    }
    for (const id of bad) {
      if (id === mid) continue;
      t.clubIds = t.clubIds.filter((x) => x !== id);
      delete t.squads[id];
      sub(t);
    }
  }
  return changes;
}

/** Nächster Tag in der Winterpause deines Vereins, an dem alle Teilnehmer können. */
function newDate(g: Game, cur: IndoorWinter, t: IndoorTournament, today: string, bc: BreakCache, all: IndoorTournament[]): string | null {
  const win = bc.window(g.managedClubId);
  if (!win) return null;
  const camp = ownCampDays(g);
  const earliest = CalendarEngine.addDays(today, 2);
  const tourEnd = t.kind !== 'masters' && cur.masters ? CalendarEngine.addDays(cur.masters.date, -2) : null;
  const cands = daysBetween(earliest > win.from ? earliest : win.from, win.to)
    .filter((d) => (!tourEnd || d <= tourEnd) && CalendarEngine.addDays(d, t.days - 1) <= win.to)
    .sort((a, b) => Math.abs(Date.parse(a) - Date.parse(t.date)) - Math.abs(Date.parse(b) - Date.parse(t.date)) || a.localeCompare(b));
  for (const d of cands) {
    const days = span(t, d);
    if (days.some((x) => camp.has(x) || indoorHoliday(x))) continue;
    const clash = all.some((o) => o !== t && !o.done && span(o).some((x) => days.includes(x)) && o.clubIds.some((id) => t.clubIds.includes(id)));
    if (clash) continue;
    if (t.clubIds.every((id) => bc.fits(id, d, t.days))) return d;
  }
  return null;
}

function note(g: Game, today: string, subject: string, shortText: string, bodyText: string): void {
  pushMessage(g.messages, makeMessage({ date: today, category: 'cup', from: 'Spielausschuss', subject, shortText, bodyText }));
}
