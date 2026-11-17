// =============================================================================
// TRANSFERS › VERHANDLUNGEN: Abschnitt „Angebote für deine Spieler“ (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Offene Kaufangebote und Leihanfragen anderer Vereine mit Frist und Antwort-
// knöpfen: Annehmen, Gegenangebot (+10/+25/+50 %), Ablehnen bzw. die Wahl der
// Leihanfrage. Daten/Antwort über game/incomingOffers.ts (dieselbe Auflösung wie
// in der Nachricht im Newscenter). Nach der Antwort bleibt das Ergebnis stehen,
// bis die Seite verlassen wird.
// =============================================================================
import { useState } from 'react';
import FaceThumb from '../../components/FaceThumb';
import PosBadge from '../../components/PosBadge';
import { ClubLink } from '../../components/club/ClubLink';
import { CalendarEngine } from '../../engine/calendar';
import { answerIncoming, COUNTER_STEPS, type IncomingOffer } from '../../game/incomingOffers';
import type { Game } from '../../game/state';
import { fmtPrice } from '../../ui/format';

export interface OfferAnswer { id: string; text: string }

/** Ergebnisse der Antworten (bleiben stehen, auch wenn kein Angebot mehr offen ist). */
export function useOfferAnswers() {
  return useState<OfferAnswer[]>([]);
}

export function IncomingOffersList({ g, offers, done, setDone, onChange }: {
  g: Game; offers: IncomingOffer[]; done: OfferAnswer[]; setDone: (f: (d: OfferAnswer[]) => OfferAnswer[]) => void; onChange: () => void;
}) {
  const today = g.calendar.currentDate;
  const answer = (o: IncomingOffer, choice: string) => {
    const text = answerIncoming(g, o.msg, choice);
    setDone((d) => [{ id: o.msg.id, text }, ...d]);
    onChange();
  };
  return (
    <div className="ioff">
      {done.map((d) => <div key={d.id} className="ioff-done">{d.text}</div>)}
      {offers.map((o) => {
        const p = o.player;
        const days = Math.round((Date.parse(o.deadline + 'T00:00:00Z') - Date.parse(today.slice(0, 10) + 'T00:00:00Z')) / 86_400_000);
        const soon = o.deadline <= CalendarEngine.addDays(today, 1);
        return (
          <div key={o.msg.id} className="ioff-row" data-pid={p?.id}>
            <div className="ioff-who">
              {p && <FaceThumb p={p} club={g.clubs[p.clubId]} size={34} />}
              <div className="ioff-name">
                <b>{p?.fullName ?? 'Spieler'}</b>
                <span className="ioff-sub">{p && <PosBadge p={p} compact />}{p ? `${p.age} J. · Stärke ${p.overall} · Marktwert ${fmtPrice(p.contract.transferValue)}` : ''}</span>
              </div>
            </div>
            <div className="ioff-deal">
              <span className="ioff-club">{o.clubId ? <ClubLink id={o.clubId}>{o.clubName}</ClubLink> : o.clubName}</span>
              <span className="ioff-what">
                {o.kind === 'sale' ? <>bietet <b>{fmtPrice(o.fee)}</b></> : <>möchte ihn ausleihen{o.terms ? <> · bis {CalendarEngine.formatDate(o.terms.until)} · <b>{Math.round(o.terms.share * 100)} % Gehalt</b>{o.terms.fee ? <> · {fmtPrice(o.terms.fee)} Gebühr</> : null}{o.terms.optionFee ? <> · Kaufoption {fmtPrice(o.terms.optionFee)}</> : null}{o.terms.obligation ? <> · Kaufpflicht {fmtPrice(o.terms.obligation.fee)}</> : null}{o.terms.minApps ? <> · {o.terms.minApps} Einsätze garantiert</> : null}</> : null}</>}
                {o.kind === 'sale' && <span className={o.wish ? 'ioff-wish' : 'muted'}> · {o.wish ? 'er will wechseln' : 'er drängt nicht weg'}</span>}
              </span>
              <span className={`ioff-due ${soon ? 'soon' : ''}`}>Frist {CalendarEngine.formatDate(o.deadline)}{days >= 0 ? ` · noch ${days} ${days === 1 ? 'Tag' : 'Tage'}` : ''}</span>
            </div>
            <div className="ioff-act">
              {o.kind === 'sale' ? <>
                <button className="b3 b3-s b3-primary" onClick={() => answer(o, 'annehmen')} title={`Für ${fmtPrice(o.fee)} verkaufen`}>Annehmen</button>
                <span className="ioff-counter">
                  <span className="ioff-counter-l">Mehr fordern</span>
                  {COUNTER_STEPS.map((pct) => (
                    <button key={pct} className="b3 b3-s" onClick={() => answer(o, `mehr${pct}`)}
                      title={`${fmtPrice(Math.round(o.fee * (1 + pct / 100) / 5000) * 5000)} fordern – je höher, desto eher springt ${o.clubName} ab`}>+{pct} %</button>
                  ))}
                </span>
                <button className="b3 b3-s" onClick={() => answer(o, 'ablehnen')}>Ablehnen</button>
              </> : (o.msg.choices ?? []).map((c) => (
                <button key={c.id} className={`b3 b3-s ${c.id === 'leihen' ? 'b3-primary' : ''}`} title={c.hint} onClick={() => answer(o, c.id)}>{c.label}</button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
