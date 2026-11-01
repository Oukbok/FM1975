import { useState } from 'react';
import { ClubLink } from '../../components/club/ClubLink';
import PlayerAvatar from '../../components/PlayerAvatar';
import ClubCrest from '../../components/ClubCrest';
import { CLAUSE_FROM, PROMISES, PromiseType } from '../../engine/transferMarket';
import { scoutRangeText } from '../../engine/scouting';
import { careerPhase, PHASE_LABEL, personaOf, personaTitle } from '../../engine/persona';
import { trustOf } from '../../game/promises';
import { wishesFor } from '../../game/playerWishesGame';
import { Game } from '../../game/state';
import { TransferTalk, cancelTalk, clubOffer, inTransferWindow, playerOffer, scoutKnowledge, stanceFor, swapValueFor } from '../../game/transferTalks';
import { ImportanceDots, InterestLight, ReasonList, WishList, importanceText } from '../../components/player/WishesParts';
import { DashBox, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtPrice, vColor } from '../../ui/format';

// =============================================================================
// TRANSFERVERHANDLUNG — Vereinsgespräch, Spielergespräch, Wünsche, Verlauf
// =============================================================================
const r5k = (x: number) => Math.max(5000, Math.round(x / 5000) * 5000);
const r100 = (x: number) => Math.round(x / 100) * 100;
const WHO: Record<string, string> = { du: 'Du', verein: 'Verein', spieler: 'Spieler', info: 'Info' };

function mood(patience: number): { text: string; color: string } {
  if (patience >= 70) return { text: 'gesprächsbereit', color: 'var(--green)' };
  if (patience >= 40) return { text: 'angespannt', color: 'var(--yellow)' };
  return { text: 'gereizt', color: 'var(--red)' };
}

function Chips({ opts, value, set, label, disabled }: { opts: [number, string, string?][]; value: number; set: (v: number) => void; label: string; disabled?: string }) {
  return (
    <div className="talk-row"><span>{label}</span><div className="dchips">
      {opts.map(([v, l, tip]) => <button key={String(v)} className={`dchip ${value === v ? 'on' : ''}`} title={disabled ?? tip} disabled={!!disabled && v !== opts[0][0]} onClick={() => set(v)}>{l}</button>)}
    </div></div>
  );
}

/** Ergebnis des Vereinsgesprächs (kompakt, im Rahmen-Kasten). */
function ClubDeal({ g, t }: { g: Game; t: TransferTalk }) {
  if (t.freeAgent) return <KV k="Ablöse" v="keine – Vertrag läuft aus (Bosman)" />;
  const pk = t.pkg;
  if (!pk) return <KV k="Verein" v="keine Einigung" color="var(--red)" />;
  const extras = [pk.installments && `${pk.rates ?? 2} Raten`, pk.sellOn && `${Math.round(pk.sellOn * 100)} % Weiterverkauf`, pk.bonus && `Prämie ${fmtPrice(pk.bonus)}`,
    pk.swapPlayerId && `Tausch: ${g.players[pk.swapPlayerId]?.lastName ?? '—'}`, pk.buyBack && `Rückkauf ${fmtPrice(pk.buyBack)}`].filter(Boolean).join(' · ');
  return <>
    <KV k={pk.loan ? 'Leihgebühr' : 'Ablöse (vereinbart)'} v={fmtPrice(pk.fee)} strong />
    {pk.loan && <KV k="Kaufoption" v={fmtPrice(pk.optionFee ?? 0)} />}
    {extras && <div className="dnote">{extras}</div>}
  </>;
}

