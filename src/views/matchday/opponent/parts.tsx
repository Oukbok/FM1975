// =============================================================================
// Bausteine der Gegner-Seite (Wunsch Pascal, Mockup): Leiste „Nächstes Spiel“,
// Netzdiagramm der Mannschaftsteile, Grundordnung auf dem Feld, gefährlichste
// Spieler als Trikotkarten, direkter Vergleich als Balken.
// =============================================================================
import type { Club, Player } from '../../../types';
import type { Game } from '../../../game/state';
import type { NextOpp, UnitRow } from '../../../game/opponentView';
import { oppName } from '../../../game/opponentView';
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import Icon from '../../../components/Icon';
import JerseySVG, { type JerseyPattern } from '../../../components/JerseySVG';
import PosBadge from '../../../components/PosBadge';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { getClubKitDisplay } from '../../../data/kits';
import { fmtDateShort } from '../../../ui/format';

/** Leiste über der Seite: Heim · VS · Gast | Datum | Wettbewerb. */
export function NextStrip({ g, nx }: { g: Game; nx: NextOpp | null }) {
  if (!nx) return <div className="opx-strip"><span className="opx-strip-tag">Nächstes Spiel</span><span className="opx-strip-none">Kein weiteres Pflichtspiel angesetzt.</span></div>;
  const me = g.managedClubId;
  const home = nx.home ? me : nx.opp, away = nx.home ? nx.opp : me;
  const side = (id: string) => (
    <ClubLink id={id}><span className="opx-strip-club">{g.clubs[id] ? <ClubCrest club={g.clubs[id]} size={36} /> : null}<b>{oppName(g, id)}</b></span></ClubLink>
  );
  return (
    <div className="opx-strip">
      <span className="opx-strip-tag">Nächstes Spiel</span>
      <div className="opx-strip-match">{side(home)}<span className="opx-strip-vs">VS</span>{side(away)}</div>
      <span className="opx-strip-sep" />
      <span className="opx-strip-info"><Icon name="schedule" size={20} />{fmtDateShort(nx.date).dmy}</span>
      <span className="opx-strip-info"><Icon name="trophy" size={20} />{nx.comp}</span>
    </div>
  );
}

/** Direkter Vergleich als dreigeteilter Balken Siege · Remis · Niederlagen. */
export function H2HBar({ w, d, l }: { w: number; d: number; l: number }) {
  const n = Math.max(1, w + d + l);
  const part = (v: number, cls: string) => v > 0 ? <span className={cls} style={{ flexGrow: v / n, minWidth: 44 }}>{v}</span> : null;
  return <div className="opx-h2h">{part(w, 'w')}{part(d, 'd')}{part(l, 'l')}</div>;
}

/** Netzdiagramm Torwart/Abwehr/Mittelfeld/Angriff: eigene Elf (Vereinsfarbe) gegen den Gegner (Dunkelblau). */
export function UnitRadar({ units, me, opp, meId, oppId }: { units: UnitRow[]; me: string; opp: string; meId?: string; oppId?: string }) {
  const C = 150, R = 108;
  const order: UnitRow['key'][] = ['GK', 'DEF', 'MID', 'ATT'];
  const ang = [-90, 0, 90, 180].map((a) => (a * Math.PI) / 180);
  const pt = (i: number, v: number) => [C + Math.cos(ang[i]) * R * v / 100, C + Math.sin(ang[i]) * R * v / 100] as const;
  const poly = (sel: (u: UnitRow) => number) => order.map((k, i) => pt(i, sel(units.find((u) => u.key === k)!)).join(',')).join(' ');
  const lbl: [number, number, 'middle' | 'start' | 'end'][] = [[C, C - R - 38, 'middle'], [C + R + 40, C - 6, 'middle'], [C, C + R + 20, 'middle'], [C - R - 40, C - 6, 'middle']];
  return (
    <div className="opx-radar">
      <svg viewBox="-60 -10 420 320" role="img" aria-label="Mannschaftsteile im Vergleich">
        {[20, 40, 60, 80, 100].map((r) => <polygon key={r} className="ring" points={order.map((_, i) => pt(i, r).join(',')).join(' ')} />)}
        {order.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} className="axis" x1={C} y1={C} x2={x} y2={y} />; })}
        {[20, 40, 60, 80, 100].map((r) => <text key={r} className="tick" x={C + 3} y={C - R * r / 100 + 4}>{r}</text>)}
        <polygon className="them" points={poly((u) => u.them)} />
        <polygon className="us" points={poly((u) => u.us)} />
        {order.map((k, i) => {
          const u = units.find((x) => x.key === k)!;
          const [x, y] = lbl[i];
          return (
            <g key={k}>
              <text className="lab" x={x} y={y} textAnchor={lbl[i][2]}>{u.label.toUpperCase()}</text>
              <text className="val" x={x} y={y + 24} textAnchor={lbl[i][2]}><tspan className="us">{u.us || '–'}</tspan><tspan className="bar"> | </tspan><tspan className="them">{u.them || '–'}</tspan></text>
            </g>
          );
        })}
      </svg>
      <div className="opx-legend"><span className="us"><i /><ClubLink id={meId}>{me}</ClubLink></span><span className="them"><i /><ClubLink id={oppId}>{opp}</ClubLink></span></div>
    </div>
  );
}

/** Grundordnung des Gegners auf einem stehenden Feld (eigenes Tor unten), Punkte mit Rückennummer. */
export function FormationPitch({ dots }: { dots: { x: number; y: number; nr: string; gk: boolean }[] }) {
  return (
    <svg className="opx-pitch" viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Grundordnung">
      <rect className="grass" x="0" y="0" width="100" height="130" />
      <g className="lines">
        <rect x="3" y="3" width="94" height="124" />
        <line x1="3" y1="65" x2="97" y2="65" />
        <circle cx="50" cy="65" r="10" />
        <rect x="25" y="3" width="50" height="17" /><rect x="38" y="3" width="24" height="6" />
        <rect x="25" y="110" width="50" height="17" /><rect x="38" y="121" width="24" height="6" />
      </g>
      {dots.map((d, i) => (
        <g key={i} className={d.gk ? 'dot gk' : 'dot'}>
          <circle cx={d.x} cy={d.y} r="4.6" />
          <text x={d.x} y={d.y + 1.7}>{d.nr}</text>
        </g>
      ))}
    </svg>
  );
}

/** Karte eines gefährlichen Spielers: Trikot in Vereinsfarben mit Nummer, Position, Name, Stärke. */
export function DangerCard({ club, p, hurt }: { club: Club; p: Player; hurt?: string }) {
  const k = getClubKitDisplay(club, 'home');
  return (
    <div className="opx-dcard" data-pid={p.id}>
      {k.image ? <JerseySVG image={k.image} size={46} number={p.shirtNumber || undefined} />
        : <JerseySVG primary={k.primary} secondary={k.secondary} pattern={k.pattern as JerseyPattern} size={46} number={p.shirtNumber || undefined} />}
      <div className="opx-dcard-t">
        <span className="opx-dcard-top"><PosBadge p={p} single />{hurt && <span className="opx-hurt" title={hurt}><Icon name="injury" size={12} />{hurt.startsWith('gesperrt') ? 'Gesperrt' : 'Verletzt'}</span>}</span>
        <PlayerLink id={p.id}><b>{p.fullName}</b></PlayerLink>
        <span className="opx-dcard-ov">Stärke <b>{p.overall}</b></span>
      </div>
    </div>
  );
}
