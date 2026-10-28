import { useState } from 'react';
import { Dataset, FacilityData } from '../../data/dataset/schema';
import { LeagueReform, DivisionTarget } from '../../data/reforms';
import { StaffRole } from '../../data/staff';
import { MarketingArea } from '../../data/marketing';
import { TimelineEvent } from '../../data/timeline';
import { JsonBlock } from '../JsonBlock';
import { Col, Explain, TableEditor } from '../TableEditor';

// =============================================================================
// REGELN & EPOCHEN: Chronik, Ligen/Reformen, Einrichtungen, Mitarbeiter-Rollen,
// Marketing-Kanäle. Jahre steuern, wann etwas kommt oder verschwindet.
// =============================================================================
type P = { ds: Dataset; onChange: () => void };

const TYPE_OPTS = [
  { value: 'rule', label: 'Spielregel' }, { value: 'competition', label: 'Wettbewerb' }, { value: 'law', label: 'Reglement' },
  { value: 'tech', label: 'Technik' }, { value: 'finance', label: 'Finanzen' }, { value: 'reform', label: 'Ligareform' },
];

const TIMELINE_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 140, hint: 'Eindeutig; Spielstände merken sich ausgelöste IDs' },
  { key: 'season', label: 'Saison', width: 80, hint: 'z. B. 1995/96' },
  { key: 'year', label: 'Jahr', type: 'number', width: 80 },
  { key: 'type', label: 'Art', type: 'select', options: TYPE_OPTS, width: 120 },
  { key: 'title', label: 'Titel', width: 200 },
  { key: 'description', label: 'Beschreibung', type: 'longtext', width: 320 },
  { key: 'effect.pointSystem', label: 'Punkteregel', type: 'select', optional: true, width: 110,
    options: [{ value: '2-point', label: '2 Punkte' }, { value: '3-point', label: '3 Punkte' }] },
  { key: 'effect.unlock', label: 'Schaltet frei', optional: true, width: 150, hint: 'Feature-Flag, z. B. shirt_sponsorship' },
  { key: 'effect.attendanceBoost', label: 'Zuschauer +', type: 'number', optional: true, step: 0.01, width: 90 },
  { key: 'fictional', label: 'Fiktiv', type: 'bool', width: 60 },
];

export function TimelineSection({ ds, onChange }: P) {
  const sort = () => { ds.timeline.sort((a, b) => a.year - b.year || a.season.localeCompare(b.season)); onChange(); };
  return (
    <div className="ed-section">
      <Explain>Die Chronik: Meilensteine erscheinen zu Saisonbeginn als Nachricht und in der Chronik. Mit einem <b>Effekt</b> verändern sie das Spiel – Punkteregel umstellen, ein Feature freischalten (z. B. Trikotwerbung) oder die Zuschauer anheben. „Fiktiv“ markiert erfundene Zukunft.</Explain>
      <div className="ed-row"><button className="ed-btn" onClick={sort}>Nach Jahr sortieren</button></div>
      <TableEditor rows={ds.timeline} cols={TIMELINE_COLS} onChange={onChange} searchKeys={['id', 'title', 'season']}
        makeRow={(): TimelineEvent => ({ id: `ereignis_${ds.timeline.length + 1}`, season: '2030/31', year: 2030, type: 'rule', title: 'Neue Regel', description: '', fictional: true })} />
    </div>
  );
}

const DIV_COLS: Col[] = [
  { key: 'id', label: 'ID', width: 120 }, { key: 'tier', label: 'Ebene', type: 'number', width: 70 },
  { key: 'group', label: 'Staffel', type: 'select', optional: true, width: 110, options: [
    { value: 'nord', label: 'Nord' }, { value: 'sued', label: 'Süd' }, { value: 'nordost', label: 'Nordost' }, { value: 'west', label: 'West' }] },
  { key: 'name', label: 'Name', width: 180 }, { key: 'teamCount', label: 'Vereine', type: 'number', width: 80, hint: 'gerade Zahl' },
];

