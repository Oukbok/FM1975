import ClubCrest from '../../components/ClubCrest';
import PlayerModal from '../../components/PlayerModal';
import { CalendarEngine } from '../../engine/calendar';
import { getAvailablePlayers, makeOffer } from '../../engine/transfers';
import { Game } from '../../game/state';
import { Player } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, vColor, fmtPrice } from '../../ui/format';
import { GROUP_DE, PlayerRow, ScoutStars, avg, groupOf, monthsUntil, scoutMid, squadOf } from '../shared';
import { useState } from 'react';

// =============================================================================
// TRANSFERS — Transfermarkt, Beobachtung (Scouting-Vorschläge), Verhandlungen
// =============================================================================
const GROUPS = ['GK', 'DEF', 'MID', 'ATT'];
const IDEAL: Record<string, number> = { GK: 2, DEF: 6, MID: 6, ATT: 4 };

/** Vereins-Bedarf je Mannschaftsteil: Anzahl und Ø Stärke gegen Richtwert. */
function needs(g: Game) {
  const sq = squadOf(g);
  return GROUPS.map((k) => {
    const xs = sq.filter((p) => groupOf(p) === k);
    return { k, n: xs.length, avg: Math.round(avg(xs.map((p) => p.overall))), short: xs.length < IDEAL[k] };
  });
}

function usePlayerModal(g: Game) {
  const [sel, setSel] = useState<string | null>(null);
  const p = sel ? g.players[sel] : null;
  const modal = p ? (
    <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id])}
      today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)} />
  ) : null;
  return { open: setSel, modal };
}

