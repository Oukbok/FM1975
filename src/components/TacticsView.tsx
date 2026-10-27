// =============================================================================
// TAKTIK — Ausrichtung, Spielverhalten, Formation, Gegner (Seitenraster)
// Liest/schreibt direkt g.clubs[managedClubId].tactics (wie LineupView).
// =============================================================================
import { useState } from 'react';
import { Player, Tactics } from '../types';
import { getFormation } from '../data/formations';
import { positionSuitability, suitabilityColor } from '../engine/positions';
import { DashBox, DashPage, Empty, KV, Kpi } from '../ui/DashPage';
import ClubCrest from './ClubCrest';

// Loses Game-Interface (Vollstruktur liegt in game/state.ts).
interface G {
  clubs: Record<string, any>;
  players: Record<string, Player>;
  managedClubId: string;
  fixtures: { status: string; involvesPlayerClub: boolean; homeClubId: string; awayClubId: string; date: string }[];
}

const STYLE_DE: Record<string, string> = {
  defensive: 'Defensiv', balanced: 'Ausgewogen', attacking: 'Offensiv', counter: 'Konter',
};
const STYLE_DESC: Record<string, string> = {
  defensive: 'Sicherheit zuerst: tief stehen, wenig Risiko im Spielaufbau.',
  balanced: 'Gleichgewicht zwischen Angriff und Abwehr.',
  attacking: 'Viele Spieler im Angriff, früher Druck aufs gegnerische Tor.',
  counter: 'Ball erobern und schnell über wenige Stationen umschalten.',
};

