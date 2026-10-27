// Reiter „Übersicht“: Fähigkeiten | Positionen + Stärken/Schwächen | Saison + Vertrag kompakt
import { Player } from '../../types';
import { POSITION_NAMES_DE } from '../../engine/positions';
import { fmtDM, fmtDMfull, vColor, fmtPrice, fmtPriceFull } from '../../ui/format';
import Icon from '../Icon';
import {
  ATTR_DE, groupsFor, sortedKeys, keyAttributes, PITCH_POS, ratingFor, positionsOf, utcDate,
  Section, Line, Stat, AttrRow,
} from './shared';

export function Pitch({ player }: { player: Player }) {
  return (
    <div className="pp-pitch">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pp-pitch-svg">
        <rect x="1" y="1" width="98" height="98" rx="2" fill="none" stroke="var(--border)" strokeWidth="0.5" />
        <line x1="1" y1="50" x2="99" y2="50" stroke="var(--border)" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="9" fill="none" stroke="var(--border)" strokeWidth="0.4" />
        <rect x="30" y="1" width="40" height="14" fill="none" stroke="var(--border)" strokeWidth="0.4" />
        <rect x="30" y="85" width="40" height="14" fill="none" stroke="var(--border)" strokeWidth="0.4" />
      </svg>
      {positionsOf(player).map((pos) => {
        const xy = PITCH_POS[pos];
        if (!xy) return null;
        const r = ratingFor(player, pos);
        return (
          <div key={pos} className={`pp-pitch-badge${pos === player.naturalPosition ? ' natural' : ''}`} style={{ left: `${xy.x}%`, top: `${xy.y}%` }}>
            <span className="pp-pitch-pos">{pos}</span>
            <span className="pp-pitch-val" style={{ color: vColor(r) }}>{r || '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Stärken = beste, Schwächen = schwächste der für die Position wichtigen Attribute. */
export function strengthsWeaknesses(p: Player) {
  const keys = keyAttributes(p.naturalPosition).slice(0, 10);
  const byVal = [...keys].sort((a, b) => p.attributes[b] - p.attributes[a]);
  return { strengths: byVal.slice(0, 3), weaknesses: byVal.slice(-3).reverse() };
}

export default function OverviewTab({ p }: { p: Player }) {
  const s = p.seasonStats;
  const { strengths, weaknesses } = strengthsWeaknesses(p);
  return (
    <div className="pp-grid pp-grid-overview">
      <Section title="Fähigkeiten" icon={<Icon name="training" size={15} />}>
        <div className="pp-skill-groups">
          {groupsFor(p).map((grp) => (
            <div key={grp.title} className="pp-skill-group">
              <div className="pp-skill-gt">{grp.title}</div>
              {sortedKeys(grp.keys).map((k) => <AttrRow key={k} label={ATTR_DE[k]} value={Math.round(p.attributes[k])} />)}
            </div>
          ))}
        </div>
      </Section>

      <div className="pp-stack">
        <Section title="Positionen" icon={<Icon name="tactics" size={15} />}>
          <Pitch player={p} />
          <div className="pp-list mt8">
            {positionsOf(p).map((pos) => (
              <Line key={pos} label={`${pos} · ${POSITION_NAMES_DE[pos]}`} value={ratingFor(p, pos) || '—'} color={vColor(ratingFor(p, pos))} />
            ))}
          </div>
        </Section>
        <Section title="Stärken & Schwächen" icon={<Icon name="stats" size={15} />}>
          <div className="pp-sw">
            <div>{strengths.map((k) => <div key={k} className="pp-sw-item plus">+ {ATTR_DE[k]} <b>{Math.round(p.attributes[k])}</b></div>)}</div>
            <div>{weaknesses.map((k) => <div key={k} className="pp-sw-item minus">− {ATTR_DE[k]} <b>{Math.round(p.attributes[k])}</b></div>)}</div>
          </div>
        </Section>
      </div>

      <div className="pp-stack">
        <Section title="Saison" icon={<Icon name="schedule" size={15} />}>
          <div className="pp-stat-grid">
            <Stat label="Einsätze" value={s.appearances} sub={`${s.starts} Startelf`} />
            <Stat label="Tore" value={s.goals} />
            <Stat label="Vorlagen" value={s.assists} />
            <Stat label="Minuten" value={s.minutesPlayed} />
            <Stat label="Karten" value={`${s.yellowCards} / ${s.redCards + s.yellowRedCards}`} sub="Gelb / Rot" />
            {p.naturalPosition === 'TW'
              ? <Stat label="Zu null" value={s.cleanSheets} />
              : <Stat label="Ø Note" value={s.averageRating > 0 ? s.averageRating.toFixed(2) : '—'} />}
          </div>
        </Section>
        <Section title="Vertrag" icon={<Icon name="contracts" size={15} />}>
          <div className="pp-list">
            <Line label="Marktwert" value={fmtPrice(p.contract.transferValue)} strong />
            <Line label="Gehalt / Woche" value={fmtPriceFull(p.contract.weeklyWage)} />
            <Line label="Vertrag bis" value={utcDate(p.contract.expiryDate)} />
            <Line label="Zufriedenheit" value={`${p.contract.satisfaction} %`} color={vColor(p.contract.satisfaction)} />
          </div>
        </Section>
      </div>
    </div>
  );
}
