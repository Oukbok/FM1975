// =============================================================================
// ClubEditorModal — Editor für kosmetische Vereinseigenschaften (SPIELWEIT)
// =============================================================================
// Ermöglicht dem Spieler, SEINEN gemanagten Verein kosmetisch anzupassen:
//   1) Wappen hochladen (PNG/JPG/SVG → Canvas-Downscale ≤256px → base64-DataURL)
//      inkl. „Wappen zurücksetzen" (zurück zum generierten Standard).
//   2) Heim- und Auswärtstrikot: pro Trikot umschaltbar zwischen
//        • „Design"        — Grundfarbe + Zweitfarbe + Muster (Live-JerseySVG)
//        • „Bild hochladen" — eigenes Trikotbild (≤512px, Live-Vorschau)
//      inkl. „Trikot zurücksetzen" pro Trikot.
// PERSISTENZ: Die Anpassungen werden SPIELWEIT und save-unabhängig im
// Override-Store (localStorage, keyed by club.id) abgelegt — sie gelten damit
// über alle Speicherstände hinweg, auch für neue Spiele, und überleben Reload.
// Zusätzlich wird das laufende Save-Objekt via onSaved() synchron gehalten
// (abwärtskompatibel). KEINE Spielwerte editierbar — rein kosmetisch.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { Club, Kit, KitPattern } from '../types';
import ClubCrest from './ClubCrest';
import JerseySVG from './JerseySVG';
import { defaultKit } from '../data/kits';
import { getClubOverrideForClub, setClubOverride, KitOverride } from '../data/clubOverrides';

/** Maximale Kantenlänge des gespeicherten Wappens (localStorage schonen). */
const MAX_CREST_PX = 256;
/** Maximale Kantenlänge eines hochgeladenen Trikotbildes. */
const MAX_KIT_PX = 512;
/** Sentinel-ID für die Editor-Vorschau (umgeht den Override-Store-Lookup). */
const PREVIEW_ID = '__ce_preview__';

const PATTERN_OPTIONS: { value: KitPattern; label: string }[] = [
  { value: 'solid', label: 'Einfarbig' },
  { value: 'stripes', label: 'Längsstreifen' },
  { value: 'hoops', label: 'Querstreifen' },
  { value: 'sash', label: 'Schärpe' },
  { value: 'mittelstreifen', label: 'Mittelstreifen' },
  { value: 'halves', label: 'Zweigeteilt' },
];

/** Bild-DataURL via Canvas auf max. `maxPx` herunterskalieren (PNG). */
function downscaleToDataURL(src: string, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) { resolve(src); return; }
      const scale = Math.min(1, maxPx / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(src); return; }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = src;
  });
}

