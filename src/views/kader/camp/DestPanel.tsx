// =============================================================================
// TRAININGSLAGER-PLANER – Schritt 2, rechts neben der Karte: Steckbrief des Ortes,
// Vor- und Nachteile (engine/campPlan.ts), Wahl der Unterkunft/Anlage.
// =============================================================================
import { CAMP_OPP_LABEL, CampDestination } from '../../../data/campDestinations';
import { CampLodging, LODGING_KIND_LABEL } from '../../../data/campLodgings';
import type { ProsCons } from '../../../engine/campPlan';
import { CampStatus, campWeather, groundLabel, lodgingAltitude, regenLabel } from '../../../engine/trainingCamp';
import { MON_FULL, fmtDM } from '../../../ui/format';
import { ClimateStrip, Pips, clean, travelText } from '../campParts';

export function DestPanel({ d, status, season, month, year, lodgings, lodgingId, onLodging, pc, costOf, aiCount }: {
  d?: CampDestination; status?: CampStatus; season: 'summer' | 'winter'; month: number; year: number;
  lodgings: CampLodging[]; lodgingId?: string; onLodging: (id: string) => void;
  pc?: ProsCons; costOf: (l: CampLodging) => number; aiCount: number;
}) {
  if (!d) return <div className="cp-dest empty">Klicke auf der Karte einen Ort an – hier erscheinen Vor- und Nachteile, Klima und Unterkünfte.</div>;
  const w = campWeather(d, month);
  return (
    <div className="cp-dest">
      <div className="cp-dest-head">
        <div className="cp-dest-name">{d.name}</div>
        <div className="cp-dest-place">{d.place} · {d.country}</div>
      </div>
      <div className="cp-dest-facts">
        <span><em>{MON_FULL[month]}</em>{w.label}, Ausfall {Math.round(w.risk * 100)} %</span>
        <span><em>Anreise</em>{travelText(d)}</span>
        <span><em>Höhe</em>{d.altitude.toLocaleString('de-DE')} m</span>
        <span><em>Testgegner</em>{CAMP_OPP_LABEL[d.opp]}</span>
        {aiCount > 0 && <span><em>Liga vor Ort</em>{aiCount} {aiCount === 1 ? 'Verein' : 'Vereine'}</span>}
      </div>
      {status && !status.ok && <div className="cp-locked">Nicht buchbar: {status.reason}.</div>}
      {pc && (
        <div className="cp-pc">
          <ul className="cp-pros">{pc.pros.map((t) => <li key={t}>{t}</li>)}</ul>
          <ul className="cp-cons">{pc.cons.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <div className="cp-sec">Unterkunft &amp; Anlage</div>
      <div className="cp-lodgings">
        {lodgings.map((l) => {
          const alt = lodgingAltitude(d, l);
          return (
            <button key={l.id} className={`cp-lodging ${l.id === lodgingId ? 'on' : ''}`} disabled={!status?.ok} onClick={() => onLodging(l.id)}>
              <span className="cp-l-top"><b>{l.name}</b><span className="cp-l-cost">{fmtDM(costOf(l))}</span></span>
              <span className="cp-l-sub">
                <Pips value={l.tier} title="Komfort" /> {LODGING_KIND_LABEL[l.kind]} · {groundLabel(l, year)} · {regenLabel(l, year)}{alt >= 1000 ? ` · ${alt.toLocaleString('de-DE')} m` : ''}
              </span>
              {l.id === lodgingId && <span className="cp-l-note">{clean(l.note)}</span>}
            </button>
          );
        })}
      </div>
      <ClimateStrip d={d} month={month} season={season} />
      <div className="cp-dest-note">{clean(d.note)}</div>
    </div>
  );
}
