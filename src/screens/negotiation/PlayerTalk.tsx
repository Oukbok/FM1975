// =============================================================================
// VERHANDLUNGSTISCH — Gespräch mit einem Spieler (Vertragsverlängerung und das
// Spielergespräch eines Transfers). Links der Spieler mit dem Kräfteverhältnis,
// in der Mitte die Verhandlungsposition und alle Vertragspunkte, rechts Stimmung,
// Gespräch und die Auswirkung auf dein Budget. Am Ende steht der Abschluss mit
// Stempel – das Fenster schließt nicht von selbst.
// Daten: game/contractView.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { utcDate } from '../../components/player/shared';
import { CLAUSE_BY_KEY, ClauseKey } from '../../data/contractClauses';
import { CalendarEngine } from '../../engine/calendar';
import { ContractTerms, NegCtx, packageCost } from '../../engine/contractNegotiation';
import { economyScale, formatMoney } from '../../engine/economy';
import { PROMISES, PromiseType } from '../../engine/transferMarket';
import { wageLimitFactor } from '../../game/budgetPlan';
import { clubOptionOpen, exerciseClubOption } from '../../game/contractClausesGame';
import { RENEW_PROMISES } from '../../game/contractTalk';
import { NegView, renewView, submitView, transferViewOf } from '../../game/contractView';
import { trustOf } from '../../game/promises';
import type { Game } from '../../game/state';
import { cancelTalk, inTransferWindow, packageLine, scoutKnowledge, sellerOf } from '../../game/transferTalks';
import { fmtPrice, fmtPriceAuto, fmtWage } from '../../ui/format';
import { ContractPlayer } from '../contract/ContractPlayer';
import { CLAUSE_ORDER, fmtClause, playerRows } from '../contract/ContractTable';
import { NegCard, NegFrame, type NegStep } from './NegFrame';
import { Mood, Row, TalkLog } from './NegParts';
import { Outcome, type OutcomeData } from './Outcome';
import { PositionBar } from './PositionBar';
import { TermsTable } from './TermsTable';

export type PlayerReq = { kind: 'renew'; pid: string } | { kind: 'transfer'; talkId: string };

const viewOf = (g: Game, req: PlayerReq): NegView | null => (req.kind === 'renew' ? renewView(g, req.pid) : transferViewOf(g, req.talkId));
const pctText = (v: number) => `${Math.round(v * 100)} %`;

/** Vereinbarte Punkte als Liste (nur, was vereinbart ist). */
function termLines(d: NegView['d'], t: ContractTerms): { k: string; v: string }[] {
  const keys = d ? CLAUSE_ORDER.filter((k) => d.keys.includes(k)) : CLAUSE_ORDER;
  return keys.filter((k) => k === 'wage' || k === 'years' || fmtClause(k, t) !== 'keine').map((k) => ({ k: k === 'wage' ? 'Grundgehalt' : CLAUSE_BY_KEY[k].label, v: k === 'wage' ? fmtWage(t.wage) : fmtClause(k, t) }));
}

