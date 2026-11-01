// =============================================================================
// Gemeinsame Bausteine der Wettbewerbs-Seiten (Vereinszeile, Zonen, Chips)
// =============================================================================
import type { ReactNode } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import { clubView } from '../../../game/clubProfile';
import { compClubName, foreignCountry } from '../../../game/competitionView';
import type { Game } from '../../../game/state';
import { seasonStartYear } from '../../../data/timeline';
import { isLocalClub, localClubColor } from '../../../game/youthComps/localClubs';

/** Verein mit Wappen (deutsch) bzw. Farbpunkt (Ausland), klickbar wenn Profil vorhanden. */
export function TeamName({ g, id, season, short = false, size = 20 }: { g: Game; id: string; season: string; short?: boolean; size?: number }) {
  const country = foreignCountry(g, id);
  const name = compClubName(g, id, season, short);
  if (country || id.startsWith('x_')) {
    const col = g.euroClubs?.[id]?.colors.primary ?? (isLocalClub(id) ? localClubColor(id) : 'var(--text-4)');
    return (
      <span className="cmp-team" title={country ? `${name} (${country})` : isLocalClub(id) ? `${name} (Ortsverein)` : name}>
        <span className="cmp-dot" style={{ background: col }} />
        <span className="cmp-team-name">{name}</span>
      </span>
    );
  }
  const v = clubView(g, id, seasonStartYear(season));
  return (
    <ClubLink id={id} className="cmp-team">
      <ClubCrest club={v as never} size={size} />
      <span className="cmp-team-name" title={name}>{name}</span>
    </ClubLink>
  );
}

export function Chips<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: ReactNode; disabled?: boolean; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <span className="cmp-chips">
      {options.map((o) => (
        <button key={String(o.v)} className={`dchip ${value === o.v ? 'on' : ''}`} disabled={o.disabled} title={o.title} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </span>
  );
}

/** Tabellenzone: Meister/Europa/Abstieg (1. Liga), Aufstieg (2. Liga), Meister/Abstieg (DDR, Historie). */
export function zoneOf(pos: number, tier: number | undefined, rows: number, historic: boolean): string {
  if (tier === 1) {
    if (pos === 1) return 'zone-cl';
    if (!historic && pos <= 4) return 'zone-eu';
    if (pos > rows - (historic ? 2 : 3)) return 'zone-rel';
    return '';
  }
  if (tier === 101) return pos === 1 ? 'zone-cl' : pos > rows - 2 ? 'zone-rel' : '';
  if (tier === 2) return pos === 1 ? 'zone-cl' : pos === 2 ? 'zone-eu' : '';
  return pos === 1 ? 'zone-cl' : '';
}
