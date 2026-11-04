// =============================================================================
// Training › Trainingsplan › Mannschaftstraining (Vorbild EA FM): links das
// Ringbuch mit der Woche (Kacheln je Einheit, Spieltage als eigene Spalte), darunter
// freie Felder + Intensität; rechts die Bausteine in Reitern (nach dem Fachgebiet,
// das sie anleitet) und die Trainingsinfo (Zustand des Kaders, Wochenwirkung).
// Rechnung unverändert: engine/trainingPlan.ts, game/trainingWeek.ts.
// =============================================================================
import { useState } from 'react';
import Icon from '../../../components/Icon';
import ClubCrest from '../../../components/ClubCrest';
import { FitnessIcon, FormIcon, FreshnessIcon, MoraleIcon, fitness100, form100, freshness100, playerMorale100 } from '../../../components/status';
import { BLOCKS_BY_ID, TRAINING_BLOCKS, blockAvailable } from '../../../engine/weeklyTraining';
import {
  DAY_SHORT, EFFECT_GROUPS, PLAN_TEMPLATES, SLOT_KEYS, SlotKey, addDaysISO, applyTemplate, mondayOf, weekEffect,
} from '../../../engine/trainingPlan';
import { yearOf } from '../../../engine/economy';
import { Game } from '../../../game/state';
import { effectiveWeek } from '../../../game/trainingWeek';
import { blockFactorFn } from '../../../game/trainerTeam';
import { templateName } from '../../../game/trainingSeason';
import { DashBox, DashPage, Kpi } from '../../../ui/DashPage';
import { fmtDateShort } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';
import { squadOf } from '../../shared';
import { PaletteTile, PlanCell } from '../planParts';
import { BlockKind, KIND_TABS, blockKind, leaderText } from './model';
import { useBlockDrag } from './useBlockDrag';
import type { PlanTab } from './model';
import Select from '../../../ui/Select';

const SLOT_SHORT: Record<SlotKey, string> = { slot1: 'Vormittag', slot2: 'Nachmittag', extra: 'Abend' };
let lastKind: BlockKind = 'fit';

/** Intensität der Woche aus der Fitness-Bilanz je Trainingstag. */
function intensityOf(fitnessPerDay: number): { pct: number; label: string; hot: boolean } {
  const pct = Math.max(4, Math.min(100, Math.round(((10 - fitnessPerDay) / 14) * 100)));
  const label = fitnessPerDay > 6 ? 'Leicht' : fitnessPerDay > 3 ? 'Normal' : fitnessPerDay > 0 ? 'Fordernd' : fitnessPerDay > -2 ? 'Hart' : 'Sehr hart';
  return { pct, label, hot: fitnessPerDay <= -2 };
}

