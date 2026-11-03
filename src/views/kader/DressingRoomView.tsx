// =============================================================================
// KABINE (Kader › Kabine) — Teamstimmung, Hierarchie-Pyramide, Gruppen, Außenseiter,
// Gespräche, Vorfälle und Maßnahmen.
// Rechnung: engine/dressingRoom.ts · Spielablauf: game/dressingRoomGame.ts ·
// Vorfälle: game/dressingRoomEvents.ts · Teile: views/kader/kabine/
// =============================================================================
import { useState } from 'react';
import { MORALE_LABEL, moraleStepOf, TIER_LABEL } from '../../engine/dressingRoom';
import { ensureLeadership, roomAnalysis, roomOf, squadOf } from '../../game/dressingRoomGame';
import { chooseEventOption } from '../../game/eventsGame';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty, Kpi } from '../../ui/DashPage';
import { condColor, fmtDay } from '../../ui/format';
import { MoraleIcon } from '../../components/status';
import { RoomPyramid } from './kabine/RoomPyramid';
import { FactorList, MoodSpark, PlayerFocus, TeamActions } from './kabine/RoomParts';
import { PromisesTab } from './promises/PromisesTab';

type Sort = 'einfluss' | 'moral';
type Tab = 'massnahmen' | 'vorfaelle' | 'verlauf' | 'versprechen';

