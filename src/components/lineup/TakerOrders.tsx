// =============================================================================
// Aufstellung › Kapitän & Standards (Wunsch Pascal): je Standard eine Reihenfolge statt
// eines einzelnen Schützen. Die Box zeigt je Standard die ersten Namen; ein Klick öffnet
// ein kleines Fenster mit bis zu fünf Plätzen. Spielt einer nicht oder ist ausgewechselt,
// führt der Nächste aus (engine/setPieceOrder.ts, Engine: match/setpieces.ts, sim.ts).
// =============================================================================
import { useState } from 'react';
import type { Player, Tactics, TakerKind } from '../../types';
import Select from '../../ui/Select';
import { TAKER_KINDS, TAKER_MAX, setTakerOrder, takerOrder } from '../../engine/setPieceOrder';

export function TakerGrid({ t, xi, squad, set }: { t: Tactics; xi: Player[]; squad: Player[]; set: (p: Partial<Tactics>) => void }) {
  const [open, setOpen] = useState<TakerKind | null>(null);
  const xiIds = new Set(xi.map((p) => p.id));
  const byId = new Map(squad.map((p) => [p.id, p]));
  const meta = TAKER_KINDS.find((k) => k.kind === open);
  return (
    <>
      <div className="lu-roles lu-takers">
        {TAKER_KINDS.map(({ kind, label, attr }) => {
          const order = takerOrder(t, kind).filter((id) => byId.has(id));
          const active = order.find((id) => xiIds.has(id));
          return (
            <button key={kind} type="button" className="lu-role lu-taker" data-taker={kind} onClick={() => setOpen(kind)}>
              <span>{label}</span>
              <span className="lu-taker-box">
                {order.length ? order.slice(0, 3).map((id, i) => {
                  const p = byId.get(id)!;
                  return <span key={id} className={`lu-taker-n ${id === active ? 'on' : xiIds.has(id) ? '' : 'out'}`}>{i + 1}. {p.lastName} ({Math.round(p.attributes[attr])})</span>;
                }) : <span className="lu-taker-n auto">{kind === 'captain' ? 'keiner festgelegt' : 'automatisch (Bester)'}</span>}
                {order.length > 3 && <span className="lu-taker-n more">+{order.length - 3}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {open && meta && <TakerPopup t={t} kind={open} label={meta.label} attr={meta.attr} xiIds={xiIds} squad={squad} set={set} onClose={() => setOpen(null)} />}
    </>
  );
}

function TakerPopup({ t, kind, label, attr, xiIds, squad, set, onClose }: {
  t: Tactics; kind: TakerKind; label: string; attr: (typeof TAKER_KINDS)[number]['attr']; xiIds: Set<string>; squad: Player[];
  set: (p: Partial<Tactics>) => void; onClose: () => void;
}) {
  const order = takerOrder(t, kind).filter((id) => squad.some((p) => p.id === id));
  const sorted = [...squad].sort((a, b) => Number(xiIds.has(b.id)) - Number(xiIds.has(a.id)) || b.attributes[attr] - a.attributes[attr]);
  const apply = (ids: string[]) => {
    setTakerOrder(t, kind, ids);
    set({ takers: t.takers, captainId: t.captainId, penaltyTakerId: t.penaltyTakerId, freeKickTakerId: t.freeKickTakerId, cornerTakerId: t.cornerTakerId });
  };
  const change = (i: number, id: string) => { const next = [...order]; if (id) next[i] = id; else next.splice(i, 1); apply(next); };
  const move = (i: number, d: -1 | 1) => { const next = [...order]; [next[i], next[i + d]] = [next[i + d], next[i]]; apply(next); };
  const auto = () => apply(sorted.filter((p) => xiIds.has(p.id) && p.naturalPosition !== 'TW').slice(0, 3).map((p) => p.id));
  const rows = Math.min(TAKER_MAX, order.length + 1);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal lu-takpop" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${label}: Reihenfolge`}>
        <div className="lu-saved-head">
          <h2>{label}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        <p className="lu-takpop-note">Reihenfolge: Es führt der Erste aus, der auf dem Platz steht. Fehlt er oder wird ausgewechselt, übernimmt der Nächste{kind === 'captain' ? ' die Binde' : ''}; steht keiner auf dem Platz, {kind === 'captain' ? 'trägt niemand die Binde' : 'nimmt der Beste den Ball'}.</p>
        <div className="lu-takpop-list">
          {Array.from({ length: rows }, (_, i) => {
            const id = order[i] ?? '';
            return (
              <div key={i} className="lu-takpop-row">
                <b className="lu-takpop-i">{i + 1}.</b>
                <Select value={id} data-role={`taker-${i}`} onChange={(v) => change(i, v)}>
                  <option value="">{i < order.length ? '– entfernen –' : '– hinzufügen –'}</option>
                  {sorted.filter((p) => p.id === id || !order.includes(p.id)).map((p) => (
                    <option key={p.id} value={p.id}>{p.lastName} ({Math.round(p.attributes[attr])}){xiIds.has(p.id) ? '' : ' · nicht in der Elf'}</option>
                  ))}
                </Select>
                <span className="lu-takpop-mv">
                  <button type="button" className="b3 b3-s" disabled={!id || i === 0} onClick={() => move(i, -1)} aria-label="nach oben">▲</button>
                  <button type="button" className="b3 b3-s" disabled={!id || i >= order.length - 1} onClick={() => move(i, 1)} aria-label="nach unten">▼</button>
                </span>
              </div>
            );
          })}
        </div>
        <div className="lu-takpop-foot">
          <button type="button" className="b3 b3-s" onClick={auto}>Die drei Besten der Elf</button>
          <button type="button" className="b3 b3-s" onClick={() => apply([])}>Leeren</button>
          <span className="lu-takpop-sp" />
          <button type="button" className="b3 b3-primary" onClick={onClose}>Fertig</button>
        </div>
      </div>
    </div>
  );
}
