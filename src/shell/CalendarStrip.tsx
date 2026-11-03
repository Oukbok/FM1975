import { type IconName } from '../components/Icon';
import { ownCampDays, ownIndoorDays } from '../game/winterShared';
import { ACTIVITY_DEFS, addDaysUTC } from '../data/activities';
import { Game } from '../game/state';
import type { Match, MessageCategory } from '../types';
import { EURO_COMP_NAMES } from '../data/europe';
import { ownFixtureOn } from '../game/euroFixture';

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
          consider({ date: ev.date, icon: 'matchball', line: `${full(opp)} (${heim ? 'H' : 'A'})`, accent: 'orange', isMatch: true, prio: 100, clubId: opp, home: heim, comp: `Liga · ${m.matchday}. Spieltag${m.moved ? (m.moved.makeup ? ' (Nachholspiel)' : ' (verlegt)') : ''}`, result: resultOf(m) });
        } else if (m) {
          consider({ date: ev.date, icon: 'schedule', line: `Spieltag ${m.matchday}`, accent: undefined, isMatch: false, prio: 40 });
        }
        break;
      }
      case 'cup_matchday': {
        // Wiederholungstermin (Landespokal bis 1990/91): nur mit eigenem Wiederholungsspiel.
        const fx = ownFixtureOn(g, ev);
        if (fx === null) break;
        if (fx) {
          consider({ date: ev.date, icon: 'trophy', line: `${full(fx.opp)} (${fx.home ? 'H' : 'A'})`, accent: 'gold', isMatch: true, prio: 95, clubId: fx.opp, home: fx.home, comp: fx.comp, result: resultOf(fx.match) });
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
            line = round.name;
          }
        } else if (round) {
          line = round.name;
        }
        consider({ date: ev.date, icon: 'trophy', line, accent: 'gold', isMatch: true, prio: 95, comp: `Pokal${round ? ' · ' + round.name : ''}`, ...extra });
        break;
      }
      case 'euro_matchday': {
        // Nur Runden mit eigener Beteiligung – die übrigen Europapokal-Termine wären Rauschen.
        const fx = ownFixtureOn(g, ev);
        if (fx === null) break;
        if (fx) {
          consider({ date: ev.date, icon: 'trophy', line: `${full(fx.opp)} (${fx.home ? 'H' : 'A'})`, accent: 'gold', isMatch: true, prio: 97, clubId: fx.opp, home: fx.home, comp: fx.comp, result: resultOf(fx.match) });
          break;
        }
        const cup = ev.euroComp ? g.euroCups?.[ev.euroComp] : null;
        const round = ev.cupRoundIndex != null ? cup?.rounds[ev.cupRoundIndex] : undefined;
        const tie = round?.drawn ? round.ties.find((t) => t.homeClubId === me || t.awayClubId === me) : undefined;
        if (!round || !tie) break;
        const heim = tie.homeClubId === me;
        const opp = heim ? tie.awayClubId : tie.homeClubId;
        consider({ date: ev.date, icon: 'trophy', line: `${full(opp)} (${heim ? 'H' : 'A'})`, accent: 'gold', isMatch: true, prio: 97, clubId: opp, home: heim, comp: `${ev.euroComp ? EURO_COMP_NAMES[ev.euroComp] : 'Europapokal'} · ${round.name}`, result: resultOf(tie.match) });
        break;
      }
      case 'cup_draw':
        consider({ date: ev.date, icon: 'trophy', line: 'Auslosung', accent: undefined, isMatch: false, prio: 35, comp: ev.title.replace(/^Auslosung\s*/, '') || undefined });
        break;
      case 'transfer_window_open':
        consider({ date: ev.date, icon: 'transfers', line: 'Transferfenster', accent: undefined, isMatch: false, prio: 30 });
        break;
      case 'transfer_window_close':
        consider({ date: ev.date, icon: 'transfers', line: 'Transfer schließt', accent: undefined, isMatch: false, prio: 30 });
        break;
      case 'rating_update':
        consider({ date: ev.date, icon: 'stats', line: 'Bewertung', accent: undefined, isMatch: false, prio: 25 });
        break;
      case 'winter_break':
        consider({ date: ev.date, icon: 'kalender', line: 'Winterpause', accent: undefined, isMatch: false, prio: 20 });
        break;
      case 'season_end':
        consider({ date: ev.date, icon: 'kalender', line: 'Saisonende', accent: undefined, isMatch: false, prio: 20 });
        break;
      case 'season_start':
        consider({ date: ev.date, icon: 'kalender', line: 'Saisonstart', accent: undefined, isMatch: false, prio: 15 });
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
    });
  }

  // Quelle C — Winter: eigene Hallenturniere und Trainingslager (game/winterShared.ts).
  for (const [date, t] of ownIndoorDays(g)) {
    consider({ date, icon: 'trophy', line: t.kind === 'masters' ? 'Hallen-Masters' : `Halle ${t.city}`, accent: 'gold', isMatch: false, prio: 60 });
  }
  for (const [date, b] of ownCampDays(g)) {
    consider({ date, icon: 'weather', line: date === b.start ? 'Trainingslager' : 'Lager', accent: undefined, isMatch: false, prio: 22 });
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
    consider({ date, icon: 'contracts', line: names.length === 1 ? `Vertragsende ${names[0]}` : `${names.length} Verträge enden`, accent: undefined, isMatch: false, prio: 28 });
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