function ClubTalkBox({ g, t, onChange }: { g: Game; t: TransferTalk; onChange: (msg: string) => void }) {
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const lo = r5k(Math.min(t.estimate[0], t.currentAsk) * 0.5);
  const hi = r5k(Math.max(t.estimate[1], t.currentAsk) * 1.35);
  const [fee, setFee] = useState(r5k(Math.min(t.currentAsk, (t.estimate[0] + t.estimate[1]) / 2) * 0.85));
  const [rates, setRates] = useState<1 | 2 | 3>(1);
  const [sellOn, setSellOn] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [swap, setSwap] = useState('');
  const [buyBack, setBuyBack] = useState(0);
  const [loan, setLoan] = useState(false);
  const [option, setOption] = useState(r5k(t.currentAsk * 1.1));
  const m = mood(t.patience);
  const own = g.clubs[g.managedClubId];
  const seller = g.clubs[t.sellerId];
  const swaps = own.playerIds.map((id) => g.players[id]).filter((x) => x && !x.loan && !x.isYouth).sort((a, b) => b.overall - a.overall);
  const sw = swap ? g.players[swap] : undefined;
  const swInfo = sw && seller ? swapValueFor(g, sw, seller) : null;
  const send = () => onChange(clubOffer(g, t.id, {
    fee, installments: rates > 1, rates: rates === 3 ? 3 : 2, sellOn, bonus: bonus ? r5k(fee * bonus) : 0,
    swapPlayerId: swap || undefined, buyBack: buyBack ? r5k(fee * buyBack) : undefined, loan: loan || undefined, optionFee: loan ? option : undefined,
  }));
  return (
    <DashBox title="Vereinsgespräch" icon="negotiations" rows={2} right={<span style={{ color: m.color }}>{m.text}</span>}>
      <KV k="Forderung zuletzt" v={t.round ? fmtPrice(t.currentAsk) : 'noch keine genannt'} strong />
      <KV k="Schätzung Sportdirektor" v={`${fmtPrice(t.estimate[0])} – ${fmtPrice(t.estimate[1])}`} />
      <div className="talk-form">
        {year >= CLAUSE_FROM.loanOption && <Chips label="Art" value={loan ? 1 : 0} set={(v) => setLoan(v === 1)} opts={[[0, 'Kauf'], [1, 'Leihe mit Kaufoption', 'Eine Saison Leihe, danach entscheidest du über die Kaufoption.']]} />}
        <label className="talk-row"><span>{loan ? 'Leihgebühr' : 'Ablöse'}</span>
          <input type="range" min={loan ? 5000 : lo} max={hi} step={5000} value={fee} onChange={(e) => setFee(Number(e.target.value))} />
          <b className="accent-text">{fmtPrice(fee)}</b></label>
        {loan && <label className="talk-row"><span>Kaufoption</span>
          <input type="range" min={lo} max={hi * 1.3} step={5000} value={option} onChange={(e) => setOption(Number(e.target.value))} />
          <b>{fmtPrice(option)}</b></label>}
        {!loan && <Chips label="Zahlung" value={rates} set={(v) => setRates(v as 1 | 2 | 3)} opts={[[1, 'Sofort'], [2, '2 Raten', 'Hälfte jetzt, Rest in einem Jahr'], ...(year >= CLAUSE_FROM.threeRates ? [[3, '3 Raten', 'Ein Drittel jährlich']] as [number, string, string][] : [])]} />}
        {!loan && <Chips label="Weiterverkauf" value={sellOn} set={setSellOn} opts={[[0, 'keine'], [0.1, '10 %'], [0.2, '20 %']]} />}
        {!loan && <Chips label="Erfolgsprämie" value={bonus} set={setBonus} opts={[[0, 'keine'], [0.1, '+10 %', 'fällig bei mindestens 20 Einsätzen'], [0.25, '+25 %', 'fällig bei mindestens 20 Einsätzen']]} />}
        {!loan && year >= CLAUSE_FROM.buyBack && <Chips label="Rückkaufoption" value={buyBack} set={setBuyBack} opts={[[0, 'keine'], [1.5, `${fmtPrice(r5k(fee * 1.5))}`, 'Der Verkäufer darf ihn zwei Jahre lang zu diesem Preis zurückholen.']]} />}
        <div className="talk-row"><span>Spieler-Tausch</span>
          <select className="talk-select" value={swap} onChange={(e) => setSwap(e.target.value)}>
            <option value="">kein Tausch</option>
            {swaps.map((x) => <option key={x.id} value={x.id}>{x.fullName} ({x.naturalPosition}, {x.overall})</option>)}
          </select>
          <span className="muted">{swInfo ? (swInfo.value ? `zählt etwa ${fmtPrice(swInfo.value)}` : swInfo.reason) : ''}</span>
        </div>
        <button className="btn btn-primary talk-send" onClick={send}>Angebot abgeben</button>
      </div>
    </DashBox>
  );
}

