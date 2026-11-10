import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import PlayerModal from '../../components/PlayerModal';
import { CalendarEngine } from '../../engine/calendar';
import { getAvailablePlayers } from '../../engine/transfers';
import { activeTalks, sellerOf, startTalk, talkBlocker, TransferTalk } from '../../game/transferTalks';
import { TransferTalkModal } from './TransferTalkModal';
import { Game } from '../../game/state';
import { Player } from '../../types';
import { YouthScoutBox } from './YouthScoutBox';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, vColor, fmtPrice, fmtWage, wageHead, wageUnit } from '../../ui/format';
import { GROUP_DE, PlayerRow, ScoutStars, avg, groupOf, monthsUntil, scoutMid, squadOf } from '../shared';
import { useState } from 'react';
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import { InfoTip } from '../../ui/InfoTip';
import { PlayerSearchModal } from './search/PlayerSearchModal';
import { TransferWindowModal } from './window/TransferWindowModal';
import { activeCount, runSearch, type SearchCriteria } from '../../game/playerSearch';
import PosBadge from '../../components/PosBadge';
import FaceThumb from '../../components/FaceThumb';

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

/** Verhandlung öffnen (neu starten oder fortsetzen). */
function useTalk(g: Game, onChange: () => void) {
  const [talkId, setTalkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const talk = talkId ? (g.transferTalks ?? []).find((t) => t.id === talkId) : undefined;
  const open = (playerId: string) => {
    const r = startTalk(g, playerId);
    if (typeof r === 'string') { setErr(r); return; }
    setErr(null); setTalkId(r.id); onChange();
  };
  const modal = talk ? <TransferTalkModal g={g} talk={talk} onClose={() => setTalkId(null)} onChange={onChange} /> : null;
  return { open, openTalk: (t: TransferTalk) => setTalkId(t.id), modal, err };
}

function TalkButton({ g, p, onTalk }: { g: Game; p: Player; onTalk: (id: string) => void }) {
  const running = activeTalks(g).some((t) => t.playerId === p.id);
  const block = running ? null : talkBlocker(g, p);
  return <button className={`dchip ${block ? '' : 'on'}`} title={block ?? undefined} disabled={!!block} onClick={() => onTalk(p.id)}>{running ? 'Fortsetzen' : 'Verhandeln'}</button>;
}

function MarketTable({ g, list, onOpen, action }: { g: Game; list: Player[]; onOpen: (id: string) => void; action?: (p: Player) => React.ReactNode }) {
  const today = g.calendar.currentDate;
  return (
    <table className="dtable rl-players">
      <thead><tr>
        <th>Name</th><th>Verein</th><th className="ctr">Pos</th><th className="num">Alter</th><th className="num">Stärke</th>
        <th>Potenzial<InfoTip k="potenzial" /></th><th className="num">Vertrag</th><th className="num">{wageHead()}</th><th className="num">Wert<InfoTip k="marktwert" /></th>{action && <th />}
      </tr></thead>
      <tbody>
        {list.map((p) => {
          const c = g.clubs[p.clubId];
          return (
            <tr key={p.id} data-pid={p.id} className="clickable" onClick={() => onOpen(p.id)}>
              <td className="nowrap rl-name"><span className="tm-name"><FaceThumb p={p} club={c} size={26} /><span>{p.fullName}</span></span></td>
              <td className="nowrap"><ClubLink id={p.clubId}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>{c && <ClubCrest club={c} size={24} />}{c?.shortName}</span></ClubLink></td>
              <td className="ctr"><PosBadge p={p} /></td>
              <td className="num">{p.age}</td>
              <td className="num"><b style={{ color: vColor(p.overall) }}>{p.overall}</b></td>
              <td className="nowrap"><ScoutStars p={p} /></td>
              <td className="num muted">{monthsUntil(today, p.contract.expiryDate)} M.</td>
              <td className="num">{fmtWage(p.contract.weeklyWage, { unit: false })}</td>
              <td className="num">{fmtPrice(p.contract.transferValue)}</td>
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
    <DashBox title="Kaderbedarf" info="kaderbedarf" icon="dashKader">
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
  const [grp, setGrp] = useSubTab<string>('transfers.markt', 'all');
  const { open, modal } = usePlayerModal(g);
  const talk = useTalk(g, onDone);
  const [search, setSearch] = useState<SearchCriteria | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bilanz, setBilanz] = useState(false);
  const all = search ? runSearch(g, search) : getAvailablePlayers(g.players, g.managedClubId);
  const list = all.filter((p) => grp === 'all' || groupOf(p) === grp).slice(0, search ? 200 : 60);
  const fin = club.finances;
  const wages = squadOf(g).reduce((s, p) => s + p.contract.weeklyWage, 0);


  // Drittes Menü: Mannschaftsteile (ui/SubTabs); Suche/Transferbilanz bleiben im Box-Kopf
  const tabs = [{ id: 'all', label: 'Alle', count: all.length },
    ...GROUPS.map((k) => ({ id: k, label: GROUP_DE[k], count: all.filter((p) => groupOf(p) === k).length }))];

  return (
    <SubTabsPage tabs={tabs} active={grp} onSelect={setGrp}>
    <DashPage>
      <DashBox title={(search ? 'Suchergebnis' : 'Transfermarkt') + (grp === 'all' ? '' : ` · ${GROUP_DE[grp]}`)} span={2} rows={2} flush
        right={<span className="dbtnrow">
          <button className={`dchip ${search ? 'on' : ''}`} onClick={() => setSearchOpen(true)}>Spieler suchen{search ? ` · ${activeCount(search)}` : ''}</button>
          {search && <button className="dchip" onClick={() => setSearch(null)} title="Wieder alle abgabebereiten Spieler zeigen">Suche aufheben</button>}
          <button className="dchip" onClick={() => setBilanz(true)}>Transferbilanz</button>
        </span>}>
        {list.length ? <MarketTable g={g} list={list} onOpen={open}
          action={(p) => <TalkButton g={g} p={p} onTalk={talk.open} />} />
          : <Empty icon="transfers">{search ? 'Keine Spieler zu deiner Suche – lockere die Vorgaben.' : 'Derzeit keine Spieler auf dem Markt.'}</Empty>}
      </DashBox>

      <DashBox title="Budget" info="transferbudget" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtPrice(fin.transferBudget)} label="Transferbudget" />
          <Kpi value={fmtWage(Math.max(0, fin.wageBudget - wages), { unit: false })} label={`Gehaltsspielraum / ${wageUnit()}`} info="gehaltsbudget" />
        </div>
        <KV k="Kontostand" v={fmtDM(fin.balance)} />
        <KV k={`Gehälter / Gehaltsbudget (${wageUnit()})`} v={`${fmtWage(wages, { unit: false })} / ${fmtWage(fin.wageBudget, { unit: false })}`} />
        {talk.err && <div className="dnote mt8" style={{ color: 'var(--red)', fontWeight: 700 }}>{talk.err}</div>}
        <div className="dnote mt8">Verhandle erst mit dem Verein über die Ablöse, dann mit dem Spieler über Gehalt und Versprechen. Die Forderung des Vereins kennst du nur ungefähr. Alle Spieler der Liga findest du in der Beobachtungsliste.</div>
      </DashBox>

      <NeedsBox g={g} />
      {modal}
      {talk.modal}
      {searchOpen && <PlayerSearchModal g={g} initial={search} onClose={() => setSearchOpen(false)} onSearch={(c) => { setSearch(c); setGrp('all'); setSearchOpen(false); }} />}
      {bilanz && <TransferWindowModal g={g} onClose={() => setBilanz(false)} />}
    </DashPage>
    </SubTabsPage>
  );
}

// --- BEOBACHTUNGSLISTE (Scouting-Vorschläge aus der Liga) --------------------
type ScoutMode = 'contract' | 'young' | 'need';
export function BeobachtungView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const [mode, setMode] = useSubTab<ScoutMode>('transfers.beobachtung', 'need');
  const { open, modal } = usePlayerModal(g);
  const talk = useTalk(g, onChange);
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
    <SubTabsPage active={mode} onSelect={setMode}
      tabs={(['need', 'contract', 'young'] as ScoutMode[]).map((m) => ({ id: m, label: label[m], count: lists[m].length }))}>
    <DashPage>
      <DashBox title={`Scouting-Vorschläge · ${label[mode]}`} info="beobachtung" span={2} rows={2} flush>
        {list.length ? <MarketTable g={g} list={list} onOpen={open} action={(p) => <TalkButton g={g} p={p} onTalk={talk.open} />} /> : <Empty icon="watchlist">Keine passenden Spieler gefunden.</Empty>}
      </DashBox>

      <DashBox title="Auffällig" icon="trophy">
        <div className="dsec">Stärkster Spieler mit auslaufendem Vertrag</div>
        {lists.contract[0] ? <PlayerRow p={lists.contract[0]} sub={g.clubs[lists.contract[0].clubId]?.shortName} value={lists.contract[0].overall} onClick={() => open(lists.contract[0].id)} /> : <div className="dnote">–</div>}
        <div className="dsec">Größtes Talent der Liga</div>
        {lists.young[0] ? <PlayerRow p={lists.young[0]} sub={`${lists.young[0].age} J. · ${g.clubs[lists.young[0].clubId]?.shortName}`} value={lists.young[0].overall} onClick={() => open(lists.young[0].id)} /> : <div className="dnote">–</div>}
        <div className="dsec">Bester für {GROUP_DE[weakest.k]}</div>
        {lists.need[0] ? <PlayerRow p={lists.need[0]} sub={g.clubs[lists.need[0].clubId]?.shortName} value={lists.need[0].overall} onClick={() => open(lists.need[0].id)} /> : <div className="dnote">–</div>}
        {talk.err && <div className="dnote mt8" style={{ color: 'var(--red)', fontWeight: 700 }}>{talk.err}</div>}
      </DashBox>

      <YouthScoutBox g={g} onChange={onChange} />
      {modal}
      {talk.modal}
    </DashPage>
    </SubTabsPage>
  );
}

// --- AKTIVE VERHANDLUNGEN ---------------------------------------------------
export function VerhandlungenView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const club = g.clubs[g.managedClubId];
  const { open, modal } = usePlayerModal(g);
  const talk = useTalk(g, onChange);
  const talks = [...(g.transferTalks ?? [])].sort((a, b) => b.lastAction.localeCompare(a.lastAction));
  const PHASE: Record<string, string> = { club: 'Gespräch mit dem Verein', player: 'Gespräch mit dem Spieler', agreed: 'Einigung – Wechsel im nächsten Fenster', done: 'abgeschlossen', failed: 'gescheitert' };
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
      <DashBox title="Verhandlungen & Meldungen" icon="negotiations" span={2} right={`${activeTalks(g).length} laufend`}>
        {talks.map((t) => {
          const pl = g.players[t.playerId];
          return (
            <div key={t.id} className="dlist-row clickable" onClick={() => talk.openTalk(t)}>
              <PosBadge p={pl} compact />
              <span className="grow"><b>{pl?.fullName ?? 'Spieler'}</b><span className="muted"> · <ClubLink id={t.sellerId}>{sellerOf(g, t.sellerId)?.shortName}</ClubLink> · {PHASE[t.phase]}</span></span>
              <span className="val" style={{ color: t.phase === 'failed' ? 'var(--red)' : t.phase === 'done' || t.phase === 'agreed' ? 'var(--green)' : 'var(--accent)' }}>{t.phase === 'club' && t.round ? fmtPrice(t.currentAsk) : t.pkg ? fmtPrice(t.pkg.fee) : ''}</span>
            </div>
          );
        })}
        {talks.length > 0 && <div className="dsec">Meldungen</div>}
        {news.length ? news.map((m) => (
          <div key={m.id} className="dlist-row">
            <span className="meta" style={{ minWidth: 150 }}>{CalendarEngine.formatDate(m.date)}</span>
            <span className="grow"><b style={{ fontWeight: m.read ? 600 : 900 }}>{m.subject}</b><span className="dnote" style={{ display: 'block' }}>{m.shortText}</span></span>
          </div>
        )) : talks.length ? null : <Empty icon="negotiations">Keine laufenden Gespräche. Verhandeln kannst du im Transfermarkt und in der Beobachtungsliste.</Empty>}
      </DashBox>

      <DashBox title="Wechselkandidaten im eigenen Kader" info="wechselgefahr" icon="contracts" span={2} right={`${unsettled.length} Spieler`}>
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
      {talk.modal}
    </DashPage>
  );
}
