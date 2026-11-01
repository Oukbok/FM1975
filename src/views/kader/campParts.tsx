// =============================================================================
// TRAININGSLAGER – kleine Bausteine (Seite views/kader/TrainingCampView.tsx und
// Planer views/kader/camp/): Stufenanzeige, Reisetext, Klimastreifen, Freischaltungen.
// =============================================================================
import { CAMP_DESTINATIONS, CAMP_TRANSPORT_LABEL, CampDestination } from '../../data/campDestinations';
import { campWeather } from '../../engine/trainingCamp';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const pct = (v: number) => `${Math.round(v * 100)} %`;
/** Quellenmarken [C1] aus Anzeigetexten entfernen (Quellen stehen in den Datendateien). */
export const clean = (t: string) => t.replace(/\s*\[C\d+\](\[C\d+\])*/g, '');
const level = (v: number) => (v >= 0.67 ? 'hoch' : v >= 0.34 ? 'mittel' : 'gering');

/** Stufenanzeige 0–n (Komfort, Ruhe, Ablenkung). */
export function Pips({ value, max = 4, warn = false, title }: { value: number; max?: number; warn?: boolean; title?: string }) {
  return (
    <span className={`camp-pips ${warn ? 'warn' : ''}`} title={title}>
      {Array.from({ length: max }, (_, i) => <i key={i} className={i < value ? 'on' : ''} />)}
    </span>
  );
}

export function travelText(d: CampDestination): string {
  const h = String(d.travelH).replace('.', ',');
  return `${CAMP_TRANSPORT_LABEL[d.transport]} ${h} h${d.tz ? `, ${d.tz > 0 ? '+' : '−'}${Math.abs(d.tz)} h` : ''}`;
}

// -----------------------------------------------------------------------------
// Klima
// -----------------------------------------------------------------------------
/** Wetter übers Jahr: Ausfallrisiko je Monat (gewählter Monat markiert). */
export function ClimateStrip({ d, month, season }: { d: CampDestination; month: number; season: 'summer' | 'winter' }) {
  const rel = season === 'summer' ? [5, 6, 7] : [11, 0, 1];
  return (
    <div className="camp-climate">
      <span className="camp-climate-lbl">Wetter übers Jahr</span>
      {MONTHS.map((m, i) => {
        const w = campWeather(d, i);
        return (
          <span key={m} className={`camp-month ${i === month ? 'on' : ''} ${rel.includes(i) ? '' : 'off'}`} title={`${m}: Ausfallrisiko ${pct(w.risk)}, Rasen ${level(w.ground)}`}>
            <i style={{ height: `${Math.max(8, Math.round(w.risk * 100))}%` }} /><b>{m.slice(0, 3)}</b>
          </span>
        );
      })}
      <span className="camp-climate-lbl">Balken = Ausfallrisiko</span>
    </div>
  );
}

/** Freischaltungen aller Ziele (für die Verlaufsansicht). */
export function campMilestones(): { year: number; text: string }[] {
  return CAMP_DESTINATIONS.flatMap((d) => d.access.map((a, i) => ({ year: a.from, text: `${d.name}${i === 0 && a.minRep > 0 ? ` (nur Ansehen ≥ ${a.minRep})` : i > 0 ? ` für Ansehen ≥ ${a.minRep}` : ''}` })))
    .filter((m) => m.year > 1975).sort((a, b) => a.year - b.year);
}
