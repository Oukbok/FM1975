import type { NationalState } from '../game/national/nationalGame';
import { TOURNAMENTS } from '../data/nationalTeams';
import { type IconName } from '../components/Icon';
import { ownCampDays, ownIndoorDays } from '../game/winterShared';
import { ACTIVITY_DEFS, addDaysUTC } from '../data/activities';
import { Game } from '../game/state';
import type { Match, MessageCategory } from '../types';
import { EURO_COMP_NAMES } from '../data/europe';
import { ownFixtureOn } from '../game/euroFixture';
import { CalendarEngine } from '../engine/calendar';
import { gbEra } from '../engine/goldenBall';
import { GB_DAY } from '../game/goldenBallGame';
import { youthCompsOf } from '../game/youthComps/daily';
import { compClubName } from '../game/competitionView';
import type { Screen } from './navigation';

// Ereignisse je Kalendertag (früher: Kalenderstreifen oben auf jeder Seite; heute
// Datenquelle für das Kalender-Overlay `CalendarOverlay.tsx` und die Kalenderseite).

export type StripAccent = 'orange' | 'gold' | undefined;

export interface StripEvent {
  date: string;
  icon: IconName;
  line: string;
  accent: StripAccent;
  isMatch: boolean;
  prio: number;
  /** Gegner bei eigenen Spielen (für das Wappen im Kalender-Overlay). */
  clubId?: string;
  /** Eigenes Heimspiel? (nur bei eigenen Spielen) */
  home?: boolean;
  /** Wettbewerb bei Spielen (Liga, Pokal, Europapokal, Testspiel). */
  comp?: string;
  /** Ergebnis „Heim:Gast“, sobald gespielt. */
  result?: string;
  /** Sprungziel beim Anklicken (Kalenderseite, Termine). */
  screen?: Screen;
  /** Art für die Listenansicht (Spalte „Art“). */
  kind?: string;
}

const resultOf = (m: Match | null | undefined): string | undefined =>
  m?.result ? `${m.result.homeGoals}:${m.result.awayGoals}` : undefined;