export function PlayerTalk({ g, req, onClose, onChange, steps }: { g: Game; req: PlayerReq; onClose: () => void; onChange: () => void; steps?: NegStep[] }) {
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const v = useMemo(() => viewOf(g, req), [g, req, tick]);
  const [offer, setOffer] = useState<ContractTerms | null>(v?.start ?? null);
  const [locks, setLocks] = useState<ClauseKey[]>([]);
  const [lastAsk, setLastAsk] = useState<ContractTerms | null>(null);
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);
  useEffect(() => { if (!offer && v?.start) setOffer(v.start); }, [v, offer]);

  const p = v ? g.players[v.pid] : undefined;
  const club = g.clubs[g.managedClubId];
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const today = CalendarEngine.formatDate(g.calendar.currentDate);
  if (!v || !p) {
    return (
      <NegFrame kind="player" context="Diese Verhandlung gibt es nicht mehr" onClose={onClose} steps={steps}
        foot={<><div className="vt-notice" /><div className="vt-actions"><button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}>Schließen</button></div></>}>
        <div className="vt-blank">Diese Verhandlung gibt es nicht mehr.</div>
      </NegFrame>
    );
  }
  const knowledge = v.mode === 'renew' ? 1 : scoutKnowledge(g, p);
  const allowed = (x: PromiseType) => (x !== 'entwicklung' || p.age <= 21) && (x !== 'kapitaen' || p.age >= 24);
  const weights = new Map(v.ctx?.promiseWeights ?? []);
  const pool = (v.mode === 'renew' ? RENEW_PROMISES : (Object.keys(PROMISES) as PromiseType[])).filter(allowed);
  const promiseOptions = pool.map((x) => [x, weights.get(x) ?? 0] as [PromiseType, number]).sort((a, b) => (v.known ? b[1] - a[1] : 0));
  const open = v.status === 'open' && !!v.d && !!v.ask && !!offer && !!v.ctx;
  const ended = v.status === 'agreed' || v.status === 'failed' ? v.status : null;
  const talk = v.talkId ? (g.transferTalks ?? []).find((t) => t.id === v.talkId) : undefined;
  const seller = talk ? sellerOf(g, talk.sellerId) : undefined;

  const send = () => {
    if (!offer || !open) return;
    setLastAsk(v.ask);
    const r = submitView(g, v, offer, locks);
    setNotice(r.done ? null : { text: r.refused ? `Nicht abgeschickt: ${r.text}` : `${p.lastName} lehnt ab – seine neue Forderung steht in der Spalte „Forderung“.`, bad: !!r.refused });
    setTick((t) => t + 1);
    onChange();
  };
  const cancel = () => {
    if (talk && (talk.phase === 'club' || talk.phase === 'player')) { cancelTalk(g, talk.id); setTick((t) => t + 1); onChange(); } else onClose();
  };
  const optionOpen = v.mode === 'renew' && clubOptionOpen(g, p);

  // ----- Auswirkung -----
  const mine = p.clubId === club.id;
  const wagesNow = club.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0) - (mine ? p.contract.weeklyWage : 0);
  const after = wagesNow + (offer?.wage ?? (mine ? p.contract.weeklyWage : 0));
  const limit = wageLimitFactor(g);
  const share = after / Math.max(1, club.finances.wageBudget ?? 0);
  const cost = offer && v.ctx ? packageCost(offer, v.ctx as NegCtx) : null;
  const nominal = (x: number) => formatMoney(Math.round(x * economyScale(year)), year);
  const once = offer ? offer.signing + offer.agent : 0;
  const trust = trustOf(g);

  // ----- Abschluss -----
  let outcome: OutcomeData | null = null;
  if (ended) {
    const ok = ended === 'agreed';
    const deal = v.deal;
    const first = v.d?.ask;
    const hist = v.hist;
    const recap = [
      { k: 'Runden', v: String(v.round) },
      ...(first ? [{ k: 'Seine erste Forderung', v: fmtWage(first.wage) }] : []),
      ...(ok && deal ? [{ k: 'Abschluss', v: fmtWage(deal.wage) }] : hist.length ? [{ k: 'Dein letztes Angebot', v: `${pctText(hist[hist.length - 1][0])} seiner ersten Forderung` }] : []),
      ...(ok && deal && first && v.ctx ? [{ k: 'Kosten gegenüber der ersten Forderung', v: `${nominal(packageCost(deal, v.ctx).season - packageCost(first, v.ctx).season)} je Saison` }] : []),
    ];
    if (v.mode === 'renew') {
      const until = p.contract.talks?.blockedUntil;
      outcome = ok ? {
        ok, stamp: 'Einig', date: today, title: `${p.fullName} verlängert`, parties: [g.manager?.name ?? 'Manager', p.fullName],
        text: `Der neue Vertrag läuft bis ${utcDate(p.contract.expiryDate)}.`,
        terms: deal ? termLines(v.d, deal) : [], recap,
        next: ['Der neue Vertrag gilt ab sofort.', ...(deal?.promises.length ? ['Deine Zusagen werden am Saisonende geprüft – gebrochene kosten Glaubwürdigkeit.'] : []), ...(deal && (deal.signing || deal.agent) ? [`Handgeld und Provision (${fmtPriceAuto(deal.signing + deal.agent)}) sind gebucht.`] : [])],
      } : {
        ok, stamp: 'Gescheitert', date: today, title: `Keine Einigung mit ${p.lastName}`,
        text: v.endNote ?? `${p.lastName} hat die Gespräche abgebrochen.`,
        termsTitle: 'Seine letzte Forderung', terms: v.ask ? termLines(v.d, v.ask).slice(0, 8) : [], recap,
        next: [until ? `${p.lastName} will erst ab ${utcDate(until)} wieder reden.` : 'Ein neuer Anlauf ist später möglich.', 'Der Abbruch hat seine Stimmung gedrückt.', `Sein Vertrag läuft weiter bis ${utcDate(p.contract.expiryDate)}.`],
      };
    } else {
      const done = talk?.phase === 'done';
      const fee = talk?.freeAgent ? 'keine (ablösefrei)' : talk?.pkg ? packageLine(g, talk.pkg) : '–';
      outcome = ok ? {
        ok, stamp: done ? 'Transfer perfekt' : 'Einig', date: today, parties: [g.manager?.name ?? 'Manager', p.fullName],
        title: done ? `${p.fullName} ist dein Spieler` : `Einigung mit ${p.fullName}`,
        text: done ? `${p.fullName} wechselt von ${seller?.name ?? 'seinem Verein'} zu ${club.name}.` : `Verein und Spieler haben zugestimmt.`,
        terms: [{ k: talk?.pkg?.loan ? 'Leihe' : 'Ablöse', v: fee }, ...(deal ? termLines(v.d, deal) : [])], recap,
        next: [done ? 'Er steht ab sofort in deinem Kader.' : talk?.freeAgent ? 'Er kommt ablösefrei, sobald sein Vertrag ausgelaufen ist (1. Juli).' : inTransferWindow(g.calendar.currentDate) ? 'Der Wechsel wird vollzogen.' : 'Der Wechsel wird am ersten Tag des nächsten Transferfensters vollzogen.',
          ...(deal?.promises.length ? ['Deine Zusagen werden am Saisonende geprüft.'] : [])],
      } : {
        ok, stamp: 'Gescheitert', date: today, title: `${p.lastName} kommt nicht`,
        text: v.endNote ?? `${p.lastName} hat die Gespräche abgebrochen.`,
        termsTitle: 'Seine letzte Forderung', terms: v.ask ? termLines(v.d, v.ask).slice(0, 8) : [], recap,
        next: [`${p.lastName} bleibt bei ${seller?.name ?? 'seinem Verein'}.`, ...(talk?.pkg ? ['Die Einigung mit dem Verein ist damit hinfällig – eine Ablöse wurde nicht gezahlt.'] : []), 'Einen neuen Anlauf kannst du später starten.'],
      };
    }
  }

  const names = { spieler: p.lastName, berater: v.agent.replace(/^sein /, '').replace(/^./, (c) => c.toUpperCase()), verein: seller?.shortName ?? 'Verein', du: 'Du' };
  const rows = open ? playerRows({ d: v.d!, ctx: v.ctx!, ask: v.ask!, offer: offer!, setOffer, year, known: v.known, promiseOptions, disabled: false, locks,
    toggleLock: (k) => setLocks((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k])), last: lastAsk }) : [];
  const context = <>{v.context} · {p.fullName}{v.mode === 'renew' ? ` · Vertrag bis ${utcDate(p.contract.expiryDate)}` : ''}</>;

  return (
    <NegFrame kind="player" context={context} info="v2_tisch" onClose={onClose} steps={steps}
      foot={<>
        <div className={`vt-notice${notice?.bad ? ' bad' : ''}`} aria-live="polite">{ended ? '' : notice?.text ?? (open ? 'Stelle dein Angebot ein. Ein Klick auf eine Forderung übernimmt sie für diesen Punkt.' : '')}</div>
        <div className="vt-actions">
          {optionOpen && !ended && (
            <button type="button" className="b3 b3-l" onClick={() => { setNotice({ text: exerciseClubOption(g, p.id), bad: false }); setTick((t) => t + 1); onChange(); }}>Option ziehen</button>
          )}
          {open && talk && <button type="button" className="b3 b3-l vt-cancel" onClick={cancel}>Verhandlung abbrechen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => { if (v.start) setOffer(v.start); setLocks([]); }}>Zurücksetzen</button>}
          {open && <button type="button" className="b3 b3-l" onClick={() => v.ask && setOffer({ ...v.ask, promises: [...v.ask.promises] })}>Forderung übernehmen</button>}
          {open
            ? <button type="button" className="b3 b3-l b3-primary vt-send" onClick={send}><Icon name="contracts" size={22} /><span>Angebot machen</span></button>
            : <button type="button" className="b3 b3-l b3-primary vt-send" onClick={onClose}><span>{ended ? 'Fertig' : 'Schließen'}</span></button>}
        </div>
      </>}>
      <ContractPlayer g={g} p={p} knowledge={knowledge} levers={v.levers} />
      <div className="vt-mid">
        {outcome ? <Outcome o={outcome} /> : open ? (
          <>
            <NegCard title="Verhandlungsposition" info="v2_position" className="vt-poscard" right={`Runde ${v.round} von ${v.maxRounds}`}>
              <PositionBar p={{
                offer: v.worth!(offer!), ask: v.askWorth, open: 1, zone: v.zone, hist: v.hist, fmt: pctText,
                offerLabel: 'Dein Paket', askLabel: v.round ? 'Seine Forderung' : 'Seine Forderung (Eröffnung)',
                zoneLabel: 'Dein Stab schätzt: ab hier unterschreibt er', unit: 'Wert für ihn, gemessen an seiner ersten Forderung (= 100 %)',
                gapFmt: (x) => `Differenz ${Math.round(x * 100)} %`,
              }} />
            </NegCard>
            <NegCard title="Vertragspunkte" className="vt-tablecard" right={locks.length ? `${locks.length} nicht verhandelbar` : undefined}>
              <TermsTable rows={rows} defaultHint={<><b>Paketlogik</b> – Er bewertet das ganze Paket. Was ihm wichtig ist (Punkte rechts), darf dich etwas kosten; bei Nebensachen kommt er dir entgegen.</>} />
            </NegCard>
          </>
        ) : (
          <div className="vt-blank"><Icon name="hourglass" size={44} /><p>{v.blocked ?? 'Gerade sind keine Gespräche möglich.'}</p></div>
        )}
      </div>
      <div className="vt-side">
        <NegCard title="Stimmung" info="v2_geduld" className="vt-moodcard">
          <Mood patience={v.patience} start={v.startPatience} round={v.round} maxRounds={v.maxRounds} ended={ended} />
        </NegCard>
        <NegCard title="Gespräch" className="vt-logcard">
          <TalkLog lines={v.log.map((l) => ({ who: l.who, text: l.text }))} names={names} />
        </NegCard>
        <NegCard title="Auswirkung" info="v2_kosten" className="vt-impact">
          <Row k="Gehaltsbudget danach" tone={share > limit ? 'neg' : undefined}>{Math.round(share * 100)} %<em> / Grenze {Math.round(limit * 100)} %</em></Row>
          <div className="vt-meter"><span className={share > limit ? 'bad' : ''} style={{ width: `${Math.min(100, (share / Math.max(limit, 1)) * 100)}%` }} /></div>
          <Row k="Kosten erste Saison">{cost ? nominal(cost.season) : '—'}</Row>
          <Row k={offer ? `Gesamt über ${offer.years} Jahr${offer.years > 1 ? 'e' : ''}` : 'Gesamt über die Laufzeit'}>{cost ? nominal(cost.total) : '—'}</Row>
          <Row k="Handgeld + Provision" tone={once > club.finances.transferBudget ? 'neg' : undefined}>{fmtPriceAuto(once)}</Row>
          <Row k="Transferbudget">{fmtPrice(Math.max(0, club.finances.transferBudget))}</Row>
          <Row k="Deine Glaubwürdigkeit">{trust >= 75 ? 'hoch' : trust >= 55 ? 'ordentlich' : trust >= 35 ? 'angekratzt' : 'gering'}</Row>
        </NegCard>
      </div>
    </NegFrame>
  );
}
