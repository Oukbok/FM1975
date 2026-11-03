// =============================================================================
// Bausteine der Ziehungs-Show: Kugel (Kommentarband) und Zusammenfassung
// „Dein Los“. Lostopf/Paarungsliste in DrawBoard.tsx. Rahmen + Steuerung in DrawShow.tsx, Stil in 28-draw.css.
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import { fmtDateFull } from '../../ui/format';
import type { DrawRecord } from '../../types/draw';
import type { ShowClub } from './drawScript';

type Clubs = Record<string, ShowClub>;

/** Schriftgröße so, dass lange Vereinsnamen nicht abgeschnitten werden. */
function fitSize(name: string, base: number, fitChars: number): number {
  const n = name.length;
  return n <= fitChars ? base : Math.max(Math.round(base * 0.55), Math.round(base * fitChars / n));
}

/** Kugel als SVG (neutraler Schiefer, Topf B mit Bernstein-Band). */
export function BallSvg({ pot, size = 46, no }: { pot: number; size?: number; no?: number }) {
  const gid = `drb${pot}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="dr-ballsvg">
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#c9d0d9" />
          <stop offset="100%" stopColor="#6b7480" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill={`url(#${gid})`} />
      {pot === 1 && <path d="M2.5 20 a17.5 17.5 0 0 0 35 0" fill="none" stroke="var(--accent)" strokeWidth="3" opacity="0.9" />}
      {no != null && <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1a1d23" fontFamily="Oswald, Barlow, sans-serif">{no}</text>}
    </svg>
  );
}

function PairSide({ c, label, fresh }: { c: ShowClub; label: string; fresh: boolean }) {
  return (
    <div className={`dr-side ${c.mine ? 'mine' : ''} ${fresh ? 'fresh' : ''}`}>
      <ClubLink id={c.id}><ClubCrest club={c.crest} size={170} /></ClubLink>
      <div className="dr-side-name" style={{ fontSize: fitSize(c.name, 50, 13) }}>{c.name}</div>
      <div className="dr-side-lbl">{label}</div>
    </div>
  );
}

/** Ende: dein Los groß (Gegner, Termin, Heim/Auswärts, Stärkevergleich). */
export function DrawSummary({ rec, clubs, myId, endLine, onClose, closeLabel = 'Schließen' }: { rec: DrawRecord; clubs: Clubs; myId: string; endLine: string; onClose: () => void; closeLabel?: string }) {
  const my = rec.pairs.find((p) => p.home === myId || p.away === myId);
  const top = [...rec.pairs].sort((x, y) => Math.min(clubs[y.home].strength, clubs[y.away].strength) - Math.min(clubs[x.home].strength, clubs[x.away].strength))[0];
  const show = my ?? top;
  const h = clubs[show.home], a = clubs[show.away];
  const me = my ? clubs[myId] : null;
  const opp = my ? (my.home === myId ? a : h) : null;
  const diff = me && opp ? opp.strength - me.strength : 0;
  const verdict = !opp ? '' : diff >= 4 ? 'Der Gegner ist favorisiert.' : diff <= -4 ? 'Dein Verein geht als Favorit ins Spiel.' : 'Ein Duell auf Augenhöhe.';
  const max = Math.max(h.strength, a.strength, 1);
  return (
    <div className="dr-summary">
      <div className="dr-sum-kicker">{my ? 'Dein Los' : 'Dein Verein ist nicht dabei – das Topspiel der Runde'}</div>
      <div className="dr-sum-pair">
        <PairSide c={h} label="Heim" fresh={false} />
        <div className="dr-sum-mid">
          <span className="dr-vs">gegen</span>
          <span className="dr-sum-date">{fmtDateFull(rec.matchDate)}</span>
          {my && <span className="dr-pill">{my.home === myId ? 'Heimspiel' : 'Auswärtsspiel'}</span>}
        </div>
        <PairSide c={a} label="Gast" fresh={false} />
      </div>
      <div className="dr-sum-bars">
        {[h, a].map((c) => (
          <div key={c.id} className={`dr-bar ${c.mine ? 'mine' : ''}`}>
            <span className="dr-bar-lbl">{c.short}</span>
            <span className="dr-bar-track"><span style={{ width: `${Math.round((c.strength / max) * 100)}%` }} /></span>
            <span className="dr-bar-val">{c.strength}</span>
          </div>
        ))}
      </div>
      <div className="dr-sum-line">{verdict} {endLine}</div>
      <button className="dr-close" onClick={onClose}>{closeLabel}</button>
    </div>
  );
}
