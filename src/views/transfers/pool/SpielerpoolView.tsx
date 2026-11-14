// =============================================================================
// TRANSFERS › SPIELERPOOL (Wunsch Pascal): alle Spieler der Welt
// -----------------------------------------------------------------------------
// Voreinstellung „Weltbeste“ (nach geschätzter Stärke), Seiten zu 100 Spielern.
// Gleiche Tabelle wie der Transfermarkt (MarketTable, Wunsch Pascal), Filter-Popup
// in der Reiterleiste, Scouten/Verhandeln direkt in der Zeile, Klick → Profil.
// Unbekannte Spieler zeigen nur geschätzte Spannen (game/playerPool.ts).
// =============================================================================
import { useMemo, useState } from 'react';
import PlayerModal from '../../../components/PlayerModal';
import { poolRows, type PoolRow } from '../../../game/playerPool';
import { marketInfoRows } from '../../../game/marketView';
import { activeJob, jobProgress, jobTerms, queueScouting, queuedJob, scoutSlots } from '../../../game/scoutingGame';
import { homeCountryOf, type Game } from '../../../game/state';
import { activeTalks, startTalk, talkBlocker, type TransferTalk } from '../../../game/transferTalks';
import { countryName, materializeWorldPlayer, worldPreviewPlayer } from '../../../game/worldPool';
import type { Player } from '../../../types';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { fmtPrice } from '../../../ui/format';
import { SubTabsPage, useSubTab } from '../../../ui/SubTabs';
import { TransferTalkModal } from '../TransferTalkModal';
import { MarketTable, sortRows, type MarketSort, type MarketSortKey } from '../MarketTable';
import { EMPTY_FILTER, FilterButton, filterCount, passes, type MarketFilter } from '../MarketFilter';

type Preset = 'best' | 'talents' | 'youth' | 'home' | 'abroad' | 'scouted';
const PAGE = 100;
const PRESET_LABEL: Record<Preset, string> = { best: 'Weltbeste', talents: 'Talente bis 21', youth: 'Jugend bis 18', home: 'Deutschland', abroad: 'Ausland', scouted: 'Gescoutet' };
const PRESET_SORT: Record<Preset, MarketSortKey> = { best: 'ability', talents: 'potential', youth: 'potential', home: 'ability', abroad: 'ability', scouted: 'ability' };


