// Kalender › Monat als Raster: je Tag das wichtigste Ereignis (+ Anzahl weiterer), ruhige
// Flächen; eigene Spiele mit Bernstein-Kante, Pokal/Europapokal mit heller Kante.
import type { StripEvent } from '../../../shell/CalendarStrip';
import { fmtDay } from '../../../ui/format';
import { WD_LABELS } from './calendarShared';

export interface DayState { blockedReason?: string; free: boolean; preview?: 'ok' | 'bad'; selectable: boolean }

export function MonthGrid({ cells, today, dayEvents, planMode, stateOf, onDay }: {
  cells: (string | null)[]; today: string; dayEvents: Map<string, StripEvent[]>; planMode: boolean;
  stateOf: (iso: string) => DayState; onDay: (iso: string) => void;
}) {
  return (
    <>
      <div className="cal-grid cal-head-row">
        {WD_LABELS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
      </div>
      <div className="cal-grid cal-grid-fill calm-grid">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} className="cal-cell cal-empty" />;
          const list = dayEvents.get(iso) ?? [];
          const ev = list[0];
          const st = stateOf(iso);
          const jumpable = !planMode && !!list.find((e) => e.screen);
          const cls = ['cal-cell', 'calm-cell'];
          if (iso === today) cls.push('cal-today');
          if (iso < today) cls.push('cal-past');
          if (ev?.accent === 'orange') cls.push('calm-own');
          else if (ev?.accent === 'gold') cls.push('calm-cup');
          if (st.blockedReason && !ev) cls.push('calm-busy');
          if (st.preview) cls.push(st.preview === 'ok' ? 'cal-preview' : 'cal-preview-bad');
          if (jumpable) cls.push('cal-jumpable');
          if (planMode && st.selectable) cls.push('cal-selectable');
          const title = [fmtDay(iso), ...list.map((e) => e.line + (e.result ? ` ${e.result}` : '')), !list.length && st.blockedReason ? st.blockedReason : '']
            .filter(Boolean).join('\n') + (planMode ? (st.selectable ? '\nAls Starttag wählen' : '') : jumpable ? '\nKlicken zum Öffnen' : '');
          return (
            <div key={iso} className={cls.join(' ')} onClick={() => onDay(iso)} title={title}>
              <span className="calm-top">
                <span className="cal-dom">{Number(iso.slice(8, 10))}</span>
                {list.length > 1 && <span className="calm-more">+{list.length - 1}</span>}
              </span>
              {ev ? (
                <span className="calm-ev">
                  {ev.kind && <span className="calm-ev-kind">{ev.kind}</span>}
                  <span className="calm-ev-line">{ev.line}{ev.result ? <b> {ev.result}</b> : null}</span>
                </span>
              ) : st.blockedReason ? (
                <span className="calm-ev"><span className="calm-ev-line dim">{st.blockedReason}</span></span>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
