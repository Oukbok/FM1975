// =============================================================================
// Statistiken › Auszeichnungen, oben: Elf der Saison einer Liga – liegendes
// Spielfeld (components/lineup/PitchSVG, um 90° gedreht) mit Namen und Note,
// rechts die Liste. Daten: game.extraAwards.xi/xiw (game/teamOfSeasonGame.ts),
// CSS 28-awards.css (.tos-*).
// =============================================================================
import type { CSSProperties } from 'react';
import { ClubLink } from '../../../components/club/ClubLink';
import PitchSVG from '../../../components/lineup/PitchSVG';
import PosBadge from '../../../components/PosBadge';
import { getFormation } from '../../../data/formations';
import type { TosSeason } from '../../../game/teamOfSeasonGame';
import type { Game } from '../../../game/state';
import { InfoTip } from '../../../ui/InfoTip';
import FaceThumb from '../../../components/FaceThumb';
import { AwardName, awardPerson, fmtGrade } from './AwardParts';

const clubName = (g: Game, id: string) => g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? g.euroClubs?.[id]?.name ?? id;
/** Seitenverhältnis des liegenden Felds (breiter als maßstabsgetreu, Kreise bleiben über `stretch` rund). */
const ASPECT = 2.3;
const STRETCH = (105 / 68) / ASPECT;
const lastName = (n: string) => { const p = n.trim().split(' '); return p.length > 1 ? p.slice(1).join(' ') : n; };

export function TeamOfSeasonTop({ g, t }: { g: Game; t: TosSeason & { dn: string; f: string } }) {
  const f = getFormation(t.f);
  const mine = g.managedClubId;
  const est = !t.x.some((r) => r[3]);
  // Slot-Lagen der Formation in derselben Reihenfolge wie gespeichert (Elf ist immer vollständig);
  // Spieler-ID: eigene Liga im Tupel, Ausland (Weltspieler) aus `ids` der Anzeige.
  const spots = t.x.map((r, i) => ({ r, s: f.slots[i], id: r[3] ?? t.ids?.[i] }));
  const club = (r: TosSeason['x'][number]) => t.c[r[2]] ?? '';
  return (
    <div className="aw-page-top tos-top">
      <div className="gbt-sub">
        <span>Elf der Saison {t.s} · {t.dn}</span>
        <span className="gbt-rule">System {f.label}{est ? ' · Noten aus Toren, Vorlagen und Stärke geschätzt' : ' · nach Notenschnitt und Leistung'}</span>
        <InfoTip k="elf_der_saison" />
      </div>
      <div className="tos-body">
        <div className="tos-pitch">
          <div className="tos-rot"><PitchSVG stretch={STRETCH} /></div>
          {spots.map(({ r, s, id }, i) => (
            <div key={i} className={`tos-chip ${club(r) === mine ? 'mine' : ''}`} style={{ left: `${6 + ((92 - (s?.y ?? 57)) / 70) * 86}%`, top: `${8 + (s?.x ?? 50) * 0.84}%`, '--k': i } as CSSProperties}>
              <AwardName e={{ p: id, n: lastName(r[0]) }} cls="tos-chip-n" />
              <span className="tos-chip-g">{fmtGrade(r[1] / 100)}</span>
            </div>
          ))}
        </div>
        <ol className="tos-list">
          {spots.map(({ r, s, id }, i) => (
            <li key={i} className={club(r) === mine ? 'mine' : ''}>
              <PosBadge pos={s?.position ?? 'ZM'} />
              <span className="tos-list-who"><FaceThumb p={id ? awardPerson(g, id) : undefined} size={24} /><AwardName e={{ p: id, n: r[0] }} cls="tos-list-n" /></span>
              <ClubLink id={club(r)} className="tos-list-c">{clubName(g, club(r))}</ClubLink>
              <span className="tos-list-g">{fmtGrade(r[1] / 100)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
