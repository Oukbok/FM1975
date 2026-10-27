import Icon from '../../components/Icon';
import { BLOCKS_BY_ID, INTENSITY_LABELS, TRAINING_BLOCKS, dayLoad, expectedFitnessDelta } from '../../engine/weeklyTraining';
import { Game } from '../../game/state';
import { ATTRIBUTE_LABELS_DE, DaySlots, Match } from '../../types';
import { DashBox, DashPage, Empty, Kpi, Meter } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { PlayerRow } from '../shared';
import { useState } from 'react';

// =============================================================================
// TRAINING
// =============================================================================
export const DAY_NAMES_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export const DAY_NAMES_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const SLOT_LABELS: { key: keyof DaySlots; label: string }[] = [
  { key: 'slot1', label: 'Einheit 1' },
  { key: 'slot2', label: 'Einheit 2' },
  { key: 'extra', label: 'Extraeinheit' },
];

/** Farbcodierung eines Fitness-Deltas (positiv = Erholung, negativ = Ermüdung). */
export function fitDeltaColor(d: number): string {
  if (d >= 3) return 'var(--green)';
  if (d >= 0) return 'var(--yellow)';
  if (d >= -4) return 'var(--orange)';
  return 'var(--red)';
}

export function TrainingView({ g, onTrained }: { g: Game; onTrained: () => void }) {
  const club = g.clubs[g.managedClubId];
  const plan = g.trainingPlan;
  const [, setLocalTick] = useState(0);
  const refresh = () => { setLocalTick((t) => t + 1); onTrained(); };

  // Aktuelle Kalenderwoche (Mo–So) rund um das aktuelle Datum ermitteln (UTC).
  const cur = new Date(g.calendar.currentDate + 'T00:00:00Z');
  const monday = new Date(cur);
  monday.setUTCDate(cur.getUTCDate() - ((cur.getUTCDay() + 6) % 7));
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }
  // Pflichtspiele des Manager-Vereins in dieser Woche (Index Mo=0 … So=6).
  const matchByIdx: Record<number, Match> = {};
  for (let i = 0; i < 7; i++) {
    const m = g.fixtures.find((x) => x.involvesPlayerClub && x.date === weekDates[i]);
    if (m) matchByIdx[i] = m;
  }
  const todayIdx = (cur.getUTCDay() + 6) % 7;

  const setSlot = (dayIdx: number, slot: keyof DaySlots, val: string) => {
    plan.days[dayIdx][slot] = val === '' ? null : val;
    refresh();
  };

  // Wochenbilanz (nur Nicht-Spieltage zählen als Trainingstage).
  let weekLoad = 0;
  let trainDays = 0;
  for (let i = 0; i < 7; i++) {
    if (matchByIdx[i]) continue;
    weekLoad += dayLoad(plan.days[i]);
    trainDays++;
  }
  const avgDelta = trainDays > 0 ? Math.round((DAILY_BASE_RECOVERY_UI * trainDays - weekLoad) / trainDays * 10) / 10 : 0;

  // Trainingsschwerpunkte der Woche: Summe der Attribut-Gewichte aller geplanten Einheiten.
  const focus: Record<string, number> = {};
  let units = 0;
  plan.days.forEach((day, i) => {
    if (matchByIdx[i]) return;
    for (const { key } of SLOT_LABELS) {
      const b = day[key] ? BLOCKS_BY_ID[day[key] as string] : null;
      if (!b) continue;
      units++;
      for (const [a, w] of Object.entries(b.attributes)) focus[a] = (focus[a] ?? 0) + (w as number);
    }
  });
  const focusTop = Object.entries(focus).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const focusMax = focusTop[0]?.[1] ?? 1;
  const squad = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  const avgFri = squad.length ? Math.round(squad.reduce((s, p) => s + (p.frische ?? 100), 0) / squad.length) : 100;
  const avgFit = squad.length ? Math.round(squad.reduce((s, p) => s + p.attributes.fitness, 0) / squad.length) : 0;
  const tired = [...squad].sort((a, b) => (a.frische ?? 100) - (b.frische ?? 100)).slice(0, 4);

  return (
    <DashPage>
      <DashBox title="Wochen-Trainingsplan" icon="training" span={3}
        right={`${trainDays} Trainingstage · ${Object.keys(matchByIdx).length} Spieltag(e) · Ø Fitness/Tag ${avgDelta > 0 ? '+' : ''}${avgDelta}`}>
        <div className="planner-grid">
          {plan.days.map((day, idx) => {
            const match = matchByIdx[idx];
            const delta = expectedFitnessDelta(day);
            return (
              <div key={idx} className={`planner-day ${match ? 'is-matchday' : ''} ${idx === todayIdx ? 'is-today' : ''}`}>
                <div className="pd-head">
                  <span className="pd-name">{DAY_NAMES_LONG[idx]}</span>
                  {idx === todayIdx && <span className="pd-today-badge">heute</span>}
                </div>
                {match ? (
                  <div className="pd-matchday">
                    <div className="pd-md-ico"><Icon name="matchball" size={34} /></div>
                    <div className="pd-md-txt">Spieltag {match.matchday}</div>
                    <div className="pd-md-sub">
                      {match.homeClubId === club.id
                        ? `gegen ${g.clubs[match.awayClubId]?.shortName ?? '???'}`
                        : `bei ${g.clubs[match.homeClubId]?.shortName ?? '???'}`}
                    </div>
                    <div className="pd-md-note">Kein Training</div>
                  </div>
                ) : (
                  <>
                    {SLOT_LABELS.map(({ key, label }) => {
                      const val = day[key] ?? '';
                      const block = val ? BLOCKS_BY_ID[val] : null;
                      return (
                        <div key={key} className={`pd-slot ${key === 'extra' ? 'is-extra' : ''}`}>
                          <label className="pd-slot-lbl">{label}{block && <span className={`int-tag int-${block.intensity}`}>{INTENSITY_LABELS[block.intensity]}</span>}</label>
                          <select className="pd-select" value={val} onChange={(e) => setSlot(idx, key, e.target.value)}>
                            <option value="">– frei –</option>
                            {TRAINING_BLOCKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>
                      );
                    })}
                    <div className="pd-fitness" style={{ color: fitDeltaColor(delta) }}>Fitness {delta > 0 ? '+' : ''}{delta}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </DashBox>

      <DashBox title="Schwerpunkte der Woche" icon="stats" right={`${units} Einheiten`}>
        {focusTop.length ? focusTop.map(([a, w]) => (
          <Meter key={a} label={ATTRIBUTE_LABELS_DE[a as keyof typeof ATTRIBUTE_LABELS_DE] ?? a} value={w} max={focusMax} text={w.toFixed(1)} />
        )) : <Empty icon="training">Keine Einheiten geplant – die Mannschaft regeneriert nur.</Empty>}
        <div className="dnote mt8">Gezieltes Training füllt verdeckte Fortschrittswerte; sichtbar wird ein Punkt erst nach einiger Zeit.</div>
      </DashBox>

      <DashBox title="Belastung" icon="dashKader">
        <div className="dkpis">
          <Kpi value={avgFri} label="Ø Frische" color={vColor(avgFri)} />
          <Kpi value={avgFit} label="Ø Fitness" color={vColor(avgFit)} />
        </div>
        <div className="dsec">Am stärksten belastet</div>
        {tired.map((p) => <PlayerRow key={p.id} p={p} value={Math.round(p.frische ?? 100)} sub={`Fitness ${Math.round(p.attributes.fitness)}`} />)}
        <div className="dnote mt8">Zwei mittlere Einheiten pro Tag halten die Fitness etwa stabil. Hohe Intensität und Extraeinheiten kosten Kraft.</div>
      </DashBox>

      <DashBox title="Trainingsblöcke" icon="contracts" right={`${TRAINING_BLOCKS.length} Blöcke`}>
        {TRAINING_BLOCKS.map((b) => (
          <div key={b.id} className="dlist-row" style={{ alignItems: 'flex-start' }}>
            <span className="grow">
              <b>{b.name}</b> <span className={`int-tag int-${b.intensity}`}>{INTENSITY_LABELS[b.intensity]}</span>
              <span className="dnote" style={{ display: 'block' }}>
                {Object.keys(b.attributes).length === 0 ? 'Nur Erholung' : Object.entries(b.attributes)
                  .sort((x, y) => (y[1] as number) - (x[1] as number))
                  .map(([attr]) => ATTRIBUTE_LABELS_DE[attr as keyof typeof ATTRIBUTE_LABELS_DE]).join(' · ')}
              </span>
            </span>
          </div>
        ))}
      </DashBox>
    </DashPage>
  );
}

/** Referenzwert für die UI-Wochenbilanz (Grund-Regeneration pro Tag). */
export const DAILY_BASE_RECOVERY_UI = 10;
