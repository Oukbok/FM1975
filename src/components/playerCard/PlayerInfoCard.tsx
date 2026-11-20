// =============================================================================
// Spieler-Infokarte (Wunsch Pascal, Vorbild EA Fussball Manager): schwebendes Fenster
// fester Größe (CARD_W × CARD_H UI-Pixel) mit allem Wichtigen auf einen Blick.
//   Kopf    großes Gesicht + Wappen, Nummer + Name, Position(en), Alter/Geburtstag,
//           Nation mit Flagge, Verein mit Wappen, Kaderrolle; rechts Stärke, Marktwert,
//           Gehalt, Vertragsende
//   Mitte   alle Attribute gruppiert wie im Spielerprofil (player/shared.ts, Schlüsselstriche
//           aus `attrTiers`), rechts Info-Spalte und Positionseignung (Vertrautheit je Position)
//   Fuß     Fähigkeit/Potenzial als Sterne, Moral, Zufriedenheit, Form
// Zeigt nie mehr als das Profil: Potenzial nur als Scout-Spanne, Charakter erst ab
// derselben Scout-Kenntnis wie im Profil, verdeckte Werte gar nicht.
// Reine Anzeige – geöffnet über PlayerCardFloat.tsx; CSS `styles/28-playercard.css`.
// =============================================================================
import type { Club, Player, Position } from '../../types';
import { potentialToStars } from '../../types';
import type { Game } from '../../game/state';
import PlayerAvatar from '../PlayerAvatar';
import ClubCrest from '../ClubCrest';
import PosBadge from '../PosBadge';
import { NatFlag } from '../competition/CountryFlag';
import { StarRating } from '../StarRating';
import { ScoutStarBar, squadOf } from '../../views/shared';
import { fmtPrice, fmtWage, condColor, vColor } from '../../ui/format';
import { scoutKnowledge } from '../../game/transferTalks';
import { worldClubInfo } from '../../game/worldPool';
import { personaOf, personaTitle } from '../../engine/persona';
import { expectedRole, ROLE_DE } from '../../engine/loanDeal';
import { FormIcon, MoraleIcon, form100, playerMorale100, statusLevel, statusWord } from '../status';
import { footText } from '../player/ProfileHead';
import { bestPositions, nationName } from '../player/profileData';
import { PLAYER_TYPE, POS_DE, utcDate } from '../player/shared';
import { CardAttributes, CardPositions } from './PlayerCardParts';

/** Feste Größe der Karte in UI-Pixeln (wächst nur mit der UI-Skalierung). */
export const CARD_W = 900;
export const CARD_H = 560;

/** Ansehen in Worten – reine Anzeige aus Stärke und Länderspielen (kein verdeckter Wert). */
function standing(p: Player): string {
  const words = ['Unbekannt', 'Regional bekannt', 'Solider Profi', 'Etablierter Profi', 'Nationaler Star', 'Internationaler Star'];
  let i = p.overall >= 86 ? 5 : p.overall >= 80 ? 4 : p.overall >= 72 ? 3 : p.overall >= 64 ? 2 : p.overall >= 55 ? 1 : 0;
  if ((p.intl?.caps ?? 0) >= 25) i = Math.min(5, i + 1);
  return words[i];
}

/** Rolle im eigenen Kader (nach Stärke in der Positionsgruppe), Jugend/Leihe gesondert. */
function roleOf(g: Game | undefined, p: Player): string {
  if (p.isYouth) return 'Jugendspieler';
  if (!g) return '—';
  const squad = squadOf(g, p.clubId);
  if (!squad.some((x) => x.id === p.id)) return '—';
  return ROLE_DE[expectedRole(p, squad)];
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="pc-fact"><span>{label}</span><b>{children}</b></div>;
}

