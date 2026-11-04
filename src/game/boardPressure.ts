// =============================================================================
// VORSTANDSDRUCK GEGEN DEN TRAINER
// -----------------------------------------------------------------------------
// Du bist Manager und wirst nie entlassen. Läuft es sportlich schlecht, richtet
// sich der Druck des Vorstands gegen deinen Cheftrainer (Angestellter, Rolle
// `cheftrainer` im Trainerteam):
//   • Prüfung am 1. jedes Monats von Oktober bis April (ab 8 Ligaspielen,
//     Trainer seit mind. 60 Tagen im Amt) und am 5. Juni nach der Saison:
//     Vertrauen unter 30 oder klar hinter dem Saisonziel bei Vertrauen unter 45.
//   • Nachricht mit Entscheidung (sperrt „Weiter“, Frist 5 Tage):
//       „Trainer entlassen“  → Abfindung, Vertrauen +6, Stelle neu besetzen;
//       „Rückendeckung geben“ (Standard) → Vertrauen −2; einen Monat später
//         prüft der Vorstand: Abstand zum Ziel um mind. 2 Plätze verringert oder
//         Ziel in Reichweite → Vertrauen +4, sonst −10.
//   • Ohne Cheftrainer mahnt der Vorstand einmal je Saison eine Besetzung an.
//   • Höchstens zwei Druck-Nachrichten je Saison, Abstand mind. 45 Tage.
// Was dich trifft, läuft über das Vertrauen: unter 40 kürzt der Vorstand die
// Transfermittel, unter 20 halbiert er sie, und das nächste Saisonbudget gibt er
// nach dem Vertrauen frei (engine/environment.ts `boardBudgetShare`).
// Ersetzt die frühere Entlassung im Karriere-Modus (game/careerGame.ts).
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { expectedPosition } from '../engine/environment';
import { makeMessage, pushMessage } from '../engine/messages';
import { fmtDM } from '../ui/format';
import { ensureCareer, BoardPressureState } from './careerState';
import { CHOICE_HANDLERS } from './eventsGame';
import { headCoachNow, openCoachEntry } from './headCoaches';
import { dismiss, severanceOf } from './trainerTeam';
import type { Game } from './state';

export const PRESSURE_TYPE = 'board_coach';
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

export function ownStanding(g: Game): { pos: number; size: number; played: number; exp: number } {
  const rows = g.table.rows;
  const i = rows.findIndex((r) => r.clubId === g.managedClubId);
  const size = rows.length || 18;
  const club = g.clubs[g.managedClubId];
  return { pos: i + 1 || size, size, played: rows[i]?.played ?? 0, exp: expectedPosition(club?.boardExpectation ?? '', size) };
}

function state(g: Game): BoardPressureState {
  const c = ensureCareer(g);
  if (!c.press || c.press.season !== g.season) c.press = { season: g.season, n: 0, backed: c.press?.backed, noCoach: c.press?.noCoach };
  return c.press;
}

const openPressure = (g: Game) => g.messages.some((m) => m.eventRef?.type === PRESSURE_TYPE && !m.eventRef.resolved);

function askAboutCoach(g: Game, today: string, endOfSeason: boolean): void {
  const club = g.clubs[g.managedClubId];
  const coach = headCoachNow(g);
  if (!club || !coach) return;
  const s = state(g);
  const o = ownStanding(g);
  const sev = severanceOf(g, coach);
  s.n++;
  s.last = today;
  const msg = makeMessage({
    date: today, category: 'board', from: 'Vorstand',
    subject: endOfSeason ? `Vorstand will einen Neuanfang auf der Trainerbank` : `Vorstand stellt ${coach.name} infrage`,
    shortText: `Platz ${o.pos}, Ziel „${club.boardExpectation}“ – der Vorstand legt dir einen Trainerwechsel nahe.`,
    bodyText: `${endOfSeason ? `Die Saison endete auf Platz ${o.pos}` : `Wir stehen auf Platz ${o.pos}`}, das Ziel lautet „${club.boardExpectation}“. `
      + `Der Vorstand ist mit der sportlichen Entwicklung unzufrieden und legt dir als Manager nahe, dich von Cheftrainer ${coach.name} zu trennen. Die Entscheidung liegt bei dir.\n\n`
      + `• Trainer entlassen: Abfindung ${fmtDM(sev)}. Der Vorstand sieht, dass du handelst (Vertrauen +6). Einen Nachfolger stellst du unter Training › Trainerteam ein.\n`
      + `• Rückendeckung geben: ${coach.name} bleibt. Der Vorstand trägt das vorerst mit (Vertrauen −2), prüft aber in einem Monat nach: Bleibt die Wende aus, kostet dich das deutlich Vertrauen (−10) – und damit Spielraum bei Transfers und im nächsten Saisonbudget.`,
    actionRequired: true,
  });
  msg.choices = [
    { id: 'entlassen', label: 'Trainer entlassen', hint: `Abfindung ${fmtDM(sev)}` },
    { id: 'stuetzen', label: 'Rückendeckung geben', hint: 'Bleibt die Wende aus, sinkt das Vertrauen deutlich' },
  ];
  msg.eventRef = { type: PRESSURE_TYPE, deadline: CalendarEngine.addDays(today, 5), defaultChoice: 'stuetzen', data: { coach: coach.id, gap: o.pos - o.exp, end: endOfSeason ? 1 : 0 } };
  pushMessage(g.messages, msg);
}

