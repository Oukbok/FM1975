// =============================================================================
// Transferbilanz/Top-Transfers: kleine Bausteine (Wappen jedes Vereins, Gesicht,
// Vereinszelle, Ablöse-Text). CSS 28-transfer3.css (.tw-*).
// =============================================================================
import ClubCrest from '../../../components/ClubCrest';
import PlayerAvatar from '../../../components/PlayerAvatar';
import { ClubLink } from '../../../components/club/ClubLink';
import { clubView } from '../../../game/clubProfile';
import type { Game } from '../../../game/state';
import type { TLRow } from '../../../game/transferLogView';
import type { Player } from '../../../types';
import { fmtPrice } from '../../../ui/format';

/** Wappen eines beliebigen Vereins (Liga, Unterklasse, Ausland); unbekannt = neutraler Punkt. */
export function AnyCrest({ g, id, size }: { g: Game; id?: string; size: number }) {
  if (!id) return <span className="tw-dot" style={{ width: size * 0.45, height: size * 0.45 }} />;
  const eu = !g.clubs[id] && !g.simClubs?.[id] ? g.euroClubs?.[id] : undefined;
  if (eu) return <span className="tw-dot" style={{ width: size * 0.5, height: size * 0.5, background: eu.colors.primary, borderColor: eu.colors.secondary }} />;
  return <ClubCrest club={clubView(g, id, Number(g.season.slice(0, 4))) as never} size={size} />;
}

/** Wappen + Name, klickbar (Vereinsprofil), eigener Verein hervorgehoben. */
export function ClubCell({ g, id, name, size = 26 }: { g: Game; id?: string; name: string; size?: number }) {
  return (
    <ClubLink id={id}>
      <span className={`tw-club ${id && id === g.managedClubId ? 'me' : ''}`}>
        <span className="tw-crest" style={{ width: size, height: size }}><AnyCrest g={g} id={id} size={size} /></span>
        <span className="tw-club-name">{name}</span>
      </span>
    </ClubLink>
  );
}

/** Gesicht; Spieler, die das Spiel verlassen haben, bekommen ein Platzhalter-Gesicht aus ID + Name. */
export function Face({ g, row, size }: { g: Game; row: TLRow; size: number }) {
  const p = row.player ?? ({ id: row.e.p, fullName: row.e.n, nationality: row.e.nat } as Player);
  return <PlayerAvatar player={p} club={row.toId ? g.clubs[row.toId] : undefined} size={size} />;
}

export function feeText(r: TLRow): string {
  if (r.back) return 'Leih-Ende';
  if (r.loan) return r.e.fee > 0 ? `Leihe (${fmtPrice(r.e.fee)})` : 'Leihe';
  return r.e.fee > 0 ? fmtPrice(r.e.fee) : 'ablösefrei';
}

export const fmtDate = (iso?: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '–');

/** Potenzial-Spanne der Scouts als „3–4 ★“. */
export function potText(r: TLRow): string {
  if (!r.pot) return '–';
  const f = (x: number) => x.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  return r.pot[0] === r.pot[1] ? `${f(r.pot[0])} ★` : `${f(r.pot[0])}–${f(r.pot[1])} ★`;
}

/** Spielername, klickbar, wenn er noch im Spiel ist. */
export function PlayerName({ row, onOpen, cls = '' }: { row: TLRow; onOpen: (id: string) => void; cls?: string }) {
  if (!row.player) return <span className={`tw-pname gone ${cls}`} title="Spieler hat den deutschen Fußball verlassen">{row.e.n}</span>;
  return (
    <span className={`tw-pname ${cls}`} role="button" tabIndex={0} title="Spielerprofil öffnen"
      onClick={(e) => { e.stopPropagation(); onOpen(row.e.p); }}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(row.e.p); }}>{row.e.n}</span>
  );
}
