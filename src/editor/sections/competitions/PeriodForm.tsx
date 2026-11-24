// =============================================================================
// EDITOR › WETTBEWERBE – Formular einer Periode: Name, Kurzname, Trophäe (Form
// oder eigenes Bild), Teilnehmer-Regeln und Format. Leere Felder = Standard der
// jeweiligen Saison (Platzhalter zeigt ihn). Was die Engine nicht aus Daten liest,
// steht als „nur Anzeige“ darunter.
// =============================================================================
import { useRef, useState } from 'react';
import type { CompPeriod } from '../../../data/competitions/overrides';
import { baseValues, TROPHY_SHAPES, type CompDef, type CompValues } from '../../../data/competitions/registry';
import type { Dataset } from '../../../data/dataset/schema';
import type { TrophyShape } from '../../../game/trophyCabinet';
import { TrophyArt } from '../../../views/club/trophies/TrophyArt';
import { photoToDataUrl } from '../../store';
import { EuroFormatEditor, SlotsEditor } from './EuroParts';
import { seasonLabel } from './model';

type SetFn = <K extends keyof CompPeriod>(k: K, v: CompPeriod[K] | undefined) => void;
const yn = (b: boolean | undefined) => (b ? 'ja' : 'nein');

function Tri({ label, value, std, onSet, hint }: { label: string; value: boolean | undefined; std: boolean | undefined; onSet: (v: boolean | undefined) => void; hint?: string }) {
  return (
    <label className="ed-field"><span className="ed-label">{label}</span>
      <select className="ed-in" value={value === undefined ? '' : value ? 'y' : 'n'} onChange={(e) => onSet(e.target.value === '' ? undefined : e.target.value === 'y')}>
        <option value="">Standard ({yn(std)})</option><option value="y">ja</option><option value="n">nein</option>
      </select>
      {hint && <span className="ed-hint">{hint}</span>}
    </label>
  );
}

function Pick<T extends string>({ label, value, std, opts, onSet, hint }: { label: string; value: T | undefined; std: T | undefined; opts: [T, string][]; onSet: (v: T | undefined) => void; hint?: string }) {
  const lab = (v: T | undefined) => opts.find((o) => o[0] === v)?.[1] ?? '–';
  return (
    <label className="ed-field"><span className="ed-label">{label}</span>
      <select className="ed-in" value={value ?? ''} onChange={(e) => onSet((e.target.value || undefined) as T | undefined)}>
        <option value="">Standard ({lab(std)})</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {hint && <span className="ed-hint">{hint}</span>}
    </label>
  );
}

