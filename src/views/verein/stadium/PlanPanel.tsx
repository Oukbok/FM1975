// =============================================================================
// ENTWURFS-BOX des Planungsmodus „Stadion ausbauen“ (Wunsch Pascal: alle Tribünen
// umplanen, sehen, wie es am Ende aussieht, erst dann bauen). Links in der Szene,
// feste Größe: oben die geplanten Blöcke, darunter Plätze je Kategorie vorher →
// nachher, Kosten/Bauzeit/Wirkung, Einschränkungen während der Bauzeit und die
// Prüfung (Genehmigung, Baustelle, Kasse, Saisonbudget, Bank); unten fest
// Finanzierung, „Verwerfen“ und „Bauen“ (startBlockBuild – ein gemeinsames Projekt).
// Zahlen aus planModel.ts (summarize), nichts wird hier gerechnet.
// =============================================================================
import { useState } from 'react';
import { BLOCK_NAME } from '../../../engine/stadiumBlocks';
import { SEAT_CATS } from '../../../data/seatingCatalog';
import { startBlockBuild } from '../../../game/stadiumGame';
import type { Game } from '../../../game/state';
import type { BlockId, StadiumBlock } from '../../../types';
import Icon from '../../../components/Icon';
import { fmtDM } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';
import { PlanFin, PlanMap, summarize } from './planModel';