/** Datei einlesen + auf `maxPx` herunterskalieren → DataURL. */
function fileToScaledDataURL(file: File, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        resolve(await downscaleToDataURL(String(reader.result), maxPx));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

function kitEquals(a: Kit, b: Kit): boolean {
  return (a.primary || '').toLowerCase() === (b.primary || '').toLowerCase()
    && (a.secondary || '').toLowerCase() === (b.secondary || '').toLowerCase()
    && a.pattern === b.pattern;
}

/** Bearbeitungszustand eines Trikots. */
interface KitState {
  mode: 'design' | 'image';
  design: Kit;
  image?: string;
}

/** Anfangszustand eines Trikots aus dem Override-Store / Save / Standard ableiten. */
function initKitState(club: Club, which: 'home' | 'away'): KitState {
  const ov = getClubOverrideForClub(club)?.[which];
  const fallbackDesign = club.kits?.[which] ?? defaultKit(club, which);
  if (ov?.image) return { mode: 'image', design: fallbackDesign, image: ov.image };
  return { mode: 'design', design: ov?.design ?? fallbackDesign, image: undefined };
}

function KitEditor({
  title,
  club,
  which,
  state,
  onChange,
}: {
  title: string;
  club: Club;
  which: 'home' | 'away';
  state: KitState;
  onChange: (s: KitState) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = (file: File | null) => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    fileToScaledDataURL(file, MAX_KIT_PX)
      .then((dataUrl) => onChange({ ...state, mode: 'image', image: dataUrl }))
      .catch(() => setErr('Bild konnte nicht verarbeitet werden. Bitte PNG, JPG oder SVG wählen.'))
      .finally(() => { setBusy(false); if (fileRef.current) fileRef.current.value = ''; });
  };

  const reset = () => {
    setErr(null);
    onChange({ mode: 'design', design: defaultKit(club, which), image: undefined });
  };

  return (
    <div className="ce-kit">
      <div className="ce-kit-preview">
        {state.mode === 'image' && state.image
          ? <JerseySVG image={state.image} size={124} />
          : <JerseySVG primary={state.design.primary} secondary={state.design.secondary} pattern={state.design.pattern} size={124} />}
        <div className="ce-kit-cap">{title}</div>
      </div>
      <div className="ce-kit-fields">
        {/* Umschalter Design / Bild */}
        <div className="ce-kit-modes">
          <button
            type="button"
            className={`ce-mode ${state.mode === 'design' ? 'is-active' : ''}`}
            onClick={() => onChange({ ...state, mode: 'design' })}
          >
            Design
          </button>
          <button
            type="button"
            className={`ce-mode ${state.mode === 'image' ? 'is-active' : ''}`}
            onClick={() => onChange({ ...state, mode: 'image' })}
          >
            Bild
          </button>
        </div>

        {state.mode === 'design' ? (
          <>
            <label className="ce-field">
              <span className="ce-field-lbl">Grundfarbe</span>
              <input
                type="color"
                className="ce-color"
                value={state.design.primary}
                onChange={(e) => onChange({ ...state, design: { ...state.design, primary: e.target.value } })}
              />
            </label>
            <label className="ce-field">
              <span className="ce-field-lbl">Zweitfarbe</span>
              <input
                type="color"
                className="ce-color"
                value={state.design.secondary}
                onChange={(e) => onChange({ ...state, design: { ...state.design, secondary: e.target.value } })}
              />
            </label>
            <label className="ce-field">
              <span className="ce-field-lbl">Muster</span>
              <select
                className="ce-select"
                value={state.design.pattern}
                onChange={(e) => onChange({ ...state, design: { ...state.design, pattern: e.target.value as KitPattern } })}
              >
                {PATTERN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <div className="ce-kit-upload">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => upload(e.target.files?.[0] ?? null)}
            />
            <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? 'Lädt…' : state.image ? 'Bild ersetzen' : 'Bild hochladen'}
            </button>
            <p className="ce-hint">PNG, JPG oder SVG. Wird auf max. {MAX_KIT_PX}px verkleinert.</p>
            {err && <p className="ce-err">{err}</p>}
          </div>
        )}

        <button type="button" className="btn btn-ghost ce-kit-reset" onClick={reset}>
          Trikot zurücksetzen
        </button>
      </div>
    </div>
  );
}

