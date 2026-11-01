import Icon from '../../components/Icon';
import { BLOCKS_BY_ID, TRAINING_BLOCKS, blockAvailable } from '../../engine/weeklyTraining';
import {
  DAY_LONG, EFFECT_GROUPS, PLAN_TEMPLATES, SLOT_KEYS, SlotKey, addDaysISO, applyTemplate, mondayOf, weekEffect,
} from '../../engine/trainingPlan';
import { yearOf } from '../../engine/economy';
import { Game } from '../../game/state';
import { effectiveWeek } from '../../game/trainingWeek';
import { blockFactorFn, teamSkill } from '../../game/trainerTeam';
import { ensureStaff } from '../../game/staffGame';
import { SKILL_LABEL } from '../../engine/staffSkills';
import { DashBox, DashPage, Kpi, Meter } from '../../ui/DashPage';
import { condColor, fmtDateShort } from '../../ui/format';
import { PhilosophyBox } from '../kader/PhilosophyBox';
import { PaletteTile, PlanCell, BLOCK_SHORT } from './planParts';
import { useRef, useState, type PointerEvent as RPE } from 'react';
import { createPortal } from 'react-dom';

// =============================================================================
// TRAINING › TRAININGSPLAN — Wochenraster mit drei Feldern je Tag. Bausteine aus
// der Leiste ins Feld ziehen (oder anklicken und dann das Feld anklicken),
// Felder untereinander tauschen, zurück in die Leiste ziehen = leeren.
// Spiele sperren Felder (Spiel, Auslaufen am Tag danach, Anreise am Abend vorher).
// =============================================================================
interface Drag { id: string | null; from?: { day: number; slot: SlotKey }; sx: number; sy: number; cx: number; cy: number; active: boolean; over: string | null }
const SLOT_SHORT: Record<SlotKey, string> = { slot1: 'Vormittag', slot2: 'Nachmittag', extra: 'Abend' };

