import { useState } from 'react';
import PlayerAvatar from '../../components/PlayerAvatar';
import ClubCrest from '../../components/ClubCrest';
import { PROMISES, PromiseType } from '../../engine/transferMarket';
import { scoutRangeText } from '../../engine/scouting';
import { trustOf } from '../../game/promises';
import { Game } from '../../game/state';
import { TransferTalk, cancelTalk, clubOffer, inTransferWindow, playerOffer, stanceFor } from '../../game/transferTalks';
import { DashBox, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtPrice, vColor } from '../../ui/format';

// =============================================================================
// TRANSFERVERHANDLUNG — Vereinsgespräch, Spielergespräch, Verlauf
// =============================================================================
const r5k = (x: number) => Math.max(5000, Math.round(x / 5000) * 5000);
const WHO: Record<string, string> = { du: 'Du', verein: 'Verein', spieler: 'Spieler', info: 'Info' };

function mood(patience: number): { text: string; color: string } {
  if (patience >= 70) return { text: 'gesprächsbereit', color: 'var(--green)' };
  if (patience >= 40) return { text: 'angespannt', color: 'var(--yellow)' };
  return { text: 'gereizt', color: 'var(--red)' };
}

function ClubTalkBox({ g, t, onChange }: { g: Game; t: TransferTalk; onChange: (msg: string) => void }) {
  const lo = r5k(Math.min(t.estimate[0], t.currentAsk) * 0.5);
  const hi = r5k(Math.max(t.estimate[1], t.currentAsk) * 1.35);
  const [fee, setFee] = useState(r5k(Math.min(t.currentAsk, (t.estimate[0] + t.estimate[1]) / 2) * 0.85));
  const [inst, setInst] = useState(false);
  const [sellOn, setSellOn] = useState(0);
  const [bonus, setBonus] = useState(0);
  const m = mood(t.patience);
  if (t.freeAgent) return <DashBox title="Vereinsgespräch" icon="negotiations"><Empty icon="contracts">Vertrag läuft aus – keine Ablöse. Du verhandelst direkt mit dem Spieler.</Empty></DashBox>;
  if (t.phase !== 'club') {
    return (
      <DashBox title="Vereinsgespräch" icon="negotiations" right={t.phase === 'failed' ? 'beendet' : 'Einigung'}>
        {t.pkg ? <>
          <KV k="Ablöse" v={fmtPrice(t.pkg.fee)} strong />
          <KV k="Ratenzahlung" v={t.pkg.installments ? 'ja, 50 % in einem Jahr' : 'nein'} />
          <KV k="Weiterverkaufsbeteiligung" v={t.pkg.sellOn ? `${Math.round(t.pkg.sellOn * 100)} %` : 'keine'} />
          <KV k="Erfolgsprämie" v={t.pkg.bonus ? fmtPrice(t.pkg.bonus) : 'keine'} />
        </> : <Empty icon="negotiations">Keine Einigung mit dem Verein.</Empty>}
      </DashBox>
    );
  }
  return (
    <DashBox title="Vereinsgespräch" icon="negotiations" right={<span style={{ color: m.color }}>{m.text}</span>}>
      <KV k="Forderung zuletzt" v={t.round ? fmtPrice(t.currentAsk) : 'noch keine genannt'} strong />
      <KV k="Schätzung Sportdirektor" v={`${fmtPrice(t.estimate[0])} – ${fmtPrice(t.estimate[1])}`} />
      <div className="talk-form">
        <label className="talk-row"><span>Ablöse</span>
          <input type="range" min={lo} max={hi} step={5000} value={fee} onChange={(e) => setFee(Number(e.target.value))} />
          <b className="accent-text">{fmtPrice(fee)}</b></label>
        <div className="talk-row"><span>Zahlung</span><div className="dchips">
          <button className={`dchip ${!inst ? 'on' : ''}`} onClick={() => setInst(false)}>Sofort</button>
          <button className={`dchip ${inst ? 'on' : ''}`} onClick={() => setInst(true)}>2 Raten</button></div></div>
        <div className="talk-row"><span>Weiterverkauf</span><div className="dchips">
          {[0, 0.1, 0.2].map((x) => <button key={x} className={`dchip ${sellOn === x ? 'on' : ''}`} onClick={() => setSellOn(x)}>{x ? `${x * 100} %` : 'keine'}</button>)}</div></div>
        <div className="talk-row"><span>Erfolgsprämie</span><div className="dchips">
          {[0, 0.1, 0.25].map((x) => <button key={x} className={`dchip ${bonus === x ? 'on' : ''}`} title="fällig bei mindestens 20 Einsätzen in der Saison" onClick={() => setBonus(x)}>{x ? `+${x * 100} %` : 'keine'}</button>)}</div></div>
        <button className="btn btn-primary talk-send" onClick={() => onChange(clubOffer(g, t.id, { fee, installments: inst, sellOn, bonus: r5k(fee * bonus) * (bonus ? 1 : 0) }))}>Angebot abgeben</button>
      </div>
    </DashBox>
  );
}