function PlayerTalkBox({ g, t, onChange }: { g: Game; t: TransferTalk; onChange: (msg: string) => void }) {
  const p = g.players[t.playerId];
  const st = stanceFor(g, t);
  const year = Number(g.calendar.currentDate.slice(0, 4));
  const [wage, setWage] = useState(st.agentWage);
  const [years, setYears] = useState(Math.min(st.years[1], Math.max(st.years[0], 3)));
  const [hand, setHand] = useState(st.signingFee > 0 ? 1 : 0);
  const [agentPct, setAgentPct] = useState(st.agent ? 1 : 0);
  const [loyal, setLoyal] = useState(0);
  const [raise, setRaise] = useState(0);
  const [clause, setClause] = useState(false);
  const [prom, setProm] = useState<PromiseType[]>([]);
  if (t.phase !== 'player') {
    const tr = t.terms;
    return (
      <DashBox title="Spielergespräch" icon="squad" rows={2} right={t.phase === 'failed' ? 'beendet' : 'Einigung'}>
        {tr ? <>
          <KV k="Gehalt / Woche" v={fmtPrice(tr.wage)} strong />
          <KV k="Laufzeit" v={`${tr.years} Jahre`} />
          <KV k="Handgeld" v={tr.signingFee ? fmtPrice(tr.signingFee) : 'keins'} />
          {tr.agentFee ? <KV k="Beraterprovision" v={fmtPrice(tr.agentFee)} /> : null}
          {tr.loyaltyBonus ? <KV k="Treueprämie" v={fmtPrice(tr.loyaltyBonus)} /> : null}
          {tr.successRaise ? <KV k="Erfolgsklausel" v={`+${Math.round(tr.successRaise * 100)} %`} /> : null}
          <KV k="Versprechen" v={tr.promises.map((x) => PROMISES[x].label).join(', ') || 'keine'} />
        </> : <Empty icon="squad">{t.pkg || t.freeAgent ? 'Keine Einigung mit dem Spieler.' : 'Die Gespräche mit dem Verein sind gescheitert.'}</Empty>}
      </DashBox>
    );
  }
  const lo = Math.round(st.agentWage * 0.6 / 10) * 10, hi = Math.round(st.agentWage * 1.5 / 10) * 10;
  const known = t.pRound >= 1 || scoutKnowledge(g, p) >= 0.55;
  const weights = new Map(st.priorities);
  const toggle = (x: PromiseType) => setProm((cur) => cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]);
  const avail = (Object.keys(PROMISES) as PromiseType[]).filter((x) => (x !== 'entwicklung' || (p?.age ?? 30) <= 21) && (x !== 'kapitaen' || (p?.age ?? 0) >= 24))
    .sort((a, b) => (known ? (weights.get(b) ?? 0) - (weights.get(a) ?? 0) : 0));
  const handFee = r100(st.signingFee * hand || (hand ? wage * 6 * hand : 0));
  const send = () => onChange(playerOffer(g, t.id, {
    wage, years, signingFee: handFee, releaseClause: clause, promises: prom,
    agentFee: r100(st.agentFee * agentPct), loyaltyBonus: loyal ? r100(wage * loyal) : undefined, successRaise: raise || undefined,
  }));
  return (
    <DashBox title="Spielergespräch" icon="squad" rows={2} right={<span style={{ color: mood(t.pPatience).color }}>{mood(t.pPatience).text}</span>}>
      <div className="talk-form">
        <label className="talk-row"><span>Gehalt / Woche</span>
          <input type="range" min={lo} max={hi} step={10} value={wage} onChange={(e) => setWage(Number(e.target.value))} />
          <b className="accent-text">{fmtPrice(wage)}</b></label>
        <Chips label="Laufzeit" value={years} set={setYears} opts={[1, 2, 3, 4, 5].map((y) => [y, `${y} J.`] as [number, string])} />
        <Chips label="Handgeld" value={hand} set={setHand} opts={[[0, 'keins'], [0.5, st.signingFee ? fmtPrice(r100(st.signingFee * 0.5)) : fmtPrice(r100(wage * 3))], [1, st.signingFee ? fmtPrice(st.signingFee) : fmtPrice(r100(wage * 6))], [1.6, st.signingFee ? fmtPrice(r100(st.signingFee * 1.6)) : fmtPrice(r100(wage * 10))]]} />
        {st.agent && <Chips label="Beraterprovision" value={agentPct} set={setAgentPct} opts={[[0, 'keine'], [0.5, fmtPrice(r100(st.agentFee * 0.5))], [1, fmtPrice(st.agentFee), 'Die übliche Provision des Beraters']]} />}
        <Chips label="Treueprämie" value={loyal} set={setLoyal} opts={[[0, 'keine'], [10, fmtPrice(r100(wage * 10)), 'fällig bei Vertragsende, wenn er bleibt'], [26, fmtPrice(r100(wage * 26)), 'fällig bei Vertragsende, wenn er bleibt']]} />
        <Chips label="Erfolgsklausel" value={raise} set={setRaise} opts={[[0, 'keine'], [0.1, '+10 %', 'mehr Gehalt bei einem Europapokal-Platz'], [0.2, '+20 %', 'mehr Gehalt bei einem Europapokal-Platz']]} />
        <Chips label="Ausstiegsklausel" value={clause ? 1 : 0} set={(v) => setClause(v === 1)} disabled={year < CLAUSE_FROM.releaseClause ? `erst ab ${CLAUSE_FROM.releaseClause} üblich` : undefined}
          opts={[[0, 'keine'], [1, 'vereinbaren', 'Ein Verein, der die Klausel zahlt, bekommt ihn ohne Verhandlung.']]} />
        <div className="talk-row talk-row-top"><span>Versprechen</span>
          <ul className="talk-checklist">
            {avail.map((x) => (
              <li key={x} className={prom.includes(x) ? 'on' : ''} title={`${PROMISES[x].desc} Prüfung: ${PROMISES[x].check}`} onClick={() => toggle(x)}>
                <span className="box" /><span className="grow">{PROMISES[x].label}</span>
                <ImportanceDots weight={weights.get(x) ?? 0} known={known} />
              </li>
            ))}
          </ul></div>
        <button className="btn btn-primary talk-send" onClick={send}>Vorschlag machen</button>
      </div>
    </DashBox>
  );
}