const n0 = (v: number) => Math.round(v).toLocaleString('de-DE');
const sign = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(Math.round(v)).toLocaleString('de-DE');
const cls = (v: number) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '');
const fmtMonth = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function PlanPanel({ g, blocks, plan, selected, onPick, onRemove, onClose, onDiscard, onBuilt }: {
  g: Game; blocks: StadiumBlock[]; plan: PlanMap; selected: BlockId | null;
  onPick: (id: BlockId) => void; onRemove: (id: BlockId) => void;
  onClose: () => void; onDiscard: () => void; onBuilt: (text: string) => void;
}) {
  const club = g.clubs[g.managedClubId];
  const [fin, setFin] = useState<PlanFin>('cash');
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const s0 = summarize(g, blocks, plan, fin);
  const canCash = club.finances.balance >= s0.cost;
  const f: PlanFin = fin === 'cash' && !canCash ? 10 : fin; // Konto reicht nicht → Kredit vorwählen
  const s = f === fin ? s0 : summarize(g, blocks, plan, f);
  const n = s.targets.length;
  const pick = (v: PlanFin) => { setFin(v); setConfirm(false); setMsg(null); };
  const build = () => {
    if (!confirm) { setConfirm(true); return; }
    const r = startBlockBuild(g, s.targets, f === 'cash' ? 'cash' : 'loan', f === 'cash' ? 0 : f);
    setConfirm(false);
    if (r.ok) onBuilt(r.text); else setMsg(r.text);
  };
  const cats = SEAT_CATS.filter((c) => (s.capsBefore[c.key] ?? 0) > 0 || (s.capsAfter[c.key] ?? 0) > 0);

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
          <div className="bc-sec-h"><span>Geplante Blöcke{n ? ` (${n})` : ''}<InfoTip k="stadionAusbau" /></span></div>
          {!n && <div className="bc-idle">Klicke Blöcke im Stadion an und stelle Ränge, Platzarten, Dach und Ausstattung ein. Die Szene zeigt sofort, wie das Stadion danach aussieht.</div>}
          {!!n && <div className="spl-list">
            {s.rows.map(({ t, add, cost, bad }) => (
              <div key={t.id} className={`spl-row ${selected === t.id ? 'on' : ''} ${bad ? 'bad' : ''}`} data-plan={t.id}>
                <button className="spl-name" onClick={() => onPick(t.id)}>{BLOCK_NAME[t.id]}</button>
                <span className={`spl-add ${cls(add)}`}>{sign(add)}</span>
                <span className="spl-cost">{fmtDM(cost)}</span>
                <button className="spl-del" onClick={() => onRemove(t.id)} aria-label={`${BLOCK_NAME[t.id]} aus dem Entwurf nehmen`} title="Aus dem Entwurf nehmen"><Icon name="close" size={12} /></button>
              </div>
            ))}
          </div>}
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Plätze je Kategorie<InfoTip k="platzarten" /></span></div>
          <table className="spl-cats">
            <thead><tr><th>Kategorie</th><th>vorher</th><th>nachher</th><th>±</th></tr></thead>
            <tbody>
              {cats.map((c) => {
                const a = s.capsBefore[c.key] ?? 0, b = s.capsAfter[c.key] ?? 0;
                return <tr key={c.key}><td>{c.name}</td><td>{n0(a)}</td><td>{n0(b)}</td><td className={cls(b - a)}>{b === a ? '' : sign(b - a)}</td></tr>;
              })}
              <tr className="spl-sum"><td>Plätze gesamt</td><td>{n0(s.capBefore)}</td><td>{n0(s.capAfter)}</td><td className={cls(s.capAfter - s.capBefore)}>{s.capAfter === s.capBefore ? '' : sign(s.capAfter - s.capBefore)}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Wirkung</span></div>
          <div className="spl-kv">
            <span>Zuschauer erwartet</span><b>{n0(s.before.visitors)} → {n0(s.after.visitors)}</b>
            <span>Eintritt je Spiel</span><b>{fmtDM(s.before.rev)} → {fmtDM(s.after.rev)}</b>
            {s.comfortBefore != null && s.comfortAfter != null && <><span>Komfort / Anspruch</span><b>{Math.round(s.comfortBefore)} → {Math.round(s.comfortAfter)}<small> / {Math.round(s.expect ?? 0)}</small></b></>}
            <span>Fanstimmung</span><b className={cls(s.mood)}>{s.mood ? `${s.mood > 0 ? '+' : ''}${s.mood}` : '±0'}</b>
          </div>
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Während der Bauzeit</span></div>
          <div className="spl-kv">
            <span>Gesperrt</span><b>{n ? `${n0(s.loss)} Plätze` : '–'}</b>
            <span>Kapazität im Bau</span><b>{n ? `${n0(s.capWhile)} Plätze` : '–'}</b>
          </div>
          {n > 1 && <div className="bc-note">Alle Blöcke werden gleichzeitig gebaut: Bauzeit des längsten Blocks plus ein Monat je weiterem Block (höchstens 24), zusammen 5 % günstiger. Je Block ist die Hälfte gesperrt.</div>}
          {s.notes.map((t) => <div key={t} className="bc-note">{t}</div>)}
        </section>

        <section className="bc-sec">
          <div className="bc-sec-h"><span>Prüfung</span></div>
          <div className="spl-checks">
            {s.checks.filter((c) => c.relevant).map((c) => (
              <div key={c.key} className={`spl-check ${!n ? 'idle' : c.ok ? 'ok' : 'bad'}`} data-check={c.key}>
                <Icon name={c.ok || !n ? 'check' : 'close'} size={14} />
                <span><b>{c.label}</b><small>{n ? c.text : '–'}</small></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="bc-foot">
        <div className="bc-cost">
          <div><span>Kosten</span><b>{n ? fmtDM(s.cost) : '–'}</b></div>
          <div><span>Bauzeit</span><b>{n ? `${s.months} Mon.` : '–'}</b></div>
          <div><span>Fertig</span><b>{n ? fmtMonth(s.finish) : '–'}</b></div>
        </div>
        <div className="bc-fin" role="radiogroup" aria-label="Finanzierung">
          <button className={f === 'cash' ? 'on' : ''} disabled={!canCash || !n} onClick={() => pick('cash')}><b>Bar</b><small>{!n ? 'aus dem Kontostand' : canCash ? 'aus dem Kontostand' : 'Konto reicht nicht'}</small></button>
          {([10, 20] as const).map((y) => (
            <button key={y} className={f === y ? 'on' : ''} disabled={!n} onClick={() => pick(y)}><b>Kredit {y} J.</b><small>{n ? `${fmtDM(s.monthly(y))}/Mon.` : '–'}</small></button>
          ))}
        </div>
        <div className="bc-go">
          <button className="bc-reset" disabled={!n} onClick={onDiscard}>Verwerfen</button>
          <button className={`b3 b3-primary bc-build ${confirm ? 'on' : ''}`} disabled={!!s.blocker} onClick={build}>
            {confirm ? 'Ja, jetzt bauen' : n > 1 ? `Bauen (${n} Blöcke)` : 'Bauen'}
          </button>
        </div>
        <div className={`bc-fine ${msg || (n && s.blocker) ? 'neg' : ''}`}>{msg ?? (!n ? 'Noch ist nichts geplant.' : s.blocker
          ? `Bauen nicht möglich – siehe Prüfung: ${s.checks.find((c) => c.relevant && !c.ok)?.label ?? 'Genehmigung'}.`
          : `Zins derzeit ${(s.rate * 100).toFixed(1).replace('.', ',')} % p. a. · Nachfrage geschätzt`)}</div>
      </footer>
    </div>
  );
}
