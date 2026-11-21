// Kader › Kabine › Reiter „Versprechen“: Stand der Versprechen vom ersten Training,
// Glaubwürdigkeit, Vorjahre; vor dem ersten Ligaspiel ohne Ansprache → Knopf öffnet das Popup.
import { useState } from 'react';
import { promiseStatus, spRecord, spState } from '../../../game/seasonPromisesGame';
import { trustOf } from '../../../game/promises';
import type { Game } from '../../../game/state';
import { fmtDay } from '../../../ui/format';
import { FirstTrainingModal } from './FirstTrainingModal';
import { PromiseLine } from './PromiseParts';

export function PromisesTab({ g, onChange }: { g: Game; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const rec = spRecord(g);
  const me = g.managedClubId;
  const played = g.fixtures.some((m) => m.result && (m.homeClubId === me || m.awayClubId === me));
  const past = (spState(g)?.seasons ?? []).filter((s) => s.season !== g.season && s.picks.length).slice(-3).reverse();
  return (
    <>
      <div className="dnote">Glaubwürdigkeit {trustOf(g)} – gilt für Versprechen beim ersten Training und bei Transfers.</div>
      {rec ? (rec.picks.length ? <>
        <div className="dsec">Saison {rec.season} · versprochen am {fmtDay(rec.date)}</div>
        {rec.picks.map((p) => <PromiseLine key={p.id} pick={p} st={promiseStatus(g, rec, p)} />)}
      </> : <div className="dnote">Beim ersten Training dieser Saison hast du nichts versprochen.</div>)
        : !played ? <>
          <div className="dnote">Das erste Training steht an – du hast der Mannschaft noch nichts mit auf den Weg gegeben.</div>
          <button className="btn btn-sm btn-primary mt8" onClick={() => setOpen(true)}>Ansprache zum ersten Training</button>
        </> : <div className="dnote">Versprechen gibst du beim ersten Training jeder Saison ab.</div>}
      {past.map((s) => (
        <div key={s.season}>
          <div className="dsec">Saison {s.season}: {s.picks.filter((p) => p.r === 'kept').length} gehalten, {s.picks.filter((p) => p.r === 'broken').length} gebrochen</div>
          {s.picks.map((p) => <PromiseLine key={p.id} pick={p} st={promiseStatus(g, s, p)} />)}
        </div>
      ))}
      {open && <FirstTrainingModal g={g} onClose={() => { setOpen(false); onChange(); }} />}
    </>
  );
}