/** Alle Ereignisse je Datum (wichtigstes zuerst) – Quelle für Kalender-Overlay, Kalenderseite und Termine. */
export function buildDayEventsMap(g: Game): Map<string, StripEvent[]> {
  const full = (id: string) => g.clubs[id]?.name ?? id;
  const me = g.managedClubId;
  const byDate = new Map<string, StripEvent[]>();
  const consider = (e: StripEvent) => {
    const list = byDate.get(e.date);
    // Gleicher Termin ohne Verein (z. B. „Spieltag 16“ je Ligaspiel eines Kalendereintrags) nur einmal.
    if (list?.some((x) => x.line === e.line && !x.clubId && !e.clubId)) return;
    if (list) list.push(e); else byDate.set(e.date, [e]);
  };

  // Quelle A — Kalender-Events
  for (const ev of g.calendar.events) {
    switch (ev.type) {
      case 'matchday': {
        const m = g.fixtures.find((x) => x.id === ev.matchId);
        if (m && m.involvesPlayerClub) {
          const heim = m.homeClubId === me;
          const opp = heim ? m.awayClubId : m.homeClubId;
          consider({ date: ev.date, icon: 'matchball', line: `${full(opp)} (${heim ? 'H' : 'A'})`, accent: 'orange', isMatch: true, prio: 100, clubId: opp, home: heim, comp: `Liga · ${m.matchday}. Spieltag${m.moved ? (m.moved.makeup ? ' (Nachholspiel)' : ' (verlegt)') : ''}`, result: resultOf(m), screen: 'fixtures', kind: 'Liga' });
        } else if (m?.moved?.makeup) {
          // Nachholspiel anderer Vereine (z. B. Platz unbespielbar): als einzelnes Spiel zeigen,
          // nicht als ganzer Spieltag – sonst sieht der Tag wie ein Spieltag ohne eigenes Spiel aus.
          consider({ date: ev.date, icon: 'schedule', line: `Nachholspiel: ${full(m.homeClubId)} – ${full(m.awayClubId)}`, accent: undefined, isMatch: false, prio: 35, screen: 'fixtures', kind: 'Liga', comp: `Liga · ${m.matchday}. Spieltag (Nachholspiel)`, result: resultOf(m) });
        } else if (m) {
          consider({ date: ev.date, icon: 'schedule', line: `Spieltag ${m.matchday}`, accent: undefined, isMatch: false, prio: 40, screen: 'table', kind: 'Liga' });
        }
        break;
      }
      case 'cup_matchday': {
        // Wiederholungstermin (Landespokal bis 1990/91): nur mit eigenem Wiederholungsspiel.
        const fx = ownFixtureOn(g, ev);
        if (fx === null) break;
        if (fx) {
          consider({ date: ev.date, icon: 'trophy', line: `${full(fx.opp)} (${fx.home ? 'H' : 'A'})`, accent: 'gold', isMatch: true, prio: 95, clubId: fx.opp, home: fx.home, comp: fx.comp, result: resultOf(fx.match), screen: 'cup', kind: 'Pokal' });
          break;
        }
        const round = ev.cupRoundIndex != null ? g.cup?.rounds[ev.cupRoundIndex] : undefined;
        let line = 'Landespokal';
        let extra: Partial<StripEvent> = {};
        if (round?.drawn) {
          const tie = round.ties.find((t) => t.homeClubId === me || t.awayClubId === me);
          if (tie) {
            const heim = tie.homeClubId === me;
            const opp = heim ? tie.awayClubId : tie.homeClubId;
            line = `${full(opp)} (${heim ? 'H' : 'A'})`;
            extra = { clubId: opp, home: heim, result: resultOf(tie.match) };
          } else {
            line = `Pokal: ${round.name}`;
          }
        } else if (round) {
          line = `Pokal: ${round.name}`;
        }
        consider({ date: ev.date, icon: 'trophy', line, accent: 'gold', isMatch: true, prio: 95, comp: `Pokal${round ? ' · ' + round.name : ''}`, screen: 'cup', kind: 'Pokal', ...extra });
        break;
      }
      case 'euro_matchday': {
        // Nur Runden mit eigener Beteiligung – die übrigen Europapokal-Termine wären Rauschen.
        const fx = ownFixtureOn(g, ev);
        if (fx === null) break;
        if (fx) {
          consider({ date: ev.date, icon: 'trophy', line: `${full(fx.opp)} (${fx.home ? 'H' : 'A'})`, accent: 'gold', isMatch: true, prio: 97, clubId: fx.opp, home: fx.home, comp: fx.comp, result: resultOf(fx.match), screen: 'international', kind: 'Europapokal' });
          break;
        }
        const cup = ev.euroComp ? g.euroCups?.[ev.euroComp] : null;
        const round = ev.cupRoundIndex != null ? cup?.rounds[ev.cupRoundIndex] : undefined;
        const tie = round?.drawn ? round.ties.find((t) => t.homeClubId === me || t.awayClubId === me) : undefined;
        if (!round || !tie) break;
        const heim = tie.homeClubId === me;
        const opp = heim ? tie.awayClubId : tie.homeClubId;
        consider({ date: ev.date, icon: 'trophy', line: `${full(opp)} (${heim ? 'H' : 'A'})`, accent: 'gold', isMatch: true, prio: 97, clubId: opp, home: heim, comp: `${ev.euroComp ? EURO_COMP_NAMES[ev.euroComp] : 'Europapokal'} · ${round.name}`, result: resultOf(tie.match), screen: 'international', kind: 'Europapokal' });
        break;
      }
      case 'cup_draw': {
        // Wettbewerb aus dem Titel („Auslosung Achtelfinale — Landespokal“ o. ä.), sonst Pokal/Europapokal.
        const comp = ev.title.replace(/^Auslosung\s*/, '') || undefined;
        consider({ date: ev.date, icon: 'trophy', line: ev.euroComp ? `Auslosung ${EURO_COMP_NAMES[ev.euroComp]}` : 'Auslosung Pokal', accent: undefined, isMatch: false, prio: 35, comp, screen: ev.euroComp ? 'international' : 'cup', kind: 'Auslosung' });
        break;
      }
      case 'transfer_window_open':
        consider({ date: ev.date, icon: 'transfers', line: 'Transferfenster öffnet', accent: undefined, isMatch: false, prio: 30, screen: 'transfers', kind: 'Transfers' });
        break;
      case 'transfer_window_close':
        consider({ date: ev.date, icon: 'transfers', line: 'Transferfenster schließt', accent: undefined, isMatch: false, prio: 30, screen: 'transfers', kind: 'Transfers' });
        // Am Tag danach: Top-Transfers + Transferbilanz (game/transferLog.ts `transferWindowDue`).
        consider({ date: CalendarEngine.addDays(ev.date, 1), icon: 'transfers', line: 'Transferbilanz', accent: undefined, isMatch: false, prio: 27, screen: 'transfers', kind: 'Transfers' });
        break;
      case 'rating_update': {
        const d = ev.description ?? '';
        const line = d.includes('Große') ? 'Saison-Bewertung' : d.includes('Winter') ? 'Winter-Bewertung' : 'Herbst-Bewertung';
        consider({ date: ev.date, icon: 'stats', line, accent: undefined, isMatch: false, prio: 25, screen: 'squad', kind: 'Bewertung' });
        break;
      }
      case 'winter_break':
        consider({ date: ev.date, icon: 'kalender', line: 'Winterpause', accent: undefined, isMatch: false, prio: 20, kind: 'Saison' });
        break;
      case 'season_end':
        consider({ date: ev.date, icon: 'kalender', line: 'Saisonende', accent: undefined, isMatch: false, prio: 20, screen: 'table', kind: 'Saison' });
        break;
      case 'season_start':
        consider({ date: ev.date, icon: 'kalender', line: 'Saisonstart', accent: undefined, isMatch: false, prio: 15, screen: 'briefing', kind: 'Saison' });
        // Saisonbudget: Fenster nach dem Briefing (game/budgetPlan.ts).
        consider({ date: ev.date, icon: 'finances', line: 'Saisonbudget', accent: undefined, isMatch: false, prio: 14, screen: 'budget', kind: 'Finanzen' });
        break;
    }
  }

  // Quelle B — geplante Aktivitäten: NUR Freundschaftsspiele (echte Spiele).
  for (const act of g.activities ?? []) {
    if (act.type !== 'friendly') continue;
    consider({
      date: act.startDate,
      icon: 'matchball',
      line: ACTIVITY_DEFS[act.type]?.name ?? act.label,
      accent: undefined,
      isMatch: true,
      prio: 50,
      comp: 'Testspiel',
      screen: 'calendar',
      kind: 'Testspiel',
    });
  }

  // Quelle C — Winter: eigene Hallenturniere und Trainingslager (game/winterShared.ts).
  for (const [date, t] of ownIndoorDays(g)) {
    consider({ date, icon: 'trophy', line: t.kind === 'masters' ? 'Hallen-Masters' : `Halle ${t.city}`, accent: 'gold', isMatch: false, prio: 60, screen: 'halle', kind: 'Halle' });
  }
  for (const [date, b] of ownCampDays(g)) {
    const last = date === b.end;
    consider({ date, icon: 'weather', line: date === b.start ? 'Trainingslager: Abreise' : last ? 'Trainingslager: Rückkehr' : 'Trainingslager', accent: undefined, isMatch: false, prio: date === b.start || last ? 23 : 22, screen: 'trainingslager', kind: 'Training' });
  }

  // Quelle E — Ehrungen: Goldener Ball (20.12., game/goldenBallGame.ts) und „Die Besten der Saison“
  // (Tag nach dem letzten Ligaspiel, game/seasonAwardsGame.ts).
  const y0 = Number(g.season.slice(0, 4));
  consider({ date: `${y0}-${GB_DAY}`, icon: 'trophy', line: gbEra(y0).short, accent: undefined, isMatch: false, prio: 32, screen: 'auszeichnungen', kind: 'Ehrung' });
  const lastLeague = g.fixtures.reduce((a, m) => (m.date > a ? m.date : a), '');
  if (lastLeague) consider({ date: CalendarEngine.addDays(lastLeague, 1), icon: 'trophy', line: 'Die Besten der Saison', accent: undefined, isMatch: false, prio: 26, screen: 'auszeichnungen', kind: 'Ehrung' });

  // Quelle N — Nationalmannschaften: Länderspieltermine und WM/EM (game/national/nationalGame.ts).
  const nat = (g as Game & { national?: NationalState }).national;
  if (nat?.season === g.season) for (const w of nat.windows) for (const d of w.dates) consider({ date: d, icon: 'international', line: `Länderspiele (${w.label})`, accent: undefined, isMatch: false, prio: 24, screen: 'nationalteams', kind: 'Länderspiel' });
  for (const t of TOURNAMENTS) {
    if (t.start.slice(0, 4) !== String(y0 + 1) && t.start.slice(0, 4) !== String(y0)) continue;
    consider({ date: t.start, icon: 'international', line: `${t.kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft'}: Anpfiff`, accent: undefined, isMatch: false, prio: 24, screen: 'nationalteams', kind: 'Länderspiel' });
    consider({ date: t.end, icon: 'international', line: `${t.kind}-Finale`, accent: undefined, isMatch: false, prio: 24, screen: 'nationalteams', kind: 'Länderspiel' });
  }

  // Quelle F — Jugendwettbewerbe: Spiele und Spielfeste der eigenen Jugendmannschaften (game/youthComps/).
  const yc = youthCompsOf(g);
  if (yc && yc.season === g.season) {
    const yName = (id: string) => compClubName(g, id, g.season);
    for (const c of yc.comps) {
      const team = `${c.cls}-Jugend`;
      for (const l of c.leagues) for (const f of l.fx) {
        if (f[1] !== me && f[2] !== me) continue;
        const heim = f[1] === me;
        consider({ date: f[0], icon: 'youth', line: `${team}: ${yName(heim ? f[2] : f[1])} (${heim ? 'H' : 'A'})`, accent: undefined, isMatch: false, prio: 24, comp: c.label === l.name ? c.label : `${c.label} · ${l.name}`, result: f[3] >= 0 ? `${f[3]}:${f[4]}` : undefined, screen: 'jugendwettbewerbe', kind: 'Jugend' });
      }
      for (const rd of c.ko) for (const t of rd.ties) {
        if (t.h !== me && t.a !== me) continue;
        rd.dates.forEach((date, leg) => {
          if (!date || leg >= rd.legs) return;
          const heim = leg === 0 ? t.h === me : t.a === me;
          const gl = t.g[leg];
          consider({ date, icon: 'youth', line: `${team}: ${yName(t.h === me ? t.a : t.h)} (${heim ? 'H' : 'A'})`, accent: undefined, isMatch: false, prio: 24, comp: `${c.label} · ${rd.name}`, result: gl ? `${gl[0]}:${gl[1]}` : undefined, screen: 'jugendwettbewerbe', kind: 'Jugend' });
        });
      }
      if (c.fest) for (const d of c.fest.d) consider({ date: d, icon: 'youth', line: `${team}: Spielfest`, accent: undefined, isMatch: false, prio: 21, comp: c.label, screen: 'jugendwettbewerbe', kind: 'Jugend' });
    }
  }

  // Quelle D — Vertragsenden im eigenen Kader (je Tag zusammengefasst).
  const ends = new Map<string, string[]>();
  for (const pid of g.clubs[me]?.playerIds ?? []) {
    const p = g.players[pid];
    const d = p?.contract?.expiryDate;
    if (!d || d < g.calendar.currentDate) continue;
    const l = ends.get(d);
    if (l) l.push(p.lastName); else ends.set(d, [p.lastName]);
  }
  for (const [date, names] of ends) {
    consider({ date, icon: 'contracts', line: names.length === 1 ? `Vertragsende ${names[0]}` : `${names.length} Verträge enden`, accent: undefined, isMatch: false, prio: 28, screen: 'vertraege', kind: 'Verträge' });
  }

  for (const list of byDate.values()) list.sort((a, b) => b.prio - a.prio);
  return byDate;
}

/** Baut eine pro Datum ein-eindeutige Event-Map (wichtigstes Event je Tag). */
export function buildStripEventMap(g: Game): Map<string, StripEvent> {
  const out = new Map<string, StripEvent>();
  for (const [d, list] of buildDayEventsMap(g)) out.set(d, list[0]);
  return out;
}

export function upcomingStripEvents(g: Game, max: number): StripEvent[] {
  const map = buildStripEventMap(g);
  const out: StripEvent[] = [];
  let cur = g.calendar.currentDate;
  for (let i = 0; i < 220 && out.length < max; i++) {
    const ev = map.get(cur);
    if (ev) out.push(ev);
    cur = addDaysUTC(cur, 1);
  }
  return out;
}

/** Nachrichten-Kategorie -> UI-Icon (emojifrei, nur <Icon>-Set). */
export const MSG_CAT_ICON: Record<MessageCategory, IconName> = {
  transfer: 'transfers',
  injury: 'squad',
  match: 'matchball',
  board: 'zentrale',
  contract: 'contracts',
  training: 'training',
  media: 'presse',
  cup: 'trophy',
  milestone: 'chronicle',
  general: 'news',
};
