// =============================================================================
// Kalender-Overlay: erscheint, solange die Zeit läuft (Weiter gedrückt).
// Streifen mit 11 Tagen in der Bildschirmmitte – 3 vergangene, heute, 7 kommende –
// der beim Tageswechsel weich einen Tag weitergleitet. Linker/rechter Rand blenden
// per Maske aus; dahinter liegt die App geblurrt und abgedunkelt (CSS `28-calendar.css`,
// Kopfleiste über `.cal-live` in GameShell – nur der Weiter/Pause-Knopf bleibt klar).
// Ereignisse je Tag aus `buildDayEventsMap` (CalendarStrip.tsx).
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import ClubCrest from '../components/ClubCrest';
import Icon from '../components/Icon';
import { addDaysUTC } from '../data/activities';
import { Game } from '../game/state';
import { MON_FULL, WD_SHORT, fmtDateFull } from '../ui/format';
import { buildDayEventsMap, StripEvent } from './CalendarStrip';

const PAST = 3;
const AHEAD = 7;
/** Fade-Dauer in ms (muss zu `.co-root` in 28-calendar.css passen). */
const FADE_MS = 280;

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

export function CalendarOverlay({ g, show, speedMs, delayMs = 0, onPause }: {
  g: Game; show: boolean; speedMs: number;
  /** Erst nach dieser Laufzeit einblenden (kurze Klicks bleiben ruhig). */
  delayMs?: number;
  onPause: () => void;
}) {
  // Phasen: aus → eingeblendet → ausblenden → aus (DOM bleibt während des Ausblendens).
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (show) {
      timer.current = window.setTimeout(() => {
        setMounted(true);
        // zwei Frames, damit der Übergang von opacity 0 aus startet
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      }, delayMs);
    } else {
      setVisible(false);
      timer.current = window.setTimeout(() => setMounted(false), FADE_MS + 40);
    }
    return () => window.clearTimeout(timer.current);
  }, [show, delayMs]);

  const today = g.calendar.currentDate;
  const events = useMemo(() => (mounted ? buildDayEventsMap(g) : null), [g, today, mounted]);
  // Gleiten nur bei genau einem Tag Vorlauf; Sprünge (Schnell simulieren, erneutes
  // Einblenden) setzen den Streifen ohne Übergang neu.
  const prevToday = useRef(today);
  const jump = dayDiff(prevToday.current, today);
  const snap = jump !== 0 && jump !== 1;
  useEffect(() => { prevToday.current = today; }, [today]);
  if (!mounted || !events) return null;

  // Einen Tag mehr auf jeder Seite rendern: er gleitet aus der Maske herein bzw. hinaus.
  const days: string[] = [];
  for (let i = -PAST - 1; i <= AHEAD + 1; i++) days.push(addDaysUTC(today, i));
  const slide = Math.round(Math.max(180, Math.min(650, speedMs * 0.7)));

  return (
    <div className={`co-root ${visible ? 'is-on' : ''}`} onClick={onPause} role="presentation">
      <div className="co-center" style={{ ['--co-slide' as string]: `${slide}ms` }}>
        <div className="co-date">{fmtDateFull(today)}</div>
        <div className={`co-strip ${snap ? 'co-snap' : ''}`}>
          {/* fester Rahmen „Heute“: die Tage gleiten hindurch */}
          <div className="co-today-frame" style={{ transform: `translateX(calc(var(--co-pitch) * ${PAST}))` }}><span>Heute</span></div>
          {days.map((d) => {
            const off = dayDiff(today, d);
            return <DayCard key={d} g={g} date={d} off={off} evs={events.get(d) ?? []} />;
          })}
        </div>
        <div className="co-hint">Leertaste oder Klick hält die Zeit an</div>
      </div>
    </div>
  );
}

function DayCard({ g, date, off, evs }: { g: Game; date: string; off: number; evs: StripEvent[] }) {
  const dt = new Date(date + 'T00:00:00Z');
  const main = evs[0];
  // Weitere Ereignisse des Tages (gleiche Einträge nur einmal, höchstens zwei).
  const seen = new Set<string>();
  const more = evs.slice(1).filter((e) => {
    const k = `${e.line}|${e.comp ?? ''}`;
    if (seen.has(k) || (k === `${main.line}|${main.comp ?? ''}`)) return false;
    if (main.isMatch && e.icon === 'schedule') return false; // „Spieltag N“ der Liga steckt schon im eigenen Spiel
    seen.add(k); return true;
  }).slice(0, 2);
  const cls = ['co-card'];
  if (off === 0) cls.push('is-today');
  if (off < 0) cls.push('is-past');
  if (main?.isMatch) cls.push('is-match');
  return (
    <div className={cls.join(' ')} data-off={off} style={{ transform: `translateX(calc(var(--co-pitch) * ${off + PAST}))` }}>
      <div className="co-head">
        <span className="co-wd">{WD_SHORT[dt.getUTCDay()]}</span>
        <span className="co-day">{dt.getUTCDate()}</span>
        <span className="co-mon">{MON_FULL[dt.getUTCMonth()].slice(0, 3)}</span>
      </div>
      <div className="co-body">{main && <MainEvent g={g} ev={main} />}</div>
      {more.length > 0 && (
        <div className="co-more">
          {more.map((e, i) => (
            <div key={i} className="co-more-row"><Icon name={e.icon} size={14} /><span>{e.isMatch && e.clubId ? shortName(g, e.clubId) : e.comp && !e.isMatch ? `${e.line} ${e.comp}` : e.line}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

function shortName(g: Game, id: string): string {
  const c = g.clubs[id];
  return c?.shortName || c?.name || id;
}

function MainEvent({ g, ev }: { g: Game; ev: StripEvent }) {
  const opp = ev.clubId ? g.clubs[ev.clubId] : undefined;
  if (ev.isMatch && opp) {
    return (
      <div className="co-match">
        <span className="co-crest"><ClubCrest club={opp} size={52} /></span>
        <span className="co-opp">{opp.name}</span>
        <span className="co-sub">
          <span className="co-ha">{ev.home ? 'Heim' : 'Auswärts'}</span>
          {ev.result && <span className="co-res">{ev.result}</span>}
        </span>
        {ev.comp && <span className="co-comp">{ev.comp}</span>}
      </div>
    );
  }
  return (
    <div className="co-ev">
      <span className="co-ev-ico"><Icon name={ev.icon} size={30} /></span>
      <span className="co-ev-lbl">{ev.line}</span>
      {ev.comp && <span className="co-comp">{ev.comp}</span>}
    </div>
  );
}
