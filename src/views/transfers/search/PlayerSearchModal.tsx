// =============================================================================
// SPIELER SUCHEN — großes Popup aus dem Transfermarkt. Spalten: Allgemein +
// Position | Herkunft, Fähigkeiten, Eingespieltheit | Suche laden/speichern,
// Finanzen, Suchgebiet. Unten Zurücksetzen / Abbrechen / Suchen. Das Ergebnis
// zeigt der Transfermarkt. Logik game/playerSearch.ts, CSS 28-transfer3.css (.ps-*).
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { POSITION_NAMES_DE } from '../../../engine/positions';
import type { Game } from '../../../game/state';
import {
  defaultCriteria, loadSavedSearches, MAX_ATTRS, originKeys, runSearch, searchOptions, searchPool, storeSavedSearches,
  type SavedSearch, type SearchCriteria, type Side,
} from '../../../game/playerSearch';
import type { AttributeKey, Position } from '../../../types';
import { InfoTip } from '../../../ui/InfoTip';
import { ATTR_DE } from '../../../components/player/shared';
import { fmtPrice, fmtWage, wageHead } from '../../../ui/format';
import Select from '../../../ui/Select';

const POSITIONS: Position[] = ['TW', 'LIB', 'IV', 'LV', 'RV', 'DM', 'ZM', 'LM', 'RM', 'OM', 'LA', 'RA', 'HS', 'MS'];
const GROUP_OPTS = [{ v: 'GK', l: 'Torwart (alle)' }, { v: 'DEF', l: 'Abwehr (alle)' }, { v: 'MID', l: 'Mittelfeld (alle)' }, { v: 'ATT', l: 'Angriff (alle)' }];
const STARS = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const VALUES = [0, 10_000, 25_000, 50_000, 100_000, 200_000, 350_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_500_000, 5_000_000];
const WAGES = [0, 250, 500, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000, 20000];
const ATTR_KEYS = (Object.keys(ATTR_DE) as AttributeKey[]).filter((k) => k !== 'fitness').sort((a, b) => ATTR_DE[a].localeCompare(ATTR_DE[b], 'de'));

function Num({ v, min, max, onChange, label }: { v: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return <input type="number" className="ps-num" aria-label={label} min={min} max={max} value={v}
    onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.round(n)))); }} />;
}
function Row({ label, info, children }: { label: string; info?: 'potenzial' | 'marktwert'; children: React.ReactNode }) {
  return <div className="ps-row"><span>{label}{info && <InfoTip k={info} />}</span><div>{children}</div></div>;
}
function Pair({ a, b }: { a: React.ReactNode; b: React.ReactNode }) {
  return <div className="ps-pair"><span>Min.</span>{a}<span>Max.</span>{b}</div>;
}
function Chk({ on, label, set }: { on: boolean; label: string; set: (v: boolean) => void }) {
  return <label className="ps-chk"><input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} /> {label}</label>;
}

