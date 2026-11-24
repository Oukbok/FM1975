import { WIKI_ARTICLES, WIKI_CATEGORIES, WikiArticle, searchWiki } from '../../data/wiki';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import { CHRONICLE_WIKI_ID, ChronicleView, chronEvents, matchChronicle, type TlEvent } from '../stats/ChronicleView';
import type { Screen } from '../../shell/navigation';
import { useEffect, useMemo, useState } from 'react';
import { localMoneyText } from '../../engine/moneyText';
import { _displayYear } from '../../ui/format';

// =============================================================================
// ENTWICKLER-WIKI (durchsuchbar, Kategorien)
// =============================================================================
/**
 * Synthetischer Wiki-Eintrag, der beim Öffnen die interaktive Chronik-Zeitleiste
 * (ChronicleView) rendert statt Markdown. So ist die „Chronik der Epochen" direkt
 * über die Wiki-Kapitelnavigation erreichbar.
 */
export { CHRONICLE_WIKI_ID };

/** Zu allgemeine Stichwörter, die keinen passenden Artikel ergeben. */
const REL_STOP = new Set(['verein', 'vereine', 'liga', 'ligen', 'europa', 'meister', 'welt', 'punkte', 'system', 'leistung', 'krise', 'video',
  'lager', 'halle', 'mark', 'euro', 'stab', 'scout', 'weiter', 'saison', 'trainer', 'medien', 'sponsor', 'runde', 'pokal', 'pause', 'gehalt',
  'transfer', 'lizenz', 'schal', 'streit', 'reform', 'phase', 'trikot']);
