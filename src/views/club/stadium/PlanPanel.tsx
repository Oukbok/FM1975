// =============================================================================
// ENTWURFS-BOX des Planungsmodus „Stadion ausbauen“ (Wunsch Pascal: alle Tribünen
// umplanen, sehen, wie es am Ende aussieht, erst dann bauen). Links in der Szene,
// feste Größe (breit, damit alles deutlich lesbar ist): geplante Blöcke, Plätze je
// Kategorie vorher → nachher mit Zuschauern eines Durchschnittsspiels, Ausstattung
// (Anzeigetafel, Banden, Laufbahn), Fans im Stadion (Gästeblock, Fankurve – sofort),
// Wirkung (nur Stadion-Komfort, das Umfeld steht auf dem Vereinsgelände), Bauablauf
// (Etappen, Ausweichstadion, gleichzeitig) mit Einschränkungen und Prüfung; unten
// fest Finanzierung, „Verwerfen“ und „Bauen“ (startStadiumBuild – ein Projekt).
// Zahlen aus planModel.ts (summarize), nichts wird hier gerechnet.
// =============================================================================
import { useState } from 'react';
import { BLOCK_NAME } from '../../../engine/stadiumBlocks';
import { SEAT_CATS } from '../../../data/seatingCatalog';
import { yearOf } from '../../../engine/economy';
import type { StadiumExtras } from '../../../engine/stadiumExtras';
import { BUILD_MODES, startStadiumBuild, type BuildMode } from '../../../game/stadiumBuild';
import { nominalCost } from '../../../game/stadiumGame';
import type { Game } from '../../../game/state';
import type { BlockId, StadiumBlock } from '../../../types';
import Icon from '../../../components/Icon';
import { fmtDM } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';
import { PlanFin, PlanMap, summarize } from './planModel';
import { PlanExtras } from './PlanExtras';
import { PlanFans } from './PlanFans';

const n0 = (v: number) => Math.round(v).toLocaleString('de-DE');
const sign = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(Math.round(v)).toLocaleString('de-DE');
const cls = (v: number) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '');
const fmtMonth = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : 0);

