// =============================================================================
// VEREINSGELÄNDE — Nachbargrundstücke in der Seitenleiste (Karte und Regeln:
// engine/groundsPlots.ts): Detailansicht „Grundstück“ (Art, Größe, Preis, Kauf;
// bei eigenem Land die Liste „Hier kannst du bauen“) und die kompakte Liste der
// kaufbaren Grundstücke für Übersicht und „Kein Platz mehr“.
// =============================================================================
import { useState } from 'react';
import { Game } from '../../../game/state';
import { Club } from '../../../types';
import { ClubGrounds, GroundsModuleKey } from '../../../types/grounds';
import { GROUNDS_BY_KEY } from '../../../data/groundsCatalog';
import { PLOT_KINDS, buildableOn, isOwned, plotPrice, plotsForSale, plotsOf, siteOf } from '../../../engine/groundsPlots';
import { areaUsed, levelOf } from '../../../engine/grounds';
import { formatMoney } from '../../../engine/economy';
import { buyGroundsPlot, startGroundsBuild } from '../../../game/groundsGame';
import { KV } from '../../../ui/DashPage';
import { InfoTip } from '../../../ui/InfoTip';
import { PlotKey, plotKey } from './PlotLayer';

const parz = (n: number) => `${n} Parzelle${n === 1 ? '' : 'n'}`;
const fac = (f: number) => f.toString().replace('.', ',');

interface ListProps {
  g: Game; club: Club; gr: ClubGrounds; year: number;
  /** Höchstens so viele Zeilen (günstigste zuerst). */
  limit?: number;
  /** Hinweiszeile darüber („Kein Platz mehr …“). */
  hint?: boolean;
  onSelect?: (k: PlotKey) => void;
  onDone: (text: string, ok: boolean) => void;
}

/** Kaufbare Grundstücke mit Preis und Kauf-Knopf (ersetzt den alten Knopf „Grundstück kaufen“). */
export function PlotList({ g, club, gr, year, limit, hint, onSelect, onDone }: ListProps) {
  const all = plotsForSale(club, gr, year);
  const list = limit ? all.slice(0, limit) : all;
  if (!all.length) return <div className="dnote">Rund um das Gelände ist kein Grundstück mehr zu haben – Platz schaffst du nur durch Abriss.</div>;
  return (
    <div className="gpl">
      {hint && <div className="dnote">Kein Platz mehr – kaufe ein Nachbargrundstück im Gelände:</div>}
      {list.map((p) => {
        const price = plotPrice(gr, p, year);
        return (
          <div key={p.id} className="gpl-row" data-plot={p.id}>
            <button className="gpl-name" onClick={() => onSelect?.(plotKey(p.id))} disabled={!onSelect}>
              {PLOT_KINDS[p.kind].name}<small>{parz(p.size)} · {p.where}</small>
            </button>
            <span className="gpl-price">{formatMoney(price, year, true)}</span>
            <button className="btn btn-sm" data-act="plot-buy" disabled={club.finances.balance < price}
              onClick={() => { const r = buyGroundsPlot(g, p.id); onDone(r.text, r.ok); }}>Kaufen</button>
          </div>
        );
      })}
      {limit != null && all.length > list.length && <div className="dnote">Weitere {all.length - list.length} Grundstücke findest du im Gelände und unter „Lage &amp; Wirkung“.</div>}
    </div>
  );
}

interface DetailProps { g: Game; club: Club; gr: ClubGrounds; year: number; id: string; onChange: () => void; onClose: () => void; onSelect: (k: GroundsModuleKey) => void }

