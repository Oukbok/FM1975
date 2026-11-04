// =============================================================================
// Spielergespräch — linke Buchseite: Kopf, Gesicht, Steckbrief, Leistung,
// Status, Moral (mit Animation der Veränderung) und Szene.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import PlayerAvatar from '../../../components/PlayerAvatar';
import { FitnessIcon, FormIcon, FreshnessIcon, MoraleIcon, fitness100, form100, freshness100, statusLevel, statusWord } from '../../../components/status';
import { PLAYER_TYPE, footLabel } from '../../../components/player/shared';
import { personaOf, personaTitle } from '../../../engine/persona';
import { scoutRangeText } from '../../../engine/scouting';
import { Club, Player } from '../../../types';
import { InfoTip } from '../../../ui/InfoTip';
import { vColor } from '../../../ui/format';
import { Glyph, ScenePhase, TalkScene } from './TalkScene';
import PosBadge from '../../../components/PosBadge';

export interface MoraleAnim { from: number; to: number; key: number }

/** Zahl, die vom alten zum neuen Wert hochzählt. */
function useCount(target: number, anim?: MoraleAnim): number {
  const [v, setV] = useState(anim ? anim.from : target);
  const raf = useRef(0);
  useEffect(() => {
    if (!anim) { setV(target); return; }
    const t0 = performance.now(), dur = 900;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setV(anim.from + (anim.to - anim.from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    setV(anim.from);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [anim?.key, target]);
  return v;
}

export function TalkLeft({ p, club, phase, anim }: { p: Player; club?: Club; phase: ScenePhase; anim?: MoraleAnim }) {
  const morale = p.moraleScore ?? 50;
  const shown = Math.round(useCount(morale, anim));
  const delta = anim ? Math.round(anim.to) - Math.round(anim.from) : 0;
  const s = p.seasonStats;
  const note = s?.ratedMatches ? s.averageRating.toFixed(2).replace('.', ',') : '–';
  const injured = p.availability === 'injured';
  const banned = (p.suspensionMatches ?? 0) > 0;
  const fri = freshness100(p), form = form100(p), fit = fitness100(p);
  return (
    <section className="ptk-page ptk-left">
      <header className="ptk-id">
        <h2 className="ptk-name"><span className="ptk-no">{p.shirtNumber}</span><span className="ptk-bar" />{p.lastName}</h2>
        <div className="ptk-club">{club?.name ?? 'Vereinslos'}</div>
      </header>

      <div className="ptk-card">
        <div className="ptk-face"><PlayerAvatar player={p} club={club} size={150} /></div>
        <div className="ptk-facts">
          <div className="ptk-facts-top">
            <span className="ptk-nat">{p.nationality}</span>
            <span className="ptk-pot">{scoutRangeText(p)}<InfoTip k="potenzial" /></span>
          </div>
          <Row k="Position" v={<PosBadge p={p} />} />
          <Row k="Stärke" v={<b style={{ color: vColor(p.overall) }}>{p.overall}</b>} />
          <Row k="Fuß" v={footLabel(p)} />
          <Row k="Spielertyp" v={PLAYER_TYPE[p.naturalPosition] ?? '–'} />
          <Row k="Alter" v={p.age} />
          <Row k={<>Charakter<InfoTip k="charakter" /></>} v={personaTitle(personaOf(p))} />
        </div>
      </div>

      <div className="ptk-perf">
        <div className="ptk-perf-list">
          <div className="ptk-h3">Leistung</div>
          <Row k={<>Form<InfoTip k="form" /></>} v={<><FormIcon value={form} size={18} /><span>{form}</span></>} />
          <Row k={<>Fitness<InfoTip k="fitness" /></>} v={<><FitnessIcon value={fit} size={18} /><span>{fit}</span></>} />
          <Row k={<>Frische<InfoTip k="frische" /></>} v={<><FreshnessIcon value={fri} size={18} /><span>{fri}</span></>} />
          <Row k="Spiele" v={s?.appearances ?? 0} />
          <Row k="Tore" v={s?.goals ?? 0} />
          <Row k="Durchschnittsnote" v={note} />
          <Row k="Karten (G/GR/R)" v={`${s?.yellowCards ?? 0}/${s?.yellowRedCards ?? 0}/${s?.redCards ?? 0}`} />
        </div>
        <div className="ptk-state">
          <div className="ptk-h4">Status</div>
          <div className={`ptk-status ${injured ? 'bad' : banned ? 'warn' : 'ok'}`}>
            <Glyph name={injured ? 'injury' : banned ? 'card' : 'check'} size={injured || banned ? 30 : 38} />
          </div>
          <div className="ptk-state-word">{injured ? `verletzt (${p.injury?.daysRemaining ?? '?'} T.)` : banned ? `gesperrt (${p.suspensionMatches})` : 'fit'}</div>
        </div>
        <div className="ptk-state">
          <div className="ptk-h4">Moral<InfoTip k="moral" /></div>
          <div className="ptk-moral">
            <MoraleIcon value={shown} size={46} />
            {anim && delta !== 0 && <span key={anim.key} className={`ptk-delta ${delta > 0 ? 'up' : 'down'}`}>{delta > 0 ? `+${delta}` : delta}</span>}
          </div>
          <div className="ptk-state-word">{statusWord('moral', statusLevel('moral', shown))} <span className="ptk-dim">{shown}</span></div>
        </div>
      </div>

      <div className="ptk-scene"><TalkScene phase={phase} shirt={club?.colors.primary} /></div>
    </section>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return <div className="ptk-row"><span className="ptk-k">{k}</span><span className="ptk-v">{v}</span></div>;
}
