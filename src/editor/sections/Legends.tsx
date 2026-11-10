import { useState } from 'react';
import { Dataset } from '../../data/dataset/schema';
import { Col, Explain, FieldForm, TableEditor } from '../TableEditor';
import { BUILTIN_LEGENDS, LEGEND_COUNTRIES, LEGEND_TYPES, type LegendDef } from '../../data/legends';
import { ALL_POSITIONS } from '../../types';

// =============================================================================
// LEGENDEN: Ausnahmetalente der Fußballgeschichte (Datensatz-Feld `legendsV2`).
// Liste links, alle Werte des gewählten Eintrags rechts (inkl. verdeckter Werte).
// =============================================================================
type P = { ds: Dataset; onChange: () => void };

const FACES = ['mitteleuropa', 'nordeuropa', 'suedeuropa', 'osteuropa', 'balkan', 'tuerkei', 'westafrika', 'lateinamerika', 'ostasien', 'nordafrika'];
const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));
const COUNTRY_OPTS = Object.entries(LEGEND_COUNTRIES).map(([value, label]) => ({ value, label: `${label} (${value})` }));
const POS_OPTS = opt(ALL_POSITIONS as string[]);

/** Vereine des Datensatzes, in denen ein Talent dieses Landes aufwachsen kann. */
export function clubsForCountry(ds: Dataset, country: string): { value: string; label: string }[] {
  const c = ds.clubs;
  const west = [...c.tier1, ...c.secondNord, ...c.secondSued];
  const list = country === 'GER' ? west : country === 'DDR' ? [...c.ddrOberliga, ...c.ddrLiga, ...west] : [];
  return list.map((x) => ({ value: x.id, label: x.name }));
}

export function LegendsSection({ ds, onChange }: P) {
  if (!Array.isArray(ds.legendsV2)) ds.legendsV2 = JSON.parse(JSON.stringify(BUILTIN_LEGENDS));
  const rows = ds.legendsV2!;
  const [sel, setSel] = useState<number | null>(rows.length ? 0 : null);
  const cur = sel != null ? rows[sel] : undefined;
  const cols: Col[] = [
    { key: 'firstName', label: 'Vorname', width: 110 }, { key: 'lastName', label: 'Nachname', width: 140 },
    { key: 'birth', label: 'Geburt', width: 100, hint: 'JJJJ-MM-TT' },
    { key: 'country', label: 'Land', type: 'select', options: COUNTRY_OPTS, width: 180 },
    { key: 'pos', label: 'Pos.', type: 'select', options: POS_OPTS, width: 70 },
    { key: 'potential', label: 'Potenzial', type: 'number', width: 80 },
    { key: 'face', label: 'Ethnie', type: 'select', options: opt(FACES), optional: true, width: 130 },
  ];
  const make = (): LegendDef => ({
    id: `talent${rows.length + 1}`, firstName: 'Vorname', lastName: 'Nachname', birth: '2010-01-01', country: 'GER', pos: 'ZM',
    foot: 'right', type: 'regisseur', potential: 88, height: 180, maturity: 0, longevity: 0,
    hidden: { consistency: 75, nerves: 75, injury: 25, tempo: 70, professionalism: 80, ambition: 80, adaptability: 70 },
    persona: { loyalitaet: 55, geld: 50, heimat: 55, abenteuer: 50, rampenlicht: 50, familie: 50 },
  });
  return (
    <div className="ed-section">
      <Explain>Ausnahmetalente der Fußballgeschichte erscheinen in jedem neuen Spielstand (Option beim Spielstart, Standard an) – still, ohne Nachricht oder Markierung. Ab 15 tauchen sie als Jugendspieler auf, ältere stehen 1975 schon im Kader; Talente aus Ländern ohne volle Kader wachsen im Ausland auf und wechseln mit 18–27 zu einem Verein der Spielerliga. <b>Verein leer</b> = zufällig, Vereine mit besserer Jugendarbeit sind wahrscheinlicher. Die <b>verdeckten Werte</b> (0–100) erscheinen im Spiel nie als Zahl, nur als Einschätzung. Bitte nur erfundene Namen eintragen.</Explain>
      <div className="ed-split">
        <TableEditor rows={rows} cols={cols} onChange={onChange} makeRow={make} selected={sel} onSelect={setSel} searchKeys={['id', 'firstName', 'lastName', 'country']} />
        {cur && <LegendForm key={sel} ds={ds} l={cur} onChange={onChange} />}
      </div>
    </div>
  );
}

