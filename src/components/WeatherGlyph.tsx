// =============================================================================
// Wetter-Symbol (gezeichnet): Vorschau „Nächstes Spiel“ und Kopfzeile des Textmodus.
// Wetterarten wie engine/match/sim.ts (sonnig, bewoelkt, regen, schnee, hitze, wind, nebel);
// CSS .pm-wx-* in 28-prematch.css.
// =============================================================================
export function WeatherGlyph({ w, size }: { w: string; size?: number }) {
  const sun = <g className="pm-wx-sun"><circle r="7" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="10" x2="14" transform={`rotate(${a})`} />)}</g>;
  const cloud = (dx = 0, dy = 0) => <path className="pm-wx-cloud" transform={`translate(${dx} ${dy})`} d="M-12 6 Q-14 -2 -6 -3 Q-4 -10 4 -8 Q11 -9 12 -1 Q17 1 14 6 Z" />;
  return (
    <svg className="pm-wx" viewBox="-18 -18 36 36" aria-hidden style={size ? { width: size, height: size } : undefined}>
      {w === 'sonnig' || w === 'hitze' ? sun : null}
      {w === 'bewoelkt' && <><g transform="translate(-5 -5) scale(0.7)">{sun}</g>{cloud(3, 3)}</>}
      {(w === 'regen' || w === 'schnee' || w === 'wind' || w === 'nebel') && cloud(0, -4)}
      {w === 'regen' && [-7, 0, 7].map((x) => <line key={x} className="pm-wx-rain" x1={x} y1="6" x2={x - 3} y2="14" />)}
      {w === 'schnee' && [-7, 0, 7].map((x) => <circle key={x} className="pm-wx-snow" cx={x} cy="11" r="1.8" />)}
      {w === 'wind' && <path className="pm-wx-rain" d="M-14 8 H6 Q10 8 10 11 M-12 13 H10" />}
      {w === 'nebel' && [6, 10, 14].map((y) => <line key={y} className="pm-wx-rain" x1="-14" x2="14" y1={y} y2={y} />)}
    </svg>
  );
}
