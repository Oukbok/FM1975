// =============================================================================
// EDITOR › WETTBEWERBE – Europapokal: Startplätze je Rang und Format je Periode.
// Wirksam (liest die Engine): Startplätze (accessSlots), Auswärtstorregel, Punkte
// je Sieg, Hin-/Rückspiel und Name je K.-o.-Runde (euroFormat). Nur Anzeige:
// Teilnehmerzahl, Gruppen/Ligaphase, Termine, Weiterleitungen, Wertung.
// =============================================================================
import type { CompPeriod } from '../../../data/competitions/overrides';
import type { EuroFormat } from '../../../data/euroFormats';

const TIEBREAK: Record<EuroFormat['tiebreak'], string> = { overall: 'Tordifferenz, Tore, Auswärtstore', h2h: 'direkter Vergleich, dann Tordifferenz', league: 'Ligaphase: Tordifferenz, Tore, Auswärtstore, Siege' };
const KIND: Record<string, string> = { ko: 'K.-o.', groups: 'Gruppen', league: 'Ligaphase' };
const md = (d: string) => `${d.slice(3, 5)}.${d.slice(0, 2)}.`;

/** Startplätze je Rang der Fünfjahreswertung. */
export function SlotsEditor({ p, base, note, onSet }: { p: CompPeriod; base: [number, number][]; note?: string; onSet: (v: [number, number][] | undefined) => void }) {
  const own = p.slots;
  const list = own ?? base;
  const text = (b: [number, number][]) => b.map(([upTo, n], i) => `Rang ${i ? b[i - 1][0] + 1 : 1}${upTo >= 99 ? '+' : `–${upTo}`}: ${n}`).join(' · ');
  const edit = (i: number, k: 0 | 1, v: string) => {
    const x = Math.round(Number(v));
    if (!Number.isFinite(x)) return;
    const next = list.map((b) => [...b] as [number, number]);
    next[i][k] = Math.max(k === 0 ? 1 : 0, x);
    onSet(next.sort((a, b) => a[0] - b[0]));
  };
  return (
    <div className="ed-comp-box" data-part="slots">
      <div className="ed-comp-box-head">
        <b>Startplätze je Land</b>
        <span className="ed-badge good">wirksam</span>
        {own ? <button className="ed-btn" onClick={() => onSet(undefined)}>Standard</button>
          : <button className="ed-btn" data-act="slots-edit" onClick={() => onSet(base.map((b) => [...b] as [number, number]))}>Anpassen</button>}
      </div>
      <div className="ed-hint">Nach Rang des Landes in der Fünfjahreswertung (gilt für das Heimatland und die Länder der Hintergrund-Welt). {note}</div>
      {!own && <div className="ed-comp-std">Standard: {text(base)}</div>}
      {own && (
        <table className="ed-table ed-comp-slots">
          <thead><tr><th>bis Rang</th><th>Plätze</th><th /></tr></thead>
          <tbody>
            {list.map((b, i) => (
              <tr key={`${i}-${b[0]}-${b[1]}`}>
                <td><input className="ed-in num" type="number" min={1} defaultValue={b[0]} onBlur={(e) => edit(i, 0, e.target.value)} /></td>
                <td><input className="ed-in num" type="number" min={0} max={8} defaultValue={b[1]} onBlur={(e) => edit(i, 1, e.target.value)} /></td>
                <td><button className="ed-mini danger" disabled={list.length < 2} title="Zeile entfernen" onClick={() => onSet(list.filter((_, k) => k !== i))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {own && <div className="ed-row"><button className="ed-btn" onClick={() => { const prev = list.length > 1 ? list[list.length - 2][0] : 0; if (prev + 1 < list[list.length - 1][0]) onSet([...list.map((x) => [...x] as [number, number]), [prev + 1, list[list.length - 1][1]] as [number, number]].sort((x, y) => x[0] - y[0])); }}>Zeile hinzufügen</button>
        <span className="ed-hint">Ränge über der letzten Zeile bekommen deren Zahl.</span></div>}
    </div>
  );
}

/** Format der Periode: Regeln + Runden. */
export function EuroFormatEditor({ p, base, onSet }: {
  p: CompPeriod; base: EuroFormat | null;
  onSet: <K extends keyof CompPeriod>(k: K, v: CompPeriod[K] | undefined) => void;
}) {
  if (!base) return <div className="ed-comp-box"><div className="ed-comp-box-head"><b>Format</b></div><div className="ed-hint">In dieser Periode ruht der Wettbewerb – es gibt kein Format.</div></div>;
  const legs = p.legs ?? {};
  const names = p.stageNames ?? {};
  const setLegs = (key: string, v: string) => {
    const n = { ...legs };
    if (v === '') delete n[key]; else n[key] = Number(v) as 1 | 2;
    onSet('legs', Object.keys(n).length ? n : undefined);
  };
  const setName = (key: string, v: string, std: string) => {
    const n = { ...names };
    if (!v.trim() || v.trim() === std) delete n[key]; else n[key] = v.trim();
    onSet('stageNames', Object.keys(n).length ? n : undefined);
  };
  const adv = base.stages.flatMap((s) => (s.advance ?? []).map((a) => `${s.name}: Platz ${a.from}${a.to !== a.from ? `–${a.to}` : ''} → ${a.target}${a.comp ? ` (${a.comp})` : ''}`));
  return (
    <div className="ed-comp-box" data-part="format">
      <div className="ed-comp-box-head"><b>Format</b><span className="ed-badge good">Regeln und Runden wirksam</span></div>
      <div className="ed-comp-grid">
        <label className="ed-field"><span className="ed-label">Auswärtstorregel</span>
          <select className="ed-in" value={p.awayGoals === undefined ? '' : p.awayGoals ? 'y' : 'n'} onChange={(e) => onSet('awayGoals', e.target.value === '' ? undefined : e.target.value === 'y')}>
            <option value="">Standard ({base.awayGoals ? 'ja' : 'nein'})</option><option value="y">ja</option><option value="n">nein</option>
          </select></label>
        <label className="ed-field"><span className="ed-label">Punkte je Sieg (Gruppen/Liga)</span>
          <select className="ed-in" value={p.winPts ?? ''} onChange={(e) => onSet('winPts', e.target.value ? Number(e.target.value) as 2 | 3 : undefined)}>
            <option value="">Standard ({base.winPts})</option><option value="2">2</option><option value="3">3</option>
          </select></label>
      </div>
      <table className="ed-table ed-comp-stages">
        <thead><tr><th>Runde</th><th>Name</th><th>Art</th><th>Spiele</th><th>Termine (nur Anzeige)</th></tr></thead>
        <tbody>
          {base.stages.map((s) => (
            <tr key={s.key} data-stage={s.key}>
              <td><code>{s.key}</code></td>
              <td><input className="ed-in" defaultValue={names[s.key] ?? ''} placeholder={s.name} onBlur={(e) => setName(s.key, e.target.value, s.name)} /></td>
              <td>{KIND[s.kind]}</td>
              <td>{s.kind === 'ko'
                ? <select className="ed-in" value={legs[s.key] ?? ''} onChange={(e) => setLegs(s.key, e.target.value)}>
                  <option value="">Standard ({s.legs === 2 ? 'Hin/Rück' : 'ein Spiel'})</option><option value="1">ein Spiel</option><option value="2">Hin- und Rückspiel</option>
                </select>
                : <span className="ed-hint">{s.kind === 'groups' ? `${s.groups} × ${s.size}, ${s.rr === 2 ? 'Hin/Rück' : 'einfach'}` : `${s.matches} Spiele, ${s.pots} Töpfe`}</span>}</td>
              <td className="ed-hint">{s.dates.map(md).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ed-comp-ro">
        <span className="ed-badge">nur Anzeige</span>
        <div><b>Teilnehmer der ersten Runde:</b> {base.field} · <b>Wertung:</b> {TIEBREAK[base.tiebreak]} · <b>Spieltag:</b> {base.weekday === 4 ? 'Donnerstag' : 'Mittwoch'}</div>
        {adv.length > 0 && <div><b>Weiterleitungen:</b> {adv.join(' · ')}</div>}
        <div className="ed-hint">Teilnehmerzahl, Gruppen/Ligaphase, Termine und Weiterleitungen hängen in der Engine fest an der Saison (Runden, Lostöpfe, Wechsel zwischen den Wettbewerben) und lassen sich noch nicht sicher ändern. Elfmeterschießen entscheidet jedes K.-o.-Spiel ohne Sieger.</div>
      </div>
    </div>
  );
}