const atWordStart = (text: string, k: string) => new RegExp(`(^|[^a-zäöüß0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);

/**
 * Wiki-Artikel zu einem Meilenstein: Stichwörter des Artikels, die als Wortanfang im Titel
 * des Meilensteins stehen (z. B. „Bosman“, „Meisterliga“, „Trainingslager“), höchstens zwei.
 */
function relatedArticles(e: TlEvent): { id: string; title: string }[] {
  const title = e.title.toLowerCase(), desc = e.description.toLowerCase();
  return WIKI_ARTICLES
    .filter((a) => a.category !== 'chronicle')
    .map((a) => {
      const kws = (a.keywords ?? []).map((k) => k.toLowerCase()).filter((k) => k.length >= 4 && !REL_STOP.has(k));
      const t = kws.filter((k) => atWordStart(title, k)).length;
      const d = kws.filter((k) => !atWordStart(title, k) && atWordStart(desc, k)).length;
      return { a, t, score: t * 3 + d };
    })
    .filter((x) => x.t > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 2)
    .map((x) => ({ id: x.a.id, title: x.a.title }));
}

export const CHRONICLE_WIKI_ENTRY: WikiArticle = {
  id: CHRONICLE_WIKI_ID,
  category: 'chronicle',
  title: 'Chronik der Epochen – Historische Zeitleiste',
  keywords: ['chronik', 'epoche', 'epochen', 'zeitleiste', 'meilenstein', 'meilensteine', 'timeline', 'historie', 'geschichte', '3-punkte-regel'],
  body: 'Interaktive Zeitleiste aller historischen Meilensteine von 1975 bis in die 2030er.',
};

export function WikiView({ g, openArticle, onGoto }: { g: Game; openArticle?: string; onGoto?: (s: Screen) => void }) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(openArticle ?? null);
  /** Aufgeklappte Kapitel im Akkordeon links. */
  const [openCats, setOpenCats] = useState<Set<string>>(() => new Set([articleById(openArticle)?.category ?? 'core']));

  // Passt der Chronik-Eintrag zum aktuellen Suchtext? Auch jeder einzelne Meilenstein zählt als Treffer.
  const q = query.trim().toLowerCase();
  const titleHit = CHRONICLE_WIKI_ENTRY.title.toLowerCase().includes(q) || (CHRONICLE_WIKI_ENTRY.keywords ?? []).some((k) => k.includes(q));
  const milestoneHits = q && !titleHit ? matchChronicle(chronEvents(), q).length : 0;
  const chronMatches = !q || titleHit || milestoneHits > 0;
  const relatedMap = useMemo(() => new Map(chronEvents().map((e) => [e.id, relatedArticles(e)])), []);

  // Treffer je Kapitel (Chronik-Zeitleiste als erster Eintrag der Chronik).
  const results = chronMatches ? [CHRONICLE_WIKI_ENTRY, ...searchWiki(query)] : searchWiki(query);
  const byCat = new Map<string, WikiArticle[]>();
  for (const a of results) byCat.set(a.category, [...(byCat.get(a.category) ?? []), a]);

  const open = articleById(openId ?? undefined);
  const shown = open ?? WIKI_CATEGORIES.map((c) => byCat.get(c.id)?.[0]).find(Boolean) ?? null;
  const catTitle = (id: string) => WIKI_CATEGORIES.find((x) => x.id === id)?.title ?? '';

  // Wird ein Artikel von außen geöffnet (Verweis, Chronik, Suche), klappt sein Kapitel auf.
  const shownCat = shown?.category;
  useEffect(() => {
    if (shownCat) setOpenCats((s) => (s.has(shownCat) ? s : new Set(s).add(shownCat)));
    // Neuer Artikel beginnt oben; der gewählte Eintrag links bleibt sichtbar.
    document.querySelector('.wk-article .dbox-body')?.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => document.querySelector('.wk-art.sel')?.scrollIntoView({ block: 'nearest' }));
    return () => cancelAnimationFrame(raf);
  }, [shown?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = (v: string) => {
    setQuery(v);
    setOpenId(null);
    // Bei einer Suche alle Kapitel mit Treffern aufklappen; Suche leeren lässt die Kapitel offen.
    if (!v.trim()) return;
    const hits = new Set(searchWiki(v).map((a) => a.category));
    const lq = v.trim().toLowerCase();
    if (CHRONICLE_WIKI_ENTRY.title.toLowerCase().includes(lq) || (CHRONICLE_WIKI_ENTRY.keywords ?? []).some((k) => k.includes(lq))
      || matchChronicle(chronEvents(), lq).length) hits.add('chronicle');
    setOpenCats(hits);
  };
  const toggle = (id: string) => setOpenCats((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <DashPage className="wk-page">
      <DashBox title="Kapitel" icon="wiki" rows={2} className="wk-nav" right={q ? `${results.length} Treffer` : `${WIKI_ARTICLES.length + 1} Artikel`}>
        <input className="dselect wiki-search-d" placeholder="Suchen …" value={query} onChange={(e) => onSearch(e.target.value)} />
        <div className="wk-acc">
          {WIKI_CATEGORIES.map((c) => {
            const list = byCat.get(c.id) ?? [];
            if (!list.length) return null;
            const isOpen = openCats.has(c.id);
            return (
              <div key={c.id} className={`wk-cat ${isOpen ? 'open' : ''} ${shownCat === c.id ? 'cur' : ''}`}>
                <button type="button" className="wk-cat-head" aria-expanded={isOpen} onClick={() => toggle(c.id)}>
                  <span className="wk-chev" aria-hidden />
                  <span className="wk-cat-title">{c.title}</span>
                  <span className="wk-cat-n">{list.length}</span>
                </button>
                {isOpen && (
                  <div className="wk-arts">
                    {list.map((a) => (
                      <button type="button" key={a.id} className={`wk-art ${shown?.id === a.id ? 'sel' : ''}`} onClick={() => setOpenId(a.id)}>
                        {a.title}
                        {a.id === CHRONICLE_WIKI_ID && milestoneHits ? <span className="wk-art-sub"> · {milestoneHits} Meilenstein{milestoneHits === 1 ? '' : 'e'}</span> : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {!results.length && <Empty icon="wiki">Keine Treffer.</Empty>}
        </div>
      </DashBox>

      <DashBox title={shown ? shown.title : 'Artikel'} icon={shown?.id === CHRONICLE_WIKI_ID ? 'chronicle' : 'news'} span={2} rows={2}
        className="wk-article" right={shown ? catTitle(shown.category) : undefined}>
        {shown ? (shown.id === CHRONICLE_WIKI_ID
          ? <ChronicleView g={g} embedded query={titleHit ? '' : query} related={(e) => relatedMap.get(e.id) ?? []}
              onArticle={(id) => setOpenId(id)} onOpenModal={onGoto ? () => onGoto('chronicle') : undefined} />
          : <WikiBody key={shown.id} text={localMoneyText(shown.body, _displayYear, { dmYear: 1975 })} />)
          : <Empty icon="wiki">Keine Treffer für „{query}“.</Empty>}
      </DashBox>
    </DashPage>
  );
}

/** Artikel (inkl. Chronik-Zeitleiste) zu einer ID. */
function articleById(id: string | undefined): WikiArticle | null {
  if (!id) return null;
  return id === CHRONICLE_WIKI_ID ? CHRONICLE_WIKI_ENTRY : WIKI_ARTICLES.find((a) => a.id === id) ?? null;
}

/** Extrahiert eine kurze Vorschauzeile aus dem Markdown-Body. */
export function firstLine(body: string): string {
  const line = body.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#') && !l.startsWith('```'));
  return (line ?? '').replace(/[*`|]/g, '').slice(0, 120);
}

/** Satzende am Zeilenende (danach beginnt eine neue Zeile auch einen neuen Absatz). */
const SENTENCE_END = /[.!?]["“”'’)*`]*$/;
const ORDERED = /^(\d+)\.\s+/;

/**
 * Leichtgewichtiger Markdown-Renderer für Wiki-Artikel – für alle Artikel gleich:
 * Fortlaufende Textzeilen bilden einen Absatz (manche Artikel sind hart umbrochen),
 * eine Leerzeile oder ein Satzende (. ! ?) am Zeilenende beginnt einen neuen. Eingerückte Zeilen
 * nach einem Listenpunkt gehören zu diesem Punkt. „- “ = Liste, „1. “ = nummerierte Liste.
 */
export function WikiBody({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: JSX.Element[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; start: number; items: string[] } | null = null;
  let tableRows: string[][] = [];
  let code: string[] = [];
  let inCode = false;
  let key = 0;

  const flushPara = () => {
    if (para.length) { blocks.push(<p key={key++} className="wiki-p">{inline(para.join(' '))}</p>); para = []; }
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((li, i) => <li key={i}>{inline(li)}</li>);
    blocks.push(list.ordered
      ? <ol key={key++} className="wiki-ol" start={list.start}>{items}</ol>
      : <ul key={key++} className="wiki-ul">{items}</ul>);
    list = null;
  };
  const flushTable = () => {
    if (tableRows.length) {
      const [head, ...body] = tableRows;
      blocks.push(
        <div key={key++} className="table-scroll"><table className="wiki-table">
          <thead><tr>{head.map((h, i) => <th key={i}>{inline(h)}</th>)}</tr></thead>
          <tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
        </table></div>,
      );
      tableRows = [];
    }
  };
  const flushAll = () => { flushPara(); flushList(); flushTable(); };
  const addItem = (ordered: boolean, start: number, textOf: string) => {
    flushPara(); flushTable();
    if (list && list.ordered !== ordered) flushList();
    if (!list) list = { ordered, start, items: [] };
    list.items.push(textOf);
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const t = line.trim();
    if (t.startsWith('```')) {
      if (inCode) { blocks.push(<pre key={key++} className="wiki-code">{code.join('\n')}</pre>); code = []; inCode = false; }
      else { flushAll(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(raw); continue; }
    if (!t) { flushAll(); continue; }

    if (line.startsWith('### ')) { flushAll(); blocks.push(<h5 key={key++} className="wiki-h5">{inline(line.slice(4))}</h5>); continue; }
    if (line.startsWith('## ')) { flushAll(); blocks.push(<h4 key={key++} className="wiki-h">{inline(line.slice(3))}</h4>); continue; }
    if (t.startsWith('|')) {
      flushPara(); flushList();
      const cells = t.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // Trennzeile
      tableRows.push(cells);
      continue;
    }
    if (line.startsWith('- ')) { addItem(false, 1, line.slice(2)); continue; }
    const om = ORDERED.exec(line);
    if (om) { addItem(true, Number(om[1]), line.slice(om[0].length)); continue; }
    // Eingerückte Fortsetzung eines Listenpunkts
    if (list && !para.length && /^\s{2,}/.test(line)) { list.items[list.items.length - 1] += ` ${t}`; continue; }
    flushList(); flushTable();
    if (para.length && SENTENCE_END.test(para[para.length - 1])) flushPara();
    para.push(t);
  }
  flushAll();
  if (code.length) blocks.push(<pre key={key++} className="wiki-code">{code.join('\n')}</pre>);

  return <div className="wiki-body">{blocks}</div>;
}

/** Inline-Formatierung: **fett**, *kursiv* (Artikelverweise) und `code`. */
export function inline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|(?<![*\w])\*(?![\s*])[^*]+?(?<!\s)\*(?![*\w]))/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<b key={k++}>{tok.slice(2, -2)}</b>);
    else if (tok.startsWith('*')) parts.push(<i key={k++} className="wiki-ref">{tok.slice(1, -1)}</i>);
    else parts.push(<code key={k++} className="wiki-inline-code">{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