export function DressingRoomView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const dr = roomOf(club);
  const squad = squadOf(g, club);
  if (squad.length >= 11) ensureLeadership(g, club);
  const [sort, setSort] = useState<Sort>('einfluss');
  const [tab, setTab] = useState<Tab>('massnahmen');
  const [why, setWhy] = useState<'stimmung' | 'zusammenhalt'>('stimmung');
  const a = roomAnalysis(g);
  const first = [...a.players].sort((x, y) => y.influence - x.influence)[0]?.id;
  const [sel, setSel] = useState<string | undefined>(first);
  const selected = sel && a.byId[sel] ? sel : first;
  if (squad.length < 11) return <DashPage><DashBox title="Kabine" icon="squad" span={3} rows={2}><Empty icon="squad">Zu wenige Spieler im Kader.</Empty></DashBox></DashPage>;

  const avgMorale = Math.round(squad.reduce((s, p) => s + (p.moraleScore ?? 60), 0) / squad.length);
  const mood = Math.round(dr.mood);
  const list = [...a.players].sort((x, y) => sort === 'einfluss' ? y.influence - x.influence : (g.players[x.id].moraleScore ?? 60) - (g.players[y.id].moraleScore ?? 60));
  const open = g.messages.filter((m) => m.eventRef?.type.startsWith('kabine_') && !m.eventRef.resolved);
  const recent = g.messages.filter((m) => m.eventRef?.type.startsWith('kabine_') && m.eventRef.resolved).slice(0, 5);
  const name = (id: string) => g.players[id]?.lastName ?? '–';
  const moodLabel = mood >= 72 ? 'Euphorie' : mood >= 58 ? 'gut' : mood >= 45 ? 'durchwachsen' : mood >= 35 ? 'angespannt' : 'Krise';

  return (
    <DashPage className="kb-page">
      <DashBox title="Stimmung" icon="fans" right={<span className="dbtnrow">
        <button className={`dchip ${why === 'stimmung' ? 'on' : ''}`} onClick={() => setWhy('stimmung')}>Stimmung</button>
        <button className={`dchip ${why === 'zusammenhalt' ? 'on' : ''}`} onClick={() => setWhy('zusammenhalt')}>Zusammenhalt</button>
      </span>}>
        <div className="dkpis kb-kpis">
          <Kpi value={<span style={{ color: condColor(mood) }}>{mood}</span>} label="Teamstimmung" sub={moodLabel} />
          <Kpi value={<span style={{ color: condColor(a.cohesion) }}>{a.cohesion}</span>} label="Zusammenhalt" />
          <Kpi value={<span style={{ color: condColor(avgMorale) }}>{avgMorale}</span>} label="Ø Moral" sub={MORALE_LABEL[moraleStepOf(avgMorale)]} />
          <Kpi value={a.outsiders.length} label="Außen vor" sub={a.outsiders.length ? a.outsiders.slice(0, 2).map(name).join(', ') : 'niemand'} />
        </div>
        {why === 'stimmung'
          ? <><div className="dnote">Zielwert {a.moodTarget} – die Stimmung folgt ihm langsam.</div><FactorList items={a.moodWhy} max={6} /></>
          : <FactorList items={a.cohesionWhy} max={7} />}
        <MoodSpark points={[...(dr.history ?? []).slice(-18).map((h) => h.mood), mood]} />
      </DashBox>

      <DashBox title="Kabinen-Pyramide" icon="squad" rows={2} info="kabine_pyramide" right={<span className="kb-legend">Symbol Moral · K Kapitän · R Rat · Ziffer Gruppe</span>}>
        <RoomPyramid a={a} players={g.players} conflicts={dr.conflicts ?? []} captainId={dr.captainId} council={dr.council ?? []} selected={selected} onSelect={setSel} />
      </DashBox>

      <DashBox title="Spieler" icon="squad" flush right={<span className="dbtnrow">
        <button className={`dchip ${sort === 'einfluss' ? 'on' : ''}`} onClick={() => setSort('einfluss')}>Einfluss</button>
        <button className={`dchip ${sort === 'moral' ? 'on' : ''}`} onClick={() => setSort('moral')}>Moral</button>
      </span>}>
        <table className="dtable kb-table rl-sm">
          <thead><tr><th>Pos</th><th>Spieler</th><th>Rolle</th><th className="num">Einfluss</th><th className="num">Moral</th></tr></thead>
          <tbody>
            {list.map((o) => {
              const p = g.players[o.id];
              const s = Math.round(p.moraleScore ?? 60);
              return (
                <tr key={o.id} className={`clickable ${o.id === selected ? 'kb-sel' : ''}`} onClick={() => setSel(o.id)}>
                  <td><span className="pos-badge">{p.naturalPosition}</span></td>
                  <td className="kb-td-name">{p.lastName}{o.id === dr.captainId ? ' (K)' : dr.council?.includes(o.id) ? ' (R)' : ''}{o.outsiderWhy[0] && <span className="muted"> · {o.outsiderWhy[0]}</span>}</td>
                  <td className="muted nowrap">{TIER_LABEL[o.tier]}</td>
                  <td className="num"><span className="kb-mini"><i style={{ width: `${o.influence}%` }} /></span>{o.influence}</td>
                  <td className="num"><MoraleIcon value={s} size={16} /> <span>{s}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title={tab === 'massnahmen' ? 'Maßnahmen' : tab === 'vorfaelle' ? 'Vorfälle' : tab === 'versprechen' ? 'Versprechen' : 'Verlauf'} icon="staff" right={<span className="dbtnrow">
        <button className={`dchip ${tab === 'massnahmen' ? 'on' : ''}`} onClick={() => setTab('massnahmen')}>Maßnahmen</button>
        <button className={`dchip ${tab === 'vorfaelle' ? 'on' : ''}`} onClick={() => setTab('vorfaelle')}>Vorfälle{open.length ? ` (${open.length})` : ''}</button>
        <button className={`dchip ${tab === 'verlauf' ? 'on' : ''}`} onClick={() => setTab('verlauf')}>Verlauf</button>
        <button className={`dchip ${tab === 'versprechen' ? 'on' : ''}`} onClick={() => setTab('versprechen')}>Versprechen</button>
      </span>}>
        {tab === 'versprechen' && <PromisesTab g={g} onChange={onChange} />}
        {tab === 'massnahmen' && <TeamActions g={g} onChange={onChange} />}
        {tab === 'vorfaelle' && <>
          {open.length ? open.map((m) => (
            <div key={m.id} className="kb-incident">
              <div className="kb-inc-subj">{m.subject}</div>
              <div className="dnote">{m.bodyText}</div>
              <div className="dnote">Entscheide bis {fmtDay(m.eventRef!.deadline)}, sonst gilt „{m.choices?.find((c) => c.id === m.eventRef!.defaultChoice)?.label}“.</div>
              <div className="dbtnrow mt8">
                {m.choices?.map((c) => <button key={c.id} className="btn btn-sm btn-ghost" title={c.hint} onClick={() => { chooseEventOption(g, m, c.id); m.read = true; onChange(); }}>{c.label}</button>)}
              </div>
            </div>
          )) : <div className="dnote">Keine offenen Vorfälle. Streit, Forderungen oder Grüppchen kommen selten – du erfährst davon im Postfach und hier.</div>}
          {recent.length > 0 && <div className="dsec">Zuletzt entschieden</div>}
          {recent.map((m) => <div key={m.id} className="dlist-row"><span className="meta">{fmtDay(m.date)}</span><span className="grow kb-wrap">{m.subject}<span className="muted"> – {m.resultText}</span></span></div>)}
        </>}
        {tab === 'verlauf' && <>
          {(dr.log ?? []).length ? dr.log!.map((l, i) => <div key={i} className="dlist-row"><span className="meta">{fmtDay(l.date)}</span><span className="grow kb-wrap">{l.text}</span></div>)
            : <div className="dnote">Noch keine Maßnahmen oder Vorfälle.</div>}
        </>}
      </DashBox>

      <DashBox title="Spieler im Fokus" icon="contracts">
        {selected ? <PlayerFocus g={g} a={a} pid={selected} onChange={onChange} /> : <Empty icon="squad">Wähle einen Spieler.</Empty>}
      </DashBox>
    </DashPage>
  );
}
