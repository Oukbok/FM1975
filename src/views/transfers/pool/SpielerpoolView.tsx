// =============================================================================
// TRANSFERS › SPIELERPOOL (Wunsch Pascal): alle Spieler der Welt
// -----------------------------------------------------------------------------
// Voreinstellung „Weltbeste“ (nach geschätzter Stärke), Seiten zu 100 Spielern,
// Filter in der rechten Spalte, Auswahl → Steckbrief mit Scouting/Verhandeln.
// Unbekannte Spieler zeigen nur geschätzte Spannen (game/playerPool.ts).
// =============================================================================
import { useMemo, useState } from 'react';
import PlayerAvatar from '../../../components/PlayerAvatar';
import PlayerModal from '../../../components/PlayerModal';
import PosBadge from '../../../components/PosBadge';
import { NatFlag } from '../../../components/competition/CountryFlag';
import { estimate, knowCtx, knowledge, knowWord, poolRows, type Estimate, type PoolRow } from '../../../game/playerPool';
import { activeJob, jobProgress, jobTerms, queueScouting, queuedJob, scoutReport, scoutSlots } from '../../../game/scoutingGame';
import type { Game } from '../../../game/state';
import { activeTalks, startTalk, talkBlocker, type TransferTalk } from '../../../game/transferTalks';
import { countryName, materializeWorldPlayer } from '../../../game/worldPool';
import { POSITION_GROUPS, type Player } from '../../../types';
import { DashBox, DashPage, Empty, KV } from '../../../ui/DashPage';
import { fmtPrice } from '../../../ui/format';
import Select from '../../../ui/Select';
import Seg from '../../../ui/Seg';
import { SubTabsPage, useSubTab } from '../../../ui/SubTabs';
import { TransferTalkModal } from '../TransferTalkModal';
import { useMultiSelect } from '../../../ui/useMultiSelect';
import { ClubCell, Face, KnowBar, OvEst, StarEst, ValueEst, leagueLabel } from './poolParts';

type Preset = 'best' | 'talents' | 'youth' | 'home' | 'abroad' | 'scouted';
type SortKey = 'ov' | 'st' | 'age' | 'value' | 'k';
interface Filter { name: string; grp: string; ageMin: number; ageMax: number; country: string; level: number; ovMin: number; stMin: number; know: number }
const EMPTY: Filter = { name: '', grp: '', ageMin: 15, ageMax: 40, country: '', level: 0, ovMin: 0, stMin: 0, know: 0 };
const PAGE = 100;
const PRESET_LABEL: Record<Preset, string> = { best: 'Weltbeste', talents: 'Talente bis 21', youth: 'Jugend bis 18', home: 'Deutschland', abroad: 'Ausland', scouted: 'Gescoutet' };
const PRESET_SORT: Record<Preset, SortKey> = { best: 'ov', talents: 'st', youth: 'st', home: 'ov', abroad: 'ov', scouted: 'ov' };

interface Item { r: PoolRow; e: Estimate }

