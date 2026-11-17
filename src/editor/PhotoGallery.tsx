// =============================================================================
// Fotos eines Spielers bzw. einer Legende (Datensatz `playerPhotos`, Wunsch Pascal):
// beliebig viele Bilder hochladen (verkleinert, WebP/JPEG als Data-URL), je Foto
// die Art wählen – „Allgemein“ oder eine Pose passend zu den Pressemotiven –,
// löschen. Genutzt in Spielerfotos (sections/Photos.tsx) und Ausnahmetalente.
// =============================================================================
import { useRef, useState } from 'react';
import type { PlayerPhotoSet } from '../data/dataset/schema';
import { PHOTO_POSES } from '../data/pressPhotos';
import { photoToDataUrl } from './store';

/** Kurzer Rechtehinweis (auch über der Liste der Spielerfotos). */
export function PhotoRightsNote() {
  return (
    <div className="ed-photo-rights" role="note">
      Nur eigene oder rechtefreie Bilder verwenden – keine Fotos echter Fußballer oder anderer realer Personen ohne deren Erlaubnis.
      Die Bilder stecken im Datensatz und werden mit ihm weitergegeben.
    </div>
  );
}

export function PhotoGallery({ set, ensure, onChange }: { set: PlayerPhotoSet | undefined; ensure: () => PlayerPhotoSet; onChange: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const photos = set?.photos ?? [];

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setErr(null);
    const errs: string[] = [];
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      try { urls.push(await photoToDataUrl(f)); } catch (e) { errs.push((e as Error).message); }
    }
    if (urls.length) {
      const s = ensure();
      for (const img of urls) s.photos.push({ pose: 'general', img });
      onChange();
    }
    setBusy(false);
    if (errs.length) setErr(errs.join(' '));
  };
  const setPose = (i: number, pose: PlayerPhotoSet['photos'][number]['pose']) => { if (!set) return; set.photos[i].pose = pose; onChange(); };
  const remove = (i: number) => { if (!set) return; set.photos.splice(i, 1); onChange(); };
  const kb = (url: string) => Math.round((url.length * 3) / 4 / 1024);

  return (
    <div className="ed-photos">
      <div className="ed-photo-bar">
        <button className="ed-btn" data-act="photo-add" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Lädt …' : 'Fotos hinzufügen'}</button>
        <span className="ed-hint">{photos.length ? `${photos.length} Foto${photos.length === 1 ? '' : 's'}` : 'Noch keine Fotos – im Spiel erscheint das übliche Pressefoto.'}</span>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" multiple style={{ display: 'none' }}
          onChange={(e) => { const fl = e.target.files; void upload(fl).then(() => { e.target.value = ''; }); }} />
      </div>
      {err && <div className="ed-err">{err}</div>}
      <div className="ed-photo-list">
        {photos.map((ph, i) => (
          <div key={i} className="ed-photo" data-pose={ph.pose}>
            <img src={ph.img} alt="" draggable={false} />
            <div className="ed-photo-meta">
              <div className="ed-photo-head">
                <span className="ed-label">Art des Fotos</span>
                <span className="ed-hint">{kb(ph.img)} KB</span>
                <button className="ed-mini danger" title="Foto löschen" data-act="photo-del" onClick={() => remove(i)}>×</button>
              </div>
              <div className="ed-pose-chips">
                {PHOTO_POSES.map((p) => (
                  <button key={p.id} className={`ed-pose ${ph.pose === p.id ? 'on' : ''}`} data-pose={p.id} title={p.hint} onClick={() => setPose(i, p.id)}>{p.label}</button>
                ))}
              </div>
              <span className="ed-hint">{PHOTO_POSES.find((p) => p.id === ph.pose)?.hint}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
