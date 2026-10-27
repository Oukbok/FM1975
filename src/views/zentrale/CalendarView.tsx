import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import { ACTIVITY_DEFS, ActivityType, activityCostBase, activityId, activityIncomeBase, addDaysUTC, daysInRange } from '../../data/activities';
import { economyScale, yearOf } from '../../engine/economy';
import { book } from '../../engine/finances';
import { makeMessage, pushMessage } from '../../engine/messages';
import { Game } from '../../game/state';
import { buildStripEventMap } from '../../shell/CalendarStrip';
import { Screen } from '../../shell/navigation';
import { PageHead } from '../../ui/PageHead';
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
    if (!selStart) { setMsg('⚠ Bitte zuerst einen freien Starttag im Kalender wählen.'); return; }
    const end = addDaysUTC(selStart, days - 1);
    const range = daysInRange(selStart, end);
    if (selStart < today || !range.every((d) => !blocked.has(d))) {
      setMsg('⚠ Der gewählte Zeitraum kollidiert mit einem Spiel oder einer anderen Planung.');
      return;
    }
    if (club.finances.balance < plannedCost) {
      setMsg('⚠ Kontostand zu niedrig für diese Aktivität.');
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
      subject: `${def.icon} ${def.name} eingeplant`,
      shortText: `${def.name} vom ${fmtDay(selStart)} bis ${fmtDay(end)} geplant.`,
      bodyText: `Die Aktivität „${def.name}" ist eingeplant.\n\n`
        + `Zeitraum: ${fmtDay(selStart)} – ${fmtDay(end)} (${days} Tag(e))\n`
        + (plannedCost > 0 ? `Kosten (sofort gebucht): ${fmtDM(plannedCost)}\n` : 'Kosten: keine\n')
        + `\nDie Wirkung auf den Kader (Fitness/Form/Moral) tritt am Ende des Zeitraums ein.`,
    }));
    setSelStart(null);
    setPlanMode(false);
    setMsg(`✔ ${def.name} geplant (${plannedCost > 0 ? fmtDM(plannedCost) : 'kostenlos'}).`);
    onChange();
    setTimeout(() => setMsg(null), 4000);
  };

  const cancelActivity = (id: string) => {
    const list = g.activities ?? [];
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return;
    const act = list[idx];
    if (act.applied || act.startDate <= today) {
      setMsg('⚠ Bereits laufende oder abgeschlossene Aktivitäten können nicht storniert werden.');
      setTimeout(() => setMsg(null), 3500);
      return;
    }
    // Kosten erstatten (Planung rückgängig).
    if (act.cost > 0) book(club.finances, today, act.cost, 'other', `Storno ${ACTIVITY_DEFS[act.type].name}`, true);
    list.splice(idx, 1);
    setMsg('✔ Aktivität storniert, Kosten erstattet.');
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

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Kalender"
        right={<span className="dim">Kontostand: <b style={{ color: 'var(--accent)' }}>{fmtDM(club.finances.balance)}</b></span>}
      />

      {/* === KALENDER (zuerst) ================================================ */}
      {/* Monatsnavigation */}
      <div className="cal-nav mt12">
        <button className="btn btn-sm btn-ghost" onClick={prevMonth}>‹ Vormonat</button>
        <div className="cal-month-title">{MONTH_LABELS[viewM]} {viewY}</div>
        <button className="btn btn-sm btn-ghost" onClick={nextMonth}>Folgemonat ›</button>
      </div>

      {/* Hinweis: aktueller Klick-Modus */}
      <div className="dim2 mini mt4" style={{ textAlign: 'center' }}>
        {planMode
          ? 'Planungsmodus: Klicke einen freien Tag als Starttag der Aktivität an.'
          : 'Klicke auf einen Tag mit Event, um direkt dorthin zu springen.'}
      </div>

      {/* Wochentagsköpfe */}
      <div className="cal-grid cal-head-row">
        {WD_LABELS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
      </div>

      {/* Tagesraster */}
      <div className="cal-grid">
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

      <div className="cal-legend dim2 mini mt12">
        <span><i className="lg lg-free" /> frei</span>
        <span><i className="lg lg-block" /> Spiel/Planung</span>
        <span><i className="lg lg-today" /> heute</span>
        <span><i className="lg lg-prev" /> Auswahl</span>
      </div>

      {msg && <div className="card mt12" style={{ borderColor: 'var(--accent)' }}>{msg}</div>}

      {/* === TRAININGSLAGER & AKTIVITÄTEN PLANEN (darunter) ==================== */}
      <div className="card mt12">
        <div className="section-title">Trainingslager & Aktivitäten planen</div>
        <div className="cal-plan">
          <div className="cal-plan-types">
            {(['camp', 'friendly', 'teambuilding'] as ActivityType[]).map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${planType === t ? '' : 'btn-ghost'}`}
                onClick={() => { setPlanType(t); setSelStart(null); }}
              >
                {ACTIVITY_DEFS[t].icon} {ACTIVITY_DEFS[t].name}
              </button>
            ))}
          </div>
          <div className="dim mini">{def.desc}</div>
          {planType !== 'friendly' && (
            <label className="cal-days">
              Dauer: <b>{days}</b> Tag(e)
              <input type="range" min={def.minDays} max={def.maxDays} step={1} value={days}
                onChange={(e) => setPlanDays(Number(e.target.value))} />
            </label>
          )}
          <div className="cal-plan-info">
            <span className="mini">Kosten: <b className="red">{plannedCost > 0 ? fmtDM(plannedCost) : 'keine'}</b></span>
            {plannedIncome > 0 && <span className="mini">Erlös: <b className="accent-text">+{fmtDM(plannedIncome)}</b></span>}
            {!planMode ? (
              <>
                <span className="mini dim2">Starttag oben im Kalender festlegen ↑</span>
                <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={startPlanning}>
                  Starttag wählen
                </button>
              </>
            ) : (
              <>
                <span className="mini">
                  {selStart
                    ? <>Zeitraum: <b>{fmtDay(selStart)} – {fmtDay(previewEnd)}</b> {previewValid ? '✅' : '⛔'}</>
                    : <span className="dim2">Klicke oben einen freien Starttag an ↑</span>}
                </span>
                <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={cancelPlanning}>
                  Abbrechen
                </button>
                <button className="btn btn-sm" disabled={!selStart || !previewValid} onClick={confirmPlan}>
                  ✓ Einplanen
                </button>
              </>
            )}
          </div>
          <div className="dim2 mini">
            Effekte: {def.fitness ? `Fitness +${def.fitness} ` : ''}{def.form ? `· Form +${def.form} ` : ''}{def.morale ? '· Moral ↑' : ''}
            — die Wirkung tritt am Ende des Zeitraums ein. Planung nur an freien Tagen (kein Spiel, keine andere Aktivität).
          </div>
        </div>
      </div>

      {/* Geplante Aktivitäten */}
      {upcoming.length > 0 && (
        <div className="mt12">
          <div className="section-title">Geplante Aktivitäten</div>
          <div className="cal-list">
            {upcoming.map((a) => {
              const ad = ACTIVITY_DEFS[a.type];
              const running = a.startDate <= today && !a.applied;
              return (
                <div key={a.id} className="card cal-list-item">
                  <span className="fac-ico">{ad.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="fac-name">{ad.name}</div>
                    <div className="dim2 mini">{fmtDay(a.startDate)} – {fmtDay(a.endDate)} · {a.cost > 0 ? fmtDM(a.cost) : 'kostenlos'}{running ? ' · läuft' : ''}</div>
                  </div>
                  {!running && a.startDate > today && (
                    <button className="btn btn-sm btn-danger" onClick={() => cancelActivity(a.id)}>Stornieren</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
