// =============================================================================
// STADION-NEUBAU & BAUSUBSTANZ (Popover der Stadionseite, Wunsch Pascal):
// oben Baujahr, Komfort gegen Anspruch der Fans und die Bausteine des Komforts,
// darunter die Planung eines kompletten Neubaus (Plätze, Stehplätze, Dach, VIP,
// Logen) mit Kosten, Bauzeit, neuer Komfort-Obergrenze und Finanzierung.
// Rechnung: engine/stadiumStandard.ts, Ablauf: game/stadiumGame.ts.
// =============================================================================
import { useState } from 'react';
import { yearOf } from '../../../engine/economy';
import { loungesAvailable, vipAvailable } from '../../../engine/stadiumBlocks';
import { LOOKS, REBUILD_MIN, RebuildSpec, fanExpectation, lookOf, rebuildMaxLounges, stadiumComfort, standardCap } from '../../../engine/stadiumStandard';
import { rebuildPlanFor, startRebuild } from '../../../game/stadiumGame';
import type { Game } from '../../../game/state';
import type { StadiumBlock } from '../../../types';
import { fmtDM } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';

const pct = (v: number) => `${Math.round(v * 100)} %`;

export function RebuildPanel({ g, onClose, onDone, onPreview }: { g: Game; onClose: () => void; onDone: () => void; onPreview: (blocks: StadiumBlock[] | null) => void }) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const st = club.stadium;
  const c = stadiumComfort(club, year);
  const busy = !!st.blockProject || !!club.stadiumProject;
  const maxL = rebuildMaxLounges(year);
  const [open, setOpen] = useState(false);
  const [spec, setSpecRaw] = useState<RebuildSpec>(() => ({
    capacity: Math.max(REBUILD_MIN, Math.round((st.capacity + (st.blockProject?.capacityLoss ?? 0)) / 1000) * 1000),
    standing: year < 1995 ? 2 : 1, roof: year < 1990 ? 'partial' : 'full', lounges: Math.min(maxL, st.vipBoxes ?? 0), vip: vipAvailable(year),
  }));
  const [fin, setFin] = useState<'cash' | 10 | 20 | 30>(20);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { plan, cost, rate, monthly } = rebuildPlanFor(g, spec);
  const set = (patch: Partial<RebuildSpec>) => {
    const next = { ...spec, ...patch };
    setSpecRaw(next); setConfirm(false); setMsg(null);
    if (open) onPreview(rebuildPlanFor(g, next).plan.blocks);
  };
  const toggle = () => { const o = !open; setOpen(o); setConfirm(false); onPreview(o ? plan.blocks : null); };
  const canCash = club.finances.balance >= cost;
  const f = fin === 'cash' && !canCash ? 20 : fin;
  const go = () => {
    if (!confirm) { setConfirm(true); return; }
    const r = startRebuild(g, spec, f === 'cash' ? 'cash' : 'loan', f === 'cash' ? 0 : f);
    setMsg(r.text); setConfirm(false);
    if (r.ok) { onPreview(null); onDone(); }
  };
  const look = LOOKS[lookOf(year)];

  return (
    <div className="bc">
      <header className="bc-head">
        <div className="bc-title">
          <b>Bausubstanz</b>
          <span>{c ? `Baujahr ${c.built} · Komfort-Obergrenze ${Math.round(c.cap)}` : 'Baujahr unbekannt'}</span>
        </div>
        <button className="bc-x" onClick={onClose} aria-label="Schließen">×</button>
      </header>

      <div className="bc-scroll">
        {c && (
          <section className="bc-sec">
            <div className="bc-sec-h"><span>Komfort gegen Anspruch<InfoTip k="stadionKomfort" /></span></div>
            <div className="rb-scale" aria-label={`Komfort ${Math.round(c.comfort)}, Anspruch ${Math.round(c.expect)}, Obergrenze ${Math.round(c.cap)}`}>
              <i className="rb-scale-cap" style={{ width: `${Math.min(100, c.cap)}%` }} />
              <i className={`rb-scale-now ${c.comfort < c.expect ? 'low' : ''}`} style={{ width: `${Math.min(100, c.comfort)}%` }} />
              <em className="rb-scale-exp" style={{ left: `${Math.min(100, c.expect)}%` }} />
            </div>
            <div className="bc-kpis">
              <div><span>Komfort</span><b className={c.comfort < c.expect - 1 ? 'neg' : c.comfort > c.expect + 1 ? 'pos' : ''}>{Math.round(c.comfort)}</b><small>höchstens {Math.round(c.cap)}</small></div>
              <div><span>Anspruch</span><b>{Math.round(c.expect)}</b><small>in 10 Jahren {Math.round(fanExpectation(year + 10))}</small></div>
              <div><span>Zuschauer</span><b className={c.factor < 0.995 ? 'neg' : c.factor > 1.005 ? 'pos' : ''}>{c.factor >= 1 ? '+' : '−'}{Math.abs(Math.round((c.factor - 1) * 100))} %</b><small>durch den Komfort</small></div>
            </div>
            {c.parts.map((p) => (
              <div key={p.key} className="rb-part">
                <span>{p.name}</span>
                <i><em style={{ width: `${Math.round(p.value * 100)}%` }} /></i>
                <b>{pct(p.value)}</b>
              </div>
            ))}
            <div className="bc-note">Die Ausstattung hebt den Komfort bis zur Obergrenze der Bausubstanz. Die Obergrenze selbst steigt nur durch einen Neubau – heute gebaut läge sie bei {Math.round(standardCap(year + 2))}.</div>
          </section>
        )}

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Neubau<InfoTip k="stadionNeubau" /></span>
            <span className="bc-sec-acts"><button className="bc-mini" onClick={toggle}>{open ? 'Planung schließen' : 'Neubau planen'}</button></span>
          </div>
          {!open && <div className="bc-note">Ein komplett neues Stadion in der Bauweise „{look.name}“ ({look.text}). Es hebt die Komfort-Obergrenze, erlaubt mehr Logen und setzt das Baujahr neu.</div>}
          {open && <>
            <div className="bc-tier">
              <div className="bc-tier-top"><span className="bc-tier-name">Plätze</span><span className="bc-tier-cap">{plan.capacity.toLocaleString('de-DE')}<small> Plätze</small></span></div>
              <div className="bc-range"><span>Größe</span>
                <input type="range" min={REBUILD_MIN} max={90000} step={1000} value={spec.capacity} onChange={(e) => set({ capacity: Number(e.target.value) })} aria-label="Plätze" />
                <b>{Math.round(spec.capacity / 1000)}</b>
              </div>
            </div>
            <div className="bc-opt"><span><b>Stehplätze</b><small>hinter den Toren im Unterrang</small></span>
              <span className="bc-chips">
                {([[0, 'keine'], [1, 'eine Seite'], [2, 'beide']] as [0 | 1 | 2, string][]).map(([v, n]) => <button key={v} className={spec.standing === v ? 'on' : ''} onClick={() => set({ standing: v })}>{n}</button>)}
              </span>
            </div>
            <div className="bc-opt"><span><b>Dach</b><small>volles Dach schließt auch die Kurven</small></span>
              <span className="bc-chips">
                {([['partial', 'Teildach'], ['full', 'voll']] as ['partial' | 'full', string][]).map(([v, n]) => <button key={v} className={spec.roof === v ? 'on' : ''} onClick={() => set({ roof: v })}>{n}</button>)}
              </span>
            </div>
            <label className={`bc-opt ${!vipAvailable(year) ? 'off' : ''}`}>
              <span><b>VIP-Bereich</b><small>{vipAvailable(year) ? 'auf der Haupttribüne' : 'ab 1980'}</small></span>
              <button className={`toggle ${spec.vip ? 'on' : ''}`} disabled={!vipAvailable(year)} onClick={() => set({ vip: !spec.vip })} aria-label="VIP-Bereich" />
            </label>
            <div className={`bc-opt ${!loungesAvailable(year) ? 'off' : ''}`}>
              <span><b>Logen</b><small>{loungesAvailable(year) ? `höchstens ${maxL}` : 'ab 1985'}</small></span>
              <span className="bc-step">
                <button disabled={spec.lounges <= 0} onClick={() => set({ lounges: spec.lounges - 1 })} aria-label="Weniger Logen">−</button>
                <b>{spec.lounges}</b>
                <button disabled={spec.lounges >= maxL} onClick={() => set({ lounges: spec.lounges + 1 })} aria-label="Mehr Logen">+</button>
              </span>
            </div>
            {plan.errors.map((e) => <div key={e} className="bc-note neg">{e}</div>)}
            {busy && <div className="bc-note">Im Stadion wird gerade gebaut – den Neubau kannst du danach beauftragen.</div>}
          </>}
        </section>
      </div>

      <footer className="bc-foot">
        {!open ? <div className="bc-idle">Plane einen Neubau, um Kosten, Bauzeit und die neue Komfort-Obergrenze zu sehen.</div> : <>
          <div className="bc-kpis">
            <div><span>Kosten</span><b className="rb-cost">{fmtDM(cost)}</b><small>Zins {(rate * 100).toFixed(1).replace('.', ',')} %</small></div>
            <div><span>Bauzeit</span><b>{plan.months} Mon.</b><small>solange {Math.round(plan.capWhile / 100) / 10} Tsd. Plätze</small></div>
            <div><span>Obergrenze</span><b className="pos">{Math.round(plan.newCap)}</b><small>{c ? `bisher ${Math.round(c.cap)}` : 'Komfort'}</small></div>
          </div>
          {!plan.errors.length && !busy && <>
            <div className="bc-fin rb-fin" role="radiogroup" aria-label="Finanzierung">
              <button className={f === 'cash' ? 'on' : ''} disabled={!canCash} onClick={() => { setConfirm(false); setFin('cash'); }}><b>Bar</b><small>{canCash ? 'Kontostand' : 'reicht nicht'}</small></button>
              {([10, 20, 30] as const).map((y) => (
                <button key={y} className={f === y ? 'on' : ''} onClick={() => { setConfirm(false); setFin(y); }}><b>{y} Jahre</b><small>{fmtDM(monthly(y))}/Mon.</small></button>
              ))}
            </div>
            <div className="bc-go">
              <button className="bc-reset" onClick={toggle}>Verwerfen</button>
              <button className={`b3 b3-primary bc-build ${confirm ? 'on' : ''}`} onClick={go}>{confirm ? 'Ja, Neubau beauftragen' : 'Neubau beauftragen'}</button>
            </div>
          </>}
        </>}
        {msg && <div className="bc-note acc">{msg}</div>}
      </footer>
    </div>
  );
}