export function SpielerpoolView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const [preset, setPreset] = useSubTab<Preset>('transfers.pool', 'best');
  const [f, setF] = useState<Filter>(EMPTY);
  const [sort, setSort] = useState<SortKey | null>(null);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [talkId, setTalkId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const today = g.calendar.currentDate;
  const { rows, clubs } = poolRows(g);
  const items = useMemo<Item[]>(() => {
    const ctx = knowCtx(g);
    return rows.filter((r) => r.clubId !== g.managedClubId).map((r) => ({ r, e: estimate(r, knowledge(ctx, r)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, today, g.scouting?.reports && Object.keys(g.scouting.reports).length, (g.transferTalks ?? []).length]);

  const key = sort ?? PRESET_SORT[preset];
  const list = useMemo(() => {
    const name = f.name.trim().toLowerCase();
    const out = items.filter(({ r, e }) => {
      if (preset === 'talents' && r.age > 21) return false;
      if (preset === 'youth' && r.age > 18) return false;
      if (preset === 'home' && r.country !== 'Deutschland') return false;
      if (preset === 'abroad' && r.country === 'Deutschland') return false;
      if (preset === 'scouted' && !(g.scouting?.reports[r.id] || activeJob(g, r.id))) return false;
      if (name && !r.name.toLowerCase().includes(name)) return false;
      if (f.grp && POSITION_GROUPS[r.pos] !== f.grp) return false;
      if (r.age < f.ageMin || r.age > f.ageMax) return false;
      if (f.country === 'foreign' ? r.country === 'Deutschland' : f.country && r.country !== f.country) return false;
      if (f.level && (f.level === 3 ? r.level < 3 : r.level !== f.level)) return false;
      if (f.ovMin && e.ovHi < f.ovMin) return false;
      if (f.stMin && e.stHi < f.stMin) return false;
      if (f.know === 1 && e.k < 0.2) return false;
      if (f.know === 2 && e.k < 0.45) return false;
      return true;
    });
    const val = (x: Item) => key === 'ov' ? x.e.ov : key === 'st' ? x.e.st * 20 + x.e.ov / 10 : key === 'age' ? -x.r.age : key === 'value' ? x.e.value : x.e.k;
    return out.sort((a, b) => val(b) - val(a) || b.e.ov - a.e.ov);
  }, [items, preset, f, key, g]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const shown = list.slice(pg * PAGE, pg * PAGE + PAGE);
  const ms = useMultiSelect(shown.map((x) => x.r.id));
  const cur = sel ? items.find((x) => x.r.id === sel) : undefined;
  const set = (patch: Partial<Filter>) => { setF({ ...f, ...patch }); setPage(0); };
  const head = (k: SortKey, label: string, cls = 'num') => (
    <th className={`${cls} clickable ${key === k ? 'sorted' : ''}`} onClick={() => { setSort(k); setPage(0); }}>{label}</th>
  );
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
  const prof = profile ? g.players[profile] ?? g.youthPlayers?.[profile] : undefined;

  return (
    <SubTabsPage active={preset} onSelect={(p) => { setPreset(p); setSort(null); setPage(0); }}
      tabs={(Object.keys(PRESET_LABEL) as Preset[]).map((p) => ({ id: p, label: PRESET_LABEL[p] }))}>
      <DashPage>
        <DashBox title={`Spielerpool · ${PRESET_LABEL[preset]}`} info="spielerpool" span={2} rows={2} flush
          right={<span className="dbtnrow">
            {ms.multi && <span className="muted">{ms.sel.size} ausgewählt</span>}
            <span className="muted">{list.length.toLocaleString('de-DE')} Spieler</span>
            <button className="dchip" disabled={pg === 0} onClick={() => setPage(pg - 1)} aria-label="Vorige Seite">‹</button>
            <span className="muted">Seite {pg + 1} / {pages}</span>
            <button className="dchip" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)} aria-label="Nächste Seite">›</button>
          </span>}>
          {shown.length ? (
            <table className="dtable rl-players pool-table" {...ms.attr}>
              <thead><tr>
                <th className="num w-xs">#</th><th>Name</th><th>Verein</th><th className="ctr w-s">Land</th><th className="ctr">Pos</th>{head('age', 'Alter')}
                {head('ov', 'Stärke')}{head('st', 'Potenzial', '')}{head('value', 'Wert', 'num')}{head('k', 'Bekannt', 'ctr')}
              </tr></thead>
              <tbody>
                {shown.map(({ r, e }, i) => (
                  <tr key={r.id} data-pid={r.id} className={`clickable ${ms.has(r.id) ? 'msel' : sel === r.id ? 'sel' : ''}`}
                    onMouseDown={ms.onMouseDown} onClick={(ev) => { if (!ms.click(ev, r.id)) setSel(r.id); }} onDoubleClick={() => r.player && setProfile(r.id)}>
                    <td className="num muted">{pg * PAGE + i + 1}</td>
                    <td className="nowrap rl-name"><span className="tm-name"><Face r={r} /><span>{r.name}</span></span></td>
                    <td className="nowrap"><ClubCell g={g} id={r.clubId} world={clubs} /></td>
                    <td className="ctr"><NatFlag nat={r.nat} /></td>
                    <td className="ctr"><PosBadge pos={r.pos} /></td>
                    <td className="num">{r.age}</td>
                    <td className="num nowrap"><OvEst e={e} /></td>
                    <td className="nowrap"><StarEst e={e} /></td>
                    <td className="num nowrap"><ValueEst e={e} /></td>
                    <td className="ctr"><KnowBar k={e.k} />{activeJob(g, r.id) ? <span className="pool-job" title="Scout unterwegs" /> : queuedJob(g, r.id) >= 0 && <span className="pool-job wait" title="Scouting vorgemerkt" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon="transfers">Keine Spieler zu diesen Vorgaben.</Empty>}
        </DashBox>

        <DashBox title="Filter" right={<button className="dchip" onClick={() => { setF(EMPTY); setPage(0); }}>Zurücksetzen</button>}>
          <div className="pool-filter">
            <label>Name<input className="ed-in pool-in" value={f.name} placeholder="Suchen" onChange={(e) => set({ name: e.target.value })} /></label>
            <label>Position<Seg size="s" value={f.grp} onChange={(v) => set({ grp: v })}
              options={[{ v: '', label: 'Alle' }, { v: 'GK', label: 'TW' }, { v: 'DEF', label: 'ABW' }, { v: 'MID', label: 'MF' }, { v: 'ATT', label: 'ANG' }]} /></label>
            <label>Alter<span className="pool-pair">
              <Select size="s" width={80} value={f.ageMin} onChange={(v) => set({ ageMin: Number(v) })} options={Array.from({ length: 26 }, (_, i) => ({ value: 15 + i, label: String(15 + i) }))} />
              <span>bis</span>
              <Select size="s" width={80} value={f.ageMax} onChange={(v) => set({ ageMax: Number(v) })} options={Array.from({ length: 26 }, (_, i) => ({ value: 15 + i, label: String(15 + i) }))} />
            </span></label>
            <label>Land<Select size="s" width={200} value={f.country} onChange={(v) => set({ country: v })}
              options={[{ value: '', label: 'Alle Länder' }, { value: 'Deutschland', label: 'Deutschland' }, { value: 'foreign', label: 'Ausland' }, ...countries.map((c) => ({ value: c, label: countryName(c) }))]} /></label>
            <label>Liga<Seg size="s" value={f.level} onChange={(v) => set({ level: v })}
              options={[{ v: 0, label: 'Alle' }, { v: 1, label: '1.' }, { v: 2, label: '2.' }, { v: 3, label: 'tiefer' }]} /></label>
            <label>Stärke ab<Select size="s" width={90} value={f.ovMin} onChange={(v) => set({ ovMin: Number(v) })}
              options={[0, 50, 55, 60, 65, 70, 75, 80, 85, 90].map((x) => ({ value: x, label: x ? String(x) : 'egal' }))} /></label>
            <label>Potenzial ab<Select size="s" width={90} value={f.stMin} onChange={(v) => set({ stMin: Number(v) })}
              options={[0, 2, 2.5, 3, 3.5, 4, 4.5].map((x) => ({ value: x, label: x ? `${String(x).replace('.', ',')} ★` : 'egal' }))} /></label>
            <label>Bekanntheit<Seg size="s" value={f.know} onChange={(v) => set({ know: v })}
              options={[{ v: 0, label: 'Alle' }, { v: 1, label: 'ab vage' }, { v: 2, label: 'ab bekannt' }]} /></label>
          </div>
        </DashBox>

        <DashBox title="Steckbrief" info="bekanntheit">
          {cur ? <Steckbrief g={g} it={cur} onScout={scout} onTalk={negotiate} onProfile={(id) => setProfile(id)} />
            : <Empty icon="watchlist">Wähle einen Spieler aus der Liste. Doppelklick öffnet das Profil, sofern er bei einem Verein mit vollem Kader spielt.</Empty>}
          {msg && <div className="dnote mt8 pool-msg">{msg}</div>}
        </DashBox>
        {prof && <PlayerModal player={prof} club={g.clubs[prof.clubId]} today={today} season={g.season} onClose={() => setProfile(null)} />}
        {talk && <TransferTalkModal g={g} talk={talk} onClose={() => setTalkId(null)} onChange={onChange} />}
      </DashPage>
    </SubTabsPage>
  );
}

function Steckbrief({ g, it, onScout, onTalk, onProfile }: { g: Game; it: Item; onScout: (r: PoolRow) => void; onTalk: (r: PoolRow) => void; onProfile: (id: string) => void }) {
  const { r, e } = it;
  const job = activeJob(g, r.id);
  const rep = scoutReport(g, r.id);
  const terms = jobTerms(g, r.country !== 'Deutschland', r.youth);
  const running = activeTalks(g).some((t) => t.playerId === r.id);
  const block = r.kind === 'youth' ? 'Jugendspieler holst du über das Jugend-Scouting (Beobachtung).' : r.player && !running ? talkBlocker(g, r.player) : null;
  const who = r.player ?? ({ id: r.id, face: r.face, dateOfBirth: `${r.born}-07-01`, age: r.age, fullName: r.name, nationality: r.nat } as unknown as Player);
  const full = (g.scouting?.jobs.length ?? 0) >= scoutSlots(g);
  const waiting = queuedJob(g, r.id) >= 0;
  return (
    <div className="pool-card">
      <div className="pool-card-head">
        <span className="pool-card-face"><PlayerAvatar player={who} size={64} photoOnly /></span>
        <span className="grow">
          <b className="pool-card-name">{r.name}</b>
          <span className="muted">{r.nat} · {r.age} J. · {r.foot === 'left' ? 'links' : r.foot === 'both' ? 'beidfüßig' : 'rechts'} · {r.height} cm</span>
          <span className="muted">{leagueLabel(r)}</span>
        </span>
        <PosBadge pos={r.pos} />
      </div>
      <KV k="Bekanntheit" v={<><KnowBar k={e.k} /> {knowWord(e.k)}</>} />
      <KV k="Stärke" v={<OvEst e={e} />} />
      <KV k="Potenzial" v={<StarEst e={e} />} />
      <KV k="Marktwert" v={<ValueEst e={e} />} />
      <KV k="Scouting" v={job ? `unterwegs · ${Math.round(jobProgress(g, job) * 100)} %` : queuedJob(g, r.id) >= 0 ? `vorgemerkt · Platz ${queuedJob(g, r.id) + 1}` : rep ? 'Bericht liegt vor' : '–'} />
      <div className="dbtnrow mt8">
        <button className="dchip on" disabled={!!job || waiting} title={`${terms.days} Tage · Reisekosten ${fmtPrice(terms.cost)}${full ? ' · alle Scouts unterwegs: wird vorgemerkt' : ''}`} onClick={() => onScout(r)}>
          {job ? 'Scout unterwegs' : waiting ? 'Vorgemerkt' : `${full ? 'Vormerken' : 'Scouten'} · ${terms.days} T. · ${fmtPrice(terms.cost)}`}
        </button>
        <button className="dchip" disabled={!!block} title={block ?? undefined} onClick={() => onTalk(r)}>{running ? 'Fortsetzen' : 'Verhandeln'}</button>
        {r.player && <button className="dchip" onClick={() => onProfile(r.id)}>Profil</button>}
      </div>
      {block && <div className="dnote mt8">{block}</div>}
    </div>
  );
}
