// =============================================================================
// TRAININGSLAGER-PLANER – Schritt 3 rechts: der Ort groß (Vorbild EA FM): Name, Land,
// Ortsbild (Foto-Slot oder gezeichnete Landschaft), darauf „geklebt“ die Länderkarte
// als Polaroid und die Skizze der Anlage; dazu Entfernung (Luftlinie von der eigenen
// Stadt) und voraussichtliche Temperatur im Monat (Klimatabelle in data/campDestinations.ts).
// =============================================================================
import { CAMP_CLIMATE, CAMP_TRANSPORT_LABEL, CampDestination } from '../../../data/campDestinations';
import { CampLodging, LODGING_KIND_LABEL } from '../../../data/campLodgings';
import { distanceKm } from '../../../data/prematch/cityGeo';
import { lodgingAltitude } from '../../../engine/trainingCamp';
import { MON_FULL } from '../../../ui/format';
import { CampScenery } from './CampScenery';
import { CountryInset, FacilitySketch } from './CampPinned';

/** Voraussichtliche Tageshöchsttemperatur (°C) – Unterkünfte in anderer Höhe: −0,65 °C je 100 m. */
export function campTemperature(d: CampDestination, l: CampLodging | undefined, month: number): number {
  const base = CAMP_CLIMATE[d.climate].temp[month];
  const dh = l ? lodgingAltitude(d, l) - d.altitude : 0;
  return Math.round(base - dh * 0.0065);
}

export function CampShowcase({ d, l, locked, year, month, home, homeName, onPickDest }: {
  d?: CampDestination; l?: CampLodging; locked?: string; year: number; month: number;
  home: [number, number] | null; homeName: string; onPickDest: () => void;
}) {
  if (!d) {
    return (
      <section className="cs-show empty">
        <div className="cs-empty">
          <span>Noch kein Ziel gewählt.</span>
          <button type="button" className="btn btn-ghost" onClick={onPickDest}>Ziel auf der Karte wählen</button>
        </div>
      </section>
    );
  }
  const km = home ? Math.round(distanceKm(home, d.geo) / 10) * 10 : null;
  const t = campTemperature(d, l, month);
  const alt = l ? lodgingAltitude(d, l) : d.altitude;
  return (
    <section className="cs-show">
      <header className="cs-title">
        <h3>{d.name}</h3>
        <span>{d.place} · {d.country}</span>
        {locked && <span className="cs-locked">Nicht buchbar: {locked}.</span>}
      </header>
      <div className="cs-stage">
        <div className="cs-photo"><CampScenery d={d} month={month} /></div>
        <figure className="cs-polaroid">
          <span className="cs-tape" aria-hidden />
          <CountryInset d={d} home={home} />
          <figcaption>{d.country === 'Asien' ? 'Asien' : d.country}</figcaption>
        </figure>
        {l && (
          <figure className="cs-paper">
            <span className="cs-tape" aria-hidden />
            <FacilitySketch d={d} l={l} year={year} />
          </figure>
        )}
        <dl className="cs-facts">
          <div><dt>Distanz (Luftlinie)</dt><dd>{km != null ? `${km.toLocaleString('de-DE')} km` : '–'}<small>ab {homeName}</small></dd></div>
          <div><dt>Voraussichtliche Temperatur</dt><dd>{t} °C<small>{MON_FULL[month]}, tagsüber</small></dd></div>
          <div><dt>Anreise</dt><dd>{CAMP_TRANSPORT_LABEL[d.transport]}, {String(d.travelH).replace('.', ',')} h</dd></div>
          <div><dt>Höhe</dt><dd>{alt.toLocaleString('de-DE')} m</dd></div>
          {l && <div><dt>Unterkunft</dt><dd>{l.name}<small>{LODGING_KIND_LABEL[l.kind]}</small></dd></div>}
        </dl>
      </div>
    </section>
  );
}
