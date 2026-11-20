// Bausteine der Spieler-Infokarte: Attribute (gleiche Gruppen/Namen/Farben wie im Spielerprofil,
// `player/shared.ts` + `player/SkillsPanel.tsx`) und Positionseignung als kleines Feld
// (Vertrautheit je Position aus `positionSkill`, Eignung aus `positionSuitability`).
import type { Player, Position } from '../../types';
import { positionSuitability } from '../../engine/positions';
import { skillOf, skillTier, TIER_DE } from '../../engine/positionSkill';
import { vColor } from '../../ui/format';
import { ATTR_DE, GK_GROUP, GROUPS, attrTiers, sortedKeys, type AttrKey } from '../player/shared';
import { SPOTS } from '../player/PositionPitch';

const G = Object.fromEntries(GROUPS.map((g) => [g.title, g])) as Record<string, (typeof GROUPS)[number]>;

/** Gruppen auf drei Spalten verteilt (Torwart: Torwartgruppe vorn) – alles ohne Scrollen. */
function columns(p: Player) {
  return p.naturalPosition === 'TW'
    ? [[GK_GROUP, G.Ballbehandlung], [G.Mental, G.Standards], [G.Physis, G.Defensive, G.Abschluss]]
    : [[G.Ballbehandlung, G.Abschluss], [G.Defensive, G.Standards, G.Physis], [G.Mental]];
}

export function CardAttributes({ p, pos }: { p: Player; pos: Position }) {
  const tiers = attrTiers(pos);
  const gk = p.naturalPosition === 'TW';
  return (
    <section className={`pc-attrs${gk ? ' gk' : ''}`}>
      {columns(p).map((col, ci) => (
        <div key={ci} className="pc-acol">
          {col.map((grp) => (
            <div key={grp.title} className="pc-agroup">
              <div className="pc-sh">{grp.title}</div>
              {sortedKeys(grp.keys).map((k: AttrKey) => {
                const v = Math.round(p.attributes[k]);
                const tier = tiers.get(k);
                return (
                  <div key={k} className={`pc-arow${tier ? ` pc-${tier}` : ''}`}>
                    <span>{ATTR_DE[k]}</span><b style={{ color: vColor(v) }}>{v}</b>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

/** Kleines Feld: Punktfarbe = Vertrautheit, Beschriftung „Kürzel Eignung“; daneben die besten Positionen. */
export function CardPositions({ p, best }: { p: Player; best: Position[] }) {
  // Nur Positionen, die er wenigstens ausreichend kennt (mindestens die beste), höchstens vier
  const known = SPOTS.map((s) => s.pos).filter((pos) => skillTier(skillOf(p, pos)) !== 'none')
    .sort((a, b) => positionSuitability(p, b) - positionSuitability(p, a));
  const top = (known.length ? known : best.slice(0, 1)).slice(0, 4);
  return (
    <div className="pc-posbox">
      <div className="pc-sh">Positionseignung</div>
      <div className="pc-posgrid">
        <div className="pc-pitch">
          <svg className="psk-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x="0.5" y="0.5" width="99" height="99" />
            <line x1="0" y1="50" x2="100" y2="50" />
            <ellipse cx="50" cy="50" rx="13" ry="8.5" />
            <rect x="24" y="0.5" width="52" height="13" />
            <rect x="24" y="86.5" width="52" height="13" />
          </svg>
          {SPOTS.map((s) => {
            const tier = skillTier(skillOf(p, s.pos));
            return <i key={s.pos} className={`pc-dot psk-${tier}${tier === 'none' ? ' faint' : ''}`} style={{ left: `${s.x}%`, top: `${s.y}%` }} />;
          })}
        </div>
        <div className="pc-poslist">
          {top.map((pos) => {
            const v = skillOf(p, pos);
            const tier = skillTier(v);
            const suit = positionSuitability(p, pos);
            return (
              <div key={pos} className="pc-posrow">
                <b>{pos}</b>
                <span className={`psk-tag psk-${tier}`}>{TIER_DE[tier]}</span>
                <em style={{ color: vColor(suit) }}>{suit}</em>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