export function PlayerSearchModal({ g, initial, onSearch, onClose }: {
  g: Game; initial?: SearchCriteria | null; onSearch: (c: SearchCriteria) => void; onClose: () => void;
}) {
  const [c, setC] = useState<SearchCriteria>(initial ?? defaultCriteria());
  const set = <K extends keyof SearchCriteria>(k: K, v: SearchCriteria[K]) => setC((x) => ({ ...x, [k]: v }));
  const opt = searchOptions(g);
  const [saved, setSaved] = useState<SavedSearch[]>(() => loadSavedSearches());
  const [pick, setPick] = useState('');
  const [saveName, setSaveName] = useState('');

  const pool = useMemo(() => searchPool(g), [g]);
  const nats = useMemo(() => {
    const n = new Map<string, number>();
    for (const p of pool) n.set(p.nationality || 'GER', (n.get(p.nationality || 'GER') ?? 0) + 1);
    return [...n.entries()].filter(([k]) => k !== 'GER').sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [pool]);
  const origins = useMemo(() => {
    const regions = new Set<string>();
    for (const p of pool) for (const k of originKeys(g, p)) if (!k.startsWith('nat:')) regions.add(k);
    return [...regions].sort((a, b) => a.localeCompare(b, 'de'));
  }, [g, pool]);
  const count = useMemo(() => runSearch(g, { ...c, realistic: false }, 9999).length, [g, c]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setOrigin = (i: number, v: string) => { const o = [...c.origins]; o[i] = v; set('origins', o.filter((x, j) => x || j < i)); };
  const setAttr = (i: number, k: AttributeKey | '', min?: number) => {
    const a = [...c.attrs];
    if (!k) a.splice(i, 1); else a[i] = { k, min: min ?? a[i]?.min ?? 60 };
    set('attrs', a.slice(0, MAX_ATTRS));
  };
  const toggleSide = (s: Side, on: boolean) => set('sides', on ? [...c.sides, s] : c.sides.filter((x) => x !== s));
  const doSave = () => {
    const name = saveName.trim();
    if (!name) return;
    const list = [...saved.filter((s) => s.name !== name), { name, c }];
    setSaved(list); storeSavedSearches(list); setPick(name); setSaveName('');
  };
  const doDelete = () => { const list = saved.filter((s) => s.name !== pick); setSaved(list); storeSavedSearches(list); setPick(''); };
  const doLoad = (name: string) => { setPick(name); const s = saved.find((x) => x.name === name); if (s) setC(s.c); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ps-panel" role="dialog" aria-label="Spieler suchen" onClick={(e) => e.stopPropagation()}>
        <div className="ps-head">
          <div className="tw-title">Spieler suchen</div><InfoTip k="spielersuche" />
          <span className="tw-sp" />
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="ps-body">
          {/* ---------------- Spalte 1 */}
          <div className="ps-col">
            <section className="ps-sec">
              <div className="ps-sec-h">Allgemein</div>
              <Row label="Name"><input type="text" value={c.name} placeholder="Name enthält …" onChange={(e) => set('name', e.target.value)} /></Row>
              <Row label="Nationalität">
                <Select value={c.nat} onChange={(v) => set('nat', v)}>
                  <option value="">Alle</option><option value="GER">Deutschland</option><option value="foreign">Alle Ausländer</option>
                  {nats.map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Row>
              <Row label="Alter"><Pair a={<Num label="Alter min." v={c.ageMin} min={15} max={45} onChange={(v) => set('ageMin', v)} />} b={<Num label="Alter max." v={c.ageMax} min={15} max={45} onChange={(v) => set('ageMax', v)} />} /></Row>
              <Row label="Stärke"><Pair a={<Num label="Stärke min." v={c.ovMin} min={0} max={99} onChange={(v) => set('ovMin', v)} />} b={<Num label="Stärke max." v={c.ovMax} min={0} max={99} onChange={(v) => set('ovMax', v)} />} /></Row>
              <Row label="Potenzial" info="potenzial">
                <Pair a={<Select value={c.potMin} onChange={(v) => set('potMin', Number(v))}>{STARS.map((s) => <option key={s} value={s}>{s ? `${s.toLocaleString('de-DE')} ★` : 'alle'}</option>)}</Select>}
                  b={<Select value={c.potMax} onChange={(v) => set('potMax', Number(v))}>{STARS.filter((s) => s > 0).map((s) => <option key={s} value={s}>{s.toLocaleString('de-DE')} ★</option>)}</Select>} />
              </Row>
              <Row label="Form ab"><Num label="Form min." v={c.formMin} min={0} max={100} onChange={(v) => set('formMin', v)} /></Row>
              <Row label="Erfahrung ab"><Num label="Erfahrung min." v={c.expMin} min={0} max={99} onChange={(v) => set('expMin', v)} /></Row>
              <Row label="Starker Fuß">
                <Select value={c.foot} onChange={(v) => set('foot', v as SearchCriteria['foot'])}>
                  <option value="">Egal</option><option value="left">Links</option><option value="right">Rechts</option><option value="both">Beidfüßig</option>
                </Select>
              </Row>
              <Row label="Größe ab (cm)"><Num label="Größe min." v={c.heightMin} min={0} max={210} onChange={(v) => set('heightMin', v)} /></Row>
              <div className="ps-checks"><Chk on={c.notInjured} label="Darf nicht verletzt sein" set={(v) => set('notInjured', v)} /></div>
            </section>
            <section className="ps-sec">
              <div className="ps-sec-h">Position</div>
              <Row label="Position">
                <Select value={c.pos} onChange={(v) => set('pos', v)}>
                  <option value="">Alle</option>
                  {GROUP_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  {POSITIONS.map((p) => <option key={p} value={p}>{p} – {POSITION_NAMES_DE[p]}</option>)}
                </Select>
              </Row>
              <Row label="Seite">
                <div className="ps-checks">
                  <Chk on={c.sides.includes('L')} label="Links" set={(v) => toggleSide('L', v)} />
                  <Chk on={c.sides.includes('C')} label="Zentrum" set={(v) => toggleSide('C', v)} />
                  <Chk on={c.sides.includes('R')} label="Rechts" set={(v) => toggleSide('R', v)} />
                </div>
              </Row>
              <div className="ps-checks"><Chk on={c.bestOnly} label="Nur beste Position (Stammposition)" set={(v) => set('bestOnly', v)} /></div>
            </section>
          </div>

          {/* ---------------- Spalte 2 */}
          <div className="ps-col">
            <section className="ps-sec">
              <div className="ps-sec-h">Herkunft</div>
              {[0, 1, 2].map((i) => (i <= c.origins.length) && (
                <Select key={i} value={c.origins[i] ?? ''} onChange={(v) => setOrigin(i, v)}>
                  <option value="">–</option>
                  <optgroup label="Heimatregion">{origins.map((o) => <option key={o} value={o}>{o}</option>)}</optgroup>
                  <optgroup label="Land"><option value="nat:GER">Deutschland</option>{nats.map((n) => <option key={n} value={`nat:${n}`}>{n}</option>)}</optgroup>
                </Select>
              ))}
              <div className="ps-hint">Heimatregion = Raum seines Heimat- bzw. Ausbildungsvereins. Mehrere Angaben gelten als „oder“.</div>
            </section>
            <section className="ps-sec">
              <div className="ps-sec-h">Fähigkeiten</div>
              {[...c.attrs, ...(c.attrs.length < MAX_ATTRS ? [null] : [])].map((a, i) => (
                <div key={i} className="ps-attr">
                  <Select value={a?.k ?? ''} onChange={(v) => setAttr(i, v as AttributeKey | '')}>
                    <option value="">{a ? 'entfernen' : 'Fähigkeit wählen …'}</option>
                    {ATTR_KEYS.map((k) => <option key={k} value={k}>{ATTR_DE[k]}</option>)}
                  </Select>
                  {a ? <Num label={`${ATTR_DE[a.k]} min.`} v={a.min} min={1} max={99} onChange={(v) => setAttr(i, a.k, v)} /> : <span className="ps-hint">Min. Wert</span>}
                </div>
              ))}
              <div className="ps-hint">Bis zu vier Fähigkeiten mit Mindestwert – wie im Spielerprofil angezeigt.</div>
            </section>
            <section className="ps-sec">
              <div className="ps-sec-h">Eingespieltheit</div>
              <div className="ps-attr">
                <Select value={c.famPos} onChange={(v) => set('famPos', v as Position | '')}>
                  <option value="">Position wählen …</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p} – {POSITION_NAMES_DE[p]}</option>)}
                </Select>
                <Num label="Vertrautheit min." v={c.famMin} min={0} max={100} onChange={(v) => set('famMin', v)} />
              </div>
              <div className="ps-hint">Positionsvertrautheit 0–100: ab 90 natürlich, ab 75 gut, ab 50 ausreichend.</div>
            </section>
          </div>

          {/* ---------------- Spalte 3 */}
          <div className="ps-col">
            <section className="ps-save">
              <div className="ps-sec-h">Suche laden/speichern</div>
              <div className="ps-save-row">
                <Select value={pick} onChange={(v) => doLoad(v)}>
                  <option value="">{saved.length ? 'Gespeicherte Suche laden …' : 'Keine gespeicherten Suchen'}</option>
                  {saved.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                </Select>
                <button className="btn btn-sm btn-ghost" disabled={!pick} onClick={doDelete}>Löschen</button>
              </div>
              <div className="ps-save-row">
                <input type="text" value={saveName} placeholder="Name der Suche" onChange={(e) => setSaveName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSave(); }} />
                <button className="btn btn-sm" disabled={!saveName.trim()} onClick={doSave}>Speichern</button>
              </div>
            </section>
            <section className="ps-sec">
              <div className="ps-sec-h">Finanzen</div>
              <Row label="Marktwert" info="marktwert">
                <Pair a={<Select value={c.valueMin} onChange={(v) => set('valueMin', Number(v))}>{VALUES.map((v) => <option key={v} value={v}>{v ? fmtPrice(v) : 'alle'}</option>)}</Select>}
                  b={<Select value={c.valueMax} onChange={(v) => set('valueMax', Number(v))}>{VALUES.map((v) => <option key={v} value={v}>{v ? fmtPrice(v) : 'alle'}</option>)}</Select>} />
              </Row>
              <Row label={wageHead()}>
                <Pair a={<Select value={c.wageMin} onChange={(v) => set('wageMin', Number(v))}>{WAGES.map((v) => <option key={v} value={v}>{v ? fmtWage(v, { unit: false }) : 'alle'}</option>)}</Select>}
                  b={<Select value={c.wageMax} onChange={(v) => set('wageMax', Number(v))}>{WAGES.map((v) => <option key={v} value={v}>{v ? fmtWage(v, { unit: false }) : 'alle'}</option>)}</Select>} />
              </Row>
              <Row label="Vertragsstatus">
                <Select value={c.contract} onChange={(v) => set('contract', v as SearchCriteria['contract'])}>
                  <option value="">Alle</option>
                  <option value="expiring">{opt.bosman ? 'Läuft aus (≤ 12 Monate, dann ablösefrei)' : 'Läuft aus (≤ 12 Monate)'}</option>
                  <option value="long">Langfristig gebunden (&gt; 2 Jahre)</option>
                </Select>
              </Row>
              <Row label="Transferstatus">
                <Select value={c.transfer} onChange={(v) => set('transfer', v as SearchCriteria['transfer'])}>
                  <option value="">Alle</option><option value="listed">Auf der Transferliste</option><option value="available">Abgabebereit (Liste oder unzufrieden)</option>
                </Select>
              </Row>
              <div className="ps-checks">
                {opt.releaseClause && <Chk on={c.releaseClause} label="Ausstiegsklausel" set={(v) => set('releaseClause', v)} />}
                <span className="ps-chk"><Chk on={c.realistic} label="Nur realistische Transfers" set={(v) => set('realistic', v)} /><InfoTip k="realistisch" /></span>
                {opt.buyBack && <Chk on={c.buyBack} label="Eigener Verein besitzt Rückkaufoption" set={(v) => set('buyBack', v)} />}
              </div>
            </section>
            <section className="ps-sec">
              <div className="ps-sec-h">Suchgebiet</div>
              <Select value={c.area} onChange={(v) => set('area', v as SearchCriteria['area'])}>
                <option value="">Alle Vereine</option>
                <option value="league">{g.leagues?.playerDivision?.name ?? 'Eigene Liga'}</option>
                <option value="lower">Amateure und Unterklasse</option>
              </Select>
              <div className="ps-hint">Ausländische Vereine führt das Spiel ohne Kader – Spieler aus dem Ausland holen die Vereine über Angebote.</div>
            </section>
          </div>
        </div>

        <div className="ps-foot">
          <span className="ps-count">{count} Spieler passen{c.realistic ? ' (vor „realistisch“)' : ''}</span>
          <span className="tw-sp" />
          <button className="btn btn-ghost" onClick={() => { setC(defaultCriteria()); setPick(''); }}>Zurücksetzen</button>
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={() => onSearch(c)}>Suchen</button>
        </div>
      </div>
    </div>
  );
}