export function TrainingPlanView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<string | null | undefined>(undefined);
  const [weekOff, setWeekOff] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const refresh = () => { setTick((t) => t + 1); onChange(); };
  const year = yearOf(g.calendar.currentDate);
  const plan = g.trainingPlan;
  const today = g.calendar.currentDate;
  const monday = addDaysISO(mondayOf(today), weekOff * 7);
  const { infos, days } = effectiveWeek(g, monday);
  const fx = weekEffect(days, infos, blockFactorFn(g));
  const palette = TRAINING_BLOCKS.filter((b) => blockAvailable(b, year));
  const later = TRAINING_BLOCKS.filter((b) => !blockAvailable(b, year)).sort((a, b) => (a.unlockYear ?? 0) - (b.unlockYear ?? 0));

  const setCell = (day: number, slot: SlotKey, id: string | null) => { plan.days[day][slot] = id; };
  const targetAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest('[data-day]') as HTMLElement | null;
    if (cell) return `${cell.dataset.day}:${cell.dataset.slot}`;
    if (el?.closest('[data-drop="palette"], .tp-palette')) return 'palette';
    return null;
  };
  const begin = (e: RPE, id: string | null, from?: { day: number; slot: SlotKey }) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const d: Drag = { id, from, sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY, active: false, over: null };
    dragRef.current = d;
    const move = (ev: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      cur.cx = ev.clientX; cur.cy = ev.clientY;
      if (!cur.active && Math.hypot(ev.clientX - cur.sx, ev.clientY - cur.sy) > 5) cur.active = true;
      if (!cur.active) return;
      cur.over = targetAt(ev.clientX, ev.clientY);
      setDrag({ ...cur });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const cur = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!cur) return;
      if (!cur.active) {
        // Klick: Baustein aus der Leiste auswählen (erneuter Klick hebt die Auswahl auf).
        if (!cur.from) setSelected((s) => (s === cur.id ? undefined : cur.id));
        return;
      }
      const over = cur.over;
      if (over && over !== 'palette') {
        const [ds, slot] = over.split(':');
        const day = Number(ds), sk = slot as SlotKey;
        if (cur.from) {
          const other = plan.days[day][sk];
          setCell(day, sk, cur.id);
          setCell(cur.from.day, cur.from.slot, other);
        } else setCell(day, sk, cur.id);
      } else if (cur.from) setCell(cur.from.day, cur.from.slot, null);
      refresh();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const ghostBlock = drag?.active ? (drag.id ? BLOCKS_BY_ID[drag.id] : null) : undefined;
  const staff = ensureStaff(g);
  const lead = (['fitness', 'technik', 'taktik', 'torwart', 'mental', 'analyse'] as const)
    .filter((k) => (k !== 'analyse' || year >= 1993) && (k !== 'mental' || year >= 2003))
    .map((k) => ({ k, v: Math.round(teamSkill(staff, k, year)) }));
  const groupMax = Math.max(6, ...Object.values(fx.groups));
  const squad = (g.clubs[g.managedClubId]?.playerIds ?? []).map((id) => g.players[id]).filter(Boolean);
  const avgFri = squad.length ? Math.round(squad.reduce((s, p) => s + (p.frische ?? 100), 0) / squad.length) : 100;
  const riskText = fx.injuryIndex < 0.6 ? 'gering' : fx.injuryIndex < 1.3 ? 'normal' : fx.injuryIndex < 2.2 ? 'erhöht' : 'hoch';
  const dev = Math.round((fx.devFactor - 1) * 100);

  return (
    <DashPage className="tp-page">
      <DashBox title="Trainingsplan" icon="training" span={3} className="tp-box"
        right={<span className="tp-weeknav">
          <select className="tt-select" value="" title="Vorlage für die ganze Woche laden" onChange={(e) => { if (e.target.value) { applyTemplate(plan, e.target.value, year); refresh(); } }}>
            <option value="">Vorlage laden …</option>
            {PLAN_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} – {t.desc}</option>)}
          </select>
          <button className={`dchip ${weekOff === 0 ? 'on' : ''}`} onClick={() => setWeekOff(0)}>Diese Woche</button>
          <button className={`dchip ${weekOff === 1 ? 'on' : ''}`} onClick={() => setWeekOff(1)}>Nächste Woche</button>
        </span>}>
        <div className="tp-palette" data-drop="palette">
          {palette.map((b) => <PaletteTile key={b.id} b={b} selected={selected === b.id} onDown={(e) => begin(e, b.id)} />)}
          <PaletteTile b={null} selected={selected === null} onDown={(e) => begin(e, null)} />
        </div>
        <div className="tp-grid">
          {infos.map((inf, di) => {
            const f = inf.fixture;
            const isToday = inf.date === today;
            return (
              <div key={di} className={`tp-day ${f ? 'match' : ''} ${isToday ? 'today' : ''}`}>
                <div className="tp-day-head">
                  <span className="tp-day-name">{DAY_LONG[di]}</span>
                  <span className="tp-day-date">{fmtDateShort(inf.date).dmy}</span>
                  <span className="tp-day-sub">{f ? `${f.comp} ${f.home ? 'gegen' : 'bei'} ${g.clubs[f.oppId]?.shortName ?? g.simClubs?.[f.oppId]?.shortName ?? '?'}` : isToday ? 'heute' : ' '}</span>
                </div>
                {SLOT_KEYS.map((sk) => {
                  const lock = inf.locks[sk];
                  const id = lock === 'regen' ? 'regeneration' : plan.days[di][sk];
                  const key = `${di}:${sk}`;
                  return (
                    <PlanCell key={sk} day={di} slot={sk} label={SLOT_SHORT[sk]} block={id ? BLOCKS_BY_ID[id] ?? null : null}
                      lock={lock} fixture={f} hover={!!drag?.active && drag.over === key}
                      dragging={!!drag?.active && drag.from?.day === di && drag.from.slot === sk}
                      onDown={(e) => begin(e, plan.days[di][sk], { day: di, slot: sk })}
                      onClick={() => { if (selected !== undefined && !lock) { setCell(di, sk, selected); refresh(); } }}
                      onClear={() => { setCell(di, sk, null); refresh(); }} />
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="tp-hint">
          Baustein in ein Feld ziehen · Felder untereinander tauschen · zurück in die Leiste ziehen oder Doppelklick leert ein Feld · Klick wählt einen Baustein, Klick ins Feld setzt ihn.
          {later.length > 0 && <> Später verfügbar: {later.map((b) => `${BLOCK_SHORT[b.id]} (ab ${b.unlockYear})`).join(', ')}.</>}
        </div>
      </DashBox>

      <DashBox title="Wochenwirkung" icon="stats" right={`${fx.units} Einheiten · ${fx.trainDays} Trainingstage`}>
        {EFFECT_GROUPS.map((gr) => {
          const v = fx.groups[gr.key];
          return <Meter key={gr.key} label={gr.label} value={v} max={groupMax} text={v < 0.3 ? '–' : v < 2 ? 'gering' : v < 4.5 ? 'mittel' : 'stark'} />;
        })}
        <div className="dnote mt8">Bausteine lenken, welche Fähigkeiten bei den nächsten Bewertungen wachsen. Ein Fachmann im Trainerteam verstärkt die Wirkung.</div>
      </DashBox>

      <DashBox title="Belastung & Ertrag" icon="dashKader">
        <div className="dkpis">
          <Kpi value={`${fx.fitnessPerDay > 0 ? '+' : ''}${fx.fitnessPerDay}`} label="Fitness je Tag" color={fx.fitnessPerDay < -2 ? 'var(--neg)' : undefined} />
          <Kpi value={riskText} label="Verletzungsrisiko" color={fx.injuryIndex >= 2.2 ? 'var(--neg)' : undefined} />
          <Kpi value={`${dev > 0 ? '+' : ''}${dev} %`} label="Entwicklung" />
          <Kpi value={avgFri} label="Ø Frische" color={condColor(avgFri)} />
        </div>
        <div className="dsec">Anleitung durch dein Trainerteam</div>
        {lead.map((l) => (
          <Meter key={l.k} label={SKILL_LABEL[l.k]} value={l.v} max={20} text={l.v ? `${l.v}/20` : 'niemand'} />
        ))}
      </DashBox>

      <PhilosophyBox g={g} onChange={refresh} />

      {ghostBlock !== undefined && drag && createPortal(
        <div className="tp-ghost" style={{ left: drag.cx, top: drag.cy }}>
          <Icon name={ghostBlock ? ghostBlock.icon : 'trFree'} size={28} />
          <span>{ghostBlock ? BLOCK_SHORT[ghostBlock.id] : 'Frei'}</span>
        </div>, document.body)}
    </DashPage>
  );
}
