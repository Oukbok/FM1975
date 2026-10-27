import { WIKI_ARTICLES, WIKI_CATEGORIES, WikiArticle, searchWiki } from '../../data/wiki';
import { Game } from '../../game/state';
import { PageHead } from '../../ui/PageHead';
import { ChronicleView } from '../statistiken/ChronicleView';
import { useState } from 'react';

// =============================================================================
// ENTWICKLER-WIKI (durchsuchbar, Kategorien)
// =============================================================================
/**
 * Synthetischer Wiki-Eintrag, der beim Öffnen die interaktive Chronik-Zeitleiste
 * (ChronicleView) rendert statt Markdown. So ist die „Chronik der Epochen" direkt
 * über die Wiki-Kapitelnavigation erreichbar.
 */
export const CHRONICLE_WIKI_ID = 'chronicle-timeline';

export const CHRONICLE_WIKI_ENTRY: WikiArticle = {
  id: CHRONICLE_WIKI_ID,
  category: 'chronicle',
  title: 'Chronik der Epochen – Historische Zeitleiste',
  keywords: ['chronik', 'epoche', 'epochen', 'zeitleiste', 'meilenstein', 'meilensteine', 'timeline', 'historie', 'geschichte', '3-punkte-regel'],
  body: 'Interaktive Zeitleiste aller historischen Meilensteine von 1975 bis in die 2030er.',
};

export function WikiView({ g }: { g: Game }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  // Passt der Chronik-Eintrag zum aktuellen Suchtext?
  const q = query.trim().toLowerCase();
  const chronMatches = !q
    || CHRONICLE_WIKI_ENTRY.title.toLowerCase().includes(q)
    || (CHRONICLE_WIKI_ENTRY.keywords ?? []).some((k) => k.includes(q));

  let results = searchWiki(query);
  if (cat !== 'all') results = results.filter((a) => a.category === cat);
  // Chronik-Zeitleiste als ersten Eintrag der Chronik-Kategorie einblenden.
  if ((cat === 'all' || cat === 'chronicle') && chronMatches) {
    results = [CHRONICLE_WIKI_ENTRY, ...results];
  }
  const open = openId
    ? (openId === CHRONICLE_WIKI_ID ? CHRONICLE_WIKI_ENTRY : WIKI_ARTICLES.find((a) => a.id === openId) ?? null)
    : null;

  // Kategorien, die tatsächlich Treffer haben (bei aktiver Suche).
  const catsWithHits = new Set(searchWiki(query).map((a) => a.category));
  if (chronMatches) catsWithHits.add('chronicle');

  return (
    <div className="page">
      <PageHead icon="wiki" title={<>Entwickler-Wiki <span className="accent">· Spielmechaniken</span></>} />
      <div className="wiki-layout">
        {/* Sidebar */}
        <aside className="wiki-side card">
          <input
            className="wiki-search"
            placeholder="🔎 Suchen…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpenId(null); }}
          />
          <button className={`wiki-cat ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
            📚 Alle Kategorien
          </button>
          {WIKI_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`wiki-cat ${cat === c.id ? 'active' : ''} ${query && !catsWithHits.has(c.id) ? 'faded' : ''}`}
              onClick={() => setCat(c.id)}
            >
              {c.icon} {c.title}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="wiki-content">
          {open ? (
            <div className="card">
              <button className="btn-sm mb12" onClick={() => setOpenId(null)}>← Zurück zur Liste</button>
              {open.id === CHRONICLE_WIKI_ID ? <ChronicleView g={g} embedded /> : <WikiBody text={open.body} />}
            </div>
          ) : results.length === 0 ? (
            <div className="card dim" style={{ textAlign: 'center', padding: 30 }}>Keine Treffer für „{query}".</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((a) => {
                const c = WIKI_CATEGORIES.find((x) => x.id === a.category);
                return (
                  <div key={a.id} className="card hoverable clickable" onClick={() => setOpenId(a.id)}>
                    <div className="dim2 mini">{c?.icon} {c?.title}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2 }}>{a.title}</div>
                    <div className="dim mini mt8">{firstLine(a.body)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Extrahiert eine kurze Vorschauzeile aus dem Markdown-Body. */
export function firstLine(body: string): string {
  const line = body.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#') && !l.startsWith('```'));
  return (line ?? '').replace(/[*`|]/g, '').slice(0, 120);
}

/** Leichtgewichtiger Markdown-Renderer für Wiki-Artikel. */
export function WikiBody({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  let tableRows: string[][] = [];
  let code: string[] = [];
  let inCode = false;
  let key = 0;

  const flushList = () => {
    if (list.length) {
      blocks.push(<ul key={key++} className="wiki-ul">{list.map((li, i) => <li key={i}>{inline(li)}</li>)}</ul>);
      list = [];
    }
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

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (line.trim().startsWith('```')) {
      if (inCode) { blocks.push(<pre key={key++} className="wiki-code">{code.join('\n')}</pre>); code = []; inCode = false; }
      else { flushList(); flushTable(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(raw); continue; }

    if (line.startsWith('## ')) { flushList(); flushTable(); blocks.push(<h4 key={key++} className="wiki-h">{inline(line.slice(3))}</h4>); continue; }
    if (line.startsWith('### ')) { flushList(); flushTable(); blocks.push(<h5 key={key++} className="wiki-h5">{inline(line.slice(4))}</h5>); continue; }
    if (line.startsWith('- ')) { flushTable(); list.push(line.slice(2)); continue; }
    if (line.trim().startsWith('|')) {
      flushList();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // Trennzeile
      tableRows.push(cells);
      continue;
    }
    flushList(); flushTable();
    if (line.trim()) blocks.push(<p key={key++} className="wiki-p">{inline(line)}</p>);
  }
  flushList(); flushTable();
  if (code.length) blocks.push(<pre key={key++} className="wiki-code">{code.join('\n')}</pre>);

  return <div className="wiki-body">{blocks}</div>;
}

/** Inline-Formatierung: **fett** und `code`. */
export function inline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<b key={k++}>{tok.slice(2, -2)}</b>);
    else parts.push(<code key={k++} className="wiki-inline-code">{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
