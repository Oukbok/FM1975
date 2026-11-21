import { ACTIVITY_DEFS, ActivityType, activityCostBase, activityId, activityIncomeBase, addDaysUTC, daysInRange } from '../../data/activities';
import { economyScale, yearOf } from '../../engine/economy';
import { book } from '../../engine/finances';
import { makeMessage, pushMessage } from '../../engine/messages';
import { Game } from '../../game/state';
import { buildDayEventsMap } from '../../shell/CalendarStrip';
import { Screen } from '../../shell/navigation';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { fmtDM, fmtDay } from '../../ui/format';
import { useState } from 'react';
import Icon from '../../components/Icon';
import { ownCampDays, ownIndoorDays } from '../../game/winterShared';
import { CAL_GROUPS, calGroupOf, MONTH_LABELS, WD_LABELS, type CalGroup } from './calendar/calendarShared';
import { MonthGrid } from './calendar/MonthGrid';
import { MonthList } from './calendar/MonthList';

// =============================================================================
// KALENDER — Monat als Raster oder Liste (alle Termine: Spiele, Auslosungen,
// Trainingslager, Halle, Transferfenster/-bilanz, Bewertungen, Ehrungen, Budget,
// Jugendwettbewerbe, Verträge; Quelle shell/CalendarStrip.tsx `buildDayEventsMap`,
// Klick → Seite des Termins) + planbare Aktivitäten (Block p11).
// =============================================================================
export { MONTH_LABELS, WD_LABELS };

type CalMode = 'raster' | 'liste';
const MODE_KEY = 'fm1975.calendarMode';
const readMode = (): CalMode => { try { return localStorage.getItem(MODE_KEY) === 'liste' ? 'liste' : 'raster'; } catch { return 'raster'; } };

