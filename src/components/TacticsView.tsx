// =============================================================================
// TAKTIK — Mentalität, Teamanweisungen (mit Ball / gegen den Ball), Formation,
// Wirkung in der Match-Engine und nächster Gegner (Seitenraster).
// Liest/schreibt direkt g.clubs[managedClubId].tactics (wie LineupView).
// =============================================================================
import { useState } from 'react';
import type { Player, Tactics } from '../types';
import { getFormation } from '../data/formations';
import { positionSuitability, suitabilityColor } from '../engine/positions';
import { tacticMods } from '../engine/match/team';
import { DashBox, DashPage, Empty, KV } from '../ui/DashPage';
import ClubCrest from './ClubCrest';
import { ClubLink } from './club/ClubLink';
import PitchSVG from './lineup/PitchSVG';
import { effectiveFormation } from './lineup/lineupOps';
import { level, STYLE_DE, STYLE_DESC, STYLES } from './lineup/LineupSide';
import { InfoTip } from '../ui/InfoTip';

// Loses Game-Interface (Vollstruktur liegt in game/state.ts).
interface G {
  clubs: Record<string, any>;
  players: Record<string, Player>;
  managedClubId: string;
  fixtures: { status: string; involvesPlayerClub: boolean; homeClubId: string; awayClubId: string; date: string }[];
}