function PlayerTalkBox({ g, t, onChange }: { g: Game; t: TransferTalk; onChange: (msg: string) => void }) {
  const p = g.players[t.playerId];
  const st = stanceFor(g, t);
  const [wage, setWage] = useState(st.agentWage);
  const [years, setYears] = useState(Math.min(st.years[1], Math.max(st.years[0], 3)));
  const [hand, setHand] = useState(0);
  const [clause, setClause] = useState(false);
  const [prom, setProm] = useState<PromiseType[]>([]);
  if (t.phase === 'club') return <DashBox title="Spielergespräch" icon="squad"><Empty icon="squad">Erst wenn du dich mit dem Verein einig bist, darfst du mit {p?.lastName} sprechen.</Empty></DashBox>;
  if (t.phase !== 'player') {
    return (
      <DashBox title="Spielergespräch" icon="squad" right={t.phase === 'failed' ? 'beendet' : 'Einigung'}>
        {t.terms ? <>
          <KV k="Gehalt / Woche" v={fmtPrice(t.terms.wage)} strong />
          <KV k="Laufzeit" v={`${t.terms.years} Jahre`} />
          <KV k="Handgeld" v={t.terms.signingFee ? fmtPrice(t.terms.signingFee) : 'keins'} />
          <KV k="Versprechen" v={t.terms.promises.map((x) => PROMISES[x].label).join(', ') || 'keine'} />
        </> : <Empty icon="squad">Keine Einigung mit dem Spieler.</Empty>}
      </DashBox>
    );
  }
  const lo = Math.round(st.agentWage * 0.6 / 10) * 10, hi = Math.round(st.agentWage * 1.5 / 10) * 10;
  const toggle = (x: PromiseType) => setProm((cur) => cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]);
  const avail = (Object.keys(PROMISES) as PromiseType[]).filter((x) => (x !== 'entwicklung' || (p?.age ?? 30) <= 21) && (x !== 'kapitaen' || (p?.age ?? 0) >= 24));
  return (
    <DashBox title="Spielergespräch" icon="squad" right={<span style={{ color: mood(t.pPatience).color }}>{mood(t.pPatience).text}</span>}>
      <div className="talk-form">
        <label className="talk-row"><span>Gehalt / Woche</span>
          <input type="range" min={lo} max={hi} step={10} value={wage} onChange={(e) => setWage(Number(e.target.value))} />
          <b className="accent-text">{fmtPrice(wage)}</b></label>
        <div className="talk-row"><span>Laufzeit</span><div className="dchips">
          {[1, 2, 3, 4, 5].map((y) => <button key={y} className={`dchip ${years === y ? 'on' : ''}`} onClick={() => setYears(y)}>{y} J.</button>)}</div></div>
        <div className="talk-row"><span>Handgeld</span><div className="dchips">
          {[0, 4, 10, 20].map((w) => <button key={w} className={`dchip ${hand === w ? 'on' : ''}`} onClick={() => setHand(w)}>{w ? fmtPrice(w * wage) : 'keins'}</button>)}</div></div>
        <div className="talk-row"><span>Klausel</span><div className="dchips">
          <button className={`dchip ${!clause ? 'on' : ''}`} onClick={() => setClause(false)}>keine</button>
          <button className={`dchip ${clause ? 'on' : ''}`} title="Ein Verein, der die Klausel zahlt, bekommt ihn ohne Verhandlung." onClick={() => setClause(true)}>Ausstiegsklausel</button></div></div>
        <div className="talk-row"><span>Versprechen</span><div className="dchips">
          {avail.map((x) => <button key={x} className={`dchip ${prom.includes(x) ? 'on' : ''}`} title={`${PROMISES[x].desc} Prüfung: ${PROMISES[x].check}`} onClick={() => toggle(x)}>{PROMISES[x].label}</button>)}</div></div>
        <button className="btn btn-primary talk-send" onClick={() => onChange(playerOffer(g, t.id, { wage, years, signingFee: hand * wage, releaseClause: clause, promises: prom }))}>Vorschlag machen</button>
      </div>
    </DashBox>
  );
}

