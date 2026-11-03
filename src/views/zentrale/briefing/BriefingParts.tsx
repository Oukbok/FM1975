// =============================================================================
// Saison-Briefing — Bausteine für Popup (BriefingModal) und Archiv (BriefingView)
// =============================================================================
import { useState } from 'react';
import Icon from '../../../components/Icon';
import { topicMeta } from '../../../data/briefings';
import type { BriefingItem, DifferenceToToday } from '../../../data/briefings';
import { formatMoneyShort } from '../../../engine/economy';
import { CHANGE_KIND_META, GameChange, GameChangeKind } from '../../../game/briefingChanges';
import type { BriefingHighlight, BriefingSituation, DifferenceGroup, SeasonBriefing } from '../../../game/seasonBriefing';

/** Die 3–5 wichtigsten Punkte als Karten. */
export function Highlights({ list, compact = false }: { list: BriefingHighlight[]; compact?: boolean }) {
  if (!list.length) return <p className="bf-empty">Für diese Saison liegen noch keine Briefing-Texte vor.</p>;
  return (
    <ol className={`bf-hl ${compact ? 'compact' : ''}`}>
      {list.map((h, i) => (
        <li key={i} className="bf-hl-item">
          <span className="bf-hl-ico"><Icon name={h.icon} size={compact ? 22 : 28} /></span>
          <span className="bf-hl-main">
            <span className="bf-kicker">{h.kicker}</span>
            <span className="bf-hl-title">{h.title}</span>
            <span className="bf-hl-text">{h.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** „Deine Ausgangslage“ als Kennzahlen-Liste. */
export function Situation({ sit, year }: { sit?: BriefingSituation; year: number }) {
  if (!sit) return <p className="bf-empty">Für diese Saison wurde keine Ausgangslage festgehalten.</p>;
  const rows: [string, string, boolean?][] = [
    ['Saisonziel', sit.goal, true],
    ['Liga', sit.league],
    ['Kaderstärke', `Rang ${sit.rank} von ${sit.of}`],
    ['Vertrauen Vorstand', `${sit.confidence} / 100`],
    ['Kontostand', formatMoneyShort(sit.balance, year)],
    ['Transferbudget', formatMoneyShort(sit.transferBudget, year)],
    ['Kader', `${sit.squad} Spieler · Ø ${String(sit.avgAge).replace('.', ',')} Jahre`],
    ['Ø Stärke', String(sit.avgOvr)],
  ];
  if (sit.foreigners > 0) rows.push(['Ausländer', String(sit.foreigners)]);
  if (sit.best) rows.push(['Bester Spieler', `${sit.best.name} (${sit.best.ovr})`]);
  return (
    <div className="bf-sit">
      {rows.map(([k, v, strong]) => (
        <div key={k} className={`bf-sit-row ${strong ? 'strong' : ''}`}><span>{k}</span><b>{v}</b></div>
      ))}
    </div>
  );
}

/** Fußball- bzw. Gesellschaftspunkte als Karten mit Themen-Symbol. */
export function ItemGrid({ items, empty }: { items: BriefingItem[]; empty: string }) {
  if (!items.length) return <p className="bf-empty">{empty}</p>;
  return (
    <div className="bf-items">
      {items.map((it, i) => {
        const m = topicMeta(it.topic);
        return (
          <article key={i} className="bf-item">
            <header><Icon name={m.icon} size={26} /><span className="bf-kicker">{m.label}</span></header>
            <h3>{it.title}</h3>
            <p>{it.text}</p>
            {it.inGame && <div className="bf-ingame"><Icon name="unlock" size={16} /><span><b>Im Spiel:</b> {it.inGame}</span></div>}
          </article>
        );
      })}
    </div>
  );
}

/** Tabelle Damals | Heute, nach Thema gruppiert. */
export function DiffTable({ groups }: { groups: DifferenceGroup[] }) {
  return (
    <div className="bf-diff">
      <div className="bf-diff-head"><span /><span>Damals</span><span>Heute</span></div>
      {groups.map((g) => (
        <section key={g.topic} className="bf-diff-group">
          <h4>{g.label}</h4>
          {g.items.map((d, i) => <DiffRow key={i} d={d} />)}
        </section>
      ))}
    </div>
  );
}

function DiffRow({ d }: { d: DifferenceToToday }) {
  return (
    <div className="bf-diff-row">
      <span className="bf-diff-title">{d.title}<small>{d.from}–{d.to}</small></span>
      <span className="bf-then">{d.then}</span>
      <span className="bf-today">{d.today}</span>
    </div>
  );
}

function DiffList({ title, icon, list, note }: { title: string; icon: string; list: DifferenceToToday[]; note: (d: DifferenceToToday) => string }) {
  if (!list.length) return null;
  return (
    <section className="bf-sec">
      <h4 className="bf-sec-title">{title} <span className="bf-count">{list.length}</span></h4>
      {list.map((d, i) => (
        <div key={i} className="bf-change">
          <Icon name={topicMeta(d.topic).icon} size={22} />
          <div><b>{d.title}</b><p>{note(d)}</p></div>
        </div>
      ))}
    </section>
  );
}

/** Reiter „Damals & heute“: erste Saison komplett, danach die Wechsel + aufklappbarer Rest. */
export function DiffTab({ b }: { b: SeasonBriefing }) {
  const [open, setOpen] = useState(false);
  const total = b.differences.reduce((a, g) => a + g.items.length, 0);
  if (b.first) {
    return total
      ? <><p className="bf-lead">{total} Dinge, die 1975 anders sind als im Fußball von heute (2025/26):</p><DiffTable groups={b.differences} /></>
      : <p className="bf-empty">Keine Unterschiede hinterlegt.</p>;
  }
  const none = !b.ended.length && !b.started.length && !b.lastSeason.length;
  return (
    <>
      {none && <p className="bf-lead">In dieser Saison ändert sich am Abstand zum heutigen Fußball nichts.</p>}
      <DiffList title="Ab jetzt wie heute" icon="hourglass" list={b.ended} note={(d) => `Bisher: ${d.then} Jetzt wie heute: ${d.today}`} />
      <DiffList title="Neu anders als heute" icon="hourglass" list={b.started} note={(d) => `${d.then} Heute: ${d.today}`} />
      <DiffList title="Zum letzten Mal" icon="hourglass" list={b.lastSeason} note={(d) => `${d.then} Ab nächster Saison: ${d.today}`} />
      {total > 0 && (
        <section className="bf-sec">
          <button className="bf-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <span className={`bf-caret ${open ? 'open' : ''}`}>›</span> Noch anders als heute <span className="bf-count">{total}</span>
          </button>
          {open && <DiffTable groups={b.differences} />}
        </section>
      )}
    </>
  );
}

/** Reiter „Neu im Spiel“: automatisch abgeleitete Änderungen, nach Art gruppiert. */
export function ChangesTab({ list, first }: { list: GameChange[]; first: boolean }) {
  if (!list.length) return <p className="bf-empty">Im Spiel selbst ändert sich zu dieser Saison nichts – die Regeln bleiben wie in der Vorsaison.</p>;
  const kinds = [...new Set(list.map((c) => c.kind))] as GameChangeKind[];
  return (
    <>
      <p className="bf-lead">{first ? 'Damit startest du – das gilt zu Spielbeginn im Spiel:' : 'Das ändert sich zu dieser Saison im Spiel:'}</p>
      <div className="bf-changes">
        {kinds.map((k) => (
          <section key={k} className="bf-sec">
            <h4 className="bf-sec-title">{CHANGE_KIND_META[k].label}</h4>
            {list.filter((c) => c.kind === k).map((c, i) => (
              <div key={i} className="bf-change">
                <Icon name={c.icon} size={22} />
                <div>
                  <b>{c.title}</b>
                  <p>{c.text}</p>
                  {c.where && <span className="bf-where">{c.where}</span>}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
