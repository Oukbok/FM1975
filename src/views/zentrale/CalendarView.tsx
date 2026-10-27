import Icon from '../../components/Icon';
import { ACTIVITY_DEFS, ActivityType, activityCostBase, activityId, activityIncomeBase, addDaysUTC, daysInRange } from '../../data/activities';
import { economyScale, yearOf } from '../../engine/economy';
import { book } from '../../engine/finances';
import { makeMessage, pushMessage } from '../../engine/messages';
import { Game } from '../../game/state';
import { buildStripEventMap } from '../../shell/CalendarStrip';
import { Screen } from '../../shell/navigation';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { fmtDM, fmtDay } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// KALENDER — Monatsansicht, planbare Aktivitäten (Block p11)
// =============================================================================
export const WD_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const MONTH_LABELS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function CalendarView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto: (s: Screen) => void }) {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const todayY = Number(today.slice(0, 4));
  const todayM = Number(today.slice(5, 7)) - 1;
  const [viewY, setViewY] = useState(todayY);
  const [viewM, setViewM] = useState(todayM);
  const [planType, setPlanType] = useState<ActivityType>('camp');
  const [planDays, setPlanDays] = useState(5);
  const [selStart, setSelStart] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // Planungsmodus: nur wenn aktiv, wählt ein Klick im Kalender einen Starttag für
  // eine Aktivität. Standardmäßig AUS → ein einfacher Klick springt zum Event.
  const [planMode, setPlanMode] = useState(false);

  // Gemeinsame Event-Quelle mit dem Header-Kalender: pro Tag das wichtigste Event
  // (Gegner H/A, Pokal, Transferfenster, Bewertung, …) inkl. Icon + Farbakzent.
  const eventMap = buildStripEventMap(g);

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

  // Sprungziel für einen Tag: das wichtigste Event des Tages → passender Screen.
  // Gibt null zurück, wenn es kein anspringbares Event gibt.
  const screenForDate = (iso: string): Screen | null => {
    let best: { screen: Screen; prio: number } | null = null;
    const consider = (screen: Screen, prio: number) => {
      if (!best || prio > best.prio) best = { screen, prio };
    };
    for (const ev of g.calendar.events) {
      if (ev.date !== iso) continue;
      switch (ev.type) {
        case 'matchday': consider('fixtures', 100); break;
        case 'cup_matchday': consider('cup', 95); break;
        case 'transfer_window_open':
        case 'transfer_window_close': consider('transfers', 30); break;
        case 'rating_update': consider('table', 25); break;
        // winter_break / season_end / season_start haben kein eigenes Sprungziel
      }
    }
    return best ? best.screen : null;
  };

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

  const nextEvents = g.calendar.events
    .filter((e) => e.date >= today && !e.processed)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  return (
    <DashPage>
      <DashBox title={`${MONTH_LABELS[viewM]} ${viewY}`} icon="kalender" span={2} rows={2}
        right={<span className="dbtnrow">
          <button className="dchip" onClick={prevMonth}>‹ Vormonat</button>
          <button className="dchip" onClick={() => { setViewY(todayY); setViewM(todayM); }}>Heute</button>
          <button className="dchip" onClick={nextMonth}>Folgemonat ›</button>
        </span>}>
        <div className="dnote" style={{ marginBottom: 8 }}>
          {planMode
            ? 'Planungsmodus: Klicke einen freien Tag als Starttag der Aktivität an.'
            : 'Klicke auf einen Tag mit Termin, um direkt dorthin zu springen.'}
        </div>
        <div className="cal-grid cal-head-row">
          {WD_LABELS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
        </div>
        <div className="cal-grid cal-grid-fill">
          {cells.map((iso, i) => {
            if (!iso) return <div key={`b${i}`} className="cal-cell cal-empty" />;
            const dom = Number(iso.slice(8, 10));
            const isToday = iso === today;
            const reason = blocked.get(iso);
            const past = iso < today;
            const free = dayIsFree(iso);
            const inPreview = previewDays.has(iso);
            const ev = eventMap.get(iso);
            const accentCls = ev?.accent === 'orange' ? 'cal-acc-orange' : ev?.accent === 'gold' ? 'cal-acc-gold' : '';
            const jumpable = !planMode && !!screenForDate(iso);
            const cls = ['cal-cell'];
            if (isToday) cls.push('cal-today');
            if (past) cls.push('cal-past');
            if (reason) cls.push('cal-blocked');
            else if (free) cls.push('cal-free');
            if (accentCls) cls.push(accentCls);
            if (inPreview) cls.push(previewValid ? 'cal-preview' : 'cal-preview-bad');
            if (jumpable) cls.push('cal-jumpable');
            if (planMode && free) cls.push('cal-selectable');
            const title = planMode
              ? (free ? 'Als Starttag wählen' : (ev ? `${fmtDay(iso)} — ${ev.line}` : reason ? `${fmtDay(iso)} — ${reason}` : fmtDay(iso)))
              : (ev ? `${fmtDay(iso)} — ${ev.line} (klicken zum Springen)` : reason ? `${fmtDay(iso)} — ${reason}` : fmtDay(iso));
            return (
              <div key={iso} className={cls.join(' ')} onClick={() => clickDay(iso)} title={title}>
                <span className="cal-dom">{dom}</span>
                {ev ? (
                  <span className="cal-cell-ev">
                    <Icon name={ev.icon} className="cal-cell-ico" />
                    <span className="cal-cell-ev-txt">{ev.line}</span>
                  </span>
                ) : reason ? (
                  <span className="cal-cell-ev cal-cell-ev-generic">
                    <Icon name="kalender" className="cal-cell-ico" />
                    <span className="cal-cell-ev-txt">{reason}</span>
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="cal-legend dim2 mini mt8">
          <span><i className="lg lg-free" /> frei</span>
          <span><i className="lg lg-block" /> Spiel/Planung</span>
          <span><i className="lg lg-today" /> heute</span>
          <span><i className="lg lg-prev" /> Auswahl</span>
        </div>
      </DashBox>

      <DashBox title="Aktivität planen" icon="training" right={`Konto ${fmtDM(club.finances.balance)}`}>
        <div className="dbtnrow" style={{ marginBottom: 8 }}>
          {(['camp', 'friendly', 'teambuilding'] as ActivityType[]).map((t) => (
            <button key={t} className={`dchip ${planType === t ? 'on' : ''}`} onClick={() => { setPlanType(t); setSelStart(null); }}>
              {ACTIVITY_DEFS[t].name}
            </button>
          ))}
        </div>
        <div className="dnote" style={{ marginBottom: 8 }}>{def.desc}</div>
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
            <button className="btn btn-sm" onClick={startPlanning}>Starttag wählen</button>
          ) : (
            <>
              <button className="btn btn-sm btn-ghost" onClick={cancelPlanning}>Abbrechen</button>
              <button className="btn btn-sm" disabled={!selStart || !previewValid} onClick={confirmPlan}>Einplanen</button>
            </>
          )}
        </div>
        {msg && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{msg}</div>}
      </DashBox>

      <DashBox title="Termine" icon="schedule">
        {upcoming.length > 0 && <div className="dsec">Geplante Aktivitäten</div>}
        {upcoming.map((a) => {
          const ad = ACTIVITY_DEFS[a.type];
          const running = a.startDate <= today && !a.applied;
          return (
            <div key={a.id} className="dlist-row">
              <span className="grow">{ad.name} <span className="muted">· {fmtDay(a.startDate)} – {fmtDay(a.endDate)}{running ? ' · läuft' : ''}</span></span>
              {!running && a.startDate > today && <button className="dchip" onClick={() => cancelActivity(a.id)}>Stornieren</button>}
            </div>
          );
        })}
        <div className="dsec">Nächste Termine</div>
        {nextEvents.length ? nextEvents.map((e) => (
          <div key={e.id} className="dlist-row clickable" onClick={() => { const t = screenForDate(e.date); if (t) onGoto(t); }}>
            <span className="meta" style={{ minWidth: 92 }}>{fmtDay(e.date)}</span>
            <span className="grow">{e.title}</span>
          </div>
        )) : <Empty icon="schedule">Keine Termine mehr in dieser Saison.</Empty>}
      </DashBox>
    </DashPage>
  );
}
