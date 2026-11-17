// =============================================================================
// JUGEND › 2. MANNSCHAFT (Wunsch Pascal, #26): Liga, Anweisungen an den Trainer
// der Amateure, Positionen trainieren, Aufstellung, Tabelle, Ergebnisse.
// Logik: game/reserveTeam.ts.
// =============================================================================
import { ClubByName } from '../../ui/LinkedText';
import { ClubLink } from '../../components/club/ClubLink';
import { useState } from 'react';
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import { ReserveSquad } from './ReserveSquad';
import type { Game } from '../../game/state';
import type { Position } from '../../types';
import { ALL_POSITIONS } from '../../types';
import {
  FOCUS_LABEL, FOCUS_TEXT, eligible, reserveState, setPosTrain, setReserveFocus, setReservePros,
  type ReserveFocus,
} from '../../game/reserveTeam';
import { reserveView } from '../../game/reserveView';
import { InfoTip } from '../../ui/InfoTip';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import Seg from '../../ui/Seg';
import Select from '../../ui/Select';
import { vColor } from '../../ui/format';
import PosBadge from '../../components/PosBadge';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import { positionSuitability } from '../../engine/positions';
import type { Screen } from '../../shell/navigation';

export function ReserveTeamView({ g, onChange, onGoto }: { g: Game; onChange?: () => void; onGoto?: (s: Screen) => void }) {
  const [, setV] = useState(0);
  const [tab, setTab] = useSubTab<'uebersicht' | 'kader'>('jugend.reserve', 'uebersicht');
  const ch = () => { setV((v) => v + 1); onChange?.(); };
  const club = g.clubs[g.managedClubId];
  const st = reserveState(g);
  if (!st) {
    return (
      <DashPage rows={1}>
        <DashBox title="2. Mannschaft" span={3}>
          <Empty icon="youth">Dein Verein hat noch keine zweite Mannschaft. Lege sie in der Akademie an (Baustein „Zweite Mannschaft“): Sie spielt in der Ligapyramide – bis 1994 höchstens in der Amateur-Oberliga, danach bis zur Regionalliga, ab 2008 bis zur 3. Liga, nie in der Liga der ersten Mannschaft.
            <div className="mt8"><button className="btn btn-primary" onClick={() => onGoto?.('akademie')}>Zur Akademie</button></div></Empty>
        </DashBox>
      </DashPage>
    );
  }
  const pros = st.pros || st.focus === 'comeback';
  const squadCount = eligible(g, club, pros).length;
  return (
    <SubTabsPage tabs={[{ id: 'uebersicht', label: 'Übersicht' }, { id: 'kader', label: 'Kader', count: squadCount }]} active={tab} onSelect={setTab}>
      {tab === 'kader' ? <ReserveSquad g={g} /> : <ReserveOverview g={g} ch={ch} />}
    </SubTabsPage>
  );
}

