// Kalender › Monat als Raster (Optik Wunsch Pascal, CSS 28-calpage.css): Heute mit gefülltem
// Datumsfeld + Etikett, vergangene Tage gedimmt, je Tag der wichtigste Termin als Zeile mit
// Kürzel + feiner Farbkante je Art (+ Anzahl weiterer Termine), keine Mini-Symbole.
import type { StripEvent } from '../../../shell/CalendarStrip';
import { fmtDay } from '../../../ui/format';
import { WD_LABELS } from './calendarShared';

export interface DayState { blockedReason?: string; free: boolean; preview?: 'ok' | 'bad'; selectable: boolean }

/** Farbkante (Klasse `cal-k-*`) + Kürzel eines Termins. */
export function eventKind(ev: StripEvent): { k: string; code: string } {
  switch (ev.kind) {
    case 'Liga': return { k: ev.isMatch ? 'liga' : 'info', code: 'Liga' };
    case 'Pokal': return { k: 'cup', code: 'Pokal' };
    case 'Europapokal': return { k: 'euro', code: 'EC' };
    case 'Testspiel': return { k: 'other', code: 'Test' };
    case 'Halle': return { k: 'winter', code: 'Halle' };
    case 'Training': return { k: 'winter', code: 'TL' };
    default: return { k: 'info', code: ev.kind ?? '' };
  }
}

export function MonthGrid({ cells, today, dayEvents, planMode, stateOf, onDay }: {
  cells: (string | null)[]; today: string; dayEvents: Map<string, StripEvent[]>; planMode: boolean;
  stateOf: (iso: string) => DayState; onDay: (iso: string) => void;
}) {
  return (
    <>
      <div className="cal-grid cal-head-row">
        {WD_LABELS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
      </div>
      <div className="cal-grid cal-grid-fill">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} className="cal-cell cal-empty" />;
          const list = dayEvents.get(iso) ?? [];
          const ev = list[0];
          const st = stateOf(iso);
          const isToday = iso === today;
          const kind = ev ? eventKind(ev) : st.blockedReason ? { k: 'plan', code: '' } : null;
          const jumpable = !planMode && !!list.find((e) => e.screen);
          const cls = ['cal-cell'];
          if (isToday) cls.push('cal-today');
          if (iso < today) cls.push('cal-past');
          if (st.blockedReason) cls.push('cal-blocked');
          else if (st.free) cls.push('cal-free');
          if (kind) cls.push(`cal-k-${kind.k}`);
          if (st.preview) cls.push(st.preview === 'ok' ? 'cal-preview' : 'cal-preview-bad');
          if (jumpable) cls.push('cal-jumpable');
          if (planMode && st.selectable) cls.push('cal-selectable');
          const title = [fmtDay(iso), ...list.map((e) => (e.comp ? `${e.comp}: ` : '') + e.line + (e.result ? ` ${e.result}` : '')),
            !list.length && st.blockedReason ? st.blockedReason : '']
            .filter(Boolean).join('\n') + (planMode ? (st.selectable ? '\nAls Starttag wählen' : '') : jumpable ? '\nKlicken zum Öffnen' : '');
          return (
            <div key={iso} className={cls.join(' ')} onClick={() => onDay(iso)} title={title}>
              <span className="cal-top">
                <span className="cal-dom">{Number(iso.slice(8, 10))}</span>
                {isToday && <span className="cal-today-tag">Heute</span>}
                {list.length > 1 && <span className="calm-more">+{list.length - 1}</span>}
              </span>
              {(ev || st.blockedReason) && (
                <span className="cal-ev">
                  {kind?.code && <span className="cal-code">{kind.code}</span>}
                  <span className="cal-ev-txt">{ev ? (ev.result ? `${ev.line} ${ev.result}` : ev.line) : st.blockedReason}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span><i className="lg2 lg2-today">10</i> Heute</span>
        <span><i className="lg2 lg2-liga" /> Liga</span>
        <span><i className="lg2 lg2-cup" /> Pokal</span>
        <span><i className="lg2 lg2-euro" /> Europapokal</span>
        <span><i className="lg2 lg2-winter" /> Halle / Lager</span>
        <span><i className="lg2 lg2-past" /> vorbei</span>
        {planMode && <span><i className="lg2 lg2-prev" /> Auswahl</span>}
      </div>
    </>
  );
}
