// Fließtext mit klickbaren Spieler- und Vereinsnamen (Wunsch Pascal; Register game/nameIndex.ts).
import { Fragment, useMemo } from 'react';
import type { Game } from '../game/state';
import type { Player } from '../types';
import { lastNameRefs, linkParts } from '../game/nameIndex';
import { PlayerLink } from '../components/playerMenu/PlayerLink';
import { ClubLink } from '../components/club/ClubLink';

export function LinkedText({ g, text, people }: { g: Game; text: string | undefined; people?: Pick<Player, 'id' | 'lastName' | 'fullName'>[] }) {
  const parts = useMemo(() => linkParts(g, text ?? '', people?.length ? lastNameRefs(people) : undefined), [g, text, people, g.calendar.currentDate]);
  return (
    <>
      {parts.map((p, i) => typeof p === 'string'
        ? <Fragment key={i}>{p}</Fragment>
        : p.ref.kind === 'player' ? <PlayerLink key={i} id={p.ref.id} className="txt-link">{p.text}</PlayerLink> : <ClubLink key={i} id={p.ref.id} className="txt-link">{p.text}</ClubLink>)}
    </>
  );
}