export function LeaguesSection({ ds, onChange }: P) {
  const [sel, setSel] = useState<number | null>(null);
  const reform = sel != null ? ds.leagues.reforms[sel] : undefined;
  const fixGroup = (rows: DivisionTarget[]) => { for (const r of rows) if (r.group === undefined) r.group = null; };
  const ch = () => { fixGroup(ds.leagues.base); ds.leagues.reforms.forEach((r) => fixGroup(r.targetStructure)); onChange(); };
  return (
    <div className="ed-section">
      <Explain>Die Ligapyramide zum Start und ihre Reformen. Jede Reform beschreibt die <b>vollständige</b> Struktur ab ihrer Saison. Auf- und Abstiege beim Übergang regelt das Spiel. Die vier eingebauten Reformen (<code>1981</code>, <code>1991</code>, <code>1994</code>, <code>2008</code>) haben eigene Übergangsregeln, die über die Reform-ID verknüpft sind – behalte diese IDs, wenn du sie nur anpasst.</Explain>
      <div className="ed-sec">Startstruktur 1975/76</div>
      <TableEditor rows={ds.leagues.base} cols={DIV_COLS} onChange={ch}
        makeRow={(): DivisionTarget => ({ id: 'tier3', tier: 3, group: null, name: '3. Liga', teamCount: 18 })} />
      <div className="ed-sec">Reformen (Zeile wählen, um die Zielstruktur zu bearbeiten)</div>
      <TableEditor rows={ds.leagues.reforms} onChange={ch} selected={sel} onSelect={setSel} searchKeys={['reformId', 'title']}
        cols={[
          { key: 'reformId', label: 'ID', width: 90 }, { key: 'effectiveSeason', label: 'Ab Saison', width: 90 },
          { key: 'title', label: 'Titel', width: 220 }, { key: 'description', label: 'Beschreibung', type: 'longtext', width: 300 },
          { key: 'qualificationRule', label: 'Qualifikation', type: 'longtext', width: 260 },
        ]}
        makeRow={(): LeagueReform => ({ reformId: `reform_${ds.leagues.reforms.length + 1}`, effectiveSeason: '2030/31', title: 'Neue Reform', description: '', affectedTiers: [], qualificationRule: '', targetStructure: ds.leagues.base.map((d) => ({ ...d })) })} />
      {reform && <>
        <div className="ed-sec">Zielstruktur: {reform.title}</div>
        <TableEditor rows={reform.targetStructure} cols={DIV_COLS} onChange={ch}
          makeRow={(): DivisionTarget => ({ id: `div${reform.targetStructure.length + 1}`, tier: 3, group: null, name: 'Neue Liga', teamCount: 18 })} />
        <div className="ed-hint">Betroffene Ebenen (für die Chronik):</div>
        <JsonBlock value={reform.affectedTiers} rows={2} onApply={(v) => { reform.affectedTiers = Array.isArray(v) ? v.map(Number) : []; onChange(); }} />
      </>}
    </div>
  );
}

export function FacilitiesSection({ ds, onChange }: P) {
  return (
    <div className="ed-section">
      <Explain>Einrichtungen des Vereins. Die Wirkung (Stufen, Effekte) bleibt im Spiel fest; editierbar sind Name, Beschreibung, Grundpreis (in DM-Basis 1975, wird mit der Teuerung skaliert) und die Jahre, ab denen eine Einrichtung baubar ist bzw. nicht mehr ausgebaut werden kann.</Explain>
      <TableEditor rows={ds.facilities} onChange={onChange} searchKeys={['key', 'name']}
        cols={[
          { key: 'key', label: 'Schlüssel', width: 120, hint: 'fest – verknüpft mit der Spielmechanik' },
          { key: 'name', label: 'Name', width: 180 }, { key: 'desc', label: 'Beschreibung', type: 'longtext', width: 320 },
          { key: 'baseCost', label: 'Grundpreis', type: 'number', width: 110 },
          { key: 'unlockYear', label: 'Ab Jahr', type: 'number', optional: true, width: 90 },
          { key: 'obsoleteYear', label: 'Bis Jahr', type: 'number', optional: true, width: 90 },
        ]} />
      <div className="ed-hint">Neue Einrichtungs-Arten lassen sich nicht anlegen – das Spiel kennt nur die eingebauten Schlüssel. {ds.facilities.length === 0 ? '' : `(${(ds.facilities as FacilityData[]).length} Einrichtungen)`}</div>
    </div>
  );
}

