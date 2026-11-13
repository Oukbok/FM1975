// Kopf links im Spielerprofil (Vorbild EA Fussball Manager): Rückennummer + Name groß, Verein,
// Wappen links oben, freigestellter Kopf schräg rechts unten davor (ohne Kasten), daneben Steckbrief – Stärke, Potenzial (Scout-Spanne), Nation,
// Tabelle der sechs besten Positionen (Eignung), Fuß, Spielertyp, Charakter (Einschätzung).
import { NatFlag } from '../competition/CountryFlag';
import type { Player, Club, Position } from '../../types';
import PlayerAvatar from '../PlayerAvatar';
import ClubCrest from '../ClubCrest';
import { ClubLink, useClubProfile } from '../club/ClubLink';
import { scoutRangeText } from '../../engine/scouting';
import { personaOf, personaTitle } from '../../engine/persona';
import { scoutKnowledge } from '../../game/transferTalks';
import { POSITION_NAMES_DE } from '../../engine/positions';
import { vColor } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import { PLAYER_TYPE } from './shared';
import { nationName } from './profileData';
import { worldClubInfo } from '../../game/worldPool';

/** Fuß: starker Fuß zuerst, z. B. „Rechts · links schwach“ (Fußstärken gibt es nicht als Zahl). */
export function footText(p: Player): { strong: string; weak: string } {
  if (p.preferredFoot === 'both') return { strong: 'Beidfüßig', weak: '' };
  return p.preferredFoot === 'left'
    ? { strong: 'Links', weak: 'rechts schwach' }
    : { strong: 'Rechts', weak: 'links schwach' };
}

export default function ProfileHead({ p, club, tag, best, sel, onSelect }: {
  p: Player; club?: Club; tag?: string;
  best: { pos: Position; value: number }[];
  sel: Position; onSelect: (pos: Position) => void;
}) {
  const g = useClubProfile()?.game;
  const mine = !!g && p.clubId === g.managedClubId;
  const known = mine || (!!g && scoutKnowledge(g, p) >= 0.35);
  const character = g ? (known ? personaTitle(personaOf(p)) : 'noch unbekannt') : '—';
  const foot = footText(p);
  return (
    <div className="pp2-id">
      <div className="pp2-title">
        <h2 className="pp2-name">{p.shirtNumber ? <span className="pp2-no">{p.shirtNumber}.</span> : null}{p.fullName}</h2>
        <div className="pp2-club">
          {club ? <ClubLink id={club.id}>{club.name}</ClubLink>
            : p.clubId && g && worldClubInfo(g, p.clubId) ? <ClubLink id={p.clubId}>{worldClubInfo(g, p.clubId)!.name}</ClubLink> : 'Vereinslos'}
          {(p.isYouth || tag) && <span className="pp-tag">{tag ?? 'Jugend'}</span>}
          {p.transferListed && <span className="pp-tag">Transferliste</span>}
          {p.loan && <span className="pp-tag">Leihe</span>}
        </div>
      </div>
      <div className="pp2-idbody">
        <div className="pp2-portrait">
          {club && <div className="pp2-crest"><ClubCrest club={club} size={124} /></div>}
          <div className="pp2-face"><PlayerAvatar key={p.id} player={p} club={club} size={160} priority /></div>
        </div>
        <div className="pp2-facts">
          <div className="pp2-keyrow">
            <div className="pp2-kv"><span>Stärke<InfoTip k="staerke" /></span><b className="pp2-big">{p.overall}</b></div>
            <div className="pp2-kv"><span>Potenzial<InfoTip k="potenzial" /></span><b>{scoutRangeText(p)}</b></div>
            <div className="pp2-kv"><span>Alter</span><b>{p.age} Jahre</b></div>
            <div className="pp2-kv"><span>Nation</span><b><NatFlag nat={p.nationality} height={16} />{nationName(p.nationality)}</b></div>
          </div>
          <table className="pp2-postable">
            <tbody>
              <tr>
                <th>Position</th>
                {best.map((b) => (
                  <td key={b.pos}><button type="button" className={`pp2-poscell${b.pos === sel ? ' on' : ''}`} onClick={() => onSelect(b.pos)}
                    aria-label={POSITION_NAMES_DE[b.pos]}>{b.pos}</button></td>
                ))}
              </tr>
              <tr>
                <th>Eignung</th>
                {best.map((b) => <td key={b.pos} className="pp2-posval" style={{ color: vColor(b.value) }}>{b.value}</td>)}
              </tr>
            </tbody>
          </table>
          <div className="pp2-fl"><span>Fuß</span><b>{foot.strong}{foot.weak && <em> · {foot.weak}</em>}</b></div>
          <div className="pp2-fl"><span>Spielertyp</span><b>{PLAYER_TYPE[p.naturalPosition] ?? '—'}</b></div>
          <div className="pp2-fl"><span>Charakter<InfoTip k="persoenlichkeit" /></span><b className={known ? '' : 'dim'}>{character}</b></div>
        </div>
      </div>
    </div>
  );
}