function ReserveOverview({ g, ch }: { g: Game; ch: () => void }) {
  const club = g.clubs[g.managedClubId];
  const st = reserveState(g)!;
  const v = reserveView(g)!;
  const own = v.rows.find((r) => r.me);
  const resName = g.simClubs[`res-${club.id}`]?.name ?? `${club.shortName} II`;
  const pool = eligible(g, club, true).sort((a, b) => a.age - b.age || b.overall - a.overall);
  const xi = st.lastXI.map(([id, p]) => ({ p: g.players[id] ?? g.youthPlayers?.[id], pos: p })).filter((x) => x.p);
  const setTrain = (i: number, patch: Partial<{ pid: string; pos: Position }>) => {
    const list = [...st.posTrain];
    list[i] = { ...list[i], ...patch } as { pid: string; pos: Position };
    setPosTrain(g, list); ch();
  };

  return (
    <DashPage className="res-page">
      <DashBox title="2. Mannschaft" info="zweitemannschaft" right={resName}>
        <KV k="Liga" v={<>{v.league}{v.tier ? ` · Ebene ${v.tier}` : ' · Amateurliga'} <InfoTip k="reserveLiga" /></>} strong />
        <KV k="Tabellenplatz" v={own?.p ? `${v.pos}. von ${v.rows.length}` : '–'} />
        <KV k="Bilanz" v={own ? `${own.w} S · ${own.d} U · ${own.l} N · ${own.gf}:${own.ga}` : '–'} />
        <KV k="Spieltag" v={`${v.played} von ${v.total}`} />
        {v.blocked ? <div className="dnote mt8 res-block">{v.blocked}</div> : <div className="dnote mt8">Meister{v.up > 1 ? ` und die besten ${v.up}` : ''} steigen auf, wenn die Ebene darüber für zweite Mannschaften offen ist.</div>}
        {v.note && <div className="dnote mt8">Letzter Saisonwechsel: {v.note}</div>}
        <div className="dnote mt8">Regel der Zeit: {v.rule}</div>
        <div className="dnote mt8">{v.cup}</div>
        {!!st.hist?.length && <div className="dnote mt8">Bisher: {st.hist.slice(-4).map((h) => `${h.season} ${h.league} ${h.pos}.`).join(' · ')}</div>}
      </DashBox>

      <DashBox title="Anweisungen">
        <Seg value={st.focus} onChange={(v: ReserveFocus) => { setReserveFocus(g, v); ch(); }} fill
          options={(Object.keys(FOCUS_LABEL) as ReserveFocus[]).map((k) => ({ v: k, label: FOCUS_LABEL[k] }))} aria-label="Schwerpunkt" />
        <div className="dnote mt8">{FOCUS_TEXT[st.focus]}</div>
        <label className="res-check mt8">
          <input type="checkbox" checked={st.pros || st.focus === 'comeback'} disabled={st.focus === 'comeback'} onChange={(e) => { setReservePros(g, e.target.checked); ch(); }} />
          Profis über 23 dürfen mitspielen
        </label>
      </DashBox>

      <DashBox title="Positionen trainieren" right={`${st.posTrain.length} / 3`}>
        <div className="dnote">Bis zu drei Spieler spielen in der zweiten Mannschaft fest auf einer Position und gewöhnen sich dort ein.</div>
        {st.posTrain.map((t, i) => {
          const p = g.players[t.pid];
          return (
            <div key={i} className="res-train">
              <Select value={t.pid} onChange={(v) => setTrain(i, { pid: v })} options={pool.map((x) => ({ value: x.id, label: `${x.fullName} (${x.naturalPosition}, ${x.age})` }))} />
              <Select value={t.pos} onChange={(v) => setTrain(i, { pos: v as Position })} options={ALL_POSITIONS.map((x) => ({ value: x, label: x }))} />
              <span className="res-fit">{p ? `Eignung ${positionSuitability(p, t.pos)}` : ''}</span>
              <button className="dchip" onClick={() => { setPosTrain(g, st.posTrain.filter((_, k) => k !== i)); ch(); }}>×</button>
            </div>
          );
        })}
        {st.posTrain.length < 3 && pool.length > 0 && (
          <button className="dchip mt8" onClick={() => { const p = pool.find((x) => !st.posTrain.some((t) => t.pid === x.id)) ?? pool[0]; setPosTrain(g, [...st.posTrain, { pid: p.id, pos: p.secondaryPositions?.[0] ?? p.naturalPosition }]); ch(); }}>Spieler hinzufügen</button>
        )}
      </DashBox>

      <DashBox title="Aufstellung letzter Spieltag" right={xi.length ? `${xi.length}` : undefined}>
        {xi.length ? (
          <div className="res-list">
            {xi.map(({ p, pos: ps }) => (
              <div key={p.id} className="res-row" data-pid={p.id}>
                <PosBadge pos={ps} />
                <span className="res-name"><PlayerLink id={p.id}>{p.fullName}</PlayerLink></span>
                <span className="res-age">{p.age} J.</span>
                <b style={{ color: vColor(p.overall) }}>{p.overall}</b>
              </div>
            ))}
          </div>
        ) : <Empty icon="lineup">Noch kein Spieltag gespielt.</Empty>}
        {xi.length > 0 && xi.length < 11 && <div className="dnote mt8">+ {11 - xi.length} Vertragsamateure</div>}
      </DashBox>

      <DashBox title={`Tabelle · ${v.league}`} info="reserveLiga">
        <table className="dtable res-table">
          <thead><tr><th>#</th><th>Verein</th><th className="r">Sp.</th><th className="r">Tore</th><th className="r">Pkt.</th></tr></thead>
          <tbody>
            {v.rows.map((r, i) => {
              const zone = i < v.up ? 'zone-cl' : v.down && i >= v.rows.length - v.down ? 'zone-rel' : '';
              return (
                <tr key={r.id} className={r.me ? 'me' : ''}>
                  <td className="rl-rank"><span className={`rl-z ${zone}`}>{i + 1}</span></td>
                  <td>{r.linkId ? <ClubLink id={r.linkId}>{r.name}</ClubLink> : r.name}</td><td className="r">{r.p}</td><td className="r">{r.gf}:{r.ga}</td><td className="r"><b>{r.pts}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Letzte Spiele">
        {v.results.length ? (
          <div className="res-list">
            {v.results.slice(0, 12).map((r, i) => (
              <div key={i} className="res-row">
                <span className="res-date">{r.date.slice(8, 10)}.{r.date.slice(5, 7)}.</span>
                <span className="res-name">{r.home ? 'gegen' : 'bei'} {r.oppId ? <ClubLink id={r.oppId}>{r.opp}</ClubLink> : r.opp.endsWith(' II') ? <><ClubByName g={g} name={r.opp.slice(0, -3)} /> II</> : <ClubByName g={g} name={r.opp} />}</span>
                <span className={`dres dres-${r.gf > r.ga ? 'W' : r.gf < r.ga ? 'L' : 'D'}`}>{r.gf}:{r.ga}</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="schedule">Noch keine Spiele.</Empty>}
      </DashBox>
    </DashPage>
  );
}