export default function TacticsView({ g, onChange }: { g: G; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const t: Tactics = myClub.tactics;
  const [, force] = useState(0);
  const set = (patch: Partial<Tactics>) => { Object.assign(t, patch); force((n) => n + 1); onChange(); };
  const formation = effectiveFormation(t);
  const lineupMap = t.lineupMap ?? {};

  const next = g.fixtures
    .filter((m) => m.status === 'scheduled' && m.involvesPlayerClub)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const oppId = next ? (next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId) : null;
  const opp = oppId ? g.clubs[oppId] : null;
  const oppT: Tactics | null = opp?.tactics ?? null;

  // Wirkung genau so, wie die Match-Engine sie vor dem Anpfiff rechnet (ohne Zurufe/Ausrichtung im Spiel).
  const m = tacticMods(t, 0, null, 0, 1);
  const eff: [string, number, boolean][] = [
    ['Angriffswucht', m.att, false], ['Abwehr', m.def, false], ['Ballkontrolle', m.ctrl, false],
    ['Angriffe je Minute', m.rate, false], ['Zweikämpfe', m.duel, false], ['Konterstärke', m.counter, false], ['Flankenspiel', m.cross, false],
    ['Konteranfälligkeit', m.exposed, true], ['Fehler im Aufbau', m.errors, true], ['Kraftverbrauch', m.drain, true],
    ['Fouls', m.foul, true], ['Karten', m.cards, true], ['Verletzungsrisiko', m.injury, true],
  ];
  const pct = (f: number) => { const v = Math.round((f - 1) * 100); return v === 0 ? '±0 %' : `${v > 0 ? '+' : '−'}${Math.abs(v)} %`; };

  return (
    <DashPage>
      <DashBox title="Mentalität" info="mentalitaet" icon="tactics" right={STYLE_DE[t.style] ?? t.style}>
        <div className="lu-seg" role="group">
          {STYLES.map((s) => <button key={s} className={t.style === s ? 'on' : ''} onClick={() => set({ style: s })}>{STYLE_DE[s]}</button>)}
        </div>
        <div className="dnote lu-desc">{STYLE_DESC[t.style]}</div>
        <KV k="Formation" v={getFormation(t.formation).label} />
        <KV k="Aufbau · Breite" v={`${t.buildup === 'long' ? 'lang' : 'kurz'} · ${level(t.widthFocus, 'Mitte', 'normal', 'Flügel')}`} />
        <KV k="Pressing · Linie" v={`${level(t.pressing, 'abwartend', 'normal', 'hoch')} · ${level(t.defensiveLine, 'tief', 'normal', 'hoch')}`} />
        <Slider label="Einsatz" lo="kräfteschonend" hi="volle Kraft" value={t.effort ?? 50} onChange={(v) => set({ effort: v })} />
        <div className="dnote">Mehr Einsatz gewinnt Zweikämpfe und macht Druck, kostet aber Kraft und Frische und erhöht Verletzungs- und Kartenrisiko. Im Textmodus kannst du die Ausrichtung im Spiel verschieben und Zurufe geben.</div>
      </DashBox>

      <DashBox title="Mit Ball" info="mitBall" icon="matchball">
        <Slider label="Tempo" lo="bedächtig" hi="hohes Tempo" value={t.tempo} onChange={(v) => set({ tempo: v })} />
        <Slider label="Breite" lo="über die Mitte" hi="über die Flügel" value={t.widthFocus ?? 50} onChange={(v) => set({ widthFocus: v })} />
        <div className="lu-mlabel">Aufbauspiel</div>
        <div className="lu-seg tx-toggle">
          <button className={(t.buildup ?? 'short') === 'short' ? 'on' : ''} onClick={() => set({ buildup: 'short' })}>Kurz (Ballbesitz)</button>
          <button className={t.buildup === 'long' ? 'on' : ''} onClick={() => set({ buildup: 'long' })}>Lang (direkt)</button>
        </div>
      </DashBox>

      <DashBox title="Gegen den Ball" info="gegenBall" icon="shield">
        <Slider label="Pressinghöhe" lo="abwartend" hi="hohes Pressing" value={t.pressing} onChange={(v) => set({ pressing: v })} />
        <Slider label="Abwehrlinie" lo="tief" hi="hoch" value={t.defensiveLine} onChange={(v) => set({ defensiveLine: v })} />
        <Slider label="Zweikampfhärte" lo="fair" hi="kompromisslos" value={t.tackleHardness ?? 50} onChange={(v) => set({ tackleHardness: v })} />
        <div className="dnote">Härte gewinnt mehr Zweikämpfe, bringt aber Fouls und Karten.</div>
        <div className="lu-mlabel">Abseitsfalle<InfoTip k="abseitsfalle" /></div>
        <div className="lu-seg tx-toggle">
          <button className={t.offsideTrap ? 'on' : ''} onClick={() => set({ offsideTrap: true })}>An</button>
          <button className={!t.offsideTrap ? 'on' : ''} onClick={() => set({ offsideTrap: false })}>Aus</button>
        </div>
      </DashBox>

      <DashBox title="Formation" info="formation" icon="lineup" right={getFormation(t.formation).label}>
        <div className="tx-mini">
          <div className="lu-pitch">
            <div className="lu-field">
              <PitchSVG />
              {formation.slots.map((slot) => {
                const p = lineupMap[slot.id] ? g.players[lineupMap[slot.id]] : undefined;
                const suit = p ? positionSuitability(p, slot.position) : 0;
                return (
                  <div key={slot.id} className="tx-dot" title={p ? `${p.fullName} – Eignung ${suit}` : 'frei'}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%`, borderColor: p ? suitabilityColor(suit) : undefined }}>
                    {slot.position}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DashBox>

      <DashBox title="Wirkung im Spiel" info="wirkung" icon="stats" right="ggü. neutral">
        <div className="tx-effect">
          {eff.map(([label, f, bad]) => {
            const d = Math.max(-1, Math.min(1, (f - 1) / 0.3));
            const color = Math.abs(f - 1) < 0.005 ? 'var(--text-3)' : (f > 1) !== bad ? 'var(--text-2)' : 'var(--orange)';
            return (
              <div key={label} className="tx-eff" title={bad ? 'höher = Nachteil' : 'höher = Vorteil'}>
                <span className="tx-eff-l">{label}</span>
                <span className="tx-eff-t"><span style={{ left: d < 0 ? `${50 + d * 50}%` : '50%', width: `${Math.abs(d) * 50}%`, background: color }} /></span>
                <span className="tx-eff-v" style={{ color: color === 'var(--orange)' ? color : undefined }}>{pct(f)}</span>
              </div>
            );
          })}
        </div>
      </DashBox>

      <DashBox title="Nächster Gegner" icon="watchlist" right={opp?.shortName}>
        {opp && oppT ? (
          <>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
              <ClubLink id={opp.id}><ClubCrest club={opp} size={60} /></ClubLink>
              <div style={{ fontSize: 20, fontWeight: 800 }}><ClubLink id={opp.id}>{opp.name}</ClubLink></div>
            </div>
            <KV k="Formation" v={getFormation(oppT.formation).label} />
            <KV k="Mentalität" v={STYLE_DE[oppT.style] ?? oppT.style} />
            <KV k="Tempo · Pressing · Linie" v={`${level(oppT.tempo, 'bedächtig', 'normal', 'hoch')} · ${level(oppT.pressing, 'abwartend', 'normal', 'hoch')} · ${level(oppT.defensiveLine, 'tief', 'normal', 'hoch')}`} />
            <KV k="Aufbau" v={oppT.buildup === 'long' ? 'lang (direkt)' : 'kurz (Ballbesitz)'} />
            <KV k="Abseitsfalle" v={oppT.offsideTrap ? 'an' : 'aus'} />
          </>
        ) : <Empty icon="watchlist">Kein Gegner angesetzt.</Empty>}
      </DashBox>
    </DashPage>
  );
}

function Slider({ label, value, onChange, lo, hi }: { label: string; value: number; onChange: (v: number) => void; lo: string; hi: string }) {
  return (
    <div className="tx-slider">
      <div className="tx-slider-head"><b>{label}</b><span>{level(value, lo, 'normal', hi)} · {value}</span></div>
      <input type="range" min={0} max={100} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="tx-slider-ends"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}