function LegendForm({ ds, l, onChange }: { ds: Dataset; l: LegendDef; onChange: () => void }) {
  if (!l.hidden) l.hidden = { consistency: 70, nerves: 70, injury: 30, tempo: 60, professionalism: 70, ambition: 70, adaptability: 60 };
  const obj = l as unknown as Record<string, unknown>;
  const clubs = clubsForCountry(ds, l.country);
  const num = (key: string, label: string, hint?: string, step = 1): Col => ({ key, label, type: 'number', step, hint });
  return (
    <aside className="ed-side ed-legend">
      <div className="ed-side-title">{l.firstName} {l.lastName}</div>
      <div className="ed-sec">Person</div>
      <FieldForm obj={obj} onChange={onChange} cols={[
        { key: 'id', label: 'ID', hint: 'Kleinbuchstaben, Ziffern, _ und -' },
        { key: 'pos2', label: 'Weitere Positionen', type: 'list', hint: 'Komma-getrennt, z. B. DM, IV' },
        { key: 'foot', label: 'Starker Fuß', type: 'select', options: [{ value: 'right', label: 'rechts' }, { value: 'left', label: 'links' }, { value: 'both', label: 'beidfüßig' }] },
        { key: 'type', label: 'Spielertyp', type: 'select', options: LEGEND_TYPES.map((t) => ({ value: t.id, label: t.label })) },
        num('height', 'Größe (cm)'),
        { key: 'face', label: 'Ethnie (verdeckt)', type: 'select', options: opt(FACES), optional: true, hint: 'bestimmt nur das Gesicht, nie sichtbar; leer = typisch fürs Land' },
        { key: 'club', label: 'Jugendverein', type: 'select', options: clubs, optional: true, hint: clubs.length ? 'leer = zufällig im Land' : 'Land ohne Vereine im Datensatz: wechselt aus dem Ausland' },
      ]} />
      <div className="ed-sec">Karrierekurve</div>
      <FieldForm obj={obj} onChange={onChange} cols={[
        num('maturity', 'Frühreife', '−1 Spätentwickler … +1 früh fertig', 0.1),
        num('longevity', 'Langlebigkeit', '−1 früher Abbau … +1 spielt lange', 0.1),
      ]} />
      <div className="ed-sec">Verdeckte Werte (0–100)</div>
      <FieldForm obj={obj} onChange={onChange} cols={[
        num('hidden.consistency', 'Konstanz'), num('hidden.nerves', 'Nervenstärke'),
        num('hidden.injury', 'Verletzungsanfälligkeit', 'hoch = anfällig'), num('hidden.tempo', 'Entwicklungstempo'),
        num('hidden.professionalism', 'Trainingsfleiß'), num('hidden.ambition', 'Ehrgeiz'), num('hidden.adaptability', 'Anpassungsfähigkeit'),
      ]} />
      <div className="ed-sec">Persönlichkeit (0–100)</div>
      <FieldForm obj={obj} onChange={onChange} cols={[
        num('persona.loyalitaet', 'Loyalität'), num('persona.geld', 'Geld'), num('persona.heimat', 'Heimatverbundenheit'),
        num('persona.abenteuer', 'Abenteuerlust'), num('persona.rampenlicht', 'Rampenlicht'), num('persona.familie', 'Familie'),
      ]} />
    </aside>
  );
}