/** Einschätzung: Interesse, Gründe, Forderungen und was ihm wichtig ist. */
function WishBox({ g, t }: { g: Game; t: TransferTalk }) {
  const p = g.players[t.playerId];
  if (!p || t.phase === 'done') return <DashBox title="Was ihm wichtig ist" icon="watchlist"><Empty icon="watchlist">Abgeschlossen.</Empty></DashBox>;
  const st = stanceFor(g, t);
  const w = wishesFor(g, p, g.clubs[g.managedClubId], { freeAgent: !!t.freeAgent });
  const k = scoutKnowledge(g, p);
  const known = t.pRound >= 1 || k >= 0.55;
  const pe = personaOf(p);
  return (
    <DashBox title="Was ihm wichtig ist" icon="watchlist">
      {st.dealBreaker && k >= 0.3 ? <div className="wish-block">{st.dealBreaker}</div> : <InterestLight score={st.interest} knowledge={k} />}
      <div className="dnote">{k >= 0.35 ? `${personaTitle(pe)} · ` : ''}{PHASE_LABEL[careerPhase(p)]}</div>
      <div className="dsec">Für und gegen dich</div>
      <ReasonList reasons={w.appeal.factors} knowledge={k} max={5} />
      <div className="dsec">Seine Forderungen</div>
      <div className="talk-demands">
        <KV k={st.agent ? 'Berater fordert' : 'Er fordert'} v={`${fmtPrice(st.agentWage)} / Woche`} />
        <KV k="Wunschlaufzeit" v={`${st.years[0]}–${st.years[1]} Jahre`} />
        {st.signingFee > 0 && <KV k="Handgeld" v={`etwa ${fmtPrice(st.signingFee)}`} />}
        {st.agent && <KV k="Provision" v={fmtPrice(st.agentFee)} />}
        {known && st.cut > 0.04 && <KV k="Verzicht" v={`würde für euch etwa ${Math.round(st.cut * 100)} % weniger nehmen`} color="var(--green)" />}
        {known && st.cut < -0.04 && <KV k="Aufschlag" v={`verlangt etwa ${Math.round(-st.cut * 100)} % mehr`} color="var(--orange)" />}
      </div>
      <div className="dsec">Wünsche</div>
      <WishList wishes={st.priorities} known={known} max={4} />
      {known && st.priorities[0] && <div className="dnote mt8">Am wichtigsten: {PROMISES[st.priorities[0][0]].label} ({importanceText(st.priorities[0][1])}).</div>}
    </DashBox>
  );
}

