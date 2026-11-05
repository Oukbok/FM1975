// =============================================================================
// Vorschau „Nächstes Spiel“ – Bühne: gezeichnetes Stadion (ruhig, Epoche nach Jahr:
// Flutlichtmasten bis Ende der 90er, danach Dachkante mit Lichtband), beide Wappen groß,
// darunter die Leiste „(Platz) HEIM – AUSWÄRTS (Platz)“ mit Vereinsfarbe nur als 3-px-Kante.
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import type { PrematchSide } from '../../game/prematch';

/** Tribünen-Silhouette mit Sitzreihen; Größe nach Kapazität. */
function StadiumBackdrop({ year, capacity }: { year: number; capacity: number }) {
  const big = Math.min(1, Math.max(0, (capacity - 15000) / 55000));
  const standTop = 150 - big * 46;
  const roof = year >= 1988;
  const rows = 9 + Math.round(big * 6);
  const rowLines = Array.from({ length: rows }, (_, i) => standTop + 14 + (i * (196 - standTop - 14)) / rows);
  return (
    <svg className="pm-stage-svg" viewBox="0 -110 900 410" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="pmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="pm-sky-0" />
          <stop offset="100%" className="pm-sky-1" />
        </linearGradient>
        <linearGradient id="pmGrass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="pm-grass-0" />
          <stop offset="100%" className="pm-grass-1" />
        </linearGradient>
        <linearGradient id="pmShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stopOpacity="0" className="pm-shade" />
          <stop offset="100%" stopOpacity="0.85" className="pm-shade" />
        </linearGradient>
      </defs>
      <rect y="-110" width="900" height="410" fill="url(#pmSky)" />
      {/* Gegentribüne */}
      <path className="pm-stand" d={`M0 ${standTop + 18} L900 ${standTop + 18} L900 200 L0 200 Z`} />
      <path className="pm-stand-top" d={`M0 ${standTop + 18} L900 ${standTop + 18} L900 ${standTop + 24} L0 ${standTop + 24} Z`} />
      {rowLines.map((y, i) => <line key={i} className="pm-seatrow" x1="0" x2="900" y1={y + 10} y2={y + 10} />)}
      {/* Aufgänge */}
      {[120, 300, 480, 660, 840].map((x) => <rect key={x} className="pm-stair" x={x} y={standTop + 24} width="6" height={176 - standTop - 24} />)}
      {roof ? (
        <g>
          <path className="pm-roof" d={`M-10 ${standTop - 4} L910 ${standTop - 4} L910 ${standTop + 18} L-10 ${standTop + 18} Z`} />
          <rect className="pm-lightband" x="-10" y={standTop + 12} width="920" height="3" />
          {[90, 270, 450, 630, 810].map((x) => <rect key={x} className="pm-roof-post" x={x} y={standTop + 18} width="4" height="10" />)}
        </g>
      ) : (
        [90, 810].map((x) => (
          <g key={x} className="pm-mast">
            <path d={`M${x - 3} 200 L${x - 1.5} ${standTop - 70} L${x + 1.5} ${standTop - 70} L${x + 3} 200 Z`} />
            <rect className="pm-lamp" x={x - 22} y={standTop - 96} width="44" height="28" rx="2" />
            {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
              <circle key={`${r}${c}`} className="pm-bulb" cx={x - 15 + c * 10} cy={standTop - 89 + r * 8} r="2.4" />
            )))}
          </g>
        ))
      )}
      {/* Bandenreihe */}
      <rect className="pm-board" x="0" y="196" width="900" height="12" />
      {/* Rasen in Perspektive mit Mähstreifen */}
      <path d="M0 208 L900 208 L900 300 L0 300 Z" fill="url(#pmGrass)" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} className="pm-stripe" d={`M${i * 100} 208 L${i * 100 + 50} 208 L${(i * 100 + 50 - 450) * 1.8 + 450} 300 L${(i * 100 - 450) * 1.8 + 450} 300 Z`} />
      ))}
      <path className="pm-line" d="M0 222 L900 222 M450 222 L450 300" />
      <ellipse className="pm-line" cx="450" cy="262" rx="120" ry="26" />
      <rect y="-110" width="900" height="410" fill="url(#pmShade)" />
    </svg>
  );
}

export function PrematchStage({ home, away, year, capacity }: { home: PrematchSide; away: PrematchSide; year: number; capacity: number }) {
  const label = (s: PrematchSide, left: boolean) => {
    const pos = s.position != null ? `(${s.position})` : '';
    return left ? <>{pos && <span className="pm-bar-pos">{pos}</span>}<span className="pm-bar-name" data-club={s.id}>{s.name}</span></>
      : <><span className="pm-bar-name" data-club={s.id}>{s.name}</span>{pos && <span className="pm-bar-pos">{pos}</span>}</>;
  };
  return (
    <div className="pm-stage">
      <StadiumBackdrop year={year} capacity={capacity} />
      <div className="pm-crests">
        <div className="pm-crest"><ClubCrest club={home.club} size={230} /></div>
        <div className="pm-crest"><ClubCrest club={away.club} size={230} /></div>
      </div>
      <div className="pm-bar">
        <div className={`pm-bar-side home ${home.mine ? 'mine' : ''}`} style={{ ['--club' as string]: home.club.colors.primary }}>{label(home, true)}</div>
        <div className="pm-bar-mid">–</div>
        <div className={`pm-bar-side away ${away.mine ? 'mine' : ''}`} style={{ ['--club' as string]: away.club.colors.primary }}>{label(away, false)}</div>
      </div>
    </div>
  );
}
