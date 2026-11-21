import { ReactNode } from 'react';
import Icon, { type IconName } from '../../components/Icon';
import { TIMELINE, TIMELINE_TYPE_META, seasonStartYear } from '../../data/timeline';
import { Game } from '../../game/state';

// =============================================================================
// CHRONIK — Epochen & Meilensteine des deutschen Fußballs (1975 → 2030er)
// Gemeinsame Bausteine für das große Fenster (ChronicleModal.tsx, Footer rechts)
// und das Wiki-Kapitel „Chronik der Epochen“ (views/wiki/WikiView.tsx): Zeitleiste
// nach Jahrzehnten mit „Heute“-Markierung, Suche über Titel/Text/Saison, je
// Meilenstein Verweise auf passende Wiki-Artikel.
// =============================================================================
export type TlType = keyof typeof TIMELINE_TYPE_META;
export type ChronState = 'past' | 'current' | 'future';
export const CHRON_TYPE_ICON: Record<string, IconName> = {
  rule: 'matchball', competition: 'trophy', law: 'contracts', tech: 'presse', finance: 'finances', reform: 'stats',
};
export type TlEvent = (typeof TIMELINE)[number];

/** ID des Wiki-Kapitels mit der Zeitleiste (synthetischer Artikel in WikiView). */
export const CHRONICLE_WIKI_ID = 'chronicle-timeline';

export const decadeOf = (e: TlEvent) => Math.floor(seasonStartYear(e.season) / 10) * 10;
const STATE_LABEL: Record<ChronState, string> = { past: 'Erreicht', current: 'Aktuell', future: 'Bevorstehend' };

export const chronEvents = (): TlEvent[] => [...TIMELINE].sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season));

export function chronStateOf(g: Game): (e: TlEvent) => ChronState {
  const curYear = seasonStartYear(g.season);
  const fired = new Set(g.firedMilestones);
  return (e) => {
    const y = seasonStartYear(e.season);
    return y === curYear ? 'current' : fired.has(e.id) || y < curYear ? 'past' : 'future';
  };
}

/** Meilensteine, die zum Suchtext passen (Titel, Beschreibung, Saison, Jahr, Bereich). */
export function matchChronicle(events: TlEvent[], query: string): TlEvent[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return events;
  return events.filter((e) => `${e.title} ${e.description} ${e.season} ${e.year} ${TIMELINE_TYPE_META[e.type].label}`.toLowerCase().includes(needle));
}

/** Eine Zeile der Zeitleiste; `extra` = z. B. Wiki-Verweise unter dem Text. */
export function ChronRow({ e, state, extra }: { e: TlEvent; state: ChronState; extra?: ReactNode }) {
  return (
    <div className={`chm-row ${state}`} data-season={e.season}>
      <div className="chm-when">
        <span className="chm-year">{e.year}</span>
        <span className="chm-season">{e.season}</span>
      </div>
      <div className="chm-text">
        <div className="chm-title">{e.title}{e.fictional && <span className="chm-fict">fiktive Zukunft</span>}</div>
        <div className="chm-desc">{e.description}</div>
        {extra}
      </div>
      <div className="chm-meta">
        <span className="chm-type"><Icon name={CHRON_TYPE_ICON[e.type] ?? 'chronicle'} size={13} />{TIMELINE_TYPE_META[e.type].label}</span>
        <span className={`chm-state ${state}`}>{STATE_LABEL[state]}</span>
      </div>
    </div>
  );
}

/** Zeitleiste nach Jahrzehnten mit „Heute“-Markierung (gemeinsam für Fenster und Wiki). */
export function ChronTimeline({ g, shown, extraOf }: { g: Game; shown: TlEvent[]; extraOf?: (e: TlEvent) => ReactNode }) {
  const curYear = seasonStartYear(g.season);
  const stateOf = chronStateOf(g);
  const decades = [...new Set(shown.map(decadeOf))];
  // „Heute“ vor dem ersten Eintrag, der nicht vor der aktuellen Saison liegt.
  const nowIdx = shown.findIndex((e) => seasonStartYear(e.season) >= curYear);
  const nowLine = <div className="chm-now" key="now"><span className="chm-now-lbl">Heute · Saison {g.season}</span></div>;
  return (
    <>
      {decades.map((d) => (
        <section key={d} data-dec={d} className="chm-sec">
          <div className="chm-dechead">{d}er</div>
          {shown.filter((e) => decadeOf(e) === d).flatMap((e) => {
            const rows = [<ChronRow key={e.id} e={e} state={stateOf(e)} extra={extraOf?.(e)} />];
            if (shown[nowIdx] === e) rows.unshift(nowLine);
            return rows;
          })}
        </section>
      ))}
      {shown.length > 0 && nowIdx < 0 && nowLine}
    </>
  );
}

/**
 * Wiki-Kapitel „Chronik der Epochen“: gefilterte Zeitleiste (Wiki-Suche wirkt mit), Knopf zum
 * großen Fenster, Verweise auf passende Artikel (`related`, aus WikiView berechnet).
 */
export function ChronicleView({ g, query = '', related, onArticle, onOpenModal }: {
  g: Game; query?: string; embedded?: boolean;
  related?: (e: TlEvent) => { id: string; title: string }[];
  onArticle?: (id: string) => void; onOpenModal?: () => void;
}) {
  const all = chronEvents();
  const shown = matchChronicle(all, query);
  const stateOf = chronStateOf(g);
  const passed = all.filter((e) => stateOf(e) !== 'future').length;
  return (
    <div className="chw">
      <div className="chw-head">
        <span className="dnote">
          {query.trim() ? `${shown.length} von ${all.length} Meilensteinen passen zu „${query.trim()}“.` : `${all.length} Meilensteine von 1975 bis in die 2030er · ${passed} erreicht. Jeder wird zu Beginn seiner Saison wirksam.`}
        </span>
        {onOpenModal && <button className="dchip" onClick={onOpenModal}>Große Chronik öffnen</button>}
      </div>
      {!shown.length && <div className="dnote chm-empty">Kein Meilenstein passt zur Suche.</div>}
      <ChronTimeline g={g} shown={shown} extraOf={related && onArticle ? (e) => {
        const rel = related(e);
        return rel.length ? (
          <div className="chw-rel">
            <span className="chw-rel-lbl">Im Wiki:</span>
            {rel.map((a) => <button key={a.id} className="chw-link" onClick={() => onArticle(a.id)}>{a.title}</button>)}
          </div>
        ) : null;
      } : undefined} />
    </div>
  );
}