export function TransferTalkModal({ g, talk, onClose, onChange }: { g: Game; talk: TransferTalk; onClose: () => void; onChange: () => void }) {
  const [, setTick] = useState(0);
  const p = g.players[talk.playerId];
  const seller = g.clubs[talk.sellerId];
  const own = g.clubs[g.managedClubId];
  const act = (_msg: string) => { setTick((x) => x + 1); onChange(); };
  const wages = own.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head" style={{ background: `linear-gradient(120deg, ${seller?.colors.primary ?? '#22252b'}22, transparent 70%)` }}>
          {p && <PlayerAvatar player={p} club={seller} size="large" />}
          <div>
            <div className="mx-sub">Transferverhandlung · <ClubLink id={talk.sellerId}>{seller && <ClubCrest club={seller} size={18} />} {seller?.name}</ClubLink></div>
            <h2>{p?.fullName ?? 'Spieler'}</h2>
          </div>
          {p && <div className="mx-kpis">
            <Kpi value={p.overall} label="Stärke" color={vColor(p.overall)} />
            <Kpi value={scoutRangeText(p)} label="Potenzial" color="var(--yellow)" />
            <Kpi value={p.age} label="Alter" />
            <Kpi value={fmtPrice(p.contract.transferValue)} label="Marktwert" />
          </div>}
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mx-body mx-grid">
          <DashBox title="Gesprächsverlauf" icon="news" rows={2}>
            {[...talk.log].reverse().map((l, i) => (
              <div key={i} className="dlist-row talk-log">
                <span className={`talk-who talk-${l.who}`}>{WHO[l.who]}</span>
                <span className="grow">{l.text}</span>
              </div>
            ))}
          </DashBox>
          {talk.phase === 'club'
            ? <ClubTalkBox key={`c${talk.round}`} g={g} t={talk} onChange={act} />
            : <PlayerTalkBox key={`p${talk.pRound}`} g={g} t={talk} onChange={act} />}
          <WishBox g={g} t={talk} />
          <DashBox title="Rahmen" icon="finances">
            {talk.phase === 'club' ? <div className="dnote">Erst wenn du dich mit dem Verein einig bist, darfst du mit {p?.lastName} sprechen.</div> : <ClubDeal g={g} t={talk} />}
            <KV k="Transferbudget" v={fmtPrice(own.finances.transferBudget)} />
            <Meter label="Gehaltsrahmen" value={wages} max={Math.max(1, own.finances.wageBudget)} text={`${Math.round((wages / Math.max(1, own.finances.wageBudget)) * 100)} %`} />
            <KV k={<span title="Gehaltene Versprechen +5, gebrochene −15. Mehr als drei Versprechen wirken unglaubwürdig.">Glaubwürdigkeit</span>} v={`${trustOf(g)} / 100`} color={trustOf(g) >= 60 ? 'var(--green)' : 'var(--orange)'} />
            <KV k="Transferfenster" v={inTransferWindow(g.calendar.currentDate) ? 'offen' : 'geschlossen – Wechsel erst im nächsten Fenster'} />
            {(talk.phase === 'club' || talk.phase === 'player') && <button className="dchip mt8" onClick={() => { cancelTalk(g, talk.id); act('Verhandlung beendet.'); }}>Verhandlung abbrechen</button>}
          </DashBox>
        </div>
      </div>
    </div>
  );
}
