// =============================================================================
// TRAININGSLAGER-PLANER – Schritt 3 links: Karte „Trainingsschwerpunkt“ (Vorbild EA FM):
// Vorlagen, Punkteverteilung auf sieben Bereiche (Symbol, Minus/Plus, Balken,
// verbleibende Punkte), Taktik-Inhalte mit Kosten (bezahlt aus den Taktik-Punkten)
// und Testspiele. Rechnung: engine/campProgram.ts → engine/trainingCamp.ts.
// =============================================================================
import { useState } from 'react';
import Icon from '../../../components/Icon';
import {
  CAMP_AREAS, CAMP_AREA_MAX, CAMP_AREA_ORDER, CAMP_DRILLS, CAMP_DRILL_ORDER, CAMP_POINTS, CampArea, CampDrillId, CampProgram,
  drillChance, drillCost, presetProgram, programLabel, programUsed, trimDrills,
} from '../../../engine/campProgram';
import { CAMP_FOCUS, CAMP_FOCUS_ORDER } from '../../../engine/trainingCamp';
import type { Player } from '../../../types';
import { InfoTip } from '../../../ui/InfoTip';

export function PlanProgram({ program, setProgram, tests, setTests, travelers, days }: {
  program: CampProgram; setProgram: (p: CampProgram) => void; tests: number; setTests: (n: number) => void;
  /** Gesunde Mitreisende (Vorschau der Taktik-Inhalte). */
  travelers: Player[]; days: number;
}) {
  const [focusArea, setFocusArea] = useState<CampArea | null>(null);
  const left = CAMP_POINTS - programUsed(program);
  const tPts = program.pts.taktik;
  const spent = drillCost(program);
  const step = (a: CampArea, dv: number) => {
    const v = program.pts[a] + dv;
    if (v < 0 || v > CAMP_AREA_MAX || (dv > 0 && left <= 0)) return;
    setFocusArea(a);
    setProgram(trimDrills({ ...program, pts: { ...program.pts, [a]: v } }));
  };
  const toggleDrill = (id: CampDrillId) => {
    const on = program.drills.includes(id);
    if (!on && spent + CAMP_DRILLS[id].cost > tPts) return;
    setProgram({ ...program, drills: on ? program.drills.filter((x) => x !== id) : [...program.drills, id] });
  };
  /** Erwartete Spieler mit +1 je Inhalt (Mittel über die Reisegruppe). */
  const expected = (id: CampDrillId) => {
    const keep = !!CAMP_DRILLS[id].keepers;
    return travelers.filter((p) => (p.naturalPosition === 'TW') === keep).reduce((s, p) => s + drillChance(p, days), 0);
  };
  const isPreset = (f: typeof CAMP_FOCUS_ORDER[number]) => CAMP_AREA_ORDER.every((a) => presetProgram(f).pts[a] === program.pts[a]);
  const shown = focusArea ?? CAMP_AREA_ORDER.reduce((b, a) => (program.pts[a] > program.pts[b] ? a : b), 'kondition' as CampArea);
  return (
    <section className="pp-card">
      <div className="pp-head">
        <span className="pp-k">Trainingsschwerpunkt</span>
        <b className="pp-title">{programLabel(program)}</b>
      </div>
      <div className="pp-presets" role="group" aria-label="Vorlagen">
        {CAMP_FOCUS_ORDER.map((f) => (
          <button key={f} type="button" className={`dchip pp-preset ${isPreset(f) ? 'on' : ''}`}
            onClick={() => { setFocusArea(null); setProgram({ ...presetProgram(f), drills: [] }); }}>{CAMP_FOCUS[f].label}</button>
        ))}
      </div>
      <div className="pp-sec">Punkteverteilung <InfoTip k="campPoints" /></div>
      <div className="pp-rows">
        {CAMP_AREA_ORDER.map((a) => {
          const v = program.pts[a];
          return (
            <div key={a} className={`pp-row ${shown === a ? 'focus' : ''}`} onMouseEnter={() => setFocusArea(a)}>
              <Icon name={CAMP_AREAS[a].icon} size={22} className="pp-ico" />
              <span className="pp-label">{CAMP_AREAS[a].label}</span>
              <span className="pp-val">{v}</span>
              <span className="pp-step">
                <button type="button" aria-label={`${CAMP_AREAS[a].label} weniger`} disabled={v <= 0} onClick={() => step(a, -1)}>−</button>
                <button type="button" aria-label={`${CAMP_AREAS[a].label} mehr`} disabled={v >= CAMP_AREA_MAX || left <= 0} onClick={() => step(a, 1)}>+</button>
              </span>
              <span className="pp-bar" aria-hidden>
                {Array.from({ length: CAMP_AREA_MAX }, (_, i) => <i key={i} className={i < v ? 'on' : ''} />)}
              </span>
            </div>
          );
        })}
      </div>
      <div className={`pp-left ${left ? 'open' : ''}`}><span>Verbleibende Punkte</span><b>{left}</b></div>
      <div className="pp-area-text">{CAMP_AREAS[shown].text}</div>
      <div className="pp-sec">Taktik-Inhalte <span className="pp-sec-v">{spent} von {tPts} Taktik-Punkten</span></div>
      <div className="pp-drills">
        {CAMP_DRILL_ORDER.map((id) => {
          const def = CAMP_DRILLS[id];
          const on = program.drills.includes(id);
          const can = on || spent + def.cost <= tPts;
          const ex = expected(id);
          return (
            <label key={id} className={`pp-drill ${on ? 'on' : ''} ${can ? '' : 'off'}`}
              title={`${def.keepers ? 'Nur Torhüter. ' : ''}Erwartet: ${ex < 0.95 ? 'kaum ein Spieler' : `bis zu etwa ${Math.round(ex)} Spieler`} mit +1`}>
              <input type="checkbox" checked={on} disabled={!can} onChange={() => toggleDrill(id)} />
              <span>{def.label}</span><em>({def.cost})</em>
            </label>
          );
        })}
      </div>
      <div className="pp-hint">Kosten aus den Taktik-Punkten. Jeder Inhalt trainiert seine Attribute gezielt: Chance auf +1 je Spieler (Junge mit Luft nach oben eher), Vorrang bei den nächsten Aufwertungen. Ein +1 verbraucht Entwicklungspunkte des Lagers – mehr, als das Lager ohnehin bringt, holst du so nicht heraus.</div>
      <label className="cp-dur pp-tests"><span>Testspiele vor Ort <b>{tests}</b></span>
        <input type="range" min={0} max={4} value={tests} onChange={(e) => setTests(Number(e.target.value))} /></label>
    </section>
  );
}
