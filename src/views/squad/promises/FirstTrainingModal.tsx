// =============================================================================
// ERSTES TRAINING — Popup am ersten Trainingstag der Saison (Vorbild EA FM, moderner)
// Links: Szene + Einleitung je Epoche, die einflussreichsten Spieler mit ihrer
// Reaktion (live je Auswahl); rechts: Versprechen in drei Kategorien.
// Logik game/seasonPromisesGame.ts, Katalog/Reaktion engine/seasonPromises.ts,
// CSS 28-promises.css (.ft-*). Öffnet über game.seasonPromises.pending (GameShell)
// oder Kader › Kabine › Versprechen.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import { MoraleIcon } from '../../../components/status';
import { MAX_SEASON_PROMISES, SP_CATS, SP_CAT_LABEL, reactionMood, reactionScale, type SeasonPromiseId } from '../../../engine/seasonPromises';
import { yearOf } from '../../../engine/economy';
import { giveSeasonPromises, listeners, makeBase, promiseOptions, reactionFor } from '../../../game/seasonPromisesGame';
import { trustOf } from '../../../game/promises';
import type { Game } from '../../../game/state';
import { InfoTip } from '../../../ui/InfoTip';
import { condColor } from '../../../ui/format';
import { ListenerCard, PromiseCard, TrainingScene, eraIntro } from './PromiseParts';

export function FirstTrainingModal({ g, onClose }: { g: Game; onClose: () => void }) {
  const club = g.clubs[g.managedClubId];
  const base = useMemo(() => makeBase(g), [g]);
  const opts = useMemo(() => promiseOptions(g, base), [g, base]);
  const all = useMemo(() => listeners(g), [g]);
  const shown = all.slice(0, 8);
  const [picks, setPicks] = useState<SeasonPromiseId[]>([]);
  const year = yearOf(g.calendar.currentDate);
  const trust = trustOf(g);

  const reacts = useMemo(() => new Map(all.map((l) => [l.p.id, reactionFor(g, l, picks, base)])), [g, all, picks, base]);
  const avg = useMemo(() => {
    let s = 0, w = 0;
    for (const l of all) { const k = 0.5 + l.influence / 100; s += (reacts.get(l.p.id)?.total ?? 0) * k; w += k; }
    return w ? s / w : 0;
  }, [all, reacts]);

  const finish = (ids: SeasonPromiseId[]) => { giveSeasonPromises(g, ids); onClose(); };
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); finish([]); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const toggle = (id: SeasonPromiseId) => setPicks((ps) => ps.includes(id) ? ps.filter((x) => x !== id) : ps.length >= MAX_SEASON_PROMISES ? ps : [...ps, id]);
  const full = picks.length >= MAX_SEASON_PROMISES;

  return (
    <div className="modal-overlay ft-overlay">
      <div className="modal modal-xl ft-modal" role="dialog" aria-label="Erstes Training">
        <div className="mx-head ft-head">
          <div className="ft-head-crest"><ClubCrest club={club} size={44} /></div>
          <div>
            <div className="mx-sub">Saison {g.season} · {g.manager?.name ?? 'Trainer'}</div>
            <h2>Erstes Training<InfoTip k="promises_first" /></h2>
          </div>
          <button className="modal-close" onClick={() => finish([])} aria-label="Ohne Versprechen schließen">×</button>
        </div>
        <div className="mx-body ft-body">
          <section className="ft-left">
            <div className="ft-intro">
              <TrainingScene year={year} />
              <p>{eraIntro(year)}</p>
            </div>
            <div className="ft-sec">Die Mannschaft hört zu<InfoTip k="promises_reaction" /></div>
            <div className="ft-faces">
              {shown.map((l, i) => <ListenerCard key={l.p.id} l={l} r={reacts.get(l.p.id)!} picks={picks.length} club={club} k={i} />)}
            </div>
            <div className="ft-summary">
              <div className="ft-sum-item">
                <span className="ft-sum-label">Stimmung im Kreis</span>
                <span className="ft-sum-val">{picks.length ? <><MoraleIcon value={reactionScale(avg)} size={20} />{reactionMood(avg)}</> : 'wartet ab'}</span>
              </div>
              <div className="ft-sum-item">
                <span className="ft-sum-label">Deine Glaubwürdigkeit<InfoTip k="promise_trust" /></span>
                <span className="ft-sum-val"><span className="ft-trust"><i style={{ width: `${trust}%`, background: condColor(trust) }} /></span>{trust}</span>
              </div>
            </div>
          </section>
          <section className="ft-right">
            {SP_CATS.map((cat) => (
              <div key={cat} className="ft-col">
                <div className="ft-sec">{SP_CAT_LABEL[cat]}</div>
                {opts.filter((o) => o.def.cat === cat).map((o) => (
                  <PromiseCard key={o.def.id} def={o.def} on={picks.includes(o.def.id)} why={o.why} realism={o.realism} disabled={full} onToggle={() => toggle(o.def.id)} />
                ))}
              </div>
            ))}
          </section>
        </div>
        <div className="mx-foot ft-foot">
          <span className="ft-count"><b>{picks.length}</b> / {MAX_SEASON_PROMISES} Versprechen</span>
          <span className="ft-foot-note">Geprüft wird über die Saison und am Saisonende. Gehalten stärkt deine Glaubwürdigkeit, gebrochen kostet Moral, Vertrauen – und bei Saisonzielen auch Vorstand und Fans.</span>
          <button className="btn btn-ghost" onClick={() => finish([])}>Ohne Versprechen</button>
          <button className="btn btn-primary ft-go" disabled={!picks.length} onClick={() => finish(picks)}>Ansprache halten</button>
        </div>
      </div>
    </div>
  );
}