const STAFF_GROUPS = [
  { value: 'trainer', label: 'Trainerstab' }, { value: 'medical', label: 'Medizin' }, { value: 'scouting', label: 'Scouting' },
  { value: 'media', label: 'Medien' }, { value: 'admin', label: 'Verwaltung' },
];
const COST = ['K1', 'K2', 'K3', 'K4', 'K5'].map((k) => ({ value: k, label: k }));

export function StaffSection({ ds, onChange }: P) {
  return (
    <div className="ed-section">
      <Explain>Mitarbeiter-Rollen: ab welchem Jahr sie anstellbar sind, was sie kosten (Klasse K1 günstig bis K5 teuer) und was sie bewirken. Die Effektwerte sind Anteile (0,08 = 8 %) und werden über alle Mitarbeiter zusammengezählt und gedeckelt.</Explain>
      <TableEditor rows={ds.staff} onChange={onChange} searchKeys={['id', 'name']}
        cols={[
          { key: 'id', label: 'ID', width: 120 }, { key: 'name', label: 'Name', width: 170 },
          { key: 'group', label: 'Bereich', type: 'select', options: STAFF_GROUPS, width: 120 },
          { key: 'unlockYear', label: 'Ab Jahr', type: 'number', width: 80 },
          { key: 'obsoleteYear', label: 'Bis Jahr', type: 'number', optional: true, width: 80 },
          { key: 'costClass', label: 'Kosten', type: 'select', options: COST, width: 70 },
          { key: 'effect', label: 'Wirkung (Text)', type: 'longtext', width: 240 },
          { key: 'injuryReduction', label: 'Verletzung −', type: 'number', optional: true, step: 0.01, width: 90 },
          { key: 'rehabReduction', label: 'Reha −', type: 'number', optional: true, step: 0.01, width: 80 },
          { key: 'recovery', label: 'Regeneration', type: 'number', optional: true, step: 0.1, width: 90 },
          { key: 'scouting', label: 'Scouting', type: 'number', optional: true, step: 0.01, width: 80 },
          { key: 'reach', label: 'Reichweite', type: 'number', optional: true, step: 0.01, width: 80 },
          { key: 'flavor', label: 'Nur Flair', type: 'bool', width: 70 },
        ]}
        makeRow={(): StaffRole => ({ id: `rolle_${ds.staff.length + 1}`, name: 'Neue Rolle', group: 'trainer', unlockYear: 2030, costClass: 'K2', effect: '' })} />
    </div>
  );
}

export function MarketingSection({ ds, onChange }: P) {
  return (
    <div className="ed-section">
      <Explain>Marketing-Kanäle: wann sie verfügbar sind und wie sie wirken. Je Kanal stellst du Stufen ein (bis <b>Max.</b>) zum Monatspreis je Stufe (DM-Basis 1975); die Reichweite steigt bis <b>Max. Nutzen</b> (Indexpunkte) mit abnehmendem Ertrag – je höher <b>k</b>, desto schneller ist der Kanal gesättigt.</Explain>
      <TableEditor rows={ds.marketing} onChange={onChange} searchKeys={['id', 'name']}
        cols={[
          { key: 'id', label: 'ID', width: 110 }, { key: 'name', label: 'Name', width: 170 },
          { key: 'unlockYear', label: 'Ab Jahr', type: 'number', width: 80 },
          { key: 'obsoleteYear', label: 'Bis Jahr', type: 'number', optional: true, width: 80 },
          { key: 'icon', label: 'Symbol', width: 100, hint: 'Icon-Name des Spiels' },
          { key: 'desc', label: 'Beschreibung', type: 'longtext', width: 260 },
          { key: 'maxUnits', label: 'Max.', type: 'number', width: 70 },
          { key: 'costPerUnit', label: 'Preis/Einheit', type: 'number', width: 100 },
          { key: 'maxBenefit', label: 'Max. Nutzen', type: 'number', width: 90 },
          { key: 'k', label: 'k', type: 'number', step: 0.01, width: 70 },
        ]}
        makeRow={(): MarketingArea => ({ id: `kanal_${ds.marketing.length + 1}`, name: 'Neuer Kanal', unlockYear: 2030, icon: 'marketing', desc: '', maxUnits: 5, costPerUnit: 3000, maxBenefit: 15, k: 1 })} />
    </div>
  );
}
