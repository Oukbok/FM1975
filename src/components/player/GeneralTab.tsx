// Reiter „Allgemein“ (Vorbild EA Fussball Manager): Spielerdaten, Kacheln Alter/Gewicht/Größe/
// Fitness/Frische und Erfahrung/Moral/Form/Zufriedenheit/Status, darunter Disziplin und
// Führung in Worten sowie die verdeckten Werte nur als Einschätzung (game/hiddenTraits.ts).
import { NatFlag } from '../competition/CountryFlag';
import type { ReactNode } from 'react';
import type { Player } from '../../types';
import { useClubProfile } from '../club/ClubLink';
import { languageOf } from '../../engine/dressingRoom';
import { careerPhase, PHASE_LABEL, personaOf } from '../../engine/persona';
import { homeRegionOf } from '../../game/playerWishesGame';
import { condColor, vColor } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import type { InfoKey } from '../../data/infoTexts';
import Icon from '../Icon';
import {
  FitnessIcon, FormIcon, FreshnessIcon, MoraleIcon, fitness100, form100, freshness100, playerMorale100,
  statusLevel, statusWord, type StatusKind,
} from '../status';
import { HiddenLine } from './HiddenLine';
import { AVAIL_DE, POS_DE, Section, utcDate } from './shared';
import { disciplineText, leadershipText, nationName } from './profileData';

function Tile({ label, info, big, icon, sub, color }: { label: string; info?: InfoKey; big: ReactNode; icon?: ReactNode; sub?: ReactNode; color?: string }) {
  return (
    <div className="pp2-tile">
      <div className="pp2-tile-lbl">{label}{info && <InfoTip k={info} />}</div>
      <div className="pp2-tile-mid">{icon}<b className="pp2-tile-big" style={color ? { color } : undefined}>{big}</b></div>
      <div className="pp2-tile-sub">{sub}</div>
    </div>
  );
}

function StatusTile({ kind, v }: { kind: Exclude<StatusKind, 'kraft'>; v: number }) {
  const Ico = kind === 'frische' ? FreshnessIcon : kind === 'form' ? FormIcon : kind === 'fitness' ? FitnessIcon : MoraleIcon;
  const label = kind === 'frische' ? 'Frische' : kind === 'form' ? 'Form' : kind === 'fitness' ? 'Fitness' : 'Moral';
  return <Tile label={label} info={kind} icon={<Ico value={v} size={26} />} big={v} sub={statusWord(kind, statusLevel(kind, v))} />;
}

function availability(p: Player): { big: string; sub: string; bad: boolean } {
  if (p.availability === 'injured') return { big: `${p.injury?.daysRemaining ?? '?'}`, sub: `Tage verletzt`, bad: true };
  if (p.availability === 'suspended') return { big: `${p.suspensionMatches || '?'}`, sub: `Spiel${p.suspensionMatches === 1 ? '' : 'e'} gesperrt`, bad: true };
  if (p.availability === 'ill') return { big: `${p.injury?.daysRemaining ?? '–'}`, sub: 'krank', bad: true };
  return { big: '', sub: AVAIL_DE[p.availability], bad: false };
}

export default function GeneralTab({ p }: { p: Player }) {
  const g = useClubProfile()?.game;
  const pe = personaOf(p);
  const home = g ? homeRegionOf(g, p) : '';
  const homeClub = pe.homeClubId && g ? (g.clubs[pe.homeClubId]?.name ?? g.simClubs?.[pe.homeClubId]?.name) : undefined;
  const exp = Math.round(p.attributes.experience);
  const lead = Math.round(p.attributes.leadership);
  const sat = Math.round(p.contract.satisfaction ?? 60);
  const av = availability(p);
  return (
    <div className="pp2-general">
      <Section title="Spielerdaten">
        <div className="pp-list">
          <Row label="Name">{p.fullName}</Row>
          <Row label="Nationalität"><NatFlag nat={p.nationality} height={16} />{nationName(p.nationality)}</Row>
          {p.intl?.caps ? <Row label="Länderspiele">{p.intl.caps} · {p.intl.goals} Tore{p.intl.tourn?.length ? <span className="dim"> · {p.intl.tourn.map((x) => `${x.t} (${x.res})`).join(', ')}</span> : null}</Row> : null}
          <Row label="Sprache">{languageOf(p)}</Row>
          <Row label="Heimat">{home || '—'}{homeClub && <span className="dim"> · Jugend bei {homeClub}</span>}</Row>
          <Row label="Position">{POS_DE[p.naturalPosition] ?? p.naturalPosition}{p.secondaryPositions.length > 0 && <span className="dim"> · auch {p.secondaryPositions.join(', ')}</span>}</Row>
          <Row label="Karrierephase">{PHASE_LABEL[careerPhase(p)]}</Row>
        </div>
      </Section>

      <div className="pp2-tiles">
        <Tile label="Alter" big={p.age} sub={utcDate(p.dateOfBirth)} />
        <Tile label="Gewicht" big={p.weight} sub="kg" />
        <Tile label="Größe" big={p.height} sub="cm" />
        <StatusTile kind="fitness" v={fitness100(p)} />
        <StatusTile kind="frische" v={freshness100(p)} />
        <Tile label="Erfahrung" big={exp} color={vColor(exp)} sub={<span className="pp2-mini"><span style={{ width: `${exp}%` }} /></span>} />
        <StatusTile kind="moral" v={playerMorale100(p)} />
        <StatusTile kind="form" v={form100(p)} />
        <Tile label="Zufriedenheit" info="zufriedenheit" big={sat} color={condColor(sat)} sub="mit dem Vertrag" />
        <Tile label="Status" icon={<span className={`pp2-avail${av.bad ? ' bad' : ''}`}><Icon name="medCross" size={26} /></span>}
          big={av.big} sub={av.sub} color={av.bad ? 'var(--neg)' : undefined} />
      </div>

      <Section title="Auftreten">
        <div className="pp-list">
          <Row label="Disziplin">{disciplineText(p)}</Row>
          <Row label="Führungsqualitäten">{leadershipText(lead)} <span className="dim">({lead})</span></Row>
        </div>
        <div className="pp2-hidden">
          <HiddenLine g={g} p={p} trait="konstanz" info="konstanz" />
          <HiddenLine g={g} p={p} trait="nerven" info="nervenstaerke" />
          <HiddenLine g={g} p={p} trait="fleiss" info="trainingsfleiss" />
        </div>
      </Section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="pp-line pp2-row"><span className="pp-line-lbl">{label}</span><span>{children}</span></div>;
}