function MarketTable({ g, list, onOpen, action }: { g: Game; list: Player[]; onOpen: (id: string) => void; action?: (p: Player) => React.ReactNode }) {
  const today = g.calendar.currentDate;
  return (
    <table className="dtable">
      <thead><tr>
        <th>Name</th><th>Verein</th><th className="ctr">Pos</th><th className="num">Alter</th><th className="num">Stärke</th>
        <th>Potenzial</th><th className="num">Vertrag</th><th className="num">Gehalt/Wo.</th><th className="num">Wert</th>{action && <th />}
      </tr></thead>
      <tbody>
        {list.map((p) => {
          const c = g.clubs[p.clubId];
          return (
            <tr key={p.id} className="clickable" onClick={() => onOpen(p.id)}>
              <td className="nowrap" style={{ fontWeight: 700 }}>{p.fullName}</td>
              <td className="nowrap"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{c && <ClubCrest club={c} size={20} />}{c?.shortName}</span></td>
              <td className="ctr"><span className="pos-badge">{p.naturalPosition}</span></td>
              <td className="num">{p.age}</td>
              <td className="num"><b style={{ color: vColor(p.overall) }}>{p.overall}</b></td>
              <td className="nowrap"><ScoutStars p={p} /></td>
              <td className="num muted">{monthsUntil(today, p.contract.expiryDate)} M.</td>
              <td className="num">{fmtPrice(p.contract.weeklyWage)}</td>
              <td className="num" style={{ color: 'var(--accent)' }}>{fmtPrice(p.contract.transferValue)}</td>
              {action && <td className="num" onClick={(e) => e.stopPropagation()}>{action(p)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function NeedsBox({ g }: { g: Game }) {
  return (
    <DashBox title="Kaderbedarf" icon="dashKader">
      {needs(g).map((n) => (
        <Meter key={n.k} label={`${GROUP_DE[n.k]} · Ø ${n.avg || '–'}`} value={n.n} max={IDEAL[n.k] + 2}
          text={`${n.n} / ${IDEAL[n.k]}`} color={n.short ? 'var(--red)' : undefined} />
      ))}
      <div className="dnote mt8">Richtwert: 2 Torhüter, je 6 Abwehr- und Mittelfeldspieler, 4 Stürmer. Rot = zu dünn besetzt.</div>
    </DashBox>
  );
}

// --- TRANSFERMARKT ----------------------------------------------------------
export function TransfersView({ g, onDone }: { g: Game; onDone: () => void }) {
  const club = g.clubs[g.managedClubId];
  const [grp, setGrp] = useState('all');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { open, modal } = usePlayerModal(g);
  const all = getAvailablePlayers(g.players, g.managedClubId);
  const list = all.filter((p) => grp === 'all' || groupOf(p) === grp).slice(0, 60);
  const fin = club.finances;
  const wages = squadOf(g).reduce((s, p) => s + p.contract.weeklyWage, 0);

  const buy = (p: Player) => {
    const amount = Math.round(p.contract.transferValue * 1.05);
    const wage = Math.round(p.contract.weeklyWage * 1.1);
    const res = makeOffer(club, p, g.clubs, g.players, amount, wage);
    setMsg({ ok: res.accepted, text: res.message });
    onDone();
  };

  return (
    <DashPage>
      <DashBox title={`Transfermarkt (${all.length})`} icon="transfers" span={2} rows={2} flush
        right={<span className="dbtnrow">
          <button className={`dchip ${grp === 'all' ? 'on' : ''}`} onClick={() => setGrp('all')}>Alle</button>
          {GROUPS.map((k) => <button key={k} className={`dchip ${grp === k ? 'on' : ''}`} onClick={() => setGrp(k)}>{GROUP_DE[k]}</button>)}
        </span>}>
        {list.length ? <MarketTable g={g} list={list} onOpen={open}
          action={(p) => <button className="dchip on" onClick={() => buy(p)}>Angebot {fmtDM(Math.round(p.contract.transferValue * 1.05))}</button>} />
          : <Empty icon="transfers">Derzeit keine Spieler auf dem Markt.</Empty>}
      </DashBox>

      <DashBox title="Budget" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtPrice(fin.transferBudget)} label="Transferbudget" />
          <Kpi value={fmtDM(Math.max(0, fin.wageBudget - wages))} label="Gehaltsspielraum/Wo." />
        </div>
        <KV k="Kontostand" v={fmtDM(fin.balance)} />
        <KV k="Gehälter / Gehaltsbudget" v={`${fmtDM(wages)} / ${fmtDM(fin.wageBudget)}`} />
        {msg && <div className="dnote mt8" style={{ color: msg.ok ? 'var(--green)' : 'var(--red)', fontSize: 16, fontWeight: 700 }}>{msg.text}</div>}
        <div className="dnote mt8">Ein Angebot liegt 5 % über dem Marktwert, das Gehalt 10 % über dem bisherigen. Der Verkäufer kann ablehnen.</div>
      </DashBox>

      <NeedsBox g={g} />
      {modal}
    </DashPage>
  );
}

// --- BEOBACHTUNGSLISTE (Scouting-Vorschläge aus der Liga) --------------------
type ScoutMode = 'contract' | 'young' | 'need';
export function BeobachtungView({ g }: { g: Game }) {
  const [mode, setMode] = useState<ScoutMode>('need');
  const { open, modal } = usePlayerModal(g);
  const today = g.calendar.currentDate;
  const others = Object.values(g.players).filter((p) => p.clubId && p.clubId !== g.managedClubId && g.clubs[p.clubId] && !p.isYouth);
  const ns = needs(g);
  const weakest = [...ns].sort((a, b) => (Number(b.short) - Number(a.short)) || a.avg - b.avg)[0];
  const lists: Record<ScoutMode, Player[]> = {
    need: others.filter((p) => groupOf(p) === weakest.k && p.overall > weakest.avg).sort((a, b) => b.overall - a.overall),
    contract: others.filter((p) => monthsUntil(today, p.contract.expiryDate) <= 12).sort((a, b) => b.overall - a.overall),
    young: others.filter((p) => p.age <= 21).sort((a, b) => scoutMid(b) - scoutMid(a) || b.overall - a.overall),
  };
  const list = lists[mode].slice(0, 50);
  const label: Record<ScoutMode, string> = { need: `Verstärkung ${GROUP_DE[weakest.k]}`, contract: 'Vertrag läuft aus', young: 'Junge Talente (bis 21)' };

  return (
    <DashPage>
      <DashBox title="Scouting-Vorschläge" icon="watchlist" span={2} rows={2} flush
        right={<span className="dbtnrow">
          {(['need', 'contract', 'young'] as ScoutMode[]).map((m) => <button key={m} className={`dchip ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>{label[m]} ({lists[m].length})</button>)}
        </span>}>
        {list.length ? <MarketTable g={g} list={list} onOpen={open} /> : <Empty icon="watchlist">Keine passenden Spieler gefunden.</Empty>}
      </DashBox>

      <DashBox title="Auffällig" icon="trophy">
        <div className="dsec">Stärkster Spieler mit auslaufendem Vertrag</div>
        {lists.contract[0] ? <PlayerRow p={lists.contract[0]} sub={g.clubs[lists.contract[0].clubId]?.shortName} value={lists.contract[0].overall} onClick={() => open(lists.contract[0].id)} /> : <div className="dnote">–</div>}
        <div className="dsec">Größtes Talent der Liga</div>
        {lists.young[0] ? <PlayerRow p={lists.young[0]} sub={`${lists.young[0].age} J. · ${g.clubs[lists.young[0].clubId]?.shortName}`} value={lists.young[0].overall} onClick={() => open(lists.young[0].id)} /> : <div className="dnote">–</div>}
        <div className="dsec">Bester für {GROUP_DE[weakest.k]}</div>
        {lists.need[0] ? <PlayerRow p={lists.need[0]} sub={g.clubs[lists.need[0].clubId]?.shortName} value={lists.need[0].overall} onClick={() => open(lists.need[0].id)} /> : <div className="dnote">–</div>}
        <div className="dnote mt8">Eine eigene Merkliste mit Scouting-Berichten folgt in einem späteren Ausbau.</div>
      </DashBox>

      <NeedsBox g={g} />
      {modal}
    </DashPage>
  );
}

// --- AKTIVE VERHANDLUNGEN ---------------------------------------------------
export function VerhandlungenView({ g }: { g: Game }) {
  const club = g.clubs[g.managedClubId];
  const { open, modal } = usePlayerModal(g);
  const news = g.messages.filter((m) => m.category === 'transfer' || m.category === 'contract');
  const moves = Object.values(g.players).flatMap((p) => (p.history?.transfers ?? [])
    .filter((t) => t.toClub === club.name || t.fromClub === club.name).map((t) => ({ p, t })))
    .sort((a, b) => b.t.date.localeCompare(a.t.date));
  const tx = club.finances.transactions ?? [];
  const spent = Math.abs(tx.filter((t) => t.category === 'transfer_expense').reduce((s, t) => s + t.amount, 0));
  const earned = tx.filter((t) => t.category === 'transfer_income').reduce((s, t) => s + t.amount, 0);
  const ownListed = squadOf(g).filter((p) => p.transferListed);
  const unsettled = squadOf(g).filter((p) => p.transferListed || p.contract.satisfaction < 60 || monthsUntil(g.calendar.currentDate, p.contract.expiryDate) <= 12)
    .sort((a, b) => a.contract.satisfaction - b.contract.satisfaction);

  return (
    <DashPage>
      <DashBox title="Transfer- und Vertragsmeldungen" icon="negotiations" span={2} right={`${news.length} Meldungen`}>
        {news.length ? news.map((m) => (
          <div key={m.id} className="dlist-row">
            <span className="meta" style={{ minWidth: 150 }}>{CalendarEngine.formatDate(m.date)}</span>
            <span className="grow"><b style={{ fontWeight: m.read ? 600 : 900 }}>{m.subject}</b><span className="dnote" style={{ display: 'block' }}>{m.shortText}</span></span>
          </div>
        )) : <Empty icon="negotiations">Keine laufenden Gespräche. Angebote gibst du im Transfermarkt ab.</Empty>}
      </DashBox>

      <DashBox title="Wechselkandidaten im eigenen Kader" icon="contracts" span={2} right={`${unsettled.length} Spieler`}>
        {unsettled.length ? unsettled.map((p) => (
          <PlayerRow key={p.id} p={p} onClick={() => open(p.id)} value={Math.round(p.contract.satisfaction)}
            sub={[p.transferListed && 'auf der Transferliste', p.contract.satisfaction < 60 && 'unzufrieden – für andere Vereine verfügbar',
              monthsUntil(g.calendar.currentDate, p.contract.expiryDate) <= 12 && `Vertrag endet ${CalendarEngine.formatDate(p.contract.expiryDate)}`].filter(Boolean).join(' · ')} />
        )) : <Empty icon="contracts">Alle Spieler sind zufrieden und vertraglich gebunden.</Empty>}
        <div className="dnote mt8">Spieler mit einer Vertragszufriedenheit unter 60 können von anderen Vereinen abgeworben werden.</div>
      </DashBox>

      <DashBox title="Transferbilanz" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtDM(earned)} label="Einnahmen" color="var(--green)" />
          <Kpi value={fmtDM(spent)} label="Ausgaben" color="var(--red)" />
        </div>
        <KV k="Saldo" v={fmtDM(earned - spent)} strong color={earned - spent >= 0 ? 'var(--green)' : 'var(--red)'} />
        <KV k="Eigene Spieler auf der Transferliste" v={ownListed.length} />
        {ownListed.slice(0, 3).map((p) => <PlayerRow key={p.id} p={p} value={fmtPrice(p.contract.transferValue)} color="var(--text-1)" onClick={() => open(p.id)} />)}
      </DashBox>

      <DashBox title="Wechsel des Vereins" icon="transfers" right={`${moves.length}`}>
        {moves.length ? moves.slice(0, 10).map(({ p, t }) => (
          <PlayerRow key={p.id + t.date} p={p} onClick={() => open(p.id)}
            sub={t.toClub === club.name ? `von ${t.fromClub}` : `zu ${t.toClub}`}
            value={fmtDM(t.fee)} color={t.toClub === club.name ? 'var(--red)' : 'var(--green)'} />
        )) : <Empty icon="transfers">Noch keine Wechsel.</Empty>}
      </DashBox>
      {modal}
    </DashPage>
  );
}
