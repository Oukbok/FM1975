// =============================================================================
// Gemeinsame Bausteine der Wettbewerbs-Seiten (Vereinszeile, Zonen, Chips)
// =============================================================================
import { isDdrClub } from '../../../game/ddrHome';
import { createContext, useContext, type ReactNode } from 'react';
import { CountryFlag } from '../../../components/competition/CountryFlag';
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import { clubView } from '../../../game/clubProfile';
import { compClubName, foreignCountry } from '../../../game/competitionView';
import { homeCountryKey, type Game } from '../../../game/state';
import { seasonStartYear } from '../../../data/timeline';
import Seg from '../../../ui/Seg';
import { ctClub } from '../../../data/world/continents';
import { isLocalClub, localClubColor } from '../../../game/youthComps/localClubs';

/** Internationale Wettbewerbe (Wunsch Pascal): hinter dem Wappen die Landesflagge. */
export const TeamFlagCtx = createContext(false);

/** Verein mit Wappen (deutsch) bzw. Farbpunkt (Ausland), klickbar wenn Profil vorhanden. */
export function TeamName({ g, id, season, short = false, size = 20 }: { g: Game; id: string; season: string; short?: boolean; size?: number }) {
  const country = foreignCountry(g, id);
  const name = compClubName(g, id, season, short);
  const withFlag = useContext(TeamFlagCtx);
  const flag = withFlag ? <CountryFlag country={country ?? (isDdrClub(g, id) && Number(season.slice(0, 4)) < 1991 ? 'DDR' : homeCountryKey(g))} height={Math.max(10, Math.round(size * 0.55))} /> : null;
  if (country || id.startsWith('x_') || id.startsWith('t:')) {
    const col = g.euroClubs?.[id]?.colors.primary ?? ctClub(id)?.club.colors[0] ?? (isLocalClub(id) ? localClubColor(id) : 'var(--text-4)');
    return (
      <span className="cmp-team" title={country ? `${name} (${country})` : isLocalClub(id) ? `${name} (Ortsverein)` : name}>
        <span className="cmp-dot-box" style={{ width: size, height: size }}><span className="cmp-dot" style={{ background: col }} /></span>
        {flag}
        <ClubLink id={id}><span className="cmp-team-name">{name}</span></ClubLink>
      </span>
    );
  }
  const v = clubView(g, id, seasonStartYear(season));
  // Mit Flagge: Flagge außerhalb des Vereinslinks, damit ihr Klick das Länderprofil öffnet.
  if (flag) return (
    <span className="cmp-team">
      <ClubLink id={id}><ClubCrest club={v as never} size={size} /></ClubLink>
      {flag}
      <ClubLink id={id}><span className="cmp-team-name" title={name}>{name}</span></ClubLink>
    </span>
  );
  return (
    <ClubLink id={id} className="cmp-team">
      <ClubCrest club={v as never} size={size} />
      <span className="cmp-team-name" title={name}>{name}</span>
    </ClubLink>
  );
}

export function Chips<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: ReactNode; disabled?: boolean; title?: string }[]; onChange: (v: T) => void }) {
  return <Seg<T> className="cmp-chips" value={value} options={options} onChange={onChange} />;
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