export function TeamTab({ g, refresh, onTab }: { g: Game; refresh: () => void; onTab: (t: PlanTab) => void }) {
  const [weekOff, setWeekOff] = useState(0);
  const [kind, setKindState] = useState<BlockKind>(lastKind);
  const setKind = (k: BlockKind) => { lastKind = k; setKindState(k); };
  const plan = g.trainingPlan;
  const dnd = useBlockDrag(plan, refresh);
  const year = yearOf(g.calendar.currentDate);
  const today = g.calendar.currentDate;
  const monday = addDaysISO(mondayOf(today), weekOff * 7);
  const { infos, days } = effectiveWeek(g, monday);
  const fx = weekEffect(days, infos, blockFactorFn(g));
  const tabBlocks = TRAINING_BLOCKS.filter((b) => blockKind(b) === kind);
  const avail = tabBlocks.filter((b) => blockAvailable(b, year));
  const later = tabBlocks.filter((b) => !blockAvailable(b, year));
  const tabSkill = KIND_TABS.find((t) => t.id === kind)?.skill ?? null;
  const free = infos.reduce((n, inf, di) => n + SLOT_KEYS.filter((k) => !inf.locks[k] && !plan.days[di][k]).length, 0);
  const int = intensityOf(fx.fitnessPerDay);
  const squad = squadOf(g);
  const avg = (f: (p: (typeof squad)[number]) => number) => (squad.length ? Math.round(squad.reduce((s, p) => s + f(p), 0) / squad.length) : 0);
  const riskText = fx.injuryIndex < 0.6 ? 'gering' : fx.injuryIndex < 1.3 ? 'normal' : fx.injuryIndex < 2.2 ? 'erhöht' : 'hoch';
  const dev = Math.round((fx.devFactor - 1) * 100);
  const groupMax = Math.max(6, ...Object.values(fx.groups));
  const nextMon = addDaysISO(mondayOf(today), 7);
  const pendingTpl = weekOff === 1 ? plan.schedule?.[nextMon] : undefined;
  const clearWeek = () => { for (const d of plan.days) for (const k of SLOT_KEYS) d[k] = null; refresh(); };

  return (
    <DashPage className="tr3-team">
      <DashBox title="Wochenplan" icon="training" rows={2} className="tr3-weekbox"
        right={<span className="tp-weeknav">
          <span className="tr3-lbl">Trainingswoche laden</span>
          <Select className="tt-select" value="" onChange={(v) => { if (v) { applyTemplate(plan, v, year); refresh(); } }}>
            <option value="">Vorlage wählen …</option>
            {PLAN_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} – {t.desc}</option>)}
          </Select>
        </span>}>
        <div className="tr3-folder">
          {[0, 1].map((o) => (
            <button key={o} className={`tr3-ftab ${weekOff === o ? 'on' : ''}`} onClick={() => setWeekOff(o)}>
              {o === 0 ? 'Diese Woche' : 'Nächste Woche'}
              <span className="tr3-ftab-d">{fmtDateShort(addDaysISO(mondayOf(today), o * 7)).dmy.slice(0, 6)}–{fmtDateShort(addDaysISO(mondayOf(today), o * 7 + 6)).dmy.slice(0, 6)}</span>
            </button>
          ))}
          <span className="tr3-folder-note">{pendingTpl ? `Ab Montag lädt der Trainerstab die Vorlage „${templateName(pendingTpl)}“.` : 'Der Wochenplan gilt jede Woche – Spiele sperren ihre Felder.'}</span>
        </div>
        <div className="tr3-binder">
          <div className="tr3-rings" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} />)}</div>
          <div className="tr3-sheet">
            {infos.map((inf, di) => {
              const f = inf.fixture;
              const isToday = inf.date === today;
              const opp = f ? g.clubs[f.oppId] : undefined;
              const oppName = f ? opp?.shortName ?? g.simClubs?.[f.oppId]?.shortName ?? '?' : '';
              return (
                <div key={di} className={`tr3-col ${f ? 'match' : ''} ${isToday ? 'today' : ''}`}>
                  <div className="tr3-colhead">
                    <span className="tr3-dname">{DAY_SHORT[di]}</span>
                    <span className="tr3-ddate">{fmtDateShort(inf.date).dmy.slice(0, 6)}</span>
                  </div>
                  {f ? (
                    <div className="tr3-matchcol" title={`${f.comp}: ${f.home ? 'gegen' : 'bei'} ${oppName}`}>
                      <span className="tr3-mc-comp">{f.comp}</span>
                      <Icon name="matchball" size={30} />
                      {opp ? <ClubCrest club={opp} size={54} /> : <span className="tr3-mc-noc" />}
                      <span className="tr3-mc-opp">{f.home ? 'gegen' : 'bei'}<b>{oppName}</b></span>
                      <span className="tr3-mc-ha">{f.home ? 'Heimspiel' : 'Auswärts'}</span>
                    </div>
                  ) : SLOT_KEYS.map((sk) => {
                    const lock = inf.locks[sk];
                    const id = lock === 'regen' ? 'regeneration' : plan.days[di][sk];
                    const key = `${di}:${sk}`;
                    return (
                      <PlanCell key={sk} day={di} slot={sk} label={SLOT_SHORT[sk]} block={id ? BLOCKS_BY_ID[id] ?? null : null}
                        lock={lock} fixture={f} hover={!!dnd.drag?.active && dnd.drag.over === key}
                        dragging={!!dnd.drag?.active && dnd.drag.from?.day === di && dnd.drag.from.slot === sk}
                        onDown={(e) => dnd.begin(e, plan.days[di][sk], { day: di, slot: sk })}
                        onClick={() => { if (dnd.selected !== undefined && !lock) { dnd.setCell(di, sk, dnd.selected); refresh(); } }}
                        onClear={() => { dnd.setCell(di, sk, null); refresh(); }} />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="tr3-under">
          <div className="tr3-under-l">
            <div className="tr3-kv"><span>Freie Felder</span><b>{free}</b></div>
            <div className="tr3-kv"><span>Intensität<InfoTip k="trainingIntensitaet" /></span>
              <span className={`tr3-int ${int.hot ? 'hot' : ''}`}><i style={{ width: `${int.pct}%` }} /><em>{int.label}</em></span>
            </div>
            <div className="tr3-hint">Baustein aus den Reitern rechts in ein Feld ziehen · Felder untereinander tauschen · zurück nach rechts ziehen, Doppel- oder Rechtsklick leert ein Feld · Klick wählt einen Baustein, Klick ins Feld setzt ihn.</div>
          </div>
          <div className="tr3-under-r">
            <button className="tr3-btn" onClick={() => onTab('long')}><Icon name="kalender" size={18} />Langfristig planen</button>
            <button className="tr3-btn" onClick={clearWeek}><Icon name="trFree" size={18} />Woche leeren</button>
          </div>
        </div>
      </DashBox>

      <DashBox title="Trainingseinstellungen" icon="whistle" className="tr3-setbox">
        <nav className="tr3-ktabs">
          {KIND_TABS.map((t) => (
            <button key={t.id} className={`tr3-ktab trk-${t.id} ${kind === t.id ? 'on' : ''}`} onClick={() => setKind(t.id)}>{t.label}</button>
          ))}
        </nav>
        <div className="tr3-setnote">Ziehe die Einheiten auf die gewünschten Termine im Kalender.
          <span className="tr3-lead">Anleitung: {tabSkill ? leaderText(g, tabSkill) : 'je nach Baustein (Torwart, Mental, Analyse)'}</span>
        </div>
        <div className="tp-palette tr3-palette" data-drop="palette">
          {avail.map((b) => <PaletteTile key={b.id} b={b} selected={dnd.selected === b.id} onDown={(e) => dnd.begin(e, b.id)} />)}
          {kind === 'misc' && <PaletteTile b={null} selected={dnd.selected === null} onDown={(e) => dnd.begin(e, null)} />}
          {later.map((b) => (
            <div key={b.id} className={`tp-tile tr3-later trk-${kind}`} title={b.description}>
              <span className="tp-tile-ico int-0"><Icon name={b.icon} size={28} /></span>
              <span className="tp-tile-txt"><span className="tp-tile-lbl">{b.name}</span><span className="tp-tile-sub">ab {b.unlockYear}</span></span>
            </div>
          ))}
        </div>
      </DashBox>

      <DashBox title="Trainingsinfo" icon="stats" info="wochenwirkung" right={`${fx.units} Einheiten · ${fx.trainDays} Trainingstage`} className="tr3-infobox">
        <div className="tr3-state">
          <div><FitnessIcon value={avg(fitness100)} size={20} /><span>Ø Fitness</span><b>{avg(fitness100)}</b></div>
          <div><FreshnessIcon value={avg(freshness100)} size={20} /><span>Ø Frische</span><b>{avg(freshness100)}</b></div>
          <div><FormIcon value={avg(form100)} size={20} /><span>Ø Form</span><b>{avg(form100)}</b></div>
          <div><MoraleIcon value={avg(playerMorale100)} size={20} /><span>Ø Moral</span><b>{avg(playerMorale100)}</b></div>
        </div>
        <div className="dkpis tr3-kpis">
          <Kpi value={`${fx.fitnessPerDay > 0 ? '+' : ''}${fx.fitnessPerDay}`} label="Fitness je Tag" color={fx.fitnessPerDay < -2 ? 'var(--neg)' : undefined} />
          <Kpi value={riskText} label="Verletzungsrisiko" color={fx.injuryIndex >= 2.2 ? 'var(--neg)' : undefined} />
          <Kpi value={`${dev > 0 ? '+' : ''}${dev} %`} label="Entwicklung" />
        </div>
        <div className="tr3-effect">
          {EFFECT_GROUPS.map((gr) => {
            const v = fx.groups[gr.key];
            return (
              <div key={gr.key} className="tr3-eff">
                <span>{gr.label}</span>
                <span className="tr3-eff-bar"><i style={{ width: `${Math.min(100, (v / groupMax) * 100)}%` }} /></span>
                <em>{v < 0.3 ? '–' : v < 2 ? 'gering' : v < 4.5 ? 'mittel' : 'stark'}</em>
              </div>
            );
          })}
        </div>
      </DashBox>
      {dnd.ghost}
    </DashPage>
  );
}