export default function TacticsView({ g, onChange }: { g: G; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const t: Tactics = myClub.tactics;
  const [, force] = useState(0);
  const set = (patch: Partial<Tactics>) => { Object.assign(t, patch); force((n) => n + 1); onChange(); };
  const formation = getFormation(t.formation);
  const lineupMap = t.lineupMap ?? {};

  const next = g.fixtures
    .filter((m) => m.status === 'scheduled' && m.involvesPlayerClub)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const oppId = next ? (next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId) : null;
  const opp = oppId ? g.clubs[oppId] : null;
  const oppT: Tactics | null = opp?.tactics ?? null;

  return (
    <DashPage>
      <DashBox title="Grundausrichtung" icon="tactics" right={STYLE_DE[t.style] ?? t.style}>
        <div className="dbtnrow" style={{ marginBottom: 8 }}>
          {(['defensive', 'balanced', 'attacking', 'counter'] as const).map((s) => (
            <button key={s} className={`dchip ${t.style === s ? 'on' : ''}`} onClick={() => set({ style: s })}>{STYLE_DE[s]}</button>
          ))}
        </div>
        <div className="dnote" style={{ marginBottom: 6 }}>{STYLE_DESC[t.style]}</div>
        <Slider label="Tempo" hintLo="bedächtig" hintHi="hohes Tempo" value={t.tempo} onChange={(v) => set({ tempo: v })} />
        <Slider label="Pressinghöhe" hintLo="abwartend" hintHi="hohes Pressing" value={t.pressing} onChange={(v) => set({ pressing: v })} />
        <Slider label="Abwehrlinie" hintLo="tief" hintHi="hoch" value={t.defensiveLine} onChange={(v) => set({ defensiveLine: v })} />
      </DashBox>

      <DashBox title="Spielverhalten" icon="matchball">
        <Slider label="Zweikampfhärte" hintLo="fair" hintHi="kompromisslos" value={t.tackleHardness ?? 50} onChange={(v) => set({ tackleHardness: v })} />
        <Slider label="Breite" hintLo="über die Mitte" hintHi="über die Flügel" value={t.widthFocus ?? 50} onChange={(v) => set({ widthFocus: v })} />
        <div className="dsec">Aufbauspiel</div>
        <div className="dbtnrow">
          <button className={`dchip ${(t.buildup ?? 'short') === 'short' ? 'on' : ''}`} onClick={() => set({ buildup: 'short' })}>Kurz (Ballbesitz)</button>
          <button className={`dchip ${t.buildup === 'long' ? 'on' : ''}`} onClick={() => set({ buildup: 'long' })}>Lang (direkt)</button>
        </div>
        <div className="dsec">Abseitsfalle</div>
        <div className="dbtnrow">
          <button className={`dchip ${t.offsideTrap ? 'on' : ''}`} onClick={() => set({ offsideTrap: true })}>An</button>
          <button className={`dchip ${!t.offsideTrap ? 'on' : ''}`} onClick={() => set({ offsideTrap: false })}>Aus</button>
        </div>
      </DashBox>

      <DashBox title="Taktik-Übersicht" icon="stats">
        <div className="dkpis">
          <Kpi value={t.tempo} label="Tempo" />
          <Kpi value={t.pressing} label="Pressing" />
          <Kpi value={t.defensiveLine} label="Linie" />
        </div>
        <KV k="Formation" v={formation.label} />
        <KV k="Ausrichtung" v={STYLE_DE[t.style] ?? t.style} />
        <KV k="Aufbau" v={t.buildup === 'long' ? 'Lang (direkt)' : 'Kurz (Ballbesitz)'} />
        <KV k="Abseitsfalle" v={t.offsideTrap ? 'an' : 'aus'} />
      </DashBox>

      <DashBox title="Formation" icon="lineup" right={formation.label}>
        <div className="tac-mini-pitch">
          {formation.slots.map((slot) => {
            const p = lineupMap[slot.id] ? g.players[lineupMap[slot.id]] : undefined;
            const suit = p ? positionSuitability(p, slot.position) : 0;
            return (
              <div key={slot.id} className="tac-dot" style={{ left: `${slot.x}%`, top: `${slot.y}%`, borderColor: p ? suitabilityColor(suit) : 'var(--border)' }}>
                <b>{slot.position}</b>
                <span>{p ? p.lastName : '—'}</span>
              </div>
            );
          })}
        </div>
      </DashBox>

      <DashBox title="Nächster Gegner" icon="watchlist" right={opp?.shortName}>
        {opp && oppT ? (
          <>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
              <ClubCrest club={opp} size={60} />
              <div style={{ fontSize: 20, fontWeight: 900 }}>{opp.name}</div>
            </div>
            <KV k="Formation" v={getFormation(oppT.formation).label} />
            <KV k="Ausrichtung" v={STYLE_DE[oppT.style] ?? oppT.style} />
            <KV k="Tempo · Pressing · Linie" v={`${oppT.tempo} · ${oppT.pressing} · ${oppT.defensiveLine}`} />
            <KV k="Aufbau" v={oppT.buildup === 'long' ? 'Lang (direkt)' : 'Kurz (Ballbesitz)'} />
          </>
        ) : <Empty icon="watchlist">Kein Gegner angesetzt.</Empty>}
      </DashBox>

      <DashBox title="Standardschützen" icon="contracts">
        {([['Elfmeter', t.penaltyTakerId, 'penalties'], ['Freistoß', t.freeKickTakerId, 'freeKicks'], ['Ecke', t.cornerTakerId, 'corners'], ['Kapitän', t.captainId, 'leadership']] as const).map(([lbl, id, attr]) => {
          const p = id ? g.players[id] : undefined;
          return <KV key={lbl} k={lbl} v={p ? `${p.fullName} (${Math.round(p.attributes[attr])})` : '—'} />;
        })}
        <div className="dnote mt8">Ändern unter „Aufstellung“. Ringfarben in der Formation: grün = passt sehr gut, rot = ungeeignet.</div>
      </DashBox>
    </DashPage>
  );
}

function Slider({ label, value, onChange, hintLo, hintHi }: {
  label: string; value: number; onChange: (v: number) => void; hintLo: string; hintHi: string;
}) {
  return (
    <div className="tac-slider">
      <div className="row" style={{ marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{label}</span>
        <span className="pill">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <div className="row dim mini"><span>{hintLo}</span><span>{hintHi}</span></div>
    </div>
  );
}
