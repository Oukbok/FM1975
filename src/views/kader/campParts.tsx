// =============================================================================
// TRAININGSLAGER – Bausteine der Seite (views/kader/TrainingCampView.tsx):
// Zielliste, Unterkunfts-Vergleich, Wirkungsvorschau.
// =============================================================================
import { CAMP_DESTINATIONS, CAMP_OPP_LABEL, CAMP_OPP_STRENGTH, CAMP_REGION_LABEL, CAMP_REGION_ORDER, CAMP_TRANSPORT_LABEL, CampDestination } from '../../data/campDestinations';
import { CampLodging, LODGING_KIND_LABEL, LODGING_RUNS_LABEL } from '../../data/campLodgings';
import {
  CAMP_ALTITUDE_DELAY, CampOutlook, CampStatus, campWeather, entourageFactor, groundLabel, gymLabel, kitchenLabel, lodgingAltitude, regenLabel,
} from '../../engine/trainingCamp';
import { fmtDM } from '../../ui/format';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const pct = (v: number) => `${Math.round(v * 100)} %`;
const sign = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1).replace('.', ',')}`;
const num = (v: number) => v.toFixed(1).replace('.', ',');
/** Quellenmarken [C1] aus Anzeigetexten entfernen (Quellen stehen in den Datendateien). */
export const clean = (t: string) => t.replace(/\s*\[C\d+\](\[C\d+\])*/g, '');
const verst = (n: number) => `≈ ${n} ${n === 1 ? 'Verstoß' : 'Verstöße'}`;
const level = (v: number) => (v >= 0.67 ? 'hoch' : v >= 0.34 ? 'mittel' : 'gering');

/** Stufenanzeige 0–n (Komfort, Ruhe, Ablenkung). */
export function Pips({ value, max = 4, warn = false, title }: { value: number; max?: number; warn?: boolean; title?: string }) {
  return (
    <span className={`camp-pips ${warn ? 'warn' : ''}`} title={title}>
      {Array.from({ length: max }, (_, i) => <i key={i} className={i < value ? 'on' : ''} />)}
    </span>
  );
}
const toPips = (v: number) => Math.round(v * 4);

export function travelText(d: CampDestination): string {
  const h = String(d.travelH).replace('.', ',');
  return `${CAMP_TRANSPORT_LABEL[d.transport]} ${h} h${d.tz ? `, ${d.tz > 0 ? '+' : '−'}${Math.abs(d.tz)} h` : ''}`;
}

// -----------------------------------------------------------------------------
// Zielliste
// -----------------------------------------------------------------------------
export function DestinationList({ opts, selected, year, priceFrom, aiCount, onSelect }: {
  opts: { d: CampDestination; status: CampStatus }[];
  selected?: string; year: number;
  priceFrom: (d: CampDestination) => number | null;
  aiCount: Map<string, number>;
  onSelect: (id: string) => void;
}) {
  const open = opts.filter((o) => o.status.ok || !o.status.reason?.startsWith('erst ab'));
  const soon = opts.filter((o) => o.status.reason?.startsWith('erst ab')).sort((a, b) => a.d.access[0].from - b.d.access[0].from).slice(0, 3);
  return (
    <>
      {CAMP_REGION_ORDER.map((r) => {
        const list = open.filter((o) => o.d.region === r);
        if (!list.length) return null;
        return (
          <div key={r}>
            <div className="dsec">{CAMP_REGION_LABEL[r]}</div>
            {list.map(({ d, status }) => {
              const price = status.ok ? priceFrom(d) : null;
              const n = aiCount.get(d.id) ?? 0;
              return (
                <div key={d.id} className={`dlist-row clickable camp-dest ${d.id === selected ? 'win-sel' : ''} ${status.ok ? '' : 'win-locked'}`}
                  onClick={() => onSelect(d.id)} title={status.ok ? d.place : status.reason}>
                  <span className="grow"><b>{d.name}</b>{n > 0 && <span className="camp-ai"> · {n} {n === 1 ? 'Verein' : 'Vereine'}</span>}</span>
                  {status.ok
                    ? <><span className="meta">{travelText(d)}</span>{price != null && <span className="val">ab {fmtDM(price)}</span>}</>
                    : <span className="meta">{status.reason?.startsWith('Sponsor') ? 'Sponsor-Pflicht' : status.reason?.replace(/^nur für Spitzenvereine /, '')}</span>}
                </div>
              );
            })}
          </div>
        );
      })}
      {soon.length > 0 && (
        <>
          <div className="dsec">Demnächst</div>
          {soon.map(({ d }) => (
            <div key={d.id} className="dlist-row win-locked">
              <span className="grow">{d.name} <span className="muted">· {d.place}</span></span>
              <span className="meta">ab {d.access[0].from}</span>
            </div>
          ))}
        </>
      )}
      {!open.length && <div className="dnote">Keine Ziele im Jahr {year}.</div>}
    </>
  );
}

// -----------------------------------------------------------------------------
// Ziel-Steckbrief + Unterkünfte
// -----------------------------------------------------------------------------
export function DestinationFacts({ d, month, tests }: { d: CampDestination; month: number; tests: boolean }) {
  const w = campWeather(d, month);
  return (
    <div className="camp-facts">
      <span><em>Ort</em>{d.place}, {d.country}</span>
      <span><em>Anreise</em>{travelText(d)}</span>
      <span><em>{MONTHS[month]}</em>{w.label}: Ausfallrisiko {pct(w.risk)}, Rasen {level(w.ground)}</span>
      {tests && <span><em>Testgegner</em>{CAMP_OPP_LABEL[d.opp]} (Stärke ≈ {CAMP_OPP_STRENGTH[d.opp]})</span>}
      <span><em>Rummel</em>{level(d.buzz)}</span>
    </div>
  );
}

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

export function LodgingTable({ d, lodgings, selected, year, rep, scale, compare, onSelect }: {
  d: CampDestination; lodgings: CampLodging[]; selected?: string; year: number; rep: number; scale: number;
  /** Vergleich mit gewähltem Schwerpunkt/Dauer: erwartete Kondition, Disziplin-Verstöße, Gesamtkosten. */
  compare: (l: CampLodging) => { fitness: number; incidents: number; cost: number };
  onSelect: (id: string) => void;
}) {
  return (
    <table className="dtable camp-table">
      <thead>
        <tr>
          <th>Unterkunft</th><th className="ctr">Komfort</th><th>Anlage</th><th>Kraftraum</th><th>Regeneration</th>
          <th>Küche</th><th className="ctr">Ruhe</th><th className="ctr">Ablenkung</th><th className="num">je Tag</th>
          <th className="num camp-cmp">Kondition</th><th className="num camp-cmp">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        {lodgings.map((l) => {
          const alt = lodgingAltitude(d, l);
          const c = compare(l);
          return (
            <tr key={l.id} className={`clickable ${l.id === selected ? 'camp-row-sel' : ''}`} onClick={() => onSelect(l.id)}>
              <td>
                <div className="camp-lname">{l.name}</div>
                <div className="muted camp-lsub">{LODGING_KIND_LABEL[l.kind]}{l.runs ? ` · ${LODGING_RUNS_LABEL[l.runs]}` : ''}{alt >= 1000 ? ` · ${alt.toLocaleString('de-DE')} m` : ''}</div>
              </td>
              <td className="ctr"><Pips value={l.tier} /></td>
              <td className="nowrap">{groundLabel(l, year)}<div className="muted camp-lsub">Rasen {level(l.pitchQ)}</div></td>
              <td className="nowrap">{gymLabel(l, year)}</td>
              <td className="nowrap">{regenLabel(l, year)}</td>
              <td className="nowrap">{kitchenLabel(l, year)}</td>
              <td className="ctr"><Pips value={toPips(l.quiet)} /></td>
              <td className="ctr"><Pips value={toPips(l.lure)} warn /></td>
              <td className="num nowrap">{fmtDM(Math.round(l.rate * entourageFactor(rep) * scale))}</td>
              <td className="num nowrap camp-cmp">{sign(c.fitness)}{c.incidents >= 1 ? <div className="camp-lsub warn">{verst(Math.round(c.incidents))}</div> : null}</td>
              <td className="num nowrap camp-cmp"><b>{fmtDM(c.cost)}</b></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// -----------------------------------------------------------------------------
// Vorschau der Wirkung
// -----------------------------------------------------------------------------
function Cell({ k, v, tone }: { k: string; v: string; tone?: 'good' | 'bad' | 'warn' }) {
  return <div className={`camp-cell ${tone ?? ''}`}><span>{k}</span><b>{v}</b></div>;
}

export function OutlookList({ o, squad, scale, youthFocus }: { o: CampOutlook; squad: number; scale: number; youthFocus: boolean }) {
  const frische = o.campFrische - o.travelFrische;
  const incidents = o.discipline * squad;
  const money = Math.round((o.testIncome + o.sponsorBase) * scale);
  const fans = o.fanMood - o.criticism;
  return (
    <div className="camp-cells">
      <Cell k="Kondition" v={`${sign(o.fitnessLo)} … ${sign(o.fitnessHi)}`} />
      <Cell k="Form" v={`${sign(o.formLo)} … ${sign(o.formHi)}`} tone={o.formHi < 0 ? 'warn' : undefined} />
      <Cell k={youthFocus ? 'Entw. Junge / Rest' : 'Entwicklung'} v={youthFocus ? `+${num(o.devYouth)} / +${num(o.dev)}` : `+${num(o.dev)}`} />
      {o.altitudeFitness > 0
        ? <Cell k={`Höhe, nach ${CAMP_ALTITUDE_DELAY} Tagen`} v={`${sign(o.altitudeFitness)} Kondition`} tone="good" />
        : <Cell k="Frische bei Rückkehr" v={`${frische >= 0 ? '+' : '−'}${Math.abs(frische)}`} tone={frische < -8 ? 'warn' : undefined} />}
      <Cell k="Moral-Chance" v={pct(o.morale)} tone={o.morale >= 0.45 ? 'good' : undefined} />
      <Cell k="Zufriedenheit" v={`${o.satisfaction >= 0 ? '+' : '−'}${Math.abs(o.satisfaction)}${o.starGrumble ? ', Stars murren' : ''}`} tone={o.starGrumble || o.satisfaction < 0 ? 'warn' : undefined} />
      <Cell k="Disziplin" v={incidents >= 0.5 ? verst(Math.round(incidents)) : o.disciplineGain > 0.1 ? 'gestärkt' : 'unauffällig'}
        tone={incidents >= 1.5 ? 'warn' : o.disciplineGain > 0.1 && incidents < 0.5 ? 'good' : undefined} />
      <Cell k="Verletzungen" v={`${(o.injury * 100).toFixed(1).replace('.', ',')} % (≈ ${num(o.injury * squad)})`} tone={o.injury > 0.04 ? 'warn' : undefined} />
      {o.altitudeFitness > 0 && <Cell k="Frische bei Rückkehr" v={`${frische >= 0 ? '+' : '−'}${Math.abs(frische)}`} tone={frische < -8 ? 'warn' : undefined} />}
      {o.heal > 0 && <Cell k="Verletzte" v={`bis ${o.heal} Tage früher fit`} tone="good" />}
      {money > 0 && <Cell k={o.sponsorBase > 0 ? 'Tests + Marketing' : 'Testspiel-Erlös'} v={`+${fmtDM(money)}`} tone="good" />}
      {Math.abs(fans) >= 0.2 && <Cell k="Fan-Stimmung" v={sign(fans)} tone={fans > 0 ? 'good' : 'bad'} />}
    </div>
  );
}

/** Kurzfassung der Abwägung (Stärken/Schwächen der Wahl). */
export function tradeoffs(o: CampOutlook, l: CampLodging, squad: number): { good: string[]; bad: string[] } {
  const good: string[] = [], bad: string[] = [];
  if (o.fitness >= 12) good.push('viel Kondition');
  if (o.altitudeFitness > 0) good.push('Höhenreiz (wirkt verzögert)');
  if (o.dev >= 0.3) good.push('viel Taktik/Entwicklung');
  if (o.morale >= 0.45) good.push('stärkt den Zusammenhalt');
  if (o.disciplineGain > 0.12 && o.discipline * squad < 0.5) good.push('abgeschieden, wenig Ablenkung');
  if (l.tier >= 3) good.push('komfortabel');
  if (o.heal > 0) good.push('Verletzte erholen sich');
  if (o.weatherRisk >= 0.35) bad.push('wetteranfällig');
  if (o.discipline * squad >= 1.5) bad.push('Ablenkung gefährdet die Disziplin');
  if (o.injury >= 0.04) bad.push('erhöhtes Verletzungsrisiko');
  if (o.travelFrische - o.campFrische >= 12) bad.push('anstrengende Reise');
  if (o.starGrumble > 0) bad.push('Stars murren');
  if (l.tier === 1 && !bad.includes('Stars murren')) good.push('billig und hart');
  return { good: good.slice(0, 4), bad: bad.slice(0, 3) };
}

/** Freischaltungen aller Ziele (für die Verlaufsansicht). */
export function campMilestones(): { year: number; text: string }[] {
  return CAMP_DESTINATIONS.flatMap((d) => d.access.map((a, i) => ({ year: a.from, text: `${d.name}${i === 0 && a.minRep > 0 ? ` (nur Ansehen ≥ ${a.minRep})` : i > 0 ? ` für Ansehen ≥ ${a.minRep}` : ''}` })))
    .filter((m) => m.year > 1975).sort((a, b) => a.year - b.year);
}
