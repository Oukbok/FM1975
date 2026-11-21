// Kalender › Monat als Liste (Stil „Paarungen“, styles/28-rows.css): alle Termine des
// Monats Tag für Tag, Spiele mit Wappen und Ergebnis; Klick springt zur passenden Seite.
import { ClubLink } from '../../../components/club/ClubLink';
import ClubCrest from '../../../components/ClubCrest';
import type { Game } from '../../../game/state';
import type { StripEvent } from '../../../shell/CalendarStrip';
import type { Screen } from '../../../shell/navigation';
import { Empty } from '../../../ui/DashPage';
import { WD_LABELS } from './calendarShared';
import { eventKind } from './MonthGrid';

export function MonthList({ g, days, dayEvents, onGoto }: {
  g: Game; days: string[]; dayEvents: Map<string, StripEvent[]>; onGoto: (s: Screen) => void;
}) {
  const today = g.calendar.currentDate;
  const rows = days.flatMap((iso) => (dayEvents.get(iso) ?? []).map((ev, i) => ({ iso, ev, first: i === 0 })));
  if (!rows.length) return <Empty icon="kalender">Keine Termine in diesem Monat.</Empty>;
  return (
    <div className="rl calm-list">
      {rows.map(({ iso, ev, first }, i) => {
        const wd = WD_LABELS[(new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7];
        const club = ev.clubId ? g.clubs[ev.clubId] : undefined;
        const cls = ['rl-row', 'calm-row'];
        if (ev.screen) cls.push('clickable');
        if (iso < today) cls.push('calm-past');
        if (iso === today) cls.push('calm-today');
        if (ev.accent === 'orange') cls.push('mine');
        if (!first) cls.push('calm-cont');
        return (
          <div key={`${iso}-${i}`} className={cls.join(' ')} onClick={ev.screen ? () => onGoto(ev.screen!) : undefined}
            title={ev.screen ? 'Klicken zum Öffnen' : undefined}>
            <span className="rl-rank calm-date">{first ? <><span className="calm-wd">{wd}</span> {iso.slice(8, 10)}.{iso.slice(5, 7)}.</> : null}</span>
            <span className={`calm-kind cal-k-${eventKind(ev).k}`}>{ev.kind ?? ''}</span>
            <span className="rl-club">
              {club ? <ClubLink id={club.id}><ClubCrest club={club} size={26} /></ClubLink> : <span className="calm-nocrest" aria-hidden="true" />}
              <span className="rl-name">{ev.line}</span>
            </span>
            <span className="calm-comp">{ev.comp ?? ''}</span>
            <span className="rl-num rl-main calm-res">{ev.result ?? ''}</span>
          </div>
        );
      })}
    </div>
  );
}
