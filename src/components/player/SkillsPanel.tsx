// Block „Fähigkeiten“ links unten im Spielerprofil (Vorbild EA Fussball Manager): alle Attribute
// in zwei Spalten nach Gruppen, Wert rechts (monochrom). Für die gewählte Position wichtige
// Attribute mit blauem Strich (kräftig = Schlüsselattribut, schlank = wichtig; Engine-Gewichte
// `weightsFor`). Trendpfeil = Veränderung seit der vorletzten Bewertung, Hütchen = Schwerpunkt
// des laufenden Wochentrainings (eigener Kader). Schalter: nur wichtige Attribute bzw.
// Trainingsfortschritt seit der ältesten Momentaufnahme.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Player, Position } from '../../types';
import { POSITION_NAMES_DE } from '../../engine/positions';
import { useClubProfile } from '../club/ClubLink';
import { vColor } from '../../ui/format';
import Icon from '../Icon';
import { AttrTip } from './AttrTip';
import { ATTR_DE, GK_GROUP, GROUPS, attrTiers, sortedKeys, type AttrKey } from './shared';
import { attrChanges, trainingTargets } from './profileData';
import { SPOTS } from './PositionPitch';
import Select from '../../ui/Select';

const G = Object.fromEntries(GROUPS.map((g) => [g.title, g])) as Record<string, (typeof GROUPS)[number]>;

/** Gruppen auf Spalten verteilt (Torwart: Torwartgruppe vorn). */
function columns(p: Player, pos: Position) {
  const gk = p.naturalPosition === 'TW' || pos === 'TW';
  // Torwart: sieben Gruppen → drei Spalten, damit alles ohne Scrollen sichtbar bleibt
  return gk
    ? [[GK_GROUP, G.Ballbehandlung, G.Standards], [G.Mental, G.Abschluss], [G.Physis, G.Defensive]]
    : [[G.Ballbehandlung, G.Abschluss, G.Defensive, G.Standards], [G.Mental, G.Physis]];
}

export default function SkillsPanel({ p, pos, onPos }: { p: Player; pos: Position; onPos: (pos: Position) => void }) {
  const g = useClubProfile()?.game;
  const [onlyKey, setOnlyKey] = useState(false);
  const [progress, setProgress] = useState(false);
  const tiers = attrTiers(pos);
  const ch = attrChanges(p);
  const targets = trainingTargets(g, p);
  const hasProgress = !!ch.sinceLabel && Object.keys(ch.since).length > 0;
  const showProg = progress && hasProgress;

  const colsRef = useFitRows([p.id, pos, onlyKey, showProg]);
  return (
    <section className="pp2-skills">
      <div className="pp2-skills-head">
        <h3 className="pp2-h">Fähigkeiten</h3>
        <div className="pp2-seg">
          <button type="button" className={`dchip${onlyKey ? '' : ' on'}`} onClick={() => setOnlyKey(false)}>Alle Fähigkeiten</button>
          <button type="button" className={`dchip${onlyKey ? ' on' : ''}`} onClick={() => setOnlyKey(true)}>Nur wichtige</button>
        </div>
        <label className="pp2-forpos">für
          <Select className="pp2-select" value={pos} onChange={(v) => onPos(v as Position)}>
            {[...SPOTS].reverse().map((s) => <option key={s.pos} value={s.pos}>{s.pos} · {POSITION_NAMES_DE[s.pos]}</option>)}
          </Select>
        </label>
      </div>

      <div ref={colsRef} className={`pp2-skill-cols${columns(p, pos).length > 2 ? ' three' : ''}`}>
        {columns(p, pos).map((col, ci) => (
          <div key={ci} className="pp2-skill-col">
            {col.map((grp) => {
              const keys = sortedKeys(grp.keys).filter((k) => !onlyKey || tiers.has(k));
              if (!keys.length) return null;
              return (
                <div key={grp.title} className="pp2-sgroup">
                  <div className="pp2-sgt">{grp.title}</div>
                  {keys.map((k) => <SkillRow key={k} k={k} v={Math.round(p.attributes[k])} tier={tiers.get(k)}
                    trend={ch.recent[k]} prog={showProg ? (ch.since[k] ?? 0) : undefined} target={targets.has(k)} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="pp2-skills-foot">
        <div className="pp-legend">
          <span><i className="pp2-lg-core" />Schlüsselattribut {pos}</span>
          <span><i className="pp2-lg-use" />wichtig</span>
          <span><Icon name="trendUp" size={12} className="pp2-trend up" />seit letzter Bewertung</span>
          {targets.size > 0 && <span><i className="pp2-cone" />Schwerpunkt im Wochentraining</span>}
        </div>
        {hasProgress && (
          <label className="pp2-check" title={`Veränderung seit „${ch.sinceLabel}“`}>
            <input type="checkbox" checked={progress} onChange={(e) => setProgress(e.target.checked)} />
            Trainingsfortschritt zeigen
          </label>
        )}
      </div>
    </section>
  );
}

function SkillRow({ k, v, tier, trend, prog, target }: {
  k: AttrKey; v: number; tier?: 'core' | 'use'; trend?: number; prog?: number; target: boolean;
}) {
  return (
    <div className={`pp2-srow${tier ? ' pp-tier-' + tier : ''}`}>
      <span className="pp-attr-lbl">{ATTR_DE[k]}<AttrTip k={k} /></span>
      <span className="pp2-smark">
        {target && <i className="pp2-cone" title="Schwerpunkt im Wochentraining" />}
        {prog === undefined && trend !== undefined && trend !== 0 && (
          <Icon name="trendUp" size={13} className={`pp2-trend ${trend > 0 ? 'up' : 'down'}`} title={`${trend > 0 ? '+' : '−'}${Math.abs(trend)} seit der vorletzten Bewertung`} />
        )}
        {prog !== undefined && <b className={`pp2-prog ${prog > 0 ? 'up' : prog < 0 ? 'down' : ''}`}>{prog > 0 ? `+${prog}` : prog < 0 ? `−${-prog}` : '±0'}</b>}
      </span>
      <span className="pp2-sval" style={{ color: vColor(v) }}>{v}</span>
    </div>
  );
}

/**
 * Fähigkeiten passen immer ohne Scrollen in die Box: Reicht die Höhe nicht (andere Schrift,
 * kleines Fenster), werden die Zeilen schrittweise enger (Variable --sk-pad/--sk-lh), nie größer
 * als im Grundzustand. Läuft vor dem Zeichnen, damit nichts springt.
 */
function useFitRows(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const steps: [number, number][] = [[1, 18], [0, 18], [0, 17], [0, 16], [0, 15], [0, 14], [0, 13]];
      for (const [pad, lh] of steps) {
        el.style.setProperty('--sk-pad', `${pad}px`);
        el.style.setProperty('--sk-lh', `${lh}px`);
        if (el.scrollHeight <= el.clientHeight + 0.5) break;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}