export function TransferTalkModal({ g, talk, onClose, onChange }: { g: Game; talk: TransferTalk; onClose: () => void; onChange: () => void }) {
  const [, setTick] = useState(0);
  const p = g.players[talk.playerId];
  const seller = g.clubs[talk.sellerId];
  const own = g.clubs[g.managedClubId];
  const act = (_msg: string) => { setTick((x) => x + 1); onChange(); };
  const st = p && talk.phase !== 'done' ? stanceFor(g, talk) : null;
  const known = talk.pRound >= 1;
  const wages = own.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head" style={{ background: `linear-gradient(120deg, ${seller?.colors.primary ?? '#1a2331'}22, transparent 70%)` }}>
          {p && <PlayerAvatar player={p} club={seller} size="large" />}
          <div>
            <div className="mx-sub">Transferverhandlung · {seller && <ClubCrest club={seller} size={18} />} {seller?.name}</div>
            <h2>{p?.fullName ?? 'Spieler'}</h2>
          </div>
          {p && <div className="mx-kpis">
            <Kpi value={p.overall} label="Stärke" color={vColor(p.overall)} />
            <Kpi value={scoutRangeText(p)} label="Potenzial" color="var(--yellow)" />
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
          <ClubTalkBox key={`c${talk.round}`} g={g} t={talk} onChange={act} />
          <DashBox title="Einschätzung" icon="watchlist">
            {st ? <>
              <KV k="Forderung des Beraters" v={`${fmtPrice(st.agentWage)} / Woche`} />
              <KV k="Wunschlaufzeit" v={`${st.years[0]}–${st.years[1]} Jahre`} />
              <div className="dsec">Was für und gegen dich spricht</div>
              {st.reasons.length ? st.reasons.map((r) => <div key={r.label} className="dlist-row"><span className="grow">{r.label}</span><span style={{ color: r.sign > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 900 }}>{r.sign > 0 ? '+' : '−'}</span></div>)
                : <div className="dnote">Nichts Auffälliges.</div>}
              <div className="dsec">Ihm wichtig</div>
              <div className="dnote">{known ? st.priorities.slice(0, 2).map(([x]) => PROMISES[x].label).join(', ') : 'Noch unklar – das erfährst du im ersten Gespräch.'}</div>
            </> : <Empty icon="watchlist">Abgeschlossen.</Empty>}
          </DashBox>
          <PlayerTalkBox key={`p${talk.pRound}`} g={g} t={talk} onChange={act} />
          <DashBox title="Rahmen" icon="finances">
            <KV k="Transferbudget" v={fmtPrice(own.finances.transferBudget)} />
            <Meter label="Gehaltsrahmen" value={wages} max={Math.max(1, own.finances.wageBudget)} text={`${Math.round((wages / Math.max(1, own.finances.wageBudget)) * 100)} %`} />
            <KV k="Glaubwürdigkeit" v={`${trustOf(g)} / 100`} color={trustOf(g) >= 60 ? 'var(--green)' : 'var(--orange)'} />
            <KV k="Transferfenster" v={inTransferWindow(g.calendar.currentDate) ? 'offen' : 'geschlossen – Wechsel erst im nächsten Fenster'} />
            {(talk.phase === 'club' || talk.phase === 'player') && <button className="dchip mt8" onClick={() => { cancelTalk(g, talk.id); act('Verhandlung beendet.'); }}>Verhandlung abbrechen</button>}
          </DashBox>
        </div>
      </div>
    </div>
  );
}
