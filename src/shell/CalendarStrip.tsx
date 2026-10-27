import Icon, { type IconName } from '../components/Icon';
import { ACTIVITY_DEFS, addDaysUTC } from '../data/activities';
import { Game } from '../game/state';
import { MessageCategory } from '../types';
import { MON_FULL, WD_SHORT } from '../ui/format';
import { Screen } from './navigation';

export type StripAccent = 'orange' | 'gold' | undefined;

export interface StripEvent {
  date: string;
  icon: IconName;
  line: string;
  accent: StripAccent;
  isMatch: boolean;
  prio: number;
}

/** Baut eine pro Datum ein-eindeutige Event-Map (wichtigstes Event je Tag) für den Zeitstrahl. */
export function buildStripEventMap(g: Game): Map<string, StripEvent> {
  const full = (id: string) => g.clubs[id]?.name ?? id;
  const byDate = new Map<string, StripEvent>();
  const consider = (e: StripEvent) => {
    const prev = byDate.get(e.date);
    if (!prev || e.prio > prev.prio) byDate.set(e.date, e);
  };

  // Quelle A — Kalender-Events
  for (const ev of g.calendar.events) {
    switch (ev.type) {
      case 'matchday': {
        const m = g.fixtures.find((x) => x.id === ev.matchId);
        if (m && m.involvesPlayerClub) {
          const heim = m.homeClubId === g.managedClubId;
          const opp = heim ? m.awayClubId : m.homeClubId;
          consider({ date: ev.date, icon: 'matchball', line: `${full(opp)} (${heim ? 'H' : 'A'})`, accent: 'orange', isMatch: true, prio: 100 });
        } else if (m) {
          consider({ date: ev.date, icon: 'schedule', line: `Spieltag ${m.matchday}`, accent: undefined, isMatch: false, prio: 40 });
        }
        break;
      }
      case 'cup_matchday': {
        const round = ev.cupRoundIndex != null ? g.cup?.rounds[ev.cupRoundIndex] : undefined;
        let line = 'DFB-Pokal';
        if (round?.drawn) {
          const tie = round.ties.find((t) => t.homeClubId === g.managedClubId || t.awayClubId === g.managedClubId);
          if (tie) {
            const heim = tie.homeClubId === g.managedClubId;
            line = `${full(heim ? tie.awayClubId : tie.homeClubId)} (${heim ? 'H' : 'A'})`;
          } else {
            line = round.name;
          }
        } else if (round) {
          line = round.name;
        }
        consider({ date: ev.date, icon: 'trophy', line, accent: 'gold', isMatch: true, prio: 95 });
        break;
      }
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

  // Quelle B — geplante Aktivitäten: NUR Freundschaftsspiele erscheinen im
  // Streifen (das sind echte Spiele). Trainingslager, Teambuilding & Reisen
  // werden bewusst NICHT angezeigt.
  for (const act of g.activities ?? []) {
    if (act.type !== 'friendly') continue;
    consider({
      date: act.startDate,
      icon: 'matchball',
      line: ACTIVITY_DEFS[act.type]?.name ?? act.label,
      accent: undefined,
      isMatch: true,
      prio: 50,
    });
  }

  return byDate;
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

/**
 * 7 Kalenderblatt-Kacheln im Header, strikt an aufeinanderfolgenden KALENDERTAGEN
 * orientiert (UTC): Slot 1 = gestern, Slot 2 = heute (Akzent), Slots 3–7 = die
 * nächsten 5 Tage. Jede Kachel zeigt ihr Datum; fällt ein Ereignis auf den Tag,
 * wird es (wichtigstes zuerst) mit Farbcodierung angezeigt und ist klickbar.
 */
export function CalendarStrip({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  // 7-Tage-Kalenderstreifen: Gestern, Heute (2. v. l., groesser), +5 kommende Tage.
  // Universeller Streifen: identisch auf JEDER Seite (Shell-Ebene), nicht nur Zentrale.
  const calStripDays = (() => {
    const map = buildStripEventMap(g);
    const arr: { date: string; wd: string; day: number; mon: string; isToday: boolean; ev: StripEvent | null }[] = [];
    for (let i = -1; i <= 5; i++) {
      const date = addDaysUTC(g.calendar.currentDate, i);
      const dt = new Date(date + 'T00:00:00Z');
      arr.push({
        date,
        wd: WD_SHORT[dt.getUTCDay()].toUpperCase(),
        day: dt.getUTCDate(),
        mon: MON_FULL[dt.getUTCMonth()].toUpperCase(),
        isToday: i === 0,
        ev: map.get(date) ?? null,
      });
    }
    return arr;
  })();
  return (
    <div className="dashx-caltop">
      <div className="kbstrip" onClick={() => onGoto('calendar')} role="button" tabIndex={0}>
        {calStripDays.map((dd) => {
          const ev = dd.ev;
          const isMatch = ev?.isMatch ?? false;
          const cls = ['kbsheet'];
          if (dd.isToday) cls.push('is-today');
          if (ev) cls.push('has-ev');
          if (isMatch) cls.push('is-match');
          return (
            <div key={dd.date} className={cls.join(' ')}>
              <div className="kbsheet-head">
                <span className="kbday">{dd.day}</span>
                <span className="kbwd">{dd.isToday ? 'HEUTE' : dd.wd}</span>
              </div>
              <div className="kbsheet-ico">
                {ev ? <Icon name={isMatch ? 'matchballwhite' : ev.icon} size={isMatch ? 52 : 26} /> : null}
              </div>
              <div className="kbsheet-lbl">{ev ? ev.line : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