export function PlanPanel({ g, blocks, applied, plan, selected, extras, curExtras, setExtras, mode, setMode, onPick, onRemove, onClose, onDiscard, onBuilt, onChange }: {
  g: Game; blocks: StadiumBlock[]; applied: StadiumBlock[]; plan: PlanMap; selected: BlockId | null;
  extras: StadiumExtras | null; curExtras: StadiumExtras; setExtras: (x: StadiumExtras | null) => void;
  mode: BuildMode; setMode: (m: BuildMode) => void;
  onPick: (id: BlockId) => void; onRemove: (id: BlockId) => void;
  onClose: () => void; onDiscard: () => void; onBuilt: (text: string) => void; onChange: () => void;
}) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const [fin, setFin] = useState<PlanFin>('cash');
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const s0 = summarize(g, blocks, plan, fin, extras, mode);
  const canCash = club.finances.balance >= s0.cost;
  const f: PlanFin = fin === 'cash' && !canCash ? 10 : fin; // Konto reicht nicht → Kredit vorwählen
  const s = f === fin ? s0 : summarize(g, blocks, plan, f, extras, mode);
  const n = s.targets.length;
  const any = s.build.changed;
  const pick = (v: PlanFin) => { setFin(v); setConfirm(false); setMsg(null); };
  const build = () => {
    if (!confirm) { setConfirm(true); return; }
    const r = startStadiumBuild(g, s.targets, extras, mode, f === 'cash' ? 'cash' : 'loan', f === 'cash' ? 0 : f);
    setConfirm(false);
    if (r.ok) onBuilt(r.text); else setMsg(r.text);
  };
  const cats = SEAT_CATS.filter((c) => (s.capsBefore[c.key] ?? 0) > 0 || (s.capsAfter[c.key] ?? 0) > 0 || (c.key === 'gast' && (s.gameCaps.gast ?? 0) > 0));
  const topP = pct(s.topVisitors, s.avgVisitors), lowP = pct(s.lowVisitors, s.avgVisitors);
  const est = `Ein Ligaspiel gegen einen Gegner mit durchschnittlichem Ruf, trockenes Herbstwetter, deine heutigen Preise. Gegen den Topgegner der Liga kämen etwa ${topP >= 0 ? '+' : ''}${topP} % (${n0(s.topVisitors)}), gegen den schwächsten Gegner ${lowP} % (${n0(s.lowVisitors)}). Wo eine Kategorie voll ist, begrenzt die Kapazität.`;
  const exChanged = !!s.build.ex;

  return (
    <div className="spl" onClick={(e) => e.stopPropagation()}>
      <header className="bc-head">
        <div className="bc-title">
          <b>Stadion ausbauen</b>
          <span>Entwurf · noch nichts gebaut oder bezahlt</span>
        </div>
        <button className="bc-x" onClick={onClose} aria-label="Planung schließen" title="Planung schließen – der Entwurf bleibt">×</button>
      </header>

      <div className="spl-scroll">
        <section className="bc-sec">
          <div className="bc-sec-h"><span>Geplant{n || exChanged ? ` (${n + (exChanged ? 1 : 0)})` : ''}<InfoTip k="stadionAusbau" /></span></div>
          {!n && !exChanged && <div className="bc-idle">Klicke Blöcke im Stadion an und stelle Ränge, Platzarten, Dach und Ausstattung ein. Die Szene zeigt sofort, wie das Stadion danach aussieht.</div>}
          {(!!n || exChanged) && <div className="spl-list">
            {s.rows.map(({ t, add, cost, bad }) => (
              <div key={t.id} className={`spl-row ${selected === t.id ? 'on' : ''} ${bad ? 'bad' : ''}`} data-plan={t.id}>
                <button className="spl-name" onClick={() => onPick(t.id)}>{BLOCK_NAME[t.id]}</button>
                <span className={`spl-add ${cls(add)}`}>{sign(add)}</span>
                <span className="spl-cost">{fmtDM(cost)}</span>
                <button className="spl-del" onClick={() => onRemove(t.id)} aria-label={`${BLOCK_NAME[t.id]} aus dem Entwurf nehmen`} title="Aus dem Entwurf nehmen"><Icon name="close" size={12} /></button>
              </div>
            ))}
            {exChanged && <div className="spl-row" data-plan="extras">
              <span className="spl-name">Ausstattung</span><span className="spl-add">–</span>
              <span className="spl-cost">{fmtDM(nominalCost(s.build.ex!.costBase, year))}</span>
              <button className="spl-del" onClick={() => setExtras(null)} aria-label="Ausstattung aus dem Entwurf nehmen" title="Aus dem Entwurf nehmen"><Icon name="close" size={12} /></button>
            </div>}
          </div>}
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Plätze je Kategorie<InfoTip k="platzarten" /></span></div>
          <table className="spl-cats">
            <thead><tr><th>Kategorie</th><th>vorher</th><th>nachher</th><th>±</th><th>Ø Spiel<InfoTip title="Zuschauer bei einem Durchschnittsspiel" text={est} /></th></tr></thead>
            <tbody>
              {cats.map((c) => {
                const a = s.capsBefore[c.key] ?? 0, b = s.capsAfter[c.key] ?? 0;
                const cap = s.gameCaps[c.key] ?? 0, sold = s.avgSold[c.key] ?? 0;
                return <tr key={c.key}><td>{c.name}</td><td>{c.key === 'gast' ? '–' : n0(a)}</td><td>{c.key === 'gast' ? '–' : n0(b)}</td><td className={cls(b - a)}>{b === a ? '' : sign(b - a)}</td>
                  <td className={`spl-est ${cap > 0 && sold >= cap - 1 ? 'full' : ''}`}>{n0(sold)}{c.key === 'loge' ? '' : cap > 0 ? <small> / {n0(cap)}</small> : null}</td></tr>;
              })}
              <tr className="spl-sum"><td>Plätze gesamt</td><td>{n0(s.capBefore)}</td><td>{n0(s.capAfter)}</td><td className={cls(s.capAfter - s.capBefore)}>{s.capAfter === s.capBefore ? '' : sign(s.capAfter - s.capBefore)}</td><td className="spl-est">{n0(s.avgVisitors)}</td></tr>
            </tbody>
          </table>
          <div className="spl-estline">Topspiel {topP >= 0 ? '+' : ''}{topP} % · schwacher Gegner {lowP} %</div>
        </section>

        <PlanExtras x={extras ?? curExtras} cur={curExtras} year={year} blocks={applied} onChange={(x) => setExtras(x)} />

        <PlanFans g={g} year={year} onChange={onChange} />

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Wirkung</span></div>
          <div className="spl-kv">
            <span>Zuschauer Ø Spiel</span><b>{n0(s.before.visitors)} → {n0(s.after.visitors)}</b>
            <span>Eintritt je Spiel</span><b>{fmtDM(s.before.rev)} → {fmtDM(s.after.rev)}</b>
            {s.insideBefore != null && s.insideAfter != null && <><span>Stadion-Komfort<InfoTip k="stadionKomfortInnen" /></span><b className={cls(Math.round(s.insideAfter) - Math.round(s.insideBefore))}>{Math.round(s.insideBefore)} → {Math.round(s.insideAfter)}<small> / max. {Math.round(s.insideMax ?? 0)}</small></b></>}
            <span>Fanstimmung</span><b className={cls(s.mood)}>{s.mood ? `${s.mood > 0 ? '+' : ''}${s.mood.toLocaleString('de-DE')}` : '±0'}</b>
          </div>
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Bauablauf<InfoTip k="stadionBauablauf" /></span></div>
          <div className="spl-modes" role="radiogroup" aria-label="Bauablauf">
            {BUILD_MODES.map((m) => (
              <button key={m.id} className={mode === m.id ? 'on' : ''} onClick={() => { setMode(m.id); setConfirm(false); }}><b>{m.name}</b><small>{m.text}</small></button>
            ))}
          </div>
          <div className="spl-kv">
            <span>{mode === 'away' ? 'Ausweichstadion' : mode === 'stages' ? 'Gesperrt je Etappe' : 'Gesperrt'}</span>
            <b>{!any ? '–' : mode === 'away' && s.build.away ? s.build.away.name : `bis ${n0(s.loss)} Plätze`}</b>
            <span>Plätze im Bau</span><b>{any ? `${n0(s.capWhile)} (${Math.round((s.capWhile / Math.max(1, s.capBefore)) * 100)} %)` : '–'}</b>
            {mode === 'stages' && s.build.stages.length > 0 && <><span>Etappen</span><b>{s.build.stages.map((x) => `${x.name} ${x.months} Mon.`).join(' → ')}</b></>}
          </div>
          {s.notes.map((t) => <div key={t} className="bc-note">{t}</div>)}
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Prüfung</span></div>
          <div className="spl-checks">
            {s.checks.filter((c) => c.relevant).map((c) => (
              <div key={c.key} className={`spl-check ${!any ? 'idle' : c.ok ? 'ok' : 'bad'}`} data-check={c.key}>
                <Icon name={c.ok || !any ? 'check' : 'close'} size={14} />
                <span><b>{c.label}</b><small>{any ? c.text : '–'}</small></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="bc-foot">
        <div className="bc-cost">
          <div><span>Kosten</span><b>{any ? fmtDM(s.cost) : '–'}</b></div>
          <div><span>Bauzeit</span><b>{any ? `${s.months} Mon.` : '–'}</b></div>
          <div><span>Fertig</span><b>{any ? fmtMonth(s.finish) : '–'}</b></div>
        </div>
        <div className="bc-fin" role="radiogroup" aria-label="Finanzierung">
          <button className={f === 'cash' ? 'on' : ''} disabled={!canCash || !any} onClick={() => pick('cash')}><b>Bar</b><small>{!any ? 'aus dem Kontostand' : canCash ? 'aus dem Kontostand' : 'Konto reicht nicht'}</small></button>
          {([10, 20] as const).map((y) => (
            <button key={y} className={f === y ? 'on' : ''} disabled={!any} onClick={() => pick(y)}><b>Kredit {y} J.</b><small>{any ? `${fmtDM(s.monthly(y))}/Mon.` : '–'}</small></button>
          ))}
        </div>
        <div className="bc-go">
          <button className="bc-reset" disabled={!any} onClick={onDiscard}>Verwerfen</button>
          <button className={`b3 b3-primary bc-build ${confirm ? 'on' : ''}`} disabled={!!s.blocker} onClick={build}>
            {confirm ? 'Ja, jetzt bauen' : n + (exChanged ? 1 : 0) > 1 ? `Bauen (${n ? `${n} Block${n > 1 ? 's' : ''}` : ''}${n && exChanged ? ' + ' : ''}${exChanged ? 'Ausstattung' : ''})` : 'Bauen'}
          </button>
        </div>
        <div className={`bc-fine ${msg || (any && s.blocker) ? 'neg' : ''}`}>{msg ?? (!any ? 'Noch ist nichts geplant.' : s.blocker
          ? `Bauen nicht möglich – siehe Prüfung: ${s.checks.find((c) => c.relevant && !c.ok)?.label ?? 'Genehmigung'}.`
          : `Zins derzeit ${(s.rate * 100).toFixed(1).replace('.', ',')} % p. a. · Zuschauer geschätzt`)}</div>
      </footer>
    </div>
  );
}
