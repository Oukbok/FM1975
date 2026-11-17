// =============================================================================
// Bausteine für Aufstellung › Spielplan (Mockup Pascal): Leiste „Nächstes
// Pflichtspiel“ mit Fanbild, Saisonbilanz-Kacheln, Kürzel für den Spieltag.
// CSS `.fxp-*` in 28-fixtures.css.
// =============================================================================
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import Icon from '../../../components/Icon';
import { fanPhoto } from '../../../data/fixtureImages';
import { CalendarEngine } from '../../../engine/calendar';
import type { Game } from '../../../game/state';
import { oppName, type NextOpp } from '../../../game/opponentView';

/** Gezeichnete Fankurve (Rückfall ohne Foto): Köpfe/Schultern in Reihen, nur Grautöne. */
function CrowdArt() {
  const rows = [0, 1, 2, 3, 4];
  return (
    <svg className="fxp-crowd" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {rows.map((r) => {
        const y = 18 + r * 22, n = 22 + r * 2, w = 300 / n;
        return (
          <g key={r} opacity={0.35 + r * 0.14}>
            {Array.from({ length: n }, (_, i) => {
              const x = i * w + (r % 2 ? w / 2 : 0) + ((i * 7 + r * 3) % 5) - 2;
              const up = (i * 13 + r * 5) % 9 === 0;
              return (
                <g key={i}>
                  <ellipse cx={x} cy={y + 14} rx={w * 0.48} ry={9} />
                  <circle cx={x} cy={y + 1} r={w * 0.26} />
                  {up && <line x1={x + w * 0.3} y1={y + 6} x2={x + w * 0.6} y2={y - 12} strokeWidth={2.6} strokeLinecap="round" />}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** Leiste „Nächstes Pflichtspiel“: Fanbild | Termin/Ort | Heim – Ergebnis – Gast | Gegner ansehen. */
export function FixtureStrip({ g, nx, onOpponent }: { g: Game; nx: NextOpp | null; onOpponent: () => void }) {
  const year = +g.calendar.currentDate.slice(0, 4);
  const photo = fanPhoto(year, nx ? `${nx.date}|${nx.opp}` : g.calendar.currentDate);
  const pic = (
    <div className="fxp-photo">
      {photo ? <img src={photo} alt="" /> : <CrowdArt />}
      <span className="fxp-tint" />
    </div>
  );
  if (!nx) return <div className="fxp-strip">{pic}<div className="fxp-when"><span className="fxp-kicker">Nächstes Pflichtspiel</span><span className="fxp-none">Kein weiteres Pflichtspiel angesetzt.</span></div></div>;
  const me = g.managedClubId;
  const homeId = nx.home ? me : nx.opp, awayId = nx.home ? nx.opp : me;
  const host = g.clubs[homeId];
  const place = host ? [host.stadium?.name, host.city].filter(Boolean).join(', ') : '';
  const crest = (id: string) => g.clubs[id] ? <ClubCrest club={g.clubs[id]} size={66} /> : <span className="fxp-nocrest" />;
  return (
    <div className="fxp-strip">
      {pic}
      <div className="fxp-when">
        <span className="fxp-kicker">Nächstes Pflichtspiel – {nx.kind === 'liga' && nx.matchday ? `${nx.matchday}. Spieltag` : nx.comp}</span>
        <span className="fxp-date"><Icon name="schedule" size={24} />{CalendarEngine.formatDate(nx.date).replace(/^(\w+),/, '$1,')}</span>
        {place && <span className="fxp-place"><Icon name="pin" size={18} />{place}</span>}
      </div>
      <span className="fxp-slash" />
      <div className="fxp-match">
        <ClubLink id={homeId} className="fxp-team home">{crest(homeId)}<b>{oppName(g, homeId)}</b></ClubLink>
        <span className="fxp-score">–:–</span>
        <ClubLink id={awayId} className="fxp-team away"><b>{oppName(g, awayId)}</b>{crest(awayId)}</ClubLink>
      </div>
      <span className="fxp-slash" />
      <button className="fxp-go" onClick={onOpponent}><Icon name="watchlist" size={20} />Gegner ansehen</button>
    </div>
  );
}

/** Kürzel aus drei Buchstaben: „Köln Rot“ → KÖR, „Karlsruhe“ → KAR; bei Doppelungen zweite Wahl. */
export function clubCodes(names: Record<string, string>): Record<string, string> {
  const first = (n: string) => {
    const w = n.replace(/[^\p{L} ]/gu, '').trim().split(/\s+/);
    return (w.length > 1 ? w[0].slice(0, 2) + w[w.length - 1][0] : w[0].slice(0, 3)).toUpperCase();
  };
  const second = (n: string) => {
    const w = n.replace(/[^\p{L} ]/gu, '').trim().split(/\s+/);
    return (w.length > 1 ? w[0][0] + w[w.length - 1].slice(0, 2) : w[0][0] + w[0].slice(-2)).toUpperCase();
  };
  const out: Record<string, string> = {};
  const used = new Map<string, number>();
  for (const n of Object.values(names)) used.set(first(n), (used.get(first(n)) ?? 0) + 1);
  for (const [id, n] of Object.entries(names)) out[id] = (used.get(first(n)) ?? 0) > 1 ? second(n) : first(n);
  return out;
}
