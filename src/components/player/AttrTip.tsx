// i-Hilfe hinter einem Attribut: was es beschreibt, wo es im Spiel direkt zählt
// (data/attributeInfo.ts), für welche Positionen es in die Positionsstärke eingeht
// (live aus engine/positions.ts `weightsFor`, epochenabhängig) und welche
// Trainingsbausteine es verbessern (engine/weeklyTraining.ts, nach Freischaltjahr).
import type { Position } from '../../types';
import { ATTR_INFO, ATTR_NO_EFFECT, ATTR_PHYSICAL, type AttrInfoKey } from '../../data/attributeInfo';
import { getEraYear, POSITION_WEIGHTS } from '../../engine/positions';
import { TRAINING_BLOCKS, blockAvailable } from '../../engine/weeklyTraining';
import { InfoTip } from '../../ui/InfoTip';
import { ATTR_DE, attrTiers } from './shared';

function positionsFor(k: AttrInfoKey): { key: Position[]; use: Position[] } {
  const key: Position[] = [], use: Position[] = [];
  for (const pos of Object.keys(POSITION_WEIGHTS) as Position[]) {
    const t = attrTiers(pos).get(k);
    if (t === 'core') key.push(pos); else if (t === 'use') use.push(pos);
  }
  return { key, use };
}

function trainingFor(k: AttrInfoKey): string[] {
  const year = getEraYear();
  return TRAINING_BLOCKS
    .filter((b) => blockAvailable(b, year) && ((b.attributes as Partial<Record<AttrInfoKey, number>>)[k] ?? 0) >= 0.3)
    .map((b) => b.name);
}

export function AttrBody({ k }: { k: AttrInfoKey }) {
  const info = ATTR_INFO[k];
  const { key, use } = positionsFor(k);
  const train = trainingFor(k);
  const none = ATTR_NO_EFFECT.includes(k);
  return (
    <div className="attr-tip">
      <div>{info.text}</div>
      {none && <div className="attr-tip-none">Hat derzeit keine Wirkung im Spiel.</div>}
      {info.uses.length > 0 && <>
        <div className="attr-tip-h">Im Spiel</div>
        <ul>{info.uses.map((u) => <li key={u}>{u}</li>)}</ul>
      </>}
      {(key.length > 0 || use.length > 0) && <>
        <div className="attr-tip-h">Positionsstärke</div>
        <div>
          {key.length > 0 && <>Schlüssel für <b>{key.join(', ')}</b>{use.length > 0 ? '; ' : ''}</>}
          {use.length > 0 && <>wichtig für {use.join(', ')}</>}
        </div>
      </>}
      {!none && info.uses.length === 0 && key.length === 0 && use.length === 0 && <div className="attr-tip-none">Wirkt in dieser Epoche nur über das Training anderer Werte.</div>}
      {train.length > 0 && <>
        <div className="attr-tip-h">Training</div>
        <div>{train.join(', ')}</div>
      </>}
      {ATTR_PHYSICAL.includes(k) && <div className="attr-tip-note">Körperlicher Wert: lässt im Alter als Erstes nach.</div>}
    </div>
  );
}

/** Dezentes „i“ hinter dem Attributnamen. */
export function AttrTip({ k }: { k: AttrInfoKey }) {
  return <InfoTip className="itip-attr" title={ATTR_DE[k]} text={<AttrBody k={k} />} />;
}
