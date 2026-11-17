// =============================================================================
// Zeichnung der Taktiktafeln (liegend, eigenes Tor links) – Wunsch Pascal: jeder
// Pfeil, jede Fläche und jede Beschriftung folgt aus einer gewählten Anweisung
// oder Rolle. Was nichts aussagt, wird nicht gezeichnet.
//  In Ballbesitz: Breite (Angriffszonen), Aufbau (Kurzpasskette | langer Ball),
//    Flanken (nur wenn über außen gespielt wird: hoch = Bogen, flach = Rückraum),
//    Tempo (Pfeilspitzen), Mentalität (Lage + Beschriftung), Laufwege der Rollen.
//  Defensive: Pressingzone, Abwehrlinie (+ Abseitsfalle), Deckung (Raum = Blöcke,
//    Mann = Gegenspieler), Ballverlust (Gegenpressing | ordnen), Zweikampfhärte.
// =============================================================================
import type { FormationSlot } from '../../data/formations';
import type { Player, Tactics } from '../../types';
import { markingOf, stepOf } from '../../engine/tacticEra';

export interface Spot { slot: FormationSlot; x: number; y: number; role: string; p?: Player; grp: 'GK' | 'DEF' | 'MID' | 'ATT' }
export interface Geo {
  w: number; h: number; r: number;
  /** Pixel einer Lage (Formations-Koordinaten). */
  X: (s: { x: number; y: number }) => number; Y: (s: { x: number; y: number }) => number;
  /** Pixel aus Formations-y (waagrecht) bzw. -x (senkrecht). */
  sx: (y: number) => number; sy: (x: number) => number;
}

const TEMPO = ['Sehr ruhig', 'Ruhig', 'Normal', 'Schnell', 'Sehr schnell'];
const PRESS = ['Abwartend', 'Tief', 'Mittelfeld', 'Hoch', 'Angriff'];
const HARD = ['Sehr fair', 'Fair', 'Normal', 'Hart', 'Sehr hart'];
const MENT: Record<string, string> = { attacking: 'Offensiv: die Mannschaft rückt auf', defensive: 'Defensiv: die Mannschaft steht tiefer', counter: 'Konter: tief stehen, schnell umschalten' };

/** Pfeil von a nach b, an beiden Enden um den Magneten gekürzt; `bend` = Bogen quer zur Richtung (px). */
function Arrow({ g, a, b, cls, head, bend = 0, cutA = true, cutB = true }: {
  g: Geo; a: [number, number]; b: [number, number]; cls: string; head: string; bend?: number; cutA?: boolean; cutB?: boolean;
}) {
  const [ax, ay] = a, [bx, by] = b;
  const len = Math.hypot(bx - ax, by - ay) || 1;
  const ux = (bx - ax) / len, uy = (by - ay) / len;
  const ca = cutA ? g.r + 4 : 0, cb = cutB ? g.r + 6 : 0;
  if (len < ca + cb + 8) return null;
  const x1 = ax + ux * ca, y1 = ay + uy * ca, x2 = bx - ux * cb, y2 = by - uy * cb;
  const d = bend ? `M ${x1} ${y1} Q ${(x1 + x2) / 2 - uy * bend} ${(y1 + y2) / 2 + ux * bend} ${x2} ${y2}` : `M ${x1} ${y1} L ${x2} ${y2}`;
  return <path d={d} className={`txb-arrow ${cls}`} markerEnd={head} />;
}
const at = (g: Geo, s: Spot): [number, number] => [g.X(s), g.Y(s)];
const central = (s: Spot) => Math.abs(s.x - 50);

/** Laufwege, die eine Rolle in Ballbesitz bedeutet (Formations-Koordinaten des Ziels). */
function roleRun(s: Spot): { x: number; y: number } | null {
  switch (s.role) {
    case 'av_off': return { x: s.x, y: s.y - 26 };                                   // hinterläuft über außen
    case 'fl_inv': case 'am_ein': return { x: 50 + (s.x - 50) * 0.35, y: s.y - 10 }; // zieht nach innen
    case 'ms_konter': return { x: s.x, y: 9 };                                       // startet in die Tiefe
    case 'om_schatten': case 'hs_zwei': return { x: 50 + (s.x - 50) * 0.5, y: 15 };  // stößt in den Strafraum
    case 'zm_antr': return { x: s.x, y: s.y - 17 };                                  // Box-to-Box
    case 'lib_frei': return { x: s.x, y: s.y - 15 };                                 // schaltet sich ein
    default: return null;
  }
}

