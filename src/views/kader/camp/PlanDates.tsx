// =============================================================================
// TRAININGSLAGER-PLANER – Schritt 1: Zeitraum. Monatskalender des Fensters
// (Sommervorbereitung bzw. Winterpause), Pflichtspiele und Hallenturniere gesperrt,
// Vorlauf/kurzfristiger Aufschlag markiert, Dauer per Regler.
// =============================================================================
import { CalendarEngine } from '../../../engine/calendar';
import { CAMP_LEAD_DAYS, CAMP_MAX_DAYS, CAMP_MIN_DAYS, CAMP_SHORT_NOTICE_DAYS } from '../../../engine/trainingCamp';
import type { Game } from '../../../game/state';
import { checkCampDates } from '../../../game/trainingCampGame';
import { CampSeason, competitiveDays, daysBetween, ownIndoorDays } from '../../../game/winterShared';
import { MON_FULL, WD_SHORT, fmtDay } from '../../../ui/format';

const dow = (iso: string) => new Date(iso + 'T00:00:00Z').getUTCDay();

export function PlanDates({ g, season, window: w, start, days, onStart, onDays }: {
  g: Game; season: CampSeason; window: { from: string; to: string };
  start: string; days: number; onStart: (d: string) => void; onDays: (n: number) => void;
}) {
  const today = g.calendar.currentDate;
  const busy = competitiveDays(g);
  const indoor = ownIndoorDays(g, true);
  const lead = CalendarEngine.addDays(today, CAMP_LEAD_DAYS);
  const cheap = CalendarEngine.addDays(today, CAMP_SHORT_NOTICE_DAYS);
  const end = start ? CalendarEngine.addDays(start, days - 1) : '';
  const check = start ? checkCampDates(g, season, start, days) : null;
  const opp = (d: string) => {
    const m = g.fixtures.find((x) => x.involvesPlayerClub && x.date === d);
    if (!m) return 'Pflichtspiel (Pokal/Europapokal)';
    const other = m.homeClubId === g.managedClubId ? m.awayClubId : m.homeClubId;
    return `Pflichtspiel gegen ${g.clubs[other]?.shortName ?? other}`;
  };

  // Monate des Fensters (höchstens vier; längere Winterpausen beginnen mit Urlaub/Halle).
  const from = w.from, to = w.to;
  const months: string[] = [];
  for (let m = from.slice(0, 7); m <= to.slice(0, 7);) {
    months.push(m);
    const [y, mo] = m.split('-').map(Number);
    m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
  }
  const validStarts = new Set(daysBetween(w.from, w.to).filter((d) => !checkCampDates(g, season, d, days).error));

  return (
    <div className="cp-dates">
      <div className="cp-dates-head">
        <div>
          <div className="cp-kicker">{season === 'summer' ? 'Sommervorbereitung' : 'Winterpause'}</div>
          <div className="cp-dates-win">{fmtDay(w.from)} – {fmtDay(w.to)}</div>
        </div>
        <label className="cp-dur">
          <span>Dauer <b>{days}</b> Tage</span>
          <input type="range" min={CAMP_MIN_DAYS} max={CAMP_MAX_DAYS} value={days} onChange={(e) => onDays(Number(e.target.value))} />
        </label>
      </div>
      <div className="cp-months" style={{ gridTemplateColumns: `repeat(${Math.min(4, months.length)}, minmax(0, 1fr))` }}>
        {months.slice(-4).map((m) => {
          const first = `${m}-01`;
          const [y, mo] = m.split('-').map(Number);
          const nDays = new Date(Date.UTC(y, mo, 0)).getUTCDate();
          const pad = (dow(first) + 6) % 7; // Montag zuerst
          return (
            <div key={m} className="cp-month">
              <div className="cp-month-name">{MON_FULL[mo - 1]} {y}</div>
              <div className="cp-wd">{[1, 2, 3, 4, 5, 6, 0].map((i) => <span key={i}>{WD_SHORT[i]}</span>)}</div>
              <div className="cp-grid">
                {Array.from({ length: pad }, (_, i) => <span key={`p${i}`} className="cp-day blank" />)}
                {Array.from({ length: nDays }, (_, i) => {
                  const d = `${m}-${String(i + 1).padStart(2, '0')}`;
                  const inWin = d >= w.from && d <= w.to;
                  const match = busy.has(d);
                  const hall = indoor.get(d);
                  const inRange = start && d >= start && d <= end;
                  const cls = [
                    'cp-day', inWin ? 'win' : 'out', match ? 'match' : '', hall ? (hall.own && hall.own !== 'decline' ? 'hall' : 'hall-open') : '',
                    inWin && d < lead ? 'lead' : '', inWin && d >= lead && d < cheap ? 'short' : '',
                    inRange ? (check?.error ? 'range bad' : 'range') : '', d === start ? 'start' : '', d === end ? 'end' : '',
                    validStarts.has(d) ? 'can' : '', d === today ? 'today' : '',
                  ].filter(Boolean).join(' ');
                  const title = match ? opp(d) : hall ? `Hallenturnier: ${hall.name}${hall.own === null ? ' (Einladung offen – wird bei Buchung abgesagt)' : ''}`
                    : !inWin ? 'außerhalb des Fensters' : d < lead ? `Vorlauf: Buchung mindestens ${CAMP_LEAD_DAYS} Tage vorher` : validStarts.has(d) ? `Anreise ${fmtDay(d)}` : 'Kein Lager ab diesem Tag möglich';
                  return (
                    <button key={d} className={cls} title={title} disabled={!validStarts.has(d) && !inRange} onClick={() => validStarts.has(d) && onStart(d)}>
                      {i + 1}{match && <i className="cp-mark" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cp-legend">
        <span><i className="sw range" />Lagerzeitraum</span>
        <span><i className="sw match" />Pflichtspiel</span>
        <span><i className="sw hall" />Hallenturnier</span>
        <span><i className="sw short" />kurzfristig (+20 %)</span>
        <span><i className="sw lead" />Vorlauf zu kurz</span>
      </div>
      <div className={`cp-dates-sum ${check?.error ? 'bad' : ''}`}>
        {!start ? 'Wähle im Kalender den Anreisetag.' : check?.error ? check.error
          : `Anreise ${fmtDay(start)}, Rückkehr ${fmtDay(end)} · ${days} Tage${check?.surcharge ? ' · kurzfristig: 20 % Aufschlag' : ''}${check?.indoorConflict?.length ? ` · offene Hallen-Einladung wird abgesagt (${check.indoorConflict.join(', ')})` : ''}`}
      </div>
    </div>
  );
}
