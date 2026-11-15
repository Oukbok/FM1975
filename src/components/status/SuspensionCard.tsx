// Sperre als Kartensymbol statt Wort (Wunsch Pascal): Rote Karte = Platzverweis,
// Gelbe und Rote leicht schräg übereinander = Gelbsperre bzw. Gelb-Rot.
// Die Ursache steht in `Player.suspensionCause` (fehlt bei älteren Spielständen → Rot).
// Farben `--card-yellow`/`--card-red` in 00-base.css, CSS `.susp` in 28-status2.css.
import type { Player } from '../../types';

export default function SuspensionCard({ p, size = 20, count }: { p: Pick<Player, 'suspensionMatches' | 'suspensionCause'>; size?: number; /** Zahl der Spiele daneben zeigen. */ count?: boolean }) {
  if (p.suspensionMatches <= 0) return null;
  const yellow = p.suspensionCause === 'yellow';
  const n = p.suspensionMatches;
  const text = `${yellow ? 'Gelbsperre' : 'Rotsperre'}: noch ${n} ${n === 1 ? 'Spiel' : 'Spiele'} gesperrt`;
  return (
    <span className="susp" title={text} aria-label={text} role="img">
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
        {yellow ? (
          <>
            <rect className="susp-y" x="3.2" y="3.4" width="8.6" height="12.4" rx="1.3" transform="rotate(-14 7.5 9.6)" />
            <rect className="susp-r" x="8.4" y="4.2" width="8.6" height="12.4" rx="1.3" transform="rotate(10 12.7 10.4)" />
          </>
        ) : <rect className="susp-r" x="5.4" y="2.8" width="9.2" height="14.4" rx="1.5" transform="rotate(8 10 10)" />}
      </svg>
      {count && <b>{n}</b>}
    </span>
  );
}