export function PlotDetail({ g, club, gr, year, id, onChange, onClose, onSelect }: DetailProps) {
  const [note, setNote] = useState<string | null>(null);
  const p = plotsOf(club, gr).find((x) => x.id === id);
  if (!p) return null;
  const kind = PLOT_KINDS[p.kind];
  const own = isOwned(gr, id);
  const site = siteOf(gr, id);
  const price = plotPrice(gr, p, year);
  const free = gr.area - areaUsed(club, gr);
  const act = (r: { ok: boolean; text: string }) => { setNote(r.text); if (r.ok) onChange(); };
  const options = own && !site ? buildableOn(club, gr, id, year) : [];
  return (
    <div className="gd">
      <div className="gd-head">
        <span className="gd-cat">{own ? 'Eigenes Grundstück' : 'Nachbargrundstück'}</span>
        <button className="gd-back" onClick={onClose}>Übersicht</button>
      </div>
      {!own && <>
        <div className="dnote">{kind.desc}</div>
        <KV k="Art" v={kind.name} strong />
        <KV k="Größe" v={parz(p.size)} info="flaeche" />
        <KV k="Lage" v={p.where} />
        <KV k="Preis" v={formatMoney(price, year, true)} strong />
        <div className="dnote">{kind.factor > 1 ? `Bebautes Land: das ${fac(kind.factor)}-Fache von Brachland gleicher Größe. ` : 'Brachland ist das günstigste Land. '}Jeder Kauf macht die übrigen Grundstücke etwas teurer.</div>
        <KV k="Fläche danach" v={`${gr.area + p.size} Parzellen (frei ${free + p.size})`} />
        <button className="btn btn-primary mt8" data-act="plot-buy" disabled={club.finances.balance < price} onClick={() => act(buyGroundsPlot(g, id))}>Grundstück kaufen</button>
        {club.finances.balance < price && <div className="dnote" style={{ color: 'var(--red)' }}>Kontostand zu niedrig</div>}
        <div className="dnote">Nach dem Kauf wird das Grundstück geräumt und ist Bauland: Du kannst darauf bauen, was auf {parz(p.size)} passt.</div>
      </>}
      {own && <>
        <div className="dnote">{site ? 'Dieses Grundstück gehört dem Verein und ist bebaut.' : 'Dieses Grundstück gehört dem Verein. Es ist geräumt und planiert – Bauland.'}</div>
        <KV k="Größe" v={parz(p.size)} info="flaeche" />
        <KV k="Lage" v={p.where} />
        <KV k="Fläche gesamt" v={`${areaUsed(club, gr)} / ${gr.area} belegt`} color={free <= 0 ? 'var(--orange)' : undefined} />
        {site && <>
          <KV k="Bebaut mit" v={levelOf(gr, site) ? GROUNDS_BY_KEY[site].levels[levelOf(gr, site) - 1].name : `${GROUNDS_BY_KEY[site].name} (im Bau)`} strong />
          <button className="btn btn-primary mt8" onClick={() => onSelect(site)}>Details öffnen</button>
        </>}
        {!site && <>
          <div className="gp-sec">Hier kannst du bauen<InfoTip k="bauland" /></div>
          {options.length === 0 && <div className="dnote">Zurzeit passt kein Vorhaben auf dieses Grundstück – größere Anlagen brauchen ein größeres Stück, manche Bauten gibt es erst in späteren Jahren.</div>}
          {options.map((o) => {
            const m = GROUNDS_BY_KEY[o.key];
            return (
              <div key={o.key} className="gpl-row" data-site={o.key}>
                <button className="gpl-name" onClick={() => onSelect(o.key)}>
                  {o.check.def!.name}<small>{m.name} · Fläche {o.area}{o.check.areaNeed !== o.area ? ` (neu +${o.check.areaNeed})` : ''}{!o.check.ok ? ` · ${o.check.reason}` : ''}</small>
                </button>
                <span className="gpl-price">{o.check.cost ? formatMoney(o.check.cost, year, true) : 'frei'}</span>
                <button className="btn btn-sm" data-act="plot-build" disabled={!o.check.ok} onClick={() => act(startGroundsBuild(g, o.key, id))}>{o.upgrade ? 'Ausbauen' : 'Bauen'}</button>
              </div>
            );
          })}
          <div className="dnote">Gebaut wird auf dem üblichen Weg (Kosten, Genehmigung, Bauzeit). Das Gebäude steht danach hier statt an seinem festen Platz. Es zählt weiter nur die Gesamtfläche.</div>
        </>}
      </>}
      {note && <div className="dnote mt8" style={{ color: 'var(--accent)', fontWeight: 700 }}>{note}</div>}
    </div>
  );
}