function TextField({ label, value, std, onSet, hint, attr }: { label: string; value: string | undefined; std: string; onSet: (v: string | undefined) => void; hint?: string; attr?: string }) {
  return (
    <label className="ed-field"><span className="ed-label">{label}</span>
      <input className="ed-in" data-field={attr} defaultValue={value ?? ''} placeholder={std}
        onBlur={(e) => { const v = e.target.value.trim(); onSet(v && v !== std ? v : undefined); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
      <span className="ed-hint">{hint ?? `Leer = Standard „${std}“`}</span>
    </label>
  );
}

function TrophyPart({ p, base, onSet }: { p: CompPeriod; base: CompValues; onSet: SetFn }) {
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const shape = (p.trophy as TrophyShape | undefined) ?? base.trophy;
  const upload = async (f?: File) => {
    if (!f) return;
    try { onSet('trophyImg', await photoToDataUrl(f, 560)); setErr(null); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <div className="ed-comp-box" data-part="trophy">
      <div className="ed-comp-box-head"><b>Trophäe</b><span className="ed-badge good">Vitrine & Spielplan</span></div>
      <div className="ed-comp-trophy-row">
        <div className="ed-comp-trophy">
          {p.trophyImg ? <img src={p.trophyImg} alt="" /> : shape ? <TrophyArt shape={shape} /> : <span className="ed-hint">keine Trophäe</span>}
        </div>
        <div className="ed-comp-trophy-ctl">
          <Pick label="Gezeichnete Form" value={p.trophy as TrophyShape | undefined} std={base.trophy ?? undefined}
            opts={TROPHY_SHAPES.map((t) => [t.key, t.label])} onSet={(v) => onSet('trophy', v)} />
          <div className="ed-row">
            <button className="ed-btn" data-act="trophy-upload" onClick={() => file.current?.click()}>{p.trophyImg ? 'Bild ersetzen' : 'Eigenes Bild hochladen'}</button>
            {p.trophyImg && <button className="ed-btn" onClick={() => onSet('trophyImg', undefined)}>Bild entfernen</button>}
          </div>
          <span className="ed-hint">PNG, JPEG oder WebP, wird auf 560 px verkleinert (am besten freigestellt, hochkant). Ein eigenes Bild ersetzt Zeichnung und Foto.</span>
          {err && <span className="ed-err">{err}</span>}
        </div>
      </div>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

export function PeriodForm({ ds, def, p, onSet }: { ds: Dataset; def: CompDef; p: CompPeriod; onSet: SetFn }) {
  void ds;
  const base = baseValues(def, p.from);
  const lastY = Math.min(p.to, 2100);
  const changes = lastY > p.from && JSON.stringify(baseValues(def, lastY)) !== JSON.stringify(base);
  const has = (e: CompDef['edits'][number]) => def.edits.includes(e);
  const era = base.superEra;
  return (
    <div className="ed-comp-form">
      {changes && <div className="ed-note">Der Standard ändert sich innerhalb dieser Periode. Leere Felder folgen in jeder Saison dem Standard; Platzhalter zeigen den Stand {seasonLabel(p.from)}.</div>}
      {!base.held && !has('held') && <div className="ed-note">In {seasonLabel(p.from)} wird dieser Wettbewerb im Spiel nicht ausgetragen – Name und Trophäe gelten nur für Archiv und Anzeigen.</div>}
      <div className="ed-comp-grid">
        <TextField label="Name" attr="name" value={p.name} std={base.name} onSet={(v) => onSet('name', v)} />
        {has('short') && <TextField label="Kurzname (Kalender)" attr="short" value={p.short} std={base.short} onSet={(v) => onSet('short', v)} />}
        {has('held') && <Tri label="Wird ausgetragen" value={p.held} std={base.held} onSet={(v) => onSet('held', v)} hint="„nein“ streicht den Gipfelpokal, „ja“ führt ihn ein (Rückfall: ein Spiel im August)." />}
      </div>
      {has('trophy') && <TrophyPart p={p} base={base} onSet={onSet} />}
      {has('replay') && (
        <div className="ed-comp-box" data-part="cup">
          <div className="ed-comp-box-head"><b>Regeln & Teilnehmer</b><span className="ed-badge good">wirksam</span></div>
          <div className="ed-comp-grid">
            <Tri label="Wiederholungsspiel in den Runden" value={p.replayRounds} std={base.replayRounds} onSet={(v) => onSet('replayRounds', v)} hint="Remis nach Verlängerung: Wiederholung mit getauschtem Heimrecht, sonst Elfmeterschießen." />
            <Tri label="Wiederholungsspiel im Finale" value={p.replayFinal} std={base.replayFinal} onSet={(v) => onSet('replayFinal', v)} />
            <Pick label="Pokalsieger startet in" value={p.cupTo} std={base.cupTo} onSet={(v) => onSet('cupTo', v)}
              opts={[['cwc', 'Pokal der Pokalsieger'], ['uefa', 'Europa-Pokal / Kontinental-Liga'], ['none', 'keinem Europapokal']]}
              hint="Gilt für das Heimatland; ist der Wettbewerb in der Saison nicht aktiv, entfällt der Platz." />
          </div>
          <div className="ed-comp-ro"><span className="ed-badge">nur Anzeige</span> {base.info.join(' ')} Teilnehmerfeld, Freilose und Amateure folgen dem Ligasystem (Bereich „Ligasystem & Reformen“).</div>
        </div>
      )}
      {has('superFormat') && (
        <div className="ed-comp-box" data-part="super">
          <div className="ed-comp-box-head"><b>Modus</b><span className="ed-badge good">wirksam</span></div>
          <div className="ed-comp-grid">
            <Pick label="Modus" value={p.superFormat} std={era?.format} onSet={(v) => onSet('superFormat', v)}
              opts={[['final', 'ein Spiel'], ['legs2', 'Hin- und Rückspiel'], ['four', 'vier Teams (Halbfinale + Finale, Januar)'], ['six', 'sechs Teams (Ligapokal, Juli)']]} />
            <Pick label="Gegner beim Double" value={p.double} std={era?.double} onSet={(v) => onSet('double', v)} opts={[['cupFinalist', 'Pokalfinalist'], ['runnerUp', 'Vizemeister']]} />
            <Pick label="Heimrecht" value={p.host} std={era?.host} onSet={(v) => onSet('host', v)} opts={[['champion', 'Meister'], ['other', 'Gegner'], ['neutral', 'neutral']]} />
            <label className="ed-field"><span className="ed-label">Monat</span>
              <input className="ed-in num" type="number" min={1} max={12} defaultValue={p.month ?? ''} placeholder={String(era?.month ?? 8)}
                onBlur={(e) => { const m = Math.round(Number(e.target.value)); onSet('month', e.target.value && m >= 1 && m <= 12 ? m : undefined); }} />
              <span className="ed-hint">7 = früh im Juli, sonst kurz vor dem ersten Ligaspieltag.</span></label>
            <Tri label="Bei Remis direkt Elfmeterschießen" value={p.directPens} std={era?.directPens} onSet={(v) => onSet('directPens', v)} />
            <Tri label="Bei Remis geteilter Titel" value={p.shared} std={era?.shared} onSet={(v) => onSet('shared', v)} />
          </div>
          <div className="ed-comp-ro"><span className="ed-badge">nur Anzeige</span> Teilnehmer: Meister gegen Pokalsieger, bei vier/sechs Teams dazu die nächsten der Tabelle; Prämien fest.</div>
        </div>
      )}
      {has('slots') && <SlotsEditor p={p} base={base.slots ?? []} onSet={(v) => onSet('slots', v)}
        note={def.id === 'cwc' ? 'Pokal der Pokalsieger: bis 1998/99 kommt der Pokalsieger über „Pokalsieger startet in“ (Landespokal); über die Liga nur ab 2021/22 (Europa-Trophäe).' : def.id === 'uefa' ? 'Ab 1999/00 zählt der Pokalsieger mit.' : undefined} />}
      {has('euroFormat') && <EuroFormatEditor p={p} base={base.euro ?? null} onSet={onSet} />}
      {!has('euroFormat') && !has('replay') && !has('superFormat') && (
        <div className="ed-comp-ro"><span className="ed-badge">nur Anzeige</span> {readOnlyNote(def)} {base.info.join(' ')}</div>
      )}
    </div>
  );
}

function readOnlyNote(def: CompDef): string {
  switch (def.kind) {
    case 'league': return 'Teilnehmer, Ligagröße, Auf- und Abstieg und Punkteregel kommen aus „Ligen je Saison“ bzw. „Ligasystem & Reformen“. Der Name gilt für die Ebene ohne Staffelzusatz.';
    case 'ic': return 'Format, Teilnehmer und Termine sind fest in den Daten der Kontinente hinterlegt:';
    case 'uefasuper': return 'Teilnehmer und Termin fest:';
    case 'halle': return 'Hallentour, Teilnehmer und Wertung folgen den Halleneinstellungen.';
    case 'youth': return 'Format und Teilnehmer der Jugendwettbewerbe sind fest hinterlegt.';
    case 'nat': return 'Turniere, Gastgeber und Teilnehmerzahl sind fest hinterlegt; Name erscheint in Nachrichten, Kalender und Nationaltrainer-Ansicht.';
    default: return '';
  }
}
