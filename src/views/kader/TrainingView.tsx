import Icon from '../../components/Icon';
import { BLOCKS_BY_ID, INTENSITY_LABELS, TRAINING_BLOCKS, dayLoad, expectedFitnessDelta } from '../../engine/weeklyTraining';
import { Game } from '../../game/state';
import { ATTRIBUTE_LABELS_DE, DaySlots, Match } from '../../types';
import { PageHead } from '../../ui/PageHead';
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

  return (
    <div className="page">
      <PageHead icon="training" title="Wochen-Trainingsplaner" />
      <div className="dim2 mini" style={{ marginBottom: 12 }}>
        Lege für jeden Tag bis zu drei Einheiten fest. An Spieltagen wird nicht trainiert.
        Zwei mittlere Einheiten pro Tag ≈ leichte Regeneration — hohe Intensität und Extraeinheiten kosten Fitness.
        Gezieltes Training lässt die Werte langfristig steigen (in kleinen, zunächst unsichtbaren Schritten).
      </div>

      {/* Wochenbilanz */}
      <div className="week-summary">
        <div className="ws-item">
          <span className="dim mini">Trainingstage</span>
          <b>{trainDays}</b>
        </div>
        <div className="ws-item">
          <span className="dim mini">Spieltage</span>
          <b>{Object.keys(matchByIdx).length}</b>
        </div>
        <div className="ws-item">
          <span className="dim mini">Ø Fitness/Tag</span>
          <b style={{ color: fitDeltaColor(avgDelta) }}>{avgDelta > 0 ? '+' : ''}{avgDelta}</b>
        </div>
      </div>

      {/* Planer-Raster */}
      <div className="planner-grid">
        {plan.days.map((day, idx) => {
          const match = matchByIdx[idx];
          const delta = expectedFitnessDelta(day);
          return (
            <div key={idx} className={`planner-day ${match ? 'is-matchday' : ''} ${idx === todayIdx ? 'is-today' : ''}`}>
              <div className="pd-head">
                <span className="pd-name">{DAY_NAMES_SHORT[idx]}<span className="pd-full"> · {DAY_NAMES_LONG[idx]}</span></span>
                {idx === todayIdx && <span className="pd-today-badge">heute</span>}
              </div>
              {match ? (
                <div className="pd-matchday">
                  <div className="pd-md-ico"><Icon name="matchball" /></div>
                  <div className="pd-md-txt">Spieltag {match.matchday}</div>
                  <div className="pd-md-sub">
                    {match.homeClubId === club.id
                      ? `vs. ${g.clubs[match.awayClubId]?.shortName ?? g.clubs[match.awayClubId]?.name ?? '???'}`
                      : `@ ${g.clubs[match.homeClubId]?.shortName ?? g.clubs[match.homeClubId]?.name ?? '???'}`}
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
                        <label className="pd-slot-lbl">{key === 'extra' ? '＋ ' : ''}{label}</label>
                        <select
                          className="pd-select"
                          value={val}
                          onChange={(e) => setSlot(idx, key, e.target.value)}
                        >
                          <option value="">— frei —</option>
                          {TRAINING_BLOCKS.map((b) => (
                            <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                          ))}
                        </select>
                        {block && (
                          <div className="pd-block-meta">
                            <span className={`int-tag int-${block.intensity}`}>{INTENSITY_LABELS[block.intensity]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="pd-fitness" style={{ color: fitDeltaColor(delta) }}>
                    Fitness: {delta > 0 ? '+' : ''}{delta}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Trainingsblock-Legende */}
      <div className="section-title" style={{ marginTop: 22 }}>Trainingsblöcke</div>
      <div className="block-legend">
        {TRAINING_BLOCKS.map((b) => (
          <div key={b.id} className="block-card">
            <div className="bc-head">
              <span className="bc-ico">{b.icon}</span>
              <span className="bc-name">{b.name}</span>
              <span className={`int-tag int-${b.intensity}`}>{INTENSITY_LABELS[b.intensity]}</span>
            </div>
            <div className="bc-desc">{b.description}</div>
            <div className="bc-attrs">
              {Object.keys(b.attributes).length === 0
                ? <span className="bc-attr rec">Nur Erholung</span>
                : Object.entries(b.attributes)
                    .sort((a, c) => (c[1] as number) - (a[1] as number))
                    .map(([attr, w]) => (
                      <span key={attr} className={`bc-attr ${(w as number) >= 0.8 ? 'primary' : ''}`}>
                        {ATTRIBUTE_LABELS_DE[attr as keyof typeof ATTRIBUTE_LABELS_DE]}
                      </span>
                    ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Referenzwert für die UI-Wochenbilanz (Grund-Regeneration pro Tag). */
export const DAILY_BASE_RECOVERY_UI = 10;
