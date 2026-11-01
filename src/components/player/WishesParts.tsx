// =============================================================================
// Bausteine „Was ihm wichtig ist“: Interesse-Ampel, Gründe, Charakterzüge,
// Wunsch-Versprechen. Genutzt im Spielerprofil (WishesTab) und in der
// Transferverhandlung (views/transfers/TransferTalkModal.tsx).
// Alles, was der Spieler verdeckt denkt, wird je nach Kenntnis (Scouting,
// laufende Gespräche) nur ungefähr gezeigt.
// =============================================================================
import { PROMISES, PromiseType } from '../../engine/transferMarket';
import { interestText } from '../../engine/playerWishes';
import { PlayerPersona, TRAITS, TRAIT_LABEL, traitBand } from '../../engine/persona';

/** Ampel mit drei Lichtern (rot, gelb, grün) plus Text. */
export function InterestLight({ score, knowledge }: { score: number; knowledge: number }) {
  const blur = knowledge < 0.35;
  const it = interestText(score);
  const lit = blur ? -1 : it.level === 0 ? 0 : it.level === 1 ? 1 : 2;
  return (
    <div className="wish-light">
      <span className="wish-lamps" aria-hidden>
        <i className={lit === 0 ? 'on red' : ''} /><i className={lit === 1 ? 'on yellow' : ''} /><i className={lit === 2 ? 'on green' : ''} />
      </span>
      <span className="wish-light-text">{blur ? 'Noch unklar – dein Scout weiß zu wenig' : it.text}</span>
    </div>
  );
}

/** Gründe für und gegen (Richtung immer sichtbar, Gewicht nur bei guter Kenntnis). */
export function ReasonList({ reasons, knowledge, max = 6 }: { reasons: { label: string; value: number }[]; knowledge: number; max?: number }) {
  if (!reasons.length) return <div className="dnote">Nichts Auffälliges.</div>;
  const shown = reasons.slice(0, knowledge >= 0.5 ? max : Math.max(2, Math.round(max / 2)));
  return (
    <ul className="wish-reasons">
      {shown.map((r) => {
        const strong = Math.abs(r.value) >= 8;
        return (
          <li key={r.label} className={r.value >= 0 ? 'pro' : 'con'}>
            <span className="wish-sign">{r.value >= 0 ? '+' : '−'}</span>
            <span className="grow">{r.label}</span>
            {knowledge >= 0.6 && <span className="wish-weight">{strong ? 'stark' : Math.abs(r.value) >= 4 ? 'spürbar' : 'leicht'}</span>}
          </li>
        );
      })}
      {shown.length < reasons.length && <li className="wish-more">weitere Gründe kennt dein Scout noch nicht</li>}
    </ul>
  );
}

export function importanceText(w: number): string {
  return w >= 8 ? 'sehr wichtig' : w >= 5 ? 'wichtig' : 'nebensächlich';
}

/** Drei Punkte für die Wichtigkeit (gefüllt nach Gewicht). */
export function ImportanceDots({ weight, known }: { weight: number; known: boolean }) {
  const n = !known ? 0 : weight >= 8 ? 3 : weight >= 5 ? 2 : 1;
  return <span className="wish-dots" title={known ? importanceText(weight) : 'unbekannt'}>{[0, 1, 2].map((i) => <i key={i} className={i < n ? 'on' : ''} />)}</span>;
}

/** Wunsch-Versprechen als Liste. */
export function WishList({ wishes, known, max = 6 }: { wishes: [PromiseType, number][]; known: boolean; max?: number }) {
  if (!known) return <div className="dnote">Was ihm wirklich wichtig ist, erfährst du im Gespräch – oder mit einem besseren Scout.</div>;
  return (
    <ul className="wish-list">
      {wishes.slice(0, max).map(([t, w]) => (
        <li key={t}><span className="grow">{PROMISES[t].label}</span><ImportanceDots weight={w} known /><span className="wish-imp">{importanceText(w)}</span></li>
      ))}
    </ul>
  );
}

/** Charakterzüge als ruhige Spannenbalken. */
export function TraitBands({ pe, knowledge, seed }: { pe: PlayerPersona; knowledge: number; seed: string }) {
  return (
    <div className="wish-traits">
      {TRAITS.map((t) => {
        const b = traitBand(pe[t], knowledge, `${seed}|${t}`);
        return (
          <div key={t} className="wish-trait">
            <span className="wish-trait-lbl">{TRAIT_LABEL[t]}</span>
            <span className="wish-trait-track">{b.text !== 'unbekannt' && <span className="wish-trait-span" style={{ left: `${b.lo}%`, width: `${Math.max(4, b.hi - b.lo)}%` }} />}</span>
            <span className="wish-trait-val">{b.text}</span>
          </div>
        );
      })}
    </div>
  );
}