export default function PlayerInfoCard({ p, g }: { p: Player; g?: Game }) {
  const club: Club | undefined = g?.clubs[p.clubId];
  const world = !club && g && p.clubId ? worldClubInfo(g, p.clubId) : undefined;
  const clubName = club?.name ?? world?.name ?? 'Vereinslos';
  const mine = !!g && p.clubId === g.managedClubId;
  const known = mine || (!!g && scoutKnowledge(g, p) >= 0.35);
  const best = bestPositions(p);
  const pos: Position = best[0]?.pos ?? p.naturalPosition;
  const foot = footText(p);
  const c = p.contract;
  const mor = playerMorale100(p);
  const frm = form100(p);
  const sat = Math.round(c.satisfaction ?? 60);
  const ability = potentialToStars(p.overall);
  const caps = p.intl?.caps ?? 0;

  return (
    <div className="pc-card" style={{ width: CARD_W, height: CARD_H, ['--club' as string]: club?.colors.primary ?? 'var(--border)' }}>
      <header className="pc-head">
        <div className="pc-portrait">
          {club && <span className="pc-crest"><ClubCrest club={club} size={46} /></span>}
          <span className="pc-face"><PlayerAvatar key={p.id} player={p} club={club} size={116} priority /></span>
        </div>
        <div className="pc-id">
          <h2 className="pc-name">{p.shirtNumber ? <span className="pc-no">{p.shirtNumber}</span> : null}{p.fullName}</h2>
          <div className="pc-posline">
            <PosBadge p={p} />
            <span>{POS_DE[p.naturalPosition] ?? p.naturalPosition}</span>
            <span className="pc-dim">· {PLAYER_TYPE[p.naturalPosition] ?? '—'}</span>
          </div>
          <div className="pc-meta">
            <span><b>{p.age}</b> Jahre <span className="pc-dim">· geb. {utcDate(p.dateOfBirth)}</span></span>
            <span className="pc-nat"><NatFlag nat={p.nationality} height={14} />{nationName(p.nationality)}</span>
          </div>
          <div className="pc-meta">
            <span className="pc-club">{club && <ClubCrest club={club} size={20} />}{clubName}</span>
            <span><span className="pc-dim">Rolle</span> <b>{roleOf(g, p)}</b></span>
            {p.transferListed && <span className="pc-tag">Transferliste</span>}
            {p.loan && <span className="pc-tag">{p.loan.fromClubId === g?.managedClubId ? 'Verliehen' : 'Leihe'}</span>}
          </div>
        </div>
        <div className="pc-keys">
          <div className="pc-ovr"><span>Stärke</span><b style={{ color: vColor(p.overall) }}>{p.overall}</b></div>
          <div className="pc-money">
            <Fact label="Marktwert">{fmtPrice(c.transferValue)}</Fact>
            <Fact label="Gehalt">{fmtWage(c.weeklyWage)}</Fact>
            <Fact label="Vertrag bis">{utcDate(c.expiryDate)}</Fact>
          </div>
        </div>
      </header>

      <div className="pc-body">
        <CardAttributes p={p} pos={pos} />
        <aside className="pc-side">
          <div className="pc-sh">Info</div>
          <Fact label="Größe · Gewicht">{p.height} cm · {p.weight} kg</Fact>
          <Fact label="Starker Fuß">{foot.strong}{foot.weak && <em> · {foot.weak}</em>}</Fact>
          <Fact label="Charakter"><span className={known ? '' : 'pc-dim'}>{g ? (known ? personaTitle(personaOf(p)) : 'noch unbekannt') : '—'}</span></Fact>
          <Fact label="Ansehen">{standing(p)}</Fact>
          <Fact label="Länderspiele">{caps ? `${caps} · ${p.intl?.goals ?? 0} Tore` : 'keine'}</Fact>
          <CardPositions p={p} best={best.map((b) => b.pos)} />
        </aside>
      </div>

      <footer className="pc-foot">
        <div className="pc-fk"><span>Fähigkeit</span><StarRating lo={ability} hi={ability} size={19} label="Fähigkeit" plain /></div>
        <div className="pc-fk"><span>Potenzial</span><ScoutStarBar p={p} size={19} /></div>
        <div className="pc-fk"><span>Moral</span><b><MoraleIcon value={mor} size={20} />{statusWord('moral', statusLevel('moral', mor))}</b></div>
        <div className="pc-fk"><span>Form</span><b><FormIcon value={frm} size={20} />{statusWord('form', statusLevel('form', frm))}</b></div>
        <div className="pc-fk"><span>Zufriedenheit</span><b><i className="pc-sat" style={{ color: condColor(sat) }}>{sat}</i>mit dem Vertrag</b></div>
      </footer>
    </div>
  );
}
