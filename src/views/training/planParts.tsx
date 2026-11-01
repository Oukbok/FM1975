import Icon from '../../components/Icon';
import { INTENSITY_LABELS } from '../../engine/weeklyTraining';
import { CellLock, OwnFixture } from '../../engine/trainingPlan';
import { TrainingBlock } from '../../types';
import type { PointerEvent as RPE } from 'react';

// =============================================================================
// Bausteine des Trainingsplans: Kachel in der Leiste, Feld im Wochenraster.
// =============================================================================

/** Kurznamen für die Bausteinleiste. */
export const BLOCK_SHORT: Record<string, string> = {
  ausdauerlauf: 'Ausdauer', kondition: 'Kondition', sprinttraining: 'Sprint', beweglichkeit: 'Koordination',
  krafttraining: 'Kraft', technik: 'Technik', dribbling: 'Dribbling', passspiel: 'Passspiel', flanken: 'Flanken',
  torschuss: 'Torschuss', kopfball: 'Kopfball', verteidigung: 'Zweikampf', taktik: 'Taktik', spielform: 'Spielform',
  torwart: 'Torwart', standards: 'Standards', mental: 'Mental', regeneration: 'Regeneration', pressing: 'Pressing',
  videoanalyse: 'Video', athletik: 'Athletik',
};

const INT_TICKS: Record<TrainingBlock['intensity'], number> = { low: 1, medium: 2, high: 3 };

export function IntensityTicks({ b }: { b: TrainingBlock }) {
  const n = b.load < 0 ? 0 : INT_TICKS[b.intensity];
  return (
    <span className="tp-ticks" title={b.load < 0 ? 'erholend' : `Intensität ${INTENSITY_LABELS[b.intensity]}`}>
      {[1, 2, 3].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}
    </span>
  );
}

/** Kachel in der Bausteinleiste (ziehen oder anklicken). */
export function PaletteTile({ b, selected, onDown }: { b: TrainingBlock | null; selected: boolean; onDown: (e: RPE) => void }) {
  return (
    <button type="button" className={`tp-tile ${selected ? 'sel' : ''} ${b ? '' : 'free'}`} onPointerDown={onDown}
      title={b ? `${b.name} – ${b.description} (Belastung ${b.load})` : 'Frei – Feld leeren'} data-drop="palette">
      <Icon name={b ? b.icon : 'trFree'} size={30} />
      <span className="tp-tile-lbl">{b ? BLOCK_SHORT[b.id] ?? b.name : 'Frei'}</span>
    </button>
  );
}

const LOCK_INFO: Record<Exclude<CellLock, null>, { icon: string; label: string }> = {
  match: { icon: 'matchball', label: 'Spiel' },
  regen: { icon: 'trRecovery', label: 'Auslaufen' },
  travel: { icon: 'transit', label: 'Anreise' },
};

/** Ein Feld im Wochenraster. */
export function PlanCell({ day, slot, label, block, lock, fixture, hover, dragging, onDown, onClick, onClear }: {
  day: number; slot: string; label: string; block: TrainingBlock | null; lock: CellLock; fixture?: OwnFixture;
  hover: boolean; dragging: boolean; onDown: (e: RPE) => void; onClick: () => void; onClear: () => void;
}) {
  if (lock) {
    const li = LOCK_INFO[lock];
    return (
      <div className={`tp-cell locked lock-${lock}`} title={lock === 'match' ? `${fixture?.comp ?? 'Spiel'} – kein Training` : lock === 'regen' ? 'Tag nach dem Spiel: Auslaufen ist fest eingeplant' : 'Abend vor dem Auswärtsspiel: Anreise'}>
        <span className="tp-cell-slot">{label}</span>
        <Icon name={li.icon} size={26} />
        <span className="tp-cell-name">{li.label}</span>
      </div>
    );
  }
  return (
    <div className={`tp-cell ${block ? 'filled' : 'empty'} ${hover ? 'hover' : ''} ${dragging ? 'dragging' : ''}`}
      data-day={day} data-slot={slot} onPointerDown={block ? onDown : undefined} onClick={onClick}
      onDoubleClick={onClear} title={block ? `${block.name} – Doppelklick leert das Feld` : 'Baustein hierher ziehen'}>
      <span className="tp-cell-slot">{label}</span>
      {block ? (
        <>
          <Icon name={block.icon} size={26} />
          <span className="tp-cell-name">{BLOCK_SHORT[block.id] ?? block.name}</span>
          <IntensityTicks b={block} />
        </>
      ) : <span className="tp-cell-free">frei</span>}
    </div>
  );
}