CHOICE_HANDLERS[PRESSURE_TYPE] = (g, ref, choice) => {
  const club = g.clubs[g.managedClubId];
  const coach = headCoachNow(g);
  if (!club) return { text: '' };
  if (!coach || coach.id !== ref.data?.coach) return { text: 'Die Frage hat sich erledigt – der Trainer ist nicht mehr im Amt.' };
  const s = state(g);
  if (choice === 'entlassen') {
    const e = openCoachEntry(g);
    if (e) e.pressured = true;
    dismiss(g, coach.id);
    club.boardConfidence = clamp((club.boardConfidence ?? 60) + 6, 0, 100);
    s.backed = undefined;
    return { text: `${coach.name} ist nicht mehr Cheftrainer. Der Vorstand begrüßt die klare Entscheidung. Den Nachfolger stellst du unter Training › Trainerteam ein.` };
  }
  const e = openCoachEntry(g);
  if (e) e.backed = (e.backed ?? 0) + 1;
  club.boardConfidence = clamp((club.boardConfidence ?? 60) - 2, 0, 100);
  s.backed = { coachId: coach.id, date: g.calendar.currentDate, gap: Number(ref.data?.gap ?? 0), conf: club.boardConfidence };
  return { text: `${coach.name} bleibt. Der Vorstand akzeptiert deine Entscheidung – und schaut in einem Monat genau hin.` };
};

/** Rückendeckung bewerten (frühestens 28 Tage danach, ab 6 Ligaspielen der Saison). */
function reviewBacking(g: Game, today: string): void {
  const s = state(g);
  const b = s.backed;
  const club = g.clubs[g.managedClubId];
  if (!b || !club) return;
  const coach = headCoachNow(g);
  if (!coach || coach.id !== b.coachId) { s.backed = undefined; return; }
  const o = ownStanding(g);
  if (dayDiff(b.date, today) < 28 || o.played < 6) return;
  s.backed = undefined;
  const gap = o.pos - o.exp;
  const ok = gap <= b.gap - 2 || gap <= 0;
  club.boardConfidence = clamp((club.boardConfidence ?? 60) + (ok ? 4 : -10), 0, 100);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Vorstand',
    subject: ok ? 'Rückendeckung zahlt sich aus' : 'Rückendeckung ohne Wirkung',
    shortText: ok ? `Unter ${coach.name} geht es aufwärts – das Vertrauen steigt.` : `Der Vorstand hält dir das Festhalten an ${coach.name} vor.`,
    bodyText: ok
      ? `Du hast an ${coach.name} festgehalten, und die Mannschaft hat die Kurve bekommen (Platz ${o.pos}). Der Vorstand erkennt das an: Vertrauen +4.`
      : `Du hast ${coach.name} gegen den Willen des Vorstands gehalten, doch die Wende blieb aus (Platz ${o.pos}, Ziel „${club.boardExpectation}“). `
        + `Das Vertrauen in dich sinkt deutlich (−10, jetzt ${club.boardConfidence}). Unter 40 kürzt der Vorstand die Transfermittel, unter 20 halbiert er sie; auch das nächste Saisonbudget fällt knapper aus.`,
  }));
}

/** Täglicher Einstieg (aus careerDaily). */
export function boardPressureDaily(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  reviewBacking(g, today);
  const md = today.slice(5);
  const m = Number(today.slice(5, 7));
  const monthly = today.slice(8) === '01' && (m >= 10 || m <= 4);
  const seasonEnd = md === '06-05';
  if (!monthly && !seasonEnd) return;
  const s = state(g);
  const o = ownStanding(g);
  const conf = club.boardConfidence ?? 60;
  if (monthly && o.played < 8) return;
  const bad = seasonEnd ? o.pos > o.exp + 2 && conf < 35 : conf < 30 || (o.pos >= o.exp + 4 && conf < 45);
  if (!bad || s.backed || openPressure(g)) return;
  const coach = headCoachNow(g);
  if (!coach) {
    if (s.noCoach === g.season) return;
    s.noCoach = g.season;
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Vorstand', subject: 'Vorstand vermisst einen Cheftrainer',
      shortText: 'Der Vorstand erwartet, dass du die Trainerbank besetzt.',
      bodyText: `Platz ${o.pos}, Ziel „${club.boardExpectation}“. Der Vorstand fragt, warum der Verein ohne Cheftrainer arbeitet. `
        + `Als Manager entscheidest du – aber ein guter Cheftrainer würde Training und Spielvorbereitung spürbar stärken. Stellen besetzt du unter Training › Trainerteam.`,
    }));
    return;
  }
  const entry = openCoachEntry(g);
  if (s.n >= 2 || (s.last && dayDiff(s.last, today) < 45) || (entry && dayDiff(entry.from, today) < 60)) return;
  askAboutCoach(g, today, seasonEnd);
}
