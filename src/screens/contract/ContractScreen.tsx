// =============================================================================
// VERHANDLUNGSTISCH (Wunsch Pascal: „Vertragsverhandlungen deutlich komplizierter,
// mit eigenem Screen“; Vorbild EA Fussball Manager). Vollbild über allem, die Zeit
// steht (shell/GameShell.tsx). Links der Spieler, in der Mitte alle Vertragspunkte
// (seine Forderung gegen dein Angebot, wie wichtig ihm der Punkt ist), rechts
// Stimmung/Geduld, Gesprächsverlauf und die Auswirkung auf dein Budget.
// Daten: game/contractView.ts (Verlängerung über game/contractTalk.ts, Transfer
// über game/transferTalks.ts). Feste Größe – nichts wächst beim Bedienen.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/Icon';
import { ContractTerms } from '../../engine/contractNegotiation';
import { PROMISES, PromiseType } from '../../engine/transferMarket';
import { clubOptionOpen, exerciseClubOption } from '../../game/contractClausesGame';
import { RENEW_PROMISES } from '../../game/contractTalk';
import { NegView, renewView, submitView, transferViewOf } from '../../game/contractView';
import { scoutKnowledge } from '../../game/transferTalks';
import type { Game } from '../../game/state';
import { InfoTip } from '../../ui/InfoTip';
import { ContractOpenReq } from './contractOpen';
import { ContractPlayer } from './ContractPlayer';
import { ContractSide } from './ContractSide';
import { ContractTable } from './ContractTable';
import { utcDate } from '../../components/player/shared';

function viewOf(g: Game, req: ContractOpenReq): NegView | null {
  return req.kind === 'renew' ? renewView(g, req.pid) : transferViewOf(g, req.talkId);
}

export function ContractScreen({ g, req, onClose, onChange }: { g: Game; req: ContractOpenReq; onClose: () => void; onChange: () => void }) {
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const v = useMemo(() => viewOf(g, req), [g, req, tick]);
  const [offer, setOffer] = useState<ContractTerms | null>(v?.start ?? null);
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);
  useEffect(() => { if (!offer && v?.start) setOffer(v.start); }, [v, offer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const p = v ? g.players[v.pid] : undefined;
  const host = (typeof document !== 'undefined' && (document.querySelector('.display-content') ?? document.body)) as Element;
  if (!v || !p) {
    return createPortal(
      <div className="ct-root" role="dialog" aria-label="Verhandlungstisch">
        <header className="ct-top"><span className="ct-title">Verhandlungstisch</span><button className="modal-close" onClick={onClose} aria-label="Schließen">×</button></header>
        <div className="ct-empty">Diese Verhandlung gibt es nicht mehr.</div>
      </div>, host);
  }
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const knowledge = v.mode === 'renew' ? 1 : scoutKnowledge(g, p);
  const allowed = (x: PromiseType) => (x !== 'entwicklung' || p.age <= 21) && (x !== 'kapitaen' || p.age >= 24);
  const weights = new Map(v.ctx?.promiseWeights ?? []);
  const pool = (v.mode === 'renew' ? RENEW_PROMISES : (Object.keys(PROMISES) as PromiseType[])).filter(allowed);
  const promiseOptions = pool.map((x) => [x, weights.get(x) ?? 0] as [PromiseType, number]).sort((a, b) => (v.known ? b[1] - a[1] : 0));
  const open = v.status === 'open' && !!v.d && !!v.ask && !!offer;
  const send = () => {
    if (!offer || !open) return;
    const r = submitView(g, v, offer);
    const text = r.refused || r.done ? r.text : `${p.lastName} lehnt ab.${v.mode === 'renew' ? ' Seine neue Forderung steht in der Spalte „Forderung“.' : ''}`;
    setNotice({ text, bad: !!r.refused });
    setTick((t) => t + 1);
    onChange();
  };
  const optionOpen = v.mode === 'renew' && clubOptionOpen(g, p);

  return createPortal(
    <div className="ct-root" role="dialog" aria-label="Verhandlungstisch">
      <header className="ct-top">
        <div className="ct-top-l">
          <Icon name="contracts" size={30} />
          <span className="ct-title">Verhandlungstisch</span>
          <span className="ct-ctx">{v.context} · {p.fullName}{v.mode === 'renew' ? ` · Vertrag bis ${utcDate(p.contract.expiryDate)}` : ''}</span>
          <InfoTip k="v2_tisch" />
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Schließen" title="Esc">×</button>
      </header>

      <div className="ct-body">
        <ContractPlayer g={g} p={p} d={v.d} knowledge={knowledge} promiseOptions={promiseOptions.filter(([, w]) => w > 0)} />
        <main className="ct-card ct-mid">
          {v.d && v.ask && offer && v.ctx ? (
            <ContractTable d={v.d} ctx={v.ctx} ask={v.ask} offer={offer} setOffer={setOffer} year={year} known={v.known}
              promiseOptions={promiseOptions} disabled={!open} />
          ) : (
            <div className="ct-empty">
              <Icon name="hourglass" size={44} />
              <p>{v.blocked ?? 'Gerade sind keine Gespräche möglich.'}</p>
            </div>
          )}
          {v.status === 'agreed' && <div className="ct-banner good">Einigung erzielt. {v.mode === 'renew' ? 'Der neue Vertrag gilt.' : 'Der Wechsel wird vollzogen, sobald das Transferfenster offen ist.'}</div>}
          {v.status === 'failed' && <div className="ct-banner bad">Die Gespräche sind gescheitert.</div>}
        </main>
        <ContractSide g={g} v={v} offer={open ? offer : null} agentLabel={v.agent} />
      </div>

      <footer className="ct-foot">
        <div className={`ct-notice${notice?.bad ? ' bad' : ''}`} aria-live="polite">{notice?.text ?? ''}</div>
        <div className="ct-actions">
          {optionOpen && (
            <button type="button" className="b3 b3-l" onClick={() => { setNotice({ text: exerciseClubOption(g, p.id), bad: false }); setTick((t) => t + 1); onChange(); }}>
              Option ziehen
            </button>
          )}
          {open && <button type="button" className="b3 b3-l" onClick={() => v.start && setOffer(v.start)}>Zurücksetzen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => v.ask && setOffer({ ...v.ask, promises: [...v.ask.promises] })}>Forderung übernehmen</button>}
          {open
            ? <button type="button" className="b3 b3-l b3-primary ct-send" onClick={send}><Icon name="contracts" size={22} /><span>Angebot machen</span></button>
            : <button type="button" className="b3 b3-l b3-primary ct-send" onClick={onClose}><span>Schließen</span></button>}
        </div>
      </footer>
    </div>,
    host,
  );
}
