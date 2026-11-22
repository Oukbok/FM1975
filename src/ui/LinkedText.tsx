// Fließtext mit klickbaren Spieler- und Vereinsnamen (Wunsch Pascal; Register game/nameIndex.ts).
import { Fragment, useMemo } from 'react';
import type { Game } from '../game/state';
import type { Player } from '../types';
import { lastNameRefs, linkParts, nameIndex } from '../game/nameIndex';
import { PlayerLink } from '../components/playerMenu/PlayerLink';
import { ClubLink } from '../components/club/ClubLink';

export function LinkedText({ g, text, people }: { g: Game; text: string | undefined; people?: Pick<Player, 'id' | 'lastName' | 'fullName'>[] }) {
  const parts = useMemo(() => linkParts(g, text ?? '', people?.length ? lastNameRefs(people) : undefined), [g, text, people, g.calendar.currentDate]);
  return (
    <>
      {parts.map((p, i) => typeof p === 'string'
        ? <Fragment key={i}>{p}</Fragment>
        : p.ref.kind === 'player' ? <PlayerLink key={i} id={p.ref.id} className="txt-link" mark={false}>{p.text}</PlayerLink> : <ClubLink key={i} id={p.ref.id} className="txt-link">{p.text}</ClubLink>)}
    </>
  );
}

/** Vereinsname, von dem nur der Text gespeichert ist (z. B. `TransferRecord.fromClub`): über das
 *  Namensregister klickbar, unbekannt oder mehrdeutig = einfacher Text. */
export function ClubByName({ g, name }: { g: Game; name: string | undefined }) {
  const ref = name ? nameIndex(g).get(name.trim()) : undefined;
  return ref?.kind === 'club' ? <ClubLink id={ref.id}>{name}</ClubLink> : <>{name}</>;
}
