import { useState } from 'react';
import { Dataset, PlayerPhotoSet } from '../../data/dataset/schema';
import { BUILTIN_LEGENDS } from '../../data/legends';
import { Col, Explain, FieldForm, TableEditor } from '../TableEditor';
import { useNavTarget } from '../nav';
import { PhotoGallery, PhotoRightsNote } from '../PhotoGallery';
import { PortraitEditor } from '../PortraitEditor';

// =============================================================================
// SPIELERFOTOS (Datensatz-Feld `playerPhotos`, Wunsch Pascal): eigene Bilder zu
// Spielern und Legenden – je Eintrag ein Spielerbild (Porträt, ersetzt im Spiel
// überall das Gesicht) und beliebig viele Fotos für Zeitung und Newscenter.
// Liste links, Bezug + Spielerbild + Fotos des gewählten Eintrags rechts.
// Spieler entstehen im Spiel – deshalb Zuordnung über Namen (+ Geburtsjahr/Verein),
// Legenden über ihre ID (Bereich Ausnahmetalente).
// =============================================================================
type P = { ds: Dataset; onChange: () => void };
export const LEGEND_IDS_LIST = 'ed-legend-ids';

/** Eintrag einer Legende holen bzw. anlegen (ein Eintrag je Legende – Porträt und Fotos zusammen). */
export function legendPhotoSet(ds: Dataset, legendId: string): PlayerPhotoSet {
  ds.playerPhotos ??= [];
  let set = ds.playerPhotos.find((x) => x.legendId === legendId);
  if (!set) { set = { id: nextPhotoId(ds.playerPhotos), legendId, photos: [] }; ds.playerPhotos.push(set); }
  return set;
}

/** Neue freie ID „foto1“, „foto2“ … */
export function nextPhotoId(list: PlayerPhotoSet[]): string {
  const used = new Set(list.map((x) => x.id));
  let n = list.length + 1;
  while (used.has(`foto${n}`)) n++;
  return `foto${n}`;
}

export function PhotosSection({ ds, onChange }: P) {
  if (!Array.isArray(ds.playerPhotos)) ds.playerPhotos = [];
  const rows = ds.playerPhotos;
  const legends = Array.isArray(ds.legendsV2) ? ds.legendsV2 : BUILTIN_LEGENDS;
  const target = useNavTarget();
  const [sel, setSel] = useState<number | null>(() => {
    const i = target?.id ? rows.findIndex((r) => r.id === target.id) : -1;
    return i >= 0 ? i : rows.length ? 0 : null;
  });
  const cur = sel != null ? rows[sel] : undefined;
  const cols: Col[] = [
    { key: 'name', label: 'Spieler (voller Name)', width: 190, optional: true },
    { key: 'legendId', label: 'Legenden-ID', width: 120, optional: true },
    { key: 'born', label: 'Geburtsjahr', type: 'number', optional: true, width: 90 },
    { key: 'club', label: 'Verein', ref: 'club', optional: true, width: 110 },
  ];
  const make = (): PlayerPhotoSet => ({ id: nextPhotoId(rows), name: 'Vorname Nachname', photos: [] });
  const legendName = (id?: string) => { const l = id ? legends.find((x) => x.id === id) : undefined; return l ? `${l.firstName} ${l.lastName}` : undefined; };
  return (
    <div className="ed-section">
      <Explain>Eigene Bilder zu Spielern und Ausnahmetalenten. Das <b>Spielerbild (Porträt)</b> ersetzt im Spiel überall das Gesicht – im Spielerprofil, in allen Listen, in Zeitung und Newscenter; du lädst ein Bild hoch und schneidest es im Kopf-Format zu. Die <b>Fotos</b> dagegen sind Pressebilder: Wird ein Spieler in einer Nachricht im <b>Newscenter</b> oder in einem Artikel der <b>Zeitung</b> erwähnt, erscheint sein Foto statt des üblichen Pressefotos. Je Foto wählst du die <b>Art</b>: „Allgemein“ passt immer, eine <b>Pose</b> (Torjubel, Verletzung, Vertrag …) nur zum passenden Anlass – zuerst die passende Pose, sonst ein allgemeines Foto, sonst das übliche Pressefoto. <b>Zuordnung:</b> Spieler entstehen erst im Spiel und haben keine feste ID – trag den vollen Namen ein, wie er im Spiel steht; bei Gleichnamigen grenzt du per <b>Geburtsjahr</b> oder <b>Verein</b> (Vereins-ID, nur solange er dort spielt) ein. Für Ausnahmetalente die <b>Legenden-ID</b> eintragen (oder die Fotos direkt unter „Ausnahmetalente“ hochladen) – das gilt auch, wenn die Legende erst Jahre später im Spiel erscheint.</Explain>
      <PhotoRightsNote />
      <datalist id={LEGEND_IDS_LIST}>{legends.map((l) => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}</datalist>
      <div className="ed-split">
        <TableEditor rows={rows} cols={cols} onChange={onChange} makeRow={make} selected={sel} onSelect={setSel}
          searchKeys={['id', 'name', 'legendId', 'club']} title="Spielerfotos" csvName="spielerfotos" />
        {cur && (
          <aside className="ed-side ed-photo-side" key={`${sel}-${cur.id}`}>
            <div className="ed-side-title">{cur.legendId ? legendName(cur.legendId) ?? `Legende ${cur.legendId}` : cur.name || 'Ohne Namen'}</div>
            <div className="ed-sec">Zuordnung</div>
            <FieldForm obj={cur as unknown as Record<string, unknown>} onChange={onChange} cols={[
              { key: 'name', label: 'Spieler (voller Name)', optional: true, hint: 'genau wie im Spiel, z. B. „Klaus Berger“; leer bei Legenden' },
              { key: 'born', label: 'Geburtsjahr', type: 'number', optional: true, hint: 'optional, für Gleichnamige' },
              { key: 'club', label: 'Verein (aktuell)', ref: 'club', optional: true, hint: 'optional: Vereins-ID – gilt nur, solange er dort spielt' },
            ]} />
            <label className="ed-field">
              <span className="ed-label">Legenden-ID</span>
              <input className={`ed-in ${cur.legendId && !legendName(cur.legendId) ? 'bad' : ''}`} list={LEGEND_IDS_LIST} value={cur.legendId ?? ''}
                onChange={(e) => { cur.legendId = e.target.value.trim() || undefined; onChange(); }} />
              <span className="ed-hint">{cur.legendId ? legendName(cur.legendId) ?? 'unbekannte Legenden-ID' : 'Ausnahmetalent statt Name – hat Vorrang vor dem Namen'}</span>
            </label>
            <div className="ed-sec">Spielerbild (Porträt)</div>
            <PortraitEditor set={cur} ensure={() => cur} onChange={onChange} />
            <div className="ed-sec">Fotos für Zeitung und Newscenter</div>
            <PhotoGallery set={cur} ensure={() => cur} onChange={onChange} />
          </aside>
        )}
      </div>
    </div>
  );
}
