// =============================================================================
// Sponsoring 2.0 — Verhandlung eines Angebots (Gegenangebot, Klauseln streichen).
// Logik: engine/sponsorship.ts counterOffer, Ablauf game/sponsorGame.ts.
// =============================================================================
import { useState } from 'react';
import { SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { clauseFixed, clauseLabel, clausePremium, clauseTone } from '../../../engine/sponsorship';
import { yearOf } from '../../../engine/economy';
import { counterSponsorOffer, signSponsorOffer } from '../../../game/sponsorGame';
import { Game } from '../../../game/state';
import { DashBox, KV, Kpi } from '../../../ui/DashPage';
import { fmtDM } from '../../../ui/format';
import { bonusText, partnerMeta, slotName, yearly } from './parts';

export function NegotiateModal({ g, offerId, onClose, onChange }: { g: Game; offerId: string; onClose: () => void; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const o = club.commerce?.dealOffers?.find((x) => x.id === offerId);
  const [factor, setFactor] = useState(1.1);
  const [years, setYears] = useState(o?.years ?? 3);
  const [drop, setDrop] = useState<number[]>([]);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!o) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ padding: 28 }}>
          <p>{reply ?? 'Das Angebot liegt nicht mehr vor.'}</p>
          <button className="btn btn-primary" onClick={onClose}>Schließen</button>
        </div>
      </div>
    );
  }
  const def = SLOT_BY_ID[o.slot];
  const dropCost = drop.reduce((a, i) => a + clausePremium(o.clauses[i]), 0);
  const ask = Math.round(o.annualValue * factor * (1 - dropCost) / 500) * 500;
  const toggle = (i: number) => setDrop((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const send = () => {
    const r = counterSponsorOffer(g, o.id, { annualValue: ask, years, drop });
    setReply(r?.text ?? null); setDrop([]); setFactor(1.05);
    onChange();
  };
  const signNow = () => {
    const err = signSponsorOffer(g, o.id);
    if (err) { setError(err); return; }
    onChange(); onClose();
  };
  const mood = o.interest >= 0.7 ? 'sehr interessiert' : o.interest >= 0.5 ? 'interessiert' : 'zurückhaltend';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head">
          <div>
            <div className="mx-sub">{o.renewal ? 'Verlängerung' : 'Sponsor-Angebot'} · {slotName(o)}</div>
            <h2>{o.partner}</h2>
            <div className="sp-meta">{partnerMeta(o)}</div>
          </div>
          <div className="mx-kpis">
            <Kpi value={fmtDM(yearly(o.annualValue, year))} label="pro Jahr" />
            <Kpi value={`${o.years} J.`} label="Laufzeit" />
            <Kpi value={mood} label="Sponsor" color={o.interest >= 0.5 ? 'var(--text)' : 'var(--text-2)'} />
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mx-body mx-grid">
          <DashBox title="Angebot" icon="contracts" rows={2}>
            <KV k="Werbefläche" v={def.name} />
            <KV k="Jahreswert" v={fmtDM(yearly(o.annualValue, year))} strong />
            <KV k="Laufzeit" v={`${o.years} Saisons`} />
            <KV k="Gültig bis" v={o.until.split('-').reverse().join('.')} />
            {bonusText(o.bonuses, year) && <KV k="Erfolgsprämien" v={bonusText(o.bonuses, year)} />}
            <div className="dsec">Klauseln</div>
            {o.clauses.length ? o.clauses.map((k, i) => (
              <div key={i} className="sp-crow">
                <span className={`sp-clause ${clauseTone(k)}`}>{clauseLabel(k)}</span>
                {clauseFixed(k)
                  ? <span className="dnote">fest</span>
                  : <button className={`dchip ${drop.includes(i) ? 'on' : ''}`} onClick={() => toggle(i)}>
                    {drop.includes(i) ? 'gestrichen' : 'streichen'}{clausePremium(k) ? ` (${clausePremium(k) > 0 ? '−' : '+'}${Math.round(Math.abs(clausePremium(k)) * 100)} %)` : ''}
                  </button>}
              </div>
            )) : <div className="dnote">Keine besonderen Klauseln.</div>}
            <div className="dnote mt8">{def.desc}</div>
          </DashBox>
          <DashBox title="Gegenangebot" icon="negotiations" span={2}>
            <div className="talk-form">
              <label className="talk-row"><span>Jahreswert</span>
                <input type="range" min={1} max={1.5} step={0.01} value={factor} onChange={(e) => setFactor(Number(e.target.value))} />
                <b className="accent-text">{fmtDM(yearly(ask, year))}</b></label>
              <div className="talk-row"><span>Laufzeit</span><div className="dchips">
                {Array.from({ length: def.years[1] - def.years[0] + 1 }, (_, i) => def.years[0] + i).map((y) => (
                  <button key={y} className={`dchip ${years === y ? 'on' : ''}`} onClick={() => setYears(y)}>{y} J.</button>))}
              </div></div>
              <div className="dnote">Gestrichene Klauseln kosten Geld: Der Sponsor rechnet den Wert der Klausel heraus. Längere Laufzeiten nimmt er gern (+2 % je Jahr Spielraum). Nach zwei Runden ist Schluss.</div>
              <div className="dbtnrow">
                <button className="btn btn-primary" disabled={o.rounds >= 2} onClick={send}>Gegenangebot senden</button>
                <button className="btn" onClick={signNow}>Zu diesen Bedingungen unterschreiben</button>
              </div>
            </div>
          </DashBox>
          <DashBox title="Antwort" icon="news" span={2}>
            {error && <div className="sp-warn">{error}</div>}
            {reply || o.reply ? <div className="sp-reply">„{reply ?? o.reply}“</div> : <div className="dnote">Noch kein Gegenangebot. Runde {o.rounds} von 2.</div>}
            {o.rounds > 0 && <KV k="Aktuelle Konditionen" v={`${fmtDM(yearly(o.annualValue, year))} · ${o.years} J.`} strong />}
          </DashBox>
        </div>
      </div>
    </div>
  );
}