export default function ClubEditorModal({
  club,
  clubs,
  onClose,
  onSaved,
}: {
  /** Standardmäßig vorgewählter Verein (i.d.R. der gemanagte Verein). */
  club: Club;
  /** Alle im Spiel verfügbaren Vereine (für die Auswahlliste). */
  clubs: Club[];
  onClose: () => void;
  /** Wird nach dem Speichern aufgerufen, damit die Oberfläche aktualisiert und
   *  das laufende Save-Objekt synchron gehalten wird (abwärtskompatibel).
   *  `clubId` ist der bearbeitete Verein — das Save-Objekt darf nur für den
   *  gemanagten Verein gepatcht werden. */
  onSaved?: (clubId: string, patch: { customCrest?: string; kits: { home: Kit; away: Kit } }) => void;
}) {
  // Alphabetisch sortierte Auswahlliste aller Vereine.
  const sortedClubs = useMemo(
    () => [...clubs].sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [clubs],
  );
  // Aktuell im Editor bearbeiteter Verein (Default: übergebener Verein).
  const [selectedId, setSelectedId] = useState<string>(club.id);
  const activeClub: Club = clubs.find((c) => c.id === selectedId) ?? club;

  const [crest, setCrest] = useState<string | undefined>(getClubOverrideForClub(club)?.crest ?? club.customCrest);
  const [home, setHome] = useState<KitState>(() => initKitState(club, 'home'));
  const [away, setAway] = useState<KitState>(() => initKitState(club, 'away'));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Beim Wechsel des gewählten Vereins die Editor-Felder neu aus dessen
  // gespeichertem Override bzw. Standard laden (keine Vermischung der Teams).
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; } // Initialzustand steht schon
    const c = clubs.find((x) => x.id === selectedId) ?? club;
    setCrest(getClubOverrideForClub(c)?.crest ?? c.customCrest);
    setHome(initKitState(c, 'home'));
    setAway(initKitState(c, 'away'));
    setErr(null);
    setSaved(false);
    if (fileRef.current) fileRef.current.value = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCrestFile = (file: File | null) => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    fileToScaledDataURL(file, MAX_CREST_PX)
      .then((dataUrl) => setCrest(dataUrl))
      .catch(() => setErr('Bild konnte nicht verarbeitet werden. Bitte PNG, JPG oder SVG wählen.'))
      .finally(() => { setBusy(false); if (fileRef.current) fileRef.current.value = ''; });
  };

  // Vorschau-Verein mit Sentinel-ID: umgeht den Override-Store-Lookup, sodass
  // die Wappen-Vorschau exakt den aktuell bearbeiteten Zustand zeigt.
  const previewClub: Club = { ...activeClub, id: PREVIEW_ID, customCrest: crest };

  const save = () => {
    // 1) Spielweiter Override-Store (primäre Anzeigequelle) — für den GEWÄHLTEN Verein.
    const toOverride = (s: KitState, which: 'home' | 'away'): KitOverride | undefined => {
      if (s.mode === 'image') return s.image ? { image: s.image } : undefined;
      return kitEquals(s.design, defaultKit(activeClub, which)) ? undefined : { design: s.design };
    };
    setClubOverride(activeClub, {
      crest,
      home: toOverride(home, 'home'),
      away: toOverride(away, 'away'),
    });
    // 2) Save-Objekt synchron halten (abwärtskompatibel; Design-Fallback).
    onSaved?.(activeClub.id, { customCrest: crest, kits: { home: home.design, away: away.design } });
    // Fenster NICHT schließen — nur speichern und kurz bestätigen.
    // Schließen erfolgt über ESC oder das × in der Ecke.
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ce-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ce-header">
          <h2 className="ce-title">Editor</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ce-body">
          {/* --- Vereinsauswahl --- */}
          <section className="ce-section">
            <label className="ce-field ce-team-pick">
              <span className="ce-field-lbl">Verein</span>
              <select
                className="ce-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {sortedClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.id === club.id ? ' (dein Verein)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {/* --- Wappen --- */}
          <section className="ce-section">
            <h3 className="ce-sec-title">Wappen</h3>
            <div className="ce-crest-row">
              <div className="ce-crest-preview"><ClubCrest club={previewClub} size={96} /></div>
              <div className="ce-crest-actions">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={(e) => handleCrestFile(e.target.files?.[0] ?? null)}
                />
                <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
                  {busy ? 'Lädt…' : 'Wappen hochladen'}
                </button>
                <button className="btn btn-ghost" onClick={() => setCrest(undefined)} disabled={busy || !crest}>
                  Wappen zurücksetzen
                </button>
                <p className="ce-hint">PNG, JPG oder SVG. Wird automatisch auf max. {MAX_CREST_PX}px verkleinert.</p>
                {err && <p className="ce-err">{err}</p>}
              </div>
            </div>
          </section>

          {/* --- Trikots --- */}
          <section className="ce-section">
            <h3 className="ce-sec-title">Trikots</h3>
            <div className="ce-kits">
              <KitEditor key={`${activeClub.id}-home`} title="Heim" club={activeClub} which="home" state={home} onChange={setHome} />
              <KitEditor key={`${activeClub.id}-away`} title="Auswärts" club={activeClub} which="away" state={away} onChange={setAway} />
            </div>
          </section>

          <p className="ce-note">Anpassungen gelten spielweit — über alle Spielstände hinweg und auch für neue Spiele.</p>
        </div>

        <div className="ce-foot">
          {saved && <span className="ce-saved" role="status">Gespeichert</span>}
          <button className="btn btn-ghost" onClick={onClose}>Schließen</button>
          <button className="btn btn-primary" onClick={save}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