export function SpielerpoolView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const [preset, setPreset] = useSubTab<Preset>('transfers.pool', 'best');
  const [f, setF] = useState<MarketFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<MarketSort | null>(null);
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState<string | null>(null);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const today = g.calendar.currentDate;
  const { rows, clubs } = poolRows(g);
  const all = useMemo(() => rows.filter((r) => r.clubId !== g.managedClubId), [rows, g.managedClubId]);
  const info = useMemo(() => marketInfoRows(g, all),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, today, g.scouting?.reports && Object.keys(g.scouting.reports).length, (g.transferTalks ?? []).length]);

  const key: MarketSort = sort ?? { k: PRESET_SORT[preset], dir: -1 };
  const list = useMemo(() => {
    const out = all.filter((r) => {
      if (preset === 'talents' && r.age > 21) return false;
      if (preset === 'youth' && r.age > 18) return false;
      if (preset === 'home' && r.country !== 'Deutschland') return false;
      if (preset === 'abroad' && r.country === 'Deutschland') return false;
      if (preset === 'scouted' && !(g.scouting?.reports[r.id] || activeJob(g, r.id))) return false;
      return passes(f, r, info.get(r.id), homeCountryOf(g).toUpperCase());
    });
    return sortRows(out, info, key);
  }, [all, info, preset, f, key.k, key.dir, g]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const shown = list.slice(pg * PAGE, pg * PAGE + PAGE);
  const countries = useMemo(() => [...new Set(rows.map((r) => r.country))].filter((c) => c !== 'Deutschland').sort((a, b) => countryName(a).localeCompare(countryName(b))), [rows]);

  const negotiate = (r: PoolRow) => {
    let p: Player | null | undefined = r.player;
    if (r.kind === 'world') p = materializeWorldPlayer(g, r.id);
    if (!p) { setMsg('Spieler nicht gefunden.'); return; }
    const res = startTalk(g, p.id);
    if (typeof res === 'string') { setMsg(res); return; }
    setMsg(null); setTalkId(res.id); onChange();
  };
  const scout = (r: PoolRow) => {
    const c = clubs.get(r.clubId);
    const res = queueScouting(g, { id: r.id, name: r.name, clubName: g.clubs[r.clubId]?.name ?? c?.name ?? '', abroad: r.country !== 'Deutschland', youth: r.youth });
    setMsg(res === 'started' ? `Ein Scout ist zu ${r.name} unterwegs.` : res === 'queued' ? `${r.name} ist vorgemerkt – der nächste freie Scout fährt los.` : res);
    onChange();
  };
  const talk: TransferTalk | undefined = talkId ? (g.transferTalks ?? []).find((t) => t.id === talkId) : undefined;
  const prof = profile ? g.players[profile] ?? g.youthPlayers?.[profile] ?? worldPreviewPlayer(g, profile) : undefined;
  const full = (g.scouting?.jobs.length ?? 0) >= scoutSlots(g);

  return (
    <SubTabsPage active={preset} onSelect={(p) => { setPreset(p); setSort(null); setPage(0); }}
      tabs={(Object.keys(PRESET_LABEL) as Preset[]).map((p) => ({ id: p, label: PRESET_LABEL[p] }))}
      extra={<FilterButton f={f} onChange={(x) => { setF(x); setPage(0); }} pool countries={countries} />}>
      <DashPage>
        <DashBox title={`Spielerpool · ${PRESET_LABEL[preset]}`} info="spielerpool" span={3} rows={2} flush className="mk-box-wide"
          right={<span className="dbtnrow">
            <button className="dchip" disabled={pg === 0} onClick={() => setPage(pg - 1)} aria-label="Vorige Seite">‹</button>
            <span className="muted">Seite {pg + 1} / {pages}</span>
            <button className="dchip" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)} aria-label="Nächste Seite">›</button>
          </span>}>
          {shown.length ? (
            <MarketTable g={g} rows={shown} info={info} count={list.length} filtered={filterCount(f) > 0} scoutToggle={false}
              sort={key} onSort={(s) => { setSort(s); setPage(0); }} onOpen={(id) => setProfile(id)}
              extra={msg ? <span className="pool-msg">{msg}</span> : <span className="muted">Klick öffnet das Profil · Scouten verringert die Spannen</span>}
              action={(r) => {
                const job = activeJob(g, r.id);
                const waiting = queuedJob(g, r.id) >= 0;
                const terms = jobTerms(g, r.country !== 'Deutschland', r.youth);
                const running = activeTalks(g).some((t) => t.playerId === r.id);
                const block = r.kind === 'youth' ? 'Jugendspieler holst du über das Jugend-Scouting (Beobachtung).' : r.player && !running ? talkBlocker(g, r.player) : null;
                return (
                  <span className="dbtnrow">
                    <button className="dchip" disabled={!!job || waiting} title={`${terms.days} Tage · Reisekosten ${fmtPrice(terms.cost)}${full ? ' · alle Scouts unterwegs: wird vorgemerkt' : ''}`} onClick={() => scout(r)}>
                      {job ? `Scout ${Math.round(jobProgress(g, job) * 100)} %` : waiting ? 'Vorgemerkt' : full ? 'Vormerken' : 'Scouten'}
                    </button>
                    <button className="dchip" disabled={!!block} title={block ?? undefined} onClick={() => negotiate(r)}>{running ? 'Fortsetzen' : 'Verhandeln'}</button>
                  </span>
                );
              }} />
          ) : <Empty icon="transfers">Keine Spieler zu diesen Vorgaben.</Empty>}
        </DashBox>
        {prof && <PlayerModal player={prof} club={g.clubs[prof.clubId]} today={today} season={g.season} onClose={() => setProfile(null)} />}
        {talk && <TransferTalkModal g={g} talk={talk} onClose={() => setTalkId(null)} onChange={onChange} />}
      </DashPage>
    </SubTabsPage>
  );
}