export function BallLayer({ geo: g, spots, eff, head }: { geo: Geo; spots: Spot[]; eff: Tactics; head: string }) {
  const out = spots.filter((s) => s.grp !== 'GK');
  const ws = stepOf(eff.widthFocus), ts = stepOf(eff.tempo);
  // Breite: Angriffszonen im letzten Drittel, Deckkraft = Anteil der Angriffe.
  const x0 = g.sx(40), wCenter = (4 - ws) / 4, wWing = ws / 4;
  const lane = (top: number, bot: number, wt: number, k: string) => (
    <rect key={k} x={x0} y={g.sy(top)} width={g.w - x0} height={g.sy(bot) - g.sy(top)} className="txb-lane" style={{ opacity: 0.12 + wt * 0.75 }} />
  );
  const widthText = ws <= 1 ? 'Angriffe durch die Mitte' : ws === 2 ? 'Angriffe über Mitte und Flügel' : 'Angriffe über die Flügel';
  // Aufbau
  const defs = out.filter((s) => s.grp === 'DEF').sort((a, b) => central(a) - central(b) || b.y - a.y);
  const deep = defs[0] ?? [...out].sort((a, b) => b.y - a.y)[0];
  const mids = out.filter((s) => s.grp === 'MID').sort((a, b) => central(a) - central(b) || b.y - a.y);
  const atts = out.filter((s) => s.grp === 'ATT').sort((a, b) => a.y - b.y || central(a) - central(b));
  const target = atts[0] ?? [...out].sort((a, b) => a.y - b.y)[0];
  const m1 = mids[0];
  const m2 = [...mids].filter((s) => s !== m1 && s.y < (m1?.y ?? 100)).sort((a, b) => central(a) - central(b))[0];
  const chain = [deep, m1, m2, target].filter((s, i, arr): s is Spot => !!s && arr.indexOf(s) === i);
  // Flanken nur, wenn (auch) über außen angegriffen wird.
  const crossOn = ws >= 2;
  const high = eff.crossStyle === 'high', low = eff.crossStyle === 'low';
  // Flankengeber: äußerster Mittelfeldspieler/Angreifer der Seite, Außenverteidiger nur als offensive Rolle.
  const wide = (side: -1 | 1) => out.filter((s) => (side < 0 ? s.x < 30 : s.x > 70) && (s.grp !== 'DEF' || s.role === 'av_off')).sort((a, b) => a.y - b.y)[0];
  const cross = (side: -1 | 1) => {
    const s = wide(side);
    const bx = g.sx(13), by = g.sy(50 + side * 37);
    const far = [g.sx(10), g.sy(50 - side * 8)] as [number, number];
    const back = [g.sx(22), g.sy(50 + side * 4)] as [number, number];
    return (
      <g key={side} className="txb-cross">
        {ws >= 3 && s && <Arrow g={g} a={at(g, s)} b={[bx, by]} cls="run" head={head} cutB={false} />}
        {!low && <Arrow g={g} a={[bx, by]} b={far} cls={`cross${high ? '' : ' mixed'}`} head={head} bend={side * -38} cutA={false} cutB={false} />}
        {!high && <Arrow g={g} a={[bx, by]} b={back} cls={`cross flat${low ? '' : ' mixed'}`} head={head} cutA={false} cutB={false} />}
      </g>
    );
  };
  const crossText = high ? 'Flanken hoch auf den Kopf' : low ? 'Flanken flach in den Rückraum' : 'Flanken hoch und flach';
  const runs = out.map((s) => ({ s, to: roleRun(s) })).filter((r): r is { s: Spot; to: { x: number; y: number } } => !!r.to);
  return (
    <>
      {lane(4, 30, wWing, 'l')}{lane(30, 70, wCenter, 'c')}{lane(70, 96, wWing, 'r')}
      <text x={g.w - 12} y={18} textAnchor="end" className="txb-cap">{widthText}</text>
      {eff.buildup === 'long'
        ? deep && target && <Arrow g={g} a={at(g, deep)} b={at(g, target)} cls="long" head={head} bend={-Math.min(70, g.h * 0.2)} />
        : chain.slice(1).map((s, i) => <Arrow key={s.slot.id} g={g} a={at(g, chain[i])} b={at(g, s)} cls="short" head={head} />)}
      {crossOn && <>{cross(-1)}{cross(1)}<text x={g.w - 12} y={g.h - 12} textAnchor="end" className="txb-cap sm">{crossText}</text></>}
      {runs.map(({ s, to }) => <Arrow key={`r-${s.slot.id}`} g={g} a={at(g, s)} b={[g.sx(to.y), g.sy(to.x)]} cls="role" head={head} cutB={false} />)}
      <g className="txb-tempo" transform={`translate(14 ${g.h - 30})`}>
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${i * 11} -7 l 7 7 l -7 7`} className={i <= ts ? 'on' : ''} />)}
        <text x={66} y={5} className="txb-cap sm">Tempo: {TEMPO[ts]}</text>
      </g>
      <text x={14} y={18} className="txb-cap sm">Aufbau: {eff.buildup === 'long' ? 'langer Ball in die Spitze' : 'Kurzpassspiel'}</text>
      {MENT[eff.style] && <text x={14} y={36} className="txb-cap sm">{MENT[eff.style]}</text>}
    </>
  );
}

export function DefLayer({ geo: g, spots, eff, year, yLine, yPress, head }: {
  geo: Geo; spots: Spot[]; eff: Tactics; year: number; yLine: number; yPress: number; head: string;
}) {
  const zone = markingOf(eff, year) === 'zone';
  const out = spots.filter((s) => s.grp !== 'GK');
  const ps = stepOf(eff.pressing), hs = stepOf(eff.tackleHardness);
  const back = out.filter((s) => s.grp === 'DEF' && s.slot.position !== 'LIB');
  const lineX = g.sx((back.length ? Math.max(...back.map((s) => s.y)) : yLine) + 2.5);
  const pressX = g.sx(yPress - 6);
  // Raumdeckung: Mannschaftsteile als Blöcke; Manndeckung: Gegenspieler neben Abwehr und Sechsern.
  const bands = zone ? (['DEF', 'MID', 'ATT'] as const).map((k) => {
    const row = out.filter((s) => s.grp === k && s.slot.position !== 'LIB');
    if (!row.length) return null;
    const xs = row.map((s) => g.X(s)), ys = row.map((s) => g.Y(s));
    return <rect key={k} x={Math.min(...xs) - 26} y={Math.min(...ys) - 26} width={Math.max(...xs) - Math.min(...xs) + 52} height={Math.max(...ys) - Math.min(...ys) + 52} rx={14} className="txb-band" />;
  }) : null;
  const marked = zone ? [] : out.filter((s) => (s.grp === 'DEF' && s.slot.position !== 'LIB') || s.slot.position === 'DM');
  // Ballverlust in der gegnerischen Hälfte: Gegenpressing = die Nächsten laufen zum Ball, sonst zurück in die Ordnung.
  const ball: [number, number] = [g.sx(26), g.sy(38)];
  const near = [...out].sort((a, b) => Math.hypot(g.X(a) - ball[0], g.Y(a) - ball[1]) - Math.hypot(g.X(b) - ball[0], g.Y(b) - ball[1])).slice(0, 3);
  const fronts = [...out].sort((a, b) => a.y - b.y).slice(0, 3);
  return (
    <>
      <rect x={pressX} y={0} width={g.w - pressX} height={g.h} className="txb-press" />
      <line x1={pressX} y1={0} x2={pressX} y2={g.h} className="txb-pressline" />
      <text x={g.w - 12} y={18} textAnchor="end" className="txb-cap">Pressing: {PRESS[ps]}</text>
      {bands}
      {marked.map((s) => <circle key={s.slot.id} cx={g.X(s) + g.r + 14} cy={g.Y(s) - 8} r={10} className="txb-opp" />)}
      <line x1={lineX} y1={10} x2={lineX} y2={g.h - 10} className={`txb-defline${eff.offsideTrap ? ' trap' : ''}`} />
      {eff.offsideTrap && [10, g.h - 10].map((fy, i) => <path key={i} d={`M ${lineX} ${fy} h -20 l 6 ${i ? -7 : 7} l -6 ${i ? -7 : 7}`} className="txb-flag" />)}
      <text x={lineX + 8} y={g.h - 14} className="txb-cap sm">{eff.offsideTrap ? 'Abwehrlinie mit Abseitsfalle' : 'Abwehrlinie'}</text>
      <circle cx={ball[0]} cy={ball[1]} r={6} className="txb-ball" />
      {eff.counterPress
        ? near.map((s) => <Arrow key={s.slot.id} g={g} a={at(g, s)} b={ball} cls="press" head={head} cutB={false} />)
        : fronts.map((s) => <Arrow key={s.slot.id} g={g} a={at(g, s)} b={[g.X(s) - g.w * 0.13, g.Y(s)]} cls="back" head={head} cutB={false} />)}
      <text x={ball[0]} y={ball[1] - 12} textAnchor="middle" className="txb-cap sm">{eff.counterPress ? 'Ballverlust: Gegenpressing' : 'Ballverlust: ordnen'}</text>
      <text x={g.w - 12} y={36} textAnchor="end" className="txb-cap sm">{zone ? 'Raumdeckung' : 'Manndeckung'} · Zweikampf: {HARD[hs]}</text>
    </>
  );
}