export function CalendarView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto: (s: Screen) => void }) {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const todayY = Number(today.slice(0, 4));
  const todayM = Number(today.slice(5, 7)) - 1;
  const [viewY, setViewY] = useState(todayY);
  const [viewM, setViewM] = useState(todayM);
  const [planType, setPlanType] = useState<ActivityType>('friendly');
  const [planDays, setPlanDays] = useState(5);
  const [selStart, setSelStart] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // Planungsmodus: nur wenn aktiv, wählt ein Klick im Kalender einen Starttag für
  // eine Aktivität. Standardmäßig AUS → ein einfacher Klick springt zum Event.
  const [planMode, setPlanMode] = useState(false);
  const [mode, setModeRaw] = useState<CalMode>(readMode);
  const setMode = (m: CalMode) => { setModeRaw(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* egal */ } };

  // Gemeinsame Quelle mit dem Kalender-Overlay (shell/CalendarOverlay.tsx): alle Termine je Tag,
  // wichtigster zuerst, mit Sprungziel `screen`.
  const dayEvents = buildDayEventsMap(g);
  // Filter (Wunsch Pascal): 1. Mannschaft / Jugend / Sonstiges, standardmäßig alles an; gilt für Raster und Liste.
  const [groups, setGroups] = useState<Set<CalGroup>>(() => new Set(CAL_GROUPS.map((x) => x.key)));
  const toggleGroup = (k: CalGroup) => setGroups((cur) => { const n = new Set(cur); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const shownEvents = new Map([...dayEvents].map(([d, list]) => [d, list.filter((e) => groups.has(calGroupOf(e)))] as const).filter(([, list]) => list.length > 0));

  // Blockierte Tage (Pflichtspiele + Pokal + bereits geplante Aktivitäten).
  const blocked = new Map<string, string>(); // iso → Grund
  for (const ev of g.calendar.events) {
    if (ev.type === 'matchday' || ev.type === 'cup_matchday') {
      blocked.set(ev.date, ev.type === 'matchday' ? 'Ligaspiel' : 'Pokalspiel');
    }
  }
  for (const act of g.activities ?? []) {
    for (const d of daysInRange(act.startDate, act.endDate)) {
      if (!blocked.has(d)) blocked.set(d, ACTIVITY_DEFS[act.type].name);
    }
  }
  // Winter: Hallenturniere (zugesagt/offen) und gebuchte Trainingslager (game/winterShared.ts).
  const indoorDays = ownIndoorDays(g);
  const campDays = ownCampDays(g);
  for (const d of indoorDays.keys()) if (!blocked.has(d)) blocked.set(d, 'Hallenturnier');
  for (const d of campDays.keys()) if (!blocked.has(d)) blocked.set(d, 'Trainingslager');

  const def = ACTIVITY_DEFS[planType];
  const days = planType === 'friendly' ? 1 : Math.max(def.minDays, Math.min(def.maxDays, planDays));
  const scale = economyScale(yearOf(today));
  const plannedCost = Math.round(activityCostBase(planType, days) * scale);
  const plannedIncome = Math.round(activityIncomeBase(planType) * scale);

  // Kandidaten-Tage der aktuellen Planung (für Vorschau-Markierung).
  const previewDays = new Set<string>();
  let previewValid = false;
  let previewEnd = '';
  if (selStart) {
    previewEnd = addDaysUTC(selStart, days - 1);
    const range = daysInRange(selStart, previewEnd);
    previewValid = selStart >= today && range.every((d) => !blocked.has(d));
    for (const d of range) previewDays.add(d);
  }

  const dayIsFree = (iso: string) => iso >= today && !blocked.has(iso);

  // Sprungziel eines Tages: das wichtigste Ereignis mit Ziel.
  const screenForDate = (iso: string): Screen | null => (dayEvents.get(iso) ?? []).find((e) => e.screen)?.screen ?? null;

  const clickDay = (iso: string) => {
    // Planungsmodus: Klick wählt einen freien Starttag für die Aktivität.
    if (planMode) {
      if (!dayIsFree(iso)) return;
      setSelStart(iso);
      setMsg(null);
      return;
    }
    // Normalmodus: einfacher Klick springt zum jeweiligen Event des Tages.
    const target = screenForDate(iso);
    if (target) onGoto(target);
  };

  const startPlanning = () => { setPlanMode(true); setSelStart(null); setMsg(null); };
  const cancelPlanning = () => { setPlanMode(false); setSelStart(null); setMsg(null); };

  const confirmPlan = () => {
    if (!selStart) { setMsg('Bitte zuerst einen freien Starttag im Kalender wählen.'); return; }
    const end = addDaysUTC(selStart, days - 1);
    const range = daysInRange(selStart, end);
    if (selStart < today || !range.every((d) => !blocked.has(d))) {
      setMsg('Der gewählte Zeitraum kollidiert mit einem Spiel oder einer anderen Planung.');
      return;
    }
    if (club.finances.balance < plannedCost) {
      setMsg('Kontostand zu niedrig für diese Aktivität.');
      return;
    }
    const label = `${def.name} ${selStart.slice(8, 10)}.${selStart.slice(5, 7)}.`;
    if (plannedCost > 0) {
      book(club.finances, today, -plannedCost, 'other', `${def.name} (geplant)`, true);
    }
    (g.activities ?? (g.activities = [])).push({
      id: activityId(), type: planType, startDate: selStart, endDate: end,
      label, cost: plannedCost, applied: false,
    });
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Trainerstab',
      subject: `${def.name} eingeplant`,
      shortText: `${def.name} vom ${fmtDay(selStart)} bis ${fmtDay(end)} geplant.`,
      bodyText: `Die Aktivität „${def.name}" ist eingeplant.\n\n`
        + `Zeitraum: ${fmtDay(selStart)} – ${fmtDay(end)} (${days} Tag(e))\n`
        + (plannedCost > 0 ? `Kosten (sofort gebucht): ${fmtDM(plannedCost)}\n` : 'Kosten: keine\n')
        + `\nDie Wirkung auf den Kader (Fitness/Form/Moral) tritt am Ende des Zeitraums ein.`,
    }));
    setSelStart(null);
    setPlanMode(false);
    setMsg(`${def.name} geplant (${plannedCost > 0 ? fmtDM(plannedCost) : 'kostenlos'}).`);
    onChange();
    setTimeout(() => setMsg(null), 4000);
  };

  const cancelActivity = (id: string) => {
    const list = g.activities ?? [];
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return;
    const act = list[idx];
    if (act.applied || act.startDate <= today) {
      setMsg('Bereits laufende oder abgeschlossene Aktivitäten können nicht storniert werden.');
      setTimeout(() => setMsg(null), 3500);
      return;
    }
    // Kosten erstatten (Planung rückgängig).
    if (act.cost > 0) book(club.finances, today, act.cost, 'other', `Storno ${ACTIVITY_DEFS[act.type].name}`, true);
    list.splice(idx, 1);
    setMsg('Aktivität storniert, Kosten erstattet.');
    onChange();
    setTimeout(() => setMsg(null), 3500);
  };

  // Monatsraster aufbauen (Mo=0).
  const firstOfMonth = new Date(Date.UTC(viewY, viewM, 1));
  const startWd = (firstOfMonth.getUTCDay() + 6) % 7; // Mo=0..So=6
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewY}-${String(viewM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  const prevMonth = () => { if (viewM === 0) { setViewM(11); setViewY(viewY - 1); } else setViewM(viewM - 1); };
  const nextMonth = () => { if (viewM === 11) { setViewM(0); setViewY(viewY + 1); } else setViewM(viewM + 1); };

  const upcoming = (g.activities ?? []).filter((a) => a.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Nächste Termine aus derselben Quelle (ab heute, wichtigster je Tag zuerst).
  const nextEvents = (() => {
    const out: { key: string; date: string; line: string; screen?: Screen }[] = [];
    for (const [date, list] of [...dayEvents].filter(([d]) => d >= today).sort((a, b) => a[0].localeCompare(b[0]))) {
      for (const e of list) {
        if (e.date === today && e.result) continue;
        out.push({ key: `${date}|${e.line}`, date, line: e.line, screen: e.screen });
        if (out.length >= 14) return out;
      }
    }
    return out;
  })();
  const monthDays = cells.filter((c): c is string => !!c);

  return (
    <DashPage>
      <DashBox className="cal-box" title={`${MONTH_LABELS[viewM]} ${viewY}`} span={2} rows={2} info="spielplan"
        right={<span className="dbtnrow">
          {CAL_GROUPS.map((x) => (
            <button key={x.key} className={`b3 cal-filter ${groups.has(x.key) ? 'on' : ''}`} aria-pressed={groups.has(x.key)} onClick={() => toggleGroup(x.key)}>{x.label}</button>
          ))}
          <span className="calm-sep" aria-hidden="true" />
          <button className={`b3 ${mode === 'raster' ? 'on' : ''}`} onClick={() => setMode('raster')}>Raster</button>
          <button className={`b3 ${mode === 'liste' ? 'on' : ''}`} onClick={() => setMode('liste')}>Liste</button>
          <span className="calm-sep" aria-hidden="true" />
          <button className="b3 b3-icon" onClick={prevMonth} title="Vormonat" aria-label="Vormonat"><Icon name="navPrev" size={18} /></button>
          <button className="b3" onClick={() => { setViewY(todayY); setViewM(todayM); }} disabled={viewY === todayY && viewM === todayM}>Heute</button>
          <button className="b3 b3-icon" onClick={nextMonth} title="Folgemonat" aria-label="Folgemonat"><Icon name="navNext" size={18} /></button>
        </span>}>
        <div className="dnote calm-note">
          {planMode
            ? 'Planungsmodus: Klicke einen freien Tag als Starttag der Aktivität an.'
            : mode === 'liste' ? 'Alle Termine des Monats – klicke einen Termin, um zur passenden Seite zu springen.'
              : 'Klicke auf einen Tag mit Termin, um direkt dorthin zu springen.'}
        </div>
        {mode === 'liste' && !planMode ? (
          <div className="calm-scroll"><MonthList g={g} days={monthDays} dayEvents={shownEvents} onGoto={onGoto} /></div>
        ) : (
          <MonthGrid cells={cells} today={today} dayEvents={shownEvents} planMode={planMode} onDay={clickDay}
            stateOf={(iso) => ({
              blockedReason: blocked.get(iso), free: dayIsFree(iso), selectable: planMode && dayIsFree(iso),
              preview: previewDays.has(iso) ? (previewValid ? 'ok' : 'bad') : undefined,
            })} />
        )}
      </DashBox>

      <DashBox title="Aktivität planen" right={`Konto ${fmtDM(club.finances.balance)}`}>
        <div className="dbtnrow" style={{ marginBottom: 8 }}>
          {(['friendly', 'teambuilding'] as ActivityType[]).map((t) => (
            <button key={t} className={`b3 ${planType === t ? 'on' : ''}`} onClick={() => { setPlanType(t); setSelStart(null); }}>
              {ACTIVITY_DEFS[t].name}
            </button>
          ))}
        </div>
        <div className="dnote" style={{ marginBottom: 8 }}>{def.desc}</div>
        <div className="dnote clickable" style={{ marginBottom: 8, color: 'var(--accent)' }} onClick={() => onGoto('trainingslager')}>Trainingslager buchst du unter Training › Trainingslager.</div>
        {planType !== 'friendly' && (
          <label className="cal-days">
            Dauer: <b>{days}</b> Tag(e)
            <input type="range" min={def.minDays} max={def.maxDays} step={1} value={days}
              onChange={(e) => setPlanDays(Number(e.target.value))} />
          </label>
        )}
        <KV k="Kosten" v={plannedCost > 0 ? fmtDM(plannedCost) : 'keine'} color="var(--red)" />
        {plannedIncome > 0 && <KV k="Erlös" v={`+${fmtDM(plannedIncome)}`} color="var(--green)" />}
        <KV k="Wirkung" v={[def.fitness ? `Fitness +${def.fitness}` : '', def.form ? `Form +${def.form}` : '', def.morale ? 'Moral besser' : ''].filter(Boolean).join(' · ') || '—'} />
        {planMode && <KV k="Zeitraum" v={selStart ? `${fmtDay(selStart)} – ${fmtDay(previewEnd)}${previewValid ? '' : ' (belegt)'}` : 'Starttag im Kalender wählen'} color={selStart && !previewValid ? 'var(--red)' : undefined} />}
        <div className="dbtnrow mt8">
          {!planMode ? (
            <button className="b3" onClick={startPlanning}>Starttag wählen</button>
          ) : (
            <>
              <button className="b3" onClick={cancelPlanning}>Abbrechen</button>
              <button className="b3 b3-primary" disabled={!selStart || !previewValid} onClick={confirmPlan}>Einplanen</button>
            </>
          )}
        </div>
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{msg}</div>}
      </DashBox>

      <DashBox title="Termine">
        {upcoming.length > 0 && <div className="dsec">Geplante Aktivitäten</div>}
        {upcoming.map((a) => {
          const ad = ACTIVITY_DEFS[a.type];
          const running = a.startDate <= today && !a.applied;
          return (
            <div key={a.id} className="dlist-row">
              <span className="grow">{ad.name} <span className="muted">· {fmtDay(a.startDate)} – {fmtDay(a.endDate)}{running ? ' · läuft' : ''}</span></span>
              {!running && a.startDate > today && <button className="b3 b3-s" onClick={() => cancelActivity(a.id)}>Stornieren</button>}
            </div>
          );
        })}
        <div className="dsec">Nächste Termine</div>
        {nextEvents.length ? (
          <div className="rl rl-sm calm-next">
            {nextEvents.map((e) => (
              <div key={e.key} className={`rl-row ${e.screen ? 'clickable' : ''}`} onClick={e.screen ? () => onGoto(e.screen!) : undefined}>
                <span className="rl-rank">{WD_LABELS[(new Date(e.date + 'T00:00:00Z').getUTCDay() + 6) % 7]} {e.date.slice(8, 10)}.{e.date.slice(5, 7)}.</span>
                <span className="rl-name">{e.line}</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="schedule">Keine Termine mehr in dieser Saison.</Empty>}
      </DashBox>
    </DashPage>
  );
}
